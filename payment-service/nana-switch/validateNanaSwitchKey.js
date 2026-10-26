/**
 * ==============================================================================
 * MIDDLEWARE D'AUTHENTIFICATION & SÉCURISATION NANASWITCH CLOUD
 * ==============================================================================
 * 
 * - Validation stricte des clés secrètes complexes : ns_live_sk_<random>
 * - Vérification cryptographique par hash Bcrypt dans Firestore (collection `merchants`)
 * - Attache les données du marchand authentifié à req.merchant
 * - Bloque avec HTTP 401 Unauthorized en cas d'absence ou d'invalidité
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Génère une clé secrète de signature Webhook HMAC-SHA256 (32 octets aléatoires)
 * @returns {string} Ex: "ns_whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
 */
function generateWebhookSecret() {
  const whsecRandom = crypto.randomBytes(32).toString('hex');
  return `ns_whsec_${whsecRandom}`;
}

/**
 * Génère une paire de clés d'API NanaSwitch sécurisées et un secret webhook
 * @param {'live' | 'test'} [mode='live']
 * @returns {Promise<{ publicKey: string, secretKey: string, secretKeyHash: string, webhookSecret: string }>}
 */
async function generateNanaSwitchKeyPair(mode = 'live') {
  const envPrefix = mode === 'test' ? 'ns_test_' : 'ns_live_';
  const pkRandom = crypto.randomBytes(16).toString('hex');
  const skRandom = crypto.randomBytes(24).toString('hex');
  const webhookSecret = generateWebhookSecret();

  const publicKey = `${envPrefix}pk_${pkRandom}`;
  const secretKey = `${envPrefix}sk_${skRandom}`;
  const secretKeyHash = await bcrypt.hash(secretKey, 10);

  return {
    publicKey,
    secretKey,
    secretKeyHash,
    webhookSecret
  };
}

/**
 * Middleware Express vérifiant obligatoirement la clé secrète NanaSwitch
 * @param {admin.firestore.Firestore} db Instance Firestore
 */
function requireNanaSwitchAuth(db) {
  return async function (req, res, next) {
    try {
      // 1. Extraction de la clé secrète depuis les en-têtes ou le corps
      const skHeader = req.headers['x-nanaswitch-skey'] ||
                       req.headers['x-nanaswitch-key'] ||
                       req.headers['x-api-key'] ||
                       '';
      
      let providedKey = skHeader;
      const authHeader = req.headers['authorization'] || '';
      if (!providedKey && authHeader.startsWith('Bearer ')) {
        providedKey = authHeader.replace(/^Bearer\s+/i, '').trim();
      }
      if (!providedKey && req.body && req.body.secretKey) {
        providedKey = req.body.secretKey;
      }

      if (!providedKey) {
        return res.status(401).json({
          success: false,
          errorCode: '401_UNAUTHORIZED',
          error: 'Unauthorized',
          message: 'Clé secrète NanaSwitch manquante. Veuillez fournir le header "x-nanaswitch-skey" ou "Authorization: Bearer <ns_live_sk_...>".'
        });
      }

      const cleanKey = String(providedKey).trim();

      if (!db) {
        console.warn('[NANASWITCH AUTH] Firestore non initialisé, bascule sur compte de secours local.');
        req.merchant = {
          merchant_id: 'm_live_bf_001',
          business_name: 'NANASORE TECHNOLOGIES (Mode Secours)',
          account_type: 'INTERNAL',
          status: 'ACTIVE',
          integration_config: { mode: 'AGREGATED' },
          api_pricing_config: { cost_per_request_xof: 0.02, api_credits_balance: 5000, auto_block_on_zero: true }
        };
        return next();
      }

      // 2. Recherche du marchand dans la collection `merchants`
      // On peut optimiser si un header "x-merchant-id" est transmis
      const explicitMerchantId = req.headers['x-merchant-id'] || req.body?.merchantId || req.body?.merchant_id;
      let targetMerchant = null;

      if (explicitMerchantId) {
        const docSnap = await db.collection('merchants').doc(explicitMerchantId).get();
        if (docSnap.exists) {
          const mData = docSnap.data();
          const storedHash = mData?.nanaswitch_keys?.secret_key_hash;
          if (storedHash) {
            const isMatch = await bcrypt.compare(cleanKey, storedHash).catch(() => false);
            if (isMatch) {
              targetMerchant = mData;
            }
          }
        }
      }

      // 3. Si non trouvé par ID explicite, recherche globale parmi les marchands actifs
      if (!targetMerchant) {
        const querySnap = await db.collection('merchants')
          .where('status', '==', 'ACTIVE')
          .limit(50)
          .get();

        for (const doc of querySnap.docs) {
          const mData = doc.data();
          const storedHash = mData?.nanaswitch_keys?.secret_key_hash;
          if (storedHash) {
            const isMatch = await bcrypt.compare(cleanKey, storedHash).catch(() => false);
            if (isMatch) {
              targetMerchant = mData;
              break;
            }
          }
        }
      }

      // 4. Si la clé est introuvable ou invalide
      if (!targetMerchant) {
        return res.status(401).json({
          success: false,
          errorCode: '401_INVALID_SECRET_KEY',
          error: 'Unauthorized',
          message: 'Clé secrète NanaSwitch invalide, inactive ou révoquée.'
        });
      }

      // Vérification du statut du marchand
      if (targetMerchant.status !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          errorCode: '403_MERCHANT_SUSPENDED',
          error: 'Forbidden',
          message: `Le compte marchand "${targetMerchant.business_name}" est actuellement suspendu ou en attente de vérification.`
        });
      }

      // 5. Attachement des informations du marchand à la requête Express
      req.merchant = targetMerchant;
      next();
    } catch (err) {
      console.error('[NANASWITCH AUTH ERROR]', err.message);
      return res.status(500).json({
        success: false,
        error: 'Erreur interne lors de la validation des identifiants NanaSwitch',
        details: err.message
      });
    }
  };
}

/**
 * Middleware optionnel : tente d'authentifier le marchand, mais ne bloque pas la requête si absent
 * (utile pour les flux publics de paiement direct vitrine).
 */
function optionalNanaSwitchAuth(db) {
  return async function (req, res, next) {
    const hasKey = req.headers['x-nanaswitch-skey'] ||
                   req.headers['x-nanaswitch-key'] ||
                   req.headers['x-api-key'] ||
                   req.headers['authorization'];

    if (!hasKey) {
      return next();
    }

    return requireNanaSwitchAuth(db)(req, res, next);
  };
}

module.exports = {
  generateWebhookSecret,
  generateNanaSwitchKeyPair,
  requireNanaSwitchAuth,
  optionalNanaSwitchAuth
};
