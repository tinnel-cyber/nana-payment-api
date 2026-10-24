import { useEffect } from 'react';

export interface SeoMetaOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article' | 'profile';
  price?: string | number;
  currency?: string;
  siteName?: string;
}

const DEFAULT_TITLE = 'Nanasore - Votre plateforme E-commerce & E-learning';
const DEFAULT_DESC =
  'Créez votre propre plateforme e-commerce ou campus e-learning en marque blanche. Lancez votre business en ligne sans écrire de code et encaissez via Mobile Money.';
const DEFAULT_IMAGE = 'https://nsore.shop/assets/og-nanasore.jpg';
const DEFAULT_DOMAIN = 'https://nsore.shop';

/**
 * Utilitaire pour créer ou mettre à jour une balise <meta>
 */
function updateOrCreateMetaTag(
  attributeName: 'name' | 'property',
  attributeValue: string,
  content: string
) {
  if (typeof document === 'undefined') return;

  let element = document.querySelector<HTMLMetaElement>(
    `meta[${attributeName}="${attributeValue}"]`
  );

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

/**
 * Utilitaire pour créer ou mettre à jour une balise <link rel="...">
 */
function updateOrCreateLinkTag(rel: string, href: string) {
  if (typeof document === 'undefined') return;

  let element = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
}

/**
 * Hook personnalisé useSeoMeta
 * Met à jour le <head> du navigateur à chaque changement d'état ou de page (SPA)
 */
export function useSeoMeta(options: SeoMetaOptions) {
  const {
    title,
    description,
    image,
    url,
    type = 'website',
    price,
    currency = 'XOF',
    siteName = 'Nanasore',
  } = options;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // 1. Titre de la page
    const finalTitle = title ? `${title}` : DEFAULT_TITLE;
    document.title = finalTitle;

    // 2. Meta Description classique
    const finalDesc = description || DEFAULT_DESC;
    updateOrCreateMetaTag('name', 'description', finalDesc);

    // 3. URL Canonique
    const finalUrl = url || (window.location.origin ? window.location.href : DEFAULT_DOMAIN);
    updateOrCreateLinkTag('canonical', finalUrl);

    // 4. Balises Open Graph (Facebook, WhatsApp, LinkedIn)
    updateOrCreateMetaTag('property', 'og:site_name', siteName);
    updateOrCreateMetaTag('property', 'og:type', type);
    updateOrCreateMetaTag('property', 'og:title', finalTitle);
    updateOrCreateMetaTag('property', 'og:description', finalDesc);
    updateOrCreateMetaTag('property', 'og:url', finalUrl);

    const finalImage = image && image.startsWith('http') ? image : DEFAULT_IMAGE;
    updateOrCreateMetaTag('property', 'og:image', finalImage);
    updateOrCreateMetaTag('property', 'og:image:secure_url', finalImage);
    updateOrCreateMetaTag('property', 'og:image:width', '1200');
    updateOrCreateMetaTag('property', 'og:image:height', '630');

    // Prix spécifique pour fiches produits (Open Graph Product)
    if (price !== undefined && price !== null && price !== '') {
      updateOrCreateMetaTag('property', 'product:price:amount', String(price));
      updateOrCreateMetaTag('property', 'product:price:currency', currency);
    }

    // 5. Twitter / X Cards
    updateOrCreateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateOrCreateMetaTag('name', 'twitter:title', finalTitle);
    updateOrCreateMetaTag('name', 'twitter:description', finalDesc);
    updateOrCreateMetaTag('name', 'twitter:image', finalImage);
    updateOrCreateMetaTag('name', 'twitter:url', finalUrl);
  }, [title, description, image, url, type, price, currency, siteName]);
}
