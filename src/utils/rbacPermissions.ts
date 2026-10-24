import { StoreUser } from '../types';

export type RbacRole = 'CLIENT' | 'MERCHANT' | 'SUPER_ADMIN';

export interface UserContext {
  userId?: string;
  storeId?: string;
  role: RbacRole;
  email?: string;
}

/**
 * Résout le contexte utilisateur et son rôle RBAC pour un magasin donné.
 * - Si l'utilisateur n'est pas connecté ou consulte une autre boutique : CLIENT (Lecture seule)
 * - Si l'utilisateur est le gérant/employé du magasin ciblé : MERCHANT (Lecture & Écriture)
 * - Si SUPER_ADMIN : SUPER_ADMIN (Accès universel)
 */
export const resolveUserContext = (
  currentUser?: StoreUser | null,
  activeStoreId?: string
): UserContext => {
  if (!currentUser) {
    return { role: 'CLIENT' };
  }

  if (currentUser.role === 'SUPER_ADMIN') {
    return {
      userId: currentUser.id,
      storeId: activeStoreId || currentUser.storeId,
      role: 'SUPER_ADMIN',
      email: currentUser.email,
    };
  }

  // Si l'utilisateur connecté appartient au magasin ciblé
  const userStoreId = currentUser.storeId;
  const isOwnerOrStaff = !activeStoreId || activeStoreId === userStoreId;

  if (isOwnerOrStaff && (currentUser.role === 'GERANT' || currentUser.role === 'ADMIN' || currentUser.role === 'EMPLOYE' || (currentUser.role as any) === 'demo' || (currentUser.role as any) === 'TENANT_MANAGER')) {
    return {
      userId: currentUser.id,
      storeId: userStoreId,
      role: 'MERCHANT',
      email: currentUser.email,
    };
  }

  // Si connecté mais visite la boutique d'un autre commerçant
  return {
    userId: currentUser.id,
    role: 'CLIENT',
    email: currentUser.email,
  };
};

/**
 * Vérifie si l'utilisateur a la permission de modifier un produit.
 */
export const canEditProduct = (
  user: UserContext | null,
  productStoreId?: string
): boolean => {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.role === 'MERCHANT') {
    if (!productStoreId || !user.storeId) return true;
    return user.storeId === productStoreId;
  }
  return false;
};

/**
 * Vérifie si l'utilisateur a la permission de supprimer un produit.
 */
export const canDeleteProduct = (
  user: UserContext | null,
  productStoreId?: string
): boolean => {
  return canEditProduct(user, productStoreId);
};

/**
 * Vérifie si l'utilisateur a la permission de configurer la boutique
 * (ajouter un produit, modifier les coordonnées, changer bannières et logos).
 */
export const canConfigureStore = (
  user: UserContext | null,
  targetStoreId?: string
): boolean => {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.role === 'MERCHANT') {
    if (!targetStoreId || !user.storeId) return true;
    return user.storeId === targetStoreId;
  }
  return false;
};
