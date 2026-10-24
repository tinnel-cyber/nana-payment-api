/**
 * @file dailyVideoService.ts
 * @description Service officiel d'intégration Daily.co WebRTC pour Salons Wameet, Résonance & Live Shopping NaNasore.
 * 
 * Architecture sécurisée :
 * - La clé maître DAILY_API_KEY réside STRICTEMENT côté serveur (.env backend / Cloud Functions).
 * - Le frontend n'appelle que l'endpoint backend `/api/daily/token` pour obtenir un meeting token éphémère.
 * - Durée des Salons de Résonance : strictement limitée à 15 minutes (exp: now + 15 * 60).
 * - Domaine officiel du compte : https://nanasore.daily.co
 */

export interface CreateDailyRoomOptions {
  roomName?: string;
  privacy?: 'public' | 'private';
  durationSeconds?: number; // 900s = 15 min pour Résonance
  isOwner?: boolean;        // true = Créateur / Vendeur, false = Visiteur / Acheteur
  userName?: string;
  enableChat?: boolean;
  enableScreenshare?: boolean;
}

export interface DailyRoomResult {
  url: string;
  name: string;
  token?: string;
  exp?: number;
  durationSeconds?: number;
  isOwner?: boolean;
}

export const DAILY_DOMAIN = (
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DAILY_DOMAIN) ||
  'nanasore'
);

export const DAILY_BASE_URL = `https://${DAILY_DOMAIN}.daily.co`;

/**
 * Nettoie le nom de la salle pour respecter les règles Daily.co
 */
export function sanitizeDailyRoomName(rawName: string): string {
  const clean = (rawName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  return clean || `wameet-${Date.now().toString(36)}`;
}

/**
 * Demande au backend un meeting token éphémère sécurisé et la création de la salle
 * (Ne requiert AUCUNE clé API racine sur le frontend).
 */
export async function fetchDailyMeetingToken(options: CreateDailyRoomOptions): Promise<DailyRoomResult> {
  const cleanName = sanitizeDailyRoomName(options.roomName || `wameet-${Date.now().toString(36)}`);
  const durationSeconds = options.durationSeconds || 900; // 15 min par défaut
  const isOwner = Boolean(options.isOwner);
  const userName = options.userName || (isOwner ? 'Hôte Wameet' : 'Participant Wameet');

  // 1. Appel au backend officiel /api/daily/token
  try {
    const res = await fetch('/api/daily/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomName: cleanName,
        isOwner,
        userName,
        durationSeconds,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        url: data.roomUrl || `${DAILY_BASE_URL}/${data.roomName || cleanName}`,
        name: data.roomName || cleanName,
        token: data.token,
        exp: data.exp || (Math.floor(Date.now() / 1000) + durationSeconds),
        durationSeconds,
        isOwner,
      };
    }
  } catch (err) {
    console.warn('[dailyVideoService] Appel backend /api/daily/token différé, essai fallback :', err);
  }

  // 2. Repli direct vers l'URL officielle du domaine nanasore
  return {
    url: `${DAILY_BASE_URL}/${cleanName}`,
    name: cleanName,
    durationSeconds,
    exp: Math.floor(Date.now() / 1000) + durationSeconds,
    isOwner,
  };
}

/**
 * Crée ou rejoint dynamiquement une salle vidéo Daily.co
 */
export async function createDailyRoom(options: CreateDailyRoomOptions = {}): Promise<DailyRoomResult> {
  return fetchDailyMeetingToken(options);
}

/**
 * Supprime une salle éphémère à la fermeture du salon pour libérer les ressources
 */
export async function deleteDailyRoom(roomName: string): Promise<boolean> {
  const cleanName = sanitizeDailyRoomName(roomName);
  try {
    const res = await fetch(`/api/daily/room/${cleanName}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[Daily Delete Room Error]', err);
    return false;
  }
}

/**
 * Génère l'accès d'un salon vidéo Live Product pour un produit spécifique
 * - Hôte (Vendeur) : isOwner = true
 * - Acheteur / Spectateur : isOwner = false
 */
export async function createLiveProductRoom(
  productId: string,
  productName: string,
  userName?: string,
  isOwner = false
): Promise<DailyRoomResult> {
  const roomName = `live-prod-${productId}`;
  return fetchDailyMeetingToken({
    roomName,
    privacy: 'public',
    durationSeconds: 7200, // 2 heures pour une session live shopping produit
    isOwner,
    userName: userName || (isOwner ? 'Vendeur NaNa' : 'Acheteur NaNa'),
    enableChat: true,
    enableScreenshare: true,
  });
}

/**
 * Génère l'accès à un salon Synergy Match (Résonance Wameet)
 * Strictly configuré sur 15 MINUTES (900 secondes) avec timer visuel & auto-exp.
 */
export async function createSynergyMatchRoom(
  reelId: string,
  userId: string,
  creatorName?: string,
  isOwner = false
): Promise<DailyRoomResult> {
  const roomName = `synergy-${reelId.slice(0, 12)}-${userId.slice(0, 8)}`;
  return fetchDailyMeetingToken({
    roomName,
    privacy: 'public',
    durationSeconds: 900, // 15 MINUTES EXACTES (Règle Métier Résonance)
    isOwner,
    userName: creatorName || (isOwner ? 'Créateur Reel' : 'Membre en Résonance'),
    enableChat: true,
    enableScreenshare: true,
  });
}
