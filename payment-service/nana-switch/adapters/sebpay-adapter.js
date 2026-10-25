/**
 * ==============================================================================
 * NaNaSwitch : Adapter Officiel Passerelle Sebpay (Bénin, Togo, CI, UEMOA)
 * ==============================================================================
 * 
 * - Communication avec Sebpay via IP Statique Fixie (IP Whitelisting)
 * - Validation cryptographique stricte par HMAC-SHA256 (Anti-fraude)
 * - Résolution multi-boutique `${storeId}___${orderId}`
 */

const crypto = require('crypto');
const PaymentGatewayAdapter = require('../gateway-adapter');
const {
  createSebpayCollection,
  getSebpayCollection,
  getSebpayConfigStatus
} = require('../../sebpay-client');

class SebpayAdapter extends PaymentGatewayAdapter {
  constructor() {
    super('sebpay', 'Sebpay Mobile Money & Cartes');
  }

  /**
   * 1. Initialise une demande de paiement auprès de l'API Sebpay
   */
  async initiatePayment(params) {
    const {
      orderId,
      amount,
      currency = 'XOF',
      customerPhone,
      phone,
      customerEmail = 'client@wameet.africa',
      customerName = 'Client Wameet',
      description = 'Commande Wameet / Nanasore Live',
      returnUrl,
      callbackUrl,
      storeId = 'nanasore_central_hub',
      country,
      countryCode,
      operator,
      otpCode,
      metadata = {}
    } = params;

    if (!orderId || !amount || amount <= 0) {
      throw new Error('[SEBPAY INITIATE ERROR] orderId et amount (> 0) sont obligatoires.');
    }

    // Référence composite standardisée pour le multi-tenant : "nanasore_${cleanShopName}___${orderId}"
    const rawShopName = params.shopName || params.storeName || storeId || 'boutique';
    const cleanShopName = String(rawShopName)
      .toLowerCase()
      .replace(/^nanasore_/, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'boutique';

    const externalReference = params.externalReference || params.external_reference || `nanasore_${cleanShopName}___${orderId}`;
    const resolvedPhone = customerPhone || phone || '+22670000000';
    const effectiveOtp = params.otpCode || params.otp || params.otp_code || params.authorization_code || otpCode;

    const sebpayPayload = {
      tenantId: `nanasore_${cleanShopName}`,
      shopName: rawShopName,
      storeName: rawShopName,
      orderId,
      amount: Math.round(Number(amount)),
      currency: currency.toUpperCase(),
      country: country || countryCode,
      phone: resolvedPhone,
      customerPhone: resolvedPhone,
      client_name: customerName,
      client_email: customerEmail || 'client@wameet.africa',
      client_phone: resolvedPhone,
      operator,
      provider: operator,
      operator_code: operator,
      slug: operator,
      otpCode: effectiveOtp,
      otp: effectiveOtp,
      otp_code: effectiveOtp,
      description: description.substring(0, 120),
      external_reference: externalReference,
      externalReference,
      return_url: returnUrl || 'https://pos-app-1759a.web.app/orders',
      callback_url: callbackUrl || process.env.PAYMENT_CALLBACK_URL || 'https://nana-payment-api.onrender.com/webhook/sebpay',
      custom_data: {
        storeId,
        orderId,
        ...metadata
      }
    };

    console.log(`[SEBPAY ADAPTER] Initiation paiement pour commande ${orderId} (${amount} ${currency})...`);
    const sebpayRes = await createSebpayCollection(sebpayPayload);

    // Extraction de l'URL de paiement Sebpay
    const paymentUrl =
      sebpayRes.payment_url ||
      sebpayRes.checkout_url ||
      sebpayRes.url ||
      sebpayRes.data?.payment_url ||
      sebpayRes.data?.checkout_url ||
      sebpayRes.data?.url ||
      `https://checkout.sebpay.bj/pay/${sebpayRes.transaction_id || sebpayRes.data?.transaction_id || orderId}`;

    const transactionId = String(
      sebpayRes.transaction_id ||
      sebpayRes.id ||
      sebpayRes.data?.transaction_id ||
      sebpayRes.data?.id ||
      `seb_${Date.now()}`
    );

    return {
      success: true,
      paymentUrl,
      transactionId,
      reference: externalReference,
      orderId,
      storeId,
      amount: Math.round(Number(amount)),
      currency,
      rawResponse: sebpayRes
    };
  }

  /**
   * 2. Vérification cryptographique de la signature du Webhook Sebpay
   */
  async verifyWebhook(req) {
    const signature =
      req.headers['x-sebpay-signature'] ||
      req.headers['X-SebPay-Signature'] ||
      req.headers['x-webhook-signature'] ||
      req.headers['x-signature-sha256'] ||
      req.query?.signature;

    if (!signature) {
      return {
        isValid: false,
        errorMessage: 'Signature cryptographique X-SebPay-Signature absente des en-têtes.'
      };
    }

    const secretKey = process.env.SEBPAY_WEBHOOK_SECRET || process.env.SEBPAY_SECRET_KEY || process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secretKey) {
      return {
        isValid: false,
        errorMessage: 'Clé secrète SEBPAY_WEBHOOK_SECRET (ou SEBPAY_SECRET_KEY) non configurée sur le serveur.'
      };
    }

    // Récupération du rawBody pour préserver la signature HMAC octet par octet
    const rawBuffer = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})), 'utf8');

    const calculatedHash = crypto.createHmac('sha256', secretKey).update(rawBuffer).digest('hex');

    let isValid = false;
    try {
      const provBuf = Buffer.from(String(signature).trim().toLowerCase(), 'hex');
      const calcBuf = Buffer.from(calculatedHash.toLowerCase(), 'hex');
      if (provBuf.length === calcBuf.length && provBuf.length > 0) {
        isValid = crypto.timingSafeEqual(provBuf, calcBuf);
      } else {
        isValid = String(signature).trim().toLowerCase() === calculatedHash.toLowerCase();
      }
    } catch {
      isValid = String(signature).trim().toLowerCase() === calculatedHash.toLowerCase();
    }

    if (!isValid) {
      return {
        isValid: false,
        errorMessage: 'Signature HMAC invalide. Rejet de la requête pour protection anti-fraude.'
      };
    }

    // Décodage du payload JSON
    let payload = {};
    try {
      payload = JSON.parse(rawBuffer.toString('utf8'));
    } catch {
      payload = typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? req.body : {};
    }

    const txData = payload.data || payload;

    const transactionId = String(
      txData.transaction_id ||
      txData.transactionId ||
      payload.transaction_id ||
      payload.transactionId ||
      txData.id ||
      `tx_${Date.now()}`
    ).trim();

    const externalRef = String(
      txData.external_reference ||
      payload.external_reference ||
      txData.externalReference ||
      payload.externalReference ||
      txData.reference ||
      ''
    ).trim();

    // Décomposition multi-tenant storeId___orderId
    let storeId = 'nanasore_central_hub';
    let orderId = externalRef || transactionId;
    if (externalRef && externalRef.includes('___')) {
      const parts = externalRef.split('___');
      storeId = parts[0] || storeId;
      orderId = parts[1] || orderId;
    }

    const rawStatus = String(txData.status || payload.status || 'SUCCESS').toUpperCase();
    const isPaid = ['SUCCESS', 'COMPLETED', 'PAID', 'VALIDATED', 'CONFIRMED', 'VALIDE', 'PAYÉ'].includes(rawStatus);

    const amount = Number(txData.amount || payload.amount || txData.price || 0);
    const currency = txData.currency || payload.currency || 'XOF';
    const customerPhone = txData.client_phone || txData.phone || payload.client_phone || '';
    const customerEmail = txData.client_email || txData.email || payload.client_email || '';

    return {
      isValid: true,
      transactionId,
      orderId,
      storeId,
      amount,
      currency,
      status: isPaid ? 'PAID' : 'FAILED',
      rawStatus,
      customerPhone,
      customerEmail,
      rawPayload: payload
    };
  }

  /**
   * 3. Vérification du statut d'une transaction auprès de Sebpay
   */
  async checkPaymentStatus(transactionId, externalRef) {
    try {
      const refToQuery = externalRef || transactionId;
      const res = await getSebpayCollection(refToQuery);
      const data = res.data || res;
      const status = String(data.status || 'PENDING').toUpperCase();
      const isPaid = ['SUCCESS', 'COMPLETED', 'PAID', 'VALIDATED'].includes(status);
      return {
        status,
        isPaid,
        amount: Number(data.amount || 0),
        rawData: res
      };
    } catch (err) {
      console.warn(`[SEBPAY CHECK ERROR] Erreur vérification ${transactionId} :`, err.message);
      return {
        status: 'UNKNOWN',
        isPaid: false,
        amount: 0,
        errorMessage: err.message
      };
    }
  }

  getConfigStatus() {
    return {
      ...super.getConfigStatus(),
      ...getSebpayConfigStatus()
    };
  }
}

module.exports = SebpayAdapter;
