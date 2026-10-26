/**
 * Module Client Réseau Officiel SasPay pour l'API Pont Render
 * Référence officielle : https://api.saspay.me/api/v1 (OpenAPI 3.1 & /llms.txt)
 * Couverture : 24 pays d'Afrique (UEMOA, CEMAC, EAC, CEDEAO)
 * 
 * RÈGLES STRICTES D'ARCHITECTURE & SÉCURITÉ SASPAY :
 * 1. Gestion des clés :
 *    - SASPAY_API_KEY lue exclusivement depuis l'environnement (sk_test_... ou sk_live_...).
 *    - Jamais de clé en dur, jamais exposée au frontend ou dans les logs.
 *    - En-tête : Authorization: Bearer <SASPAY_API_KEY>
 * 
 * 2. Stratégie Réseau & Proxy Fixie :
 *    - ENCAISSEMENT (Pay-In / Softpay / Checkout-Sessions) :
 *      -> Exécuté en DIRECT en clair, SANS proxy Fixie (SasPay n'exige pas d'IP fixe pour l'encaissement).
 *    - DÉCAISSEMENT (Pay-Out / Retraits / Transferts) :
 *      -> Exécuté obligatoirement via le proxy Fixie (process.env.FIXIE_URL_SASPAY via HttpsProxyAgent)
 *         pour satisfaire l'IP Whitelisting et éviter l'erreur 403 ip_not_whitelisted.
 *    - Health Check (/health) :
 *      -> Réponse 100% locale en HTTP 200 sans aucun appel externe ni proxy.
 * 
 * 3. Données financières :
 *    - Montants : TOUJOURS en chaînes décimales ("2500.00"), jamais de flottants.
 *    - Idempotence : En-tête Idempotency-Key obligatoire sur toutes les routes de mouvement de fonds.
 *    - Frais : Comptabilisation via charged et net_amount.
 * 
 * 4. Règle absolue de livraison :
 *    - Ne JAMAIS livrer sur une simple redirection ou un statut PENDING.
 *    - Livraison conditionnée exclusivement au statut SUCCESS validé par GET /payments/{id}/verify/
 *      ou par un webhook signé avec contrôle d'unicité en base de données.
 * 
 * 5. Sécurisation Webhook :
 *    - Timestamp max 300s.
 *    - HMAC-SHA256 sur corps brut : f"{timestamp}.{raw_body}".
 *    - Comparaison à temps constant via crypto.timingSafeEqual.
 */

// Suppression stricte de toute variable de proxy global pour isoler le reste du serveur
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

// Clients HTTP permissifs de secours
let axiosClient = null;
try {
  axiosClient = require('axios');
} catch {
  axiosClient = null;
}

let nodeFetchClient = null;
try {
  nodeFetchClient = require('node-fetch');
} catch {
  nodeFetchClient = null;
}

// URL de base officielle SasPay
const SASPAY_DEFAULT_BASE_URL = 'https://api.saspay.me/api/v1/';

// Catalogue des 24 pays supportés par SasPay
const SASPAY_SUPPORTED_COUNTRIES = {
  BJ: { name: 'Bénin', currency: 'XOF', prefix: '+229', networks: ['mtn_bj', 'moov_bj', 'celtiis_bj'] },
  BF: { name: 'Burkina Faso', currency: 'XOF', prefix: '+226', networks: ['orange_bf', 'moov_bf', 'wligdicash_bf'] },
  CI: { name: "Côte d'Ivoire", currency: 'XOF', prefix: '+225', networks: ['orange_ci', 'mtn_ci', 'moov_ci', 'wave_ci', 'djamo_ci'] },
  SN: { name: 'Sénégal', currency: 'XOF', prefix: '+221', networks: ['orange_sn', 'wave_sn', 'free_sn', 'emoney_sn'] },
  ML: { name: 'Mali', currency: 'XOF', prefix: '+223', networks: ['orange_ml', 'moov_ml', 'mobicash_ml'] },
  TG: { name: 'Togo', currency: 'XOF', prefix: '+228', networks: ['togocom_tg', 'moov_tg'] },
  NE: { name: 'Niger', currency: 'XOF', prefix: '+227', networks: ['airtel_ne', 'moov_ne', 'zamani_ne', 'nita_ne', 'wligdicash_ne'] },
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
 * Récupération sécurisée de la clé API SasPay
 * Supporte SASPAY_API_KEY et SASPAY_SECRET_KEY
 */
function getSaspayApiKey() {
  return process.env.SASPAY_API_KEY || process.env.SASPAY_SECRET_KEY || '';
}

/**
 * Formatage strict du montant en chaîne décimale à 2 chiffres ("2500.00")
 * Interdiction formelle des flottants ou entiers bruts non décimaux
 */
function formatSaspayAmount(amount) {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) {
    throw new Error(`Montant invalide pour SasPay : "${amount}". Un nombre positif est requis.`);
  }
  return num.toFixed(2);
}

/**
 * Formate le numéro de téléphone au format international requis par SasPay (avec '+' et indicatif pays)
 * Exemple : '65565805', '22665565805', '+226 65 56 58 05' -> '+22665565805'
 * 
 * @param {string|number} phone - Numéro de téléphone brut
 * @param {string} [countryCode='BF'] - Code ISO du pays (ex: 'BF', 'CI', 'BJ')
 * @returns {string} Numéro international avec '+' (ex: '+22665565805')
 */
function formatSaspayInternationalPhone(phone, countryCode = 'BF') {
  if (!phone) return '';
  const clean = String(phone).trim().replace(/\s+/g, '');
  const iso = String(countryCode || 'BF').toUpperCase();
  const cInfo = SASPAY_SUPPORTED_COUNTRIES[iso] || SASPAY_SUPPORTED_COUNTRIES.BF;
  const prefix = cInfo.prefix; // ex: '+226'
  const prefixDigits = prefix.replace('+', ''); // '226'

  let digits = clean.replace(/\D/g, '');

  // Supprimer l'indicatif international '00' s'il est présent (ex: 00226... -> 226...)
  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }

  if (digits.startsWith(prefixDigits)) {
    return `+${digits}`;
  }

  if (iso === 'BF' && digits.length === 8) {
    return `+226${digits}`;
  }

  if (clean.startsWith('+')) {
    return clean.replace(/[^0-9+]/g, '');
  }

  return `${prefix}${digits}`;
}

/**
 * Génère ou valide une clé d'idempotence UUID v4
 */
function getOrGenerateIdempotencyKey(key) {
  if (key && typeof key === 'string' && key.trim().length > 0) {
    return key.trim();
  }
  return crypto.randomUUID ? crypto.randomUUID() : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Construit les en-têtes HTTP officiels SasPay
 */
function getSaspayHeaders(customHeaders = {}, idempotencyKey = null) {
  const apiKey = getSaspayApiKey();
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
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
 * Résout le code réseau officiel SasPay (ex: "orange_ci", "mtn_bj", "wave_ci")
 */
function resolveSaspayNetwork(countryInput, rawOperator) {
  const countryCode = (typeof countryInput === 'object'
    ? (countryInput.country_code || countryInput.code || 'BF')
    : String(countryInput || 'BF')
  ).trim().toUpperCase();

  const cInfo = SASPAY_SUPPORTED_COUNTRIES[countryCode] || SASPAY_SUPPORTED_COUNTRIES.BF;
  const op = String(rawOperator || '').toLowerCase().trim();

  // Si le code contient déjà le format exact "operator_country"
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
  if (op.includes('djamo')) return `djamo_${cleanCountry}`;
  if (op.includes('ligdicash')) return `wligdicash_${cleanCountry}`;
  if (op.includes('zamani')) return `zamani_${cleanCountry}`;

  return cInfo.networks[0] || `${op}_${cleanCountry}`;
}

/**
 * Exécute une requête réseau vers l'API SasPay
 * 
 * STRATÉGIE RÉSEAU STRICTE :
 * - Pay-In (Encaissement) -> 100% DIRECT EN CLAIR (SANS PROXY FIXIE)
 * - Pay-Out (Décaissement / Retraits) -> PROXY FIXIE (FIXIE_URL_SASPAY) pour satisfaire l'IP Whitelisting
 * 
 * GESTION DES CODES D'ERREUR OFFICIELS SASPAY :
 * - 400 : Requête mal formée
 * - 401 : Clé API absente ou invalide (ne pas retenter)
 * - 403 : Compte suspendu ou IP non whitelistée (ip_not_whitelisted)
 * - 404 : Ressource introuvable
 * - 409 : Conflit d'idempotence ou état
 * - 422 : Erreur métier (insufficient_balance, currency_country_mismatch)
 * - 429 : Rate limit atteint (300 req/min), espacer les appels
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

  const apiKey = getSaspayApiKey();
  if (!apiKey) {
    throw new Error('[SASPAY CONFIG ERROR] Clé API SasPay manquante. Définissez SASPAY_API_KEY ou SASPAY_SECRET_KEY.');
  }

  const reqHeaders = getSaspayHeaders(headers, idempotencyKey);

  const fetchOptions = {
    method,
    headers: reqHeaders,
    signal: AbortSignal.timeout(timeoutMs)
  };

  // Décaissement (Pay-Out) -> Injecte Fixie (SASPAY_FIXIE_URL en priorité)
  // Encaissement (Pay-In) -> Direct en clair
  const isPayoutCall = Boolean(isPayout || cleanEndpoint.startsWith('payouts') || cleanEndpoint.startsWith('wallet-transfers') || options.forceFixie);

  if (isPayoutCall) {
    const txId = options.transactionId || options.idempotencyKey || idempotencyKey || 'SASPAY_OUTBOUND';
    const { httpsAgent, undiciAgent, variableName } = getFixieAgentsSaspay({
      transactionId: txId,
      forceAlternate: Boolean(options.forceAlternateProxy)
    });
    if (httpsAgent) {
      fetchOptions.agent = httpsAgent;
      fetchOptions.httpsAgent = httpsAgent;
      fetchOptions.httpAgent = httpsAgent;
      fetchOptions.proxy = false;
    }
    if (undiciAgent) {
      fetchOptions.dispatcher = undiciAgent;
    }
    console.log(`[SASPAY PAYOUT OUTBOUND] ${method} ${targetUrl} (via Proxy Fixie [${variableName}] pour IP Whitelisting)...`);
  } else {
    // ENCAISSEMENT : 100% DIRECT EN CLAIR
    delete fetchOptions.agent;
    delete fetchOptions.httpsAgent;
    delete fetchOptions.httpAgent;
    delete fetchOptions.dispatcher;
    console.log(`[SASPAY PAYIN OUTBOUND] ${method} ${targetUrl} (EN DIRECT SANS PROXY FIXIE)...`);
  }

  if (body && method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  // Pour les décaissements (Pay-Outs) passant par le proxy Fixie, exécuter via le client permissif éprouvé
  // (Axios / node-fetch avec https-proxy-agent) pour éliminer l'erreur Undici 407.
  if (isPayoutCall && fetchOptions.agent && (axiosClient || nodeFetchClient)) {
    if (axiosClient) {
      const axiosRes = await axiosClient({
        url: targetUrl,
        method,
        headers: reqHeaders,
        data: body,
        httpsAgent: fetchOptions.agent,
        httpAgent: fetchOptions.agent,
        proxy: false,
        timeout: timeoutMs,
        validateStatus: () => true
      });
      if (axiosRes.status < 200 || axiosRes.status >= 300) {
        const err = new Error(`Erreur Saspay (${axiosRes.status}): ${JSON.stringify(axiosRes.data)}`);
        err.status = axiosRes.status;
        err.data = axiosRes.data;
        throw err;
      }
      return axiosRes.data;
    }
    if (nodeFetchClient) {
      const nfRes = await nodeFetchClient(targetUrl, {
        method,
        headers: reqHeaders,
        body: (body && method !== 'GET' && method !== 'HEAD') ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
        agent: fetchOptions.agent,
        timeout: timeoutMs
      });
      const ct = nfRes.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await nfRes.json().catch(() => ({})) : await nfRes.text();
      if (!nfRes.ok) {
        const err = new Error(`Erreur Saspay (${nfRes.status}): ${JSON.stringify(data)}`);
        err.status = nfRes.status;
        err.data = data;
        throw err;
      }
      return data;
    }
  }

  let response;
  try {
    response = await fetch(targetUrl, fetchOptions);
  } catch (fetchErr) {
    const errMsg = String(fetchErr.message || '') + ' ' + String(fetchErr.cause?.message || '');
    const isProxyTunnelError =
      fetchErr.name === 'RequestAbortedError' ||
      fetchErr.name === 'AbortError' ||
      errMsg.includes('407') ||
      errMsg.includes('HTTP Tunneling') ||
      errMsg.includes('Proxy response') ||
      errMsg.includes('fetch failed');

    if (isProxyTunnelError && isPayoutCall && fetchOptions.agent) {
      console.warn(`[SASPAY FALLBACK] Échec du tunneling Undici ProxyAgent (407). Basculement automatique vers le client permissif https-proxy-agent / axios... Cause : ${errMsg}`);
      if (axiosClient) {
        const axiosRes = await axiosClient({
          url: targetUrl,
          method,
          headers: reqHeaders,
          data: body,
          httpsAgent: fetchOptions.agent,
          httpAgent: fetchOptions.agent,
          proxy: false,
          timeout: timeoutMs,
          validateStatus: () => true
        });
        if (axiosRes.status < 200 || axiosRes.status >= 300) {
          const err = new Error(`Erreur Saspay (${axiosRes.status}): ${JSON.stringify(axiosRes.data)}`);
          err.status = axiosRes.status;
          err.data = axiosRes.data;
          throw err;
        }
        return axiosRes.data;
      }
      if (nodeFetchClient) {
        const nfRes = await nodeFetchClient(targetUrl, {
          method,
          headers: reqHeaders,
          body: (body && method !== 'GET' && method !== 'HEAD') ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
          agent: fetchOptions.agent,
          timeout: timeoutMs
        });
        const ct = nfRes.headers.get('content-type') || '';
        const data = ct.includes('application/json') ? await nfRes.json().catch(() => ({})) : await nfRes.text();
        if (!nfRes.ok) {
          const err = new Error(`Erreur Saspay (${nfRes.status}): ${JSON.stringify(data)}`);
          err.status = nfRes.status;
          err.data = data;
          throw err;
        }
        return data;
      }
    }
    throw fetchErr;
  }

  const contentType = response.headers.get('content-type') || '';
  let responseData = null;

  if (contentType.includes('application/json')) {
    responseData = await response.json().catch(() => ({}));
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = typeof responseData === 'object' ? responseData : JSON.parse(responseData);
    } catch {
      errorData = { raw: responseData };
    }

    const errorMsg = errorData?.error?.message || errorData?.message || errorData?.detail || `HTTP ${response.status} ${response.statusText}`;

    if (response.status === 401) {
      console.error('[SASPAY 401 UNAUTHORIZED] Clé API invalide, expirée ou absente. Ne pas retenter.');
    } else if (response.status === 403) {
      if (JSON.stringify(errorData).includes('ip_not_whitelisted')) {
        console.error('[SASPAY 403 IP NOT WHITELISTED] L\'IP de sortie du serveur n\'est pas whitelistée dans le dashboard SasPay. Vérifiez FIXIE_URL_SASPAY.');
      } else {
        console.error('[SASPAY 403 FORBIDDEN] Accès refusé ou scope insuffisant pour cette clé API.');
      }
    } else if (response.status === 409) {
      console.error('[SASPAY 409 CONFLICT] Conflit d\'idempotence (requête encore en cours ou même clé avec corps différent).');
    } else if (response.status === 422) {
      console.error(`[SASPAY 422 UNPROCESSABLE ENTITY] Erreur métier (ex: solde insuffisant, incohérence devise/pays) : ${errorMsg}`);
    } else if (response.status === 429) {
      console.warn('[SASPAY 429 RATE LIMIT] Limite de débit atteinte (300 req/min). Espacer les appels.');
    }

    const error = new Error(`Erreur Saspay (${response.status}): ${typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}`);
    error.status = response.status;
    error.code = errorData?.error?.code || response.status;
    error.data = errorData;
    throw error;
  }

  return responseData;
}

/**
 * 1. ENCAISSEMENT (Pay-In) — EXÉCUTÉ EN DIRECT SANS PROXY FIXIE
 * 
 * Deux flux selon la spécification OpenAPI :
 * - Softpay : POST /payments/softpay/ (Push direct USSD/STK)
 * - Hosted Checkout : POST /checkout-sessions/ (Page hébergée)
 * 
 * Règle checkout_url :
 * Si checkout_url est non vide (Wave, Orange Money, Cartes, Djamo), l'application
 * doit rediriger le client vers cette URL pour finaliser l'opération.
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
    customerEmail = 'client@nanasore.com',
    customerName = 'Client Nanasore',
    operator,
    network,
    description,
    returnUrl,
    feeChargeMode = 'ADD_ON', // 'ADD_ON' (le payeur paie les frais) ou 'DEDUCTED'
    customPayload = {},
    type = 'auto' // 'softpay', 'checkout' ou 'auto'
  } = params;

  // Formatage obligatoire du montant en chaîne décimale ("2500.00")
  const formattedAmount = formatSaspayAmount(amount);
  const countryIso = String(country || 'BF').trim().toUpperCase();
  const formattedPhone = formatSaspayInternationalPhone(phone || customerPhone, countryIso);
  const effectivePhone = formattedPhone;

  // Nettoyage standardisé du nom de la boutique pour qu'il soit propre dans l'external_reference
  const rawShopName = params.shopName || params.storeName || tenantId || 'boutique';
  const cleanShopName = String(rawShopName)
    .toLowerCase()
    .replace(/^nanasore_/, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'boutique';

  const externalReference = params.externalReference || params.external_reference || `nanasore_${cleanShopName}___${orderId}`;

  const resolvedNetwork = network || resolveSaspayNetwork(countryIso, operator);
  const idempotencyKey = getOrGenerateIdempotencyKey(params.idempotencyKey);

  // Découpage nom client pour l'objet customer requis (first_name et last_name obligatoires)
  const cleanName = (customerName || '').trim() || 'Client Nanasore';
  const nameParts = cleanName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'Client';
  const lastName = nameParts.slice(1).join(' ') || 'Nanasore';

  // Sécurisation stricte du format email (requis string<email>)
  const cleanEmail = (customerEmail && typeof customerEmail === 'string' && customerEmail.includes('@'))
    ? customerEmail.trim()
    : 'client@nanasore.com';

  const useSoftpay = type === 'softpay' || (type === 'auto' && Boolean(effectivePhone && resolvedNetwork));

  let endpoint = 'payments/softpay/';
  let payload = {};

  if (useSoftpay) {
    const effectiveOtp = (params.otp || params.otpCode || params.otp_code || '').toString().trim();
    payload = {
      amount: formattedAmount,
      currency: currency.toUpperCase(),
      country: countryIso,
      network: resolvedNetwork,
      description: description || `Paiement ${orderId}`,
      customer: {
        email: cleanEmail,
        first_name: firstName,
        last_name: lastName,
        phone: effectivePhone
      },
      fee_charge_mode: feeChargeMode,
      ...(effectiveOtp ? { otp: effectiveOtp } : {}),
      metadata: {
        order_id: orderId,
        tenant_id: tenantId,
        external_reference: externalReference,
        ...(customPayload.metadata || {})
      },
      ...customPayload
    };
  } else {
    // Route officielle spécification OpenAPI : POST /checkout-sessions/
    endpoint = 'checkout-sessions/';
    payload = {
      amount: formattedAmount,
      currency: currency.toUpperCase(),
      country: countryIso,
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: effectivePhone || undefined,
      description: description || `Commande ${orderId}`,
      return_url: returnUrl,
      fee_charge_mode: feeChargeMode,
      metadata: {
        order_id: orderId,
        tenant_id: tenantId,
        external_reference: externalReference,
        ...(customPayload.metadata || {})
      },
      ...customPayload
    };
  }

  // APPEL DIRECT EN CLAIR SANS PROXY FIXIE
  const rawResponse = await callSaspayApi(endpoint, {
    method: 'POST',
    body: payload,
    isPayout: false,
    idempotencyKey
  });

  const responseData = rawResponse?.data || rawResponse;
  const checkoutUrl = responseData?.checkout_url || rawResponse?.checkout_url || null;
  const transactionId = responseData?.id || rawResponse?.id || rawResponse?.transaction_id || externalReference;

  // Calcul comptable : charged (déboursé payeur) vs net_amount (revenu net marchand)
  const chargedAmount = Number(responseData?.charged || responseData?.amount || amount);
  const netAmount = Number(responseData?.net_amount || responseData?.amount || amount);

  return {
    success: true,
    action: checkoutUrl ? 'redirect' : 'pending',
    checkout_url: checkoutUrl,
    redirectUrl: checkoutUrl,
    transaction_id: transactionId,
    id: transactionId,
    external_reference: externalReference,
    amount: Number(amount),
    charged: chargedAmount,
    net_amount: netAmount,
    currency: currency.toUpperCase(),
    country: countryIso,
    network: resolvedNetwork,
    status: responseData?.status || 'PENDING',
    data: responseData,
    message: rawResponse?.message || (checkoutUrl ? 'Redirection vers la passerelle opérateur' : 'Demande de paiement transmise à l\'opérateur')
  };
}

/**
 * 2. DÉCAISSEMENT (Pay-Out / Retraits) — EXÉCUTÉ OBLIGATOIREMENT VIA PROXY FIXIE (FIXIE_URL_SASPAY)
 * 
 * Spécification OpenAPI : POST /payouts/initialize/
 * Requiert une IP whitelistée (fournie par le proxy Fixie).
 * Devise et pays doivent strictement concorder (ex: XOF + BJ).
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
    beneficiaryName = 'Bénéficiaire Nanasore',
    customerEmail = 'finance@nanasore.com',
    operator,
    network,
    description,
    feeChargeMode = 'DEDUCTED',
    customPayload = {}
  } = params;

  const formattedAmount = formatSaspayAmount(amount);
  const countryIso = String(country || 'BF').trim().toUpperCase();
  const formattedPhone = formatSaspayInternationalPhone(phone || beneficiaryPhone, countryIso);
  const effectivePhone = formattedPhone;

  const rawShopName = params.shopName || params.storeName || tenantId || 'boutique';
  const cleanShopName = String(rawShopName)
    .toLowerCase()
    .replace(/^nanasore_/, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'boutique';

  const externalReference = params.externalReference || params.external_reference || `nanasore_${cleanShopName}___${payoutId}`;

  const resolvedNetwork = network || resolveSaspayNetwork(countryIso, operator);
  const idempotencyKey = getOrGenerateIdempotencyKey(params.idempotencyKey);

  const nameParts = beneficiaryName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Bénéficiaire';
  const lastName = nameParts.slice(1).join(' ') || 'Nanasore';

  const payload = {
    amount: formattedAmount,
    currency: currency.toUpperCase(),
    country: countryIso,
    method: resolvedNetwork,
    customer: {
      email: customerEmail,
      first_name: firstName,
      last_name: lastName,
      phone: effectivePhone
    },
    recipient: {
      msisdn: effectivePhone,
      name: beneficiaryName
    },
    fee_charge_mode: feeChargeMode,
    description: description || `Transfert ${payoutId}`,
    metadata: {
      payout_id: payoutId,
      tenant_id: tenantId,
      external_reference: externalReference,
      ...(customPayload.metadata || {})
    },
    ...customPayload
  };

  // APPEL VIA LE PROXY FIXIE DÉDIÉ SASPAY
  const rawResponse = await callSaspayApi('payouts/initialize/', {
    method: 'POST',
    body: payload,
    isPayout: true, // Force l'injection du proxy FIXIE_URL_SASPAY
    idempotencyKey
  });

  const responseData = rawResponse?.data || rawResponse;
  const pId = responseData?.id || rawResponse?.payout_id || payoutId;

  return {
    success: true,
    payout_id: pId,
    id: pId,
    external_reference: externalReference,
    amount: Number(amount),
    charged: Number(responseData?.charged || responseData?.amount || amount),
    net_amount: Number(responseData?.net_amount || responseData?.amount || amount),
    currency: currency.toUpperCase(),
    country: countryIso,
    network: resolvedNetwork,
    status: responseData?.status || 'PENDING',
    data: responseData,
    message: rawResponse?.message || 'Transfert initié avec succès via IP Statique Fixie'
  };
}

/**
 * 3. Vérification de paiement (Pay-In) — GET /payments/{payment_id}/verify/
 * Exécuté en DIRECT SANS PROXY FIXIE
 * Règle : Seul le statut SUCCESS autorise la livraison du produit/service.
 */
async function verifySaspayPayment(paymentId) {
  if (!paymentId) throw new Error('paymentId requis pour la vérification');
  const rawResponse = await callSaspayApi(`payments/${paymentId}/verify/`, {
    method: 'GET',
    isPayout: false
  });

  const data = rawResponse?.data || rawResponse;
  const status = String(data?.status || 'PENDING').toUpperCase();
  const isSuccess = status === 'SUCCESS';

  return {
    success: isSuccess,
    status,
    isPaid: isSuccess,
    payment_id: paymentId,
    id: paymentId,
    amount: Number(data?.amount || 0),
    charged: Number(data?.charged || data?.amount || 0),
    net_amount: Number(data?.net_amount || data?.amount || 0),
    currency: data?.currency || 'XOF',
    data,
    canDeliver: isSuccess // Seul SUCCESS autorise la livraison
  };
}

/**
 * 4. Vérification de décaissement (Pay-Out) — GET /payouts/{payout_id}/verify/
 * Exécuté VIA PROXY FIXIE (FIXIE_URL_SASPAY)
 */
async function verifySaspayPayout(payoutId) {
  if (!payoutId) throw new Error('payoutId requis pour la vérification');
  const rawResponse = await callSaspayApi(`payouts/${payoutId}/verify/`, {
    method: 'GET',
    isPayout: true
  });

  const data = rawResponse?.data || rawResponse;
  const status = String(data?.status || 'PENDING').toUpperCase();

  return {
    success: status === 'SUCCESS',
    status,
    payout_id: payoutId,
    id: payoutId,
    amount: Number(data?.amount || 0),
    net_amount: Number(data?.net_amount || data?.amount || 0),
    currency: data?.currency || 'XOF',
    data
  };
}

/**
 * 5. Vérification cryptographique de la signature Webhook SasPay
 * Spécification :
 * - Horodatage X-Webhook-Timestamp dans une fenêtre de 300 secondes
 * - Signature HMAC SHA-256 en hexadécimal sur le message f"{timestamp}.{raw_body}"
 * - Comparaison sécurisée en temps constant via crypto.timingSafeEqual
 * 
 * @param {object} params { rawBody, signature, timestamp, secret }
 * @returns {object} { valid: boolean, reason: string|null }
 */
function verifySaspayWebhookSignature({ rawBody, signature, timestamp, secret }) {
  if (!signature) {
    return { valid: false, reason: 'missing_signature' };
  }
  if (!timestamp) {
    return { valid: false, reason: 'missing_timestamp' };
  }

  // 1. Contrôle anti-rejeu : fenêtre stricte de 300 secondes
  const nowSec = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(nowSec - ts) > 300) {
    return { valid: false, reason: 'timestamp_drift_exceeded_300s' };
  }

  const signingSecret = secret || process.env.SASPAY_WEBHOOK_SECRET;
  if (!signingSecret) {
    console.warn('[SASPAY WEBHOOK WARNING] Variable SASPAY_WEBHOOK_SECRET non définie.');
    return { valid: false, reason: 'server_secret_not_configured' };
  }

  // 2. Signature calculée sur Buffer : f"{timestamp}." + rawBody
  const rawBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody || '', 'utf8');
  const signedBuffer = Buffer.concat([Buffer.from(`${timestamp}.`, 'utf8'), rawBuffer]);
  const expectedHash = crypto.createHmac('sha256', signingSecret).update(signedBuffer).digest('hex').toLowerCase();

  const cleanSignature = String(signature).trim().toLowerCase();

  // 3. Comparaison à temps constant
  let isValid = false;
  try {
    const provBuf = Buffer.from(cleanSignature, 'hex');
    const expBuf = Buffer.from(expectedHash, 'hex');
    if (provBuf.length === expBuf.length && provBuf.length > 0) {
      isValid = crypto.timingSafeEqual(provBuf, expBuf);
    }
  } catch {
    isValid = false;
  }

  return {
    valid: isValid,
    reason: isValid ? null : 'signature_mismatch'
  };
}

/**
 * 6. Diagnostic de configuration de SasPay
 */
function getSaspayConfigStatus() {
  const apiKey = getSaspayApiKey();
  const fixieSaspayUrl = getFixieUrlSaspay();

  let maskedKey = null;
  if (apiKey) {
    maskedKey = apiKey.length > 10
      ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
      : '***';
  }

  return {
    configured: Boolean(apiKey),
    environment: apiKey.startsWith('sk_live_') ? 'production' : (apiKey.startsWith('sk_test_') ? 'sandbox' : 'unknown'),
    baseUrl: getSaspayBaseUrl(),
    hasApiKey: Boolean(apiKey),
    maskedApiKey: maskedKey,
    hasWebhookSecret: Boolean(process.env.SASPAY_WEBHOOK_SECRET),
    supportedCountriesCount: Object.keys(SASPAY_SUPPORTED_COUNTRIES).length,
    networkStrategy: {
      payinMode: 'DIRECT (En clair, sans proxy Fixie)',
      payoutMode: fixieSaspayUrl ? 'PROXY FIXIE_URL_SASPAY (IP Whitelistée)' : 'DIRECT (FIXIE_URL_SASPAY non défini)'
    },
    fixieSaspayConfigured: Boolean(fixieSaspayUrl),
    timestamp: new Date().toISOString()
  };
}

/**
 * 7. Configuration Axios pour SasPay (avec isolation stricte)
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

/**
 * 8. Réessayer un paiement échoué — POST /payments/{payment_id}/retry/
 * Spécification : Proposer le retry sur FAILED sans créer de nouvelle transaction.
 * Idempotency-Key obligatoire.
 */
async function retrySaspayPayment(paymentId, idempotencyKey = null) {
  if (!paymentId) throw new Error('paymentId requis pour réessayer le paiement');
  const idempKey = getOrGenerateIdempotencyKey(idempotencyKey);
  const rawResponse = await callSaspayApi(`payments/${paymentId}/retry/`, {
    method: 'POST',
    idempotencyKey: idempKey,
    isPayout: false
  });
  return rawResponse?.data || rawResponse;
}

/**
 * 9. Confirmer l'OTP post-push — POST /payments/{payment_id}/confirm-otp/
 * Spécification : Pour les réseaux qui demandent une confirmation OTP après le push STK/USSD.
 */
async function confirmSaspayOtp(paymentId, otpCode) {
  if (!paymentId) throw new Error('paymentId requis pour la confirmation OTP');
  if (!otpCode) throw new Error('otpCode requis pour la confirmation OTP');
  const rawResponse = await callSaspayApi(`payments/${paymentId}/confirm-otp/`, {
    method: 'POST',
    body: { otp: String(otpCode).trim() },
    isPayout: false
  });
  return rawResponse?.data || rawResponse;
}

/**
 * 10. Statut d'une session de checkout hébergée — GET /checkout-sessions/{id}/status/
 */
async function getSaspayCheckoutStatus(sessionId) {
  if (!sessionId) throw new Error('sessionId requis');
  const rawResponse = await callSaspayApi(`checkout-sessions/${sessionId}/status/`, {
    method: 'GET',
    isPayout: false
  });
  return rawResponse?.data || rawResponse;
}

/**
 * 11. Annuler une session de checkout hébergée — POST /checkout-sessions/{id}/cancel/
 */
async function cancelSaspayCheckoutSession(sessionId) {
  if (!sessionId) throw new Error('sessionId requis');
  const rawResponse = await callSaspayApi(`checkout-sessions/${sessionId}/cancel/`, {
    method: 'POST',
    isPayout: false
  });
  return rawResponse?.data || rawResponse;
}

/**
 * 12. Référentiel des pays supportés par SasPay — GET /countries/ (Public)
 */
async function getSaspayCountries() {
  const rawResponse = await callSaspayApi('countries/', {
    method: 'GET',
    isPayout: false
  });
  return rawResponse?.data || rawResponse;
}

/**
 * 13. Tarification & Exigences OTP par réseau — GET /pricing/my-rates/ (Authentifié)
 * Permet de vérifier otp_required par réseau avant soumission.
 */
async function getSaspayMyRates() {
  const rawResponse = await callSaspayApi('pricing/my-rates/', {
    method: 'GET',
    isPayout: false
  });
  return rawResponse?.data || rawResponse;
}

/**
 * 14. Transfert entre Wallets marchands — POST /wallet-transfers/
 * Idempotency-Key obligatoire en pratique.
 */
async function transferSaspayWallet(params) {
  const {
    amount,
    currency = 'XOF',
    recipientWalletId,
    description,
    idempotencyKey
  } = params;
  const formattedAmount = formatSaspayAmount(amount);
  const idempKey = getOrGenerateIdempotencyKey(idempotencyKey);
  const rawResponse = await callSaspayApi('wallet-transfers/', {
    method: 'POST',
    body: {
      amount: formattedAmount,
      currency: currency.toUpperCase(),
      recipient_wallet: recipientWalletId,
      description: description || 'Transfert de wallet'
    },
    idempotencyKey: idempKey,
    isPayout: true
  });
  return rawResponse?.data || rawResponse;
}

module.exports = {
  SASPAY_DEFAULT_BASE_URL,
  SASPAY_SUPPORTED_COUNTRIES,
  getSaspayBaseUrl,
  getSaspayApiKey,
  formatSaspayAmount,
  formatSaspayInternationalPhone,
  getOrGenerateIdempotencyKey,
  getSaspayHeaders,
  resolveSaspayNetwork,
  callSaspayApi,
  createSaspayPayin,
  createSaspayPayout,
  verifySaspayPayment,
  verifySaspayPayout,
  verifySaspayWebhookSignature,
  getSaspayConfigStatus,
  getSaspayAxiosConfig,
  retrySaspayPayment,
  confirmSaspayOtp,
  getSaspayCheckoutStatus,
  cancelSaspayCheckoutSession,
  getSaspayCountries,
  getSaspayMyRates,
  transferSaspayWallet
};
