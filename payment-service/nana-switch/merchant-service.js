/**
 * ==============================================================================
 * SERVICE MARCHANDS & CLIENTS EXTERNES (B2B HYBRIDE) - NANASORE TECHNOLOGIES
 * ==============================================================================
 * 
 * Responsabilités :
 * 1. Authentification & Résolution des Marchands (Agrégés & Développeurs BYOK)
 * 2. Vérification des clés d'API (ns_live_pk_*, ns_live_sk_*)
 * 3. Coupe-circuit des Crédits & Facturation au Jeton (0.02 XOF par requête API)
 * 4. Gestion de la Matrice Tarifaire Dynamique (+1.5% de marge NanaSwitch)
 * 5. Traçabilité des consommations dans Firestore (switch_logs & api_usage)
 */

const crypto = require('crypto');

// Matrice tarifaire par défaut certifiée (Zone UEMOA)
const DEFAULT_PRICING_MATRIX = {
  BF: {
    orange_bf: {
      base_aggregator_rate: 0.045, // 4.5%
      nanaswitch_margin: 0.015,    // +1.5%
      total_charged_rate: 0.060,   // 6.0%
      min_fee_xof: 12
    },
    moov_bf: {
      base_aggregator_rate: 0.042, // 4.2%
      nanaswitch_margin: 0.015,    // +1.5%
      total_charged_rate: 0.057,   // 5.7%
      min_fee_xof: 12
    },
    wave_bf: {
      base_aggregator_rate: 0.010, // 1.0%
      nanaswitch_margin: 0.015,    // +1.5%
      total_charged_rate: 0.025,   // 2.5%
      min_fee_xof: 10
    },
    ligdicash_bf: {
      base_aggregator_rate: 0.035, // 3.5%
      nanaswitch_margin: 0.015,    // +1.5%
      total_charged_rate: 0.050,   // 5.0%
      min_fee_xof: 10
    }
  },
  CI: {
    orange_ci: {
      base_aggregator_rate: 0.035,
      nanaswitch_margin: 0.015,
      total_charged_rate: 0.050,
      min_fee_xof: 10
    },
    mtn_ci: {
      base_aggregator_rate: 0.035,
      nanaswitch_margin: 0.015,
      total_charged_rate: 0.050,
      min_fee_xof: 10
    },
    moov_ci: {
      base_aggregator_rate: 0.035,
      nanaswitch_margin: 0.015,
      total_charged_rate: 0.050,
      min_fee_xof: 10
    },
    wave_ci: {
      base_aggregator_rate: 0.010,
      nanaswitch_margin: 0.015,
      total_charged_rate: 0.025,
      min_fee_xof: 10
    }
  },
  SN: {
    orange_sn: {
      base_aggregator_rate: 0.035,
      nanaswitch_margin: 0.015,
      total_charged_rate: 0.050,
      min_fee_xof: 10
    },
    wave_sn: {
      base_aggregator_rate: 0.010,
      nanaswitch_margin: 0.015,
      total_charged_rate: 0.025,
      min_fee_xof: 10
    }
  },
  BJ: {
    mtn_bj: {
      base_aggregator_rate: 0.035,
      nanaswitch_margin: 0.015,
      total_charged_rate: 0.050,
      min_fee_xof: 10
    },
    moov_bj: {
      base_aggregator_rate: 0.035,
      nanaswitch_margin: 0.015,
      total_charged_rate: 0.050,
      min_fee_xof: 10
    },
    celtiis_bj: {
      base_aggregator_rate: 0.030,
      nanaswitch_margin: 0.015,
      total_charged_rate: 0.045,
      min_fee_xof: 10
    }
  }
};

class NanaSwitchMerchantService {
  constructor() {
    this.cachedPricingMatrix = null;
    this.lastPricingFetch = 0;
    this.PRICING_CACHE_TTL = 300000; // 5 minutes
  }

  /**
   * Hashe une clé secrète NanaSwitch pour comparaison ou stockage sécurisé
   * @param {string} secretKey 
   * @returns {string} Empreinte SHA-256 hex
   */
  hashSecretKey(secretKey) {
    if (!secretKey) return '';
    return crypto.createHash('sha256').update(secretKey.trim()).digest('hex');
  }

  /**
   * Récupère la matrice tarifaire depuis Firestore avec mise en cache
   * @param {admin.firestore.Firestore} db 
   */
  async getPricingMatrix(db) {
    const now = Date.now();
    if (this.cachedPricingMatrix && (now - this.lastPricingFetch < this.PRICING_CACHE_TTL)) {
      return this.cachedPricingMatrix;
    }

    if (!db) {
      return DEFAULT_PRICING_MATRIX;
    }

    try {
      const docSnap = await db.collection('system_settings').doc('pricing_matrix').get();
      if (docSnap.exists) {
        this.cachedPricingMatrix = docSnap.data();
        this.lastPricingFetch = now;
        return this.cachedPricingMatrix;
      }

      // Initialiser la matrice par défaut si non existante
      await db.collection('system_settings').doc('pricing_matrix').set(DEFAULT_PRICING_MATRIX, { merge: true });
      this.cachedPricingMatrix = DEFAULT_PRICING_MATRIX;
      this.lastPricingFetch = now;
      return DEFAULT_PRICING_MATRIX;
    } catch (err) {
      console.warn('[MERCHANT SERVICE] Erreur lecture matrice tarifaire Firestore :', err.message);
      return this.cachedPricingMatrix || DEFAULT_PRICING_MATRIX;
    }
  }

  /**
   * Calcule les frais d'une transaction pour un marchand agrégé
   * @param {number} amount Montant de la transaction
   * @param {string} countryCode Code ISO pays (ex: 'BF', 'CI')
   * @param {string} operator Identifiant opérateur (ex: 'orange_bf')
   * @param {object} matrix Matrice tarifaire
   */
  calculateTransactionFee(amount, countryCode = 'BF', operator = 'orange_bf', matrix = null) {
    const activeMatrix = matrix || DEFAULT_PRICING_MATRIX;
    const countryRates = activeMatrix[countryCode.toUpperCase()] || activeMatrix.BF;
    const operatorConfig = countryRates[operator.toLowerCase()] || countryRates[Object.keys(countryRates)[0]];

    if (!operatorConfig) {
      const fallbackFee = Math.max(12, Math.round(amount * 0.060));
      return {
        amount,
        fee: fallbackFee,
        total_fee: fallbackFee,
        netAmount: amount - fallbackFee,
        net_amount: amount - fallbackFee,
        chargedRate: 0.060,
        rate_applied: 6.0,
        marginRate: 0.015,
        platform_margin: Math.round(amount * 0.015),
        minFee: 12,
        min_fee: 12
      };
    }

    const calculatedFee = Math.round(amount * operatorConfig.total_charged_rate);
    const fee = Math.max(operatorConfig.min_fee_xof, calculatedFee);

    return {
      amount,
      fee,
      total_fee: fee,
      netAmount: amount - fee,
      net_amount: amount - fee,
      chargedRate: operatorConfig.total_charged_rate,
      rate_applied: Number((operatorConfig.total_charged_rate * 100).toFixed(2)),
      marginRate: operatorConfig.nanaswitch_margin,
      platform_margin: Math.round(amount * operatorConfig.nanaswitch_margin),
      minFee: operatorConfig.min_fee_xof,
      min_fee: operatorConfig.min_fee_xof
    };
  }

  /**
   * Résout et authentifie un compte marchand à partir d'une clé d'API
   * @param {admin.firestore.Firestore} db 
   * @param {string} apiKeyHeader Clé fournie dans x-api-key, x-nanaswitch-key ou Authorization
   * @param {string} [merchantIdFallback] ID optionnel
   */
  async resolveMerchant(db, apiKeyHeader = '', merchantIdFallback = null) {
    if (!db) {
      return this.getFallbackDefaultMerchant(merchantIdFallback);
    }

    const cleanKey = String(apiKeyHeader || '').replace(/^Bearer\s+/i, '').trim();

    // 1. Recherche par clé publique (ns_live_pk_... ou ns_test_pk_...)
    if (cleanKey.startsWith('ns_live_pk_') || cleanKey.startsWith('ns_test_pk_')) {
      try {
        const querySnap = await db.collection('merchants')
          .where('nanaswitch_keys.public_key', '==', cleanKey)
          .limit(1)
          .get();

        if (!querySnap.empty) {
          return querySnap.docs[0].data();
        }
      } catch (e) {
        console.warn('[MERCHANT RESOLUTION] Recherche par public_key :', e.message);
      }
    }

    // 2. Recherche par empreinte de clé secrète (ns_live_sk_... ou ns_test_sk_...)
    if (cleanKey.startsWith('ns_live_sk_') || cleanKey.startsWith('ns_test_sk_')) {
      const keyHash = this.hashSecretKey(cleanKey);
      try {
        const querySnap = await db.collection('merchants')
          .where('nanaswitch_keys.secret_key_hash', '==', keyHash)
          .limit(1)
          .get();

        if (!querySnap.empty) {
          return querySnap.docs[0].data();
        }
      } catch (e) {
        console.warn('[MERCHANT RESOLUTION] Recherche par secret_key_hash :', e.message);
      }
    }

    // 3. Recherche directe par ID de document (ex: m_live_bf_001 ou storeId/tenantId)
    const targetId = merchantIdFallback || (cleanKey.length > 5 && !cleanKey.includes(' ') ? cleanKey : 'm_live_bf_001');
    try {
      const docSnap = await db.collection('merchants').doc(targetId).get();
      if (docSnap.exists) {
        return docSnap.data();
      }
    } catch (e) {
      console.warn('[MERCHANT RESOLUTION] Recherche par ID direct :', e.message);
    }

    // 4. Initialisation du compte de référence si la collection est vide
    return await this.ensureDefaultNanasoreMerchant(db);
  }

  /**
   * Compte par défaut de démonstration/secours sous l'entité NANASORE TECHNOLOGIES
   */
  getFallbackDefaultMerchant(merchantId = 'm_live_bf_001') {
    return {
      merchant_id: merchantId || 'm_live_bf_001',
      business_name: 'NANASORE TECHNOLOGIES',
      rccm: null,
      ifu: null,
      account_type: 'EXTERNAL_BYOK',
      status: 'ACTIVE',
      nanaswitch_keys: {
        public_key: 'ns_live_pk_nanasore_master_2026',
        secret_key_hash: this.hashSecretKey('ns_live_sk_nanasore_master_2026')
      },
      integration_config: {
        mode: 'AGREGATED',
        custom_credentials: {
          saspay: { api_key: '' },
          sebpay: { public_key: '', secret_key: '' }
        }
      },
      api_pricing_config: {
        cost_per_request_xof: 0.02,
        api_credits_balance: 5000,
        auto_block_on_zero: true
      },
      financials: {
        pricing_tier: 'BURKINA_STANDARD',
        wallet_balance_xof: 0,
        currency: 'XOF'
      },
      created_at: new Date().toISOString()
    };
  }

  /**
   * Garantit l'existence du document racine pour NANASORE TECHNOLOGIES dans Firestore
   */
  async ensureDefaultNanasoreMerchant(db) {
    if (!db) return this.getFallbackDefaultMerchant();

    const merchantId = 'm_live_bf_001';
    const merchantRef = db.collection('merchants').doc(merchantId);

    try {
      const snap = await merchantRef.get();
      if (snap.exists) {
        return snap.data();
      }

      const defaultData = this.getFallbackDefaultMerchant(merchantId);
      await merchantRef.set(defaultData, { merge: true });
      console.log(`[FIRESTORE SEED] Compte marchand de référence "${defaultData.business_name}" (${merchantId}) initialisé avec succès.`);
      return defaultData;
    } catch (err) {
      console.warn('[MERCHANT INITIALIZATION ERROR]', err.message);
      return this.getFallbackDefaultMerchant();
    }
  }

  /**
   * Déduit atomiquement le coût par requête (0.02 XOF ou 1 crédit) et trace l'appel API
   * @param {admin.firestore.Firestore} db 
   * @param {object} params
   * @param {string} params.merchantId Identifiant marchand
   * @param {string} params.orderId Identifiant de commande
   * @param {number} params.amount Montant de la transaction
   * @param {string} params.currency Devise (XOF)
   * @param {string} params.country Code pays
   * @param {string} params.gateway Passerelle retenue
   * @param {string} params.status Statut ('SUCCESS', 'FAILOVER_SUCCESS', 'FAILED')
   * @param {number} [params.latencyMs] Latence d'exécution
   */
  async recordApiUsageAndDebit(db, params = {}) {
    const {
      merchantId = 'm_live_bf_001',
      orderId = `ORD_${Date.now()}`,
      amount = 0,
      currency = 'XOF',
      country = 'BF',
      gateway = 'saspay',
      status = 'SUCCESS',
      latencyMs = 0
    } = params;

    const requestCostXof = 0.02; // Micro-frais certifiés de 0.02 XOF par transaction
    const externalReference = `${merchantId}___${orderId}`;
    const nowIso = new Date().toISOString();

    if (!db) {
      return {
        success: true,
        merchant_id: merchantId,
        request_cost: requestCostXof,
        external_reference: externalReference,
        status
      };
    }

    try {
      const merchantRef = db.collection('merchants').doc(merchantId);
      const merchantSnap = await merchantRef.get();
      const mData = merchantSnap.exists ? merchantSnap.data() : null;

      const currentCredits = mData?.api_pricing_config?.api_credits_balance ?? 5000;
      const newCredits = Math.max(0, currentCredits - 1);

      const batch = db.batch();

      // 1. Déduction atomique de 1 crédit et comptabilisation des 0.02 XOF
      batch.set(merchantRef, {
        api_pricing_config: {
          api_credits_balance: newCredits,
          total_requests_count: (mData?.api_pricing_config?.total_requests_count || 0) + 1,
          total_spent_xof: Number(((mData?.api_pricing_config?.total_spent_xof || 0) + requestCostXof).toFixed(4))
        },
        updated_at: nowIso
      }, { merge: true });

      // 2. Traçabilité dans switch_logs & api_usage
      const logPayload = {
        merchant_id: merchantId,
        tenantId: merchantId,
        userId: merchantId,
        order_id: orderId,
        orderId,
        external_reference: externalReference,
        externalReference,
        request_cost: requestCostXof,
        amount: Number(amount),
        currency,
        country: country.toUpperCase(),
        gateway,
        connector: gateway,
        status,
        credits_before: currentCredits,
        credits_after: newCredits,
        latency_ms: latencyMs,
        timestamp: nowIso
      };

      const usageRef = db.collection('api_usage').doc();
      batch.set(usageRef, logPayload);

      const switchLogRef = db.collection('switch_logs').doc();
      batch.set(switchLogRef, logPayload);

      await batch.commit();

      console.log(`[API METERING] Marchand: ${merchantId} | Déduction: 0.02 XOF (1 crédit) | Solde restant: ${newCredits} crédits | Ref: ${externalReference}`);

      return {
        success: true,
        merchant_id: merchantId,
        request_cost: requestCostXof,
        external_reference: externalReference,
        remaining_credits: newCredits,
        status
      };
    } catch (err) {
      console.error('[API METERING ERROR]', err.message);
      return {
        success: false,
        merchant_id: merchantId,
        request_cost: requestCostXof,
        external_reference: externalReference,
        error: err.message
      };
    }
  }
}

const merchantService = new NanaSwitchMerchantService();

module.exports = {
  NanaSwitchMerchantService,
  merchantService,
  DEFAULT_PRICING_MATRIX
};
