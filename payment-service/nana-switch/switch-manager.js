/**
 * ==============================================================================
 * NaNaSwitch : Gestionnaire Central Multi-Passerelles (Switch Manager)
 * ==============================================================================
 * 
 * Orchestrateur du pont de paiement selon le Pattern Strategy / Adapter :
 * 1. Enregistre et résout dynamiquement les passerelles de paiement (Sebpay, Wave, etc.)
 * 2. Initie les transactions client (/api/payments/initiate)
 * 3. Valide cryptographiquement les Webhooks entrants
 * 4. Déclenche le Split financier atomique ACID (executeFinancialSplit)
 * 5. Déclenche l'envoi asynchrone non-bloquant des reçus et le prélèvement des frais (processPostPaymentCommunication)
 */

const SebpayAdapter = require('./adapters/sebpay-adapter');
const WaveAdapter = require('./adapters/wave-adapter');
const { executeFinancialSplit } = require('./split-engine');
const { processPostPaymentCommunication } = require('./communication-service');

class NaNaSwitchManager {
  constructor() {
    this.adapters = new Map();

    // Enregistrement par défaut des adaptateurs supportés
    this.registerAdapter(new SebpayAdapter());
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
   * 1. Initialise un paiement via la passerelle sélectionnée
   * @param {string} gatewayId - 'sebpay', 'wave', etc.
   * @param {object} params
   */
  async initiatePayment(gatewayId = 'sebpay', params) {
    const adapter = this.getAdapter(gatewayId);
    return await adapter.initiatePayment(params);
  }

  /**
   * 2. Traite un Webhook entrant :
   * - Vérifie la signature cryptographique (ex: HMAC-SHA256 pour Sebpay)
   * - Si valide, retourne les métadonnées de la transaction pour réponse immédiate 200 OK
   * - Fournit la méthode de dispatch pour le traitement financier en tâche asynchrone de fond
   * 
   * @param {string} gatewayId
   * @param {object} req - Requête Express (headers, body brut, query)
   */
  async verifyWebhook(gatewayId = 'sebpay', req) {
    const adapter = this.getAdapter(gatewayId);
    return await adapter.verifyWebhook(req);
  }

  /**
   * 3. Orchestration complète post-validation du Webhook :
   * Exécutée en tâche asynchrone non-bloquante (setImmediate) pour respecter la règle des 5 secondes de Sebpay :
   * - Exécution du Split financier ACID (Firestore runTransaction)
   * - Contrôle du solde de crédits de communication du vendeur
   * - Envoi du reçu client (SMS Twilio / Email Brevo)
   * - Prélèvement instantané des frais de communication (25 FCFA / 5 FCFA)
   * 
   * @param {object} params
   * @param {admin.firestore.Firestore} params.db
   * @param {string} params.orderId
   * @param {string} params.storeId
   * @param {number} params.totalAmount
   * @param {string} params.transactionId
   * @param {string} params.gateway
   * @param {string} [params.customerPhone]
   * @param {string} [params.customerEmail]
   * @param {string} [params.customerName]
   * @param {string} [params.productTitle]
   * @param {string} [params.storeName]
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

    console.log(`[NANASWITCH ASYNC WORKFLOW] Démarrage du workflow post-paiement pour commande #${orderId} (${totalAmount} FCFA via ${gateway})...`);

    // ────────────────────────────────────────────────────────────────────────
    // ÉTAPE 1 : Split Financier ACID (runTransaction)
    // ────────────────────────────────────────────────────────────────────────
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
      // En cas d'erreur de split, on journalise l'erreur critique
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
      // On continue pour ne pas bloquer les alertes
    }

    // ────────────────────────────────────────────────────────────────────────
    // ÉTAPE 2 : Prélèvement des Frais de Communication & Envoi du Reçu
    // ────────────────────────────────────────────────────────────────────────
    try {
      const commResult = await processPostPaymentCommunication(db, {
        orderId,
        storeId,
        customerPhone,
        customerEmail,
        customerName,
        totalAmount,
        productTitle: productTitle || 'Commande en direct Wameet',
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
