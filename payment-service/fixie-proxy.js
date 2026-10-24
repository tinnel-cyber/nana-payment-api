/**
 * Module Fixie Proxy pour requêtes sortantes vers banques et agrégateurs
 * Garantit le passage systématique par l'adresse IP statique pour l'IP Whitelisting bancaire.
 */

const { HttpsProxyAgent } = require('https-proxy-agent');
const { ProxyAgent } = require('undici');

// Lecture dynamique garantie de l'URL Fixie depuis les variables d'environnement
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
    console.warn('[FIXIE PROXY NOTICE] Variable FIXIE_URL non définie. Mode direct (IP dynamique) actif.');
    return { fixieUrl: null, httpsAgent: null, undiciAgent: null };
  }

  if (currentUrl !== cachedFixieUrl || !cachedHttpsAgent || !cachedUndiciAgent) {
    try {
      cachedHttpsAgent = new HttpsProxyAgent(currentUrl);
      cachedUndiciAgent = new ProxyAgent(currentUrl);
      cachedFixieUrl = currentUrl;
      console.log('[FIXIE PROXY] Agents HttpsProxyAgent & ProxyAgent initialisés avec succès via :', currentUrl.replace(/:[^:@]+@/, ':****@'));
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
 * Exécute une requête HTTP sortante via le proxy Fixie si configuré
 * @param {string} url - URL cible (banque, Sebpay, CinetPay, Wave, etc.)
 * @param {object} options - Options standard fetch / axios (method, headers, body, timeout)
 */
async function fetchViaFixie(url, options = {}) {
  const fetchOpts = { ...options };
  const { httpsAgent, undiciAgent } = getFixieAgents();

  // Injection garantie de l'agent HTTPS pour Axios, node-fetch et requêtes HTTP Node
  if (httpsAgent) {
    if (!fetchOpts.agent) fetchOpts.agent = httpsAgent;
    if (!fetchOpts.httpsAgent) fetchOpts.httpsAgent = httpsAgent;
    fetchOpts.proxy = false; // Empêche Axios de chercher un proxy système
  }

  // Injection garantie du dispatcher undici pour Node 18+ global fetch
  if (undiciAgent && !fetchOpts.dispatcher) {
    fetchOpts.dispatcher = undiciAgent;
  }

  const response = await fetch(url, fetchOpts);
  return response;
}

/**
 * Teste et extrait l'adresse IP publique sortante actuelle
 * Permet de vérifier instantanément si Fixie est opérationnel et de récupérer
 * l'adresse IP statique exacte à inscrire dans la liste blanche de la banque.
 */
async function getOutboundIp() {
  try {
    const startTime = Date.now();
    const response = await fetchViaFixie('https://api.ipify.org?format=json', {
      headers: { 'User-Agent': 'NanaPaymentProxy/1.0' },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Échec vérification IP : HTTP ${response.status}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      success: true,
      ip: data.ip,
      isProxyActive: Boolean(getFixieUrl()),
      proxyConfigured: Boolean(getFixieUrl()),
      latencyMs,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    // Tentative de secours avec checkip.amazonaws.com
    try {
      const respFallback = await fetchViaFixie('https://checkip.amazonaws.com', {
        signal: AbortSignal.timeout(8000)
      });
      const textIp = (await respFallback.text()).trim();
      return {
        success: true,
        ip: textIp,
        isProxyActive: Boolean(getFixieUrl()),
        proxyConfigured: Boolean(getFixieUrl()),
        fallback: true,
        timestamp: new Date().toISOString()
      };
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
  FIXIE_URL: getFixieUrl(),
  httpsAgent: cachedHttpsAgent,
  undiciAgent: cachedUndiciAgent,
  fetchViaFixie,
  getOutboundIp
};
