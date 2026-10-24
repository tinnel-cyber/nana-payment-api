import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface WameetBridgeUpgradeParams {
  uid?: string;
  name?: string;
  handle?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface NanasoreShopDocument {
  id: string;
  ownerId: string;
  storeName: string;
  slug: string;
  ownerHandle: string;
  ownerName: string;
  ownerAvatar: string;
  ownerPhone?: string;
  status: 'active' | 'pending' | 'suspended';
  currency: string;
  createdAt: any;
  updatedAt: any;
  productsCount: number;
  categories: string[];
  description: string;
  isVerified: boolean;
  hasPhysicalProducts: boolean;
  hasDigitalCourses: boolean;
  paymentGateways: string[];
  source: 'wameet_bridge';
}

export interface BridgeUpgradeResult {
  success: boolean;
  shopId: string;
  storeName: string;
  isNewStore: boolean;
  shopData: NanasoreShopDocument;
}

const LOCAL_STORAGE_KEY_HAS_STORE = 'wameet_has_nanasore_store';
const LOCAL_STORAGE_KEY_STORE_ID = 'wameet_nanasore_store_id';

/**
 * Vérifie si l'utilisateur possède déjà une boutique / espace Nanasore actif
 */
export async function checkUserHasNanasoreStore(explicitUid?: string): Promise<{
  hasStore: boolean;
  shopId?: string;
  shopData?: NanasoreShopDocument;
}> {
  const uid = explicitUid || auth.currentUser?.uid;
  if (!uid) {
    const cachedHasStore = localStorage.getItem(LOCAL_STORAGE_KEY_HAS_STORE) === 'true';
    const cachedStoreId = localStorage.getItem(LOCAL_STORAGE_KEY_STORE_ID) || undefined;
    return { hasStore: cachedHasStore, shopId: cachedStoreId };
  }

  try {
    // 1. Vérification dans /users/{uid}
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.hasNanasoreStore === true) {
        localStorage.setItem(LOCAL_STORAGE_KEY_HAS_STORE, 'true');
        localStorage.setItem(LOCAL_STORAGE_KEY_STORE_ID, uid);
        return { hasStore: true, shopId: uid };
      }
    }

    // 2. Vérification dans /nanasore_shops/{uid}
    const shopDocRef = doc(db, 'nanasore_shops', uid);
    const shopSnap = await getDoc(shopDocRef);
    if (shopSnap.exists()) {
      localStorage.setItem(LOCAL_STORAGE_KEY_HAS_STORE, 'true');
      localStorage.setItem(LOCAL_STORAGE_KEY_STORE_ID, uid);
      return {
        hasStore: true,
        shopId: uid,
        shopData: shopSnap.data() as NanasoreShopDocument
      };
    }
  } catch (err) {
    console.warn('[WAMEET BRIDGE] Erreur vérification boutique Nanasore :', err);
  }

  const cachedHasStore = localStorage.getItem(LOCAL_STORAGE_KEY_HAS_STORE) === 'true';
  const cachedStoreId = localStorage.getItem(LOCAL_STORAGE_KEY_STORE_ID) || undefined;
  return { hasStore: cachedHasStore, shopId: cachedStoreId };
}

/**
 * Passerelle de Monétisation Zéro-Friction (Bridge 1-Clic Wameet -> Nanasore)
 * Débloque le statut Vendeur/Formateur sans re-login grâce à l'UID Firebase partagé.
 */
export async function upgradeWameetUserToNanasore(
  params: WameetBridgeUpgradeParams
): Promise<BridgeUpgradeResult> {
  const effectiveUid =
    params.uid ||
    auth.currentUser?.uid ||
    localStorage.getItem('wameet_phone_auth_uid') ||
    `wuser_${Date.now()}`;

  const cleanHandle = (params.handle || '@createur').trim();
  const rawDisplayName = params.name || cleanHandle.replace(/^@/, '');
  const storeName = `Boutique & Académie ${rawDisplayName}`;
  const slug = cleanHandle
    .replace(/^@/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `shop-${effectiveUid.substring(0, 6)}`;

  // 1. Mise à jour du profil utilisateur dans /users/{effectiveUid}
  // Drapeau hasNanasoreStore: true et rôle hybride [user, seller]
  const userDocRef = doc(db, 'users', effectiveUid);
  try {
    await setDoc(
      userDocRef,
      {
        id: effectiveUid,
        uid: effectiveUid,
        name: rawDisplayName,
        storeId: effectiveUid,
        storeName: storeName,
        hasNanasoreStore: true,
        role: ['user', 'seller'],
        roles: ['user', 'seller'],
        sellerMode: 'hybrid_all',
        vendorType: 'hybrid',
        phone: params.phone || auth.currentUser?.phoneNumber || '',
        avatarUrl: params.avatarUrl || auth.currentUser?.photoURL || '',
        wameetHandle: cleanHandle,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (userErr) {
    console.warn('[WAMEET BRIDGE] Erreur update /users/ :', userErr);
  }

  // 2. Initialisation automatique de la collection /nanasore_shops/{effectiveUid}
  const shopDocRef = doc(db, 'nanasore_shops', effectiveUid);
  const shopData: NanasoreShopDocument = {
    id: effectiveUid,
    ownerId: effectiveUid,
    storeName,
    slug,
    ownerHandle: cleanHandle,
    ownerName: rawDisplayName,
    ownerAvatar:
      params.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    ownerPhone: params.phone || auth.currentUser?.phoneNumber || '',
    status: 'active',
    currency: 'XOF',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    productsCount: 0,
    categories: ['E-Commerce', 'Formations Vidéo', 'Produits Physiques', 'Téléchargements'],
    description: `Espace Vendeur & Formateur officiel créé en 1-Clic depuis Wameet pour ${rawDisplayName}.`,
    isVerified: true,
    hasPhysicalProducts: true,
    hasDigitalCourses: true,
    paymentGateways: ['Orange Money', 'Wave', 'Moov Money', 'MTN Money'],
    source: 'wameet_bridge'
  };

  try {
    await setDoc(shopDocRef, shopData, { merge: true });
  } catch (shopErr) {
    console.warn('[WAMEET BRIDGE] Erreur création /nanasore_shops/ :', shopErr);
  }

  // 3. Initialisation de la vitrine /stores/{effectiveUid} (utilisée par le Theme Builder & Master Hub)
  const storeDocRef = doc(db, 'stores', effectiveUid);
  try {
    await setDoc(
      storeDocRef,
      {
        id: effectiveUid,
        userId: effectiveUid,
        storeName,
        activeThemeId: 'theme-neo-afro-noir',
        currency: 'XOF',
        phone: shopData.ownerPhone,
        isListedInDirectory: true,
        source: 'wameet_bridge',
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (storeErr) {
    console.warn('[WAMEET BRIDGE] Erreur synchronisation /stores/ :', storeErr);
  }

  // 4. Persistance locale rapide pour réactivité instantanée de l'UI
  localStorage.setItem(LOCAL_STORAGE_KEY_HAS_STORE, 'true');
  localStorage.setItem(LOCAL_STORAGE_KEY_STORE_ID, effectiveUid);

  return {
    success: true,
    shopId: effectiveUid,
    storeName,
    isNewStore: true,
    shopData
  };
}
