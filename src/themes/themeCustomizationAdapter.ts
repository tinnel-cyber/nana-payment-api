import { ThemeCustomizationConfig } from '../types';

/**
 * Schéma universel standardisé de personnalisation modulaire du Hero au Footer.
 * Compatible avec la structure Firebase SaaS :
 * {
 *   "themeId": "...",
 *   "customization": {
 *     "hero": { "title": "...", "subtitle": "...", "ctaText": "...", "bannerUrl": "..." },
 *     "features": { "title": "...", "subtitle": "...", "items": [...] },
 *     "productsGrid": { "title": "...", "subtitle": "...", "ctaText": "..." },
 *     "footer": { "aboutText": "...", "contactPhone": "...", "copyright": "..." }
 *   }
 * }
 */

export interface ModularHeroConfig {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  bannerUrl?: string;
  description?: string;
  videoUrl?: string;
  priceHighlight?: string;
}

export interface FeatureItemConfig {
  title: string;
  desc?: string;
  icon?: string;
}

export interface ModularFeaturesConfig {
  title?: string;
  subtitle?: string;
  items?: FeatureItemConfig[];
}

export interface ModularProductsGridConfig {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  categoryFilter?: string;
}

export interface ModularFooterConfig {
  aboutText?: string;
  contactPhone?: string;
  copyright?: string;
  address?: string;
  email?: string;
}

export interface UniversalThemeCustomizationSchema {
  themeId?: string;
  customization?: {
    hero?: ModularHeroConfig;
    features?: ModularFeaturesConfig;
    productsGrid?: ModularProductsGridConfig;
    footer?: ModularFooterConfig;
  };
}

/**
 * Normalise et fusionne toute configuration (plate ou imbriquée sous `customization`)
 * en garantissant la disponibilité des deux accès sans aucune régression.
 */
export function normalizeModularCustomization(
  rawConfig: any = {},
  storeConfig: any = {}
): ThemeCustomizationConfig & UniversalThemeCustomizationSchema {
  const custom = rawConfig?.customization || {};

  // Résolution du Hero
  const heroTitle = custom.hero?.title ?? rawConfig?.heroTitle ?? storeConfig?.storeName ?? 'Vitrine Officielle';
  const heroSubtitle = custom.hero?.subtitle ?? rawConfig?.heroSubtitle ?? rawConfig?.heroDescription ?? 'Sélection Exclusive';
  const heroCtaText = custom.hero?.ctaText ?? rawConfig?.heroCtaText ?? 'Découvrir la collection';
  const heroBannerUrl = custom.hero?.bannerUrl ?? rawConfig?.heroBannerImageUrl ?? storeConfig?.bannerImage ?? '';
  const heroDescription = custom.hero?.description ?? rawConfig?.heroDescription ?? storeConfig?.description ?? '';
  const heroVideoUrl = custom.hero?.videoUrl ?? rawConfig?.heroVideoUrl ?? '';
  const heroPriceHighlight = custom.hero?.priceHighlight ?? rawConfig?.heroPriceHighlight ?? '';

  // Résolution des Features / Réassurance
  const featuresTitle = custom.features?.title ?? 'Nos Engagements & Garanties';
  const featuresSubtitle = custom.features?.subtitle ?? 'Commandez en toute sérénité';
  const defaultItems: FeatureItemConfig[] = [
    {
      title: rawConfig?.reassurance1Title ?? 'Livraison Express 24h/48h',
      desc: rawConfig?.reassurance1Desc ?? 'Expédition rapide et sécurisée à domicile ou en point relais',
      icon: 'truck'
    },
    {
      title: rawConfig?.reassurance2Title ?? 'Paiement 100% Sécurisé',
      desc: rawConfig?.reassurance2Desc ?? 'Mobile Money (Wave, Orange, Moov, MTN) & Espèces à la livraison',
      icon: 'shield'
    },
    {
      title: rawConfig?.reassurance3Title ?? 'Service Client VIP 7j/7',
      desc: rawConfig?.reassurance3Desc ?? 'Une équipe dédiée vous accompagne en direct sur WhatsApp',
      icon: 'headphones'
    }
  ];
  const featuresItems = (custom.features?.items && Array.isArray(custom.features.items) && custom.features.items.length > 0)
    ? custom.features.items
    : defaultItems;

  // Résolution de la grille de produits (ProductsGrid)
  const productsGridTitle = custom.productsGrid?.title ?? rawConfig?.catalogTitle ?? 'Articles Phares & Nouveautés';
  const productsGridSubtitle = custom.productsGrid?.subtitle ?? rawConfig?.catalogSubtitle ?? 'Sélection exclusive certifiée et prête à l’expédition';
  const productsGridCtaText = custom.productsGrid?.ctaText ?? 'Commander';

  // Résolution du Footer
  const footerAboutText = custom.footer?.aboutText ?? rawConfig?.footerAboutText ?? storeConfig?.description ?? 'Boutique en ligne officielle certifiée Nanasore SaaS.';
  const footerContactPhone = custom.footer?.contactPhone ?? rawConfig?.whatsappNumber ?? rawConfig?.supportPhone ?? storeConfig?.whatsappPhone ?? '';
  const currentYear = new Date().getFullYear();
  const footerStoreName = rawConfig?.storeName ?? storeConfig?.storeName ?? 'Boutique';
  const footerCopyright = custom.footer?.copyright ?? rawConfig?.copyrightText ?? `© ${currentYear} ${footerStoreName}. Tous droits réservés.`;
  const footerAddress = custom.footer?.address ?? rawConfig?.footerAddress ?? storeConfig?.address ?? 'Afrique de l’Ouest';
  const footerEmail = custom.footer?.email ?? rawConfig?.footerEmail ?? '';

  const normalizedCustomization = {
    hero: {
      title: heroTitle,
      subtitle: heroSubtitle,
      ctaText: heroCtaText,
      bannerUrl: heroBannerUrl,
      description: heroDescription,
      videoUrl: heroVideoUrl,
      priceHighlight: heroPriceHighlight
    },
    features: {
      title: featuresTitle,
      subtitle: featuresSubtitle,
      items: featuresItems
    },
    productsGrid: {
      title: productsGridTitle,
      subtitle: productsGridSubtitle,
      ctaText: productsGridCtaText
    },
    footer: {
      aboutText: footerAboutText,
      contactPhone: footerContactPhone,
      copyright: footerCopyright,
      address: footerAddress,
      email: footerEmail
    }
  };

  return {
    ...rawConfig,
    customization: normalizedCustomization,
    // Rétrocompatibilité totale avec les champs plats existants
    heroTitle,
    heroSubtitle,
    heroCtaText,
    heroBannerImageUrl: heroBannerUrl,
    heroDescription,
    heroVideoUrl,
    heroPriceHighlight,
    catalogTitle: productsGridTitle,
    catalogSubtitle: productsGridSubtitle,
    footerAboutText,
    whatsappNumber: footerContactPhone,
    copyrightText: footerCopyright,
    footerAddress,
    footerEmail,
    reassurance1Title: featuresItems[0]?.title,
    reassurance1Desc: featuresItems[0]?.desc,
    reassurance2Title: featuresItems[1]?.title,
    reassurance2Desc: featuresItems[1]?.desc,
    reassurance3Title: featuresItems[2]?.title,
    reassurance3Desc: featuresItems[2]?.desc
  };
}
