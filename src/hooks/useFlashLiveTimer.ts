import { useState, useEffect, useRef, useCallback } from 'react';
import { FlashLiveTimerState } from '../types/flashLive';

export interface UseFlashLiveTimerOptions {
  acceptedAt?: number;
  totalLimitSeconds?: number; // 300 seconds = 5 min
  onWarning30s?: () => void;
  onCutoff?: () => void;
}

export function useFlashLiveTimer({
  acceptedAt,
  totalLimitSeconds = 300,
  onWarning30s,
  onCutoff
}: UseFlashLiveTimerOptions): FlashLiveTimerState {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const warnedRef = useRef(false);
  const cutoffRef = useRef(false);

  useEffect(() => {
    if (!acceptedAt) {
      setElapsedSeconds(0);
      warnedRef.current = false;
      cutoffRef.current = false;
      return;
    }

    const checkTime = () => {
      const now = Date.now();
      const elapsed = Math.max(0, Math.floor((now - acceptedAt) / 1000));
      setElapsedSeconds(elapsed);

      const remaining = Math.max(0, totalLimitSeconds - elapsed);

      // Alerte des 30 secondes restantes (à 270s / 4m30s)
      if (remaining <= 30 && remaining > 0 && !warnedRef.current) {
        warnedRef.current = true;
        if (onWarning30s) onWarning30s();
      }

      // Kill Switch Absolu des 300 secondes (5 min)
      if (remaining <= 0 && !cutoffRef.current) {
        cutoffRef.current = true;
        if (onCutoff) onCutoff();
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 500);

    return () => clearInterval(interval);
  }, [acceptedAt, totalLimitSeconds, onWarning30s, onCutoff]);

  const remainingSeconds = Math.max(0, totalLimitSeconds - elapsedSeconds);
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedRemaining = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const isWarning30s = remainingSeconds <= 30 && remainingSeconds > 0;
  const isCutoff = Boolean(acceptedAt && remainingSeconds <= 0);

  return {
    elapsedSeconds,
    totalLimitSeconds,
    remainingSeconds,
    formattedRemaining,
    isWarning30s,
    isCutoff
  };
}
