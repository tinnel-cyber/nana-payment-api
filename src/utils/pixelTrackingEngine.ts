/**
 * Moteur Universel de Tracking des Pixels Publicitaires Nanasore™
 * Support : F Pixel, T Pixel & Google Tag (Ads / GA4)
 * Conçu pour une exécution ultra-rapide (0ms), 100% résiliente aux bloqueurs de pub (ad-blockers)
 */

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
    gtag?: any;
    dataLayer?: any[];
    __nana_meta_injected?: boolean;
    __nana_t_injected?: boolean;
    __nana_tiktok_injected?: boolean;
    __nana_google_injected?: boolean;
  }
}

export interface PixelConfigOptions {
  metaPixelId?: string;
  tPixelId?: string;
  tiktokPixelId?: string;
  googleTagId?: string;
}

export interface TrackableProduct {
  id?: string;
  name?: string;
  price?: number;
  category?: string;
  slug?: string;
  [key: string]: any;
}

export interface TrackableOrder {
  orderId: string;
  total: number;
  subtotal?: number;
  currency?: string;
  items?: Array<{
    id?: string;
    name?: string;
    price?: number;
    quantity?: number;
    category?: string;
  }>;
}

/**
 * Initialise dynamiquement les scripts des pixels configurés par le vendeur.
 * Sécurisé contre les doublons d'injection et tolérant aux erreurs réseau.
 */
export const initPixels = (config?: PixelConfigOptions): void => {
  if (typeof window === 'undefined' || !config) return;

  const { metaPixelId, googleTagId } = config;
  const tPixelId = config.tPixelId || config.tiktokPixelId;

  // 1. Inoculation F Pixel
  if (metaPixelId && metaPixelId.trim() && !window.__nana_meta_injected) {
    try {
      const cleanId = metaPixelId.trim();
      /* eslint-disable */
      (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        if (s && s.parentNode) s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */

      if (window.fbq) {
        window.fbq('init', cleanId);
        window.fbq('track', 'PageView');
        window.__nana_meta_injected = true;
      }
    } catch {
      // Ad-blocker pass-through
    }
  }

  // 2. Inoculation T Pixel
  if (tPixelId && tPixelId.trim() && !window.__nana_t_injected && !window.__nana_tiktok_injected) {
    try {
      const cleanTtId = tPixelId.trim();
      /* eslint-disable */
      (function (w: any, d: any, t: any) {
        w.TiktokAnalyticsObject = t;
        var ttq = (w[t] = w[t] || []);
        ttq.methods = [
          'page',
          'track',
          'identify',
          'instances',
          'debug',
          'on',
          'off',
          'once',
          'ready',
          'alias',
          'group',
          'enableCookie',
          'disableCookie'
        ];
        ttq.setAndDefer = function (t: any, e: any) {
          t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          };
        };
        for (var i = 0; i < ttq.methods.length; i++) {
          ttq.setAndDefer(ttq, ttq.methods[i]);
        }
        ttq.instance = function (t: any) {
          for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) {
            ttq.setAndDefer(e, ttq.methods[n]);
          }
          return e;
        };
        ttq.load = function (e: any, n: any) {
          var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
          ttq._i = ttq._i || {};
          ttq._i[e] = [];
          ttq._i[e]._u = i;
          ttq._t = ttq._t || {};
          ttq._t[e] = +new Date();
          ttq._o = ttq._o || {};
          ttq._o[e] = n || {};
          var o = document.createElement('script');
          o.type = 'text/javascript';
          o.async = !0;
          o.src = i + '?sdkid=' + e + '&lib=' + t;
          var a = document.getElementsByTagName('script')[0];
          if (a && a.parentNode) a.parentNode.insertBefore(o, a);
        };
        ttq.load(cleanTtId);
        ttq.page();
      })(window, document, 'ttq');
      /* eslint-enable */

      window.__nana_t_injected = true;
      window.__nana_tiktok_injected = true;
    } catch {
      // Ad-blocker pass-through
    }
  }

  // 3. Inoculation Google Tag (GA4 / Google Ads)
  if (googleTagId && googleTagId.trim() && !window.__nana_google_injected) {
    try {
      const cleanGId = googleTagId.trim();
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${cleanGId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer?.push(arguments);
      }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', cleanGId);
      window.__nana_google_injected = true;
    } catch {
      // Ad-blocker pass-through
    }
  }
};

/**
 * 1. Événement : Consultation de Fiche Produit (ViewContent)
 * Déclenché dès le montage du composant PDP
 */
export const trackViewContent = (product: TrackableProduct): void => {
  if (typeof window === 'undefined' || !product) return;

  const prodId = product.id || product.slug || 'product';
  const prodName = product.name || 'Produit';
  const prodPrice = Number(product.price) || 0;
  const prodCategory = product.category || 'Général';

  // F Pixel
  try {
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: prodName,
        content_ids: [prodId],
        content_type: 'product',
        value: prodPrice,
        currency: 'XOF',
        content_category: prodCategory
      });
    }
  } catch {}

  // T Pixel
  try {
    if (window.ttq && typeof window.ttq.track === 'function') {
      window.ttq.track('ViewContent', {
        content_id: prodId,
        content_name: prodName,
        content_type: 'product',
        value: prodPrice,
        currency: 'XOF'
      });
    }
  } catch {}

  // Google Tag
  try {
    if (window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'XOF',
        value: prodPrice,
        items: [
          {
            item_id: prodId,
            item_name: prodName,
            item_category: prodCategory,
            price: prodPrice
          }
        ]
      });
    }
  } catch {}

  // Notification d'événement local pour debug / Studio
  try {
    window.dispatchEvent(
      new CustomEvent('nana:pixel_event', {
        detail: { event: 'ViewContent', product: prodName, price: prodPrice }
      })
    );
  } catch {}
};

/**
 * 2. Événement : Lancement du Tunnel de Commande (InitiateCheckout)
 * Déclenché dès que le visiteur clique sur ⚡ Voir Tunnel & Acheter ou initie la commande
 */
export const trackInitiateCheckout = (
  product: TrackableProduct,
  source: 'tunnel' | 'cart' = 'tunnel'
): void => {
  if (typeof window === 'undefined' || !product) return;

  const prodId = product.id || product.slug || 'product';
  const prodName = product.name || 'Produit';
  const prodPrice = Number(product.price) || 0;

  // F Pixel
  try {
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_name: prodName,
        content_ids: [prodId],
        content_type: 'product',
        value: prodPrice,
        currency: 'XOF',
        num_items: 1,
        checkout_source: source
      });
    }
  } catch {}

  // T Pixel
  try {
    if (window.ttq && typeof window.ttq.track === 'function') {
      window.ttq.track('InitiateCheckout', {
        content_id: prodId,
        content_name: prodName,
        value: prodPrice,
        currency: 'XOF'
      });
    }
  } catch {}

  // Google Tag
  try {
    if (window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'XOF',
        value: prodPrice,
        items: [
          {
            item_id: prodId,
            item_name: prodName,
            price: prodPrice
          }
        ]
      });
    }
  } catch {}

  try {
    window.dispatchEvent(
      new CustomEvent('nana:pixel_event', {
        detail: { event: 'InitiateCheckout', product: prodName, source }
      })
    );
  } catch {}
};

/**
 * 3. Événement : Prospect Qualifié Wameet (Lead / Contact)
 * Déclenché dès que le visiteur clique sur Acheter via Wameet Direct
 */
export const trackWLead = (
  product: TrackableProduct,
  totalAmount?: number
): void => {
  if (typeof window === 'undefined' || !product) return;

  const prodId = product.id || product.slug || 'product';
  const prodName = product.name || 'Produit';
  const effectivePrice = Number(totalAmount) || Number(product.price) || 0;

  // F Pixel
  try {
    if (window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: prodName,
        content_ids: [prodId],
        content_category: 'Wameet',
        value: effectivePrice,
        currency: 'XOF'
      });
    }
  } catch {}

  // T Pixel
  try {
    if (window.ttq && typeof window.ttq.track === 'function') {
      window.ttq.track('Contact', {
        content_id: prodId,
        content_name: prodName,
        value: effectivePrice,
        currency: 'XOF'
      });
    }
  } catch {}

  // Google Tag
  try {
    if (window.gtag) {
      window.gtag('event', 'generate_lead', {
        currency: 'XOF',
        value: effectivePrice,
        lead_type: 'w'
      });
    }
  } catch {}

  try {
    window.dispatchEvent(
      new CustomEvent('nana:pixel_event', {
        detail: { event: 'WLead', product: prodName, value: effectivePrice }
      })
    );
  } catch {}
};

/**
 * 4. Événement : Commande Finalisée (Purchase / CompletePayment)
 * Déclenché dès la validation de la commande dans le panier ou tunnel
 */
export const trackPurchase = (orderData: TrackableOrder): void => {
  if (typeof window === 'undefined' || !orderData) return;

  const orderId = orderData.orderId || `CMD-${Date.now().toString().slice(-6)}`;
  const total = Number(orderData.total) || 0;
  const items = orderData.items || [];

  // F Pixel
  try {
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        value: total,
        currency: 'XOF',
        order_id: orderId,
        num_items: items.length || 1,
        content_type: 'product'
      });
    }
  } catch {}

  // T Pixel
  try {
    if (window.ttq && typeof window.ttq.track === 'function') {
      window.ttq.track('CompletePayment', {
        content_id: orderId,
        value: total,
        currency: 'XOF'
      });
    }
  } catch {}

  // Google Tag
  try {
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: orderId,
        value: total,
        currency: 'XOF',
        items: items.map(i => ({
          item_id: i.id || i.name,
          item_name: i.name,
          price: i.price,
          quantity: i.quantity || 1
        }))
      });
    }
  } catch {}

  try {
    window.dispatchEvent(
      new CustomEvent('nana:pixel_event', {
        detail: { event: 'Purchase', orderId, total }
      })
    );
  } catch {}
};

/**
 * Vérifie si au moins un Pixel est renseigné dans la configuration
 */
export const arePixelsConfigured = (config?: PixelConfigOptions): boolean => {
  if (!config) return false;
  const tPixelId = config.tPixelId || config.tiktokPixelId;
  return Boolean(
    (config.metaPixelId && config.metaPixelId.trim().length > 0) ||
    (tPixelId && tPixelId.trim().length > 0) ||
    (config.googleTagId && config.googleTagId.trim().length > 0)
  );
};
