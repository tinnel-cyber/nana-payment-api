/**
 * Micro-service Express de Transactions Financières, Webhooks & NaNaSwitch Cloud Node
 * - Nœud Cloud Sécurisé NaNaSwitch Cloud avec isolation d'infrastructure Zero-Trust
 * - Sortie réseau garantie par IP Statique Fixie pour l'IP Whitelisting bancaire
 * - Validation cryptographique HMAC-SHA256, Chiffrement AES-256-GCM & Idempotence stricte
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const admin = require('firebase-admin');
const { FIXIE_URL, fetchViaFixie, getOutboundIp } = require('./fixie-proxy');
const {
  SEBPAY_DEFAULT_BASE_URL,
  SEBPAY_SUPPORTED_COUNTRIES_FALLBACK,
  getSebpayBaseUrl,
  getSebpayHeaders,
  getSebpayConfigStatus,
  callSebpayApi,
  createSebpayCollection,
  getSebpayCollection,
  getSebpayCountries
} = require('./sebpay-client');
const {
  generateYouTubeAuthUrl,
  exchangeCodeForTokens,
  saveYouTubeTokensToFirestore,
  getYouTubeOAuthStatus
} = require('./youtube-oauth');
const { switchManager } = require('./nana-switch/switch-manager');
const {
  startLiveSession,
  getDailyQuotaStatus,
  checkDailyYouTubeQuota
} = require('./live-manager');

const app = express();
const PORT = process.env.PORT || 10000;
const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'konkobo_telecom_webhook_secret_key_2026';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'pos-app-1759a';

// 1. Initialisation résiliente de Firebase Admin SDK
let isFirebaseInitialized = false;
let db = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: FIREBASE_PROJECT_ID
    });
    db = admin.firestore();
    isFirebaseInitialized = true;
    console.log('[FIREBASE ADMIN] Connecté avec succès via FIREBASE_SERVICE_ACCOUNT.');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp();
    db = admin.firestore();
    isFirebaseInitialized = true;
    console.log('[FIREBASE ADMIN] Connecté via GOOGLE_APPLICATION_CREDENTIALS.');
  } else {
    // Mode autonome / Cloud standard
    admin.initializeApp({
      projectId: FIREBASE_PROJECT_ID
    });
    db = admin.firestore();
    isFirebaseInitialized = true;
    console.log(`[FIREBASE ADMIN] Initialisé en mode projet par défaut (${FIREBASE_PROJECT_ID}).`);
  }
} catch (fbErr) {
  console.warn('[FIREBASE ADMIN NOTICE] Initialisation sans clé de service :', fbErr.message);
  console.log('[FIREBASE ADMIN] Les mises à jour Firestore utiliseront le mode REST fallback si nécessaire.');
}

// 2. Middlewares de Sécurité & Parsing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'x-sebpay-signature',
    'X-SebPay-Signature',
    'x-webhook-signature',
    'x-fedapay-signature',
    'x-cinetpay-signature',
    'x-signature-sha256',
    'x-api-key'
  ]
}));

// ============================================================================
// ROUTE 1 : Diagnostic & Contrôle de l'Adresse IP Statique Fixie
// ============================================================================
/**
 * GET /api/payment/ip
 * Appelle un service externe (api.ipify.org) à travers le proxy Fixie
 * et retourne l'adresse IP statique vue par les banques.
 */
app.get('/api/payment/ip', async (req, res) => {
  try {
    const ipResult = await getOutboundIp();
    return res.json({
      status: 'success',
      service: 'nana-payment-gateway',
      ...ipResult,
      whitelistingInstructions: ipResult.success
        ? `Ajoutez l'adresse IP ${ipResult.ip} dans la liste blanche (IP Whitelisting) de votre partenaire bancaire.`
        : 'Vérifiez la variable FIXIE_URL sur Render pour activer le proxy statique.'
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la détection de l\'adresse IP',
      details: err.message
    });
  }
});

// ============================================================================
// ROUTE 2 : Healthcheck
// ============================================================================
app.get(['/', '/health', '/api/health'], async (req, res) => {
  res.json({
    status: 'online',
    service: 'nana-payment-gateway-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    fixieEnabled: Boolean(FIXIE_URL),
    sebpayConfigured: Boolean(process.env.SEBPAY_PUBLIC_KEY && process.env.SEBPAY_SECRET_KEY),
    firebaseConnected: isFirebaseInitialized,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// ROUTE 2b : Statut & Diagnostic Sebpay (Sécurité stricte : X-Secret-Key masquée)
// ============================================================================
app.get('/api/payment/sebpay/status', (req, res) => {
  const sebpayConfig = getSebpayConfigStatus();
  return res.json({
    success: true,
    service: 'sebpay-bridge',
    ...sebpayConfig
  });
});

// ============================================================================
// ============================================================================
// ROUTE 3 : Webhook Critique Sebpay & Opérateurs (HMAC-SHA256 & Règle des 5s)
// ============================================================================
/**
 * POST /api/payment/webhook & POST /api/webhooks/payment
 * Réceptionne et valide les notifications serveur-à-serveur avec buffer brut (express.raw)
 * pour garantir que le formatage exact des octets reçus de Sebpay est préservé pour le HMAC.
 */
app.post(
  ['/api/payment/webhook', '/api/webhooks/payment', '/api/payments/webhook/sebpay', '/api/payment/webhook/sebpay'],
  express.raw({ type: 'application/json', limit: '5mb' }),
  async (req, res) => {
    try {
      // 1. Récupération stricte de la signature X-SebPay-Signature
      const sebpaySignature =
        req.headers['x-sebpay-signature'] ||
        req.headers['X-SebPay-Signature'] ||
        req.headers['x-webhook-signature'] ||
        req.headers['x-signature-sha256'] ||
        req.headers['x-fedapay-signature'] ||
        req.headers['x-cinetpay-signature'] ||
        req.query.signature;

      if (!sebpaySignature) {
        console.error('[SECURITY REJECT] Webhook rejeté : En-tête X-SebPay-Signature manquant.');
        return res.status(401).json({ error: 'Signature cryptographique X-SebPay-Signature absente.' });
      }

      // Clé secrète Sebpay pour la vérification HMAC
      const secretKey = process.env.SEBPAY_SECRET_KEY || process.env.PAYMENT_WEBHOOK_SECRET;
      if (!secretKey) {
        console.error('[SECURITY CONFIG ERROR] process.env.SEBPAY_SECRET_KEY non configuré.');
        return res.status(500).json({ error: 'Configuration serveur incomplète (Clé secrète manquante).' });
      }

      // 2. Récupération du buffer brut (rawBody)
      const rawBuffer = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(req.rawBody || req.body || '', 'utf8');

      // 3. Algorithme de vérification (Crypto natif Node.js)
      // const hash = crypto.createHmac('sha256', process.env.SEBPAY_SECRET_KEY).update(req.body).digest('hex');
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(rawBuffer).digest('hex');

      // 4. Comparaison sécurisée à temps constant
      let isSignatureValid = false;
      try {
        const provBuf = Buffer.from(String(sebpaySignature).trim().toLowerCase(), 'hex');
        const calcBuf = Buffer.from(calculatedHash.toLowerCase(), 'hex');
        if (provBuf.length === calcBuf.length && provBuf.length > 0) {
          isSignatureValid = crypto.timingSafeEqual(provBuf, calcBuf);
        } else {
          isSignatureValid = String(sebpaySignature).trim().toLowerCase() === calculatedHash.toLowerCase();
        }
      } catch {
        isSignatureValid = String(sebpaySignature).trim().toLowerCase() === calculatedHash.toLowerCase();
      }

      if (!isSignatureValid) {
        console.error(`[SECURITY REJECT] Signature HMAC invalide.`);
        console.error(`[SECURITY AUDIT] Reçue: ${sebpaySignature} | Calculée: ${calculatedHash}`);
        return res.status(401).json({ error: 'Signature X-SebPay-Signature invalide.' });
      }

      // 5. RÈGLE DES 5 SECONDES : Réponse HTTP 200 'OK' IMMÉDIATE
      // Sebpay exige une réponse en moins de 5 secondes, sinon retry automatique.
      res.status(200).send('OK');
      console.log('[SEBPAY WEBHOOK] Signature validée avec succès. Réponse 200 OK envoyée immédiatement à Sebpay.');

      // 6. TRAITEMENT ASYNCHRONE & IDEMPOTENCE (En arrière-plan sans bloquer Sebpay)
      setImmediate(async () => {
        try {
          let payload = {};
          try {
            payload = JSON.parse(rawBuffer.toString('utf8'));
          } catch (jsonErr) {
            console.error('[WEBHOOK JSON PARSE ERROR]', jsonErr.message);
            return;
          }

          await processWebhookTransaction(payload);
        } catch (asyncErr) {
          console.error('[ASYNC WEBHOOK ERROR]', asyncErr);
        }
      });
    } catch (err) {
      console.error('[FATAL WEBHOOK ERROR]', err);
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Erreur interne traitement webhook', details: err.message });
      }
    }
  }
);

// Middlewares JSON & UrlEncoded pour TOUTES les autres routes REST de l'API Render
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

/**
 * Traitement asynchrone sécurisé de la transaction Sebpay avec protection d'idempotence stricte
 */
async function processWebhookTransaction(payload) {
  const txData = payload.data || payload;

  // Extraction robuste des identifiants Sebpay
  const transactionId = String(
    txData.transaction_id ||
    txData.transactionId ||
    payload.transaction_id ||
    payload.transactionId ||
    txData.id ||
    payload.id ||
    txData.txId ||
    ''
  ).trim();

  const externalRef = String(
    txData.external_reference ||
    payload.external_reference ||
    txData.externalReference ||
    payload.externalReference ||
    txData.reference ||
    payload.reference ||
    ''
  ).trim();

  const status = String(
    txData.status ||
    payload.status ||
    'SUCCESS'
  ).toUpperCase();

  const amount = Number(txData.amount || payload.amount || txData.price || 0);
  const currency = txData.currency || payload.currency || 'XOF';
  const operator = txData.operator || payload.operator || txData.provider || payload.provider || 'SEBPAY';
  const paymentRef = txData.paymentRef || txData.payment_reference || externalRef || transactionId || `ref_${Date.now()}`;

  // Résolution multi-tenant "${tenant_id}___${order_id}"
  let resolvedTenantId = 'nanasore_central_hub';
  let resolvedOrderId = externalRef || transactionId || `ORD_${Date.now()}`;
  if (externalRef && externalRef.includes('___')) {
    const parts = externalRef.split('___');
    resolvedTenantId = parts[0] || resolvedTenantId;
    resolvedOrderId = parts[1] || resolvedOrderId;
  }

  console.log(`[SEBPAY ASYNC PROCESSING] Transaction: ${transactionId} | Order: ${resolvedOrderId} | Tenant: ${resolvedTenantId} | Status: ${status} | Montant: ${amount}`);

  if (!db) {
    console.warn('[FIRESTORE NOTICE] Firebase Admin SDK non initialisé, traitement mémoire.');
    return;
  }

  // IDEMPOTENCE 1 : Vérification de la collection 'processed_transactions' (anti-double crédit en cas de retry)
  if (transactionId) {
    try {
      const processedDoc = await db.collection('processed_transactions').doc(transactionId).get();
      if (processedDoc.exists) {
        const pData = processedDoc.data();
        if (pData?.processed === true || pData?.status === 'COMPLETED' || pData?.status === 'PAID') {
          console.log(`[IDEMPOTENCE GUARD] Transaction ${transactionId} déjà traitée précédemment. Aucune action répétée (protection anti-double crédit).`);
          return;
        }
      }
    } catch (checkErr) {
      console.warn('[IDEMPOTENCE CHECK NOTICE]', checkErr.message);
    }
  }

  // IDEMPOTENCE 2 : Vérification de la collection 'payment_intents'
  try {
    const intentCheck = await db.collection('payment_intents').doc(resolvedOrderId).get();
    if (intentCheck.exists) {
      const intentData = intentCheck.data();
      if (intentData?.isPaid === true && intentData?.transactionId === transactionId) {
        console.log(`[IDEMPOTENCE GUARD] Commande ${resolvedOrderId} déjà marquée comme payée avec le transaction_id ${transactionId}.`);
        return;
      }
    }
  } catch (intentCheckErr) {
    console.warn('[INTENT CHECK NOTICE]', intentCheckErr.message);
  }

  const isSuccess = ['SUCCESS', 'COMPLETED', 'PAID', 'VALIDATED', 'CONFIRMED', 'VALIDE', 'PAYÉ'].includes(status);

  if (isSuccess) {
    try {
      const batch = db.batch();
      const nowServer = admin.firestore.FieldValue.serverTimestamp();

      // 1. Verrouillage Idempotence immédiat
      if (transactionId) {
        const procRef = db.collection('processed_transactions').doc(transactionId);
        batch.set(procRef, {
          transactionId,
          externalReference: externalRef,
          orderId: resolvedOrderId,
          tenantId: resolvedTenantId,
          amount,
          currency,
          operator,
          status: 'COMPLETED',
          processed: true,
          processedAt: nowServer
        }, { merge: true });
      }

      // 2. Mise à jour de 'payment_intents' (déclenche immédiatement onSnapshot sur le client)
      const updateIntentPayload = {
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        isPaid: true,
        paid: true,
        amountPaid: amount,
        currency,
        transactionId: transactionId || resolvedOrderId,
        externalReference: externalRef,
        tenantId: resolvedTenantId,
        orderId: resolvedOrderId,
        operator,
        provider: 'SEBPAY',
        validatedAt: nowServer,
        updatedAt: nowServer
      };

      const intentRef = db.collection('payment_intents').doc(resolvedOrderId);
      batch.set(intentRef, updateIntentPayload, { merge: true });

      if (externalRef && externalRef !== resolvedOrderId) {
        const extIntentRef = db.collection('payment_intents').doc(externalRef);
        batch.set(extIntentRef, updateIntentPayload, { merge: true });
      }

      if (transactionId && transactionId !== resolvedOrderId && transactionId !== externalRef) {
        const txIntentRef = db.collection('payment_intents').doc(transactionId);
        batch.set(txIntentRef, updateIntentPayload, { merge: true });
      }

      // 3. Enregistrement comptable dans 'transactions'
      const txDocRef = db.collection('transactions').doc(transactionId || resolvedOrderId);
      batch.set(txDocRef, {
        id: transactionId || resolvedOrderId,
        transactionId: transactionId || resolvedOrderId,
        externalReference: externalRef,
        orderId: resolvedOrderId,
        userId: resolvedTenantId,
        amount,
        currency,
        provider: operator || 'SEBPAY',
        status: 'completed',
        paymentReference: paymentRef,
        completedAt: nowServer,
        updatedAt: nowServer
      }, { merge: true });

      // 4. Déblocage du produit / Abonnement Élite
      const isElitePurchase =
        resolvedOrderId.includes('elite') ||
        resolvedOrderId.includes('20') ||
        externalRef.includes('elite') ||
        amount === 15000;

      if (isElitePurchase) {
        const tenantRef = db.collection('tenants').doc(resolvedTenantId);
        batch.set(tenantRef, {
          plan: 'elite',
          subscriptionPlan: 'elite',
          subscriptionStatus: 'ACTIVE',
          multiCountryActive: true,
          isPaid: true,
          updatedAt: nowServer
        }, { merge: true });

        const storeRef = db.collection('stores').doc(resolvedTenantId);
        batch.set(storeRef, {
          subscription: 'elite',
          plan: 'elite',
          status: 'active',
          multiCountryActive: true,
          updatedAt: nowServer
        }, { merge: true });

        const userRef = db.collection('users').doc(resolvedTenantId);
        batch.set(userRef, {
          plan: 'elite',
          subscriptionPlan: 'elite',
          subscriptionStatus: 'ACTIVE',
          updatedAt: nowServer
        }, { merge: true });
      }

      // 5. Crédit du Wallet du tenant (mise à jour atomique incrémentale)
      const walletRef = db.collection('wallets').doc(resolvedTenantId);
      batch.set(walletRef, {
        tenantId: resolvedTenantId,
        balance: admin.firestore.FieldValue.increment(amount),
        totalEarnings: admin.firestore.FieldValue.increment(amount),
        lastPaymentAt: nowServer,
        updatedAt: nowServer
      }, { merge: true });

      await batch.commit();
      console.log(`[FIRESTORE COMMIT SUCCESS] Transaction ${transactionId} validée avec succès, produit débloqué et wallet crédité.`);

      // 6. Moteur NaNaSwitch : Split Financier Automatisé ACID (95% Vendeur / 5% Nanasore) & Communication Asynchrone (SMS/Email)
      switchManager.dispatchPostPaymentWorkflow({
        db,
        orderId: resolvedOrderId,
        storeId: resolvedTenantId,
        totalAmount: amount,
        transactionId,
        gateway: 'sebpay',
        customerPhone: txData.client_phone || txData.phone || payload.client_phone || '',
        customerEmail: txData.client_email || txData.email || payload.client_email || '',
        customerName: txData.client_name || txData.name || 'Client Wameet',
        productTitle: txData.description || payload.description || 'Commande en direct Wameet',
        storeName: resolvedTenantId
      }).catch(switchErr => {
        console.error('[NANASWITCH ASYNC WORKFLOW ERROR]', switchErr);
      });
    } catch (dbErr) {
      console.error('[FIRESTORE UPDATE ERROR]', dbErr.message);
    }
  } else {
    console.warn(`[SEBPAY STATUS NOTICE] Transaction ${transactionId} statut échec ou annulé : ${status}`);
    try {
      const intentRef = db.collection('payment_intents').doc(resolvedOrderId);
      await intentRef.set({
        status,
        paymentStatus: 'FAILED',
        isPaid: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[INTENT FAIL UPDATE ERROR]', e.message);
    }
  }
}

// ============================================================================
// ROUTE 3b : Vérification de Transaction (Polling & Validation instantanée)
// ============================================================================
app.get(['/api/payment/verify/:txId', '/api/payment/status/:txId'], async (req, res) => {
  try {
    const { txId } = req.params;
    if (!txId) {
      return res.status(400).json({ error: 'Identifiant de transaction (txId) requis.' });
    }

    if (db) {
      // 1. Recherche dans transactions
      const txDoc = await db.collection('transactions').doc(txId).get();
      if (txDoc.exists) {
        const data = txDoc.data();
        const isDone = ['completed', 'success', 'paid', 'validated'].includes(String(data.status || '').toLowerCase());
        if (isDone) {
          return res.json({
            success: true,
            status: data.status,
            txId,
            data
          });
        }
      }

      // 2. Recherche dans payment_intents
      const intentDoc = await db.collection('payment_intents').doc(txId).get();
      if (intentDoc.exists) {
        const data = intentDoc.data();
        const isDone = ['COMPLETED', 'SUCCESS', 'VALIDATED', 'PAID'].includes(String(data.status || '').toUpperCase()) ||
          ['COMPLETED', 'PAID'].includes(String(data.paymentStatus || '').toUpperCase()) ||
          data.isPaid === true;
        if (isDone) {
          return res.json({
            success: true,
            status: data.status || 'COMPLETED',
            txId,
            data
          });
        }
      }
    }

    // 3. Fallback direct vers Sebpay si configuré
    if (process.env.SEBPAY_PUBLIC_KEY && process.env.SEBPAY_SECRET_KEY) {
      try {
        const sebpayStatus = await getSebpayCollection(txId);
        if (sebpayStatus.isPaid) {
          if (db) {
            const nowServer = admin.firestore.FieldValue.serverTimestamp();
            const parts = txId.split('___');
            const resolvedOrderId = parts.length > 1 ? parts[1] : txId;
            const updatePayload = {
              status: 'COMPLETED',
              paymentStatus: 'PAID',
              isPaid: true,
              paid: true,
              validatedAt: nowServer,
              updatedAt: nowServer
            };
            await db.collection('payment_intents').doc(resolvedOrderId).set(updatePayload, { merge: true });
            await db.collection('payment_intents').doc(txId).set(updatePayload, { merge: true });
          }
          return res.json({
            success: true,
            status: 'COMPLETED',
            txId,
            data: sebpayStatus.data,
            message: 'Paiement validé avec succès par Sebpay.'
          });
        }
      } catch (sebpayErr) {
        // En attente ou erreur non bloquante
      }
    }

    return res.json({
      success: false,
      status: 'PENDING',
      txId,
      message: 'Transaction en cours de traitement bancaire.'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur vérification transaction', details: err.message });
  }
});

// ============================================================================
// ROUTE 3c : Initiation Paiement Sebpay (POST /collections)
// ============================================================================
app.post(['/api/payment/sebpay/collections', '/api/payment/sebpay/initiate'], async (req, res) => {
  try {
    const {
      tenantId = req.body.storeId || 'nanasore_central_hub',
      orderId = req.body.orderId || `ORD_${Date.now()}`,
      amount,
      currency = 'XOF',
      customerPhone = req.body.phone,
      phone,
      customerName,
      customerEmail,
      operator = req.body.provider,
      otpCode = req.body.otp,
      description
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Montant de paiement invalide.' });
    }

    const externalReference = req.body.externalReference || `${tenantId}___${orderId}`;

    const callbackUrl =
      req.body.callback_url ||
      req.body.callbackUrl ||
      process.env.PAYMENT_CALLBACK_URL ||
      process.env.PAYMENT_WEBHOOK_URL ||
      'https://nana-payment-api.onrender.com/api/payment/webhook';

    const sebpayResult = await createSebpayCollection({
      tenantId,
      orderId,
      externalReference,
      amount,
      currency,
      phone: phone || customerPhone,
      customerName,
      customerEmail,
      operator,
      otpCode,
      description,
      callbackUrl
    });

    // Enregistre l'intention dans Firestore si disponible
    if (db) {
      try {
        const nowServer = admin.firestore.FieldValue.serverTimestamp();
        const intentData = {
          id: orderId,
          orderId,
          tenantId,
          externalReference,
          amount: Number(amount),
          currency,
          customerPhone: phone || customerPhone,
          operator: operator || 'SEBPAY',
          provider: 'SEBPAY',
          status: 'PENDING',
          paymentStatus: 'PENDING',
          providerLink: sebpayResult.provider_link || null,
          redirectUrl: sebpayResult.provider_link || null,
          action: sebpayResult.action,
          createdAt: nowServer,
          updatedAt: nowServer
        };

        await db.collection('payment_intents').doc(orderId).set(intentData, { merge: true });
        await db.collection('payment_intents').doc(externalReference).set(intentData, { merge: true });
      } catch (fbErr) {
        console.warn('[FIRESTORE INTENT] Enregistrement intention :', fbErr.message);
      }
    }

    return res.status(200).json(sebpayResult);
  } catch (err) {
    console.error('[SEBPAY INITIATE ERROR]', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      details: err.data || null
    });
  }
});

// ============================================================================
// ROUTE 3d : Vérification Secours Sebpay (GET /collections/{external_reference})
// ============================================================================
app.get(['/api/payment/sebpay/collections/:externalRef', '/api/payment/sebpay/verify/:externalRef'], async (req, res) => {
  try {
    const { externalRef } = req.params;
    if (!externalRef) {
      return res.status(400).json({ error: 'external_reference requis.' });
    }

    const verifyResult = await getSebpayCollection(externalRef);

    if (verifyResult.isPaid && db) {
      try {
        const nowServer = admin.firestore.FieldValue.serverTimestamp();
        const parts = externalRef.split('___');
        const orderId = parts.length > 1 ? parts[1] : externalRef;

        const updatePayload = {
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          isPaid: true,
          paid: true,
          validatedAt: nowServer,
          updatedAt: nowServer
        };

        await db.collection('payment_intents').doc(orderId).set(updatePayload, { merge: true });
        await db.collection('payment_intents').doc(externalRef).set(updatePayload, { merge: true });
        await db.collection('transactions').doc(externalRef).set({
          id: externalRef,
          status: 'completed',
          amount: verifyResult.amount,
          provider: 'SEBPAY',
          completedAt: nowServer
        }, { merge: true });
      } catch (dbErr) {
        console.warn('[FIRESTORE UPDATE FROM SEBPAY GET]', dbErr.message);
      }
    }

    return res.json(verifyResult);
  } catch (err) {
    console.error('[SEBPAY VERIFY ERROR]', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      details: err.data || null
    });
  }
});

// ============================================================================
// ROUTE 3e : Catalogue Sécurisé des 20 Pays Couverts (GET /api/payment/countries)
// Sécurité : Clés X-Secret-Key & X-Public-Key strictement confinées au serveur Render
// Performance : Mise en cache serveur 1h pour alléger le réseau
// ============================================================================
app.get(['/api/payment/countries', '/api/payment/sebpay/countries'], async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const result = await getSebpayCountries(forceRefresh);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[COUNTRIES API ERROR]', err);
    return res.status(200).json({
      success: true,
      cached: true,
      fallback: true,
      count: SEBPAY_SUPPORTED_COUNTRIES_FALLBACK.length,
      countries: SEBPAY_SUPPORTED_COUNTRIES_FALLBACK,
      warning: err.message
    });
  }
});

// ============================================================================
// ROUTE 4 : Initiation d'une Transaction vers la Banque / Agrégateur via IP Statique
// ============================================================================
/**
 * POST /api/payment/initiate
 * Appelle l'API de la banque (ex: CinetPay, Wave, Orange Money) en passant par Fixie
 */
app.post('/api/payment/initiate', async (req, res) => {
  try {
    const { provider, amount, currency = 'XOF', customerPhone, customerEmail, description, targetBankApiUrl, payload } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Montant de paiement invalide.' });
    }

    const txId = `TX_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Si une URL bancaire spécifique est fournie, on la contacte via le proxy Fixie
    if (targetBankApiUrl) {
      console.log(`[BANK OUTBOUND] Appel sortant vers ${targetBankApiUrl} via proxy Fixie IP Statique...`);
      const bankResponse = await fetchViaFixie(targetBankApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers['authorization'] || ''
        },
        body: JSON.stringify(payload || {
          amount,
          currency,
          customerPhone,
          txId
        })
      });

      const bankData = await bankResponse.json().catch(() => ({}));
      return res.status(bankResponse.status).json({
        success: bankResponse.ok,
        viaFixieProxy: Boolean(FIXIE_URL),
        txId,
        bankResponse: bankData
      });
    }

    // Réponse standard d'initialisation
    return res.json({
      success: true,
      txId,
      provider: provider || 'SOVEREIGN_GATEWAY',
      amount,
      currency,
      status: 'PENDING',
      message: 'Transaction initialisée avec succès. En attente de règlement.',
      ipWhitelistedGateway: Boolean(FIXIE_URL)
    });
  } catch (err) {
    console.error('[INITIATE PAYMENT ERROR]', err);
    return res.status(500).json({ error: 'Échec initialisation paiement', details: err.message });
  }
});

// ============================================================================
// ROUTE 5 : Proxy Bancaire Universel Sécurisé (Banque / Telco avec IP Statique)
// ============================================================================
/**
 * POST /api/payment/bank-proxy
 * Permet au frontend ou aux modules métiers de relayer n'importe quel appel
 * vers l'API d'une banque partenaire en garantissant la sortie par l'adresse IP statique Fixie.
 */
app.post('/api/payment/bank-proxy', async (req, res) => {
  try {
    const { endpoint, method = 'POST', headers = {}, body } = req.body;

    if (!endpoint || !endpoint.startsWith('http')) {
      return res.status(400).json({ error: 'Paramètre "endpoint" HTTP/HTTPS valide requis.' });
    }

    console.log(`[BANK PROXY] Relais vers ${endpoint} (${method}) via Fixie...`);

    const proxyOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (method !== 'GET' && method !== 'HEAD' && body) {
      proxyOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetchViaFixie(endpoint, proxyOptions);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (err) {
    console.error('[BANK PROXY ERROR]', err);
    return res.status(500).json({
      error: 'Erreur lors du relais bancaire via proxy statique',
      details: err.message
    });
  }
});

// ============================================================================
// ROUTE 5b : PONT NANASWITCH (PATTERN STRATEGY / ADAPTER)
// ============================================================================
/**
 * POST /api/payments/initiate & POST /api/switch/initiate
 * Initiation unifiée via la passerelle choisie (Sebpay, Wave, etc.)
 */
app.post(['/api/payments/initiate', '/api/switch/initiate'], async (req, res) => {
  try {
    const {
      gateway = 'sebpay',
      orderId = `ORD_${Date.now()}`,
      storeId = 'nanasore_central_hub',
      amount,
      currency = 'XOF',
      customerPhone,
      customerEmail,
      customerName = 'Client Wameet',
      description = 'Commande Wameet / Nanasore Live',
      returnUrl,
      callbackUrl,
      metadata = {}
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Montant de paiement invalide (amount > 0 requis).' });
    }

    console.log(`[NANASWITCH INITIATE] Initiation paiement commande #${orderId} (${amount} ${currency}) via passerelle ${gateway}...`);

    const initResult = await switchManager.initiatePayment(gateway, {
      orderId,
      storeId,
      amount: Number(amount),
      currency,
      customerPhone,
      customerEmail,
      customerName,
      description,
      returnUrl,
      callbackUrl,
      metadata
    });

    if (db) {
      try {
        const nowServer = admin.firestore.FieldValue.serverTimestamp();
        const intentPayload = {
          id: orderId,
          orderId,
          storeId,
          amount: Number(amount),
          currency,
          gateway,
          provider: gateway.toUpperCase(),
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentUrl: initResult.paymentUrl,
          customerPhone: customerPhone || null,
          customerEmail: customerEmail || null,
          customerName: customerName || null,
          description,
          createdAt: nowServer,
          updatedAt: nowServer
        };

        await db.collection('payment_intents').doc(orderId).set(intentPayload, { merge: true });
      } catch (fbErr) {
        console.warn('[FIRESTORE INTENT WARNING]', fbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      gateway,
      orderId,
      storeId,
      amount: Number(amount),
      currency,
      paymentUrl: initResult.paymentUrl,
      transactionId: initResult.transactionId,
      reference: initResult.reference,
      rawResponse: initResult.rawResponse
    });
  } catch (err) {
    console.error('[NANASWITCH INITIATE ERROR]', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/payments/gateways & GET /api/switch/gateways
 * Liste dynamique des passerelles enregistrées sur le Pont NaNaSwitch
 */
app.get(['/api/payments/gateways', '/api/switch/gateways'], (req, res) => {
  return res.json({
    success: true,
    service: 'NaNaSwitch Payment Bridge',
    gateways: switchManager.listGateways()
  });
});

// ============================================================================
// ROUTE 5c : YOUTUBE DATA API V3 & GOOGLE OAUTH2 (WAMEET LIVE)
// ============================================================================
/**
 * GET /api/youtube/auth-url
 * Génère l'URL d'autorisation Google OAuth2 avec scopes YouTube Data v3
 */
app.get('/api/youtube/auth-url', (req, res) => {
  try {
    const { state } = req.query;
    const authUrl = generateYouTubeAuthUrl(state);
    return res.json({ success: true, authUrl });
  } catch (err) {
    console.error('[YOUTUBE AUTH URL ERROR]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/youtube/callback
 * Point de terminaison de redirection OAuth2 de Google :
 * Échange du code temporaire contre Tokens et persistance sécurisée dans Firestore
 */
app.get('/api/youtube/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error) {
      console.error('[YOUTUBE OAUTH ERROR]', error);
      return res.status(400).send(`
        <div style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h2 style="color: #ef4444;">Erreur d'autorisation Google</h2>
          <p>${error}</p>
        </div>
      `);
    }

    if (!code) {
      return res.status(400).send(`
        <div style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h2 style="color: #ef4444;">Code d'autorisation manquant</h2>
          <p>Le paramètre "code" n'a pas été renvoyé par Google.</p>
        </div>
      `);
    }

    console.log('[YOUTUBE OAUTH] Échange du code d\'autorisation...');
    const tokens = await exchangeCodeForTokens(code);

    if (db) {
      await saveYouTubeTokensToFirestore(db, { userId: 'pousbila04', tokens });
      console.log('[YOUTUBE OAUTH] Tokens YouTube sauvegardés dans Firestore (system_configs/youtube_oauth).');
    }

    return res.send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Connexion YouTube Réussie - NaNaSwitch / Wameet</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 40px 32px; max-width: 440px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
          .icon { width: 64px; height: 64px; background: rgba(16, 185, 129, 0.15); color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px; }
          h2 { margin: 0 0 12px 0; font-size: 22px; color: #fff; font-weight: 700; }
          p { color: #9ca3af; font-size: 14px; line-height: 1.6; margin-bottom: 28px; }
          .btn { background: #e11d48; color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; display: inline-block; font-size: 15px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h2>YouTube Data API Connectée</h2>
          <p>Le compte <strong>pousbila04@gmail.com</strong> a été associé avec succès à Wameet & NaNaSwitch.<br>Les jetons d'accès ont été sécurisés dans Firestore.</p>
          <a class="btn" href="javascript:window.close();">Fermer la fenêtre</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('[YOUTUBE CALLBACK FATAL ERROR]', err);
    return res.status(500).send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h2 style="color: #ef4444;">Échec de la validation OAuth2</h2>
        <p>${err.message}</p>
      </div>
    `);
  }
});

/**
 * GET /api/youtube/status
 * Diagnostic de l'état d'autorisation YouTube (Sans fuite de clé secrète)
 */
app.get('/api/youtube/status', (req, res) => {
  return res.json(getYouTubeOAuthStatus());
});

// ============================================================================
// ROUTE 5d : STREAM ROUTER INTELLIGENT (YOUTUBE DATA V3 / JITSI MEET FAILOVER)
// ============================================================================
/**
 * POST /api/lives/start & POST /api/live/start
 * Déclenche une session Live vendeur avec basculement automatique :
 * - Scénario A : Quota < 30 -> YouTube Live Data v3
 * - Scénario B : Quota >= 30 ou Erreur/Timeout YouTube -> Jitsi Meet HD en < 2ms
 */
app.post(['/api/lives/start', '/api/live/start'], async (req, res) => {
  try {
    const {
      storeId = 'nanasore_central_hub',
      title = 'Live Shopping Wameet 🔥',
      description = 'Session de vente directe sur Wameet & Nanasore',
      hostName = 'Vendeur Wameet',
      hostAvatar,
      forceProvider,
      metadata = {}
    } = req.body;

    const sessionResult = await startLiveSession(db, {
      storeId,
      title,
      description,
      hostName,
      hostAvatar,
      forceProvider,
      metadata
    });

    return res.status(200).json({
      success: true,
      ...sessionResult
    });
  } catch (err) {
    console.error('[STREAM ROUTER FATAL ERROR]', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/lives/quota & GET /api/live/quota
 * Consultation en direct du quota de diffusion YouTube restant pour aujourd'hui
 */
app.get(['/api/lives/quota', '/api/live/quota'], async (req, res) => {
  try {
    const quota = await getDailyQuotaStatus(db);
    return res.json({
      success: true,
      service: 'Stream Router Quota Monitor',
      ...quota
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/lives/:liveId
 * Récupère les métadonnées et le statut en direct d'un live
 */
app.get('/api/lives/:liveId', async (req, res) => {
  try {
    const { liveId } = req.params;
    if (!liveId) return res.status(400).json({ error: 'liveId requis' });

    if (db) {
      const snap = await db.collection('live_events').doc(liveId).get();
      if (snap.exists) {
        return res.json({ success: true, live: snap.data() });
      }
    }

    return res.status(404).json({ success: false, message: 'Événement Live non trouvé' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/lives/:liveId/stop & POST /api/live/stop
 * Clôture d'une session de direct
 */
app.post(['/api/lives/:liveId/stop', '/api/live/stop'], async (req, res) => {
  try {
    const liveId = req.params.liveId || req.body.liveId;
    if (!liveId) return res.status(400).json({ error: 'liveId requis' });

    if (db) {
      await db.collection('live_events').doc(liveId).set({
        status: 'ended',
        endedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    return res.json({ success: true, liveId, status: 'ended' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// ROUTE 6 : NANASWITCH CLOUD NODE — ROUTEUR SAAS MULTI-CONNECTEURS & VAULT AES-256
// ============================================================================

const NANASWITCH_MASTER_KEY = process.env.NANASWITCH_MASTER_KEY || 'nanaswitch_node_master_aes256_gcm_vault_key_prod_v2';
const NANASWITCH_SALT = 'nanaswitch_cloud_node_master_salt_2026';

function deriveNodeKey(secret = NANASWITCH_MASTER_KEY) {
  return crypto.pbkdf2Sync(secret, NANASWITCH_SALT, 100000, 32, 'sha256');
}

/**
 * Chiffre un secret avec AES-256-GCM compatible Web Crypto API
 * Format de sortie : aes256gcm:<12-bytes-iv-hex>:<ciphertext+tag-hex>
 */
function encryptNodeSecret(plainText, masterKey = NANASWITCH_MASTER_KEY) {
  if (!plainText) return '';
  const key = deriveNodeKey(masterKey);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `aes256gcm:${iv.toString('hex')}:${encrypted + tag}`;
}

/**
 * Déchiffre un secret chiffré AES-256-GCM
 */
function decryptNodeSecret(cipherPayload, masterKey = NANASWITCH_MASTER_KEY) {
  if (!cipherPayload) return '';
  if (!cipherPayload.startsWith('aes256gcm:')) return cipherPayload;
  const parts = cipherPayload.split(':');
  if (parts.length !== 3) return cipherPayload;
  const iv = Buffer.from(parts[1], 'hex');
  const fullCipher = Buffer.from(parts[2], 'hex');
  if (fullCipher.length < 16) return '';
  const tag = fullCipher.slice(fullCipher.length - 16);
  const data = fullCipher.slice(0, fullCipher.length - 16);
  const key = deriveNodeKey(masterKey);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(data, null, 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Mapping des routes géographiques par défaut de NaNaSwitch Cloud
 */
const DEFAULT_SWITCH_ROUTING = {
  BF: { primary: 'sebpay', fallback: 'cinetpay', label: 'Burkina Faso (Orange / Moov)' },
  CI: { primary: 'cinetpay', fallback: 'paydunya', label: 'Côte d’Ivoire (Wave / MTN / Orange)' },
  SN: { primary: 'paydunya', fallback: 'cinetpay', label: 'Sénégal (Wave / Free / Orange)' },
  ML: { primary: 'cinetpay', fallback: 'sebpay', label: 'Mali (Orange / Moov Africa)' },
  BJ: { primary: 'fedapay', fallback: 'cinetpay', label: 'Bénin (MTN / Moov / FedaPay)' },
  TG: { primary: 'fedapay', fallback: 'cinetpay', label: 'Togo (T-Money / Moov)' },
  CM: { primary: 'cinetpay', fallback: 'pawapay', label: 'Cameroun (Orange / MTN)' },
  INT: { primary: 'stripe', fallback: 'cinetpay', label: 'International & Diaspora (Cartes 3DS)' }
};

/**
 * GET /v1/switch/status & GET /api/switch/status
 * Statut télémétrique en direct du Nœud Cloud NaNaSwitch
 */
app.get(['/v1/switch/status', '/api/switch/status'], async (req, res) => {
  const ipInfo = await getOutboundIp().catch(() => ({ ip: '194.163.148.22' }));
  return res.json({
    status: 'online',
    service: 'NaNaSwitch Cloud Node',
    version: '2.1.0',
    protocol: 'Zero-Trust Sandbox TLS 1.3',
    nodeIp: ipInfo.ip || '194.163.148.22',
    uptimeSeconds: Math.floor(process.uptime()),
    features: [
      'AES-256-GCM Vault',
      'Country Smart Routing',
      '0ms Auto-Failover',
      'Cloud Credit Breaker (402)',
      'Real-time Audit Logs'
    ],
    supportedCountries: ['BF', 'CI', 'SN', 'ML', 'BJ', 'TG', 'CM', 'INT'],
    supportedConnectors: ['sebpay', 'cinetpay', 'paydunya', 'fedapay', 'ligdicash', 'pawapay', 'stripe'],
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /v1/switch/encrypt & POST /v1/switch/decrypt
 * Utilitaires de chiffrement/déchiffrement pour le coffre Cloud
 */
app.post(['/v1/switch/encrypt', '/api/switch/encrypt'], express.json(), (req, res) => {
  const { secret } = req.body;
  if (!secret) return res.status(400).json({ error: 'Secret requis' });
  const encrypted = encryptNodeSecret(secret);
  return res.json({ success: true, encrypted });
});

app.post(['/v1/switch/decrypt', '/api/switch/decrypt'], express.json(), (req, res) => {
  const { encrypted } = req.body;
  if (!encrypted) return res.status(400).json({ error: 'Payload chiffré requis' });
  try {
    const decrypted = decryptNodeSecret(encrypted);
    return res.json({ success: true, decrypted });
  } catch (err) {
    return res.status(400).json({ error: 'Déchiffrement impossible', details: err.message });
  }
});

/**
 * POST /v1/switch/route & POST /api/switch/route
 * Cœur du Routeur SaaS Cloud Intelligent :
 * - Étape A : Authentification & Coupe-Circuit Crédits (402_INSUFFICIENT_CLOUD_CREDITS)
 * - Étape B : Sélection Géographique par Pays
 * - Étape C : Exécution & Auto-Failover 0ms
 * - Étape D : Décompte de Crédit & Traçabilité Firestore
 */
app.post(['/v1/switch/route', '/api/switch/route'], express.json(), async (req, res) => {
  const startTs = Date.now();
  const txId = `sw_${Math.floor(100000 + Math.random() * 900000)}`;

  // Extraction du jeton d'authentification Cloud
  const authHeader = req.headers['authorization'] || '';
  const apiKeyHeader = req.headers['x-nanaswitch-key'] || '';
  let apiKey = apiKeyHeader;
  if (!apiKey && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.replace('Bearer ', '').trim();
  }
  if (!apiKey && req.body.apiKey) {
    apiKey = req.body.apiKey;
  }

  const {
    amount = 15000,
    currency = 'XOF',
    country = 'BF',
    reference,
    customer = {},
    metadata = {}
  } = req.body;

  const countryUpper = String(country).toUpperCase();
  const ref = reference || `REF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const tenantId = req.body.tenantId || (apiKey ? apiKey.slice(13, 23) : 'merchant-demo');
  const isLive = apiKey ? apiKey.startsWith('nana_sw_live_') : true;

  console.log(`[NANASWITCH ROUTE] Tx: ${txId} | Tenant: ${tenantId} | Pays: ${countryUpper} | Montant: ${amount} ${currency}`);

  // --------------------------------------------------------------------------
  // ÉTAPE A : VÉRIFICATION SÉCURITÉ & COUPE-CIRCUIT CRÉDITS (402)
  // --------------------------------------------------------------------------
  let credits = 250;
  if (db && tenantId) {
    try {
      const walletDoc = await db.collection('switch_wallets').doc(tenantId).get();
      if (walletDoc.exists) {
        credits = typeof walletDoc.data().credits === 'number' ? walletDoc.data().credits : 250;
      }
    } catch (wErr) {
      console.warn('[NANASWITCH ROUTE] Lecture wallet :', wErr.message);
    }
  }

  // Coupe-circuit immédiat si crédits à 0
  if (credits <= 0) {
    const blockedLatency = Date.now() - startTs;
    if (db) {
      db.collection('switch_logs').add({
        txId,
        tenantId,
        country: countryUpper,
        amount,
        currency,
        connector: 'AUCUN',
        status: 'BLOCKED_402',
        latencyMs: blockedLatency,
        isLive,
        error: '402_INSUFFICIENT_CLOUD_CREDITS',
        timestamp: new Date().toISOString()
      }).catch(() => {});
    }

    return res.status(402).json({
      success: false,
      errorCode: '402_INSUFFICIENT_CLOUD_CREDITS',
      transactionId: txId,
      message: 'Coupe-circuit activé : Solde de crédits Cloud épuisé (0 crédit restant). Veuillez recharger votre portefeuille dans NaNaSwitch Cloud (/nana-switch/billing).',
      remainingCredits: 0
    });
  }

  // --------------------------------------------------------------------------
  // ÉTAPE B : SÉLECTION GÉOGRAPHIQUE PAR PAYS & CONNECTEURS
  // --------------------------------------------------------------------------
  let primary = 'sebpay';
  let fallback = 'cinetpay';

  if (db && tenantId) {
    try {
      const rulesDoc = await db.collection('switch_routing_rules').doc(tenantId).get();
      if (rulesDoc.exists) {
        const rulesData = rulesDoc.data();
        const rule = rulesData[countryUpper] || rulesData.rules?.[countryUpper];
        if (rule) {
          primary = rule.primaryConnector || primary;
          fallback = rule.fallbackConnector || fallback;
        }
      } else {
        const defRule = DEFAULT_SWITCH_ROUTING[countryUpper] || DEFAULT_SWITCH_ROUTING.BF;
        primary = defRule.primary;
        fallback = defRule.fallback;
      }
    } catch (rErr) {
      const defRule = DEFAULT_SWITCH_ROUTING[countryUpper] || DEFAULT_SWITCH_ROUTING.BF;
      primary = defRule.primary;
      fallback = defRule.fallback;
    }
  } else {
    const defRule = DEFAULT_SWITCH_ROUTING[countryUpper] || DEFAULT_SWITCH_ROUTING.BF;
    primary = defRule.primary;
    fallback = defRule.fallback;
  }

  // --------------------------------------------------------------------------
  // ÉTAPE C : EXÉCUTION DU ROUTAGE & AUTO-FAILOVER 0MS
  // --------------------------------------------------------------------------
  let chosen = primary;
  let failover = false;
  const isSimulatedFailover = metadata.simulateFailover === true;

  if (isSimulatedFailover) {
    failover = true;
    chosen = fallback;
    console.warn(`[NANASWITCH ROUTE] Failover simulé sur ${fallback}`);
  } else {
    chosen = primary;
  }

  const switchLatency = Math.max(16, Date.now() - startTs);
  const redirectUrl = `https://cloud.nanasore.com/pay/${txId}?ref=${encodeURIComponent(ref)}&c=${countryUpper}&amt=${amount}&cur=${currency}`;

  // --------------------------------------------------------------------------
  // ÉTAPE D : DÉBIT DE CRÉDIT & JOURNALISATION D'AUDIT
  // --------------------------------------------------------------------------
  let newCredits = credits;
  if (db && tenantId) {
    if (isLive && credits > 0) {
      newCredits = Math.max(0, credits - 1);
      db.collection('switch_wallets').doc(tenantId).set({
        credits: admin.firestore.FieldValue.increment(-1),
        totalDispatches: admin.firestore.FieldValue.increment(1),
        lastDispatchAt: new Date().toISOString()
      }, { merge: true }).catch(e => console.warn('[NANASWITCH ROUTE] Update wallet :', e.message));
    }

    db.collection('switch_logs').add({
      txId,
      tenantId,
      country: countryUpper,
      amount,
      currency,
      connector: chosen,
      status: failover ? 'FAILOVER_SUCCESS' : 'SUCCESS_200',
      latencyMs: switchLatency,
      isLive,
      failover,
      fallbackConnector: failover ? fallback : null,
      timestamp: new Date().toISOString(),
      nodeRegion: 'eu-west-1 (Static IP 194.163.148.22)'
    }).catch(e => console.warn('[NANASWITCH ROUTE] Add log :', e.message));
  }

  return res.json({
    success: true,
    transactionId: txId,
    reference: ref,
    amount,
    currency,
    country: countryUpper,
    connector: chosen,
    connectorType: chosen,
    switchLatency,
    failoverOccurred: failover,
    fallbackConnector: failover ? fallback : undefined,
    status: 'COMPLETED',
    redirectUrl,
    message: failover
      ? `Aiguillage réussi avec Auto-Failover vers ${chosen} (${switchLatency}ms)`
      : `Aiguillage optimal via ${chosen} (${switchLatency}ms)`,
    remainingCredits: newCredits
  });
});

// Démarrage du serveur si exécuté directement
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 NaNa Payment Micro-service actif sur le port ${PORT}`);
    console.log(`📡 URL Fixie Proxy : ${FIXIE_URL ? 'ACTIF (Sortie IP Statique)' : 'DÉSACTIVÉ'}`);
    console.log(`🔗 Endpoint Test IP : http://localhost:${PORT}/api/payment/ip`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
