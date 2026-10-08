/**
 * Module Fixie Proxy pour requêtes sortantes vers banques et agrégateurs
 * Garantit le passage par adresse IP statique pour l'IP Whitelisting bancaire.
 */

const { HttpsProxyAgent } = require('https-proxy-agent');
const { ProxyAgent } = require('undici');

// Lecture de l'URL Fixie depuis les variables d'environnement
// Format Fixie officiel : http://fixie:<key>@velvet.usefixie.com:80
const FIXIE_URL = process.env.FIXIE_URL || process.env.QUOTAGUARDSTATIC_URL || '';

let httpsAgent = null;
let undiciAgent = null;

if (FIXIE_URL) {
  try {
    httpsAgent = new HttpsProxyAgent(FIXIE_URL);
    undiciAgent = new ProxyAgent(FIXIE_URL);
    console.log('[FIXIE PROXY] Proxy configuré avec succès via :', FIXIE_URL.replace(/:[^:@]+@/, ':****@'));
  } catch (err) {
    console.error('[FIXIE PROXY ERROR] Erreur initialisation agent proxy :', err.message);
  }
} else {
  console.warn('[FIXIE PROXY NOTICE] Variable FIXIE_URL non définie. Mode direct (IP dynamique) actif.');
}

/**
 * Exécute une requête HTTP sortante via le proxy Fixie si configuré
 * @param {string} url - URL cible (banque, CinetPay, Wave, Orange, etc.)
 * @param {object} options - Options standard fetch (method, headers, body, timeout)
 */
async function fetchViaFixie(url, options = {}) {
  const fetchOpts = { ...options };

  if (undiciAgent) {
    // Mode Node.js 18+ natif avec undici Dispatcher
    fetchOpts.dispatcher = undiciAgent;
  } else if (httpsAgent) {
    // Mode Agent HTTPS classique
    fetchOpts.agent = httpsAgent;
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
      isProxyActive: Boolean(FIXIE_URL),
      proxyConfigured: Boolean(FIXIE_URL),
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
        isProxyActive: Boolean(FIXIE_URL),
        proxyConfigured: Boolean(FIXIE_URL),
        fallback: true,
        timestamp: new Date().toISOString()
      };
    } catch (fallbackErr) {
      return {
        success: false,
        error: err.message,
        fallbackError: fallbackErr.message,
        isProxyActive: Boolean(FIXIE_URL),
        proxyConfigured: Boolean(FIXIE_URL)
      };
    }
  }
}

module.exports = {
  FIXIE_URL,
  httpsAgent,
  undiciAgent,
  fetchViaFixie,
  getOutboundIp
};
