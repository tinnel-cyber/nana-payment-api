import React from 'react';

/**
 * lazyWithRetry - Chargeur dynamique résilient pour modules React lazy (Vite / PWA)
 * 
 * Résout définitivement l'erreur "Failed to fetch dynamically imported module" survenant :
 * 1. Lors d'un nouveau déploiement de production (changement de hash des chunks Vite)
 * 2. Lors d'une micro-coupure réseau ou latence mobile
 * 3. Lors de la purge ou désynchronisation du cache du Service Worker
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T } | any>,
  maxRetries = 2,
  intervalMs = 800
): React.LazyExoticComponent<T> {
  return React.lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      let attempts = 0;

      const attemptLoad = () => {
        attempts++;
        factory()
          .then((module) => {
            // Nettoyer le verrou de rechargement en cas de succès
            if (typeof window !== 'undefined') {
              try {
                sessionStorage.removeItem('nana_chunk_reload_lock');
              } catch (_) {}
            }
            resolve(module && module.default ? module : { default: module });
          })
          .catch(async (error: any) => {
            const errorMsg = String(error?.message || error || '');
            const isDynamicImportError =
              errorMsg.includes('Failed to fetch dynamically imported module') ||
              errorMsg.includes('Importing a module script failed') ||
              errorMsg.includes('Loading chunk') ||
              errorMsg.includes('dynamically imported') ||
              error?.name === 'TypeError';

            console.warn(`[lazyWithRetry] Tentative ${attempts}/${maxRetries + 1} échouée :`, errorMsg);

            if (attempts <= maxRetries) {
              // Réessayer après un court délai
              setTimeout(attemptLoad, intervalMs * attempts);
            } else {
              // Si toutes les tentatives ont échoué et qu'il s'agit d'un chunk manquant suite à un déploiement
              if (typeof window !== 'undefined' && isDynamicImportError) {
                const reloadLockKey = 'nana_chunk_reload_lock_' + window.location.pathname;
                const hasReloaded = sessionStorage.getItem(reloadLockKey);

                if (!hasReloaded) {
                  console.info('[lazyWithRetry] Nouveau déploiement détecté (chunk expiré). Purge des caches et rechargement...');
                  try {
                    sessionStorage.setItem(reloadLockKey, 'true');
                    if ('caches' in window) {
                      const keys = await caches.keys();
                      await Promise.all(keys.map(k => caches.delete(k)));
                    }
                  } catch (_) {}

                  // Forcer le rechargement de la page pour récupérer les nouveaux hashes de chunks
                  window.location.reload();
                  return;
                }
              }

              reject(error);
            }
          });
      };

      attemptLoad();
    });
  });
}

export default lazyWithRetry;
