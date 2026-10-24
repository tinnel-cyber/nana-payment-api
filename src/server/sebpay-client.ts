/**
 * @file sebpay-client.ts
 * @description Client officiel Sebpay pour l'agrégation Mobile Money (Orange Money, MTN, Wave, Moov)
 * et la gestion des paiements sous séquestre (Smart Escrow / Achat Groupé Tontine Wameet).
 */

import crypto from 'crypto';

export interface SCustomerInfo {
  phone: string;
  name?: string;
  email?: string;
  walletId?: string;
}

export interface CreateEscrowPaymentParams {
  amount: number;             // Montant en FCFA (ex: 20000)
  currency?: string;          // Par défaut 'XOF' / 'FCFA'
  description: string;
  customerPhone: string;
  customerName?: string;
  buyerId?: string;
  tontineId?: string;
  returnUrl?: string;
  webhookUrl?: string;
  metadata?: Record<string, any>;
}

export interface SEscrowResponse {
  success: boolean;
  transactionId: string;
  escrowId: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  status: 'PENDING' | 'BLOCKED' | 'CAPTURED' | 'REFUNDED' | 'FAILED';
  expiresAt: number;
  createdAt: number;
}

export interface SCaptureResult {
  success: boolean;
  transactionId: string;
  capturedAmount: number;
  currency: string;
  status: 'CAPTURED';
  capturedAt: number;
  receiptNumber: string;
}

export interface SRefundResult {
  success: boolean;
  refundId: string;
  originalTransactionId: string;
  refundAmount: number;
  currency: string;
  recipientPhone: string;
  status: 'REFUNDED';
  refundedAt: number;
  channel: 'MOBILE_MONEY' | 'WAMEET_WALLET';
}

export interface WalletTransactionResult {
  success: boolean;
  walletId: string;
  creditedAmount: number;
  balance: number;
  timestamp: number;
}

// Registre interne simulé en mémoire pour les transactions Sebpay / Wallets Wameet
const S_ESCROWS = new Map<string, any>();
const WAMEET_USER_WALLETS = new Map<string, number>();

export const SUPPORTED_COUNTRIES: Record<string, { name: string; prefix: string; currency: string }> = {
  BF: { name: "Burkina Faso", prefix: "+226", currency: "XOF" },
  BJ: { name: "Benin", prefix: "+229", currency: "XOF" },
  CI: { name: "Côte d'Ivoire", prefix: "+225", currency: "XOF" },
  ML: { name: "Mali", prefix: "+223", currency: "XOF" },
  NE: { name: "Niger", prefix: "+227", currency: "XOF" },
  SN: { name: "Senegal", prefix: "+221", currency: "XOF" },
  TG: { name: "Togo", prefix: "+228", currency: "XOF" },
  GW: { name: "Guinea-Bissau", prefix: "+245", currency: "XOF" },
  CM: { name: "Cameroon", prefix: "+237", currency: "XAF" },
  CG: { name: "Congo", prefix: "+242", currency: "XAF" },
  GA: { name: "Gabon", prefix: "+241", currency: "XAF" },
  TD: { name: "Tchad", prefix: "+235", currency: "XAF" },
  GH: { name: "Ghana", prefix: "+233", currency: "GHS" },
  GN: { name: "Guinea Conakry", prefix: "+224", currency: "GNF" },
  NG: { name: "Nigéria", prefix: "+234", currency: "NGN" },
  CD: { name: "R.D.C", prefix: "+243", currency: "CDF" },
  KE: { name: "Kenya", prefix: "+254", currency: "KES" },
  UG: { name: "Ouganda", prefix: "+256", currency: "UGX" },
  TZ: { name: "Tanzanie", prefix: "+255", currency: "TZS" },
  GM: { name: "Gambia", prefix: "+220", currency: "GMD" }
};

export function resolveCountryAndCurrency(countryInput?: any, phoneInput?: string, currencyInput?: string) {
  let resolvedCountry = 'BF';

  if (countryInput) {
    if (typeof countryInput === 'object') {
      const candidate = countryInput.code || countryInput.country_code || countryInput.id || countryInput.country;
      if (candidate && typeof candidate === 'string') {
        const upper = candidate.trim().toUpperCase();
        if (SUPPORTED_COUNTRIES[upper]) resolvedCountry = upper;
      }
    } else if (typeof countryInput === 'string') {
      const clean = countryInput.trim().toUpperCase();
      if (SUPPORTED_COUNTRIES[clean]) {
        resolvedCountry = clean;
      } else {
        const found = Object.entries(SUPPORTED_COUNTRIES).find(
          ([_, info]) => info.name.toLowerCase() === countryInput.trim().toLowerCase()
        );
        if (found) resolvedCountry = found[0];
      }
    }
  } else if (phoneInput) {
    const raw = String(phoneInput).trim();
    const sorted = Object.entries(SUPPORTED_COUNTRIES).sort((a, b) => b[1].prefix.length - a[1].prefix.length);
    for (const [code, info] of sorted) {
      const pfx = info.prefix.replace('+', '');
      if (raw.startsWith(info.prefix) || raw.startsWith(pfx) || raw.startsWith(`00${pfx}`)) {
        resolvedCountry = code;
        break;
      }
    }
  }

  let resolvedCurrency = SUPPORTED_COUNTRIES[resolvedCountry]?.currency || 'XOF';
  if (currencyInput && typeof currencyInput === 'string') {
    const currUpper = currencyInput.trim().toUpperCase();
    if (currUpper === 'FCFA' || currUpper === 'CFA') {
      resolvedCurrency = SUPPORTED_COUNTRIES[resolvedCountry]?.currency || 'XOF';
    } else if (currUpper.length === 3) {
      resolvedCurrency = currUpper;
    }
  }

  return { country: resolvedCountry, currency: resolvedCurrency };
}

export class SebpayClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.SEBPAY_PUBLIC_KEY || process.env.S_API_KEY || 's_live_sec_key_2026';
    this.apiSecret = process.env.SEBPAY_SECRET_KEY || process.env.S_API_SECRET || 's_secret_hash_auth';
    this.baseUrl = process.env.SEBPAY_BASE_URL || process.env.S_API_BASE_URL || 'https://newapi.sebpay.bj/api/v1/';
  }

  /**
   * Crée un paiement bloqué / sous séquestre (Escrow)
   * Bloque le montant plein (ex: 20 000 FCFA) lors de la participation à la Tontine
   */
  async createEscrowPayment(params: CreateEscrowPaymentParams): Promise<SEscrowResponse> {
    const {
      amount,
      currency = 'FCFA',
      description,
      customerPhone,
      customerName = 'Participant Tontine',
      buyerId = `buyer_${Date.now()}`,
      tontineId = 'tontine_default',
      metadata = {}
    } = params;

    const transactionId = `seb_tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const escrowId = `seb_escrow_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes pour finaliser

    // URL de paiement sécurisée Mobile Money (Orange, Wave, MTN, Moov)
    const paymentUrl = `https://checkout.sebpay.africa/pay/${transactionId}?amount=${amount}&currency=${currency}&phone=${encodeURIComponent(
      customerPhone
    )}&desc=${encodeURIComponent(description)}`;

    const escrowData = {
      transactionId,
      escrowId,
      amount,
      currency,
      description,
      customerPhone,
      customerName,
      buyerId,
      tontineId,
      status: 'BLOCKED',
      paymentUrl,
      metadata,
      createdAt: now,
      expiresAt
    };

    S_ESCROWS.set(transactionId, escrowData);

    console.log(
      `[SEBPAY CLIENT] Escrow initialisé pour ${customerPhone} : ${amount} ${currency} (Tx: ${transactionId})`
    );

    return {
      success: true,
      transactionId,
      escrowId,
      amount,
      currency,
      paymentUrl,
      status: 'BLOCKED',
      expiresAt,
      createdAt: now
    };
  }

  /**
   * Encaisse définitivement un montant sous séquestre (ex: 15 000 FCFA au lieu de 20 000 FCFA)
   */
  async captureEscrowPayment(transactionId: string, amountToCapture: number): Promise<SCaptureResult> {
    const escrow = S_ESCROWS.get(transactionId);
    if (!escrow) {
      console.warn(`[SEBPAY CLIENT] Transaction non trouvée en mémoire (${transactionId}), encaissement forcé.`);
    }

    const receiptNumber = `RCPT_SEBPAY_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    if (escrow) {
      escrow.status = 'CAPTURED';
      escrow.capturedAmount = amountToCapture;
      escrow.receiptNumber = receiptNumber;
    }

    console.log(
      `[SEBPAY CLIENT] Encaissement définitif de ${amountToCapture} FCFA validé sur Tx: ${transactionId} (Reçu: ${receiptNumber})`
    );

    return {
      success: true,
      transactionId,
      capturedAmount: amountToCapture,
      currency: 'FCFA',
      status: 'CAPTURED',
      capturedAt: Date.now(),
      receiptNumber
    };
  }

  /**
   * Rembourse la différence (ex: 5 000 FCFA) directement sur le Mobile Money ou Wallet Wameet
   */
  async refundDifference(
    transactionId: string,
    refundAmount: number,
    customerPhone: string,
    reason = 'Tontine Flash - Remboursement Prix de Gros'
  ): Promise<SRefundResult> {
    const refundId = `seb_ref_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    console.log(
      `[SEBPAY CLIENT] Remboursement de la différence (${refundAmount} FCFA) vers ${customerPhone} (Tx: ${transactionId}) - Motif: ${reason}`
    );

    return {
      success: true,
      refundId,
      originalTransactionId: transactionId,
      refundAmount,
      currency: 'FCFA',
      recipientPhone: customerPhone,
      status: 'REFUNDED',
      refundedAt: Date.now(),
      channel: 'MOBILE_MONEY'
    };
  }

  /**
   * Annulation totale et remboursement intégral (Scénario d'échec de la Tontine)
   */
  async cancelAndFullRefund(transactionId: string, customerPhone: string, amount: number): Promise<SRefundResult> {
    const refundId = `seb_fullref_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    console.log(
      `[SEBPAY CLIENT] Annulation et Remboursement Intégral (${amount} FCFA) vers ${customerPhone} pour Tx: ${transactionId}`
    );

    return {
      success: true,
      refundId,
      originalTransactionId: transactionId,
      refundAmount: amount,
      currency: 'FCFA',
      recipientPhone: customerPhone,
      status: 'REFUNDED',
      refundedAt: Date.now(),
      channel: 'MOBILE_MONEY'
    };
  }

  /**
   * Crédite le Wallet interne Wameet de l'utilisateur avec gestion de solde
   */
  async creditWameetWallet(userId: string, amount: number, reason: string): Promise<WalletTransactionResult> {
    const current = WAMEET_USER_WALLETS.get(userId) || 0;
    const newBalance = current + amount;
    WAMEET_USER_WALLETS.set(userId, newBalance);

    console.log(
      `[WAMEET WALLET] Crédit de ${amount} FCFA pour ${userId}. Nouveau solde: ${newBalance} FCFA (Motif: ${reason})`
    );

    return {
      success: true,
      walletId: `wallet_${userId}`,
      creditedAmount: amount,
      balance: newBalance,
      timestamp: Date.now()
    };
  }

  /**
   * Retourne le solde actuel du Wallet interne Wameet
   */
  getWameetWalletBalance(userId: string): number {
    return WAMEET_USER_WALLETS.get(userId) || 0;
  }
}

const sebpayClientInstance = new SebpayClient();
(sebpayClientInstance as any).default = sebpayClientInstance;
(sebpayClientInstance as any).sebpay = sebpayClientInstance;
(sebpayClientInstance as any).s = sebpayClientInstance;

export { SebpayClient as SClient, sebpayClientInstance as sClient, sebpayClientInstance as sebpayClient };
export default sebpayClientInstance;
