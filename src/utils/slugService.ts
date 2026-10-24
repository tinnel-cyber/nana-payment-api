/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Service de Résolution Multi-Domaine & Gestion Intelligente des Slugs (Auto-Heal)
 * Gère l'accès direct aux boutiques par slug, la persistance Cloud Firestore autoritaire,
 * et la création automatique (Auto-Heal) des slugs pour les boutiques, produits et tunnels.
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, rtdb } from '../firebase';
import { getSafeStoreSlug } from './slugEngine';
import { getThemeRoutePrefix } from './themeRoutePrefix';
import { buildPublicShopUrl } from '../config/domains';

export { getSafeStoreSlug };

/**
 * Convertit un texte en slug propre, URL-safe et sans accents
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Auto-Heal Store Slug avec Protection Anti-Collision Stricte (Respect de l'UID propriétaire) :
 * Si le slug existe déjà dans 'tenants' ou 'stores' avec un autre ownerId,
 * ne l'écrase jamais : ajoute un suffixe unique (-uid ou -2) pour préserver
 * à 100% l'intégrité et la propriété du premier compte.
 */
export async function autoHealStoreSlug(storeId: string, storeData: any): Promise<string> {
  const existingSlug = storeData?.storeSlug || storeData?.slug;
  const ownerId = storeData?.ownerId || storeData?.userId || storeData?.uid || storeId;

  if (existingSlug && typeof existingSlug === 'string' && existingSlug.trim() && existingSlug !== 'boutique-officielle' && existingSlug !== 'undefined') {
    const cleanExisting = slugify(existingSlug.trim().replace(/^store-/, '')) || 'ma-boutique';
    if (typeof window !== 'undefined') {
      (window as any).storeSlug = cleanExisting;
    }
    return cleanExisting;
  }

  const cleanUid = String(ownerId || storeId || 'boutique').replace(/^store-/, '').replace(/^usr-/, '');
  const baseName =
    (storeData?.storeName && storeData.storeName !== 'Boutique Officielle' ? storeData.storeName : '') ||
    storeData?.displayName ||
    storeData?.name ||
    (storeData?.email ? String(storeData.email).split('@')[0] : '') ||
    `boutique-${cleanUid.slice(0, 6)}`;
  const baseSlug = slugify(baseName) || getSafeStoreSlug(storeData, { storeId, uid: ownerId }) || 'ma-boutique';
  let resolvedSlug = baseSlug;

  try {
    // 1. Vérification dans 'tenants/{slug}' : si déjà existant sous un AUTRE propriétaire
    const tenantRef = doc(db, 'tenants', baseSlug);
    const tenantSnap = await getDoc(tenantRef);
    if (tenantSnap.exists()) {
      const tData = tenantSnap.data();
      const existingOwner = tData?.ownerId || tData?.userId || tData?.storeId;
      if (existingOwner && existingOwner !== ownerId && existingOwner !== storeId) {
        // Collision détectée : on applique le suffixe unique basé sur l'UID ou -2
        const uidSuffix = ownerId ? ownerId.slice(0, 4).toLowerCase() : '2';
        resolvedSlug = `${baseSlug}-${uidSuffix}`;

        // Si le premier suffixe est aussi pris, fallback incrémental -2, -3...
        const checkSuffix = await getDoc(doc(db, 'tenants', resolvedSlug));
        if (checkSuffix.exists() && checkSuffix.data()?.ownerId !== ownerId) {
          resolvedSlug = `${baseSlug}-2`;
          const check2 = await getDoc(doc(db, 'tenants', resolvedSlug));
          if (check2.exists() && check2.data()?.ownerId !== ownerId) {
            resolvedSlug = `${baseSlug}-3`;
          }
        }
      }
    }
  } catch (collisionErr) {
    console.warn('[SLUG ANTI-COLLISION] Vérification collision ignorée:', collisionErr);
  }

  // 2. Persistance sécurisée dans le document isolé stores/{storeId} du propriétaire
  try {
    const storeRef = doc(db, 'stores', storeId);
    await setDoc(storeRef, {
      storeSlug: resolvedSlug,
      slug: resolvedSlug,
      ownerId: ownerId,
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log(`[SLUG AUTO-HEAL] Slug boutique sécurisé généré et sauvegardé : ${resolvedSlug} (${storeId})`);
  } catch (err) {
    console.warn('[SLUG AUTO-HEAL] Sauvegarde slug boutique différée :', err);
  }

  return resolvedSlug;
}

/**
 * Auto-Heal Product Slug : Si le produit n'a pas encore de slug dans Firestore,
 * le génère à partir de son nom et le persiste immédiatement.
 */
export async function autoHealProductSlug(storeId: string, productId: string, productData: any): Promise<string> {
  const existingSlug = productData?.productSlug || productData?.slug;
  if (existingSlug && typeof existingSlug === 'string' && existingSlug.trim()) {
    return existingSlug.trim();
  }

  const baseName = productData?.name || productData?.title || productId.replace(/^prod-/, '');
  const generatedSlug = slugify(baseName) || productId;

  if (storeId) {
    try {
      const prodRef = doc(db, 'stores', storeId, 'products', productId);
      await updateDoc(prodRef, {
        productSlug: generatedSlug,
        slug: generatedSlug,
        updatedAt: serverTimestamp()
      });
      console.log(`[SLUG AUTO-HEAL] Slug produit généré et sauvegardé dans Firestore : ${generatedSlug} (${productId})`);
    } catch (err) {
      console.warn('[SLUG AUTO-HEAL] Sauvegarde slug produit différée :', err);
    }
  }

  return generatedSlug;
}

/**
 * Auto-Heal Funnel Slug : Si le tunnel n'a pas encore de slug dans Firestore,
 * le génère à partir de son titre et le persiste immédiatement.
 */
export async function autoHealFunnelSlug(funnelId: string, funnelData: any): Promise<string> {
  const existingSlug = funnelData?.funnelSlug || funnelData?.slug;
  if (existingSlug && typeof existingSlug === 'string' && existingSlug.trim()) {
    return existingSlug.trim();
  }

  const baseName = funnelData?.name || funnelData?.title || funnelId.replace(/^funnel-/, '');
  const generatedSlug = slugify(baseName) || funnelId;

  try {
    const funnelRef = doc(db, 'funnels', funnelId);
    await updateDoc(funnelRef, {
      funnelSlug: generatedSlug,
      slug: generatedSlug,
      updatedAt: serverTimestamp()
    });
    console.log(`[SLUG AUTO-HEAL] Slug tunnel généré et sauvegardé dans Firestore : ${generatedSlug} (${funnelId})`);
  } catch (err) {
    console.warn('[SLUG AUTO-HEAL] Sauvegarde slug tunnel différée :', err);
  }

  return generatedSlug;
}

/**
 * Résout une boutique publique depuis Firestore sans AUCUN recours au localStorage.
 * Supporte :
 * 1. L'ID direct ('store-konkobo-telecom' ou 'konkobo-telecom')
 * 2. Le slug nominatif ('storeSlug' == :storeSlug)
 * 3. Le slug alternatif ('slug' == :storeSlug)
 * 4. Fallback dans la collection 'tenants'
 */
export async function fetchPublicStoreBySlugOrId(storeSlugOrId: string): Promise<any | null> {
  if (!storeSlugOrId) return null;
  const cleanParam = decodeURIComponent(storeSlugOrId).trim();

  // 1. Essai direct par ID de document 'stores/{id}'
  try {
    const directRef = doc(db, 'stores', cleanParam);
    const directSnap = await getDoc(directRef);
    if (directSnap.exists()) {
      const data = directSnap.data();
      const resolvedSlug = await autoHealStoreSlug(directSnap.id, data);
      const themeId = data.activeThemeId || data.active_theme_id || 'theme-default';
      const prefix = data.activeThemePrefix || getThemeRoutePrefix(themeId, data.blankThemeIndex || 1);
      return { 
        id: directSnap.id, 
        ...data, 
        storeSlug: resolvedSlug, 
        slug: resolvedSlug,
        tenantSlug: resolvedSlug,
        activeThemeId: themeId,
        active_theme_id: themeId,
        activeThemePrefix: prefix,
        publicShopUrl: data.publicShopUrl || buildPublicShopUrl(resolvedSlug, { themeId, blankIndex: data.blankThemeIndex })
      };
    }
  } catch (err) {
    console.warn('[FIRESTORE] Erreur lecture directe store par ID:', err);
  }

  // Si l'ID a un préfixe store- ou pas : tenter l'alternative avec/sans 'store-'
  const altId = cleanParam.startsWith('store-') 
    ? cleanParam.replace(/^store-/, '') 
    : `store-${cleanParam}`;
  try {
    const altRef = doc(db, 'stores', altId);
    const altSnap = await getDoc(altRef);
    if (altSnap.exists()) {
      const data = altSnap.data();
      const resolvedSlug = await autoHealStoreSlug(altSnap.id, data);
      const themeId = data.activeThemeId || data.active_theme_id || 'theme-default';
      const prefix = data.activeThemePrefix || getThemeRoutePrefix(themeId, data.blankThemeIndex || 1);
      return { 
        id: altSnap.id, 
        ...data, 
        storeSlug: resolvedSlug, 
        slug: resolvedSlug,
        tenantSlug: resolvedSlug,
        activeThemeId: themeId,
        active_theme_id: themeId,
        activeThemePrefix: prefix,
        publicShopUrl: data.publicShopUrl || buildPublicShopUrl(resolvedSlug, { themeId, blankIndex: data.blankThemeIndex })
      };
    }
  } catch {}

  // 2. Recherche par champ 'storeSlug' == cleanParam
  try {
    const q1 = query(collection(db, 'stores'), where('storeSlug', '==', cleanParam));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const docItem = snap1.docs[0];
      const data = docItem.data();
      const themeId = data.activeThemeId || data.active_theme_id || 'theme-default';
      const prefix = data.activeThemePrefix || getThemeRoutePrefix(themeId, data.blankThemeIndex || 1);
      return { 
        id: docItem.id, 
        ...data, 
        storeSlug: cleanParam, 
        slug: cleanParam,
        tenantSlug: cleanParam,
        activeThemeId: themeId,
        active_theme_id: themeId,
        activeThemePrefix: prefix,
        publicShopUrl: data.publicShopUrl || buildPublicShopUrl(cleanParam, { themeId, blankIndex: data.blankThemeIndex })
      };
    }
  } catch (err) {
    console.warn('[FIRESTORE] Erreur query storeSlug:', err);
  }

  // 3. Recherche par champ 'slug' == cleanParam
  try {
    const q2 = query(collection(db, 'stores'), where('slug', '==', cleanParam));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const docItem = snap2.docs[0];
      const data = docItem.data();
      const themeId = data.activeThemeId || data.active_theme_id || 'theme-default';
      const prefix = data.activeThemePrefix || getThemeRoutePrefix(themeId, data.blankThemeIndex || 1);
      return { 
        id: docItem.id, 
        ...data, 
        storeSlug: cleanParam, 
        slug: cleanParam,
        tenantSlug: cleanParam,
        activeThemeId: themeId,
        active_theme_id: themeId,
        activeThemePrefix: prefix,
        publicShopUrl: data.publicShopUrl || buildPublicShopUrl(cleanParam, { themeId, blankIndex: data.blankThemeIndex })
      };
    }
  } catch (err) {
    console.warn('[FIRESTORE] Erreur query slug:', err);
  }

  // 4. Recherche par storeName slugifié ou nom approchant
  try {
    const tenantRef = doc(db, 'tenants', cleanParam);
    const tenantSnap = await getDoc(tenantRef);
    if (tenantSnap.exists()) {
      const tData = tenantSnap.data();
      const themeId = tData.activeThemeId || tData.active_theme_id || 'theme-default';
      const prefix = tData.activeThemePrefix || getThemeRoutePrefix(themeId, tData.blankThemeIndex || 1);
      return { 
        id: tenantSnap.id, 
        ...tData, 
        storeSlug: cleanParam,
        slug: cleanParam,
        tenantSlug: cleanParam,
        activeThemeId: themeId,
        active_theme_id: themeId,
        activeThemePrefix: prefix,
        publicShopUrl: tData.publicShopUrl || buildPublicShopUrl(cleanParam, { themeId, blankIndex: tData.blankThemeIndex })
      };
    }
  } catch {}

  return null;
}

/**
 * Récupère tous les produits publics associés à une boutique dans Firestore.
 * Aucune lecture depuis le localStorage pour garantir l'isolation inter-domaines.
 */
export async function fetchPublicStoreProducts(storeId: string): Promise<any[]> {
  if (!storeId) return [];
  try {
    const colRef = collection(db, 'stores', storeId, 'products');
    const snap = await getDocs(colRef);
    if (snap.empty) return [];

    const products: any[] = [];
    snap.forEach((d) => {
      const pData = d.data();
      products.push({ id: d.id, ...pData, storeId });
    });

    // Auto-heal en arrière-plan des produits sans slug
    products.forEach((p) => {
      if (!p.productSlug && !p.slug) {
        autoHealProductSlug(storeId, p.id, p).catch(() => {});
      }
    });

    return products;
  } catch (err) {
    console.warn('[FIRESTORE] Erreur lecture catalogue produits vitrine :', err);
    return [];
  }
}

/**
 * Récupère un produit public précis par son slug ou son ID
 */
export async function fetchPublicProductBySlugOrId(storeId: string, productSlugOrId: string): Promise<any | null> {
  if (!storeId || !productSlugOrId) return null;
  const cleanParam = decodeURIComponent(productSlugOrId).trim();

  // 1. Par ID direct
  try {
    const directRef = doc(db, 'stores', storeId, 'products', cleanParam);
    const snap = await getDoc(directRef);
    if (snap.exists()) {
      const data = snap.data();
      const resolvedSlug = await autoHealProductSlug(storeId, snap.id, data);
      return { id: snap.id, ...data, productSlug: resolvedSlug, slug: resolvedSlug };
    }
  } catch {}

  // 2. Par productSlug
  try {
    const q1 = query(collection(db, 'stores', storeId, 'products'), where('productSlug', '==', cleanParam));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const docItem = snap1.docs[0];
      return { id: docItem.id, ...docItem.data() };
    }
  } catch {}

  // 3. Par slug
  try {
    const q2 = query(collection(db, 'stores', storeId, 'products'), where('slug', '==', cleanParam));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const docItem = snap2.docs[0];
      return { id: docItem.id, ...docItem.data() };
    }
  } catch {}

  return null;
}

/**
 * Structure des métadonnées de routage et thème persistées dans Firestore
 */
export interface PersistTenantSlugResult {
  storeSlug: string;
  slug: string;
  tenantSlug: string;
  activeThemeId: string;
  activeThemePrefix: string;
  blankThemeIndex: number;
  publicShopUrl: string;
  themeRoutePattern: string;
  productRoutePattern: string;
  funnelRoutePattern: string;
}

/**
 * Génère et enregistre de manière stable et autoritaire dans Cloud Firestore :
 * 1. Le slug de l'entreprise (storeSlug, slug, tenantSlug)
 * 2. Le thème actif (activeThemeId, active_theme_id)
 * 3. Le préfixe court de routage public (activeThemePrefix : se, dp, et... ou romain i, ii, v, x)
 * 4. L'URL publique officielle sur nsore.shop (publicShopUrl)
 * 5. Les modèles d'arborescence (themeRoutePattern, productRoutePattern, funnelRoutePattern)
 *
 * Écrit à la fois dans 'stores/{storeId}', 'tenants/{storeSlug}' et 'tenants/{storeId}'.
 */
export async function ensureAndPersistTenantSlug(
  storeId: string,
  storeData?: any,
  ownerId?: string,
  options?: { themeId?: string; blankIndex?: number }
): Promise<string> {
  if (!storeId && !ownerId && !storeData) return 'ma-boutique';
  const authUid = auth?.currentUser?.uid;
  const effectiveStoreId = storeId || authUid || ownerId || 'boutique';
  const effectiveOwnerId = ownerId || storeData?.ownerId || storeData?.userId || storeData?.uid || authUid || effectiveStoreId;
  const storeName = storeData?.storeName || storeData?.displayName || storeData?.name || '';

  // 1. Détermination du slug officiel sécurisé anti-collision
  const resolvedSlug = await autoHealStoreSlug(effectiveStoreId, {
    ...storeData,
    storeId: effectiveStoreId,
    ownerId: effectiveOwnerId,
  });

  // 2. Détermination du thème actif et préfixe de route officiel
  let activeThemeId = options?.themeId || 
    storeData?.activeThemeId || 
    storeData?.active_theme_id || 
    storeData?.themeId;

  if (!activeThemeId && typeof window !== 'undefined') {
    try {
      activeThemeId = localStorage.getItem('nana_active_theme_id') || 
        (authUid ? localStorage.getItem(`nana_boutique_theme_id_${authUid}`) : null) ||
        localStorage.getItem(`nana_boutique_theme_id_${effectiveStoreId}`) || 
        localStorage.getItem('nana_boutique_theme_id');
    } catch {}
  }

  // Si toujours non déterminé, interroger Firestore pour préserver le thème déjà actif et ne JAMAIS écraser par défaut
  if (!activeThemeId) {
    try {
      const docToProbe = authUid ? doc(db, 'stores', authUid) : doc(db, 'stores', effectiveStoreId);
      const snap = await getDoc(docToProbe);
      if (snap.exists()) {
        const d = snap.data();
        activeThemeId = d?.activeThemeId || d?.active_theme_id || d?.themeId;
      }
      if (!activeThemeId) {
        const tSnap = await getDoc(doc(db, 'tenants', resolvedSlug));
        if (tSnap.exists()) {
          const td = tSnap.data();
          activeThemeId = td?.activeThemeId || td?.active_theme_id || td?.themeId;
        }
      }
    } catch (e) {
      console.warn('[SLUG PROBE] Impossible de vérifier le thème existant :', e);
    }
  }

  activeThemeId = activeThemeId || 'theme-default';

  const blankThemeIndex = options?.blankIndex || 
    storeData?.blankThemeIndex || 
    (typeof window !== 'undefined' ? Number(localStorage.getItem('nana_blank_theme_index')) : null) || 
    1;

  const activeThemePrefix = getThemeRoutePrefix(activeThemeId, blankThemeIndex);
  const publicShopUrl = buildPublicShopUrl(resolvedSlug, { 
    themeId: activeThemeId, 
    blankIndex: blankThemeIndex 
  });

  const themeRoutePattern = `https://nsore.shop/{themePrefix}/{storeSlug}`;
  const productRoutePattern = `https://nsore.shop/{themePrefix}/{storeSlug}/p/{productSlug}`;
  const funnelRoutePattern = `https://nsore.shop/{themePrefix}/{storeSlug}/f/{funnelSlug}`;

  if (typeof window !== 'undefined') {
    (window as any).storeSlug = resolvedSlug;
    (window as any).activeThemeId = activeThemeId;
    (window as any).activeThemePrefix = activeThemePrefix;
    (window as any).publicShopUrl = publicShopUrl;
    try {
      localStorage.setItem('nana_tenant_slug', resolvedSlug);
      localStorage.setItem('nana_active_theme_id', activeThemeId);
      if (effectiveStoreId) {
        localStorage.setItem(`nana_boutique_theme_id_${effectiveStoreId}`, activeThemeId);
      }
      if (authUid) {
        localStorage.setItem(`nana_boutique_theme_id_${authUid}`, activeThemeId);
      }
      localStorage.setItem('nana_boutique_theme_id', activeThemeId);
      localStorage.setItem('nana_active_theme_prefix', activeThemePrefix);
      localStorage.setItem('nana_public_shop_url', publicShopUrl);
    } catch {}
  }

  const firestorePayload: Record<string, any> = {
    storeSlug: resolvedSlug,
    slug: resolvedSlug,
    tenantSlug: resolvedSlug,
    activeThemeId: activeThemeId,
    active_theme_id: activeThemeId,
    themeId: activeThemeId,
    activeThemePrefix: activeThemePrefix,
    blankThemeIndex: blankThemeIndex,
    publicShopUrl: publicShopUrl,
    themeRoutePattern: themeRoutePattern,
    productRoutePattern: productRoutePattern,
    funnelRoutePattern: funnelRoutePattern,
    ownerId: effectiveOwnerId,
    ...(storeName ? { storeName } : {}),
    updatedAt: serverTimestamp()
  };

  let firestoreError: any = null;

  // 3. Persistance dans stores/{authUid} (autorisé par les règles isOwner(userId))
  if (authUid) {
    try {
      const userStoreRef = doc(db, 'stores', authUid);
      await setDoc(userStoreRef, firestorePayload, { merge: true });
      console.log(`[THEMES FIRESTORE] activeThemeId sauvegardé dans stores/${authUid}: ${activeThemeId}`);
    } catch (err) {
      console.error('[THEMES FIRESTORE ERROR] Erreur sauvegarde stores/{authUid}:', err);
      firestoreError = err;
    }
  }

  // 4. Persistance dans stores/{effectiveStoreId} si distinct de authUid
  if (effectiveStoreId && effectiveStoreId !== authUid) {
    try {
      const storeRef = doc(db, 'stores', effectiveStoreId);
      await setDoc(storeRef, firestorePayload, { merge: true });
      console.log(`[THEMES FIRESTORE] activeThemeId sauvegardé dans stores/${effectiveStoreId}: ${activeThemeId}`);
    } catch (err) {
      console.error(`[THEMES FIRESTORE ERROR] Erreur sauvegarde stores/${effectiveStoreId}:`, err);
      firestoreError = err;
    }
  }

  // 5. Persistance stable dans Firestore : 'tenants/{resolvedSlug}'
  try {
    const tenantSlugRef = doc(db, 'tenants', resolvedSlug);
    await setDoc(tenantSlugRef, {
      ...firestorePayload,
      tenantId: effectiveStoreId || authUid || resolvedSlug,
      storeId: authUid || effectiveStoreId || resolvedSlug,
      name: storeName || resolvedSlug
    }, { merge: true });
    console.log(`[THEMES FIRESTORE] activeThemeId sauvegardé dans tenants/${resolvedSlug}: ${activeThemeId}`);
  } catch (err) {
    console.error(`[THEMES FIRESTORE ERROR] Erreur sauvegarde tenants/${resolvedSlug}:`, err);
    firestoreError = err;
  }

  // 6. Liaison dans 'tenants/{effectiveStoreId}' si différent du slug résolu
  if (effectiveStoreId && effectiveStoreId !== resolvedSlug) {
    try {
      const tenantIdRef = doc(db, 'tenants', effectiveStoreId);
      await setDoc(tenantIdRef, {
        ...firestorePayload,
        tenantId: effectiveStoreId,
        storeId: authUid || effectiveStoreId
      }, { merge: true });
    } catch (err) {
      console.error(`[THEMES FIRESTORE ERROR] Erreur sauvegarde tenants/${effectiveStoreId}:`, err);
    }
  }

  // 7. Liaison dans 'tenants/{authUid}' si distinct
  if (authUid && authUid !== resolvedSlug && authUid !== effectiveStoreId) {
    try {
      const tenantAuthRef = doc(db, 'tenants', authUid);
      await setDoc(tenantAuthRef, {
        ...firestorePayload,
        tenantId: authUid,
        storeId: authUid
      }, { merge: true });
    } catch (err) {
      console.error(`[THEMES FIRESTORE ERROR] Erreur sauvegarde tenants/${authUid}:`, err);
    }
  }

  // 8. Synchronisation Firebase Realtime Database (RTDB) : /tenants/{tenantId}/activeThemeId
  if (rtdb) {
    try {
      const { ref: rtdbRef, update: rtdbUpdate } = await import('firebase/database');
      const rtdbPayload = {
        activeThemeId: activeThemeId,
        active_theme_id: activeThemeId,
        themeId: activeThemeId,
        activeThemePrefix: activeThemePrefix,
        publicShopUrl: publicShopUrl,
        updatedAt: Date.now()
      };
      const primaryTenantKey = effectiveStoreId || authUid || resolvedSlug;
      await rtdbUpdate(rtdbRef(rtdb, `tenants/${primaryTenantKey}`), rtdbPayload);
      if (resolvedSlug && resolvedSlug !== primaryTenantKey) {
        await rtdbUpdate(rtdbRef(rtdb, `tenants/${resolvedSlug}`), rtdbPayload);
      }
      if (authUid && authUid !== primaryTenantKey && authUid !== resolvedSlug) {
        await rtdbUpdate(rtdbRef(rtdb, `tenants/${authUid}`), rtdbPayload);
      }
      console.log(`[THEMES RTDB] activeThemeId persisté dans Firebase RTDB /tenants/${primaryTenantKey}/activeThemeId = ${activeThemeId}`);
    } catch (rtdbErr) {
      console.error('[THEMES RTDB ERROR] Échec de synchronisation RTDB tenants/activeThemeId:', rtdbErr);
    }
  }

  if (firestoreError) {
    throw firestoreError;
  }

  return resolvedSlug;
}

