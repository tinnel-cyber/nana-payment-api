/**
 * ==============================================================================
 * Module Fixie Proxy ISOLÉ & DYNAMIQUE Multi-Agrégateurs (Sebpay & Saspay)
 * ==============================================================================
 * 
 * RÈGLES STRICTES D'ARCHITECTURE & SÉCURITÉ :
 * 1. Résolution dynamique et isolée par passerelle :
 *    - Sebpay : priorité absolue à SEBPAY_FIXIE_URL (fallback: FIXIE_URL, puis SASPAY_FIXIE_URL).
 *    - SasPay : priorité absolue à SASPAY_FIXIE_URL (fallback: FIXIE_URL, puis SEBPAY_FIXIE_URL).
 * 2. Zéro secret en dur : aucun token, mot de passe ou URL par défaut ne doit être commité.
 * 3. Fallback & Failover de proxy : si un proxy rencontre un quota épuisé ou une indisponibilité,
 *    possibilité de basculer vers le proxy alternatif opérationnel.
 * 4. Traçabilité complète : logging structuré avec masquage systématique des credentials.
 * 5. Zéro proxy global : suppression active de HTTP_PROXY, HTTPS_PROXY pour préserver Firebase,
 *    les métriques et les healthchecks locaux.
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

// Cache dynamique des agents par URL de proxy pour éviter les fuites de mémoire
const agentCache = new Map();

/**
 * Masque les identifiants d'une URL de proxy pour les logs (ex: "http://fixie:****@ventoux.usefixie.com:80")
 * @param {string} urlString
 * @returns {string}
 */
function maskProxyUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return '[NON_CONFIGURE]';
  return urlString.replace(/:[^:@]+@/, ':****@');
}

/**
 * Résout dynamiquement l'URL et le nom de la variable d'environnement pour une passerelle donnée.
 * 
 * Hiérarchie Sebpay :
 *   1. process.env.SEBPAY_FIXIE_URL (Recommandé)
 *   2. process.env.FIXIE_URL_SEBPAY (Rétro-compatibilité)
 *   3. process.env.FIXIE_URL (Fallback global)
 *   4. process.env.QUOTAGUARDSTATIC_URL (Fallback legacy)
 *   5. process.env.SASPAY_FIXIE_URL / FIXIE_URL_SASPAY (Repli croisé vers proxy alternatif si activé ou en secours)
 * 
 * Hiérarchie SasPay :
 *   1. process.env.SASPAY_FIXIE_URL (Recommandé)
 *   2. process.env.FIXIE_URL_SASPAY (Rétro-compatibilité)
 *   3. process.env.FIXIE_URL (Fallback global)
 *   4. process.env.QUOTAGUARDSTATIC_URL (Fallback legacy)
 *   5. process.env.SEBPAY_FIXIE_URL / FIXIE_URL_SEBPAY (Repli croisé vers proxy alternatif si activé ou en secours)
 * 
 * @param {'sebpay'|'saspay'|string} gateway - Nom de la passerelle cible
 * @param {object} [options]
 * @param {boolean} [options.forceAlternate=false] - Force l'utilisation du proxy alternatif (ex: après un échec quota)
 * @returns {{ proxyUrl: string|null, variableName: string, gateway: string, isFallback: boolean }}
 */
function resolveProxyConfig(gateway = 'sebpay', options = {}) {
  const cleanGateway = String(gateway || 'sebpay').toLowerCase().trim();
  const forceAlternate = Boolean(options.forceAlternate);

  let proxyUrl = null;
  let variableName = 'AUCUN';
  let isFallback = false;

  if (cleanGateway === 'saspay') {
    if (forceAlternate) {
      if (process.env.SEBPAY_FIXIE_URL) {
        proxyUrl = process.env.SEBPAY_FIXIE_URL;
        variableName = 'SEBPAY_FIXIE_URL (Alternate Failover)';
        isFallback = true;
      } else if (process.env.FIXIE_URL_SEBPAY) {
        proxyUrl = process.env.FIXIE_URL_SEBPAY;
        variableName = 'FIXIE_URL_SEBPAY (Alternate Failover)';
        isFallback = true;
      } else if (process.env.FIXIE_URL) {
        proxyUrl = process.env.FIXIE_URL;
        variableName = 'FIXIE_URL (Global Fallover)';
        isFallback = true;
      }
    } else {
      // Priorité SasPay
      if (process.env.SASPAY_FIXIE_URL) {
        proxyUrl = process.env.SASPAY_FIXIE_URL;
        variableName = 'SASPAY_FIXIE_URL';
      } else if (process.env.FIXIE_URL_SASPAY) {
        proxyUrl = process.env.FIXIE_URL_SASPAY;
        variableName = 'FIXIE_URL_SASPAY';
      } else if (process.env.FIXIE_URL) {
        proxyUrl = process.env.FIXIE_URL;
        variableName = 'FIXIE_URL (Global Fallback)';
        isFallback = true;
      } else if (process.env.QUOTAGUARDSTATIC_URL) {
        proxyUrl = process.env.QUOTAGUARDSTATIC_URL;
        variableName = 'QUOTAGUARDSTATIC_URL (Global Fallback)';
        isFallback = true;
      } else if (process.env.SEBPAY_FIXIE_URL) {
        proxyUrl = process.env.SEBPAY_FIXIE_URL;
        variableName = 'SEBPAY_FIXIE_URL (Cross-Gateway Fallback)';
        isFallback = true;
      } else if (process.env.FIXIE_URL_SEBPAY) {
        proxyUrl = process.env.FIXIE_URL_SEBPAY;
        variableName = 'FIXIE_URL_SEBPAY (Cross-Gateway Fallback)';
        isFallback = true;
      }
    }
  } else {
    // Par défaut : Sebpay
    if (forceAlternate) {
      if (process.env.SASPAY_FIXIE_URL) {
        proxyUrl = process.env.SASPAY_FIXIE_URL;
        variableName = 'SASPAY_FIXIE_URL (Alternate Failover)';
        isFallback = true;
      } else if (process.env.FIXIE_URL_SASPAY) {
        proxyUrl = process.env.FIXIE_URL_SASPAY;
        variableName = 'FIXIE_URL_SASPAY (Alternate Failover)';
        isFallback = true;
      } else if (process.env.FIXIE_URL) {
        proxyUrl = process.env.FIXIE_URL;
        variableName = 'FIXIE_URL (Global Fallover)';
        isFallback = true;
      }
    } else {
      // Priorité Sebpay
      if (process.env.SEBPAY_FIXIE_URL) {
        proxyUrl = process.env.SEBPAY_FIXIE_URL;
        variableName = 'SEBPAY_FIXIE_URL';
      } else if (process.env.FIXIE_URL_SEBPAY) {
        proxyUrl = process.env.FIXIE_URL_SEBPAY;
        variableName = 'FIXIE_URL_SEBPAY';
      } else if (process.env.FIXIE_URL) {
        proxyUrl = process.env.FIXIE_URL;
        variableName = 'FIXIE_URL (Global Fallback)';
        isFallback = true;
      } else if (process.env.QUOTAGUARDSTATIC_URL) {
        proxyUrl = process.env.QUOTAGUARDSTATIC_URL;
        variableName = 'QUOTAGUARDSTATIC_URL (Global Fallback)';
        isFallback = true;
      } else if (process.env.SASPAY_FIXIE_URL) {
        proxyUrl = process.env.SASPAY_FIXIE_URL;
        variableName = 'SASPAY_FIXIE_URL (Cross-Gateway Fallback)';
        isFallback = true;
      } else if (process.env.FIXIE_URL_SASPAY) {
        proxyUrl = process.env.FIXIE_URL_SASPAY;
        variableName = 'FIXIE_URL_SASPAY (Cross-Gateway Fallback)';
        isFallback = true;
      }
    }
  }

  return {
    proxyUrl: proxyUrl ? proxyUrl.trim() : null,
    variableName,
    gateway: cleanGateway,
    isFallback
  };
}

/**
 * Journalise l'utilisation du proxy pour une transaction de manière structurée et sécurisée
 * Format attendu : [PROXY ROUTER] Utilisation de <VAR> pour la transaction <ID>
 * 
 * @param {string} variableName - Nom de la variable utilisée (ex: SEBPAY_FIXIE_URL, SASPAY_FIXIE_URL)
 * @param {string} transactionId - Référence ou ID de la transaction
 * @param {string} [maskedUrl] - URL masquée
 */
function logProxyRouterUsage(variableName, transactionId, maskedUrl = null) {
  const txLabel = transactionId || 'NON_SPECIFIEE';
  const urlSuffix = maskedUrl ? ` (${maskedUrl})` : '';
  console.log(`[PROXY ROUTER] Utilisation de ${variableName} pour la transaction ${txLabel}${urlSuffix}`);
}

/**
 * Construit un agent Undici ProxyAgent configuré de manière explicite et robuste
 * pour éviter l'erreur "Proxy response (407) !== 200 when HTTP Tunneling".
 * 
 * @param {string} proxyUrl - URL complète du proxy (ex: http://fixie:pass@host:80)
 * @returns {ProxyAgent|null}
 */
function buildUndiciProxyAgent(proxyUrl) {
  if (!proxyUrl) return null;

  try {
    const parsed = new URL(proxyUrl);
    const username = decodeURIComponent(parsed.username || '');
    const password = decodeURIComponent(parsed.password || '');
    const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
    const cleanUri = `${parsed.protocol}//${parsed.hostname}:${port}`;

    // Log masqué au démarrage affirmant l'extraction réussie des credentials (sans mot de passe en clair)
    console.log(`[FIXIE DEBUG] Username: ${parsed.username || '[aucun]'}, Password Present: ${Boolean(parsed.password)}`);

    const agentOpts = {
      uri: cleanUri,
      proxyTunnel: true
    };

    if (username && password) {
      const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
      // Configuration explicite de l'authentification proxy pour undici CONNECT tunnel
      agentOpts.token = `Basic ${basicAuth}`;
      agentOpts.headers = {
        'Proxy-Authorization': `Basic ${basicAuth}`,
        'proxy-authorization': `Basic ${basicAuth}`
      };
    }

    return new ProxyAgent(agentOpts);
  } catch (err) {
    console.error('[FIXIE PROXY ERROR] Impossible de parser l\'URL Fixie pour Undici ProxyAgent :', err.message);
    return null;
  }
}

/**
 * Construit un agent HttpsProxyAgent officiel pour Axios et node-fetch
 * @param {string} proxyUrl
 * @returns {HttpsProxyAgent|null}
 */
function buildHttpsProxyAgent(proxyUrl) {
  if (!proxyUrl) return null;
  try {
    return new HttpsProxyAgent(proxyUrl);
  } catch (err) {
    console.error('[FIXIE PROXY ERROR] Impossible d\'initialiser HttpsProxyAgent :', err.message);
    return null;
  }
}

/**
 * Retourne ou instancie les agents HTTP/HTTPS et Undici en cache pour une passerelle
 * 
 * @param {'sebpay'|'saspay'|string} gateway
 * @param {object} [options]
 * @param {string} [options.transactionId] - ID de transaction pour logging immédiat
 * @param {boolean} [options.forceAlternate=false] - Utilise le proxy alternatif
 * @param {boolean} [options.silent=false] - Ne pas émettre de log si déjà journalisé
 * @returns {{ fixieUrl: string|null, variableName: string, httpsAgent: HttpsProxyAgent|null, undiciAgent: ProxyAgent|null, isFallback: boolean }}
 */
function getFixieAgents(gateway = 'sebpay', options = {}) {
  const { proxyUrl, variableName, isFallback } = resolveProxyConfig(gateway, options);

  if (options.transactionId && !options.silent) {
    logProxyRouterUsage(variableName, options.transactionId, maskProxyUrl(proxyUrl));
  }

  if (!proxyUrl) {
    return {
      fixieUrl: null,
      variableName: 'AUCUN',
      httpsAgent: null,
      undiciAgent: null,
      isFallback: false
    };
  }

  // Vérification du cache pour éviter de recréer les sockets
  if (!agentCache.has(proxyUrl)) {
    try {
      const httpsAgent = buildHttpsProxyAgent(proxyUrl);
      const undiciAgent = buildUndiciProxyAgent(proxyUrl);
      agentCache.set(proxyUrl, { httpsAgent, undiciAgent });
      console.log(`[PROXY POOL] Agents initialisés avec succès pour [${variableName}] via ${maskProxyUrl(proxyUrl)}`);
    } catch (err) {
      console.error(`[PROXY POOL ERROR] Impossible d'initialiser les agents pour [${variableName}] :`, err.message);
      return {
        fixieUrl: proxyUrl,
        variableName,
        httpsAgent: null,
        undiciAgent: null,
        isFallback
      };
    }
  }

  const cached = agentCache.get(proxyUrl);
  return {
    fixieUrl: proxyUrl,
    variableName,
    httpsAgent: cached.httpsAgent,
    undiciAgent: cached.undiciAgent,
    isFallback
  };
}

/**
 * Helpers dédiés par agrégateur
 */
function getFixieUrlSebpay(options) {
  return resolveProxyConfig('sebpay', options).proxyUrl;
}

function getFixieUrlSaspay(options) {
  return resolveProxyConfig('saspay', options).proxyUrl;
}

function getFixieUrl(gateway = 'sebpay', options) {
  return resolveProxyConfig(gateway, options).proxyUrl;
}

function getFixieAgentsSebpay(options) {
  return getFixieAgents('sebpay', options);
}

function getFixieAgentsSaspay(options) {
  return getFixieAgents('saspay', options);
}

/**
 * Génère une configuration Axios prête à l'emploi avec isolation de proxy
 * @param {'sebpay'|'saspay'|string} gateway
 * @param {object} [customConfig]
 */
function getAxiosProxyConfig(gateway = 'sebpay', customConfig = {}) {
  const { httpsAgent, variableName } = getFixieAgents(gateway, {
    transactionId: customConfig.transactionId || customConfig.orderId
  });

  return {
    httpsAgent,
    httpAgent: httpsAgent,
    proxy: false, // Bloque toute détection erronée d'Axios
    headers: customConfig.headers || {},
    timeout: customConfig.timeout || 25000,
    ...customConfig
  };
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
 * - Sebpay : passe par SEBPAY_FIXIE_URL (avec fallbacks)
 * - Saspay Payout : passe par SASPAY_FIXIE_URL (avec fallbacks)
 * - Saspay Payin et appels internes : passe DIRECTEMENT en clair (aucun proxy)
 * 
 * @param {string} url - URL cible
 * @param {object} options - Options standard fetch
 */
async function fetchViaFixie(url, options = {}) {
  const fetchOpts = { ...options };
  const txId = options.transactionId || options.orderId || options.externalReference || null;

  let targetAgents = null;
  let targetGateway = null;

  if (isSebpayUrl(url) || options.aggregator === 'sebpay' || options.gateway === 'sebpay') {
    targetGateway = 'sebpay';
    targetAgents = getFixieAgents('sebpay', {
      transactionId: txId,
      forceAlternate: options.forceAlternate
    });
  } else if ((isSaspayPayoutUrl(url) || options.isPayout) && (options.aggregator === 'saspay' || options.gateway === 'saspay')) {
    targetGateway = 'saspay';
    targetAgents = getFixieAgents('saspay', {
      transactionId: txId,
      forceAlternate: options.forceAlternate
    });
  } else if (options.forceFixie) {
    targetGateway = options.gateway || 'sebpay';
    targetAgents = getFixieAgents(targetGateway, {
      transactionId: txId,
      forceAlternate: options.forceAlternate
    });
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
 * @param {boolean} forceRefresh
 * @param {'sebpay'|'saspay'} gateway
 */
async function getOutboundIp(forceRefresh = false, gateway = 'sebpay') {
  const now = Date.now();
  if (!forceRefresh && cachedOutboundIp && (now - cachedIpTimestamp < IP_CACHE_TTL_MS)) {
    return {
      ...cachedOutboundIp,
      cached: true,
      cachedAt: new Date(cachedIpTimestamp).toISOString()
    };
  }

  const proxyConfig = resolveProxyConfig(gateway);

  try {
    const startTime = Date.now();
    const response = await fetchViaFixie('https://api.ipify.org?format=json', {
      headers: { 'User-Agent': 'NanaPaymentProxy/2.0' },
      signal: AbortSignal.timeout(10000),
      forceFixie: Boolean(proxyConfig.proxyUrl),
      gateway
    });

    if (!response.ok) {
      throw new Error(`Échec vérification IP : HTTP ${response.status}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    cachedOutboundIp = {
      success: true,
      ip: data.ip,
      gateway,
      resolvedVariable: proxyConfig.variableName,
      isProxyActive: Boolean(proxyConfig.proxyUrl),
      proxyConfigured: Boolean(proxyConfig.proxyUrl),
      latencyMs,
      timestamp: new Date().toISOString()
    };
    cachedIpTimestamp = now;

    return cachedOutboundIp;
  } catch (err) {
    try {
      const respFallback = await fetchViaFixie('https://checkip.amazonaws.com', {
        signal: AbortSignal.timeout(8000),
        forceFixie: Boolean(proxyConfig.proxyUrl),
        gateway
      });
      const textIp = (await respFallback.text()).trim();

      cachedOutboundIp = {
        success: true,
        ip: textIp,
        gateway,
        resolvedVariable: proxyConfig.variableName,
        isProxyActive: Boolean(proxyConfig.proxyUrl),
        proxyConfigured: Boolean(proxyConfig.proxyUrl),
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
        gateway,
        resolvedVariable: proxyConfig.variableName,
        isProxyActive: Boolean(proxyConfig.proxyUrl),
        proxyConfigured: Boolean(proxyConfig.proxyUrl)
      };
    }
  }
}

module.exports = {
  resolveProxyConfig,
  logProxyRouterUsage,
  buildUndiciProxyAgent,
  buildHttpsProxyAgent,
  getFixieUrl,
  getFixieUrlSebpay,
  getFixieUrlSaspay,
  getFixieAgents,
  getFixieAgentsSebpay,
  getFixieAgentsSaspay,
  getAxiosProxyConfig,
  isSebpayUrl,
  isSaspayPayoutUrl,
  fetchViaFixie,
  getOutboundIp,
  maskProxyUrl
};
