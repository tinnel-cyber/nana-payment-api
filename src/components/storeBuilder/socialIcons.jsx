import React from 'react';

/**
 * Composants SVG officiels haute-fidélité pour les 10 réseaux sociaux supportés
 * et l'Écosystème NaNa (Silicon Valley / High-Tech Afrique).
 */

export const IconWhatsApp = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden="true">
    <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.3-.778.98-.954 1.18-.175.2-.351.225-.652.075-.3-.15-1.267-.467-2.414-1.49-1.147-1.023-1.921-2.288-2.146-2.674-.226-.386-.024-.595.126-.745.136-.135.301-.351.452-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.677-1.633-.928-2.236-.244-.588-.492-.508-.677-.518l-.578-.01c-.2 0-.526.075-.802.376-.276.3-1.053 1.028-1.053 2.507 0 1.479 1.078 2.908 1.229 3.108.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.716.635.722.23 1.379.197 1.899.12.579-.087 1.78-.727 2.031-1.429.251-.702.251-1.303.176-1.429-.075-.125-.276-.2-.577-.35zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.17L2 22l4.983-1.39A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
  </svg>
);

export const IconTikTok = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97v7.88c.01 1.87-.67 3.73-1.94 5.09-1.37 1.48-3.37 2.3-5.38 2.2-1.98-.06-3.88-.93-5.18-2.42-1.35-1.52-1.97-3.6-1.7-5.63.26-1.94 1.34-3.71 2.97-4.78 1.56-1.03 3.51-1.42 5.34-1.07v4.13c-.92-.3-1.95-.19-2.77.31-.8.47-1.33 1.32-1.41 2.25-.09.97.29 1.95 1.01 2.61.7.67 1.7.97 2.64.79 1.02-.17 1.87-.99 2.06-2 .08-.43.08-.88.08-1.32V.02h.38z" />
  </svg>
);

export const IconFacebook = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export const IconXTwitter = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const IconYouTube = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const IconInstagram = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export const IconLinkedIn = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.27a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
  </svg>
);

export const IconTelegram = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.882-1.077 4.908-1.536 7.106-.195.932-.572 1.244-.938 1.275-.795.069-1.397-.502-2.167-1.007-.942-.619-1.597-.998-2.511-1.603-.996-.659-.35-1.021.217-1.611.148-.154 2.724-2.498 2.774-2.711.006-.027.012-.128-.048-.182-.061-.054-.15-.035-.215-.021-.092.021-1.564.996-4.417 2.923-.418.288-.797.428-1.137.42-.375-.008-1.096-.213-1.632-.387-.658-.214-1.181-.327-1.136-.69.023-.19.286-.385.787-.585 3.08-1.341 5.136-2.227 6.167-2.658 2.934-1.229 3.543-1.442 3.94-1.449.088-.002.283.02.409.123.107.086.136.202.148.283-.004.066-.002.179-.009.287z" />
  </svg>
);

export const IconPinterest = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.368-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);

export const IconQuora = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 4.88 2.909 9.076 7.07 10.957-.046-.421-.07-.852-.07-1.296 0-3.35 1.543-6.257 3.902-8.086C10.375 12.35 10 10.942 10 9.4c0-3.535 2.686-6.4 6-6.4s6 2.865 6 6.4c0 3.393-2.477 6.167-5.617 6.38 1.488 1.258 2.457 3.125 2.585 5.234C19.789 19.387 24 16.095 24 12c0-6.627-5.373-12-12-12zm4 12.6c1.657 0 3-1.433 3-3.2s-1.343-3.2-3-3.2-3 1.433-3 3.2 1.343 3.2 3 3.2z" />
  </svg>
);

// Dictionnaire unifié des 10 réseaux sociaux supportés
export const SOCIAL_NETWORKS_INFO = {
  whatsapp: {
    key: 'whatsapp',
    name: 'WhatsApp',
    color: '#25D366',
    bgColor: '#062013',
    borderColor: '#25D36660',
    icon: IconWhatsApp,
    placeholderProfile: 'https://wa.me/2250700000000',
    defaultShareMessage: 'Découvrez cette offre exceptionnelle sur NaNa :'
  },
  telegram: {
    key: 'telegram',
    name: 'Telegram',
    color: '#229ED9',
    bgColor: '#061726',
    borderColor: '#229ED960',
    icon: IconTelegram,
    placeholderProfile: 'https://t.me/nanacommunity',
    defaultShareMessage: 'Rejoignez le canal officiel et découvrez le funnel :'
  },
  tiktok: {
    key: 'tiktok',
    name: 'TikTok',
    color: '#00f2fe',
    bgColor: '#080811',
    borderColor: '#00f2fe60',
    icon: IconTikTok,
    placeholderProfile: 'https://tiktok.com/@nana_officiel',
    defaultShareMessage: 'Regardez cette pépite sur TikTok :'
  },
  instagram: {
    key: 'instagram',
    name: 'Instagram',
    color: '#E1306C',
    bgColor: '#1d0713',
    borderColor: '#E1306C60',
    icon: IconInstagram,
    placeholderProfile: 'https://instagram.com/nana_afrique',
    defaultShareMessage: 'Suivez nos publications exclusives sur Instagram :'
  },
  facebook: {
    key: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    bgColor: '#061426',
    borderColor: '#1877F260',
    icon: IconFacebook,
    placeholderProfile: 'https://facebook.com/nana.officiel',
    defaultShareMessage: 'Recommandé par notre communauté :'
  },
  x: {
    key: 'x',
    name: 'X (Twitter)',
    color: '#e2e8f0',
    bgColor: '#080c14',
    borderColor: '#94a3b860',
    icon: IconXTwitter,
    placeholderProfile: 'https://x.com/nana_tech',
    defaultShareMessage: '🔥 Opportunité à ne pas manquer :'
  },
  youtube: {
    key: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    bgColor: '#200407',
    borderColor: '#FF000060',
    icon: IconYouTube,
    placeholderProfile: 'https://youtube.com/@nana_afrique',
    defaultShareMessage: 'Abonnez-vous à notre chaîne officielle YouTube :'
  },
  linkedin: {
    key: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    bgColor: '#041527',
    borderColor: '#0A66C260',
    icon: IconLinkedIn,
    placeholderProfile: 'https://linkedin.com/company/nana-tech',
    defaultShareMessage: 'Nouvelle opportunité business & e-commerce en Afrique :'
  },
  pinterest: {
    key: 'pinterest',
    name: 'Pinterest',
    color: '#BD081C',
    bgColor: '#1d0508',
    borderColor: '#BD081C60',
    icon: IconPinterest,
    placeholderProfile: 'https://pinterest.com/nana_creations',
    defaultShareMessage: 'Épinglez cette idée et ce produit tendance :'
  },
  quora: {
    key: 'quora',
    name: 'Quora',
    color: '#B92B27',
    bgColor: '#1c0507',
    borderColor: '#B92B2760',
    icon: IconQuora,
    placeholderProfile: 'https://quora.com/q/nanasore',
    defaultShareMessage: 'Découvrez la réponse complète sur Nanasore :'
  }
};

/**
 * Calcule l'URL de partage pour chaque réseau social
 */
export const getSocialShareUrl = (networkKey, targetUrl, messageText = '') => {
  const currentUrl = targetUrl || (typeof window !== 'undefined' ? window.location.href : 'https://nanasore.com');
  const encUrl = encodeURIComponent(currentUrl);
  const encText = encodeURIComponent(messageText);

  switch (networkKey) {
    case 'whatsapp':
      return `https://api.whatsapp.com/send?text=${encText}%20${encUrl}`;
    case 'telegram':
      return `https://t.me/share/url?url=${encUrl}&text=${encText}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`;
    case 'x':
      return `https://twitter.com/intent/tweet?url=${encUrl}&text=${encText}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`;
    case 'pinterest':
      return `https://pinterest.com/pin/create/button/?url=${encUrl}&description=${encText}`;
    case 'quora':
      return `https://www.quora.com/share?url=${encUrl}`;
    case 'youtube':
    case 'tiktok':
    case 'instagram':
    default:
      return currentUrl;
  }
};
