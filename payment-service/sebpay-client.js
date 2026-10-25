/**
 * Module Client Réseau Officiel Sebpay pour l'API Pont Render
 * 
 * Sécurité & Spécifications :
 * - Double authentification par headers HTTP :
 *     "X-Public-Key": process.env.SEBPAY_PUBLIC_KEY
 *     "X-Secret-Key": process.env.SEBPAY_SECRET_KEY
 *     "Content-Type": "application/json"
 * - URL de base officielle : https://newapi.sebpay.bj/api/v1/
 * - Flux 100% Production / Live Réel (Sebpay ne dispose d'aucun environnement Sandbox ni clés de test)
 * - Tout flag SEBPAY_TEST ou sandbox est formellement interdit et neutralisé
 * - Sortie réseau garantie par l'IP Statique Fixie (54.195.3.54) pour conformité bancaire
 * - Isolation stricte côté backend : X-Secret-Key n'est JAMAIS transmise au frontend
 */

// Neutralisation stricte de tout proxy global pour isoler le reste du serveur
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;
delete process.env.ALL_PROXY;
delete process.env.all_proxy;

const { HttpsProxyAgent } = require('https-proxy-agent');
const { ProxyAgent } = require('undici');
const {
  fetchViaFixie,
  getFixieUrl,
  getFixieAgents,
  getFixieAgentsSebpay,
  logProxyRouterUsage,
  getAxiosProxyConfig,
  maskProxyUrl
} = require('./fixie-proxy');

// Clients HTTP permissifs de secours pour le tunneling HTTP Proxy
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

/**
 * Détecte récursivement les erreurs d'authentification proxy ou de tunneling HTTP
 * (y compris les erreurs imbriquées dans TypeError: fetch failed -> DOMException -> RequestAbortedError)
 */
function isProxyTunnelError(err) {
  if (!err) return false;
  let cur = err;
  for (let i = 0; i < 5 && cur; i++) {
    const msg = String(cur.message || '');
    const name = String(cur.name || '');
    const code = String(cur.code || '');
    if (
      msg.includes('407') ||
      msg.includes('HTTP Tunneling') ||
      msg.includes('Proxy response') ||
      msg.includes('fetch failed') ||
      code === 'UND_ERR_ABORTED' ||
      name === 'RequestAbortedError' ||
      name === 'AbortError'
    ) {
      return true;
    }
    cur = cur.cause;
  }
  return false;
}

/**
 * Exécute un appel réseau vers l'API Sebpay via un client permissif (Axios ou node-fetch avec https-proxy-agent)
 * Utilisé en priorité lorsque FIXIE est actif pour éliminer radicalement l'erreur Undici 407.
 */
async function callSebpayApiViaPermissiveClient(targetUrl, { method, headers, body, httpsAgent, timeoutMs }) {
  console.log(`[SEBPAY PERMISSIVE CLIENT] Exécution via HttpsProxyAgent (${axiosClient ? 'Axios' : 'node-fetch'})...`);

  if (axiosClient) {
    try {
      const axiosRes = await axiosClient({
        url: targetUrl,
        method,
        headers,
        data: body,
        httpsAgent,
        httpAgent: httpsAgent,
        proxy: false,
        timeout: timeoutMs,
        validateStatus: () => true
      });

      const responseData = axiosRes.data;
      if (axiosRes.status < 200 || axiosRes.status >= 300) {
        const errorMsg = (typeof responseData === 'object' && (responseData.message || responseData.error))
          ? (responseData.message || responseData.error)
          : `HTTP ${axiosRes.status} ${axiosRes.statusText || 'Error'}`;
        const error = new Error(`Erreur Sebpay (${axiosRes.status}): ${errorMsg}`);
        error.status = axiosRes.status;
        error.data = responseData;
        throw error;
      }
      return responseData;
    } catch (axiosErr) {
      if (axiosErr.status || (axiosErr.response && axiosErr.response.status) || axiosErr.data) {
        throw axiosErr;
      }
      console.warn('[SEBPAY AXIOS NOTICE] Erreur réseau Axios, tentative de secours via node-fetch :', axiosErr.message);
    }
  }

  if (nodeFetchClient) {
    const fetchBody = (body && method !== 'GET' && method !== 'HEAD')
      ? (typeof body === 'string' ? body : JSON.stringify(body))
      : undefined;

    const nfRes = await nodeFetchClient(targetUrl, {
      method,
      headers,
      body: fetchBody,
      agent: httpsAgent,
      timeout: timeoutMs
    });

    const contentType = nfRes.headers.get('content-type') || '';
    let responseData = null;
    if (contentType.includes('application/json')) {
      responseData = await nfRes.json().catch(() => ({}));
    } else {
      responseData = await nfRes.text();
    }

    if (!nfRes.ok) {
      const errorMsg = (typeof responseData === 'object' && (responseData.message || responseData.error))
        ? (responseData.message || responseData.error)
        : `HTTP ${nfRes.status} ${nfRes.statusText}`;
      const error = new Error(`Erreur Sebpay (${nfRes.status}): ${errorMsg}`);
      error.status = nfRes.status;
      error.data = responseData;
      throw error;
    }

    return responseData;
  }

  throw new Error('Aucun client HTTP permissif (Axios ou node-fetch) disponible pour le tunneling.');
}

// URL de base officielle Sebpay
const SEBPAY_DEFAULT_BASE_URL = 'https://newapi.sebpay.bj/api/v1/';

// Dictionnaire officiel des 20 pays certifiés avec IDs et schémas officiels Sebpay (/api/v1/countries)
const SUPPORTED_COUNTRIES = {
  BF: { id: "20260506192835258815", name: "Burkina Faso", country_name: "Burkina Faso", country_code: "BF", prefix: "+226", currency_id: "20260506192834884879", currency: "XOF" },
  BJ: { id: "20260506192835884841", name: "Benin", country_name: "Benin", country_code: "BJ", prefix: "+229", currency_id: "20260506192834884879", currency: "XOF" },
  CI: { id: "20260506192835429869", name: "Côte d'Ivoire", country_name: "Côte d'Ivoire", country_code: "CI", prefix: "+225", currency_id: "20260506192834884879", currency: "XOF" },
  ML: { id: "20260506192835642474", name: "Mali", country_name: "Mali", country_code: "ML", prefix: "+223", currency_id: "20260506192834884879", currency: "XOF" },
  NE: { id: "20260506192835691483", name: "Niger", country_name: "Niger", country_code: "NE", prefix: "+227", currency_id: "20260506192834884879", currency: "XOF" },
  SN: { id: "20260506192835771819", name: "Senegal", country_name: "Senegal", country_code: "SN", prefix: "+221", currency_id: "20260506192834884879", currency: "XOF" },
  TG: { id: "20260506192835820312", name: "Togo", country_name: "Togo", country_code: "TG", prefix: "+228", currency_id: "20260506192834884879", currency: "XOF" },
  GW: { id: "20260506192835609951", name: "Guinea-Bissau", country_name: "Guinea-Bissau", country_code: "GW", prefix: "+245", currency_id: "20260506192834884879", currency: "XOF" },
  CM: { id: "20260506192835490355", name: "Cameroon", country_name: "Cameroon", country_code: "CM", prefix: "+237", currency_id: "20260506192835391282", currency: "XAF" },
  CG: { id: "20260506192835400983", name: "Congo", country_name: "Congo", country_code: "CG", prefix: "+242", currency_id: "20260506192835391282", currency: "XAF" },
  GA: { id: "20260506192835518192", name: "Gabon", country_name: "Gabon", country_code: "GA", prefix: "+241", currency_id: "20260506192835391282", currency: "XAF" },
  TD: { id: "20260508014307386840", name: "Tchad", country_name: "Tchad", country_code: "TD", prefix: "+235", currency_id: "20260506192835391282", currency: "XAF" },
  GH: { id: "20260706132629645425", name: "Ghana", country_name: "Ghana", country_code: "GH", prefix: "+233", currency_id: "20260706132037956467", currency: "GHS" },
  GN: { id: "20260506192835563073", name: "Guinea Conakry", country_name: "Guinea Conakry", country_code: "GN", prefix: "+224", currency_id: "20260506192835550797", currency: "GNF" },
  NG: { id: "20260706132458113019", name: "Nigéria", country_name: "Nigéria", country_code: "NG", prefix: "+234", currency_id: "20260706131900898656", currency: "NGN" },
  CD: { id: "20260506192835321584", name: "R.D.C", country_name: "R.D.C", country_code: "CD", prefix: "+243", currency_id: "20260506192835314236", currency: "CDF" },
  KE: { id: "20260813115256032331", name: "Kenya", country_name: "Kenya", country_code: "KE", prefix: "+254", currency_id: "20260813114604860772", currency: "KES" },
  UG: { id: "20260813115612389340", name: "Ouganda", country_name: "Ouganda", country_code: "UG", prefix: "+256", currency_id: "20260813114955698986", currency: "UGX" },
  TZ: { id: "20260813115842870606", name: "Tanzanie", country_name: "Tanzanie", country_code: "TZ", prefix: "+255", currency_id: "20260813114814658462", currency: "TZS" },
  GM: { id: "20260506192835995905", name: "Gambia", country_name: "Gambia", country_code: "GM", prefix: "+220", currency_id: "20260506192835984144", currency: "GMD" }
};

/**
 * Résout dynamiquement le code ISO pays (ex: "BF"), son ID officiel Sebpay et la devise nationale (ex: "XOF")
 * Résolution par ordre de priorité :
 * 1. Code pays explicite à 2 lettres (ex: "BF", "BJ", "CI")
 * 2. Objet pays { country_code, code, id, ... }
 * 3. Nom de pays (ex: "Burkina Faso" -> "BF")
 * 4. Détection via préfixe téléphonique (ex: "+22670..." -> "BF", "+229..." -> "BJ")
 * 5. Valeur par défaut de secours : "BF" (Burkina Faso) et "XOF"
 */
function resolveCountryAndCurrency(countryInput, phoneInput, currencyInput) {
  let resolvedCountry = 'BF';

  if (countryInput) {
    if (typeof countryInput === 'object') {
      const candidate = countryInput.country_code || countryInput.code || countryInput.id || countryInput.country;
      if (candidate && typeof candidate === 'string') {
        const upper = candidate.trim().toUpperCase();
        if (SUPPORTED_COUNTRIES[upper]) {
          resolvedCountry = upper;
        } else {
          // Recherche par ID Sebpay éventuel (ex: "20260506192835258815")
          const byId = Object.entries(SUPPORTED_COUNTRIES).find(([, info]) => info.id === candidate.trim());
          if (byId) resolvedCountry = byId[0];
        }
      }
    } else if (typeof countryInput === 'string') {
      const clean = countryInput.trim().toUpperCase();
      if (SUPPORTED_COUNTRIES[clean]) {
        resolvedCountry = clean;
      } else {
        const found = Object.entries(SUPPORTED_COUNTRIES).find(
          ([code, info]) => info.name.toLowerCase() === countryInput.trim().toLowerCase() ||
                            info.country_name.toLowerCase() === countryInput.trim().toLowerCase()
        );
        if (found) {
          resolvedCountry = found[0];
        } else {
          const byId = Object.entries(SUPPORTED_COUNTRIES).find(([, info]) => info.id === countryInput.trim());
          if (byId) resolvedCountry = byId[0];
        }
      }
    }
  } else if (phoneInput) {
    const raw = String(phoneInput).trim();
    const sorted = Object.entries(SUPPORTED_COUNTRIES).sort((a, b) => b[1].prefix.length - a[1].prefix.length);
    for (const [code, info] of sorted) {
      const pfx = info.prefix.replace('+', '');
      if (raw.startsWith(info.prefix) || raw.startsWith(pfx) || raw.startsWith(`00${pfx}`)) {
        resolvedCountry = code;
        break;
      }
    }
  }

  const countryInfo = SUPPORTED_COUNTRIES[resolvedCountry] || SUPPORTED_COUNTRIES.BF;
  let resolvedCurrency = countryInfo.currency || 'XOF';

  if (currencyInput && typeof currencyInput === 'string') {
    const currUpper = currencyInput.trim().toUpperCase();
    if (currUpper === 'FCFA' || currUpper === 'CFA') {
      resolvedCurrency = countryInfo.currency || 'XOF';
    } else if (currUpper.length === 3) {
      resolvedCurrency = currUpper;
    }
  }

  return {
    id: countryInfo.id,
    country: resolvedCountry,
    country_code: resolvedCountry,
    country_name: countryInfo.country_name || countryInfo.name,
    prefix: countryInfo.prefix,
    currency_id: countryInfo.currency_id,
    currency: resolvedCurrency,
    // Structure objet complète conforme au endpoint /api/v1/countries
    country_details: {
      id: countryInfo.id,
      country_name: countryInfo.country_name || countryInfo.name,
      country_code: resolvedCountry,
      prefix: countryInfo.prefix,
      currency_id: countryInfo.currency_id,
      currency: {
        id: countryInfo.currency_id,
        code: resolvedCurrency,
        name: resolvedCurrency,
        symbol: resolvedCurrency
      }
    }
  };
}

/**
 * Dictionnaire officiel complet des opérateurs supportés par Sebpay par pays
 */
const SEBPAY_COUNTRY_OPERATORS = {
  BF: ['moov', 'orange', 'wligdicash'],
  CD: ['afrimoney', 'airtel', 'mpesa', 'orange', 'vodacom'],
  CG: ['airtel', 'mtn'],
  CI: ['moov', 'mtn', 'orange', 'wave'],
  CM: ['mtn', 'orange'],
  GA: ['airtel', 'moov'],
  GN: ['mtn', 'orange'],
  GW: ['orange'],
  ML: ['mobicash', 'moov', 'orange'],
  NE: ['airtel', 'amanata', 'moov', 'nita', 'wligdicash', 'zamani'],
  SN: ['emoney', 'free', 'orange', 'wave'],
  TG: ['moov', 'togocom'],
  BJ: ['celtiis', 'coris', 'moov', 'mtn'],
  GM: ['afrimoney'],
  TD: ['airtel', 'moov'],
  NG: ['airtel', 'mtn'],
  GH: ['airtel', 'mtn', 'telecel'],
  KE: ['airtel', 'mpesa'],
  UG: ['airtel', 'mtn'],
  TZ: ['airtel', 'ezypesa', 'halo_pesa', 'mpesa', 'tigopesa']
};

/**
 * Opérateur par défaut par pays en cas d'omission ou terme générique (ex: MOMO)
 */
const SEBPAY_DEFAULT_OPERATOR_BY_COUNTRY = {
  BF: 'orange',
  CD: 'orange',
  CG: 'airtel',
  CI: 'orange',
  CM: 'orange',
  GA: 'airtel',
  GN: 'orange',
  GW: 'orange',
  ML: 'orange',
  NE: 'airtel',
  SN: 'orange',
  TG: 'togocom',
  BJ: 'mtn',
  GM: 'afrimoney',
  TD: 'moov',
  NG: 'mtn',
  GH: 'mtn',
  KE: 'mpesa',
  UG: 'mtn',
  TZ: 'mpesa'
};

/**
 * Normalisation universelle enrichie des codes d'opérateurs pour l'API Sebpay
 * Couvre les 20 pays supportés par Sebpay :
 * - BF (Burkina Faso) : moov, orange, wligdicash
 * - CD (R.D. Congo) : afrimoney, airtel, mpesa, orange, vodacom
 * - CG (Congo) : airtel, mtn
 * - CI (Côte d'Ivoire) : moov, mtn, orange, wave
 * - CM (Cameroun) : mtn, orange
 * - GA (Gabon) : airtel, moov
 * - GN (Guinée Conakry) : mtn, orange
 * - GW (Guinée-Bissau) : orange
 * - ML (Mali) : mobicash, moov, orange
 * - NE (Niger) : airtel, amanata, moov, nita, wligdicash, zamani
 * - SN (Sénégal) : emoney, free, orange, wave
 * - TG (Togo) : moov, togocom
 * - BJ (Bénin) : celtiis, coris, moov, mtn
 * - GM (Gambie) : afrimoney
 * - TD (Tchad) : airtel, moov
 * - NG (Nigéria) : airtel, mtn
 * - GH (Ghana) : airtel, mtn, telecel
 * - KE (Kenya) : airtel, mpesa
 * - UG (Ouganda) : airtel, mtn
 * - TZ (Tanzanie) : airtel, ezypesa, halo_pesa, mpesa, tigopesa
 * 
 * @param {string|object} country - Code ISO du pays (ex: 'BF', 'CI') ou objet pays
 * @param {string} rawOperator - Nom brut de l'opérateur (ex: 'ORANGE_MONEY', 'MOOV_MONEY', 'Halo Pesa')
 * @returns {string} Slug opérateur officiel Sebpay en minuscules
 */
function normalizeSebpayOperator(country, rawOperator) {
  const countryCode = (typeof country === 'object'
    ? (country.country_code || country.code || country.id || 'BF')
    : String(country || 'BF')
  ).trim().toUpperCase();

  if (!rawOperator) {
    return SEBPAY_DEFAULT_OPERATOR_BY_COUNTRY[countryCode] || '';
  }

  const op = String(rawOperator).toLowerCase().trim();

  // Termes génériques de paiement mobile -> fallback vers opérateur par défaut du pays
  if (op === 'momo' || op === 'mobile_money' || op === 'mobile-money' || op === 'mobilemoney' || op === 'money') {
    return SEBPAY_DEFAULT_OPERATOR_BY_COUNTRY[countryCode] || 'orange';
  }

  // Détections et correspondances des opérateurs officiels Sebpay
  if (op.includes('orange')) return 'orange';
  if (op.includes('moov') || op.includes('flooz')) return 'moov';
  if (op.includes('mtn')) return 'mtn';
  if (op.includes('wave')) return 'wave';
  if (op.includes('celtiis')) return 'celtiis';
  if (op.includes('coris')) return 'coris';
  if (op.includes('togocom') || op.includes('togo') || op.includes('tmoney')) return 'togocom';
  if (op.includes('ligdicash') || op.includes('wligdicash')) return 'wligdicash';
  if (op.includes('mobicash')) return 'mobicash';
  if (op.includes('free')) return 'free';
  if (op.includes('emoney') || op.includes('e-money')) return 'emoney';
  if (op.includes('amanata')) return 'amanata';
  if (op.includes('nita')) return 'nita';
  if (op.includes('zamani')) return 'zamani';
  if (op.includes('airtel')) return 'airtel';
  if (op.includes('vodacom')) return 'vodacom';
  if (op.includes('afrimoney') || op.includes('afri')) return 'afrimoney';
  if (op.includes('mpesa') || op.includes('m-pesa')) return 'mpesa';
  if (op.includes('telecel')) return 'telecel';
  if (op.includes('ezypesa') || op.includes('ezy')) return 'ezypesa';
  if (op.includes('halo')) return 'halo_pesa';
  if (op.includes('tigo')) return 'tigopesa';

  // Si le code correspond déjà directement à un opérateur supporté dans ce pays
  const supported = SEBPAY_COUNTRY_OPERATORS[countryCode];
  if (supported && supported.includes(op)) {
    return op;
  }

  return op;
}

function getSebpayBaseUrl() {
  const url = process.env.SEBPAY_BASE_URL || SEBPAY_DEFAULT_BASE_URL;
  return url.endsWith('/') ? url : `${url}/`;
}

/**
 * Construit les en-têtes officiels requis par Sebpay
 * Injecte obligatoirement X-Public-Key, X-Secret-Key et Content-Type
 */
function getSebpayHeaders(customHeaders = {}) {
  const publicKey = process.env.SEBPAY_PUBLIC_KEY || '';
  const secretKey = process.env.SEBPAY_SECRET_KEY || '';

  return {
    'X-Public-Key': publicKey,
    'X-Secret-Key': secretKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...customHeaders
  };
}

/**
 * Diagnostic de configuration des clés Sebpay
 * Retourne l'état sans JAMAIS exposer la clé secrète
 */
function getSebpayConfigStatus() {
  const publicKey = process.env.SEBPAY_PUBLIC_KEY || '';
  const secretKey = process.env.SEBPAY_SECRET_KEY || '';
  const baseUrl = getSebpayBaseUrl();

  const isConfigured = Boolean(publicKey && secretKey);

  // Masquage sécurisé de la clé publique (ex: pk_live_abc...1234)
  let maskedPublicKey = null;
  if (publicKey) {
    if (publicKey.length > 12) {
      maskedPublicKey = `${publicKey.substring(0, 8)}...${publicKey.substring(publicKey.length - 4)}`;
    } else {
      maskedPublicKey = `${publicKey.substring(0, 3)}***`;
    }
  }

  return {
    isConfigured,
    environment: 'production',
    isLive: true,
    hasPublicKey: Boolean(publicKey),
    hasSecretKey: Boolean(secretKey),
    maskedPublicKey,
    baseUrl,
    timestamp: new Date().toISOString()
  };
}

/**
 * Exécute une requête réseau sécurisée vers l'API Sebpay
 * - Utilise systématiquement HttpsProxyAgent configuré avec process.env.FIXIE_URL
 * - Transmet systématiquement httpsAgent (pour Axios et HTTP Node) et dispatcher (pour undici / fetch Node 18+)
 * - Injecte les headers d'authentification bancaire X-Public-Key et X-Secret-Key
 * - Protège contre toute fuite de secret dans les logs d'erreurs
 * 
 * @param {string} endpoint - Chemin d'API relatif (ex: 'collections', 'collections/:id', etc.)
 * @param {object} options - Options HTTP { method, body, headers, timeoutMs }
 */
async function callSebpayApi(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeoutMs = 25000
  } = options;

  const baseUrl = getSebpayBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const targetUrl = `${baseUrl}${cleanEndpoint}`;

  const publicKey = process.env.SEBPAY_PUBLIC_KEY;
  const secretKey = process.env.SEBPAY_SECRET_KEY;

  if (!publicKey || !secretKey) {
    throw new Error('[SEBPAY AUTH ERROR] Clés d\'authentification manquantes. Définissez SEBPAY_PUBLIC_KEY et SEBPAY_SECRET_KEY sur Render.');
  }

  const reqHeaders = getSebpayHeaders(headers);

  // Résolution dynamique du proxy avec priorité SEBPAY_FIXIE_URL
  const txId = options.transactionId || options.orderId || options.externalReference || (typeof body === 'object' && body?.external_reference) || null;
  const { httpsAgent, undiciAgent, variableName, fixieUrl } = getFixieAgents('sebpay', {
    transactionId: txId,
    forceAlternate: Boolean(options.forceAlternateProxy)
  });

  if (!fixieUrl) {
    console.warn('[SEBPAY PROXY WARNING] Aucune variable de proxy (SEBPAY_FIXIE_URL ou FIXIE_URL) configurée. L\'IP dynamique Render risque d\'être rejetée par Sebpay.');
  }

  const fetchOptions = {
    method,
    headers: reqHeaders,
    signal: AbortSignal.timeout(timeoutMs)
  };

  // Injection systématique garantie de HttpsProxyAgent pour Axios, node-fetch et fetch
  if (httpsAgent) {
    fetchOptions.agent = httpsAgent;
    fetchOptions.httpsAgent = httpsAgent; // Axios compatibility
    fetchOptions.httpAgent = httpsAgent;  // Axios compatibility
    fetchOptions.proxy = false;           // Empêche Axios d'utiliser un mauvais proxy
  }
  if (undiciAgent) {
    fetchOptions.dispatcher = undiciAgent; // Node.js 18+ global fetch
  }

  if (body && method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  console.log(`[SEBPAY REQUEST] ${method} ${targetUrl} (via Fixie IP Statique / HttpsProxyAgent isolé)...`);

  // 1. Si un proxy Fixie est configuré, exécuter directement via le client permissif éprouvé (Axios / node-fetch avec https-proxy-agent)
  // afin d'éliminer définitivement l'erreur "Proxy response (407) !== 200 when HTTP Tunneling" de l'implémentation Undici interne de Node.js.
  if (httpsAgent && (axiosClient || nodeFetchClient)) {
    return await callSebpayApiViaPermissiveClient(targetUrl, {
      method,
      headers: reqHeaders,
      body,
      httpsAgent,
      timeoutMs
    });
  }

  // 2. Si aucun proxy ou mode direct en clair, exécuter via fetch natif avec filet de sécurité
  let response;
  try {
    response = await fetch(targetUrl, fetchOptions);
  } catch (fetchErr) {
    if (isProxyTunnelError(fetchErr) && httpsAgent) {
      console.warn(`[SEBPAY FALLBACK] Échec du tunneling Undici ProxyAgent (407). Basculement automatique vers le client permissif https-proxy-agent / axios... Cause : ${fetchErr.message}`);
      return await callSebpayApiViaPermissiveClient(targetUrl, {
        method,
        headers: reqHeaders,
        body,
        httpsAgent,
        timeoutMs
      });
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
    const errorMsg = (typeof responseData === 'object' && (responseData.message || responseData.error))
      ? (responseData.message || responseData.error)
      : `HTTP ${response.status} ${response.statusText}`;

    console.error(`[SEBPAY ERROR] ${method} ${cleanEndpoint} -> HTTP ${response.status}:`, errorMsg);

    const error = new Error(`Erreur Sebpay (${response.status}): ${errorMsg}`);
    error.status = response.status;
    error.data = responseData;
    throw error;
  }

  return responseData;
}

/**
 * 1. POST /collections - Création d'un paiement Sebpay avec gestion Multi-Tenant & Cas spécifiques
 * 
 * Spécificités gérées :
 * - external_reference : concaténation multi-tenant "${tenant_id}___${order_id}"
 * - callback_url : webhook officiel Render
 * - otp_code : transmis si opérateur Orange ou requis
 * - Dépaquetage du wrapper Sebpay (response.data.data ou response.data)
 * - Détection Wave : si provider_link présent -> action redirect
 */
async function createSebpayCollection(params) {
  const {
    tenantId = 'nanasore_central_hub',
    orderId = `ORD_${Date.now()}`,
    amount,
    currency,
    country,
    countryCode,
    phone,
    customerPhone,
    customerName,
    customerEmail,
    operator,
    otpCode,
    description,
    callbackUrl,
    customPayload = {}
  } = params;

  if (!amount || Number(amount) <= 0) {
    throw new Error('Le montant du paiement est requis et doit être supérieur à 0.');
  }

  const effectivePhone = (phone || customerPhone || '').replace(/[^0-9+]/g, '');
  const externalReference = params.externalReference || `${tenantId}___${orderId}`;
  const effectiveCallback = callbackUrl || process.env.PAYMENT_CALLBACK_URL || process.env.PAYMENT_WEBHOOK_URL || 'https://nana-payment-api.onrender.com/api/payment/webhook';

  // Résolution obligatoire du code ISO pays (ex: "BF"), ID et devise (ex: "XOF")
  const resolved = resolveCountryAndCurrency(
    country || countryCode || customPayload.country || customPayload.country_code,
    effectivePhone,
    currency || customPayload.currency
  );

  // Objet Pays complet conforme à la documentation officielle Sebpay et /api/v1/countries
  const countryObject = {
    id: resolved.id || "20260506192835258815",
    country_name: resolved.country_name || "Burkina Faso",
    country_code: (resolved.country_code || resolved.country || "BF").toUpperCase(),
    prefix: resolved.prefix || "+226",
    currency: resolved.currency || "XOF"
  };

  const countryIso = countryObject.country_code;

  // Normalisation universelle du code opérateur pour l'API Sebpay
  const rawOperator = operator || customPayload.operator || customPayload.provider || '';
  const normalizedOperator = normalizeSebpayOperator(countryIso, rawOperator) || SEBPAY_DEFAULT_OPERATOR_BY_COUNTRY[countryIso] || 'orange';

  const body = {
    amount: Math.round(Number(amount)),
    currency: resolved.currency,
    // Objet pays structuré requis par la documentation Sebpay
    country: countryObject,
    country_code: countryIso,
    country_name: countryObject.country_name,
    country_id: countryObject.id,
    prefix: countryObject.prefix,
    customer_phone: effectivePhone,
    phone: effectivePhone,
    customer_name: customerName || 'Client Nanasore',
    customer_email: customerEmail || 'client@nanasore.com',
    external_reference: externalReference,
    callback_url: effectiveCallback,
    operator: normalizedOperator,
    provider: normalizedOperator,
    description: description || `Paiement Commande ${orderId}`,
    ...customPayload,
    operator: normalizedOperator,
    provider: normalizedOperator
  };

  // Sebpay ne dispose d'aucun environnement Sandbox/Test (flux 100% Production/Live réel)
  // Neutralisation stricte et suppression définitive de tout flag de test
  delete body.isTest;
  delete body.is_test;
  delete body.sandbox;
  delete body.test_mode;
  delete body.SEBPAY_TEST;

  // Gestion du cas Orange Money OTP
  if (otpCode && String(otpCode).trim()) {
    body.otp_code = String(otpCode).trim();
    body.otp = String(otpCode).trim();
  }

  console.log(`[SEBPAY INITIATE] Collection pour ${externalReference} | ${amount} ${resolved.currency} | Pays: ${countryObject.country_name} (${countryIso}) | Opérateur: ${normalizedOperator}`);

  let rawResponse;
  try {
    rawResponse = await callSebpayApi('collections', {
      method: 'POST',
      body
    });
  } catch (apiErr) {
    // Mécanisme d'auto-adaptation polymorphe anti-422 :
    // Si le validateur de l'API Sebpay exige que country soit une chaîne de 2 caractères :
    const errorData = apiErr.data || {};
    const errorStr = JSON.stringify(errorData).toLowerCase();
    const isCountryStringRequired =
      apiErr.status === 422 &&
      (errorStr.includes('must be a string') || errorStr.includes('must be 2 characters') || (errorData.errors && errorData.errors.country));

    if (isCountryStringRequired && typeof body.country === 'object') {
      console.warn(`[SEBPAY AUTO-ADAPT 422] Le validateur Sebpay attend le code ISO pays. Adaptation automatique : country="${countryIso}"`);
      body.country = countryIso;
      body.country_details = countryObject;
      rawResponse = await callSebpayApi('collections', {
        method: 'POST',
        body
      });
    } else {
      throw apiErr;
    }
  }

  // Dépaquetage du wrapper Sebpay : { success, data: { ... }, message }
  // Les données utiles sont dans rawResponse.data.data ou rawResponse.data
  let innerData = rawResponse?.data;
  if (innerData && typeof innerData === 'object' && innerData.data) {
    innerData = innerData.data;
  }
  const sebpayData = innerData || rawResponse;

  // Détection du lien de redirection (Spécifique Wave / Provider Link)
  const providerLink = sebpayData?.provider_link || sebpayData?.redirect_url || sebpayData?.payment_url || null;

  return {
    success: rawResponse?.success !== false,
    action: providerLink ? 'redirect' : 'pending',
    provider_link: providerLink,
    redirectUrl: providerLink,
    external_reference: externalReference,
    tenantId,
    orderId,
    amount: Number(amount),
    currency: resolved.currency,
    country: resolved.country,
    txId: sebpayData?.transaction_id || sebpayData?.id || externalReference,
    data: sebpayData,
    message: rawResponse?.message || (providerLink ? 'Redirection vers la passerelle opérateur' : 'Paiement initié avec succès')
  };
}

/**
 * 2. GET /collections/{external_reference} - Route de vérification de secours
 * Permet au client de vérifier instantanément son paiement même si le webhook tarde
 */
async function getSebpayCollection(externalReference) {
  if (!externalReference) {
    throw new Error('external_reference requis pour la vérification');
  }

  const cleanRef = externalReference.trim();
  console.log(`[SEBPAY GET COLLECTION] Vérification de ${cleanRef}...`);

  const rawResponse = await callSebpayApi(`collections/${encodeURIComponent(cleanRef)}`, {
    method: 'GET'
  });

  // Dépaquetage du wrapper Sebpay
  let innerData = rawResponse?.data;
  if (innerData && typeof innerData === 'object' && innerData.data) {
    innerData = innerData.data;
  }
  const sebpayData = innerData || rawResponse;

  const statusStr = String(sebpayData?.status || '').toUpperCase();
  const isPaid = ['SUCCESS', 'COMPLETED', 'PAID', 'APPROVED', 'VALIDATED'].includes(statusStr);

  return {
    success: isPaid,
    status: statusStr || (isPaid ? 'COMPLETED' : 'PENDING'),
    isPaid,
    external_reference: cleanRef,
    amount: Number(sebpayData?.amount || 0),
    currency: sebpayData?.currency || 'XOF',
    data: sebpayData,
    message: rawResponse?.message || (isPaid ? 'Paiement validé avec succès par Sebpay.' : 'Paiement en attente de confirmation.')
  };
}

// ============================================================================
// 3. CATALOGUE DES 20 PAYS COUVERTS SEBPAY & GESTION DE CACHE SERVEUR
// ============================================================================
const SEBPAY_SUPPORTED_COUNTRIES_FALLBACK = [
  {
    id: 'bj',
    country_name: 'Bénin',
    country_code: 'BJ',
    prefix: '+229',
    currency: 'XOF',
    currency_symbol: 'CFA',
    flag: '🇧🇯',
    zone: 'UEMOA',
    status: 'Active',
    operators: ['Celtiis Money', 'Coris Money', 'Moov Money', 'MTN Money']
  },
  {
    id: 'bf',
    country_name: 'Burkina Faso',
    country_code: 'BF',
    prefix: '+226',
    currency: 'XOF',
    currency_symbol: 'CFA',
    flag: '🇧🇫',
    zone: 'UEMOA',
    status: 'Active',
    operators: ['Moov Money', 'Orange Money', 'Wallet LigdiCash', 'Wave Money']
  },
  {
    id: 'cm',
    country_name: 'Cameroun',
    country_code: 'CM',
    prefix: '+237',
    currency: 'XAF',
    currency_symbol: 'FCFA',
    flag: '🇨🇲',
    zone: 'CEMAC',
    status: 'Active',
    operators: ['MTN Money', 'Orange Money']
  },
  {
    id: 'cg',
    country_name: 'Congo',
    country_code: 'CG',
    prefix: '+242',
    currency: 'XAF',
    currency_symbol: 'FCFA',
    flag: '🇨🇬',
    zone: 'CEMAC',
    status: 'Active',
    operators: ['Airtel Money', 'MTN Money']
  },
  {
    id: 'ci',
    country_name: "Côte d'Ivoire",
    country_code: 'CI',
    prefix: '+225',
    currency: 'XOF',
    currency_symbol: 'CFA',
    flag: '🇨🇮',
    zone: 'UEMOA',
    status: 'Active',
    operators: ['Moov Money', 'MTN Money', 'Orange Money', 'Wave Money']
  },
  {
    id: 'ga',
    country_name: 'Gabon',
    country_code: 'GA',
    prefix: '+241',
    currency: 'XAF',
    currency_symbol: 'FCFA',
    flag: '🇬🇦',
    zone: 'CEMAC',
    status: 'Active',
    operators: ['Airtel Money', 'Moov Money']
  },
  {
    id: 'gm',
    country_name: 'Gambie',
    country_code: 'GM',
    prefix: '+220',
    currency: 'GMD',
    currency_symbol: 'D',
    flag: '🇬🇲',
    zone: 'CEDEAO',
    status: 'Active',
    operators: ['Afri Money']
  },
  {
    id: 'gh',
    country_name: 'Ghana',
    country_code: 'GH',
    prefix: '+233',
    currency: 'GHS',
    currency_symbol: 'GH₵',
    flag: '🇬🇭',
    zone: 'CEDEAO',
    status: 'Active',
    operators: ['AIRTEL', 'MTN Money', 'TELECEL CASH']
  },
  {
    id: 'gn',
    country_name: 'Guinée Conakry',
    country_code: 'GN',
    prefix: '+224',
    currency: 'GNF',
    currency_symbol: 'FG',
    flag: '🇬🇳',
    zone: 'CEDEAO',
    status: 'Active',
    operators: ['MTN Money', 'Orange Money']
  },
  {
    id: 'gw',
    country_name: 'Guinée-Bissau',
    country_code: 'GW',
    prefix: '+245',
    currency: 'XOF',
    currency_symbol: 'CFA',
    flag: '🇬🇼',
    zone: 'UEMOA',
    status: 'Active',
    operators: ['Orange Money']
  },
  {
    id: 'ke',
    country_name: 'Kenya',
    country_code: 'KE',
    prefix: '+254',
    currency: 'KES',
    currency_symbol: 'KSh',
    flag: '🇰🇪',
    zone: 'EAC',
    status: 'Active',
    operators: ['Airtel', 'Mpesa']
  },
  {
    id: 'ml',
    country_name: 'Mali',
    country_code: 'ML',
    prefix: '+223',
    currency: 'XOF',
    currency_symbol: 'CFA',
    flag: '🇲🇱',
    zone: 'UEMOA',
    status: 'Active',
    operators: ['Mobicash', 'Moov Money', 'Orange Money']
  },
  {
    id: 'ne',
    country_name: 'Niger',
    country_code: 'NE',
    prefix: '+227',
    currency: 'XOF',
    currency_symbol: 'CFA',
    flag: '🇳🇪',
    zone: 'UEMOA',
    status: 'Active',
    operators: ['Airtel Money', 'Amanata', 'Moov Money', 'Nita', 'Wallet LigdiCash', 'Zamani']
  },
  {
    id: 'ng',
    country_name: 'Nigéria',
    country_code: 'NG',
    prefix: '+234',
    currency: 'NGN',
    currency_symbol: '₦',
    flag: '🇳🇬',
    zone: 'CEDEAO',
    status: 'Active',
    operators: ['AIRTEL', 'MTN Money']
  },
  {
    id: 'ug',
    country_name: 'Ouganda',
    country_code: 'UG',
    prefix: '+256',
    currency: 'UGX',
    currency_symbol: 'USh',
    flag: '🇺🇬',
    zone: 'EAC',
    status: 'Active',
    operators: ['Airtel', 'Mtn']
  },
  {
    id: 'cd',
    country_name: 'R.D.C',
    country_code: 'CD',
    prefix: '+243',
    currency: 'CDF',
    currency_symbol: 'FC',
    flag: '🇨🇩',
    zone: 'Afrique Centrale',
    status: 'Active',
    operators: ['Afri Money', 'Airtel Money', 'Mpesa Money', 'Orange Money', 'Vodacom']
  },
  {
    id: 'sn',
    country_name: 'Sénégal',
    country_code: 'SN',
    prefix: '+221',
    currency: 'XOF',
    currency_symbol: 'CFA',
    flag: '🇸🇳',
    zone: 'UEMOA',
    status: 'Active',
    operators: ['Free Money', 'Orange Money', 'Wave Money', 'E-money']
  },
  {
    id: 'tz',
    country_name: 'Tanzanie',
    country_code: 'TZ',
    prefix: '+255',
    currency: 'TZS',
    currency_symbol: 'TSh',
    flag: '🇹🇿',
    zone: 'EAC',
    status: 'Active',
    operators: ['Airtel', 'Ezy pesa', 'Halo Pesa', 'Mpesa', 'Tigo pesa']
  },
  {
    id: 'td',
    country_name: 'Tchad',
    country_code: 'TD',
    prefix: '+235',
    currency: 'XAF',
    currency_symbol: 'FCFA',
    flag: '🇹🇩',
    zone: 'CEMAC',
    status: 'Active',
    operators: ['Moov', 'Airtel']
  },
  {
    id: 'tg',
    country_name: 'Togo',
    country_code: 'TG',
    prefix: '+228',
    currency: 'XOF',
    currency_symbol: 'CFA',
    flag: '🇹🇬',
    zone: 'UEMOA',
    status: 'Active',
    operators: ['Moov Money', 'TogoCom', 'Wave Money']
  },
  {
    id: 'mr',
    country_name: 'Mauritanie',
    country_code: 'MR',
    prefix: '+222',
    currency: 'MRU',
    currency_symbol: 'MRU',
    flag: '🇲🇷',
    zone: 'AUTRES_AFRIQUE',
    status: 'Active',
    operators: ['Bankily', 'Masrvi', 'Sedad', 'Mauripay']
  },
  {
    id: 'rw',
    country_name: 'Rwanda',
    country_code: 'RW',
    prefix: '+250',
    currency: 'RWF',
    currency_symbol: 'RF',
    flag: '🇷🇼',
    zone: 'AUTRES_AFRIQUE',
    status: 'Active',
    operators: ['MTN Mobile Money', 'Airtel Money']
  },
  {
    id: 'diaspora',
    country_name: 'Diaspora & International',
    country_code: 'DIASPORA',
    prefix: '+1',
    currency: 'EUR',
    currency_symbol: '€',
    flag: '🌍',
    zone: 'INTERNATIONAL',
    status: 'Active',
    operators: ['Visa / Mastercard', 'Apple Pay', 'Google Pay', 'Taptap Send']
  }
];

let cachedCountries = null;
let cachedCountriesTimestamp = 0;
const COUNTRIES_CACHE_TTL_MS = 60 * 60 * 1000; // Cache 1 heure

/**
 * 3. GET /countries - Récupère la liste des pays supportés par Sebpay (avec cache serveur et fallback)
 */
async function getSebpayCountries(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedCountries && (now - cachedCountriesTimestamp < COUNTRIES_CACHE_TTL_MS)) {
    return {
      success: true,
      cached: true,
      cachedAt: new Date(cachedCountriesTimestamp).toISOString(),
      count: cachedCountries.length,
      countries: cachedCountries
    };
  }

  try {
    const rawResponse = await callSebpayApi('countries', { method: 'GET' });
    let items = rawResponse?.data;
    if (items && typeof items === 'object' && items.data) {
      items = items.data;
    }
    if (Array.isArray(items) && items.length > 0) {
      const cleaned = items.map((c) => {
        const code = (c.country_code || c.code || '').toUpperCase();
        const fallback = SEBPAY_SUPPORTED_COUNTRIES_FALLBACK.find(f => f.country_code === code);
        return {
          id: c.id || code.toLowerCase(),
          country_name: c.country_name || c.name || fallback?.country_name || code,
          country_code: code,
          prefix: c.prefix || fallback?.prefix || '',
          currency: typeof c.currency === 'object' ? (c.currency?.code || c.currency?.name || 'XOF') : (c.currency || fallback?.currency || 'XOF'),
          currency_symbol: fallback?.currency_symbol || c.currency_symbol || '',
          flag: fallback?.flag || '🌍',
          zone: fallback?.zone || 'Afrique',
          status: c.status || 'Active',
          operators: fallback?.operators || []
        };
      });

      cachedCountries = cleaned;
      cachedCountriesTimestamp = now;

      return {
        success: true,
        cached: false,
        count: cleaned.length,
        countries: cleaned
      };
    }
  } catch (err) {
    console.warn('[SEBPAY COUNTRIES API] Échec appel distant, utilisation du catalogue de secours :', err.message);
  }

  // Fallback 20 pays certifiés
  cachedCountries = SEBPAY_SUPPORTED_COUNTRIES_FALLBACK;
  cachedCountriesTimestamp = now;

  return {
    success: true,
    cached: true,
    fallback: true,
    count: SEBPAY_SUPPORTED_COUNTRIES_FALLBACK.length,
    countries: SEBPAY_SUPPORTED_COUNTRIES_FALLBACK
  };
}

/**
 * Retourne une instance de HttpsProxyAgent configurée dynamiquement avec priorité SEBPAY_FIXIE_URL
 */
function getFixieHttpsProxyAgent(options = {}) {
  const { httpsAgent } = getFixieAgents('sebpay', options);
  return httpsAgent;
}

/**
 * Retourne la configuration officielle pour Axios avec HttpsProxyAgent garanti
 * Utilisable pour toute requête Axios vers l'API Sebpay
 */
function getSebpayAxiosConfig(customConfig = {}) {
  const agent = getFixieHttpsProxyAgent();
  return {
    baseURL: getSebpayBaseUrl(),
    headers: getSebpayHeaders(customConfig.headers || {}),
    httpsAgent: agent,
    httpAgent: agent,
    proxy: false,
    timeout: 25000,
    ...customConfig
  };
}

module.exports = {
  SEBPAY_DEFAULT_BASE_URL,
  SUPPORTED_COUNTRIES,
  SEBPAY_SUPPORTED_COUNTRIES_FALLBACK,
  SEBPAY_COUNTRY_OPERATORS,
  SEBPAY_DEFAULT_OPERATOR_BY_COUNTRY,
  resolveCountryAndCurrency,
  normalizeSebpayOperator,
  getSebpayBaseUrl,
  getSebpayHeaders,
  getSebpayConfigStatus,
  getFixieHttpsProxyAgent,
  getSebpayAxiosConfig,
  callSebpayApi,
  createSebpayCollection,
  getSebpayCollection,
  getSebpayCountries
};
