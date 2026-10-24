import { useState, useEffect, useCallback, useRef } from 'react';

export interface CommissionEarnedPayload {
  amount: number;
  currency?: string;
  buyerName?: string;
  productName?: string;
  transactionId?: string;
  liveId?: string;
  commissionRate?: number;
  totalSaleAmount?: number;
  timestamp?: number;
}

export interface UseMicroRelayOptions {
  /** Identifiant unique du spectateur affilié (par défaut lit localStorage ou génère un ID) */
  affiliateId?: string;
  /** Identifiant du Live en cours */
  liveId?: string;
  /** Activer l'écoute des événements WebSocket globaux */
  listenToSocket?: boolean;
  /** Callback lors de la réception d'une commission */
  onCommissionReceived?: (data: CommissionEarnedPayload) => void;
}

export interface UseMicroRelayReturn {
  /** État actuel de la notification jubilatoire CommissionToast */
  commissionToast: {
    isOpen: boolean;
    amount: number;
    currency: string;
    buyerName?: string;
    productName?: string;
  };
  /** Total des gains de commissions accumulés durant cette session */
  totalEarnings: number;
  /** Nombre de ventes conclues via le lien */
  salesCount: number;
  /** Historique des commissions de la session */
  history: CommissionEarnedPayload[];
  /** Identifiant d'affilié effectif */
  affiliateId: string;
  /** Lien de parrainage complet */
  shareUrl: string;
  /** Déclencheur manuel pour tester l'animation et le son du toast (+750 FCFA par défaut) */
  triggerDemoCommission: (amount?: number, buyerName?: string) => void;
  /** Ferme la notification courante */
  closeToast: () => void;
  /** Réinitialise l'historique de la session */
  resetSessionStats: () => void;
}

const STORAGE_AFFILIATE_KEY = 'wameet_micro_relay_affiliate_id';
const STORAGE_TOTAL_EARNINGS = 'wameet_micro_relay_total_earnings';

/**
 * Hook useMicroRelay : Gère l'état global du Micro-Relais d'affiliation Wameet Live
 * - Réception en temps réel des signaux WebSocket 'commission_earned'
 * - Déclenchement de l'animation jubilatoire CommissionToast
 * - Synchronisation avec le Wallet local et audit des gains
 */
export function useMicroRelay(options: UseMicroRelayOptions = {}): UseMicroRelayReturn {
  const {
    affiliateId: propAffiliateId,
    liveId = 'live-shopping-direct',
    listenToSocket = true,
    onCommissionReceived
  } = options;

  // 1. Initialisation de l'affiliateId persistant
  const [affiliateId] = useState<string>(() => {
    if (propAffiliateId) return propAffiliateId;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_AFFILIATE_KEY);
      if (stored) return stored;
      const generated = `usr_relay_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(STORAGE_AFFILIATE_KEY, generated);
      return generated;
    }
    return `usr_relay_default`;
  });

  // 2. État du Toast de commission
  const [commissionToast, setCommissionToast] = useState<{
    isOpen: boolean;
    amount: number;
    currency: string;
    buyerName?: string;
    productName?: string;
  }>({
    isOpen: false,
    amount: 750,
    currency: 'FCFA',
    buyerName: undefined,
    productName: undefined
  });

  const [totalEarnings, setTotalEarnings] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_TOTAL_EARNINGS);
      return stored ? Number(stored) : 0;
    }
    return 0;
  });

  const [history, setHistory] = useState<CommissionEarnedPayload[]>([]);

  // Fermeture du toast
  const closeToast = useCallback(() => {
    setCommissionToast((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Déclencheur interne de commission
  const handleEarnCommission = useCallback(
    (payload: CommissionEarnedPayload) => {
      const amount = Number(payload.amount || 750);
      const currency = payload.currency || 'FCFA';

      setCommissionToast({
        isOpen: true,
        amount,
        currency,
        buyerName: payload.buyerName || 'Un spectateur',
        productName: payload.productName
      });

      setTotalEarnings((prev) => {
        const next = prev + amount;
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_TOTAL_EARNINGS, String(next));
        }
        return next;
      });

      setHistory((prev) => [
        {
          ...payload,
          amount,
          currency,
          timestamp: payload.timestamp || Date.now()
        },
        ...prev
      ]);

      if (onCommissionReceived) {
        onCommissionReceived(payload);
      }
    },
    [onCommissionReceived]
  );

  // Déclencheur Démo pour les tests interactifs
  const triggerDemoCommission = useCallback(
    (customAmount = 750, buyerName = 'Awa K.') => {
      handleEarnCommission({
        amount: customAmount,
        currency: 'FCFA',
        buyerName,
        productName: 'Coffret Karité Royal Or',
        commissionRate: 5,
        totalSaleAmount: customAmount * 20,
        transactionId: `demo_tx_${Date.now()}`,
        liveId
      });
    },
    [handleEarnCommission, liveId]
  );

  const resetSessionStats = useCallback(() => {
    setTotalEarnings(0);
    setHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_TOTAL_EARNINGS, '0');
    }
  }, []);

  // 3. Écoute des événements WebSocket et CustomEvents de l'application
  useEffect(() => {
    if (!listenToSocket || typeof window === 'undefined') return;

    // Écoute de l'événement global 'wameet:commission_earned'
    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<CommissionEarnedPayload>;
      if (customEvent.detail) {
        handleEarnCommission(customEvent.detail);
      }
    };

    window.addEventListener('wameet:commission_earned', handleCustomEvent);

    return () => {
      window.removeEventListener('wameet:commission_earned', handleCustomEvent);
    };
  }, [listenToSocket, handleEarnCommission]);

  // Construction de l'URL unique de partage
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/live/${liveId}?ref=${affiliateId}`
    : `https://wameet.app/live/${liveId}?ref=${affiliateId}`;

  return {
    commissionToast,
    totalEarnings,
    salesCount: history.length,
    history,
    affiliateId,
    shareUrl,
    triggerDemoCommission,
    closeToast,
    resetSessionStats
  };
}
