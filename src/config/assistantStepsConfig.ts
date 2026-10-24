/**
 * Configuration des étapes d'accompagnement pas-à-pas (Nanasore Assistant & Guide Interactif)
 * Définit les tutoriels vidéo, conseils et cibles DOM pour chaque grande section de l'application.
 */

export interface TourStep {
  id: string;
  targetSelector?: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  badge?: string;
  highlightRadius?: number;
}

export interface PageAssistantConfig {
  pageId: 'DASHBOARD_HOME' | 'POS_STOCK' | 'STORE_LIVE' | 'PAYMENTS_GATEWAY' | 'TRAINING_AI_STUDIO' | 'GENERAL';
  title: string;
  subtitle: string;
  categoryLabel: string;
  videoUrl: string;
  videoTitle: string;
  videoDuration: string;
  steps: TourStep[];
}

export const ASSISTANT_PAGES_CONFIG: Record<PageAssistantConfig['pageId'], PageAssistantConfig> = {
  // 1. Page Tableau de bord / Accueil : Bienvenue + présentation globale
  DASHBOARD_HOME: {
    pageId: 'DASHBOARD_HOME',
    title: 'Tableau de Bord & Accueil',
    subtitle: 'Vue d’ensemble et pilotage global de votre commerce',
    categoryLabel: '📊 Pilotage Global',
    videoUrl: '/assets/videos/intro_nanasore.mp4',
    videoTitle: 'Découverte globale de votre espace Nanasore (60s)',
    videoDuration: '1:00',
    steps: [
      {
        id: 'home-welcome',
        targetSelector: '#header-receipt-bar, #header-master-brand',
        title: '👋 Bienvenue sur Nanasore POS',
        description: 'Votre écosystème commercial tout-en-un réunit caisse tactile ultra-rapide, boutique en ligne, paiements mobiles et analyse financière intelligente.',
        placement: 'bottom',
        badge: 'Bienvenue'
      },
      {
        id: 'home-tab-pos',
        targetSelector: '#tab-nav-pos',
        title: '🛒 Caisse Tactile & Encaissements',
        description: 'Enregistrez vos ventes en 1 clic grâce aux raccourcis espèces, au scanner selfie et à la commande vocale locale hors-ligne.',
        placement: 'top',
        badge: 'Caisse'
      },
      {
        id: 'home-tab-inventory',
        targetSelector: '#tab-nav-inventory',
        title: '📦 Gestion des Stocks & Alertes',
        description: 'Suivez vos articles en temps réel, soyez alerté des ruptures de stock imminentes et importez votre catalogue Excel instantanément.',
        placement: 'top',
        badge: 'Stock'
      },
      {
        id: 'home-tab-store',
        targetSelector: '#tab-nav-store',
        title: '🏪 Boutique Vitrine & Commandes Web',
        description: 'Partagez votre boutique sur WhatsApp et les réseaux sociaux. Vos clients commandent en direct avec confirmation automatique.',
        placement: 'top',
        badge: 'Vitrine'
      },
      {
        id: 'home-tab-reports',
        targetSelector: '#tab-nav-reports, #tab-nav-debts',
        title: '📈 Comptabilité & Cahier de Dettes',
        description: 'Générez vos bilans financiers certifiés et tenez un cahier de dettes rigoureux avec relances WhatsApp personnalisées.',
        placement: 'top',
        badge: 'Compta'
      }
    ]
  },

  // 2. Page Caisse (POS) & Stock : Comment ajouter un produit et encaisser une vente
  POS_STOCK: {
    pageId: 'POS_STOCK',
    title: 'Caisse (POS) & Gestion de Stock',
    subtitle: 'Ajouter un article, scanner et encaisser une vente en quelques secondes',
    categoryLabel: '🛒 Vente & Stock',
    videoUrl: '/assets/videos/intro_nanasore.mp4',
    videoTitle: 'Tutoriel express : Encaisser une vente et gérer son stock (45s)',
    videoDuration: '0:45',
    steps: [
      {
        id: 'pos-search',
        targetSelector: '#input-pos-product-search',
        title: '🔍 Recherche Rapide d’Articles',
        description: 'Saisissez le nom d’un produit ou scannez son code-barres pour l’ajouter instantanément au ticket de caisse en cours.',
        placement: 'bottom',
        badge: 'Étape 1'
      },
      {
        id: 'pos-quick-amounts',
        targetSelector: '#btn-preset-amt-500, div[class*="Coupures"]',
        title: '💵 Coupures & Montants Rapides',
        description: 'Cliquez sur les coupures (+100 F, +500 F, +1 000 F CFA) pour ajouter directement un montant sans recherche préalable.',
        placement: 'bottom',
        badge: 'Étape 2'
      },
      {
        id: 'pos-voice-ptt',
        targetSelector: '#btn-push-to-talk',
        title: '🎙️ Commande Vocale Hors-Ligne',
        description: 'Maintenez le bouton micro pour dicter votre commande (ex: « 2 savons et 1 jus de fruits »). Le ticket est rempli automatiquement !',
        placement: 'top',
        badge: 'Super Pouvoir'
      },
      {
        id: 'pos-checkout-cash',
        targetSelector: '#btn-paiement-cash',
        title: '✅ Encaisser la Vente (Cash ou Reçu)',
        description: 'Cliquez ici pour finaliser l’encaissement, calculer la monnaie à rendre et imprimer ou partager le reçu thermique.',
        placement: 'left',
        badge: 'Encaissement'
      },
      {
        id: 'pos-credit-debt',
        targetSelector: '#btn-credit-client',
        title: '📕 Vente à Crédit (Cahier de Dettes)',
        description: 'Un client fidèle souhaite payer plus tard ? Enregistrez la dette en un clic avec notification WhatsApp de rappel.',
        placement: 'top',
        badge: 'Crédit'
      },
      {
        id: 'pos-stock-access',
        targetSelector: '#tab-nav-inventory, #btn-switch-stock-inventory',
        title: '📦 Accéder au Stock & Ajouter un Produit',
        description: 'Basculez dans l’onglet Stock pour consulter vos quantités restantes, ajouter de nouveaux articles ou réapprovisionner.',
        placement: 'top',
        badge: 'Stock'
      }
    ]
  },

  // 3. Page Boutique & Live Shopping : Comment partager sa boutique et lancer un Live
  STORE_LIVE: {
    pageId: 'STORE_LIVE',
    title: 'Boutique en Ligne & Live Shopping',
    subtitle: 'Partager votre vitrine, vendre sur les réseaux et lancer un Live interactif',
    categoryLabel: '🔴 E-Commerce & Live',
    videoUrl: '/assets/videos/intro_nanasore.mp4',
    videoTitle: 'Partager sa boutique et animer un Live Shopping (50s)',
    videoDuration: '0:50',
    steps: [
      {
        id: 'store-share-btn',
        targetSelector: '#btn-store-share, button[title*="Partager"]',
        title: '🔗 Partager sa Boutique & QR Code',
        description: 'Cliquez pour copier votre lien marchand public ou afficher le QR Code à imprimer pour vos clients sur WhatsApp et Instagram.',
        placement: 'bottom',
        badge: 'Partage'
      },
      {
        id: 'store-live-btn',
        targetSelector: '#btn-store-live, button[title*="Live Shopping"]',
        title: '🔴 Lancer un Live Shopping',
        description: 'Activez votre session vidéo en direct pour présenter vos arrivages, répondre aux questions des clients et enregistrer les commandes en direct.',
        placement: 'bottom',
        badge: 'Live Commerce'
      },
      {
        id: 'store-theme-btn',
        targetSelector: '#btn-store-theme-toggle, button[title*="Thème"]',
        title: '🎨 Thème Sombre & Blanc Pur',
        description: 'Adaptez l’apparence de votre boutique à votre marque : passez du mode Sombre Cyber au mode Blanc Pur (style Amazon) en 1 clic.',
        placement: 'bottom',
        badge: 'Personnalisation'
      },
      {
        id: 'store-cart-btn',
        targetSelector: '#btn-store-cart, button[title*="Panier"]',
        title: '🛒 Panier & Commandes en Ligne',
        description: 'Vos clients ajoutent leurs produits avec prévisualisation par loupe 3D et finalisent leur commande avec paiement mobile sécurisé.',
        placement: 'bottom',
        badge: 'Panier'
      }
    ]
  },

  // 4. Page Paiements (Nanasore Payment Gateway) : Comment configurer Orange, Moov, Wave, MTN et la vérification automatique des SMS
  PAYMENTS_GATEWAY: {
    pageId: 'PAYMENTS_GATEWAY',
    title: 'Passerelle Paiements & Vérification SMS',
    subtitle: 'Orange Money, Wave, Moov Money, MTN et validation automatique par SMS',
    categoryLabel: '📱 Nanasore Pay',
    videoUrl: '/assets/videos/intro_nanasore.mp4',
    videoTitle: 'Configurer Nanasore Pay et la validation SMS instantanée (55s)',
    videoDuration: '0:55',
    steps: [
      {
        id: 'pay-routing-tab',
        targetSelector: '#tab-btn-payment-routing',
        title: '💳 Passerelle Multi-Opérateurs Mobile Money',
        description: 'Définissez vos numéros de réception pour Wave, Orange Money, Moov Money et MTN MoMo selon les pays (Burkina, CI, Sénégal, etc.).',
        placement: 'bottom',
        badge: 'Comptes'
      },
      {
        id: 'pay-sms-tab',
        targetSelector: '#tab-btn-sms',
        title: '📲 Automatisation de la Vérification SMS',
        description: 'Connectez la lecture automatique des SMS bancaires : chaque paiement reçu est vérifié et validé sans risque de fausse capture d’écran !',
        placement: 'bottom',
        badge: 'Sécurité Anti-Fraude'
      },
      {
        id: 'pay-woocommerce-tab',
        targetSelector: '#tab-btn-woocommerce',
        title: '🔌 Connexion E-Commerce & WooCommerce',
        description: 'Synchronisez votre site web pour recevoir automatiquement les commandes et les encaissements directement sur votre caisse Nanasore.',
        placement: 'bottom',
        badge: 'Intégrations'
      },
      {
        id: 'pay-logs-tab',
        targetSelector: '#tab-btn-logs',
        title: '📑 Journal d’Audit & Rapprochement',
        description: 'Consultez la traçabilité complète de chaque transaction avec référence de virement, date et statut de rapprochement.',
        placement: 'bottom',
        badge: 'Audit'
      }
    ]
  },

  // 5. Page Formation / Studio IA : Comment suivre les cours ou générer des visuels
  TRAINING_AI_STUDIO: {
    pageId: 'TRAINING_AI_STUDIO',
    title: 'Studio IA & NaNa Académie',
    subtitle: 'Génération de visuels et micro-formations certifiantes pour commerçants',
    categoryLabel: '✨ IA & Formation',
    videoUrl: '/assets/videos/intro_nanasore.mp4',
    videoTitle: 'Utiliser le Studio IA et suivre les cours de l’Académie (50s)',
    videoDuration: '0:50',
    steps: [
      {
        id: 'ai-generator-access',
        targetSelector: '#tab-nav-marketing-ai, #tab-nav-ai-advisor',
        title: '✨ NaNa-Générateur Multimodal',
        description: 'Créez des photographies de produits professionnelles, des affiches publicitaires et des argumentaires de vente percutants en 15 secondes.',
        placement: 'top',
        badge: 'Création IA'
      },
      {
        id: 'ai-advisor-gemini',
        targetSelector: '#tab-nav-ai-advisor',
        title: '🤖 Agent Conseiller Financier IA',
        description: 'Posez des questions sur votre rentabilité, vos marges et votre trésorerie : Gemini analyse vos données de caisse en toute sécurité.',
        placement: 'top',
        badge: 'Conseil IA'
      },
      {
        id: 'academy-courses',
        targetSelector: '#tab-nav-student, #dropdown-item-academie',
        title: '🎓 NaNa Académie & Vidéos Express',
        description: 'Accédez à des tutoriels vidéo de 1 à 2 minutes pour maîtriser chaque outil, ainsi qu’à des formations certifiées de vente et gestion.',
        placement: 'top',
        badge: 'Apprentissage'
      }
    ]
  },

  // Configuration Générale par défaut
  GENERAL: {
    pageId: 'GENERAL',
    title: 'Assistant Nanasore',
    subtitle: 'Votre guide interactif pas-à-pas',
    categoryLabel: '💡 Assistance',
    videoUrl: '/assets/videos/intro_nanasore.mp4',
    videoTitle: 'Présentation de Nanasore POS (45s)',
    videoDuration: '0:45',
    steps: [
      {
        id: 'gen-nav-caisse',
        targetSelector: '#tab-nav-pos',
        title: 'Caisse & Vente Tactile',
        description: 'Enregistrez facilement vos ventes au comptoir et imprimez vos reçus.',
        placement: 'top'
      },
      {
        id: 'gen-nav-stock',
        targetSelector: '#tab-nav-inventory',
        title: 'Stock & Articles',
        description: 'Gérez vos références de produits et suivez vos seuils d’alerte.',
        placement: 'top'
      },
      {
        id: 'gen-nav-store',
        targetSelector: '#tab-nav-store',
        title: 'Boutique en Ligne',
        description: 'Partagez votre catalogue à vos clients en ligne sur WhatsApp.',
        placement: 'top'
      }
    ]
  }
};

/**
 * Détecte la configuration d'assistant adaptée à la vue active et à l'URL
 */
export function getPageAssistantConfig(currentView: string, pathname: string = ''): PageAssistantConfig {
  const normalizedView = (currentView || '').toUpperCase();
  const lowerPath = (pathname || '').toLowerCase();

  // 1. Détection Caisse (POS) & Stock
  if (normalizedView === 'POS' || normalizedView === 'INVENTORY' || lowerPath === '/pos' || lowerPath === '/stock') {
    return ASSISTANT_PAGES_CONFIG.POS_STOCK;
  }

  // 2. Détection Boutique & Live Shopping
  if (
    normalizedView === 'DASHBOARD' || 
    normalizedView === 'BOUTIQUE' || 
    lowerPath.startsWith('/shop') || 
    lowerPath.startsWith('/boutique') || 
    lowerPath.startsWith('/store')
  ) {
    return ASSISTANT_PAGES_CONFIG.STORE_LIVE;
  }

  // 3. Détection Paiements & Extensions
  if (normalizedView === 'SETTINGS_EXTENSIONS' || lowerPath.includes('/settings') || lowerPath.includes('/paiement')) {
    return ASSISTANT_PAGES_CONFIG.PAYMENTS_GATEWAY;
  }

  // 4. Détection Formation & Studio IA
  if (
    normalizedView === 'AI_STUDIO' || 
    normalizedView === 'COURSE_CREATE' || 
    normalizedView === 'INSTRUCTOR' || 
    normalizedView === 'TEACHER_DASHBOARD' || 
    lowerPath.includes('/classroom') || 
    lowerPath.includes('/formation') || 
    lowerPath.includes('/instructor')
  ) {
    return ASSISTANT_PAGES_CONFIG.TRAINING_AI_STUDIO;
  }

  // 5. Détection Tableau de bord / Accueil
  if (
    normalizedView === 'MASTER_HUB' || 
    normalizedView === 'HOME' || 
    normalizedView === 'LANDING' || 
    normalizedView === '' ||
    lowerPath === '/'
  ) {
    return ASSISTANT_PAGES_CONFIG.DASHBOARD_HOME;
  }

  // Fallback général
  return ASSISTANT_PAGES_CONFIG.GENERAL;
}
