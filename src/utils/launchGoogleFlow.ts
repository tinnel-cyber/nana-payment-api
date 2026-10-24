/**
 * Service de lancement In-App du Studio Vidéo IA (Google Flow)
 * Utilise Chrome Custom Tabs (Android) / Safari View Controller (iOS) / InAppBrowser
 * avec maintien du thème #0d1527, bouton de fermeture ✕ et persistance de session Google.
 */
import { Browser } from '@capacitor/browser';

export interface GoogleFlowToastDetail {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning';
  duration?: number;
  promptCopied?: string;
  productName?: string;
}

export const FLOW_STUDIO_URL = 'https://labs.google/flow';

/**
 * Construit un prompt marketing vidéo cinématique ciblé pour un produit
 */
export const buildProductVideoPrompt = (productName: string): string => {
  return `Publicité vidéo commerciale haut de gamme pour ${productName}, détails précis, éclairage cinématique 4K, 60fps, ambiance studio professionnelle.`;
};

/**
 * Émet l'événement pour afficher le toast flottant d'accompagnement
 */
export const showGoogleFlowToast = (detail: GoogleFlowToastDetail) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<GoogleFlowToastDetail>('nana_show_flow_toast', { detail })
    );
  }
};

/**
 * Lanceur In-App Browser (Chrome Custom Tabs sur Android / Safari View Controller sur iOS)
 * - Maintient la couleur de barre supérieure de l'app (#0d1527)
 * - Affiche le bouton de fermeture propre (✕)
 * - Conserve les cookies de session Google pour éviter toute reconnexion
 */
export const openFlowInApp = async (flowUrl: string = FLOW_STUDIO_URL): Promise<void> => {
  // 1. Vérification si exécution dans un conteneur natif (Capacitor / Cordova / React Native)
  const isCapacitor = typeof window !== 'undefined' && (window as any)?.Capacitor?.isNativePlatform?.();
  const isCordova = typeof window !== 'undefined' && (window as any)?.cordova;

  if (isCapacitor || isCordova) {
    try {
      // Plugin Capacitor Browser officiel (Chrome Custom Tabs sur Android / SFSafariViewController sur iOS)
      await Browser.open({
        url: flowUrl,
        presentationStyle: 'popover',
        toolbarColor: '#0d1527',
        windowName: '_blank'
      });
      return;
    } catch (e) {
      console.warn('Native browser plugin unavailable, falling back:', e);
    }

    // Support InAppBrowser Cordova si présent
    if (isCordova && (window as any).cordova?.InAppBrowser) {
      try {
        (window as any).cordova.InAppBrowser.open(
          flowUrl,
          '_blank',
          'location=yes,toolbarcolor=#0d1527,navigationbuttoncolor=#ffffff,closebuttoncaption=✕,closebuttoncolor=#ffffff,fullscreen=no'
        );
        return;
      } catch (cordovaErr) {
        console.warn('Cordova InAppBrowser error, falling back:', cordovaErr);
      }
    }
  }

  // 2. Fallback pour PWA installée / Navigateur Mobile / Desktop
  // Utilise les options In-App si le navigateur le supporte ou ouvre un onglet ciblé
  try {
    const isStandalonePwa =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone);

    if (isStandalonePwa) {
      // En mode PWA autonome, window.open ouvre un Chrome Custom Tab système scoped
      window.open(flowUrl, '_blank', 'noopener,noreferrer,toolbar=yes,location=yes');
    } else {
      window.open(flowUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (err) {
    console.warn('Fallback window.open error:', err);
    window.location.href = flowUrl;
  }
};

/**
 * Déclenche le flux complet :
 * 1. Copie automatique du prompt marketing dans le presse-papiers
 * 2. Ouverture In-App Browser (Chrome Custom Tabs / Safari View Controller)
 * 3. Notification Toast visuelle non intrusive avec instructions
 */
export const handleLaunchGoogleFlow = async (customPrompt?: string, productName?: string): Promise<void> => {
  const defaultPrompt =
    customPrompt ||
    'Spot publicitaire produit professionnel ultra-réaliste, éclairage studio 4K, présentation commerciale dynamique.';

  // 1. Copie automatique du prompt avec fallback robuste
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(defaultPrompt);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = defaultPrompt;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } finally {
        textArea.remove();
      }
    }
  } catch (err) {
    console.warn('Clipboard auto-copy fallback', err);
  }

  // 2. Ouverture In-App Browser (Chrome Custom Tabs / Safari View Controller)
  await openFlowInApp(FLOW_STUDIO_URL);

  // 3. Affichage du toast visuel avec instructions claires
  showGoogleFlowToast({
    title: '✨ Studio Flow Ouvert !',
    message: 'Texte copié ! Collez votre prompt ou insérez une image dans Flow.',
    type: 'info',
    duration: 5000,
    promptCopied: defaultPrompt,
    productName
  });
};
