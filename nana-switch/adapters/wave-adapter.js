/**
 * ==============================================================================
 * NaNaSwitch : Adapter Passerelle Wave Mobile Money (Côte d'Ivoire & Sénégal)
 * ==============================================================================
 * 
 * Démontre l'architecture modulaire "Pont Multi-Passerelles" (Design Pattern Strategy).
 * Permet de basculer instantanément ou d'ajouter Wave sans modifier le code métier.
 */

const PaymentGatewayAdapter = require('../gateway-adapter');

class WaveAdapter extends PaymentGatewayAdapter {
  constructor() {
    super('wave', 'Wave Mobile Money 0% frais');
  }

  async initiatePayment(params) {
    const { orderId, amount, currency = 'XOF', customerPhone, storeId } = params;

    const waveCheckoutUrl = `https://pay.wave.com/c/mock-wave-${orderId}?amount=${amount}&currency=${currency}`;
    const transactionId = `wave_tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    return {
      success: true,
      paymentUrl: waveCheckoutUrl,
      transactionId,
      reference: orderId,
      storeId,
      amount: Math.round(Number(amount)),
      currency,
      rawResponse: { provider: 'wave', status: 'INITIATED' }
    };
  }

  async verifyWebhook(req) {
    const waveSignature = req.headers['wave-signature'] || req.headers['x-wave-signature'];
    const payload = req.body || {};

    // Mode permissif en développement si signature absente pour simulation
    const isLocalDev = process.env.NODE_ENV !== 'production';
    if (!waveSignature && !isLocalDev) {
      return {
        isValid: false,
        errorMessage: 'En-tête wave-signature manquant.'
      };
    }

    const txId = payload.id || `wave_${Date.now()}`;
    const orderId = payload.client_reference || payload.orderId || `ORD_${Date.now()}`;
    const amount = Number(payload.amount || 0);

    return {
      isValid: true,
      transactionId: txId,
      orderId,
      storeId: payload.storeId || 'nanasore_central_hub',
      amount,
      currency: payload.currency || 'XOF',
      status: 'PAID',
      rawPayload: payload
    };
  }

  async checkPaymentStatus(transactionId) {
    return {
      status: 'SUCCESS',
      isPaid: true,
      amount: 0
    };
  }
}

module.exports = WaveAdapter;
