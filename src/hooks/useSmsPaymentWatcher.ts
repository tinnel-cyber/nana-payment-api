/**
 * [DEPRECATED - ANCIEN FORWARD SENDER DÉSACTIVÉ]
 * L'ancienne logique de détection SMS par relais / forward sender sur /sms_recus
 * a été complètement désactivée au profit du micro-service officiel Render
 * (nana-payment-api avec IP Statique Fixie et Webhooks bancaires directs).
 */

import { useCallback } from 'react';
import { SmsPaymentMatchResult } from '../types';

export interface UseSmsPaymentWatcherOptions {
  enabled?: boolean;
  expectedAmount?: number;
  customerPhone?: string;
  targetTransactionId?: string;
  onPaymentSuccess?: (result: SmsPaymentMatchResult) => void;
  targetType?: 'SUBSCRIPTION' | 'STORE_ORDER';
  targetStoreId?: string;
  targetOrderId?: string;
  userId?: string;
  targetUserId?: string;
  planId?: string;
}

export interface UseSmsPaymentWatcherReturn {
  isListening: boolean;
  isMatched: boolean;
  matchedResult: SmsPaymentMatchResult | null;
  matchedPayment?: SmsPaymentMatchResult | null;
  error: string | null;
  lastCheckedAt?: number;
  resetWatcher: () => void;
}

/**
 * Hook neutre / inactif (aucune écoute de SMS ou de nœud Realtime Database)
 */
export function useSmsPaymentWatcher(_options?: UseSmsPaymentWatcherOptions): UseSmsPaymentWatcherReturn {
  const resetWatcher = useCallback(() => {}, []);

  return {
    isListening: false,
    isMatched: false,
    matchedResult: null,
    matchedPayment: null,
    error: null,
    lastCheckedAt: Date.now(),
    resetWatcher
  };
}
