/**
 * ==============================================================================
 * MODÈLE DE DONNÉES FIRESTORE : COMPTES MARCHANDS & CLIENTS EXTERNES (B2B HYBRIDE)
 * ENTITÉ : NANASORE TECHNOLOGIES
 * ==============================================================================
 */

export type MerchantAccountType = 'INTERNAL' | 'AGREGATED' | 'EXTERNAL_BYOK';
export type IntegrationMode = 'AGREGATED' | 'BYOK';
export type MerchantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface NanaSwitchApiKeys {
  public_key: string;            // Ex: "ns_live_pk_xxxxxxxxxxxx"
  secret_key_hash: string;       // Hash Bcrypt / SHA-256 de la clé secrète NanaSwitch
  created_at?: string;
  last_used_at?: string;
}

export interface CustomGatewayCredentials {
  saspay?: {
    api_key?: string;
    base_url?: string;
  };
  sebpay?: {
    public_key?: string;
    secret_key?: string;
  };
  wave?: {
    api_key?: string;
  };
}

export interface MerchantIntegrationConfig {
  mode: IntegrationMode;         // "AGREGATED" (Agrégateur NanaSwitch) ou "BYOK" (Bring Your Own Keys)
  custom_credentials?: CustomGatewayCredentials;
  callback_url?: string;
  webhook_secret?: string;
}

export interface MerchantWebhookConfig {
  url: string | null;            // URL de destination du webhook marchand (ex: "https://boutique-client.com/api/nanaswitch-webhook")
  secret_key: string;           // Clé secrète HMAC-SHA256 de signature sortante : "ns_whsec_xxxxxxxxxxxxxxxx"
  is_active: boolean;           // Activation de la diffusion des webhooks
}

export interface MerchantApiPricingConfig {
  cost_per_request_xof: number;  // Micro-frais de 0.02 XOF par appel/transaction
  api_credits_balance: number;   // Solde de crédits de requêtes disponibles (ex: 5000)
  auto_block_on_zero: boolean;   // Bloque le routage si le solde de crédits atteint 0
  total_requests_count?: number; // Total cumulé des requêtes traitées
  total_spent_xof?: number;      // Total dépensé en micro-frais d'API
}

export interface MerchantFinancials {
  pricing_tier: string;          // Ex: "BURKINA_STANDARD", "UEMOA_PREMIUM"
  wallet_balance_xof: number;    // Solde disponible pour les reversements (mode agrégé)
  currency: string;              // "XOF"
  last_payout_at?: string;
}

export interface MerchantDocument {
  merchant_id: string;           // Identifiant unique : "m_live_bf_001"
  business_name: string;         // "NANASORE TECHNOLOGIES" ou nom commercial du partenaire
  rccm: string | null;           // Registre du Commerce et du Crédit Mobilier
  ifu: string | null;            // Identifiant Fiscal Unique
  account_type: MerchantAccountType;
  status: MerchantStatus;
  nanaswitch_keys: NanaSwitchApiKeys;
  integration_config: MerchantIntegrationConfig;
  webhook_config?: MerchantWebhookConfig;
  api_pricing_config: MerchantApiPricingConfig;
  financials: MerchantFinancials;
  created_at: any;               // Firestore Timestamp / ISO String
  updated_at?: any;
}

/**
 * Matrice tarifaire dynamique stockée dans system_settings/pricing_matrix
 */
export interface OperatorRateConfig {
  base_aggregator_rate: number;  // Ex: 0.045 (4.5%)
  nanaswitch_margin: number;     // Ex: 0.015 (+1.5% marge plateforme)
  total_charged_rate: number;    // Ex: 0.060 (6.0%)
  min_fee_xof: number;           // Ex: 12 XOF minimum
}

export type PricingMatrix = Record<string, Record<string, OperatorRateConfig>>;

/**
 * Entrée de journal d'audit de consommation API dans switch_logs / api_usage
 */
export interface ApiUsageLog {
  id?: string;
  merchant_id: string;           // Propriétaire de l'appel API
  request_cost: number;          // Déduction atomique de 0.02 XOF
  external_reference: string;    // Formaté sous la forme `${merchant_id}___${order_id}`
  order_id: string;
  amount: number;
  currency: string;
  country: string;
  gateway: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED_402' | 'FAILOVER_SUCCESS';
  credits_before: number;
  credits_after: number;
  timestamp: string;
  ip?: string;
}
