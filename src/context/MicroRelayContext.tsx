import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CommissionToast } from '../components/wameet/CommissionToast';
import { playChaChingSound } from '../utils/audio';

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

export interface MicroRelayContextValue {
  /** Indique si le CommissionToast jubilatoire est actuellement affiché */
  isToastOpen: boolean;
  /** Données de la commission affichée */
  toastData: {
    amount: number;
    currency: string;
    buyerName?: string;
    productName?: string;
  };
  /** Total cumulé des gains de commission (en FCFA) */
  totalEarnings: number;
  /** Nombre total de ventes conclues via le lien d'affiliation */
  salesCount: number;
  /** Historique des commissions perçues */
  history: CommissionEarnedPayload[];
  /** Identifiant unique de l'utilisateur affilié */
  affiliateId: string;
  /** Déclenche manuellement ou via backend l'alerte Cha-ching (+ confettis + son) */
  triggerCommission: (payload?: Partial<CommissionEarnedPayload>) => void;
  /** Ferme la notification courante */
  closeToast: () => void;
  /** Génère le lien unique de partage monétisé pour une session */
  getShareUrl: (liveId?: string) => string;
  /** Réinitialise les statistiques de la session */
  resetStats: () => void;
}

const STORAGE_AFFILIATE_KEY = 'wameet_micro_relay_affiliate_id';
const STORAGE_TOTAL_EARNINGS = 'wameet_micro_relay_total_earnings';

/**
 * Dispatcher universel utilisable depuis Redux, Zustand, Socket.io ou n'importe quel service
 */
export function dispatchCommissionEarned(payload?: Partial<CommissionEarnedPayload>) {
  if (typeof window !== 'undefined') {
    const defaultData: CommissionEarnedPayload = {
      amount: payload?.amount ?? 750,
      currency: payload?.currency ?? 'FCFA',
      buyerName: payload?.buyerName ?? 'Quelqu’un',
      productName: payload?.productName,
      liveId: payload?.liveId ?? 'live-123',
      transactionId: payload?.transactionId ?? `tx_${Date.now()}`,
      timestamp: Date.now()
    };
    window.dispatchEvent(
      new CustomEvent<CommissionEarnedPayload>('wameet:commission_earned', {
        detail: defaultData
      })
    );
  }
}

const MicroRelayContext = createContext<MicroRelayContextValue | null>(null);

export interface MicroRelayProviderProps {
  children: React.ReactNode;
  /** Identifiant d'affilié injecté (ex: depuis AuthContext ou profil utilisateur) */
  initialAffiliateId?: string;
  /** Live ID courant par défaut */
  defaultLiveId?: string;
  /** Rendu automatique du composant CommissionToast au niveau racine (défaut: true) */
  renderToast?: boolean;
}

export const MicroRelayProvider: React.FC<MicroRelayProviderProps> = ({
  children,
  initialAffiliateId,
  defaultLiveId = '123',
  renderToast = true
}) => {
  // 1. Identifiant d'affilié persistant
  const [affiliateId] = useState<string>(() => {
    if (initialAffiliateId) return initialAffiliateId;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_AFFILIATE_KEY);
      if (stored) return stored;
      const generated = `usr_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(STORAGE_AFFILIATE_KEY, generated);
      return generated;
    }
    return 'USER_ID';
  });

  // 2. État du Toast jubilatoire
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastData, setToastData] = useState<{
    amount: number;
    currency: string;
    buyerName?: string;
    productName?: string;
  }>({
    amount: 750,
    currency: 'FCFA',
    buyerName: undefined,
    productName: undefined
  });

  // 3. Gains cumulés
  const [totalEarnings, setTotalEarnings] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_TOTAL_EARNINGS);
      return stored ? Number(stored) : 0;
    }
    return 0;
  });

  const [history, setHistory] = useState<CommissionEarnedPayload[]>([]);

  const closeToast = useCallback(() => {
    setIsToastOpen(false);
  }, []);

  const triggerCommission = useCallback((payload?: Partial<CommissionEarnedPayload>) => {
    const amount = Number(payload?.amount ?? 750);
    const currency = payload?.currency ?? 'FCFA';
    const buyerName = payload?.buyerName;
    const productName = payload?.productName;

    setToastData({
      amount,
      currency,
      buyerName,
      productName
    });
    setIsToastOpen(true);

    setTotalEarnings((prev) => {
      const next = prev + amount;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_TOTAL_EARNINGS, String(next));
      }
      return next;
    });

    setHistory((prev) => [
      {
        amount,
        currency,
        buyerName,
        productName,
        transactionId: payload?.transactionId ?? `tx_${Date.now()}`,
        timestamp: payload?.timestamp ?? Date.now(),
        liveId: payload?.liveId ?? defaultLiveId
      },
      ...prev
    ]);
  }, [defaultLiveId]);

  // Écoute de l'événement global 'wameet:commission_earned' (compatible Redux, Zustand, Socket.io)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCommissionEvent = (event: Event) => {
      const customEvent = event as CustomEvent<CommissionEarnedPayload>;
      if (customEvent.detail) {
        triggerCommission(customEvent.detail);
      }
    };

    window.addEventListener('wameet:commission_earned', handleCommissionEvent);
    return () => {
      window.removeEventListener('wameet:commission_earned', handleCommissionEvent);
    };
  }, [triggerCommission]);

  const getShareUrl = useCallback(
    (liveIdParam?: string) => {
      const targetLiveId = liveIdParam || defaultLiveId;
      if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        return `${origin}/live/${targetLiveId}?ref=${affiliateId}`;
      }
      return `https://wameet.app/live/${targetLiveId}?ref=${affiliateId}`;
    },
    [defaultLiveId, affiliateId]
  );

  const resetStats = useCallback(() => {
    setTotalEarnings(0);
    setHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_TOTAL_EARNINGS, '0');
    }
  }, []);

  const contextValue = useMemo<MicroRelayContextValue>(
    () => ({
      isToastOpen,
      toastData,
      totalEarnings,
      salesCount: history.length,
      history,
      affiliateId,
      triggerCommission,
      closeToast,
      getShareUrl,
      resetStats
    }),
    [
      isToastOpen,
      toastData,
      totalEarnings,
      history,
      affiliateId,
      triggerCommission,
      closeToast,
      getShareUrl,
      resetStats
    ]
  );

  return (
    <MicroRelayContext.Provider value={contextValue}>
      {children}
      {renderToast && (
        <CommissionToast
          isOpen={isToastOpen}
          amount={toastData.amount}
          currency={toastData.currency}
          buyerName={toastData.buyerName}
          productName={toastData.productName}
          onClose={closeToast}
        />
      )}
    </MicroRelayContext.Provider>
  );
};

/**
 * Hook d'accès au contexte Micro-Relais
 */
export function useMicroRelayContext(): MicroRelayContextValue {
  const ctx = useContext(MicroRelayContext);
  if (!ctx) {
    // Fallback gracieux si utilisé hors provider : évite de crasher l'app
    return {
      isToastOpen: false,
      toastData: { amount: 750, currency: 'FCFA' },
      totalEarnings: 0,
      salesCount: 0,
      history: [],
      affiliateId: 'usr_guest',
      triggerCommission: (p) => dispatchCommissionEarned(p),
      closeToast: () => {},
      getShareUrl: (id = '123') => `https://wameet.app/live/${id}?ref=USER_ID`,
      resetStats: () => {}
    };
  }
  return ctx;
}
