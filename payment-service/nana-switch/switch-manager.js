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

    // Configuration dynamique des passerelles (prioritaire et de secours)
    this.primaryGateway = (process.env.PRIMARY_GATEWAY || 'saspay').toLowerCase().trim();
    this.fallbackGateway = (process.env.FALLBACK_GATEWAY || (this.primaryGateway === 'saspay' ? 'sebpay' : 'saspay')).toLowerCase().trim();

    // Enregistrement par défaut des adaptateurs supportés
    this.registerAdapter(new SebpayAdapter());
    this.registerAdapter(new SaspayAdapter());
    this.registerAdapter(new WaveAdapter());
  }

  /**
   * Récupère la passerelle prioritaire configurée
   * @returns {string} Identifiant de la passerelle ('saspay', 'sebpay', etc.)
   */
  getPrimaryGateway() {
    return (process.env.PRIMARY_GATEWAY || this.primaryGateway || 'saspay').toLowerCase().trim();
  }

  /**
   * Modifie dynamiquement la passerelle prioritaire
   * @param {string} gatewayId
   */
  setPrimaryGateway(gatewayId) {
    if (!gatewayId) return;
    const cleanId = String(gatewayId).toLowerCase().trim();
    this.primaryGateway = cleanId;
    process.env.PRIMARY_GATEWAY = cleanId;
    console.log(`[NANASWITCH CONFIG] Passerelle principale configurée dynamiquement sur : [${cleanId}]`);
  }

  /**
   * Récupère la passerelle de secours (failover)
   * @param {string} [primaryId]
   * @returns {string} Identifiant de la passerelle de secours
   */
  getFallbackGateway(primaryId = null) {
    const currentPrimary = primaryId || this.getPrimaryGateway();
    if (process.env.FALLBACK_GATEWAY) {
      return process.env.FALLBACK_GATEWAY.toLowerCase().trim();
    }
    if (this.fallbackGateway && this.fallbackGateway !== currentPrimary) {
      return this.fallbackGateway;
    }
    return (currentPrimary === 'saspay' ? 'sebpay' : 'saspay');
  }

  /**
   * Modifie dynamiquement la passerelle de secours
   * @param {string} gatewayId
   */
  setFallbackGateway(gatewayId) {
    if (!gatewayId) return;
    const cleanId = String(gatewayId).toLowerCase().trim();
    this.fallbackGateway = cleanId;
    process.env.FALLBACK_GATEWAY = cleanId;
    console.log(`[NANASWITCH CONFIG] Passerelle de secours configurée dynamiquement sur : [${cleanId}]`);
  }

  /**
   * Retourne la configuration de routage active
   */
  getRoutingConfig() {
    return {
      primaryGateway: this.getPrimaryGateway(),
      fallbackGateway: this.getFallbackGateway(),
      availableGateways: Array.from(this.adapters.keys())
    };
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
   * @param {string} [gatewayId]
   */
  getAdapter(gatewayId = null) {
    const cleanId = String(gatewayId || this.getPrimaryGateway()).toLowerCase().trim();
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
   * - Erreurs API (400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504...)
   * - Rejet opérateur (ex: "The operator declined the payment request", PAYMENT_DECLINED, etc.)
   * - Quota atteint ou IP non whitelistée
   * - Erreurs réseau et timeouts critiques (ECONNREFUSED, ETIMEDOUT, Socket hang up, etc.)
   * 
   * @param {Error|object} err
   * @returns {boolean}
   */
  isEligibleForFailover(err) {
    if (!err) return false;

    // Ne JAMAIS failover sur une erreur de validation client (OTP manquant ou numéro invalide)
    if (err.code === 'OTP_REQUIRED' || err.code === 'INVALID_PHONE_NUMBER') {
      return false;
    }

    // Erreurs d'API ou HTTP (400, 401, 402, 403, 404, 409, 422, 429, 500, 502, 503, 504...)
    const status = Number(err.status || err.statusCode || err.response?.status || 0);
    if (status >= 400 && status <= 599) {
      return true;
    }

    const errorStr = (
      String(err.message || '') + ' ' +
      String(err.code || '') + ' ' +
      JSON.stringify(err.data || {}) + ' ' +
      JSON.stringify(err.response?.data || {})
    ).toLowerCase();

    // Mots-clés caractéristiques de rejet opérateur, quota ou indisponibilité réseau
    const failoverKeywords = [
      'declined',
      'payment_declined',
      'rejected',
      'refused',
      'failed',
      'insufficient_balance',
      'operator',
      'the operator declined',
      'operator declined',
      'quota',
      'limit',
      'rate limit',
      'too many requests',
      'ip_not_whitelisted',
      'ip not whitelisted',
      'forbidden',
      'unauthorized',
      'not found',
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
      'gateway timeout',
      'network error',
      'socket hang up',
      'api error'
    ];

    if (failoverKeywords.some(kw => errorStr.includes(kw))) {
      return true;
    }

    // Par défaut, toute exception survenue lors de l'appel d'une passerelle
    // justifie le déclenchement de la passerelle de secours
    return true;
  }

  /**
   * Initialise un paiement avec logique de priorité dynamique et basculement automatique (Failover)
   * 
   * @param {string} [primaryGatewayId] - Passerelle prioritaire (si non fourni, utilise PRIMARY_GATEWAY)
   * @param {object} params
   * @param {object} [options]
   * @param {string} [options.fallbackGatewayId] - Passerelle de repli explicite (par défaut FALLBACK_GATEWAY)
   * @param {boolean} [options.disableFailover=false]
   * @param {admin.firestore.Firestore} [options.db] - Instance Firestore optionnelle pour persistance directe
   */
  async initiatePaymentWithFailover(primaryGatewayId = null, params = {}, options = {}) {
    const configuredPrimary = this.getPrimaryGateway();
    const primaryId = (primaryGatewayId && primaryGatewayId !== 'auto' && primaryGatewayId !== 'default')
      ? String(primaryGatewayId).toLowerCase().trim()
      : configuredPrimary;

    const fallbackId = String(
      options.fallbackGatewayId || this.getFallbackGateway(primaryId)
    ).toLowerCase().trim();

    // S'assurer que la passerelle de secours est distincte de la passerelle principale
    const effectiveFallbackId = (fallbackId !== primaryId)
      ? fallbackId
      : (primaryId === 'saspay' ? 'sebpay' : 'saspay');

    const orderId = params.orderId || `ORD_${Date.now()}`;
    const amount = params.amount;

    console.log(`[NANASWITCH ROUTER] Initiation transaction #${orderId} (${amount} ${params.currency || 'XOF'}) | Passerelle prioritaire : [${primaryId}] | Secours : [${effectiveFallbackId}]`);

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

      console.warn(`[FAILOVER TRIGGERED] Échec de la passerelle principale [${primaryId}] (Erreur: ${primaryErr.message}). Basculement automatique immédiat vers la passerelle de secours [${effectiveFallbackId}]...`);

      try {
        const fallbackAdapter = this.getAdapter(effectiveFallbackId);

        // Transmission garantie du numéro de téléphone saisi lors du premier essai pour pré-remplir la page Sebpay
        const resolvedCustomerPhone = params.customerPhone || params.phone || params.customer_phone || '';
        const fallbackParams = {
          ...params,
          failover: true,
          customerPhone: resolvedCustomerPhone,
          customer_phone: resolvedCustomerPhone,
          phone: resolvedCustomerPhone
        };

        const fallbackResult = await fallbackAdapter.initiatePayment(fallbackParams);

        console.log(`[FAILOVER SUCCESS] Transaction #${orderId} basculée avec succès sur la passerelle de secours ${fallbackAdapter.name} (Gateway: ${effectiveFallbackId}) !`);

        const checkoutUrl = fallbackResult.checkout_url || fallbackResult.redirectUrl || fallbackResult.paymentUrl;

        const resolved = {
          ...fallbackResult,
          success: true,
          action: 'REDIRECT',
          redirectUrl: checkoutUrl,
          checkout_url: checkoutUrl,
          paymentUrl: checkoutUrl,
          gateway: effectiveFallbackId,
          provider: effectiveFallbackId.toUpperCase(),
          failedOver: true,
          failover: true,
          originalGateway: primaryId,
          failoverReason: primaryErr.message,
          message: 'Redirection vers le canal sécurisé Sebpay'
        };

        if (options.db) {
          await this.persistTransactionIntent(options.db, resolved, params);
        }

        return resolved;
      } catch (fallbackErr) {
        console.error(`[FAILOVER CRITICAL] Échec de la passerelle de secours [${effectiveFallbackId}] pour #${orderId} :`, fallbackErr.message);
        const compositeErr = new Error(`Échec paiement multi-passerelle (${primaryId}: ${primaryErr.message} -> ${effectiveFallbackId}: ${fallbackErr.message})`);
        compositeErr.primaryError = primaryErr;
        compositeErr.fallbackError = fallbackErr;
        compositeErr.status = primaryErr.status || fallbackErr.status || 500;
        throw compositeErr;
      }
    }
  }

  /**
   * Vérification universelle du statut d'une transaction
   * @param {string} transactionId
   * @param {string} [gatewayId]
   * @param {string} [externalRef]
   */
  async checkPaymentStatus(transactionId, gatewayId = null, externalRef = null) {
    let targetGateway = gatewayId ? String(gatewayId).toLowerCase().trim() : null;

    if (targetGateway && this.adapters.has(targetGateway)) {
      return await this.getAdapter(targetGateway).checkPaymentStatus(transactionId, externalRef);
    }

    const primary = this.getPrimaryGateway();
    try {
      return await this.getAdapter(primary).checkPaymentStatus(transactionId, externalRef);
    } catch {
      const fallback = this.getFallbackGateway(primary);
      return await this.getAdapter(fallback).checkPaymentStatus(transactionId, externalRef);
    }
  }

  /**
   * Alias de rétro-compatibilité : appelle initiatePaymentWithFailover
   * @param {string} [gatewayId]
   * @param {object} params
   * @param {object} [options]
   */
  async initiatePayment(gatewayId = null, params = {}, options = {}) {
    return await this.initiatePaymentWithFailover(gatewayId || this.getPrimaryGateway(), params, options);
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
      const chosenGateway = initResult.gateway || this.getPrimaryGateway();

      const nowServer = new Date().toISOString();

      const payload = {
        id: orderId,
        orderId,
        externalReference,
        storeId: originalParams.storeId || 'nanasore_central_hub',
        tenantId: originalParams.storeId || originalParams.tenantId || 'nanasore_central_hub',
        amount: Number(originalParams.amount || initResult.amount || 0),
        currency: (originalParams.currency || initResult.currency || 'XOF').toUpperCase(),
        gateway: chosenGateway, // "saspay" par défaut ou "sebpay"
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
   * @param {string} [gatewayId]
   * @param {object} req - Requête Express (headers, body brut, query)
   */
  async verifyWebhook(gatewayId = null, req) {
    const adapter = this.getAdapter(gatewayId || this.getPrimaryGateway());
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
      gateway = this.getPrimaryGateway(),
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
