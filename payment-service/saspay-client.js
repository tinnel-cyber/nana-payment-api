/**
 * Module Client Réseau Officiel Saspay pour l'API Pont Render
 * Couverture : 24 pays d'Afrique (UEMOA, CEMAC, EAC, CEDEAO)
 * 
 * RÈGLES STRICTES DU PROXY FIXIE POUR SASPAY :
 * 1. ENCAISSEMENT (Pay-In / Collections / Mobile Money & Cartes) :
 *    -> Effectue les appels HTTP/Axios en DIRECT, SANS utiliser le proxy Fixie.
 * 2. DÉCAISSEMENT (Pay-Out / Transfers / Disbursements) :
 *    -> Injecte l'agent Fixie (process.env.FIXIE_URL_SASPAY via HttpsProxyAgent)
 *       UNIQUEMENT sur ces endpoints spécifiques pour respecter la restriction d'IP fixe.
 * 3. Zéro proxy global :
 *    -> Aucun proxy global sur Express ni Node, isolation stricte par requête.
 */

// Neutralisation stricte de tout proxy global pour isoler le reste du serveur
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;
delete process.env.ALL_PROXY;
delete process.env.all_proxy;

const crypto = require('crypto');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { ProxyAgent } = require('undici');
const { getFixieUrlSaspay, getFixieAgentsSaspay } = require('./fixie-proxy');

// URL de base officielle Saspay (configurable via variable d'environnement)
const SASPAY_DEFAULT_BASE_URL = 'https://api.saspay.me/api/v1/';

// Dictionnaire des 24 pays supportés par Saspay avec devise et opérateurs officiels
const SASPAY_SUPPORTED_COUNTRIES = {
  BJ: { name: 'Bénin', currency: 'XOF', prefix: '+229', networks: ['mtn_bj', 'moov_bj', 'celtiis_bj'] },
  BF: { name: 'Burkina Faso', currency: 'XOF', prefix: '+226', networks: ['orange_bf', 'moov_bf', 'wligdicash_bf'] },
  CI: { name: "Côte d'Ivoire", currency: 'XOF', prefix: '+225', networks: ['orange_ci', 'mtn_ci', 'moov_ci', 'wave_ci'] },
  SN: { name: 'Sénégal', currency: 'XOF', prefix: '+221', networks: ['orange_sn', 'wave_sn', 'free_sn', 'emoney_sn'] },
  ML: { name: 'Mali', currency: 'XOF', prefix: '+223', networks: ['orange_ml', 'moov_ml', 'mobicash_ml'] },
  TG: { name: 'Togo', currency: 'XOF', prefix: '+228', networks: ['togocom_tg', 'moov_tg'] },
  NE: { name: 'Niger', currency: 'XOF', prefix: '+227', networks: ['airtel_ne', 'moov_ne', 'zamani_ne', 'nita_ne'] },
  GW: { name: 'Guinée-Bissau', currency: 'XOF', prefix: '+245', networks: ['orange_gw'] },
  CM: { name: 'Cameroun', currency: 'XAF', prefix: '+237', networks: ['orange_cm', 'mtn_cm'] },
  CG: { name: 'Congo', currency: 'XAF', prefix: '+242', networks: ['airtel_cg', 'mtn_cg'] },
  GA: { name: 'Gabon', currency: 'XAF', prefix: '+241', networks: ['airtel_ga', 'moov_ga'] },
  TD: { name: 'Tchad', currency: 'XAF', prefix: '+235', networks: ['airtel_td', 'moov_td'] },
  CF: { name: 'Centrafrique', currency: 'XAF', prefix: '+236', networks: ['orange_cf', 'telecel_cf'] },
  GQ: { name: 'Guinée Équatoriale', currency: 'XAF', prefix: '+240', networks: ['getesa_gq'] },
  CD: { name: 'R.D. Congo', currency: 'CDF', prefix: '+243', networks: ['orange_cd', 'airtel_cd', 'vodacom_cd', 'afrimoney_cd', 'mpesa_cd'] },
  GN: { name: 'Guinée Conakry', currency: 'GNF', prefix: '+224', networks: ['orange_gn', 'mtn_gn'] },
  GH: { name: 'Ghana', currency: 'GHS', prefix: '+233', networks: ['mtn_gh', 'airtel_gh', 'telecel_gh'] },
  NG: { name: 'Nigéria', currency: 'NGN', prefix: '+234', networks: ['mtn_ng', 'airtel_ng'] },
  KE: { name: 'Kenya', currency: 'KES', prefix: '+254', networks: ['mpesa_ke', 'airtel_ke'] },
  UG: { name: 'Ouganda', currency: 'UGX', prefix: '+256', networks: ['mtn_ug', 'airtel_ug'] },
  TZ: { name: 'Tanzanie', currency: 'TZS', prefix: '+255', networks: ['mpesa_tz', 'airtel_tz', 'tigopesa_tz', 'halo_tz'] },
  RW: { name: 'Rwanda', currency: 'RWF', prefix: '+250', networks: ['mtn_rw', 'airtel_rw'] },
  ZM: { name: 'Zambie', currency: 'ZMW', prefix: '+260', networks: ['airtel_zm', 'mtn_zm'] },
  GM: { name: 'Gambie', currency: 'GMD', prefix: '+220', networks: ['afrimoney_gm'] }
};

function getSaspayBaseUrl() {
  const url = process.env.SASPAY_BASE_URL || SASPAY_DEFAULT_BASE_URL;
  return url.endsWith('/') ? url : `${url}/`;
}

/**
 * Retourne le Secret Key Saspay
 */
function getSaspaySecretKey() {
  return process.env.SASPAY_SECRET_KEY || process.env.SASPAY_API_KEY || '';
}

/**
 * Construit les en-têtes officiels Saspay avec Bearer Token et Idempotency-Key
 */
function getSaspayHeaders(customHeaders = {}, idempotencyKey = null) {
  const secretKey = getSaspaySecretKey();
  const headers = {
    'Authorization': `Bearer ${secretKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...customHeaders
  };

  if (idempotencyKey) {
    headers['Idempotency-Key'] = String(idempotencyKey);
  }

  return headers;
}

/**
 * Résout le code réseau officiel Saspay (ex: "orange_ci", "mtn_bj", "wave_ci")
 */
function resolveSaspayNetwork(countryInput, rawOperator) {
  const countryCode = (typeof countryInput === 'object'
    ? (countryInput.country_code || countryInput.code || 'BF')
    : String(countryInput || 'BF')
  ).trim().toUpperCase();

  const cInfo = SASPAY_SUPPORTED_COUNTRIES[countryCode] || SASPAY_SUPPORTED_COUNTRIES.BF;
  const op = String(rawOperator || '').toLowerCase().trim();

  // Si le code contient déjà le pays sous format "operator_country" (ex: "orange_ci")
  if (cInfo.networks.includes(op)) {
    return op;
  }

  const cleanCountry = countryCode.toLowerCase();

  if (op.includes('orange')) return `orange_${cleanCountry}`;
  if (op.includes('moov') || op.includes('flooz')) return `moov_${cleanCountry}`;
  if (op.includes('mtn')) return `mtn_${cleanCountry}`;
  if (op.includes('wave')) return `wave_${cleanCountry}`;
  if (op.includes('celtiis')) return `celtiis_${cleanCountry}`;
  if (op.includes('togocom') || op.includes('tmoney')) return `togocom_${cleanCountry}`;
  if (op.includes('airtel')) return `airtel_${cleanCountry}`;
  if (op.includes('vodacom')) return `vodacom_${cleanCountry}`;
  if (op.includes('mpesa')) return `mpesa_${cleanCountry}`;
  if (op.includes('telecel')) return `telecel_${cleanCountry}`;
  if (op.includes('free')) return `free_${cleanCountry}`;
  if (op.includes('afrimoney')) return `afrimoney_${cleanCountry}`;

  return cInfo.networks[0] || `${op}_${cleanCountry}`;
}

/**
 * Exécute une requête réseau vers l'API Saspay avec respect strict de la stratégie de proxy :
 * - Pay-In (Encaissement) : DIRECT en clair, SANS proxy Fixie
 * - Pay-Out (Décaissement) : VIA le proxy FIXIE_URL_SASPAY pour respecter l'IP Whitelisting
 * 
 * @param {string} endpoint - Endpoint relatif (ex: 'payments/softpay/', 'payouts/initialize/')
 * @param {object} options - Options { method, body, headers, isPayout, idempotencyKey, timeoutMs }
 */
async function callSaspayApi(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    isPayout = false,
    idempotencyKey = null,
    timeoutMs = 25000
  } = options;

  const baseUrl = getSaspayBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const targetUrl = `${baseUrl}${cleanEndpoint}`;

  const secretKey = getSaspaySecretKey();
  if (!secretKey) {
    throw new Error('[SASPAY AUTH ERROR] Clé secrète manquante. Définissez SASPAY_SECRET_KEY sur Render.');
  }

  const reqHeaders = getSaspayHeaders(headers, idempotencyKey);

  const fetchOptions = {
    method,
    headers: reqHeaders,
    signal: AbortSignal.timeout(timeoutMs)
  };

  // STRATÉGIE RÉSEAU STRICTE :
  // Décaissement (Pay-Out) -> PROXY FIXIE (FIXIE_URL_SASPAY)
  // Encaissement (Pay-In) -> DIRECT (aucun proxy)
  const isPayoutCall = Boolean(isPayout || cleanEndpoint.startsWith('payouts'));

  if (isPayoutCall) {
    const { httpsAgent, undiciAgent } = getFixieAgentsSaspay();
    if (httpsAgent) {
      fetchOptions.agent = httpsAgent;
      fetchOptions.httpsAgent = httpsAgent;
      fetchOptions.httpAgent = httpsAgent;
      fetchOptions.proxy = false;
    }
    if (undiciAgent) {
      fetchOptions.dispatcher = undiciAgent;
    }
    console.log(`[SASPAY PAYOUT OUTBOUND] ${method} ${targetUrl} (via Proxy Fixie FIXIE_URL_SASPAY pour IP Whitelisting)...`);
  } else {
    // ENCAISSEMENT (Pay-In) : 100% DIRECT EN CLAIR
    delete fetchOptions.agent;
    delete fetchOptions.httpsAgent;
    delete fetchOptions.httpAgent;
    delete fetchOptions.dispatcher;
    console.log(`[SASPAY PAYIN OUTBOUND] ${method} ${targetUrl} (EN DIRECT SANS PROXY FIXIE)...`);
  }

  if (body && method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(targetUrl, fetchOptions);

  const contentType = response.headers.get('content-type') || '';
  let responseData = null;

  if (contentType.includes('application/json')) {
    responseData = await response.json().catch(() => ({}));
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    const errorMsg = (typeof responseData === 'object' && (responseData.message || responseData.error || responseData.detail))
      ? (responseData.message || responseData.error || responseData.detail)
      : `HTTP ${response.status} ${response.statusText}`;

    console.error(`[SASPAY ERROR] ${method} ${cleanEndpoint} -> HTTP ${response.status}:`, errorMsg);

    const error = new Error(`Erreur Saspay (${response.status}): ${JSON.stringify(errorMsg)}`);
    error.status = response.status;
    error.data = responseData;
    throw error;
  }

  return responseData;
}

/**
 * 1. ENCAISSEMENT (Pay-In / Collections) - EXÉCUTÉ EN DIRECT SANS PROXY FIXIE
 * 
 * Accepte les paiements Mobile Money (Softpay direct push) ou sessions Checkout hébergées.
 * Montant obligatoire sous forme de chaîne décimale ("5000.00").
 */
async function createSaspayPayin(params) {
  const {
    tenantId = 'nanasore_central_hub',
    orderId = `ORD_${Date.now()}`,
    amount,
    currency = 'XOF',
    country = 'BF',
    phone,
    customerPhone,
    customerName,
    operator,
    network,
    description,
    callbackUrl,
    returnUrl,
    customPayload = {},
    type = 'auto' // 'softpay', 'checkout' ou 'auto'
  } = params;

  if (!amount || Number(amount) <= 0) {
    throw new Error('Le montant du paiement est requis et doit être supérieur à 0.');
  }

  // Formatage obligatoire du montant en chaîne décimale (ex: "2500.00")
  const formattedAmount = Number(amount).toFixed(2);
  const effectivePhone = (phone || customerPhone || '').replace(/[^0-9+]/g, '');
  const externalReference = params.externalReference || `${tenantId}___${orderId}`;
  const effectiveCallback = callbackUrl || process.env.PAYMENT_CALLBACK_URL || 'https://nana-payment-api.onrender.com/api/payment/saspay/webhook';

  const resolvedNetwork = network || resolveSaspayNetwork(country, operator);
  const idempotencyKey = params.idempotencyKey || `payin_${orderId}_${Date.now()}`;

  // Détermination du mode : Softpay (Push STK/USSD direct) ou Hosted Checkout Session
  const useSoftpay = type === 'softpay' || (type === 'auto' && Boolean(effectivePhone && resolvedNetwork));

  let endpoint = 'payments/softpay/';
  let payload = {};

  if (useSoftpay) {
    payload = {
      amount: formattedAmount,
      currency: currency.toUpperCase(),
      network: resolvedNetwork,
      phone: effectivePhone,
      description: description || `Paiement ${orderId}`,
      external_reference: externalReference,
      callback_url: effectiveCallback,
      ...customPayload
    };
  } else {
    endpoint = 'checkout/sessions/';
    payload = {
      amount: formattedAmount,
      currency: currency.toUpperCase(),
      description: description || `Commande ${orderId}`,
      external_reference: externalReference,
      customer_name: customerName || 'Client Nanasore',
      customer_phone: effectivePhone,
      callback_url: effectiveCallback,
      return_url: returnUrl || effectiveCallback,
      ...customPayload
    };
  }

  // APPEL EN DIRECT SANS PROXY FIXIE
  const rawResponse = await callSaspayApi(endpoint, {
    method: 'POST',
    body: payload,
    isPayout: false,
    idempotencyKey
  });

  const checkoutUrl = rawResponse?.checkout_url || rawResponse?.payment_url || rawResponse?.data?.checkout_url || null;
  const transactionId = rawResponse?.transaction_id || rawResponse?.id || rawResponse?.data?.id || externalReference;

  return {
    success: true,
    action: checkoutUrl ? 'redirect' : 'pending',
    checkout_url: checkoutUrl,
    redirectUrl: checkoutUrl,
    transaction_id: transactionId,
    external_reference: externalReference,
    amount: Number(amount),
    currency,
    country,
    network: resolvedNetwork,
    data: rawResponse,
    message: rawResponse?.message || (checkoutUrl ? 'Redirection vers la caisse Saspay' : 'Demande de paiement transmise à l\'opérateur')
  };
}

/**
 * 2. DÉCAISSEMENT (Pay-Out / Transfers / Disbursements) - EXÉCUTÉ VIA PROXY FIXIE (FIXIE_URL_SASPAY)
 * 
 * Initialise un transfert de fonds vers un compte Mobile Money avec IP Whitelisting bancaire strict.
 */
async function createSaspayPayout(params) {
  const {
    tenantId = 'nanasore_central_hub',
    payoutId = `POUT_${Date.now()}`,
    amount,
    currency = 'XOF',
    country = 'BF',
    phone,
    beneficiaryPhone,
    beneficiaryName,
    operator,
    network,
    description,
    callbackUrl,
    customPayload = {}
  } = params;

  if (!amount || Number(amount) <= 0) {
    throw new Error('Le montant du transfert est requis et doit être supérieur à 0.');
  }

  const formattedAmount = Number(amount).toFixed(2);
  const effectivePhone = (phone || beneficiaryPhone || '').replace(/[^0-9+]/g, '');
  const externalReference = params.externalReference || `${tenantId}___${payoutId}`;
  const effectiveCallback = callbackUrl || process.env.PAYMENT_CALLBACK_URL || 'https://nana-payment-api.onrender.com/api/payment/saspay/webhook';

  const resolvedNetwork = network || resolveSaspayNetwork(country, operator);
  const idempotencyKey = params.idempotencyKey || `payout_${payoutId}_${Date.now()}`;

  const payload = {
    amount: formattedAmount,
    currency: currency.toUpperCase(),
    network: resolvedNetwork,
    phone: effectivePhone,
    beneficiary_name: beneficiaryName || 'Bénéficiaire Nanasore',
    description: description || `Transfert ${payoutId}`,
    external_reference: externalReference,
    callback_url: effectiveCallback,
    ...customPayload
  };

  // APPEL VIA LE PROXY FIXIE DÉDIÉ SASPAY
  const rawResponse = await callSaspayApi('payouts/initialize/', {
    method: 'POST',
    body: payload,
    isPayout: true, // Force l'injection de FIXIE_URL_SASPAY
    idempotencyKey
  });

  const pId = rawResponse?.payout_id || rawResponse?.id || rawResponse?.data?.id || payoutId;

  return {
    success: true,
    payout_id: pId,
    external_reference: externalReference,
    amount: Number(amount),
    currency,
    country,
    network: resolvedNetwork,
    status: rawResponse?.status || 'PENDING',
    data: rawResponse,
    message: rawResponse?.message || 'Transfert initié avec succès via IP Statique Fixie'
  };
}

/**
 * 3. Vérification d'un encaissement (Pay-In) - DIRECT EN CLAIR
 */
async function verifySaspayPayment(paymentId) {
  if (!paymentId) throw new Error('paymentId requis pour la vérification');
  return await callSaspayApi(`payments/${paymentId}/verify/`, {
    method: 'GET',
    isPayout: false
  });
}

/**
 * 4. Vérification d'un décaissement (Pay-Out) - VIA PROXY FIXIE
 */
async function verifySaspayPayout(payoutId) {
  if (!payoutId) throw new Error('payoutId requis pour la vérification');
  return await callSaspayApi(`payouts/${payoutId}/verify/`, {
    method: 'GET',
    isPayout: true
  });
}

/**
 * 5. Diagnostic de configuration de Saspay
 */
function getSaspayConfigStatus() {
  const secretKey = getSaspaySecretKey();
  const fixieSaspayUrl = getFixieUrlSaspay();

  let maskedKey = null;
  if (secretKey) {
    maskedKey = secretKey.length > 10
      ? `${secretKey.substring(0, 7)}...${secretKey.substring(secretKey.length - 4)}`
      : '***';
  }

  return {
    configured: Boolean(secretKey),
    baseUrl: getSaspayBaseUrl(),
    hasSecretKey: Boolean(secretKey),
    maskedKey,
    supportedCountriesCount: Object.keys(SASPAY_SUPPORTED_COUNTRIES).length,
    networkStrategy: {
      payinMode: 'DIRECT (En clair, sans proxy Fixie)',
      payoutMode: fixieSaspayUrl ? 'PROXY FIXIE_URL_SASPAY (Sortie IP Statique)' : 'DIRECT (FIXIE_URL_SASPAY non défini)'
    },
    fixieSaspayConfigured: Boolean(fixieSaspayUrl),
    timestamp: new Date().toISOString()
  };
}

/**
 * 6. Configuration Axios pour Saspay (avec isolation stricte)
 */
function getSaspayAxiosConfig(options = {}) {
  const isPayout = Boolean(options.isPayout);
  let agent = null;

  if (isPayout) {
    const { httpsAgent } = getFixieAgentsSaspay();
    agent = httpsAgent;
  }

  return {
    baseURL: getSaspayBaseUrl(),
    headers: getSaspayHeaders(options.headers || {}, options.idempotencyKey),
    httpsAgent: agent,
    httpAgent: agent,
    proxy: false,
    timeout: 25000,
    ...options
  };
}

module.exports = {
  SASPAY_DEFAULT_BASE_URL,
  SASPAY_SUPPORTED_COUNTRIES,
  getSaspayBaseUrl,
  getSaspaySecretKey,
  getSaspayHeaders,
  resolveSaspayNetwork,
  callSaspayApi,
  createSaspayPayin,
  createSaspayPayout,
  verifySaspayPayment,
  verifySaspayPayout,
  getSaspayConfigStatus,
  getSaspayAxiosConfig
};
