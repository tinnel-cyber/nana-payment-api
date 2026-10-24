/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contexte Global d'Authentification & Feature Gating Monétisation.
 * Contrôle l'accès aux fonctionnalités d'Intelligence Artificielle (Image, Avatar Vidéo, Correction IA)
 * selon le forfait de l'utilisateur (user.plan).
 */

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { StoreUser, StoreSubscription } from '../types';
import { 
  normalizePlanId, 
  triggerUpsellModal, 
  UpsellTriggerDetail, 
  ProFeatureKey,
  PRO_FEATURES_CATALOG
} from '../utils/planFeatures';
import { isSuperAdminLocally } from '../services/superAdminService';

export type PlanId = 'free' | 'starter' | 'pro' | 'elite';

export const PLAN_HIERARCHY: Record<PlanId, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  elite: 3,
};

export interface PremiumActionOptions {
  requiredPlan?: PlanId;
  featureType?: 'IMAGE' | 'AVATAR' | 'CORRECTION' | 'DESCRIPTION' | 'STUDIO' | 'TEXT' | string;
  featureName?: string;
  featureKey?: ProFeatureKey;
  customTitle?: string;
  customMessage?: string;
}

export interface AuthContextValue {
  user: StoreUser | null;
  subscription: StoreSubscription | null;
  plan: PlanId;
  isFree: boolean;
  isStarter: boolean;
  isPro: boolean;
  isElite: boolean;
  isPremium: boolean; // pro or elite
  hasRequiredPlan: (requiredPlan?: PlanId) => boolean;
  handlePremiumAction: (
    requiredPlanOrOptions: PlanId | PremiumActionOptions,
    action: () => void,
    optionsFallback?: PremiumActionOptions
  ) => void;
  triggerUpsell: (detail: UpsellTriggerDetail) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Lit le plan utilisateur de façon fiable depuis le stockage local (secours global)
 */
export function getGlobalUserPlan(): PlanId {
  if (isSuperAdminLocally()) return 'elite';
  try {
    if (typeof window === 'undefined') return 'free';
    const savedSub = localStorage.getItem('nana_store_sub');
    if (savedSub) {
      const parsed = JSON.parse(savedSub) as StoreSubscription;
      return normalizePlanId(parsed) as PlanId;
    }
    const savedUser = localStorage.getItem('nana_store_auth_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser) as StoreUser;
      if (parsedUser.subscription) return normalizePlanId(parsedUser.subscription) as PlanId;
      if (parsedUser.plan) return normalizePlanId({ plan: parsedUser.plan } as any) as PlanId;
    }
  } catch {
    // Ignore parsing errors
  }
  return 'free';
}

/**
 * Vérifie si un plan donné a un niveau suffisant
 */
export function checkPlanAccess(userPlan: PlanId, requiredPlan: PlanId = 'pro'): boolean {
  if (isSuperAdminLocally()) return true;
  const currentLevel = PLAN_HIERARCHY[userPlan] ?? 0;
  const targetLevel = PLAN_HIERARCHY[requiredPlan] ?? 2;
  return currentLevel >= targetLevel;
}

/**
 * Fonction autonome de feature gating pour intercepter les actions premium n'importe où
 */
export function executePremiumAction(
  userPlan: PlanId,
  requiredPlanOrOptions: PlanId | PremiumActionOptions,
  action: () => void,
  optionsFallback?: PremiumActionOptions
) {
  if (isSuperAdminLocally()) {
    action();
    return;
  }
  let requiredPlan: PlanId = 'pro';
  let options: PremiumActionOptions = {};

  if (typeof requiredPlanOrOptions === 'string') {
    requiredPlan = requiredPlanOrOptions;
    options = optionsFallback || {};
  } else if (requiredPlanOrOptions && typeof requiredPlanOrOptions === 'object') {
    requiredPlan = requiredPlanOrOptions.requiredPlan || 'pro';
    options = requiredPlanOrOptions;
  }

  const hasAccess = checkPlanAccess(userPlan, requiredPlan);

  if (hasAccess) {
    action();
    return;
  }

  // Blocage : Déclenchement de la modale d'Upsell
  const featureType = options.featureType || 'FEATURE';
  const featureName = options.featureName || 
    (options.featureKey ? PRO_FEATURES_CATALOG[options.featureKey]?.label : 'Fonctionnalité IA Premium');

  const defaultTitle = 
    options.customTitle ||
    (featureType === 'AVATAR' ? 'Débloquez les Avatars Vidéo IA 👑' :
     featureType === 'IMAGE' ? 'Créez vos Images Produits avec l\'IA 👑' :
     featureType === 'CORRECTION' ? 'Activez la Correction Automatique IA Elite 👑' :
     featureType === 'DESCRIPTION' ? 'Rédigez vos Descriptions avec l\'IA 👑' :
     'Débloquez la puissance de l\'IA 👑');

  const defaultMessage = 
    options.customMessage ||
    `Cette fonctionnalité (${featureName}) est incluse dans nos plans Premium. Gagnez des heures de travail chaque semaine en laissant notre Intelligence Artificielle travailler pour vous.`;

  triggerUpsellModal({
    mode: 'FEATURE_LOCKED',
    featureKey: options.featureKey,
    featureLabel: featureName,
    recommendedPlan: requiredPlan === 'starter' ? 'starter' : 'pro',
    customTitle: defaultTitle,
    customMessage: defaultMessage
  });
}

export interface AuthProviderProps {
  children: React.ReactNode;
  user: StoreUser | null;
  subscription: StoreSubscription | null;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  user,
  subscription,
}) => {
  const plan: PlanId = useMemo(() => {
    if (subscription) {
      return normalizePlanId(subscription) as PlanId;
    }
    if (user?.subscription) {
      return normalizePlanId(user.subscription) as PlanId;
    }
    if (user?.plan) {
      return normalizePlanId({ plan: user.plan } as any) as PlanId;
    }
    return getGlobalUserPlan();
  }, [subscription, user]);

  const isFree = plan === 'free';
  const isStarter = plan === 'starter';
  const isPro = plan === 'pro';
  const isElite = plan === 'elite';
  const isPremium = plan === 'pro' || plan === 'elite';

  const hasRequiredPlan = useCallback((requiredPlan: PlanId = 'pro') => {
    return checkPlanAccess(plan, requiredPlan);
  }, [plan]);

  const handlePremiumAction = useCallback((
    requiredPlanOrOptions: PlanId | PremiumActionOptions,
    action: () => void,
    optionsFallback?: PremiumActionOptions
  ) => {
    executePremiumAction(plan, requiredPlanOrOptions, action, optionsFallback);
  }, [plan]);

  const triggerUpsell = useCallback((detail: UpsellTriggerDetail) => {
    triggerUpsellModal(detail);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    subscription,
    plan,
    isFree,
    isStarter,
    isPro,
    isElite,
    isPremium,
    hasRequiredPlan,
    handlePremiumAction,
    triggerUpsell,
  }), [user, subscription, plan, isFree, isStarter, isPro, isElite, isPremium, hasRequiredPlan, handlePremiumAction, triggerUpsell]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook d'accès sécurisé à l'authentification et aux droits SaaS
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context) return context;

  // Secours si invoqué hors du Provider
  const fallbackPlan = getGlobalUserPlan();
  return {
    user: null,
    subscription: null,
    plan: fallbackPlan,
    isFree: fallbackPlan === 'free',
    isStarter: fallbackPlan === 'starter',
    isPro: fallbackPlan === 'pro',
    isElite: fallbackPlan === 'elite',
    isPremium: fallbackPlan === 'pro' || fallbackPlan === 'elite',
    hasRequiredPlan: (requiredPlan: PlanId = 'pro') => checkPlanAccess(fallbackPlan, requiredPlan),
    handlePremiumAction: (req, act, opt) => executePremiumAction(fallbackPlan, req, act, opt),
    triggerUpsell: (detail) => triggerUpsellModal(detail),
  };
}

/**
 * Détermine la route de redirection appropriée post-connexion / inscription :
 * - Si l'utilisateur vient de /nana-switch/auth -> /nana-switch/overview
 * - S'il est Formateur (creator_trainer) ou Commerçant (merchant_ecommerce / hybrid_all) -> /dashboard (Tableau de Bord Caméléon)
 * JAMAIS vers la caisse physique (POS) par défaut !
 */
export function getPostAuthRedirectRoute(user?: StoreUser | null, fromPath?: string): string {
  const currentPath = fromPath || (typeof window !== 'undefined' ? window.location.pathname : '');
  if (currentPath.startsWith('/nana-switch/auth') || currentPath.startsWith('/nanaswitch/auth')) {
    return '/nana-switch/overview';
  }
  if (!user) return '/dashboard';
  return '/dashboard';
}

/**
 * Hook spécifique de Feature Gating pour la monétisation
 */
export function useFeatureGate() {
  const auth = useAuth();
  return {
    userPlan: auth.plan,
    isPremium: auth.isPremium,
    isFree: auth.isFree,
    hasRequiredPlan: auth.hasRequiredPlan,
    handlePremiumAction: auth.handlePremiumAction,
    triggerUpsell: auth.triggerUpsell,
  };
}

