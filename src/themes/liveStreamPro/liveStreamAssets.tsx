import React from 'react';
import { StoreProductItem } from '../../components/storeBuilder/types';

// =============================================================================
// ICÔNES VECTORIELLES MULTISTREAMING (Facebook, TikTok, YouTube, Instagram)
// =============================================================================

export const FacebookLiveIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
  </svg>
);

export const TikTokLiveIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.58a8.28 8.28 0 0 0 4.84 1.56V6.69h-1.07z" fill="#FFFFFF" />
  </svg>
);

export const YouTubeLiveIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000" />
  </svg>
);

export const InstagramLiveIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <defs>
      <linearGradient id="igGradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="5%" stopColor="#fdf497" />
        <stop offset="45%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="90%" stopColor="#285AEB" />
      </linearGradient>
    </defs>
    <path fill="url(#igGradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

// =============================================================================
// VISUELS SVG HAUTE FIDÉLITÉ POUR LES PRODUITS DE DÉMONSTRATION DU DIRECT
// =============================================================================

export const LIVE_STUDIO_KIT_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="bgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23111422"/><stop offset="100%" stop-color="%2306070a"/></linearGradient><linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%236366F1"/><stop offset="50%" stop-color="%23EC4899"/><stop offset="100%" stop-color="%238B5CF6"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="400" height="400" fill="url(%23bgG)" rx="24"/><circle cx="200" cy="180" r="100" fill="none" stroke="url(%23ringG)" stroke-width="20" filter="url(%23glow)" opacity="0.95"/><circle cx="200" cy="180" r="70" fill="%23090A0F" stroke="%2338BDF8" stroke-width="3" opacity="0.4"/><rect x="180" y="140" width="40" height="80" rx="8" fill="%231E293B" stroke="%236366F1" stroke-width="2"/><circle cx="200" cy="170" r="14" fill="%230284C7"/><path d="M190 280 L210 280 L205 360 L195 360 Z" fill="%23334155"/><rect x="150" y="360" width="100" height="8" rx="4" fill="%236366F1"/><text x="200" y="70" text-anchor="middle" fill="%23F8FAFC" font-family="sans-serif" font-weight="900" font-size="20" letter-spacing="2">4K BROADCAST STUDIO</text></svg>`;

export const LIVE_MASTERCLASS_VIP_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="bgM" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231E1B4B"/><stop offset="100%" stop-color="%230B0D17"/></linearGradient><linearGradient id="goldG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23FDE047"/><stop offset="100%" stop-color="%23D97706"/></linearGradient></defs><rect width="400" height="400" fill="url(%23bgM)" rx="24"/><rect x="60" y="70" width="280" height="260" rx="20" fill="%23111827" stroke="url(%23goldG)" stroke-width="4"/><path d="M170 160 L250 200 L170 240 Z" fill="url(%23goldG)"/><circle cx="200" cy="200" r="60" fill="none" stroke="url(%23goldG)" stroke-width="3" stroke-dasharray="8 6"/><text x="200" y="125" text-anchor="middle" fill="%23FDE047" font-family="sans-serif" font-weight="900" font-size="18" letter-spacing="1">MASTERCLASS VIP</text><text x="200" y="300" text-anchor="middle" fill="%2394A3B8" font-family="sans-serif" font-weight="700" font-size="14">ACCÈS PRIVÉ ILLIMITÉ</text></svg>`;

export const LIVE_MIC_SHURE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="bgMic" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%230F172A"/><stop offset="100%" stop-color="%23020617"/></linearGradient></defs><rect width="400" height="400" fill="url(%23bgMic)" rx="24"/><rect x="160" y="80" width="80" height="150" rx="40" fill="%23334155" stroke="%2364748B" stroke-width="4"/><line x1="160" y1="130" x2="240" y2="130" stroke="%23475569" stroke-width="3"/><line x1="160" y1="160" x2="240" y2="160" stroke="%23475569" stroke-width="3"/><path d="M140 180 C140 250 260 250 260 180" fill="none" stroke="%2394A3B8" stroke-width="8" stroke-linecap="round"/><line x1="200" y1="250" x2="200" y2="320" stroke="%2394A3B8" stroke-width="8"/><rect x="140" y="320" width="120" height="16" rx="8" fill="%23475569"/><text x="200" y="60" text-anchor="middle" fill="%2338BDF8" font-family="sans-serif" font-weight="800" font-size="18">PODCAST & BROADCAST PRO</text></svg>`;

export const LIVE_AUTO_FUNNEL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="bgF" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%230F172A"/><stop offset="100%" stop-color="%23090A0F"/></linearGradient></defs><rect width="400" height="400" fill="url(%23bgF)" rx="24"/><polygon points="80,100 320,100 240,220 240,320 160,320 160,220" fill="none" stroke="%238B5CF6" stroke-width="6"/><circle cx="200" cy="160" r="18" fill="%23EC4899"/><circle cx="200" cy="270" r="14" fill="%2310B981"/><text x="200" y="70" text-anchor="middle" fill="%23A78BFA" font-family="sans-serif" font-weight="900" font-size="18">TUNNEL WHATSAPP TURBO</text></svg>`;

// =============================================================================
// PRODUITS DE DÉMONSTRATION DU DIRECT
// =============================================================================

export interface LiveProductItem extends StoreProductItem {
  timestampPresentation?: string;
  isPinnedOffer?: boolean;
  stockLeft?: number;
  lotNumber?: string;
  claimedPercent?: number;
  isLocked?: boolean;
  unlockInMinutes?: number;
}

export const DEMO_LIVE_PRODUCTS: LiveProductItem[] = [
  {
    id: 'live-pinned-kit-4k',
    name: 'Pack Studio Live Stream 4K + Ring Light Pro & Micro',
    price: 49000,
    originalPrice: 85000,
    category: 'Matériel Studio',
    image: LIVE_STUDIO_KIT_SVG,
    description: 'Le setup complet clé en main pour diffuser en 4K sur TikTok, Facebook et YouTube simultanément sans aucun lag.',
    stock: 4,
    stockLeft: 3,
    claimedPercent: 82,
    lotNumber: '#LOT 01',
    rating: 5.0,
    reviewCount: 92,
    badge: 'Offre Épinglée',
    isPinnedOffer: true,
    timestampPresentation: 'En cours (08:24)',
    linkedFunnelId: 'funnel-kit-live-4k'
  },
  {
    id: 'live-prod-masterclass',
    name: 'Masterclass VIP : Les Secrets du Live Shopping en Afrique',
    price: 25000,
    originalPrice: 50000,
    category: 'Formations & VIP',
    image: LIVE_MASTERCLASS_VIP_SVG,
    description: 'Accès à vie à la méthode pas-à-pas pour générer plus de 1 000 000 FCFA par session de direct avec Mobile Money.',
    stock: 12,
    stockLeft: 5,
    claimedPercent: 74,
    lotNumber: '#LOT 02',
    rating: 4.9,
    reviewCount: 140,
    badge: 'Best-Seller',
    timestampPresentation: 'Présenté à 12:40',
    linkedFunnelId: 'funnel-masterclass-live'
  },
  {
    id: 'live-prod-shure-mic',
    name: 'Microphone Broadcast Pro USB / XLR Shure Type',
    price: 34000,
    originalPrice: 48000,
    category: 'Audio & Son',
    image: LIVE_MIC_SHURE_SVG,
    description: 'Capture vocale studio avec réduction active du bruit ambiant pour des webinaires à la clarté cristalline.',
    stock: 9,
    stockLeft: 4,
    claimedPercent: 65,
    lotNumber: '#LOT 03',
    rating: 5.0,
    reviewCount: 64,
    badge: 'Édition Spéciale',
    timestampPresentation: 'Présenté à 24:15',
    linkedFunnelId: 'funnel-mic-broadcast',
    isLocked: false
  },
  {
    id: 'live-prod-tunnel-auto',
    name: 'Pack Licence Logiciel : Tunnel de Vente Dépliable & Relances WhatsApp',
    price: 19500,
    originalPrice: 39000,
    category: 'Logiciels & Outils',
    image: LIVE_AUTO_FUNNEL_SVG,
    description: 'Permet à vos spectateurs d\'acheter en 1 clic sans quitter votre vidéo avec encaissement instantané Wave & Orange Money.',
    stock: 18,
    stockLeft: 8,
    claimedPercent: 55,
    lotNumber: '#LOT 04',
    rating: 4.9,
    reviewCount: 78,
    badge: 'Flash -50%',
    timestampPresentation: 'Présenté à 36:50',
    linkedFunnelId: 'funnel-license-auto',
    isLocked: true,
    unlockInMinutes: 10
  }
];

// =============================================================================
// MODÈLES ET DONNÉES WEBINAIRES HAUT DE GAMME & REPLAYS VIP
// =============================================================================

export interface LiveWebinarSpeaker {
  name: string;
  role: string;
  avatarColor: string;
}

export interface LiveWebinarItem {
  id: string;
  title: string;
  category: string;
  speaker: LiveWebinarSpeaker;
  dateBadge: string;
  isReplayAvailable?: boolean;
  replayDuration?: string;
  keyTakeaways: [string, string, string];
  attendeesCount: number;
  price?: number;
  originalPrice?: number;
  linkedFunnelId?: string;
}

export const DEMO_LIVE_WEBINARS: LiveWebinarItem[] = [
  {
    id: 'webinar-scaling-afrique',
    title: 'Scaling E-commerce Afrique : De 0 à 10 000 000 FCFA/mois',
    category: 'Stratégie & Vente',
    speaker: {
      name: 'Dr. Marc Anderson',
      role: 'Expert Scaling Afrique & FinTech',
      avatarColor: 'from-amber-400 to-orange-600'
    },
    dateBadge: 'Jeudi 15 Octobre à 20h00 GMT',
    isReplayAvailable: false,
    keyTakeaways: [
      'Dompter les algorithmes TikTok Shop & Facebook Ads sans être banni',
      'Automatiser l\'encaissement Mobile Money multi-pays (Wave, Orange, MTN)',
      'Logistique & Cash-on-Delivery : Réduire les retours à moins de 4%'
    ],
    attendeesCount: 485,
    price: 15000,
    originalPrice: 35000,
    linkedFunnelId: 'funnel-webinar-scaling'
  },
  {
    id: 'webinar-tunnels-whatsapp',
    title: 'Masterclass Haute Conversion : Tunnels Dépliables & WhatsApp Bot',
    category: 'Conversion & Automatisation',
    speaker: {
      name: 'Aïcha Kaboré',
      role: 'Directrice Stratégie Nanasore',
      avatarColor: 'from-purple-500 to-indigo-600'
    },
    dateBadge: '🎬 REPLAY DISPONIBLE',
    isReplayAvailable: true,
    replayDuration: '1h 45m',
    keyTakeaways: [
      'Multiplier par 3 vos ventes sans rediriger vers un site externe lourd',
      'Relances paniers abandonnés en direct sur WhatsApp avec Sebpay',
      'Convertir un live streaming en machine à cash automatisée 24h/24'
    ],
    attendeesCount: 620,
    price: 0, // Inclus dans le pass VIP
    originalPrice: 25000,
    linkedFunnelId: 'funnel-webinar-tunnels'
  },
  {
    id: 'webinar-ai-video-seller',
    title: 'IA Générative pour Vendeurs : Créer 50 Vidéos Produits par Semaine',
    category: 'Intelligence Artificielle',
    speaker: {
      name: 'Ibrahim Traoré',
      role: 'IA & Content Creator Studio',
      avatarColor: 'from-emerald-400 to-teal-600'
    },
    dateBadge: 'Samedi 17 Octobre à 19h00 GMT',
    isReplayAvailable: false,
    keyTakeaways: [
      'Cloner sa voix et son avatar pour vendre en continu sur les réseaux',
      'Scripts psychologiques d\'urgence pour exploser les ventes flash en live',
      'Montage vidéo automatique 4K avec sous-titres dynamiques viraux'
    ],
    attendeesCount: 340,
    price: 18500,
    originalPrice: 40000,
    linkedFunnelId: 'funnel-webinar-ai'
  }
];

// =============================================================================
// MESSAGES DE CHAT INITIAUX & NOTIFICATIONS D'ACHAT
// =============================================================================

export interface LiveChatMessage {
  id: string;
  sender: string;
  text: string;
  avatarColor: string;
  badge?: 'Spectateur' | 'Acheteur Vérifié' | 'Modérateur' | 'VIP';
  timestamp: string;
  isSystemPurchase?: boolean;
  purchaseProduct?: string;
}

export const INITIAL_CHAT_MESSAGES: LiveChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'Aminata Diallo',
    text: 'Bonsoir tout le monde depuis Dakar ! L\'image est super nette 🤩',
    avatarColor: 'from-pink-500 to-rose-600',
    badge: 'Spectateur',
    timestamp: '19:42'
  },
  {
    id: 'msg-2',
    sender: 'Kouassi Marc',
    text: 'Est-ce que le Ring Light est livré avec le trépied réglable ?',
    avatarColor: 'from-indigo-500 to-blue-600',
    badge: 'Spectateur',
    timestamp: '19:43'
  },
  {
    id: 'msg-3',
    sender: 'Modérateur Nanasore 🔥',
    text: 'Oui Kouassi ! Tout est inclus dans le pack 4K avec garantie 1 an et livraison 24h.',
    avatarColor: 'from-amber-400 to-orange-500',
    badge: 'Modérateur',
    timestamp: '19:43'
  },
  {
    id: 'msg-4',
    sender: 'Moussa Konaté',
    text: 'Je viens de commander le pack via Wave, le tiroir s\'est ouvert direct sans couper la vidéo ! Trop fort 🔥',
    avatarColor: 'from-emerald-500 to-teal-600',
    badge: 'Acheteur Vérifié',
    timestamp: '19:44'
  },
  {
    id: 'msg-sys-1',
    sender: 'Système Live',
    text: '🎉 Moussa K. vient de débloquer l\'offre Pack Studio Live Stream 4K !',
    avatarColor: 'from-amber-400 to-yellow-500',
    badge: 'Acheteur Vérifié',
    timestamp: '19:44',
    isSystemPurchase: true,
    purchaseProduct: 'Pack Studio Live Stream 4K + Ring Light Pro'
  },
  {
    id: 'msg-5',
    sender: 'Fatou Bamba',
    text: 'Le bouton pour activer le son marche super bien sur iPhone merci 👌',
    avatarColor: 'from-purple-500 to-indigo-600',
    badge: 'VIP',
    timestamp: '19:45'
  }
];

export const MOCK_PURCHASE_EVENTS = [
  { name: 'Ousmane S.', product: 'Pack Studio Live Stream 4K + Ring Light Pro' },
  { name: 'Aïcha D.', product: 'Masterclass VIP : Dominer le Live Commerce' },
  { name: 'Jean-Luc T.', product: 'Microphone Broadcast Pro USB / XLR' },
  { name: 'Mariam K.', product: 'Pack Studio Live Stream 4K + Ring Light Pro' },
  { name: 'Ibrahim B.', product: 'Pack Licence Logiciel : Tunnel Dépliable' }
];
