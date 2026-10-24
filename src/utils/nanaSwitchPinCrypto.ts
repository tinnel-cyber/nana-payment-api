/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NaNaSwitch Cloud — Utilitaire Cryptographique Code PIN de Sécurité (SHA-256)
 * Permet de hacher et vérifier les codes PIN à 4 chiffres sans jamais stocker de texte clair.
 */

const PIN_SALT = 'nanaswitch_cloud_vault_salt_v1_';

/**
 * Calcule l'empreinte SHA-256 d'un code PIN à 4 chiffres salé.
 */
export async function hashPin(pin: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(`${PIN_SALT}${pin.trim()}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('[PIN_CRYPTO] Erreur crypto.subtle, fallback basique :', err);
  }
  // Fallback simple si indisponible
  let hash = 0;
  const str = `${PIN_SALT}${pin}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `fallback_hash_${Math.abs(hash)}`;
}

/**
 * Vérifie si le code PIN saisi correspond à l'empreinte enregistrée.
 */
export async function verifyPin(enteredPin: string, storedHash: string): Promise<boolean> {
  if (!enteredPin || !storedHash) return false;
  const computedHash = await hashPin(enteredPin);
  return computedHash === storedHash;
}

/**
 * Gestionnaire de Session Déverrouillée (10 minutes d'inactivité max)
 */
const PIN_SESSION_KEY = 'nanaswitch_pin_unlocked_until';

export function isPinSessionUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const until = sessionStorage.getItem(PIN_SESSION_KEY);
    if (!until) return false;
    const expiresAt = parseInt(until, 10);
    return Date.now() < expiresAt;
  } catch {
    return false;
  }
}

export function grantPinSession(durationMinutes: number = 10): void {
  if (typeof window === 'undefined') return;
  try {
    const expiresAt = Date.now() + durationMinutes * 60 * 1000;
    sessionStorage.setItem(PIN_SESSION_KEY, expiresAt.toString());
  } catch (e) {
    console.warn('[PIN_SESSION] Erreur stockage session :', e);
  }
}

export function lockPinSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(PIN_SESSION_KEY);
  } catch (e) {
    console.warn('[PIN_SESSION] Erreur lock session :', e);
  }
}
