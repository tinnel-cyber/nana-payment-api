/**
 * ==============================================================================
 * NaNaSwitch : Classe de base abstraite PaymentGatewayAdapter (Design Pattern Adapter)
 * ==============================================================================
 * 
 * Définit le contrat universel que toute passerelle de paiement (Sebpay, Wave,
 * Orange Money, CinetPay, etc.) doit respecter pour être branchée sur NaNaSwitch.
 */

class PaymentGatewayAdapter {
  /**
   * @param {string} id - Identifiant unique de la passerelle (ex: 'sebpay', 'wave')
   * @param {string} name - Nom d'affichage officiel (ex: 'Sebpay Mobile Money', 'Wave CI/SN')
   */
  constructor(id, name) {
    if (new.target === PaymentGatewayAdapter) {
      throw new TypeError("Impossible d'instancier directement la classe abstraite PaymentGatewayAdapter.");
    }
    this.id = id;
    this.name = name;
  }

  /**
   * 1. Initialise une transaction de paiement et génère l'URL de paiement client
   * @param {object} params
   * @param {string} params.orderId - Identifiant unique de la commande
   * @param {number} params.amount - Montant en F CFA
   * @param {string} params.currency - Devise (ex: 'XOF')
   * @param {string} params.customerPhone - Numéro Mobile Money client
   * @param {string} params.customerEmail - Email du client
   * @param {string} params.customerName - Nom du client
   * @param {string} params.description - Libellé affiché sur la page de paiement
   * @param {string} params.returnUrl - URL de redirection après paiement
   * @param {string} params.callbackUrl - URL du webhook appelée par l'opérateur
   * @param {string} params.storeId - Identifiant de la boutique vendeuse
   * @param {object} params.metadata - Données contextuelles arbitraires
   * @returns {Promise<{ success: boolean, paymentUrl: string, transactionId: string, reference: string, rawResponse?: object }>}
   */
  async initiatePayment(params) {
    throw new Error(`La méthode initiatePayment() doit être implémentée par l'adapter ${this.id}`);
  }

  /**
   * 2. Vérifie la validité cryptographique du webhook entrant de la passerelle
   * @param {object} req - Objet requête Express (headers, body brut, query)
   * @returns {Promise<{ isValid: boolean, transactionId: string, orderId: string, amount: number, currency: string, status: 'PAID'|'FAILED'|'PENDING', rawPayload: object, errorMessage?: string }>}
   */
  async verifyWebhook(req) {
    throw new Error(`La méthode verifyWebhook() doit être implémentée par l'adapter ${this.id}`);
  }

  /**
   * 3. Vérifie le statut d'une transaction directement auprès de l'API de la passerelle
   * @param {string} transactionId - Référence ou ID de transaction de la passerelle
   * @param {string} externalRef - Référence externe de commande
   * @returns {Promise<{ status: string, isPaid: boolean, amount: number, rawData?: object }>}
   */
  async checkPaymentStatus(transactionId, externalRef) {
    throw new Error(`La méthode checkPaymentStatus() doit être implémentée par l'adapter ${this.id}`);
  }

  /**
   * Diagnostic de santé et de configuration des clés de la passerelle
   * @returns {object} { isConfigured: boolean, details: object }
   */
  getConfigStatus() {
    return {
      id: this.id,
      name: this.name,
      isConfigured: true
    };
  }
}

module.exports = PaymentGatewayAdapter;
