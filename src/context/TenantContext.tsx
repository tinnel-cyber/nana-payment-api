/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contexte Global Multi-Tenant & Marque Blanche (Custom Domains).
 * Gère la détection du nom de domaine, la résolution du Tenant en base de données,
 * et l'isolation étanche de l'espace client (Vitrine ou Tunnel) sans exposition du SaaS Nanasore.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CustomDomainTenant } from '../types';
import { 
  detectCurrentHostname, 
  resolveCustomDomain, 
  isNativeDomain,
  cleanDomain
} from '../services/tenantDomainService';

export interface TenantContextValue {
  /** Indique si le domaine d'accès actuel est un domaine personnalisé client (Marque Blanche externe) */
  isCustomDomain: boolean;
  /** Indique si le domaine d'accès est un domaine natif SaaS Nanasore (*.nanasore.com, localhost, *.web.app) */
  isNative: boolean;
  /** Le hostname résolu ou émulé */
  hostname: string;
  /** Données du tenant résolu depuis Firestore (si domaine client) */
  tenant: CustomDomainTenant | null;
  /** Chargement initial de la résolution du domaine */
  isLoadingTenant: boolean;
  /** Message d'erreur si le domaine personnalisé n'est pas trouvé ou configuré */
  tenantError: string | null;
  /** Rafraîchit manuellement la résolution du tenant */
  refreshTenant: () => Promise<void>;
  /** Met à jour localement les données du tenant dans le contexte */
  setTenantData: (tenant: CustomDomainTenant | null) => void;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export interface TenantProviderProps {
  children: React.ReactNode;
  /** Permet d'injecter un domaine pour les tests ou le rendu côté serveur */
  initialDomain?: string;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children, initialDomain }) => {
  const [hostname, setHostname] = useState<string>(() => {
    if (initialDomain) return cleanDomain(initialDomain);
    return detectCurrentHostname().hostname;
  });

  const [isNative, setIsNative] = useState<boolean>(() => {
    if (initialDomain) return isNativeDomain(initialDomain);
    return detectCurrentHostname().isNative;
  });

  const isCustomDomain = !isNative;

  const [tenant, setTenant] = useState<CustomDomainTenant | null>(() => {
    // Si domaine personnalisé externe, tenter un pré-chargement synchrone depuis le cache local
    if (!isNative && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`nana_resolved_tenant_domain_${hostname}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.storeId || parsed.funnelId || parsed.id)) return parsed;
        }
      } catch {}
    }
    return null;
  });

  const [isLoadingTenant, setIsLoadingTenant] = useState<boolean>(() => {
    if (isNative) return false;
    return true;
  });

  const [tenantError, setTenantError] = useState<string | null>(null);

  // Fonction de résolution Firestore du domaine personnalisé
  const executeResolution = useCallback(async (targetHost: string) => {
    if (isNativeDomain(targetHost)) {
      setIsNative(true);
      setIsLoadingTenant(false);
      setTenant(null);
      setTenantError(null);
      return;
    }

    setIsNative(false);
    setIsLoadingTenant(true);
    setTenantError(null);

    try {
      console.log(`[TENANT CONTEXT] Résolution du domaine personnalisé : ${targetHost}`);
      const resolved = await resolveCustomDomain(targetHost);

      if (resolved) {
        console.log(`[TENANT CONTEXT] Tenant résolu avec succès : ${resolved.storeName} (${resolved.storeId})`);
        setTenant(resolved);
        setTenantError(null);

        // Application de l'identité de marque personnalisée au document HTML
        if (typeof document !== 'undefined') {
          if (resolved.storeName || resolved.schoolName) {
            document.title = resolved.schoolName || resolved.storeName || 'Vitrine Officielle';
          }
          if (resolved.whiteLabel?.customFaviconUrl) {
            let faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
            if (!faviconLink) {
              faviconLink = document.createElement('link');
              faviconLink.rel = 'shortcut icon';
              document.head.appendChild(faviconLink);
            }
            faviconLink.href = resolved.whiteLabel.customFaviconUrl;
          }
        }
      } else {
        console.warn(`[TENANT CONTEXT] Aucun tenant actif associé au domaine : ${targetHost}`);
        setTenant(null);
        setTenantError(`Le nom de domaine "${targetHost}" pointe vers nos serveurs mais n'est associé à aucun tunnel actif.`);
      }
    } catch (err: any) {
      console.error('[TENANT CONTEXT] Erreur de résolution tenant:', err);
      setTenantError(err?.message || 'Erreur lors de la résolution du domaine client.');
    } finally {
      setIsLoadingTenant(false);
    }
  }, []);

  // Détection et résolution au montage
  useEffect(() => {
    const { hostname: detectedHost, isNative: detectedNative } = detectCurrentHostname();
    setHostname(detectedHost);
    setIsNative(detectedNative);

    if (!detectedNative) {
      executeResolution(detectedHost);
    } else {
      setIsLoadingTenant(false);
    }
  }, [executeResolution]);

  const refreshTenant = useCallback(async () => {
    await executeResolution(hostname);
  }, [executeResolution, hostname]);

  const setTenantData = useCallback((newTenant: CustomDomainTenant | null) => {
    setTenant(newTenant);
  }, []);

  const value = useMemo<TenantContextValue>(() => ({
    isCustomDomain,
    isNative,
    hostname,
    tenant,
    isLoadingTenant,
    tenantError,
    refreshTenant,
    setTenantData,
  }), [isCustomDomain, isNative, hostname, tenant, isLoadingTenant, tenantError, refreshTenant, setTenantData]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

/**
 * Hook d'accès direct au contexte Multi-Tenant
 */
export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    // Secours gracieux si appelé hors du Provider
    const { hostname, isNative, isCustom } = detectCurrentHostname();
    return {
      isCustomDomain: isCustom,
      isNative,
      hostname,
      tenant: null,
      isLoadingTenant: false,
      tenantError: null,
      refreshTenant: async () => {},
      setTenantData: () => {},
    };
  }
  return context;
}
