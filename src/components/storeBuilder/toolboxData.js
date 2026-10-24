import {
  ShoppingBag,
  Smartphone,
  Truck,
  Radio,
  GraduationCap,
  Mail,
  MessageSquare,
  Activity,
  ListOrdered,
  Hourglass,
  BellRing,
  Wallet,
  Sparkles,
  Video,
  Share2,
  Crown,
  Users,
  Play,
  Flame,
  Tv,
  Film,
  Type,
  FileText,
  Sliders,
  Code2,
  Image,
  Link2,
  HelpCircle,
  Layers,
  Timer,
  Clock,
  ShieldCheck,
  Zap,
  Award,
  Star,
  Tag,
  AlertTriangle
} from 'lucide-react';

import {
  IconWhatsApp,
  IconTikTok,
  IconFacebook,
  IconXTwitter,
  IconYouTube,
  IconInstagram,
  IconLinkedIn,
  IconTelegram,
  IconPinterest,
  IconQuora
} from './socialIcons';

// ============================================================================
// LES 11 CATÉGORIES OFFICIELLES DU HUB D'INTÉGRATION PRO
// ============================================================================
export const TOOLBOX_PRO_CATEGORIES = [
  // 1. BANNIÈRES COMPTES À REBOURS & STOCKS (HAUTE CONVERSION)
  {
    id: 'urgency_scarcity_banners',
    title: 'Bannières Urgence & Stocks',
    badge: 'Compte à Rebours & Stocks ⚡',
    icon: Flame,
    color: '#ef4444',
    description: 'Bannières flottantes haute conversion, rubans tickers de stock critique, barres de raréfaction et bandes de commande 1-clic.',
    moduleTypes: [
      'banner_countdown_floating_top',
      'banner_stock_ticker_marquee',
      'banner_flash_stock_split',
      'banner_floating_sticky_bottom'
    ]
  },

  // 2. SECTIONS HERO DE HAUT NIVEAU PREMIUM
  {
    id: 'hero_sections_pro',
    title: 'Sections Hero Studio (Haute Précision)',
    badge: 'Héros & Vitrines 🌟',
    icon: Crown,
    color: '#6366f1',
    description: 'Sections Hero immersives 3D, VSL cinématique, typographie signature prestige et moteur de conversion directe.',
    moduleTypes: [
      'hero_studio_showcase_3d',
      'hero_vsl_cinematic',
      'hero_luxury_signature',
      'hero_lead_conversion_engine'
    ]
  },

  // 3. STRUCTURE & COMPOSANTS PRO
  {
    id: 'structure_components_pro',
    title: 'Structure & Composants Pro',
    badge: 'Fondamentaux & UI 🏗️',
    icon: Layers,
    color: '#2563eb', // Bleu NaNa
    description: 'Titres, sous-titres, paragraphes, accordéons FAQ, carrousels, diaporamas, galeries produit, code HTML/CSS brut et boutons dynamiques.',
    moduleTypes: [
      'text_heading',
      'text_subheading',
      'text_paragraph',
      'interactive_accordion',
      'interactive_carousel',
      'interactive_slideshow',
      'product_visual_gallery',
      'raw_html_block',
      'inline_css_block',
      'dynamic_button_link',
      'icon_block',
      'image_block',
      'bullet_list_block'
    ]
  },

  // 2. CATÉGORIE VIP : ÉCOSYSTÈME NANA
  {
    id: 'nana_ecosystem',
    title: 'Écosystème NaNa (VIP)',
    badge: 'Officiel NaNa 👑',
    icon: Crown,
    color: '#f59e0b',
    description: 'Blocs exclusifs au design premium connectés à nos plateformes propriétaires (Campus, Académie, Live).',
    moduleTypes: ['nana_campus_social', 'nana_academie', 'nana_live']
  },

  // 2. NOUVELLE CATÉGORIE : INTÉGRATIONS VIDÉO & LIVE
  {
    id: 'video_live_embeds',
    title: 'Intégrations Vidéo & Live',
    badge: 'iFrame & Flux 🎥',
    icon: Video,
    color: '#ef4444',
    description: 'Intégrations de flux vidéo et lives (YouTube, TikTok, Facebook, Instagram Reels, LinkedIn) avec conteneur dynamique.',
    moduleTypes: ['autoplay_video', 'embed_youtube', 'embed_tiktok', 'embed_facebook', 'embed_instagram', 'embed_linkedin']
  },

  // 3. NOUVELLE CATÉGORIE : RÉSEAUX SOCIAUX & PARTAGE
  {
    id: 'social_sharing',
    title: 'Réseaux Sociaux & Partage',
    badge: 'Viralité & Partage ⚡',
    icon: Share2,
    color: '#8b5cf6',
    description: 'Boutons de partage direct ou de redirection profil vers les 10 réseaux incontournables (WhatsApp, TikTok, etc.).',
    moduleTypes: [
      'social_share_bar',
      'social_button_whatsapp',
      'social_button_telegram',
      'social_button_tiktok',
      'social_button_instagram',
      'social_button_facebook',
      'social_button_x',
      'social_button_youtube',
      'social_button_linkedin',
      'social_button_pinterest',
      'social_button_quora'
    ]
  },

  // 4. CATÉGORIES EXISTANTES
  {
    id: 'ecommerce_payment',
    title: 'E-Commerce & Paiement',
    badge: 'Monétisation 💳',
    icon: Wallet,
    color: '#10b981',
    description: 'Tunnels de caisse express, passerelles Mobile Money africaines et paiement sécurisé à la livraison.',
    moduleTypes: ['woocommerce_checkout', 'mobile_money_afrique', 'cash_on_delivery']
  },
  {
    id: 'webinar_elearning',
    title: 'Webinaire & E-Learning',
    badge: 'Direct & Cours 🎓',
    icon: GraduationCap,
    color: '#6366f1',
    description: 'Visioconférences en direct (Zoom, Meet, Jitsi) et synchronisation pédagogique Google Classroom.',
    moduleTypes: ['live_stream', 'google_classroom']
  },
  {
    id: 'crm_automation',
    title: 'CRM & Automatisation',
    badge: 'Capture & SMS ⚡',
    icon: MessageSquare,
    color: '#f59e0b',
    description: 'Captures de leads synchronisées avec vos listes Brevo et alertes directes SMS Twilio.',
    moduleTypes: ['brevo_optin', 'twilio_sms']
  },
  {
    id: 'tracking_behavior',
    title: 'Tracking & Comportement',
    badge: 'Analytics 👁️',
    icon: Activity,
    color: '#06b6d4',
    description: 'Cartes thermiques Hotjar, enregistrements de session et pixels de suivi invisibles pour les visiteurs.',
    moduleTypes: ['heatmap_tracking']
  },
  {
    id: 'premium_pro',
    title: 'Modules Premium (Nanasore Pro)',
    badge: 'Super Conversion 🔥',
    icon: Sparkles,
    color: '#ec4899',
    description: 'Formulaires multi-étapes progressifs, compteurs d\'urgence evergreen et notifications de preuve sociale.',
    moduleTypes: ['multistep_form', 'evergreen_countdown', 'social_proof_popup']
  }
];

// ============================================================================
// CATALOGUE COMPLET DES MODULES PRO DU HUB D'INTÉGRATION
// ============================================================================
export const TOOLBOX_PRO_CATALOG = [
  // --------------------------------------------------------------------------
  // SECTION 0 : STRUCTURE & COMPOSANTS PRO (FONDAMENTAUX & UI AVANCÉE)
  // --------------------------------------------------------------------------
  {
    type: 'text_heading',
    name: 'Grand Titre (H1/H2)',
    category: 'structure_components_pro',
    badge: 'Titre Impact ✍️',
    icon: Type,
    color: '#2563eb',
    description: 'Grand titre éditorial à fort impact visuel avec support des dégradés de couleurs ou teintes unies.',
    createDefaultData: () => ({
      tag: 'h1', // 'h1' | 'h2' | 'h3'
      text: 'Propulsez Vos Ventes E-Commerce avec la Puissance NaNa',
      alignment: 'center', // 'left' | 'center' | 'right'
      fontSize: 'text-3xl sm:text-5xl',
      textColor: '#ffffff',
      gradientText: true,
      gradientPreset: 'from-blue-400 via-indigo-200 to-white',
      isUppercase: false,
      bgColor: 'transparent'
    })
  },
  {
    type: 'text_subheading',
    name: 'Sous-Titre',
    category: 'structure_components_pro',
    badge: 'Accroche Lead 📌',
    icon: Type,
    color: '#3b82f6',
    description: 'Sous-titre d\'accompagnement pour clarifier immédiatement votre promesse ou le problème résolu.',
    createDefaultData: () => ({
      text: 'La première plateforme tout-en-un optimisée pour les marchés africains et internationaux.',
      alignment: 'center',
      badgePrefix: 'SOLUTION OFFICIELLE NANA',
      textColor: '#94a3b8',
      fontSize: 'text-base sm:text-xl',
      bgColor: 'transparent'
    })
  },
  {
    type: 'text_paragraph',
    name: 'Paragraphe de Texte',
    category: 'structure_components_pro',
    badge: 'Texte Riche 📄',
    icon: FileText,
    color: '#60a5fa',
    description: 'Bloc de paragraphe fluide avec typographie moderne, interlignage soigné et largeur contrôlée.',
    createDefaultData: () => ({
      content: 'Notre technologie élimine tous les points de friction à l\'achat en intégrant nativement les paiements Wave, Orange Money et la livraison contre remboursement. Vos visiteurs commandent en moins de 30 secondes sans friction.',
      alignment: 'left',
      textColor: '#cbd5e1',
      fontSize: 'text-sm sm:text-base',
      lineHeight: 'leading-relaxed',
      maxWidth: 'max-w-2xl',
      bgColor: 'transparent'
    })
  },
  {
    type: 'interactive_accordion',
    name: 'Accordéon Pro (FAQ)',
    category: 'structure_components_pro',
    badge: 'FAQ Fluide ❓',
    icon: HelpCircle,
    color: '#2563eb',
    description: 'Accordéon FAQ avec animation d\'ouverture fluide, idéal pour répondre aux objections courantes.',
    createDefaultData: () => ({
      title: 'Foire Aux Questions Fréquentes',
      subtitle: 'Toutes les réponses à vos questions avant de finaliser votre commande.',
      items: [
        {
          q: 'Quels sont les délais de livraison réels ?',
          a: 'Toutes les commandes sont préparées et expédiées sous 24h ouvrées. Vous êtes livré en 24h à 48h selon votre ville ou région.'
        },
        {
          q: 'Puis-je payer en espèces après avoir vérifié le colis ?',
          a: 'Oui, absolument ! Le livreur se présente à votre adresse. Vous ouvrez, vérifiez la conformité du produit et ne payez qu\'ensuite.'
        },
        {
          q: 'Que se passe-t-il si le produit ne me convient pas ?',
          a: 'Vous bénéficiez de notre garantie Satisfait ou Remboursé sous 14 jours sans poser de question.'
        }
      ],
      activeIndex: 0,
      bgColor: '#060e1a'
    })
  },
  {
    type: 'interactive_carousel',
    name: 'Carrousel Premium',
    category: 'structure_components_pro',
    badge: 'Avis & Slides 🎠',
    icon: Sliders,
    color: '#1d4ed8',
    description: 'Carrousel multi-cartes défilant pour présenter des témoignages clients vérifiés, fonctionnalités ou photos.',
    createDefaultData: () => ({
      headline: 'Ce que disent nos clients satisfaits',
      currentSlide: 0,
      slides: [
        {
          name: 'Marc B. (Abidjan)',
          rating: 5,
          review: 'Livraison reçue en 24h chrono, produit conforme et emballage très soigné. Je recommande sans hésiter !',
          role: 'Acheteur Vérifié ✓'
        },
        {
          name: 'Aminata S. (Dakar)',
          rating: 5,
          review: 'Paiement Wave instantané, service client WhatsApp très réactif. Une expérience d\'achat parfaite.',
          role: 'Acheteuse Vérifiée ✓'
        },
        {
          name: 'Thierry K. (Douala)',
          rating: 5,
          review: 'Le produit a totalement répondu à mes attentes. La qualité est irréprochable.',
          role: 'Client Fidèle ✓'
        }
      ],
      bgColor: '#081224'
    })
  },
  {
    type: 'interactive_slideshow',
    name: 'Slideshow (Diaporama)',
    category: 'structure_components_pro',
    badge: 'Diaporama HD 🖼️',
    icon: Image,
    color: '#0284c7',
    description: 'Diaporama visuel avec flèches de navigation précédent/suivant et indicateurs de pagination interactifs.',
    createDefaultData: () => ({
      title: 'Aperçu Visuel Haute Définition',
      currentIndex: 0,
      slides: [
        {
          image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80',
          caption: 'Design épuré et finitions haut de gamme'
        },
        {
          image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=1200&q=80',
          caption: 'Confort d\'utilisation au quotidien et autonomie prolongée'
        },
        {
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
          caption: 'Accessoires complets inclus dans le coffret officiel'
        }
      ],
      bgColor: '#060d1a'
    })
  },
  {
    type: 'product_visual_gallery',
    name: 'Voir Produit (Galerie)',
    category: 'structure_components_pro',
    badge: 'Galerie Produit 🛍️',
    icon: ShoppingBag,
    color: '#2563eb',
    description: 'Galerie e-commerce avec grande photo produit et sélecteur de miniatures interactives en direct.',
    createDefaultData: (prod) => ({
      productName: prod?.name || 'Pack Élite NaNa Pro X',
      selectedIndex: 0,
      priceCFA: prod?.price || 24500,
      originalPriceCFA: Math.round((prod?.price || 24500) * 1.35),
      badge: 'Édition Spéciale 2026',
      images: [
        prod?.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
      ],
      ctaText: 'Commander ce Produit 🛍️',
      bgColor: '#050c18'
    })
  },
  {
    type: 'raw_html_block',
    name: 'Bloc HTML Brut',
    category: 'structure_components_pro',
    badge: 'HTML Inject ⚡',
    icon: Code2,
    color: '#06b6d4',
    description: 'Injecte du balisage HTML brut (shortcodes, widgets externes) à cet emplacement spécifique du funnel.',
    createDefaultData: () => ({
      rawHtml: '<div class="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-center text-xs text-blue-300 font-mono">⚡ Widget HTML brut injecté avec succès à cet emplacement</div>',
      label: 'Injection HTML Personnalisée',
      bgColor: '#060d16'
    })
  },
  {
    type: 'inline_css_block',
    name: 'Bloc CSS Inline',
    category: 'structure_components_pro',
    badge: 'CSS Scoped 🎨',
    icon: Sliders,
    color: '#8b5cf6',
    description: 'Injecte des règles CSS spécifiques et localisées à cet endroit précis de la page sans impacter le reste.',
    createDefaultData: () => ({
      scopedCss: '/* Styles CSS injectés localement */\n.nana-pro-shadow {\n  box-shadow: 0 10px 30px -10px rgba(37, 99, 235, 0.5);\n}',
      label: 'CSS Inline Scoped',
      bgColor: '#0b0616'
    })
  },
  {
    type: 'dynamic_button_link',
    name: 'Lien Court / Bouton Dynamique',
    category: 'structure_components_pro',
    badge: 'Smart CTA 🚀',
    icon: Link2,
    color: '#2563eb',
    description: 'Bouton dynamique dont l\'URL et le comportement peuvent s\'adapter selon les paramètres UTM du visiteur.',
    createDefaultData: () => ({
      label: 'COMMANDER MAINTENANT AVEC -30% ⚡',
      sublabel: 'Offre temporaire réservée aux 50 premières commandes',
      baseTargetUrl: '#checkout',
      passQueryParams: true,
      buttonStyle: 'gradient_glow',
      buttonColor: '#2563eb',
      buttonTextColor: '#ffffff',
      alignment: 'center',
      bgColor: '#060d1a'
    })
  },
  {
    type: 'icon_block',
    name: 'Icône NaNa Duotone',
    category: 'structure_components_pro',
    badge: 'Duotone Pro 💎',
    icon: Sparkles,
    color: '#2563eb',
    description: 'Icône illustrative à deux tons (Bleu NaNa) avec taille, couleur, halo et légende entièrement personnalisables.',
    createDefaultData: () => ({
      iconId: 'Bouclier Certifié SSL',
      iconName: 'Bouclier Certifié SSL',
      iconColor: '#2563eb',
      accentColor: '#93c5fd',
      bgColor: '#081325',
      glowColor: '#2563eb40',
      size: 64,
      styleVariant: 'duotone_glow',
      alignment: 'center',
      title: 'Garantie & Sécurité Maximale',
      caption: 'Cryptage 256-bit vérifié et certifié par nos serveurs',
      showBadge: true
    })
  },
  {
    type: 'image_block',
    name: 'Image & Bannière Responsive',
    category: 'structure_components_pro',
    badge: 'Média Visuel 🖼️',
    icon: Image,
    color: '#0ea5e9',
    description: 'Conteneur d\'image responsive avec coins arrondis, ombre portée, légende et lien de redirection optionnel.',
    createDefaultData: (prod) => ({
      imageUrl: prod?.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80',
      altText: prod?.name || 'Visuel officiel du produit',
      caption: 'Livraison express et garantie constructeur 100% assurée',
      borderRadius: 'rounded-2xl',
      shadowVariant: 'shadow-2xl shadow-blue-500/10',
      aspectRatio: 'aspect-video',
      maxWidth: 'max-w-3xl',
      alignment: 'center',
      enableLink: false,
      targetUrl: '#checkout',
      openInNewTab: false,
      bgColor: 'transparent'
    })
  },
  {
    type: 'bullet_list_block',
    name: 'Liste à Puces Avancée',
    category: 'structure_components_pro',
    badge: 'Avantages Clés 📋',
    icon: ListOrdered,
    color: '#10b981',
    description: 'Liste d\'arguments percutante avec icônes personnalisées (coches, étoiles, éclairs), espacement ajustable et typographie claire.',
    createDefaultData: () => ({
      title: 'Ce que vous obtenez dans votre pack :',
      bulletStyle: 'check',
      bulletColor: '#10b981',
      items: [
        'Produit officiel garanti 100% original avec certificat d\'authenticité',
        'Expédition prioritaire sous 24h ouvrées avec suivi WhatsApp en direct',
        'Paiement sécurisé à la livraison après inspection de votre colis',
        'Garantie Satisfait ou Remboursé 14 jours sans la moindre justification',
        'Accès VIP offert à la Masterclass Télécom & Monétique NaNa'
      ],
      alignment: 'left',
      maxWidth: 'max-w-2xl',
      cardStyle: true,
      bgColor: '#080d19'
    })
  },

  // --------------------------------------------------------------------------
  // SECTION A : ÉCOSYSTÈME NANA (VIP)
  // --------------------------------------------------------------------------
  {
    type: 'nana_campus_social',
    name: 'NaNa Campus Social',
    category: 'nana_ecosystem',
    badge: 'VIP Club 👑',
    icon: Users,
    color: '#f59e0b',
    description: 'Bloc premium connecté au réseau social interne NaNa pour fédérer la communauté d\'entrepreneurs et d\'apprenants.',
    createDefaultData: () => ({
      title: 'Rejoignez le Campus Social NaNa',
      subtitle: 'Le réseau social privé et bienveillant des créateurs et marchands digitaux africains.',
      badgeText: '👑 CLUB PRIVÉ EXCLUSIF',
      membersCount: '18 450+ Membres',
      onlineCount: '342 en ligne',
      features: [
        'Feed communautaire interactif en direct',
        'Salons d\'entraide E-Commerce, Tunnels & Dropshipping',
        'Annuaire des meilleurs fournisseurs vérifiés'
      ],
      ctaText: 'Rejoindre le Campus Social NaNa ✨',
      targetUrl: '/campus',
      themeColor: '#f59e0b',
      bgColor: '#140c03'
    })
  },
  {
    type: 'nana_academie',
    name: 'NaNa Académie',
    category: 'nana_ecosystem',
    badge: 'LMS & Certificat 🎓',
    icon: GraduationCap,
    color: '#10b981',
    description: 'Passerelle vers la plateforme de formation certifiante NaNa avec syllabus, cours vidéo et certifications blockchain.',
    createDefaultData: () => ({
      title: 'NaNa Académie : Formations Certifiantes',
      subtitle: 'Accédez à plus de 45 heures de cours vidéo pratiques pour maîtriser les tunnels de conversion et la monétisation.',
      badgeText: '🎓 ACCRÉDITATION OFFICIELLE',
      coursesCount: '28 Formations',
      studentsCount: '12 800+ Apprenants',
      certificateIncluded: true,
      features: [
        'Accès illimité à vie à toutes les masterclasses',
        'Études de cas réelles et templates téléchargeables',
        'Certificat officiel délivré à la fin du cursus'
      ],
      ctaText: 'Accéder à NaNa Académie 🚀',
      targetUrl: '/academy',
      themeColor: '#10b981',
      bgColor: '#03140e'
    })
  },
  {
    type: 'nana_live',
    name: 'NaNa Live (Webinaire Natif)',
    category: 'nana_ecosystem',
    badge: 'Direct Natif 📡',
    icon: Radio,
    color: '#ec4899',
    description: 'Salle de visioconférence et webinaire native NaNa ultra-rapide avec tchat interactif et présentation d\'offres en direct.',
    createDefaultData: () => ({
      title: 'Diffusion en Direct NaNa Live Studio',
      subtitle: 'Rejoignez la session interactive en direct sans aucun logiciel externe à installer.',
      badgeText: '🔴 EN DIRECT NANA LIVE',
      hostName: 'Coach Eric & Invités VIP',
      viewersCount: '1 280',
      isLiveNow: true,
      roomCode: 'LIVE-NANA-2026',
      ctaText: 'Entrer dans la Salle NaNa Live 📡',
      targetUrl: '/live',
      themeColor: '#ec4899',
      bgColor: '#170311'
    })
  },

  // --------------------------------------------------------------------------
  // SECTION B : INTÉGRATIONS VIDÉO & LIVE (EMBEDS & AUTOPLAY)
  // --------------------------------------------------------------------------
  {
    type: 'autoplay_video',
    name: 'Vidéo Autoplay Silencieuse',
    category: 'video_live_embeds',
    badge: 'Autoplay Boucle ⚡',
    icon: Video,
    color: '#8b5cf6',
    description: 'Vidéo courte muette en boucle automatique 100% largeur (Cloudinary, CDN, MP4 direct) sans upload, économisant la bande passante Firebase.',
    createDefaultData: () => ({
      videoUrl: '',
      title: 'Vidéo Démonstration en Boucle',
      caption: '',
      aspectRatio: '16/9',
      borderRadius: 'rounded-2xl',
      maxWidth: 'max-w-4xl',
      shadow: 'shadow-2xl',
      bgColor: 'transparent',
      showBadge: false,
      badgeText: 'DÉMONSTRATION EN DIRECT'
    })
  },
  {
    type: 'embed_youtube',
    name: 'Embed YouTube',
    category: 'video_live_embeds',
    badge: 'Vidéo / Live',
    icon: IconYouTube,
    color: '#ff0000',
    description: 'Intégrez une vidéo classique, un YouTube Short ou un flux YouTube Live avec lecteur iFrame réactif et contrôles.',
    createDefaultData: () => ({
      videoUrl: '', // Vide par défaut -> Rendu Placeholder
      title: 'Démonstration Vidéo & Live YouTube',
      aspectRatio: '16:9',
      autoplay: false,
      mute: false,
      controls: true,
      loop: false,
      bgColor: '#080811'
    })
  },
  {
    type: 'embed_tiktok',
    name: 'Embed TikTok',
    category: 'video_live_embeds',
    badge: 'Shorts & Live',
    icon: IconTikTok,
    color: '#00f2fe',
    description: 'Affichez des vidéos virales courtes TikTok ou un live au format vertical (9:16) haute conversion.',
    createDefaultData: () => ({
      videoUrl: '', // Vide par défaut -> Rendu Placeholder
      title: 'Vidéo Tendance TikTok',
      creatorHandle: '@nana_officiel',
      aspectRatio: '9:16',
      autoplay: true,
      loop: true,
      bgColor: '#05070d'
    })
  },
  {
    type: 'embed_facebook',
    name: 'Embed Facebook Video/Live',
    category: 'video_live_embeds',
    badge: 'Watch & Live',
    icon: IconFacebook,
    color: '#1877f2',
    description: 'Diffusez une vidéo Facebook Watch ou une session Facebook Live en direct pour capter votre communauté.',
    createDefaultData: () => ({
      videoUrl: '', // Vide par défaut -> Rendu Placeholder
      title: 'Direct Facebook Watch / Live',
      aspectRatio: '16:9',
      allowFullScreen: true,
      bgColor: '#060d1a'
    })
  },
  {
    type: 'embed_instagram',
    name: 'Embed Instagram',
    category: 'video_live_embeds',
    badge: 'Reels / Posts',
    icon: IconInstagram,
    color: '#e1306c',
    description: 'Présentez un Instagram Reel ou un post officiel avec preuves visuelles et interaction directe.',
    createDefaultData: () => ({
      videoUrl: '', // Vide par défaut -> Rendu Placeholder
      title: 'Reel Instagram Officiel',
      showCaption: true,
      aspectRatio: '9:16',
      bgColor: '#14050d'
    })
  },
  {
    type: 'embed_linkedin',
    name: 'Embed LinkedIn',
    category: 'video_live_embeds',
    badge: 'Post & Live B2B',
    icon: IconLinkedIn,
    color: '#0a66c2',
    description: 'Partagez une intervention professionnelle, une étude de cas ou un direct LinkedIn Audio/Vidéo.',
    createDefaultData: () => ({
      postUrl: '', // Vide par défaut -> Rendu Placeholder
      title: 'Publication LinkedIn Certifiée B2B',
      aspectRatio: '16:9',
      bgColor: '#040f1c'
    })
  },

  // --------------------------------------------------------------------------
  // SECTION C : RÉSEAUX SOCIAUX & PARTAGE DIRECT
  // --------------------------------------------------------------------------
  {
    type: 'social_share_bar',
    name: 'Barre de Partage Complète (10 Réseaux)',
    category: 'social_sharing',
    badge: 'Pack 10 Réseaux',
    icon: Share2,
    color: '#8b5cf6',
    description: 'Barre complète regroupant les 10 réseaux majeurs avec logos officiels, choix entre partage ou profils.',
    createDefaultData: () => ({
      headline: 'Partagez ce Funnel avec vos contacts 🚀',
      subheadline: 'Aidez votre entourage à profiter de cette offre exceptionnelle en un clic.',
      mode: 'share', // 'share' = Partager la page | 'profile' = Rediriger vers profil
      targetUrl: '',
      shareMessage: 'Regardez cette pépite e-commerce sur NaNa :',
      activeNetworks: ['whatsapp', 'telegram', 'tiktok', 'facebook', 'x', 'instagram', 'linkedin', 'youtube', 'pinterest', 'quora'],
      layoutStyle: 'pills', // 'pills' | 'icons' | 'cards'
      buttonSize: 'medium',
      showLabels: true,
      bgColor: '#090b14'
    })
  },
  {
    type: 'social_button_whatsapp',
    name: 'Bouton WhatsApp Direct',
    category: 'social_sharing',
    badge: 'WhatsApp 💬',
    icon: IconWhatsApp,
    color: '#25D366',
    description: 'Bouton officiel WhatsApp pour partager le funnel ou démarrer une conversation directe.',
    createDefaultData: () => ({
      network: 'whatsapp',
      mode: 'share', // 'share' | 'profile'
      targetUrl: '',
      label: 'Partager sur WhatsApp',
      phoneOrProfileUrl: 'https://wa.me/2250700000000',
      shareMessage: 'Bonjour ! Regarde cette offre incroyable sur NaNa :',
      buttonStyle: 'official', // 'official' | 'outline' | 'glass'
      bgColor: '#05180f'
    })
  },
  {
    type: 'social_button_telegram',
    name: 'Bouton Telegram Direct',
    category: 'social_sharing',
    badge: 'Telegram ✈️',
    icon: IconTelegram,
    color: '#229ED9',
    description: 'Bouton officiel Telegram pour partager sur des canaux de diffusion ou rediriger vers un groupe VIP.',
    createDefaultData: () => ({
      network: 'telegram',
      mode: 'share',
      targetUrl: '',
      label: 'Rejoindre sur Telegram',
      phoneOrProfileUrl: 'https://t.me/nanacommunity',
      shareMessage: 'Découvrez ce funnel e-commerce haute conversion sur NaNa :',
      buttonStyle: 'official',
      bgColor: '#051421'
    })
  },
  {
    type: 'social_button_tiktok',
    name: 'Bouton TikTok Direct',
    category: 'social_sharing',
    badge: 'TikTok 🎵',
    icon: IconTikTok,
    color: '#00f2fe',
    description: 'Bouton officiel TikTok stylisé pour rediriger vers votre compte créateur ou partager l\'offre.',
    createDefaultData: () => ({
      network: 'tiktok',
      mode: 'profile', // 'profile' par défaut pour TikTok
      targetUrl: '',
      label: 'Suivre sur TikTok',
      phoneOrProfileUrl: 'https://tiktok.com/@nana_officiel',
      shareMessage: 'Découvrez notre univers sur TikTok :',
      buttonStyle: 'official',
      bgColor: '#080811'
    })
  },
  {
    type: 'social_button_instagram',
    name: 'Bouton Instagram Direct',
    category: 'social_sharing',
    badge: 'Instagram 📸',
    icon: IconInstagram,
    color: '#E1306C',
    description: 'Bouton officiel Instagram avec dégradé coucher de soleil pour abonner vos visiteurs.',
    createDefaultData: () => ({
      network: 'instagram',
      mode: 'profile',
      targetUrl: '',
      label: 'Suivez-nous sur Instagram',
      phoneOrProfileUrl: 'https://instagram.com/nana_afrique',
      shareMessage: 'Suivez nos stories et publications exclusives :',
      buttonStyle: 'official',
      bgColor: '#17060f'
    })
  },
  {
    type: 'social_button_facebook',
    name: 'Bouton Facebook Direct',
    category: 'social_sharing',
    badge: 'Facebook 👥',
    icon: IconFacebook,
    color: '#1877F2',
    description: 'Bouton officiel Facebook pour partager le funnel ou inviter sur votre page officielle.',
    createDefaultData: () => ({
      network: 'facebook',
      mode: 'share',
      targetUrl: '',
      label: 'Partager sur Facebook',
      phoneOrProfileUrl: 'https://facebook.com/nana.officiel',
      shareMessage: 'Recommandé par notre communauté :',
      buttonStyle: 'official',
      bgColor: '#061324'
    })
  },
  {
    type: 'social_button_x',
    name: 'Bouton X (Twitter) Direct',
    category: 'social_sharing',
    badge: 'X (Twitter) 🐦',
    icon: IconXTwitter,
    color: '#e2e8f0',
    description: 'Bouton officiel X au look Silicon Valley pour twitter le funnel en un instant.',
    createDefaultData: () => ({
      network: 'x',
      mode: 'share',
      targetUrl: '',
      label: 'Partager sur X',
      phoneOrProfileUrl: 'https://x.com/nana_tech',
      shareMessage: '🔥 Opportunité à ne pas manquer :',
      buttonStyle: 'official',
      bgColor: '#0a0d14'
    })
  },
  {
    type: 'social_button_youtube',
    name: 'Bouton YouTube Direct',
    category: 'social_sharing',
    badge: 'YouTube ▶️',
    icon: IconYouTube,
    color: '#FF0000',
    description: 'Bouton officiel YouTube pour inciter à l\'abonnement de votre chaîne vidéo.',
    createDefaultData: () => ({
      network: 'youtube',
      mode: 'profile',
      targetUrl: '',
      label: 'S\'abonner sur YouTube',
      phoneOrProfileUrl: 'https://youtube.com/@nana_afrique',
      shareMessage: 'Abonnez-vous à notre chaîne officielle :',
      buttonStyle: 'official',
      bgColor: '#1b0406'
    })
  },
  {
    type: 'social_button_linkedin',
    name: 'Bouton LinkedIn Direct',
    category: 'social_sharing',
    badge: 'LinkedIn 💼',
    icon: IconLinkedIn,
    color: '#0A66C2',
    description: 'Bouton officiel LinkedIn pour partager une offre B2B ou diriger vers la page entreprise.',
    createDefaultData: () => ({
      network: 'linkedin',
      mode: 'share',
      targetUrl: '',
      label: 'Partager sur LinkedIn',
      phoneOrProfileUrl: 'https://linkedin.com/company/nana-tech',
      shareMessage: 'Nouvelle opportunité business & e-commerce en Afrique :',
      buttonStyle: 'official',
      bgColor: '#051221'
    })
  },
  {
    type: 'social_button_pinterest',
    name: 'Bouton Pinterest Direct',
    category: 'social_sharing',
    badge: 'Pinterest 📌',
    icon: IconPinterest,
    color: '#BD081C',
    description: 'Bouton officiel Pinterest pour épingler le produit ou visuel de vente.',
    createDefaultData: () => ({
      network: 'pinterest',
      mode: 'share',
      targetUrl: '',
      label: 'Épingler sur Pinterest',
      phoneOrProfileUrl: 'https://pinterest.com/nana_creations',
      shareMessage: 'Idée produit e-commerce tendance :',
      buttonStyle: 'official',
      bgColor: '#1a0407'
    })
  },
  {
    type: 'social_button_quora',
    name: 'Bouton Quora Direct',
    category: 'social_sharing',
    badge: 'Quora 💡',
    icon: IconQuora,
    color: '#B92B27',
    description: 'Bouton officiel Quora pour partager la solution aux questions des internautes.',
    createDefaultData: () => ({
      network: 'quora',
      mode: 'share',
      targetUrl: '',
      label: 'Partager sur Quora',
      phoneOrProfileUrl: 'https://quora.com/q/nana-afrique',
      shareMessage: 'Découvrez la réponse complète sur NaNa :',
      buttonStyle: 'official',
      bgColor: '#180406'
    })
  },

  // --------------------------------------------------------------------------
  // SECTION D : CATÉGORIE E-COMMERCE & PAIEMENT
  // --------------------------------------------------------------------------
  {
    type: 'woocommerce_checkout',
    name: 'WooCommerce Checkout',
    category: 'ecommerce_payment',
    badge: 'Caisse Express',
    icon: ShoppingBag,
    color: '#8b5cf6',
    description: 'Formulaire de commande direct style WooCommerce avec panier dynamique, codes promos et sélection des modes de livraison.',
    createDefaultData: (prod) => ({
      headline: 'Finalisez Votre Commande (Caisse Express)',
      subheadline: 'Remplissez vos coordonnées ci-dessous pour déclencher la préparation et l\'expédition prioritaire.',
      orderSummaryTitle: 'Récapitulatif Panier',
      productName: prod?.name || 'Pack Élite NaNa Pro X',
      productPrice: prod?.price || 24500,
      productOriginalPrice: Math.round((prod?.price || 24500) * 1.35),
      productImage: prod?.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
      shippingCost: 0,
      shippingName: 'Livraison Express Sécurisée (24h - 48h)',
      enableCoupons: true,
      defaultCoupon: 'NANA10',
      couponDiscountPercent: 10,
      appliedCoupon: null,
      availableMethods: ['Wave', 'Orange Money', 'Paiement à la Livraison', 'Carte Bancaire'],
      defaultMethod: 'wave',
      ctaText: 'VALIDER ET COMMANDER MAINTENANT 🛍️',
      securityBadge: '🔒 Cryptage SSL 256-Bit • Données 100% Protégées',
      guaranteeText: 'Satisfait ou Remboursé sous 14 jours sans condition',
      bgColor: '#070b14'
    })
  },
  {
    type: 'mobile_money_afrique',
    name: 'Paiement Mobile Afrique',
    category: 'ecommerce_payment',
    badge: 'Wave & OM',
    icon: Smartphone,
    color: '#0284c7',
    description: 'Interface native pour Wave, Orange Money, MoMo (MTN) et Moov Money avec bascule 1-clic et instructions claires.',
    createDefaultData: (prod) => ({
      title: 'Paiement Instantané Mobile Money (0% Frais)',
      subtitle: 'Réglez directement depuis votre smartphone avec votre solde habituel sans carte bancaire.',
      amountCFA: prod?.price || 24500,
      selectedOperator: 'wave',
      waveMerchantPhone: '+225 07 88 99 00 11',
      orangeMerchantPhone: '+225 07 44 55 66 77',
      momoMerchantPhone: '+225 05 11 22 33 44',
      moovMerchantPhone: '+225 01 02 03 04 05',
      ussdWave: 'Validation 1-Clic via QR ou Push Wave',
      ussdOrange: '#144*391# puis code secret',
      ussdMomo: '*133*12# puis code secret',
      securityNotice: 'Agrément BCEAO • Transactions chiffrées de bout en bout',
      ctaText: 'Payer Maintenant par Mobile Money ⚡',
      bgColor: '#060a14'
    })
  },
  {
    type: 'cash_on_delivery',
    name: 'Cash on Delivery',
    category: 'ecommerce_payment',
    badge: 'Paiement Livraison',
    icon: Truck,
    color: '#10b981',
    description: 'Encaissez en espèces uniquement à la réception du colis avec formulaire de livraison et pop-up de confirmation immédiate.',
    createDefaultData: () => ({
      badge: '🛡️ PAIEMENT EN ESPÈCES À LA LIVRAISON',
      headline: 'Zéro Risque : Vous Ne Payez Rien Avant d\'Avoir Reçu le Colis',
      description: 'Le livreur se déplace à votre domicile ou bureau. Vous déballez, inspectez votre produit, et ne remettez l\'argent qu\'après entière satisfaction.',
      deliveryTime: 'Livré sous 24h à 48h chrono',
      depositRequired: false,
      depositAmount: 0,
      cities: ['Abidjan (Toutes communes)', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Dakar', 'Douala', 'Cotonou', 'Lomé', 'Bamako'],
      ctaText: 'Confirmer Ma Commande (Paiement à la Livraison) 🚚',
      confirmationModalTitle: '🎉 Félicitations ! Votre commande est validée.',
      confirmationModalText: 'Un conseiller du service expédition NaNa vous contacte dans les 15 minutes par appel ou WhatsApp pour convenir de l\'horaire de livraison qui vous convient.',
      bgColor: '#060e14'
    })
  },

  // --------------------------------------------------------------------------
  // SECTION E : CATÉGORIE WEBINAIRE & E-LEARNING
  // --------------------------------------------------------------------------
  {
    type: 'live_stream',
    name: 'Live Stream',
    category: 'webinar_elearning',
    badge: 'Zoom / Meet',
    icon: Radio,
    color: '#ef4444',
    description: 'Intégration d\'événements et visioconférences en direct pour Zoom, Jitsi Meet, Google Meet et YouTube Live.',
    createDefaultData: () => ({
      sessionTitle: 'Masterclass Stratégique en Direct : Vendre Plus & Mieux',
      sessionSubtitle: 'Session interactive avec démonstrations en direct, partage d\'écran et questions-réponses.',
      speakerName: 'Dr. Amadou K. & Experts E-Commerce NaNa',
      speakerRole: 'Formateurs Certifiés & Consultants E-Commerce',
      platform: 'zoom',
      liveStatus: 'live',
      viewersCount: 432,
      meetingId: '849 2039 4812',
      passcode: 'NANA2026',
      streamUrl: 'https://meet.jit.si/MasterclassNaNaProStudio',
      buttonText: 'Rejoindre la Session en Direct 🔴',
      enableChatPreview: true,
      bgColor: '#0b0816'
    })
  },
  {
    type: 'google_classroom',
    name: 'Google Classroom Sync',
    category: 'webinar_elearning',
    badge: 'Classroom Sync',
    icon: GraduationCap,
    color: '#10b981',
    description: 'Bouton d\'accès direct et synchronisation pédagogique avec l\'espace Google Classroom officiel.',
    createDefaultData: () => ({
      badgeText: '🎓 ESPACE FORMATION OFFICIEL GOOGLE CLASSROOM',
      courseName: 'Certification E-commerce & Tunnels Haute Conversion',
      courseSubtitle: 'Accédez à l\'intégralité des 14 modules vidéo, modèles téléchargeables et devoirs pratiques.',
      classCode: 'na-94k2-pro',
      instructorName: 'Pr. Kouassi Mensah (Certifié Google for Education)',
      modulesCount: 14,
      enrolledStudents: 1420,
      classroomUrl: 'https://classroom.google.com/',
      buttonText: 'Accéder à la Classe Google Classroom 🚀',
      bgColor: '#06130e'
    })
  },

  // --------------------------------------------------------------------------
  // SECTION F : CATÉGORIE CRM & AUTOMATISATION
  // --------------------------------------------------------------------------
  {
    type: 'brevo_optin',
    name: 'Opt-in Brevo',
    category: 'crm_automation',
    badge: 'Email CRM',
    icon: Mail,
    color: '#06b6d4',
    description: 'Formulaire de capture relié automatiquement aux listes de contacts et scénarios de bienvenue Brevo (ex-Sendinblue).',
    createDefaultData: () => ({
      headline: 'Recevez Gratuitement Votre Pack Stratégique + Guide PDF',
      subheadline: 'Indiquez votre email ci-dessous pour recevoir le document ainsi que nos pépites hebdomadaires directement par email.',
      brevoListId: 'brevo_list_master_vip_2026',
      incentiveBadge: '🎁 100% GRATUIT • VALEUR 15 000 FCFA OFFERTE',
      buttonText: 'Recevoir mon Guide Immédiatement 📥',
      privacyText: 'Vos données sont protégées conformément au RGPD. Zéro spam, désinscription en 1 clic.',
      bgColor: '#040e16'
    })
  },
  {
    type: 'twilio_sms',
    name: 'Alerte SMS Twilio',
    category: 'crm_automation',
    badge: 'SMS Flash',
    icon: MessageSquare,
    color: '#f43f5e',
    description: 'Bouton de notification et inscription aux alertes SMS flash géré via l\'API Twilio.',
    createDefaultData: () => ({
      headline: 'Soyez Alerté par SMS en Avant-Première',
      subheadline: 'Recevez un SMS instantané 15 minutes avant le lancement des promotions flash et la réouverture des stocks critiques.',
      senderId: 'NANA-ALERT',
      countryPrefix: '+225',
      buttonText: 'Activer Mes Alertes SMS Gratuites 📲',
      successMessage: '🎉 Numéro validé ! Vous recevrez nos alertes SMS prioritaires.',
      bgColor: '#12040a'
    })
  },

  // --------------------------------------------------------------------------
  // SECTION G : CATÉGORIE TRACKING & COMPORTEMENT
  // --------------------------------------------------------------------------
  {
    type: 'heatmap_tracking',
    name: 'Heatmap & Tracking',
    category: 'tracking_behavior',
    badge: 'Zone Invisible',
    icon: Activity,
    color: '#eab308',
    description: 'Zone d\'injection invisible pour le code Hotjar, Microsoft Clarity, Meta Pixel et TikTok Pixel.',
    createDefaultData: () => ({
      hotjarId: '3849201',
      clarityId: 'ms_clarity_91028',
      metaPixelId: '109283746582910',
      tiktokPixelId: 'C78N987HG54321',
      trackScrollDepth: true,
      trackClickEvents: true,
      devNote: 'Zone 100% invisible pour vos visiteurs • Injecte les scripts Hotjar, Clarity et Pixel de conversion.',
      bgColor: '#0c0f16'
    })
  },

  // --------------------------------------------------------------------------
  // SECTION H : CATÉGORIE PREMIUM (DIVI / ELEMENTOR PRO)
  // --------------------------------------------------------------------------
  {
    type: 'multistep_form',
    name: 'Formulaire Multi-Étapes',
    category: 'premium_pro',
    badge: 'Elementor Pro',
    icon: ListOrdered,
    color: '#ec4899',
    description: 'Formulaire interactif par étapes (Stepper) avec animations fluides, barre de progression et navigation.',
    createDefaultData: () => ({
      formTitle: 'Diagnostic Personnalisé en 3 Étapes',
      formSubtitle: 'Répondez à ces questions rapides pour débloquer votre tarif préférentiel immédiat.',
      steps: [
        {
          title: 'Votre Profil',
          question: 'Quel est votre type d\'activité principale ?',
          options: ['E-commerce & Vente en Ligne', 'Boutique Physique / Magasin', 'Services & Freelance', 'Formation & Coaching']
        },
        {
          title: 'Votre Volume',
          question: 'Combien de commandes expédiez-vous par mois ?',
          options: ['Moins de 25 commandes/mois', '25 à 100 commandes/mois', '100 à 500 commandes/mois', 'Plus de 500 commandes/mois (Grand compte)']
        },
        {
          title: 'Coordonnées',
          question: 'Où devons-nous vous transmettre votre synthèse personnalisée ?',
          fields: ['Nom & Prénom', 'Numéro WhatsApp (pour le bilan)', 'Adresse Email']
        }
      ],
      ctaFinishText: 'Débloquer Mon Offre Personnalisée 🚀',
      bgColor: '#0b0918'
    })
  },
  {
    type: 'evergreen_countdown',
    name: 'Evergreen Countdown',
    category: 'premium_pro',
    badge: 'localStorage',
    icon: Hourglass,
    color: '#f59e0b',
    description: 'Compte à rebours individualisé par visiteur mémorisé dans le localStorage pour une urgence infaillible.',
    createDefaultData: () => ({
      durationMinutes: 15,
      headline: '⚡ VOTRE RÉDUCTION PERSONNELLE EXPIRE DANS :',
      subheadline: 'Ce tarif préférentiel est temporairement réservé à votre session. Une fois le chrono à zéro, le plein tarif sera appliqué.',
      expiredText: '⚠️ Temps écoulé ! Cette session promotionnelle personnelle a expiré.',
      ctaText: 'Commander Avant Expiration de la Session ⚡',
      accentColor: '#f59e0b',
      bgColor: '#160d03'
    })
  },
  {
    type: 'social_proof_popup',
    name: 'Social Proof Popup',
    category: 'premium_pro',
    badge: 'Live Sales',
    icon: BellRing,
    color: '#10b981',
    description: 'Notification dynamique d\'achats récents simulant les commandes live avec rotation automatique en bas à gauche.',
    createDefaultData: (prod) => ({
      buyerNames: [
        'Aïcha K. de Cocody (Abidjan)',
        'Mamadou D. de Dakar Plateau',
        'Grace T. de Douala Akwa',
        'Sékou B. de Bamako',
        'Christian M. de Cotonou',
        'Fatou S. de Ouagadougou'
      ],
      actionText: 'vient de commander',
      productName: prod?.name || 'Pack Élite NaNa Pro X',
      timeText: 'il y a 3 minutes',
      badgeVerified: 'Commande Vérifiée ✓',
      displayPosition: 'bottom-left',
      intervalSeconds: 6,
      bgColor: '#06130d'
    })
  },

  // --------------------------------------------------------------------------
  // SECTION : BANNIÈRES COMPTES À REBOURS & STOCKS (HAUTE CONVERSION)
  // --------------------------------------------------------------------------
  {
    type: 'banner_countdown_floating_top',
    name: 'Bannière Sticky Décompte & Code Promo',
    category: 'urgency_scarcity_banners',
    badge: 'Sticky Top ⏱️',
    icon: Timer,
    color: '#ef4444',
    description: 'Bannière flottante d\'urgence fixée au sommet avec compte à rebours live, badge promo et code coupon détachable.',
    createDefaultData: (prod) => ({
      badgeText: 'VENTE FLASH EXCLUSIVE',
      headline: 'Offre Spéciale Limitée : Réduction Immédiate Disponible',
      countdownHours: 3,
      countdownMinutes: 45,
      countdownSeconds: 20,
      couponCode: 'FLASH30',
      ctaText: 'Profiter de l\'Offre',
      ctaLink: '#checkout',
      isSticky: true,
      bgColor: '#450a0a',
      accentColor: '#f43f5e',
      textColor: '#ffffff'
    })
  },
  {
    type: 'banner_stock_ticker_marquee',
    name: 'Bannière Ticker Défilant & Stock Critique',
    category: 'urgency_scarcity_banners',
    badge: 'Ticker 60 FPS ⚡',
    icon: Flame,
    color: '#f59e0b',
    description: 'Ruban défilant animé haute fluidité avec stock critique en direct, avis de livraison express et preuve sociale.',
    createDefaultData: (prod) => ({
      stockRemaining: 4,
      stockTotal: 30,
      urgencyText: 'Plus que 4 unités réservées pour la région',
      deliveryText: 'Livraison express 24h & vérification du colis avant paiement',
      guaranteeText: 'Garantie Totale 12 Mois Satisfait ou Remboursé',
      liveBuyerText: 'Kouassi d\'Abidjan a validé sa commande il y a 2 min',
      tickerSpeed: 'normal',
      bgColor: '#1c1002',
      accentColor: '#f59e0b',
      textColor: '#fef3c7'
    })
  },
  {
    type: 'banner_flash_stock_split',
    name: 'Bannière Split Promo & Jauge de Raréfaction',
    category: 'urgency_scarcity_banners',
    badge: 'Raréfaction 85% 📊',
    icon: Zap,
    color: '#ec4899',
    description: 'Bandeau 2-colonnes combinant compte à rebours, jauge de raréfaction 85% réclamé et réservation instantanée.',
    createDefaultData: (prod) => ({
      title: 'Offre Spéciale de Clôture • Quantités Allouées',
      subtitle: 'Nos stocks physiques s\'épuisent rapidement. Réservez votre colis avant la rupture totale.',
      claimedPercent: 86,
      stockRemaining: 5,
      stockTotal: 40,
      countdownHours: 1,
      countdownMinutes: 28,
      ctaText: 'Bloquer Mon Tarif Promo ➔',
      ctaLink: '#checkout',
      bgColor: '#1f0412',
      accentColor: '#ec4899',
      textColor: '#ffffff'
    })
  },
  {
    type: 'banner_floating_sticky_bottom',
    name: 'Bannière Flottante Bottom Bar (1-Clic Achat)',
    category: 'urgency_scarcity_banners',
    badge: 'Barre Achat 🛒',
    icon: ShoppingBag,
    color: '#10b981',
    description: 'Barre flottante fixée en bas d\'écran avec miniature produit, prix promo, stock restant et bouton d\'achat direct.',
    createDefaultData: (prod) => ({
      productTitle: prod?.name || 'Pack Élite NaNa Pro X',
      promoPrice: prod?.price || 25000,
      originalPrice: prod?.originalPrice || 45000,
      stockText: 'Seulement 3 en stock',
      countdownMinutes: 24,
      ctaText: 'Commander Maintenant',
      ctaLink: '#checkout',
      imageUrl: prod?.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=200&q=80',
      bgColor: '#021a12',
      accentColor: '#10b981',
      textColor: '#ffffff'
    })
  },

  // --------------------------------------------------------------------------
  // SECTION : SECTIONS HERO DE HAUT NIVEAU PREMIUM
  // --------------------------------------------------------------------------
  {
    type: 'hero_studio_showcase_3d',
    name: 'Hero Studio Showcase 3D (Split Immersif)',
    category: 'hero_sections_pro',
    badge: 'Studio 3D 💎',
    icon: Sparkles,
    color: '#6366f1',
    description: 'Hero immersif haut de gamme en 2 colonnes avec fond dégradé mesh, carte 3D en verre dépoli, double CTA et preuve sociale.',
    createDefaultData: (prod) => ({
      kickerBadge: 'NOUVELLE COLLECTION STUDIO PRO',
      headline: prod?.name ? `Propulsez Votre Quotidien avec ${prod.name}` : 'Révolutionnez Votre Activité avec Notre Solution Tout-en-Un',
      highlightWord: 'Révolutionnez',
      subheadline: prod?.description || 'Rejoignez les milliers d\'entrepreneurs et professionnels qui obtiennent des résultats concrets en moins de 7 jours grâce à une conception sur-mesure.',
      primaryCtaText: 'Commander Maintenant • Offre Flash 🚀',
      primaryCtaLink: '#checkout',
      secondaryCtaText: 'Voir la Démonstration (2 min)',
      secondaryCtaLink: '#video',
      imageUrl: prod?.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
      floatingBadge: '-45% AUJOURD\'HUI',
      ratingScore: '4.98 / 5',
      socialProofText: 'Rejoint par plus de 12 400 clients satisfaits',
      benefits: [
        'Qualité certifiée et contrôlée',
        'Livraison express 24h sécurisée',
        'Paiement Wave & Orange Money'
      ],
      bgColor: '#060919',
      accentColor: '#6366f1'
    })
  },
  {
    type: 'hero_vsl_cinematic',
    name: 'Hero VSL Cinématique (Video Sales Machine)',
    category: 'hero_sections_pro',
    badge: 'Cinématique VSL 🎬',
    icon: Video,
    color: '#f43f5e',
    description: 'Hero centré sur la vidéo de vente avec ticker live supérieur, cadre vidéo 16:9 haute définition, boutons d\'action immédiate et garanties.',
    createDefaultData: (prod) => ({
      liveStatusText: 'DIFFUSION EN DIRECT',
      viewersCount: 342,
      headline: 'Comment Transformer Votre Approche en 3 Étapes Simples Sans Erreur',
      subheadline: 'Regardez cette vidéo de démonstration complète avant la fermeture des inscriptions à tarif réduit.',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      posterUrl: prod?.image || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      durationBadge: '12:45',
      ctaText: 'Obtenir Mon Accès Immédiat au Tarif Réduit ➔',
      ctaLink: '#checkout',
      priceText: '29 000 FCFA au lieu de 60 000 FCFA',
      guarantees: [
        'Garantie Inconditionnelle 30 Jours',
        'Accès Immédiat & Téléchargeable',
        'Assistance Prioritaire 7j/7'
      ],
      bgColor: '#090306',
      accentColor: '#f43f5e'
    })
  },
  {
    type: 'hero_luxury_signature',
    name: 'Hero Minimalist Luxury (Signature High-Ticket)',
    category: 'hero_sections_pro',
    badge: 'Signature Prestige 👑',
    icon: Crown,
    color: '#d97706',
    description: 'Section Hero éditoriale de luxe avec finitions or/champagne, typographie noble, puces d\'excellence et mise en valeur prestige.',
    createDefaultData: (prod) => ({
      editionBadge: 'COLLECTION PRIVILÈGE • ÉDITION LIMITÉE',
      headline: prod?.name || 'Le Joyau d\'Excellence et d\'Élégance Absolue',
      subheadline: 'Chaque détail a été façonné avec une précision d\'orfèvre pour offrir une expérience sensorielle et fonctionnelle sans compromis.',
      price: prod?.price || 49000,
      originalPrice: prod?.originalPrice || 85000,
      vipPill: 'Exemplaire N° 084 / 200',
      ctaText: 'Réserver Mon Coffret Numéroté 👑',
      ctaLink: '#checkout',
      imageUrl: prod?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
      bulletPoints: [
        'Matériaux nobles sélectionnés à la main',
        'Garantie Signature 24 Mois Échange à Neuf',
        'Expédition sous coffret rigide scellé'
      ],
      bgColor: '#0a0804',
      accentColor: '#d97706'
    })
  },
  {
    type: 'hero_lead_conversion_engine',
    name: 'Hero Direct Conversion Engine (Offre Choc)',
    category: 'hero_sections_pro',
    badge: 'Conversion Max 🚀',
    icon: Zap,
    color: '#10b981',
    description: 'Moteur de conversion directe avec notation 5 étoiles, carte produit choc avec prix barré, commande express et badges de paiement Wave/Orange.',
    createDefaultData: (prod) => ({
      ratingScore: '4.95 / 5',
      reviewCount: '2 840 clients satisfaits',
      headline: prod?.name ? `Obtenez ${prod.name} avec -45% Aujourd'hui` : 'Multipliez Vos Ventes avec Notre Solution Tout-en-Un Clé en Main',
      subheadline: 'Commandez en 1 clic sans compte compliqué. Vérifiez votre colis à la réception avant tout paiement.',
      price: prod?.price || 24500,
      originalPrice: prod?.originalPrice || 45000,
      discountBadge: '-45% AUJOURD\'HUI',
      urgencyText: 'Plus que 5 packs disponibles au tarif promotionnel',
      ctaText: 'Commander avec Wave / Orange Money ➔',
      ctaLink: '#checkout',
      imageUrl: prod?.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80',
      paymentBadges: ['Wave', 'Orange Money', 'MTN', 'Cash Livraison'],
      bgColor: '#04100c',
      accentColor: '#10b981'
    })
  }
];
