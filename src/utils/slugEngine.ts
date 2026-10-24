// Chemin : src/utils/slugEngine.ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Moteur Universel d'Auto-Slug Nanasore OS
 * Garantit qu'aucune boutique, aucun produit et aucun tunnel n'existe sans slug valide,
 * et protège contre les collisions entre comptes via un suffixe déterministe d'UID.
 */

export function slugifyText(input: string, fallbackPrefix = 'item'): string {
  const cleaned = (input || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Remplace tout caractère spécial par un tiret
    .replace(/^-+|-+$/g, '');

  return cleaned.length >= 2 ? cleaned : `${fallbackPrefix}-${Math.random().toString(36).substring(2, 7)}`;
}

export const slugify = slugifyText;

/**
 * Moteur de Génération de Slug Global Infaillible (getSafeStoreSlug)
 * Si un utilisateur (Formateur ou Commerçant) n'a pas encore de slug enregistré dans Firestore,
 * génère automatiquement un slug propre à partir du nom de sa boutique, de son nom/email
 * ou de son UID (slugify(storeName || displayName || 'boutique-' + uid.slice(0, 6)))
 * afin qu'aucun lien de boutique, de tunnel ou de campus ne soit jamais cassé ni undefined.
 */
export function getSafeStoreSlug(
  source?: any,
  secondaryStore?: any,
  userFallback?: any
): string {
  try {
    if (typeof source === 'string' && source.trim() && source !== 'undefined' && source !== 'null') {
      const cleaned = slugifyText(source.replace(/^store-/, ''), 'ma-boutique');
      if (typeof window !== 'undefined') {
        (window as any).storeSlug = cleaned;
      }
      return cleaned;
    }

    const s1 = (source && typeof source === 'object') ? source : {};
    const s2 = (secondaryStore && typeof secondaryStore === 'object') ? secondaryStore : {};
    const u = (userFallback && typeof userFallback === 'object') ? userFallback : {};

    const explicitSlug =
      s1.storeSlug ||
      s1.slug ||
      s2.storeSlug ||
      s2.slug ||
      u.storeSlug ||
      u.slug;

    if (
      typeof explicitSlug === 'string' &&
      explicitSlug.trim().length >= 2 &&
      explicitSlug !== 'undefined' &&
      explicitSlug !== 'null' &&
      explicitSlug !== 'boutique-officielle'
    ) {
      const cleaned = slugifyText(explicitSlug.replace(/^store-/, ''), 'ma-boutique');
      if (typeof window !== 'undefined') {
        (window as any).storeSlug = cleaned;
      }
      return cleaned;
    }

    const storeName =
      s1.storeName ||
      s2.storeName ||
      u.storeName ||
      (s1.name && s1.name !== 'Boutique Officielle' ? s1.name : '') ||
      (s2.name && s2.name !== 'Boutique Officielle' ? s2.name : '');

    const rawEmail = s1.email || s2.email || u.email || '';
    const emailPrefix = typeof rawEmail === 'string' && rawEmail.includes('@') ? rawEmail.split('@')[0] : '';

    const displayName =
      s1.displayName ||
      s2.displayName ||
      u.displayName ||
      u.name ||
      emailPrefix;

    const rawUid =
      s1.uid ||
      s1.id ||
      s1.storeId ||
      s2.uid ||
      s2.id ||
      s2.storeId ||
      u.uid ||
      u.id ||
      u.storeId ||
      '';

    const cleanUid = String(rawUid || '').replace(/^store-/, '').replace(/^usr-/, '').trim();
    const rawCandidate =
      (storeName && String(storeName).trim() !== 'Boutique Officielle' ? storeName : '') ||
      displayName ||
      (cleanUid ? `boutique-${cleanUid.slice(0, 6)}` : 'ma-boutique');

    const finalSlug = slugifyText(String(rawCandidate), 'ma-boutique') || 'ma-boutique';

    if (typeof window !== 'undefined') {
      (window as any).storeSlug = finalSlug;
    }
    return finalSlug;
  } catch {
    return 'ma-boutique';
  }
}

/**
 * Génère un slug de boutique obligatoire et déterministe sans jamais entrer en collision
 * avec un autre compte portant le même nom (grâce au suffixe court de l'UID).
 */
export function ensureMandatoryStoreSlug(
  existingSlug: string | undefined | null,
  storeName: string | undefined | null,
  userDisplayNameOrEmail: string | undefined | null,
  userId: string
): string {
  if (existingSlug && existingSlug.trim().length >= 2 && existingSlug !== 'boutique-officielle' && existingSlug !== 'undefined') {
    const cleaned = slugifyText(existingSlug.replace(/^store-/, ''), 'boutique');
    if (typeof window !== 'undefined') {
      (window as any).storeSlug = cleaned;
    }
    return cleaned;
  }
  const uidSuffix = (userId || 'usr').replace(/^store-/, '').slice(0, 6).toLowerCase();
  const rawBase =
    storeName && storeName.trim() && storeName !== 'Boutique Officielle'
      ? storeName
      : (userDisplayNameOrEmail || '').split('@')[0] || `boutique-${uidSuffix}`;
  const baseSlug = slugifyText(rawBase, 'boutique');
  const resolved = baseSlug.endsWith(uidSuffix) ? baseSlug : `${baseSlug}-${uidSuffix.slice(0, 4)}`;
  if (typeof window !== 'undefined') {
    (window as any).storeSlug = resolved;
  }
  return resolved;
}

/**
 * Garantit un slug obligatoire pour chaque Produit (auto-généré depuis son nom + suffixe d'ID)
 */
export function ensureMandatoryProductSlug(product: { id?: string; name?: string; title?: string; slug?: string }): string {
  if (product.slug && product.slug.trim().length >= 2) {
    return slugifyText(product.slug, 'prod');
  }
  const base = slugifyText(product.name || product.title || 'produit', 'prod');
  const suffix = (product.id || Math.random().toString(36).substring(2, 6)).slice(-4).toLowerCase();
  return `${base}-${suffix}`;
}

/**
 * Garantit un slug obligatoire pour chaque Tunnel de vente (Funnel)
 */
export function ensureMandatoryFunnelSlug(funnel: { id?: string; name?: string; title?: string; productName?: string; slug?: string }): string {
  if (funnel.slug && funnel.slug.trim().length >= 2) {
    return slugifyText(funnel.slug, 'offre');
  }
  const base = slugifyText(funnel.name || funnel.title || funnel.productName || 'offre-vip', 'offre');
  const suffix = (funnel.id || Math.random().toString(36).substring(2, 6)).slice(-4).toLowerCase();
  return `${base}-${suffix}`;
}

