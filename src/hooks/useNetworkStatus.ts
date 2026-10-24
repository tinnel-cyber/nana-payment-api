import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personnalisé pour détecter en temps réel le statut réseau (En ligne / Hors-ligne).
 * Permet d'adapter l'UI et de désactiver gracieusement les fonctionnalités Cloud sans crasher.
 */
export function useNetworkStatus(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
