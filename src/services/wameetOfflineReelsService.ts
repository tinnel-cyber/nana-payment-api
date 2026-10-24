/**
 * Service de Pré-chargement & Cache Hors-ligne des Reels WaMeet (CacheStorage PWA)
 *
 * Fonctionnalités clés :
 * 1. File de pré-téléchargement en arrière-plan (Pre-fetching Queue) :
 *    - Dès l'initialisation du composant Reels, pré-télécharge les blobs vidéo des 5 à 10 prochains Reels
 *      dans le CacheStorage ('wameet-reels-video-v1').
 *    - Met en cache la liste JSON des métadonnées (titres, auteurs, tags, stats, commentaires).
 * 2. Fallback Lecteur Vidéo Hors-Ligne :
 *    - Vérifie la disponibilité du blob dans le CacheStorage avant de déclencher des requêtes réseau.
 *    - Si navigator.onLine === false ou en cas d'échec réseau, crée et sert une URL Blob locale (URL.createObjectURL).
 * 3. Détection fin de cache & Expérience Hors-Ligne :
 *    - Fournit l'état des vidéos disponibles hors-ligne.
 *    - Détecte l'atteinte de la fin des vidéos en cache.
 */

import { WameetReelItem } from '../components/wameet/WameetReelsView';

export const REELS_VIDEO_CACHE_NAME = 'wameet-reels-video-v1';
export const REELS_METADATA_STORAGE_KEY = 'wameet_cached_reels_metadata_v1';
export const DEFAULT_PREFETCH_COUNT = 8;

// Cache en mémoire des URL Blobs créées pour éviter les fuites mémoire et les re-créations inutiles
const memoryBlobUrls = new Map<string, string>();
const ongoingPrefetches = new Set<string>();

/**
 * Normalise une URL vidéo (chemins relatifs convertis en URL absolues complètes)
 */
export function normalizeVideoUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;
  if (typeof window !== 'undefined') {
    try {
      return new URL(trimmed, window.location.origin).href;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

/**
 * Met en cache la liste des métadonnées de Reels (JSON)
 */
export function cacheReelsMetadata(reels: WameetReelItem[]): void {
  if (typeof window === 'undefined' || !Array.isArray(reels) || reels.length === 0) return;
  try {
    const serialized = JSON.stringify(reels.slice(0, 50));
    localStorage.setItem(REELS_METADATA_STORAGE_KEY, serialized);
  } catch (e) {
    console.warn('[OfflineReels] Erreur mise en cache métadonnées:', e);
  }
}

/**
 * Récupère les métadonnées de Reels mises en cache localement
 */
export function getCachedReelsMetadata(): WameetReelItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REELS_METADATA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[OfflineReels] Erreur lecture métadonnées cache:', e);
  }
  return [];
}

/**
 * Vérifie si une vidéo est déjà présente dans le CacheStorage de la PWA
 */
export async function isReelVideoCached(videoUrl: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window) || !videoUrl) return false;
  const normalized = normalizeVideoUrl(videoUrl);

  try {
    const cache = await caches.open(REELS_VIDEO_CACHE_NAME);
    const match = (await cache.match(normalized)) || (await cache.match(videoUrl));
    return Boolean(match);
  } catch {
    return false;
  }
}

/**
 * Récupère l'URL Blob locale d'une vidéo depuis le CacheStorage si présente
 */
export async function getOfflineVideoBlobUrl(videoUrl: string): Promise<string | null> {
  if (!videoUrl) return null;
  const normalized = normalizeVideoUrl(videoUrl);

  // 1. Retourner l'URL Blob mémoire déjà active si existante
  if (memoryBlobUrls.has(normalized)) {
    return memoryBlobUrls.get(normalized)!;
  }
  if (videoUrl.startsWith('blob:')) {
    return videoUrl;
  }

  // 2. Recherche dans le CacheStorage
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(REELS_VIDEO_CACHE_NAME);
      const match = (await cache.match(normalized)) || (await cache.match(videoUrl));

      if (match) {
        const blob = await match.blob();
        if (blob && blob.size > 0) {
          const blobUrl = URL.createObjectURL(blob);
          memoryBlobUrls.set(normalized, blobUrl);
          return blobUrl;
        }
      }
    } catch (err) {
      console.warn('[OfflineReels] Erreur lecture blob du cache:', err);
    }
  }

  return null;
}

/**
 * Résout la meilleure source vidéo pour le lecteur :
 * - Priorise le Blob local en CacheStorage
 * - Sinon retourne l'URL distante si connecté
 */
export async function resolveReelVideoSource(videoUrl: string): Promise<{ src: string; isOffline: boolean }> {
  if (!videoUrl) return { src: '', isOffline: false };

  // Vérifier d'abord le cache local
  const localBlob = await getOfflineVideoBlobUrl(videoUrl);
  if (localBlob) {
    return { src: localBlob, isOffline: true };
  }

  // Si pas dans le cache
  return { src: videoUrl, isOffline: false };
}

/**
 * File d'attente de pré-chargement en arrière-plan des 5 à 10 prochains Reels
 * Télécharge les vidéos et les met en cache dans CacheStorage
 */
export async function prefetchReelsVideos(
  reels: WameetReelItem[],
  startIndex: number = 0,
  count: number = DEFAULT_PREFETCH_COUNT
): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    // Ne pas tenter de précharger si l'appareil est hors-ligne
    return;
  }

  if (!Array.isArray(reels) || reels.length === 0) return;

  // 1. Mettre à jour les métadonnées globales en cache
  cacheReelsMetadata(reels);

  // 2. Cibler la fenêtre des 5 à 10 prochains Reels à partir de startIndex
  const targetSlice = reels.slice(startIndex, startIndex + count);

  // Filtrer les URLs éligibles (exclure images, flux YouTube iframe non-blob)
  const candidateUrls: string[] = [];
  for (const reel of targetSlice) {
    if (reel.mediaType === 'image') continue;
    const url = reel.videoUrl;
    if (!url || url.includes('youtube.com') || url.includes('youtu.be')) continue;
    candidateUrls.push(url);
  }

  if (candidateUrls.length === 0) return;

  try {
    const cache = await caches.open(REELS_VIDEO_CACHE_NAME);

    // Pré-chargement séquentiel avec temporisation pour ne pas saturer la bande passante de lecture
    for (const url of candidateUrls) {
      const normalized = normalizeVideoUrl(url);

      if (ongoingPrefetches.has(normalized)) continue;

      // Vérifier si déjà en cache
      const alreadyCached = (await cache.match(normalized)) || (await cache.match(url));
      if (alreadyCached) continue;

      ongoingPrefetches.add(normalized);

      // Lancement du pré-téléchargement silencieux en arrière-plan
      fetch(normalized, { mode: 'cors', credentials: 'omit' })
        .then(async (response) => {
          if (response && (response.status === 200 || response.type === 'opaque')) {
            await cache.put(normalized, response.clone());
            console.log('[OfflineReels] Reel mis en cache pour lecture hors-ligne :', normalized);
            try {
              window.dispatchEvent(
                new CustomEvent('wameet_reels_cache_updated', {
                  detail: { url: normalized, timestamp: Date.now() },
                })
              );
            } catch {}
          }
        })
        .catch((err) => {
          // Si échec CORS standard, tentative fallback mode no-cors
          fetch(normalized, { mode: 'no-cors' })
            .then(async (res) => {
              if (res) {
                await cache.put(normalized, res);
              }
            })
            .catch(() => {
              console.warn('[OfflineReels] Pré-téléchargement ignoré pour :', normalized, err);
            });
        })
        .finally(() => {
          ongoingPrefetches.delete(normalized);
        });

      // Micro-pause de 300ms entre chaque requête pour fluidité du lecteur principal
      await new Promise((r) => setTimeout(r, 300));
    }
  } catch (err) {
    console.warn('[OfflineReels] Erreur durant prefetchReelsVideos:', err);
  }
}

/**
 * Récupère la liste de toutes les URLs de Reels actuellement en cache
 */
export async function getCachedReelUrls(): Promise<string[]> {
  if (typeof window === 'undefined' || !('caches' in window)) return [];
  try {
    const cache = await caches.open(REELS_VIDEO_CACHE_NAME);
    const keys = await cache.keys();
    return keys.map((req) => req.url);
  } catch {
    return [];
  }
}

/**
 * Nettoyage des anciennes vidéos du cache pour ne pas saturer l'espace de stockage (max 25 vidéos)
 */
export async function pruneReelsCache(maxEntries: number = 25): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cache = await caches.open(REELS_VIDEO_CACHE_NAME);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      const toDelete = keys.slice(0, keys.length - maxEntries);
      for (const req of toDelete) {
        await cache.delete(req);
      }
    }
  } catch {}
}
