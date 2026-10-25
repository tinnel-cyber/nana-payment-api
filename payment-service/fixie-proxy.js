/**
 * Module Fixie Proxy ISOLÉ pour requêtes sortantes vers l'API Sebpay
 * 
 * RÈGLES STRICTES D'ISOLATION FIXIE :
 * 1. Isolation stricte : L'agent Fixie (HttpsProxyAgent / undici ProxyAgent) n'est injecté QUE
 *    dans les requêtes HTTP/HTTPS à destination de l'API Sebpay (https://newapi.sebpay.bj).
 * 2. Zéro proxy global : Suppression active des variables HTTP_PROXY / HTTPS_PROXY pour garantir
 *    qu'aucun sous-système (Firebase Admin, Google APIs, logs, pings) ne transite par Fixie.
 * 3. Health Checks protégés : Les pings de monitoring (ex: /health, /) répondent localement
 *    sans jamais déclencher d'appel réseau ni consommer le quota Fixie.
 * 4. Les requêtes hors-Sebpay communiquent directement en clair.
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

// Lecture dynamique de l'URL Fixie depuis les variables d'environnement Render
function getFixieUrl() {
  return process.env.FIXIE_URL || process.env.QUOTAGUARDSTATIC_URL || 'http://fixie:KFdz8Wm8fUS5Bqo@ventoux.usefixie.com:80';
}

let cachedFixieUrl = null;
let cachedHttpsAgent = null;
let cachedUndiciAgent = null;

/**
 * Retourne ou instancie les agents Proxy HttpsProxyAgent et undici ProxyAgent
 */
function getFixieAgents() {
  const currentUrl = getFixieUrl();
  if (!currentUrl) {
    return { fixieUrl: null, httpsAgent: null, undiciAgent: null };
  }

  if (currentUrl !== cachedFixieUrl || !cachedHttpsAgent || !cachedUndiciAgent) {
    try {
      cachedHttpsAgent = new HttpsProxyAgent(currentUrl);
      cachedUndiciAgent = new ProxyAgent(currentUrl);
      cachedFixieUrl = currentUrl;
      console.log('[FIXIE PROXY ISOLÉ] Agents HttpsProxyAgent & ProxyAgent initialisés exclusivement pour Sebpay via :', currentUrl.replace(/:[^:@]+@/, ':****@'));
    } catch (err) {
      console.error('[FIXIE PROXY ERROR] Erreur initialisation HttpsProxyAgent :', err.message);
    }
  }

  return {
    fixieUrl: currentUrl,
    httpsAgent: cachedHttpsAgent,
    undiciAgent: cachedUndiciAgent
  };
}

/**
 * Vérifie si une URL cible correspond au domaine de l'API Sebpay
 */
function isSebpayUrl(url) {
  if (!url) return false;
  const str = String(url).toLowerCase();
  return str.includes('sebpay.bj') || str.includes('newapi.sebpay.bj');
}

/**
 * Exécute une requête HTTP sortante
 * RÈGLE STRICTE : Le proxy Fixie n'est injecté QUE pour les URLs Sebpay (newapi.sebpay.bj).
 * Toutes les autres requêtes (Firebase, tests, pings) sortent directement en clair.
 * 
 * @param {string} url - URL cible
 * @param {object} options - Options standard fetch (method, headers, body, timeout, forceFixie)
 */
async function fetchViaFixie(url, options = {}) {
  const fetchOpts = { ...options };

  // Injection du proxy Fixie UNIQUEMENT si l'URL est Sebpay ou si explicitement forcé pour diagnostic IP
  const shouldRouteViaFixie = isSebpayUrl(url) || Boolean(options.forceFixie);

  if (shouldRouteViaFixie) {
    const { httpsAgent, undiciAgent } = getFixieAgents();
    if (httpsAgent) {
      fetchOpts.agent = httpsAgent;
      fetchOpts.httpsAgent = httpsAgent; // Axios compatibility
      fetchOpts.httpAgent = httpsAgent;
      fetchOpts.proxy = false; // Empêche Axios de chercher un proxy système
    }
    if (undiciAgent) {
      fetchOpts.dispatcher = undiciAgent; // Node 18+ undici / global fetch
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
const IP_CACHE_TTL_MS = 60 * 60 * 1000; // Cache 1 heure pour éviter toute consommation inutile par monitoring

/**
 * Teste et extrait l'adresse IP publique sortante via Fixie (avec cache de 1 heure)
 * Protégé contre les appels répétitifs de robots ou de health checks
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
      forceFixie: true // Autorisé explicitement pour le diagnostic d'IP bancaire
    });

    if (!response.ok) {
      throw new Error(`Échec vérification IP : HTTP ${response.status}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    cachedOutboundIp = {
      success: true,
      ip: data.ip,
      isProxyActive: Boolean(getFixieUrl()),
      proxyConfigured: Boolean(getFixieUrl()),
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
        isProxyActive: Boolean(getFixieUrl()),
        proxyConfigured: Boolean(getFixieUrl()),
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
        isProxyActive: Boolean(getFixieUrl()),
        proxyConfigured: Boolean(getFixieUrl())
      };
    }
  }
}

module.exports = {
  getFixieUrl,
  getFixieAgents,
  isSebpayUrl,
  FIXIE_URL: getFixieUrl(),
  httpsAgent: cachedHttpsAgent,
  undiciAgent: cachedUndiciAgent,
  fetchViaFixie,
  getOutboundIp
};
