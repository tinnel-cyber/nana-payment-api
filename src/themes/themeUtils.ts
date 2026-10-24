import { useState, useEffect } from 'react';
import { extractPublicStoreRouteParams } from '../utils/themeRoutePrefix';
import { resolveProductFunnelEngine } from '../services/omniFunnelService';

/**
 * Déclencheur universel d'ouverture de tunnel dans le tiroir dépliable.
 * Règle d'or de priorité (Priority Resolution Order) :
 * - Étape 1 (Priorité 1 - Obligatoire) : Funnel Builder Modulaire à 12 blocs ('t')
 * - Étape 2 (Priorité 2 - Conditionnelle) : Ultimate Funnel ('f') UNIQUEMENT si pas de 12 blocs ET useUltimateFunnel === true
 */
export const triggerOpenFunnel = (funnelId: string, title?: string, product?: any) => {
  if (typeof window !== 'undefined') {
    const raw = (funnelId || product?.linkedFunnelId || product?.id || '').trim();
    const cleanSlug = raw.replace(/^(?:[fct][\/-]|funnel-|tunnel-)/i, '');
    const resolvedEngine = resolveProductFunnelEngine(
      product || raw,
      /^c[\/-]/i.test(raw) ? 'c' : /^f[\/-]/i.test(raw) ? 'f' : 't'
    );
    const effectiveFunnelId = cleanSlug ? `${resolvedEngine}-${cleanSlug}` : raw;
    window.dispatchEvent(
      new CustomEvent('nana:open_funnel', {
        detail: {
          funnelId: effectiveFunnelId,
          title: title || product?.name,
          product: product || null,
          resolvedEngine
        }
      })
    );
  }
};

/**
 * Extraction déclarative des slugs depuis l'URL courante
 */
export function useParams<T extends Record<string, string | undefined>>(): T {
  if (typeof window === 'undefined') return {} as T;
  const pathname = window.location.pathname;
  const parsed = extractPublicStoreRouteParams(pathname);

  let storeSlug = parsed.storeIdFromPath || undefined;
  let productSlug = parsed.productIdFromPath || undefined;

  // Fallback paramètre d'URL ?store=... / ?shop=...
  if (!storeSlug) {
    const params = new URLSearchParams(window.location.search);
    const qStore = params.get('store') || params.get('storeId') || params.get('shop') || params.get('boutique');
    if (qStore) storeSlug = qStore;
    const qProd = params.get('produit') || params.get('product') || params.get('p');
    if (qProd) productSlug = qProd;
  }

  return { storeSlug, productSlug, themePrefix: parsed.themePrefix || undefined } as unknown as T;
}

/**
 * Extraction réactive des paramètres de recherche URL (?searchParams)
 */
export function useSearchParams(): [URLSearchParams, (params: URLSearchParams) => void] {
  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    return typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  });

  useEffect(() => {
    const handlePop = () => {
      setSearchParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  return [searchParams, setSearchParams];
}
