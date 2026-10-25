/**
 * Module Fixie Proxy ISOLÉ Multi-Agrégateurs (Sebpay & Saspay)
 * 
 * RÈGLES STRICTES D'ISOLATION FIXIE :
 * 1. Configuration des proxies distincts :
 *    - Sebpay : utilise systématiquement process.env.FIXIE_URL_SEBPAY (fallback FIXIE_URL / QUOTAGUARDSTATIC_URL).
 *    - Saspay Pay-Out : utilise process.env.FIXIE_URL_SASPAY uniquement sur les endpoints de décaissement (Payouts).
 *    - Saspay Pay-In : direct en clair SANS aucun proxy.
 * 2. Zéro proxy global : suppression active de HTTP_PROXY, HTTPS_PROXY, etc.
 * 3. Health Checks isolés : /health et / répondent localement 200 sans toucher à Fixie.
 */

// Suppression stricte de toute variable de proxy global pour isoler le reste du serveur
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;
delete process.env.ALL_PROXY;
delete process.env.all_proxy;

const { HttpsProxyAgent } = require('https-proxy-agent');
const { ProxyAgent } = require('undici');

// Lecture dynamique de l'URL Fixie dédiée à Sebpay
function getFixieUrlSebpay() {
  return (
    process.env.FIXIE_URL_SEBPAY ||
    process.env.FIXIE_URL ||
    process.env.QUOTAGUARDSTATIC_URL ||
    'http://fixie:KFdz8Wm8fUS5Bqo@ventoux.usefixie.com:80'
  );
}

// Lecture dynamique de l'URL Fixie dédiée à Saspay (décaissements / payouts uniquement)
function getFixieUrlSaspay() {
  return process.env.FIXIE_URL_SASPAY || null;
}

// Caches des agents par agrégateur
let cachedSebpayFixieUrl = null;
let cachedSebpayHttpsAgent = null;
let cachedSebpayUndiciAgent = null;

let cachedSaspayFixieUrl = null;
let cachedSaspayHttpsAgent = null;
let cachedSaspayUndiciAgent = null;

/**
 * Retourne ou instancie les agents Proxy pour Sebpay (FIXIE_URL_SEBPAY)
 */
function getFixieAgentsSebpay() {
  const currentUrl = getFixieUrlSebpay();
  if (!currentUrl) {
    return { fixieUrl: null, httpsAgent: null, undiciAgent: null };
  }

  if (currentUrl !== cachedSebpayFixieUrl || !cachedSebpayHttpsAgent || !cachedSebpayUndiciAgent) {
    try {
      cachedSebpayHttpsAgent = new HttpsProxyAgent(currentUrl);
      cachedSebpayUndiciAgent = new ProxyAgent(currentUrl);
      cachedSebpayFixieUrl = currentUrl;
      console.log('[FIXIE PROXY SEBPAY] Agents initialisés avec succès via :', currentUrl.replace(/:[^:@]+@/, ':****@'));
    } catch (err) {
      console.error('[FIXIE PROXY ERROR] Erreur initialisation HttpsProxyAgent Sebpay :', err.message);
    }
  }

  return {
    fixieUrl: currentUrl,
    httpsAgent: cachedSebpayHttpsAgent,
    undiciAgent: cachedSebpayUndiciAgent
  };
}

/**
 * Retourne ou instancie les agents Proxy pour Saspay Pay-Out (FIXIE_URL_SASPAY)
 */
function getFixieAgentsSaspay() {
  const currentUrl = getFixieUrlSaspay();
  if (!currentUrl) {
    return { fixieUrl: null, httpsAgent: null, undiciAgent: null };
  }

  if (currentUrl !== cachedSaspayFixieUrl || !cachedSaspayHttpsAgent || !cachedSaspayUndiciAgent) {
    try {
      cachedSaspayHttpsAgent = new HttpsProxyAgent(currentUrl);
      cachedSaspayUndiciAgent = new ProxyAgent(currentUrl);
      cachedSaspayFixieUrl = currentUrl;
      console.log('[FIXIE PROXY SASPAY PAYOUT] Agents initialisés avec succès via :', currentUrl.replace(/:[^:@]+@/, ':****@'));
    } catch (err) {
      console.error('[FIXIE PROXY ERROR] Erreur initialisation HttpsProxyAgent Saspay :', err.message);
    }
  }

  return {
    fixieUrl: currentUrl,
    httpsAgent: cachedSaspayHttpsAgent,
    undiciAgent: cachedSaspayUndiciAgent
  };
}

/**
 * Rétro-compatibilité : retourne les agents Sebpay par défaut
 */
function getFixieAgents() {
  return getFixieAgentsSebpay();
}

/**
 * Vérifie si une URL cible correspond au domaine Sebpay
 */
function isSebpayUrl(url) {
  if (!url) return false;
  const str = String(url).toLowerCase();
  return str.includes('sebpay.bj') || str.includes('newapi.sebpay.bj');
}

/**
 * Vérifie si une URL cible correspond à un endpoint Saspay Pay-Out
 */
function isSaspayPayoutUrl(url) {
  if (!url) return false;
  const str = String(url).toLowerCase();
  return (str.includes('saspay.me') || str.includes('saspay.net')) && str.includes('/payouts');
}

/**
 * Exécute une requête HTTP sortante avec routage réseau intelligent :
 * - Sebpay : passe par FIXIE_URL_SEBPAY
 * - Saspay Payout : passe par FIXIE_URL_SASPAY
 * - Saspay Payin et tout le reste : passe DIRECTEMENT en clair (aucun proxy)
 * 
 * @param {string} url - URL cible
 * @param {object} options - Options standard fetch
 */
async function fetchViaFixie(url, options = {}) {
  const fetchOpts = { ...options };

  let targetAgents = null;

  if (isSebpayUrl(url) || options.aggregator === 'sebpay') {
    targetAgents = getFixieAgentsSebpay();
  } else if ((isSaspayPayoutUrl(url) || options.isPayout) && options.aggregator === 'saspay') {
    targetAgents = getFixieAgentsSaspay();
  } else if (options.forceFixie) {
    targetAgents = getFixieAgentsSebpay();
  }

  if (targetAgents && targetAgents.httpsAgent) {
    fetchOpts.agent = targetAgents.httpsAgent;
    fetchOpts.httpsAgent = targetAgents.httpsAgent;
    fetchOpts.httpAgent = targetAgents.httpsAgent;
    fetchOpts.proxy = false;
    if (targetAgents.undiciAgent) {
      fetchOpts.dispatcher = targetAgents.undiciAgent;
    }
  } else {
    // Communication directe en clair garantie : aucun proxy
    delete fetchOpts.agent;
    delete fetchOpts.httpsAgent;
    delete fetchOpts.httpAgent;
    delete fetchOpts.dispatcher;
  }

  const response = await fetch(url, fetchOpts);
  return response;
}

let cachedOutboundIp = null;
let cachedIpTimestamp = 0;
const IP_CACHE_TTL_MS = 60 * 60 * 1000; // Cache 1 heure

/**
 * Teste et extrait l'adresse IP publique sortante via Fixie (avec cache de 1 heure)
 */
async function getOutboundIp(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedOutboundIp && (now - cachedIpTimestamp < IP_CACHE_TTL_MS)) {
    return {
      ...cachedOutboundIp,
      cached: true,
      cachedAt: new Date(cachedIpTimestamp).toISOString()
    };
  }

  try {
    const startTime = Date.now();
    const response = await fetchViaFixie('https://api.ipify.org?format=json', {
      headers: { 'User-Agent': 'NanaPaymentProxy/1.0' },
      signal: AbortSignal.timeout(10000),
      forceFixie: true
    });

    if (!response.ok) {
      throw new Error(`Échec vérification IP : HTTP ${response.status}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    cachedOutboundIp = {
      success: true,
      ip: data.ip,
      isProxyActive: Boolean(getFixieUrlSebpay()),
      proxyConfigured: Boolean(getFixieUrlSebpay()),
      latencyMs,
      timestamp: new Date().toISOString()
    };
    cachedIpTimestamp = now;

    return cachedOutboundIp;
  } catch (err) {
    try {
      const respFallback = await fetchViaFixie('https://checkip.amazonaws.com', {
        signal: AbortSignal.timeout(8000),
        forceFixie: true
      });
      const textIp = (await respFallback.text()).trim();

      cachedOutboundIp = {
        success: true,
        ip: textIp,
        isProxyActive: Boolean(getFixieUrlSebpay()),
        proxyConfigured: Boolean(getFixieUrlSebpay()),
        fallback: true,
        timestamp: new Date().toISOString()
      };
      cachedIpTimestamp = now;

      return cachedOutboundIp;
    } catch (fallbackErr) {
      return {
        success: false,
        error: err.message,
        fallbackError: fallbackErr.message,
        isProxyActive: Boolean(getFixieUrlSebpay()),
        proxyConfigured: Boolean(getFixieUrlSebpay())
      };
    }
  }
}

module.exports = {
  getFixieUrl: getFixieUrlSebpay,
  getFixieUrlSebpay,
  getFixieUrlSaspay,
  getFixieAgents,
  getFixieAgentsSebpay,
  getFixieAgentsSaspay,
  isSebpayUrl,
  isSaspayPayoutUrl,
  FIXIE_URL: getFixieUrlSebpay(),
  FIXIE_URL_SEBPAY: getFixieUrlSebpay(),
  fetchViaFixie,
  getOutboundIp
};
