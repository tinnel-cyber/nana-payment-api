/**
 * ==============================================================================
 * NaNaSwitch : Gestionnaire Central Multi-Passerelles & Auto-Failover
 * ==============================================================================
 * 
 * Orchestrateur du pont de paiement selon le Pattern Strategy / Adapter :
 * 1. Enregistre et résout dynamiquement les passerelles (Sebpay, SasPay, Wave, etc.)
 * 2. Implémente le routage intelligent avec priorité et basculement automatique (Failover 0ms)
 *    en cas d'erreur 403 Forbidden, 429 Too Many Requests (dépassement de quota) ou réseau critique.
 * 3. Garantit la traçabilité complète et la persistance de la passerelle finale dans Firestore.
 * 4. Déclenche le Split financier atomique ACID (executeFinancialSplit)
 * 5. Déclenche l'envoi asynchrone non-bloquant des reçus (processPostPaymentCommunication)
 */

const SebpayAdapter = require('./adapters/sebpay-adapter');
const SaspayAdapter = require('./adapters/saspay-adapter');
const WaveAdapter = require('./adapters/wave-adapter');
const { executeFinancialSplit } = require('./split-engine');
const { processPostPaymentCommunication } = require('./communication-service');

class NaNaSwitchManager {
  constructor() {
    this.adapters = new Map();

    // Enregistrement par défaut des adaptateurs supportés
    this.registerAdapter(new SebpayAdapter());
    this.registerAdapter(new SaspayAdapter());
    this.registerAdapter(new WaveAdapter());
  }

  /**
   * Enregistre un nouvel adaptateur dans le Switch
   * @param {import('./gateway-adapter')} adapter
   */
  registerAdapter(adapter) {
    if (!adapter || !adapter.id) {
      throw new Error('[NANASWITCH] Adaptateur invalide ou manquant de propriété "id".');
    }
    this.adapters.set(adapter.id.toLowerCase(), adapter);
    console.log(`[NANASWITCH] Passerelle enregistrée avec succès : ${adapter.name} [id: ${adapter.id}]`);
  }

  /**
   * Récupère un adaptateur par son identifiant
   * @param {string} gatewayId
   */
  getAdapter(gatewayId = 'sebpay') {
    const cleanId = String(gatewayId || 'sebpay').toLowerCase().trim();
    const adapter = this.adapters.get(cleanId);
    if (!adapter) {
      throw new Error(`[NANASWITCH] Passerelle de paiement non reconnue : "${gatewayId}". Passerelles disponibles : ${Array.from(this.adapters.keys()).join(', ')}`);
    }
    return adapter;
  }

  /**
   * Liste les passerelles enregistrées et leur état de configuration
   */
  listGateways() {
    const list = [];
    for (const [id, adapter] of this.adapters.entries()) {
      list.push(adapter.getConfigStatus());
    }
    return list;
  }

  /**
   * Évalue si une erreur rencontrée justifie un basculement automatique vers la passerelle de secours :
   * - 403 Forbidden (Quota opérateur atteint, IP non whitelistée, compte suspendu)
   * - 429 Too Many Requests (Dépassement de quota ou de rate limit)
   * - 502 / 503 / 504 (Passerelle aval indisponible ou timeout)
   * - Erreurs réseau critiques (ECONNREFUSED, ETIMEDOUT, ENOTFOUND, Timeout, Fetch failure)
   * 
   * @param {Error|object} err
   * @returns {boolean}
   */
  isEligibleForFailover(err) {
    if (!err) return false;

    // Barrière de sécurité : Les erreurs de validation utilisateur (OTP requis, numéro invalide)
    // ne doivent JAMAIS déclencher de failover vers une autre passerelle
    if (err.code === 'OTP_REQUIRED' || err.code === 'INVALID_PHONE_NUMBER' || err.code === 'INVALID_OPERATOR') {
      return false;
    }

    const status = Number(err.status || err.statusCode || 0);
    if (status === 403 || status === 429 || status === 502 || status === 503 || status === 504) {
      return true;
    }

    const errorStr = (String(err.message || '') + ' ' + JSON.stringify(err.data || {})).toLowerCase();

    // Mots-clés caractéristiques de quota ou d'indisponibilité réseau
    const failoverKeywords = [
      'quota',
      'limit',
      'rate limit',
      'too many requests',
      'ip_not_whitelisted',
      'ip not whitelisted',
      'forbidden',
      'econnrefused',
      'etimedout',
      'enotfound',
      'und_err_connect_timeout',
      'aborterror',
      'time-out',
      'timeout',
      'fetch failed',
      'service unavailable',
      'bad gateway',
      'gateway timeout'
    ];

    return failoverKeywords.some(kw => errorStr.includes(kw));
  }

  /**
   * Initialise un paiement avec logique de priorité et basculement automatique (Failover)
   * 
   * Logique de continuité de service :
   * - Tente en priorité la passerelle demandée (ex: Sebpay).
   * - Si Sebpay échoue avec 403, 429 ou erreur réseau/quota, bascule instantanément vers SasPay
   *   pour assurer une expérience fluide et transparente pour l'utilisateur final.
   * - Retourne la réponse de la passerelle finale en enrichissant les métadonnées de basculement.
   * 
   * @param {string} [primaryGatewayId='sebpay']
   * @param {object} params
   * @param {object} [options]
   * @param {string} [options.fallbackGatewayId] - Passerelle de repli explicite (par défaut: saspay si sebpay, sinon sebpay)
   * @param {boolean} [options.disableFailover=false]
   * @param {admin.firestore.Firestore} [options.db] - Instance Firestore optionnelle pour persistance directe
   */
  async initiatePaymentWithFailover(primaryGatewayId = 'sebpay', params = {}, options = {}) {
    const primaryId = String(primaryGatewayId || 'sebpay').toLowerCase().trim();
    const fallbackId = String(
      options.fallbackGatewayId || (primaryId === 'sebpay' ? 'saspay' : 'sebpay')
    ).toLowerCase().trim();

    const orderId = params.orderId || `ORD_${Date.now()}`;
    const amount = params.amount;

    console.log(`[NANASWITCH ROUTER] Initiation transaction #${orderId} (${amount} ${params.currency || 'XOF'}) | Passerelle prioritaire : [${primaryId}]`);

    try {
      const primaryAdapter = this.getAdapter(primaryId);
      const result = await primaryAdapter.initiatePayment(params);

      const resolved = {
        ...result,
        gateway: primaryId,
        provider: primaryId.toUpperCase(),
        failedOver: false,
        failover: false
      };

      if (options.db) {
        await this.persistTransactionIntent(options.db, resolved, params);
      }

      return resolved;
    } catch (primaryErr) {
      const shouldFailover = !options.disableFailover && this.isEligibleForFailover(primaryErr);

      if (!shouldFailover) {
        console.error(`[NANASWITCH] Échec sur passerelle [${primaryId}] non éligible au failover (Raison: ${primaryErr.message}).`);
        throw primaryErr;
      }

      // Log d'avertissement explicite requis : [FAILOVER] Sebpay indisponible/quota atteint, basculement vers SasPay
      console.warn(`[FAILOVER] ${primaryId === 'sebpay' ? 'Sebpay' : primaryId} indisponible/quota atteint, basculement vers ${fallbackId === 'saspay' ? 'SasPay' : fallbackId} (Erreur initiale : ${primaryErr.message})`);

      try {
        const fallbackAdapter = this.getAdapter(fallbackId);
        const fallbackResult = await fallbackAdapter.initiatePayment(params);

        console.log(`[FAILOVER SUCCESS] Transaction #${orderId} basculée avec succès sur ${fallbackAdapter.name} (Gateway: ${fallbackId}) !`);

        const resolved = {
          ...fallbackResult,
          gateway: fallbackId,
          provider: fallbackId.toUpperCase(),
          failedOver: true,
          failover: true,
          originalGateway: primaryId,
          failoverReason: primaryErr.message
        };

        if (options.db) {
          await this.persistTransactionIntent(options.db, resolved, params);
        }

        return resolved;
      } catch (fallbackErr) {
        console.error(`[FAILOVER CRITICAL] Échec de la passerelle de secours [${fallbackId}] pour #${orderId} :`, fallbackErr.message);
        const compositeErr = new Error(`Échec paiement multi-passerelle (${primaryId}: ${primaryErr.message} -> ${fallbackId}: ${fallbackErr.message})`);
        compositeErr.primaryError = primaryErr;
        compositeErr.fallbackError = fallbackErr;
        compositeErr.status = primaryErr.status || fallbackErr.status || 500;
        throw compositeErr;
      }
    }
  }

  /**
   * Alias de rétro-compatibilité : appelle initiatePaymentWithFailover
   * @param {string} gatewayId
   * @param {object} params
   * @param {object} [options]
   */
  async initiatePayment(gatewayId = 'sebpay', params = {}, options = {}) {
    return await this.initiatePaymentWithFailover(gatewayId, params, options);
  }

  /**
   * Persiste l'intention de transaction dans Firestore en garantissant la traçabilité de la passerelle
   * @param {admin.firestore.Firestore} db
   * @param {object} initResult
   * @param {object} originalParams
   */
  async persistTransactionIntent(db, initResult, originalParams = {}) {
    if (!db) return;

    try {
      const orderId = originalParams.orderId || initResult.orderId;
      const externalReference = originalParams.externalReference || initResult.reference || `${originalParams.storeId || 'nanasore'}___${orderId}`;
      const chosenGateway = initResult.gateway || 'sebpay';

      const nowServer = new Date().toISOString();

      const payload = {
        id: orderId,
        orderId,
        externalReference,
        storeId: originalParams.storeId || 'nanasore_central_hub',
        tenantId: originalParams.storeId || originalParams.tenantId || 'nanasore_central_hub',
        amount: Number(originalParams.amount || initResult.amount || 0),
        currency: (originalParams.currency || initResult.currency || 'XOF').toUpperCase(),
        gateway: chosenGateway, // "sebpay" ou "saspay"
        provider: chosenGateway.toUpperCase(),
        failedOver: Boolean(initResult.failedOver),
        originalGateway: initResult.originalGateway || null,
        failoverReason: initResult.failoverReason || null,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentUrl: initResult.paymentUrl || initResult.checkout_url || null,
        redirectUrl: initResult.paymentUrl || initResult.checkout_url || null,
        transactionId: initResult.transactionId || null,
        customerPhone: originalParams.customerPhone || originalParams.phone || null,
        customerEmail: originalParams.customerEmail || null,
        customerName: originalParams.customerName || null,
        description: originalParams.description || null,
        updatedAt: nowServer
      };

      const promises = [];
      if (orderId) {
        promises.push(db.collection('payment_intents').doc(orderId).set(payload, { merge: true }));
      }
      if (externalReference && externalReference !== orderId) {
        promises.push(db.collection('payment_intents').doc(externalReference).set(payload, { merge: true }));
      }

      await Promise.all(promises);
      console.log(`[FIRESTORE TRANSACTION] Intent persisté avec succès | Order #${orderId} | Gateway: "${chosenGateway}" | Failover: ${Boolean(initResult.failedOver)}`);
    } catch (fbErr) {
      console.warn('[FIRESTORE PERSIST NOTICE] Écriture intent :', fbErr.message);
    }
  }

  /**
   * 2. Traite un Webhook entrant avec vérification cryptographique selon la passerelle :
   * @param {string} gatewayId
   * @param {object} req - Requête Express (headers, body brut, query)
   */
  async verifyWebhook(gatewayId = 'sebpay', req) {
    const adapter = this.getAdapter(gatewayId);
    return await adapter.verifyWebhook(req);
  }

  /**
   * 3. Orchestration post-paiement unifiée (Split financier ACID + SMS/Email)
   */
  async dispatchPostPaymentWorkflow(params) {
    const {
      db,
      orderId,
      storeId,
      totalAmount,
      transactionId,
      gateway = 'sebpay',
      customerPhone,
      customerEmail,
      customerName,
      productTitle,
      storeName
    } = params;

    console.log(`[NANASWITCH ASYNC WORKFLOW] Démarrage du workflow post-paiement pour commande #${orderId} (${totalAmount} FCFA via [${gateway}])...`);

    let splitResult = null;
    try {
      splitResult = await executeFinancialSplit(db, {
        orderId,
        storeId,
        totalAmount,
        transactionId,
        gateway
      });
      console.log(`[NANASWITCH ASYNC WORKFLOW] Étape 1 validée : Split ACID réussi (Vendeur: ${splitResult.vendorShare} FCFA, Plateforme: ${splitResult.platformCommission} FCFA).`);
    } catch (splitErr) {
      console.error(`[NANASWITCH CRITICAL] Échec du split ACID pour #${orderId} :`, splitErr);
      if (db) {
        db.collection('split_errors').doc(orderId).set({
          orderId,
          storeId,
          totalAmount,
          transactionId,
          gateway,
          error: splitErr.message,
          failedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      }
    }

    try {
      const commResult = await processPostPaymentCommunication(db, {
        orderId,
        storeId,
        customerPhone,
        customerEmail,
        customerName,
        totalAmount,
        productTitle: productTitle || 'Commande Wameet',
        storeName: storeName || 'Boutique Wameet / Nanasore'
      });
      console.log(`[NANASWITCH ASYNC WORKFLOW] Étape 2 validée : Notification client traitée. Total débité : ${commResult?.totalDeducted || 0} FCFA.`);
    } catch (commErr) {
      console.error(`[NANASWITCH WARNING] Échec traitement communication pour #${orderId} :`, commErr);
    }

    console.log(`[NANASWITCH ASYNC WORKFLOW] Workflow post-paiement terminé pour commande #${orderId}.`);
    return {
      success: true,
      split: splitResult
    };
  }
}

// Instance singleton
const switchManager = new NaNaSwitchManager();

module.exports = {
  NaNaSwitchManager,
  switchManager
};
