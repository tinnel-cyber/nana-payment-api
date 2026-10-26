/**
 * ==============================================================================
 * MIDDLEWARE DE GESTION DU RISQUE & PLAFOND MENSUEL KYC - NANASWITCH CLOUD
 * ==============================================================================
 * 
 * Règles de Plafonnement par Profil KYC :
 * - Particulier (INDIVIDUAL) : 1 000 000 XOF de volume cumulé par mois civil.
 * - Entreprise (ENTERPRISE)   : 5 000 000 XOF de volume cumulé par mois civil (extensible Super Admin).
 * 
 * Code d'erreur en cas de dépassement : HTTP 403 Forbidden
 * Code machine : ERROR_MONTHLY_VOLUME_LIMIT_REACHED
 */

const KYC_LIMITS = {
  INDIVIDUAL: {
    max_monthly_volume_xof: 1000000,
    description: "Compte Particulier / Indépendant"
  },
  ENTERPRISE: {
    max_monthly_volume_xof: 5000000,
    description: "Compte Entreprise Enregistrée"
  }
};

// Mémoire tampon pour tests, environnements de secours ou fallbacks offline
const inMemoryMonthlyUsage = new Map();

/**
 * Détermine le profil KYC (INDIVIDUAL vs ENTERPRISE) d'un compte marchand
 * @param {object} merchant Données du marchand Firestore
 * @returns {'INDIVIDUAL' | 'ENTERPRISE'}
 */
function resolveMerchantKycTier(merchant) {
  if (!merchant) return 'INDIVIDUAL';
  if (merchant.kyc_tier) {
    const t = String(merchant.kyc_tier).toUpperCase();
    if (t === 'ENTERPRISE' || t === 'INDIVIDUAL') return t;
  }
  if (merchant.account_tier) {
    const t = String(merchant.account_tier).toUpperCase();
    if (t === 'ENTERPRISE' || t === 'INDIVIDUAL') return t;
  }
  const rawType = String(merchant.type || merchant.account_type || merchant.kyc?.type || '').toLowerCase();
  if (rawType === 'entreprise' || rawType === 'enterprise' || rawType === 'company') {
    return 'ENTERPRISE';
  }
  return 'INDIVIDUAL';
}

/**
 * Récupère le plafond mensuel autorisé pour le marchand (en tenant compte d'extensions Super Admin)
 * @param {object} merchant 
 * @returns {number} Plafond en XOF
 */
function getMerchantMonthlyLimit(merchant) {
  if (merchant && merchant.custom_monthly_limit_xof && Number(merchant.custom_monthly_limit_xof) > 0) {
    return Number(merchant.custom_monthly_limit_xof);
  }
  const tier = resolveMerchantKycTier(merchant);
  return KYC_LIMITS[tier]?.max_monthly_volume_xof || 1000000;
}

/**
 * Calcule ou récupère le volume de transactions cumulé pour le mois civil en cours (YYYY-MM)
 * @param {admin.firestore.Firestore} db 
 * @param {object|string} merchantOrId Objet marchand ou merchantId
 * @returns {Promise<number>} Volume mensuel en XOF
 */
async function getMerchantMonthlyVolume(db, merchantOrId) {
  const currentMonth = new Date().toISOString().slice(0, 7); // ex: "2026-10"
  const merchantId = typeof merchantOrId === 'string' ? merchantOrId : merchantOrId?.merchant_id;
  const merchantObj = typeof merchantOrId === 'object' ? merchantOrId : null;

  // 1. Vérification si déjà présent dans l'objet merchant en cache/Firestore
  if (merchantObj?.monthly_usage?.month === currentMonth && typeof merchantObj.monthly_usage.volume_xof === 'number') {
    return Number(merchantObj.monthly_usage.volume_xof) || 0;
  }

  // 2. Vérification en base Firestore si merchantId disponible
  if (db && merchantId) {
    try {
      const docSnap = await db.collection('merchants').doc(merchantId).get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data.monthly_usage?.month === currentMonth && typeof data.monthly_usage.volume_xof === 'number') {
          return Number(data.monthly_usage.volume_xof) || 0;
        }
      }
    } catch (err) {
      console.warn('[TRANSACTION LIMIT] Lecture Firestore monthly_usage :', err.message);
    }
  }

  // 3. Fallback mémoire
  const memKey = `${merchantId || 'default'}_${currentMonth}`;
  return inMemoryMonthlyUsage.get(memKey) || 0;
}

/**
 * Vérifie si une transaction de montant `amount` respecte le plafond mensuel KYC
 * @param {admin.firestore.Firestore} db Instance Firestore
 * @param {object} merchant Données du marchand
 * @param {number} amount Montant de la transaction candidate en XOF
 * @returns {Promise<object>} Résultat de conformité KYC { allowed, tier, currentVolume, maxLimit, ... }
 */
async function checkTransactionLimit(db, merchant, amount = 0) {
  const numericAmount = Math.max(0, Number(amount) || 0);
  const tier = resolveMerchantKycTier(merchant);
  const maxLimit = getMerchantMonthlyLimit(merchant);
  const currentVolume = await getMerchantMonthlyVolume(db, merchant);
  const projectedVolume = currentVolume + numericAmount;

  const currentFormatted = currentVolume.toLocaleString('fr-FR');
  const maxFormatted = maxLimit.toLocaleString('fr-FR');
  const statusText = `Volume mensuel actuel : ${currentFormatted} / ${maxFormatted} XOF`;

  if (projectedVolume > maxLimit) {
    const excess = projectedVolume - maxLimit;
    const remaining = Math.max(0, maxLimit - currentVolume);

    return {
      allowed: false,
      code: 403,
      error: 'ERROR_MONTHLY_VOLUME_LIMIT_REACHED',
      tier,
      currentVolume,
      attemptedAmount: numericAmount,
      maxLimit,
      projectedVolume,
      remainingVolume: remaining,
      statusText,
      errorResponse: {
        success: false,
        error: 'ERROR_MONTHLY_VOLUME_LIMIT_REACHED',
        code: 403,
        message: `Plafond mensuel de transactions dépassé pour votre profil KYC (${tier === 'INDIVIDUAL' ? 'Compte Particulier : max 1 000 000 XOF/mois' : 'Compte Entreprise : max 5 000 000 XOF/mois'}).`,
        status_text: statusText,
        limit_details: {
          tier,
          description: KYC_LIMITS[tier]?.description || '',
          current_monthly_volume_xof: currentVolume,
          attempted_amount_xof: numericAmount,
          max_monthly_volume_xof: maxLimit,
          remaining_volume_xof: remaining,
          excess_amount_xof: excess,
          status_text: statusText,
          upgrade_incentive: tier === 'INDIVIDUAL' 
            ? 'Soumettez vos documents d\'entreprise (RCCM et IFU) pour débloquer le plafond supérieur de 5 000 000 XOF/mois.'
            : 'Contactez le support Super Admin pour une extension de quota d\'entreprise personnalisée.'
        }
      }
    };
  }

  return {
    allowed: true,
    code: 200,
    tier,
    currentVolume,
    attemptedAmount: numericAmount,
    maxLimit,
    projectedVolume,
    remainingVolume: maxLimit - projectedVolume,
    statusText
  };
}

/**
 * Incrémente le volume cumulé d'un marchand après validation d'une transaction
 * @param {admin.firestore.Firestore} db 
 * @param {string} merchantId 
 * @param {number} amount 
 */
async function recordTransactionVolume(db, merchantId, amount = 0) {
  const numericAmount = Math.max(0, Number(amount) || 0);
  if (numericAmount <= 0) return;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const memKey = `${merchantId || 'default'}_${currentMonth}`;
  const currentMem = inMemoryMonthlyUsage.get(memKey) || 0;
  inMemoryMonthlyUsage.set(memKey, currentMem + numericAmount);

  if (!db || !merchantId) return;

  try {
    const merchantRef = db.collection('merchants').doc(merchantId);
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(merchantRef);
      if (!snap.exists) return;
      const data = snap.data();
      const existingUsage = data.monthly_usage || {};
      const isSameMonth = existingUsage.month === currentMonth;
      const currentVol = isSameMonth ? (Number(existingUsage.volume_xof) || 0) : 0;
      const currentCount = isSameMonth ? (Number(existingUsage.transaction_count) || 0) : 0;

      transaction.update(merchantRef, {
        monthly_usage: {
          month: currentMonth,
          volume_xof: currentVol + numericAmount,
          transaction_count: currentCount + 1,
          last_updated: new Date().toISOString()
        }
      });
    });
  } catch (err) {
    console.warn('[TRANSACTION LIMIT] Erreur incrémentation volume Firestore :', err.message);
  }
}

/**
 * Middleware Express prêt à l'emploi
 * Interroge les limites KYC du marchand attaché (ou résolu) avant d'autoriser la transaction
 */
function checkTransactionLimitMiddleware(req, res, next) {
  const db = req.app?.locals?.db || global.__FIRESTORE_DB__;
  const merchant = req.merchant;
  const amount = Number(req.body?.amount || req.query?.amount || 0);

  // Si le marchand est déjà résolu sur la requête, on applique le contrôle immédiatement
  if (merchant) {
    checkTransactionLimit(db, merchant, amount)
      .then((result) => {
        if (!result.allowed) {
          return res.status(403).json(result.errorResponse);
        }
        req.kycLimit = result;
        return next();
      })
      .catch((err) => {
        console.error('[TRANSACTION LIMIT MIDDLEWARE ERROR]', err);
        return next();
      });
  } else {
    // Si la résolution marchand a lieu plus tard dans la route, le middleware passe
    return next();
  }
}

module.exports = {
  KYC_LIMITS,
  resolveMerchantKycTier,
  getMerchantMonthlyLimit,
  getMerchantMonthlyVolume,
  checkTransactionLimit,
  recordTransactionVolume,
  checkTransactionLimitMiddleware,
  inMemoryMonthlyUsage
};
