/**
 * Utilitaire de gestion et d'injection sécurisée des pixels publicitaires :
 * - F Pixel
 * - T Pixel
 */

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
  }
}

/**
 * Nettoie et extrait un ID de pixel propre même si l'utilisateur
 * colle un script HTML complet ou un extrait de code.
 */
export function extractCleanPixelId(input: string, type: 'f' | 't' | 'facebook' | 'tiktok'): string {
  if (!input) return '';
  const trimmed = input.trim();

  if (type === 'f' || type === 'facebook') {
    // 1. Si déjà un ID numérique pur
    const pureNumeric = trimmed.match(/^\d{8,22}$/);
    if (pureNumeric) return pureNumeric[0];

    // 2. Recherche dans un appel fbq('init', '...')
    const fbqMatch = trimmed.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/i);
    if (fbqMatch && fbqMatch[1]) return fbqMatch[1];

    // 3. Recherche dans une URL fbevents ?id=...
    const urlMatch = trimmed.match(/[?&]id=(\d+)/i);
    if (urlMatch && urlMatch[1]) return urlMatch[1];

    // 4. Recherche de la plus longue suite de chiffres
    const anyLongDigit = trimmed.match(/\b\d{10,18}\b/);
    if (anyLongDigit) return anyLongDigit[0];
  }

  if (type === 't' || type === 'tiktok') {
    // 1. Si format standard (lettre + chiffres/lettres ex: C1234567890ABCDEF ou code alphanumérique 12-25 car.)
    const pureAlphanum = trimmed.match(/^[A-Za-z0-9_-]{10,25}$/);
    if (pureAlphanum) return pureAlphanum[0];

    // 2. Recherche dans ttq.load('...')
    const ttqMatch = trimmed.match(/ttq\.load\s*\(\s*['"]([A-Za-z0-9_-]+)['"]/i);
    if (ttqMatch && ttqMatch[1]) return ttqMatch[1];

    // 3. Recherche dans script
    const scriptMatch = trimmed.match(/['"]([A-Za-z0-9]{12,22})['"]/);
    if (scriptMatch && scriptMatch[1]) return scriptMatch[1];
  }

  return trimmed;
}

let fbInitialized = false;
let currentFbPixelId = '';

let ttInitialized = false;
let currentTtPixelId = '';

/**
 * Initialise le Pixel F de manière asynchrone et non-bloquante
 */
export function initFPixel(pixelId: string) {
  if (!pixelId || typeof window === 'undefined') return;
  const cleanId = extractCleanPixelId(pixelId, 'f');
  if (!cleanId) return;

  if (fbInitialized && currentFbPixelId === cleanId) {
    return;
  }

  try {
    if (!window.fbq) {
      const fbq: any = function (...args: any[]) {
        if (fbq.callMethod) {
          fbq.callMethod.apply(fbq, args);
        } else {
          fbq.queue.push(args);
        }
      };
      if (!window._fbq) window._fbq = fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = '2.0';
      fbq.queue = [];
      window.fbq = fbq;

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
    }

    window.fbq('init', cleanId);
    window.fbq('track', 'PageView');
    fbInitialized = true;
    currentFbPixelId = cleanId;
    console.log(`[Pixel F] Initialisé avec l'ID: ${cleanId}`);
  } catch (err) {
    console.warn('[Pixel F] Initialisation silencieuse :', err);
  }
}

/**
 * Initialise le Pixel T de manière asynchrone et non-bloquante
 */
export function initTPixel(pixelId: string) {
  if (!pixelId || typeof window === 'undefined') return;
  const cleanId = extractCleanPixelId(pixelId, 't');
  if (!cleanId) return;

  if (ttInitialized && currentTtPixelId === cleanId) {
    return;
  }

  try {
    if (!window.ttq) {
      const ttq: any = [];
      ttq.methods = [
        'page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group',
        'enableCookie', 'disableCookie'
      ];
      ttq.setAndDefer = function (target: any, method: string) {
        target[method] = function (...args: any[]) {
          target.push([method, ...args]);
        };
      };
      for (let i = 0; i < ttq.methods.length; i++) {
        ttq.setAndDefer(ttq, ttq.methods[i]);
      }
      ttq.instance = function (metric: any) {
        const inst = ttq._i[metric] || [];
        for (let j = 0; j < ttq.methods.length; j++) {
          ttq.setAndDefer(inst, ttq.methods[j]);
        }
        return inst;
      };
      ttq.load = function (e: string, n?: any) {
        const s = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        ttq._i = ttq._i || {};
        ttq._i[e] = [];
        ttq._i[e]._u = s;
        ttq._t = ttq._t || {};
        ttq._t[e] = +new Date();
        ttq._o = ttq._o || {};
        ttq._o[e] = n || {};
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = `${s}?sdkid=${e}&lib=ttq`;
        document.head.appendChild(script);
      };
      window.ttq = ttq;
    }

    window.ttq.load(cleanId);
    window.ttq.page();
    ttInitialized = true;
    currentTtPixelId = cleanId;
    console.log(`[Pixel T] Initialisé avec l'ID: ${cleanId}`);
  } catch (err) {
    console.warn('[Pixel T] Initialisation silencieuse :', err);
  }
}

/**
 * Envoie un événement de conversion lors d'un contact ou d'une commande
 */
export function trackPixelConversion(
  eventName: 'ContactW' | 'AddToCart' | 'InitiateCheckout',
  params?: {
    storeName?: string;
    productName?: string;
    value?: number;
    currency?: string;
  }
) {
  try {
    const value = params?.value || 0;
    const currency = params?.currency || 'XOF';

    // 1. F Pixel
    if (typeof window !== 'undefined' && window.fbq) {
      if (eventName === 'ContactW') {
        window.fbq('trackCustom', 'ContactW', {
          store: params?.storeName,
          product: params?.productName,
          value,
          currency
        });
      } else if (eventName === 'AddToCart') {
        window.fbq('track', 'AddToCart', {
          content_name: params?.productName,
          value,
          currency
        });
      } else if (eventName === 'InitiateCheckout') {
        window.fbq('track', 'InitiateCheckout', {
          value,
          currency
        });
      }
    }

    // 2. T Pixel
    if (typeof window !== 'undefined' && window.ttq) {
      if (eventName === 'ContactW') {
        window.ttq.track('Contact', {
          contents: [{ content_name: params?.productName || params?.storeName }],
          value,
          currency
        });
      } else if (eventName === 'AddToCart') {
        window.ttq.track('AddToCart', {
          contents: [{ content_name: params?.productName }],
          value,
          currency
        });
      } else if (eventName === 'InitiateCheckout') {
        window.ttq.track('InitiateCheckout', {
          value,
          currency
        });
      }
    }
  } catch (e) {
    // Non-bloquant
  }
}

export { initFPixel as initFacebookPixel, initTPixel as initTikTokPixel };
