/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Service d'injection dynamique des métadonnées SEO et Open Graph (DOM Head)
 * Compatible WhatsApp, Facebook, LinkedIn, Twitter/X, Telegram et Googlebot.
 */

export interface FunnelSeoMetadata {
  title: string;
  description: string;
  imageUrl?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  price?: number | string | null;
  currency?: string;
  siteName?: string;
  brandColor?: string;
}

/**
 * Injecte dynamiquement les balises Meta Open Graph et Twitter Cards dans le <head> du document.
 * Permet aux partages directs et onglets du navigateur d'afficher la fiche exacte du tunnel.
 */
export function injectFunnelSeoMeta(meta: FunnelSeoMetadata): () => void {
  if (typeof document === 'undefined') return () => {};

  const previousTitle = document.title;
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://nsore.shop';
  const fullUrl = meta.url || (typeof window !== 'undefined' ? window.location.href : currentOrigin);

  // 1. Mise à jour du titre
  if (meta.title) {
    document.title = meta.title;
  }

  // Helper pour insérer ou mettre à jour un tag meta
  const setMeta = (attribute: string, attrValue: string, content: string | undefined | null) => {
    if (!content) return;
    let el = document.querySelector(`meta[${attribute}="${attrValue}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attribute, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 2. Balise Canonique
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', fullUrl);

  // 3. Métadonnées SEO de base
  setMeta('name', 'description', meta.description);
  setMeta('name', 'robots', 'index, follow');

  // 4. Open Graph (Facebook, WhatsApp, LinkedIn, Telegram)
  setMeta('property', 'og:site_name', meta.siteName || 'Nanasore Funnels');
  setMeta('property', 'og:type', meta.type || 'product');
  setMeta('property', 'og:url', fullUrl);
  setMeta('property', 'og:title', meta.title);
  setMeta('property', 'og:description', meta.description);

  if (meta.imageUrl) {
    setMeta('property', 'og:image', meta.imageUrl);
    setMeta('property', 'og:image:secure_url', meta.imageUrl);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:image:alt', meta.title);
  }

  // Balises prix produit e-commerce
  if (meta.price) {
    setMeta('property', 'product:price:amount', String(meta.price));
    setMeta('property', 'product:price:currency', meta.currency || 'XOF');
  }

  // 5. Twitter / X Cards
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', meta.title);
  setMeta('name', 'twitter:description', meta.description);
  if (meta.imageUrl) {
    setMeta('name', 'twitter:image', meta.imageUrl);
    setMeta('name', 'twitter:image:alt', meta.title);
  }

  // Restauration propre lors du démontage du composant
  return () => {
    if (typeof document !== 'undefined') {
      document.title = previousTitle;
    }
  };
}
