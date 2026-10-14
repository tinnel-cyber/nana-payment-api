/**
 * Module Client Réseau Officiel Sebpay pour l'API Pont Render
 * 
 * Sécurité & Spécifications :
 * - Double authentification par headers HTTP :
 *     "X-Public-Key": process.env.SEBPAY_PUBLIC_KEY
 *     "X-Secret-Key": process.env.SEBPAY_SECRET_KEY
 *     "Content-Type": "application/json"
 * - URL de base officielle : https://newapi.sebpay.bj/api/v1/
 * - Sortie réseau garantie par l'IP Statique Fixie (54.195.3.54) pour conformité bancaire
 * - Isolation stricte côté backend : X-Secret-Key n'est JAMAIS transmise au frontend
 */

const { fetchViaFixie } = require('./fixie-proxy');

// URL de base officielle Sebpay
const SEBPAY_DEFAULT_BASE_URL = 'https://newapi.sebpay.bj/api/v1/';

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
    hasPublicKey: Boolean(publicKey),
    hasSecretKey: Boolean(secretKey),
    maskedPublicKey,
    baseUrl,
    timestamp: new Date().toISOString()
  };
}

/**
 * Exécute une requête réseau sécurisée vers l'API Sebpay
 * - Passe obligatoirement par le proxy Fixie (IP statique 54.195.3.54)
 * - Injecte les headers X-Public-Key et X-Secret-Key
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

  const fetchOptions = {
    method,
    headers: reqHeaders,
    signal: AbortSignal.timeout(timeoutMs)
  };

  if (body && method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  console.log(`[SEBPAY REQUEST] ${method} ${targetUrl} (via Fixie IP Statique)...`);

  const response = await fetchViaFixie(targetUrl, fetchOptions);

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
    currency = 'XOF',
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

  const body = {
    amount: Math.round(Number(amount)),
    currency: currency || 'XOF',
    customer_phone: effectivePhone,
    phone: effectivePhone,
    customer_name: customerName || 'Client Nanasore',
    customer_email: customerEmail || 'client@nanasore.com',
    external_reference: externalReference,
    callback_url: effectiveCallback,
    operator: operator || 'MOMO',
    provider: operator || 'MOMO',
    description: description || `Paiement Commande ${orderId}`,
    ...customPayload
  };

  // Gestion du cas Orange Money OTP
  if (otpCode && String(otpCode).trim()) {
    body.otp_code = String(otpCode).trim();
    body.otp = String(otpCode).trim();
  }

  console.log(`[SEBPAY INITIATE] Collection pour ${externalReference} | ${amount} ${currency} | Opérateur: ${operator}`);

  const rawResponse = await callSebpayApi('collections', {
    method: 'POST',
    body
  });

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
    currency: currency || 'XOF',
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
    operators: ['Moov Money', 'TogoCom']
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

module.exports = {
  SEBPAY_DEFAULT_BASE_URL,
  SEBPAY_SUPPORTED_COUNTRIES_FALLBACK,
  getSebpayBaseUrl,
  getSebpayHeaders,
  getSebpayConfigStatus,
  callSebpayApi,
  createSebpayCollection,
  getSebpayCollection,
  getSebpayCountries
};
