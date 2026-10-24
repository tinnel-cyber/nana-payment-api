import React from 'react';

/**
 * BIBLIOTHÈQUE D'ICÔNES NANA HAUTE DÉFINITION (DUOTONE PRO)
 * Style : Illustratif, Réaliste & Duotone (Double Couche de Profondeur)
 * Couleur par défaut : Bleu NaNa (#2563eb / #1d4ed8)
 * 11 Catégories Thématiques Officielles
 */

export const DEFAULT_NANA_BLUE = '#2563eb';
export const DEFAULT_NANA_ACCENT = '#93c5fd';

export const NANA_ICON_CATEGORIES = [
  { id: 'all', label: 'Toutes les Icônes', icon: '✨' },
  { id: 'health_wellness', label: 'Santé & Bien-être', icon: '🩺' },
  { id: 'finance_business', label: 'Argent, Finance & Business', icon: '💰' },
  { id: 'tech_dev', label: 'Informatique, Tech & Dév', icon: '💻' },
  { id: 'social_community', label: 'Social & Communauté', icon: '🤝' },
  { id: 'social_logos', label: 'Réseaux Sociaux', icon: '🌐' },
  { id: 'pain_points', label: 'Souffrance & Pain Points', icon: '🩹' },
  { id: 'fitness_sport', label: 'Fitness & Sport', icon: '⚡' },
  { id: 'education_books', label: 'Lecture, Livres & Éducation', icon: '📚' },
  { id: 'music_audio', label: 'Musique & Audio', icon: '🎵' },
  { id: 'law_justice', label: 'Droit, Justice & Légalité', icon: '⚖️' },
  { id: 'nature_sky', label: 'Nature, Eau & Ciel', icon: '🌿' }
];

// Helper pour générer le composant SVG Duotone
const makeSvg = (name, category, pathsFn) => ({
  id: name,
  name,
  category,
  render: ({
    size = 48,
    primaryColor = DEFAULT_NANA_BLUE,
    secondaryColor = DEFAULT_NANA_ACCENT,
    className = ''
  }) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`shrink-0 transition-transform duration-200 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {pathsFn({ primaryColor, secondaryColor })}
    </svg>
  )
});

export const NANA_ICONS_LIST = [
  // ==========================================================================
  // 1. SANTÉ & BIEN-ÊTRE (health_wellness)
  // ==========================================================================
  makeSvg('Stéthoscope Médical', 'health_wellness', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M5 4v6a7 7 0 0 0 14 0V4"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 17v2a3 3 0 0 0 6 0v-2"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="18" cy="17" r="2.5" fill={secondaryColor} fillOpacity="0.4" stroke={primaryColor} strokeWidth="1.8" />
      <circle cx="5" cy="4" r="1.5" fill={primaryColor} />
      <circle cx="19" cy="4" r="1.5" fill={primaryColor} />
    </>
  )),

  makeSvg('Cœur & Rythme Vital', 'health_wellness', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"
        fill={secondaryColor}
        fillOpacity="0.25"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 13h3l2-3.5 3 7 2-4.5 2 2h6"
        stroke={primaryColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  )),

  makeSvg('Feuille Médicinale Bio', 'health_wellness', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M5 21C5 21 7 13 14 7C17.5 4 21 3 21 3C21 3 20 6.5 17 10C11 17 5 21 5 21Z"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 21c4-4 8-7 12-11" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 13c2 0 4-1 5-3" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" />
    </>
  )),

  makeSvg('Pilule & Gélule Soin', 'health_wellness', ({ primaryColor, secondaryColor }) => (
    <>
      <rect
        x="5.5"
        y="8.5"
        width="13"
        height="7"
        rx="3.5"
        transform="rotate(-45 12 12)"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <circle cx="15" cy="9" r="1" fill={primaryColor} />
    </>
  )),

  makeSvg('Croix Premier Secours', 'health_wellness', ({ primaryColor, secondaryColor }) => (
    <>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        fill={secondaryColor}
        fillOpacity="0.25"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <path
        d="M12 7v10M7 12h10"
        stroke={primaryColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </>
  )),

  // ==========================================================================
  // 2. ARGENT, FINANCE & BUSINESS (finance_business)
  // ==========================================================================
  makeSvg('Billet Banque FCFA', 'finance_business', ({ primaryColor, secondaryColor }) => (
    <>
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="3"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3" stroke={primaryColor} strokeWidth="1.8" fill={secondaryColor} fillOpacity="0.5" />
      <path d="M6 9h.01M18 15h.01" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
    </>
  )),

  makeSvg('Portefeuille Mobile Money', 'finance_business', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3V7Z"
        fill={secondaryColor}
        fillOpacity="0.4"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <path
        d="M3 9v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9H3Z"
        fill={secondaryColor}
        fillOpacity="0.2"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <path
        d="M17 12h4v4h-4a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2Z"
        fill={secondaryColor}
        fillOpacity="0.5"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <circle cx="18.5" cy="14" r="1" fill={primaryColor} />
    </>
  )),

  makeSvg('Coffre-Fort Haute Sécurité', 'finance_business', ({ primaryColor, secondaryColor }) => (
    <>
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="3"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4" stroke={primaryColor} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.5" fill={primaryColor} />
      <path d="M12 8v2M12 14v2M8 12h2M14 12h2" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
    </>
  )),

  makeSvg('Graphique Croissance Exponentielle', 'finance_business', ({ primaryColor, secondaryColor }) => (
    <>
      <path d="M3 20h18" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 4v16" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M4 16l5-6 4 4 7-9"
        stroke={primaryColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon points="16,5 20,5 20,9" fill={primaryColor} />
      <path
        d="M4 16l5-6 4 4 7-9v9H4z"
        fill={secondaryColor}
        fillOpacity="0.25"
      />
    </>
  )),

  makeSvg('Carte Bancaire Gold VIP', 'finance_business', ({ primaryColor, secondaryColor }) => (
    <>
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="3"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <path d="M2 10h20" stroke={primaryColor} strokeWidth="2" />
      <rect x="5" y="13" width="4" height="3" rx="1" fill={primaryColor} />
      <circle cx="17" cy="14.5" r="1.5" fill={primaryColor} />
    </>
  )),

  // ==========================================================================
  // 3. INFORMATIQUE, TECH & DÉVELOPPEMENT (tech_dev)
  // ==========================================================================
  makeSvg('Écran Ordinateur & Code', 'tech_dev', ({ primaryColor, secondaryColor }) => (
    <>
      <rect
        x="3"
        y="4"
        width="18"
        height="12"
        rx="2"
        fill={secondaryColor}
        fillOpacity="0.25"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <path d="M8 20h8M12 16v4" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 8.5L6.5 10l2 1.5M15.5 8.5l2 1.5-2 1.5M13 8l-2 4" stroke={primaryColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )),

  makeSvg('Terminal & Serveur Cloud', 'tech_dev', ({ primaryColor, secondaryColor }) => (
    <>
      <rect
        x="3"
        y="4"
        width="18"
        height="6"
        rx="2"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <rect
        x="3"
        y="14"
        width="18"
        height="6"
        rx="2"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <circle cx="6" cy="7" r="1" fill={primaryColor} />
      <circle cx="6" cy="17" r="1" fill={primaryColor} />
      <line x1="9" y1="7" x2="15" y2="7" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="17" x2="15" y2="17" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" />
    </>
  )),

  makeSvg('Puce Processeur IA', 'tech_dev', ({ primaryColor, secondaryColor }) => (
    <>
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="2"
        fill={secondaryColor}
        fillOpacity="0.35"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.5" fill={primaryColor} />
    </>
  )),

  makeSvg('Smartphone Pro Hybride', 'tech_dev', ({ primaryColor, secondaryColor }) => (
    <>
      <rect
        x="6"
        y="2"
        width="12"
        height="20"
        rx="3"
        fill={secondaryColor}
        fillOpacity="0.25"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <line x1="10" y1="5" x2="14" y2="5" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="18" r="1" fill={primaryColor} />
    </>
  )),

  makeSvg('Base de Données Blockchain', 'tech_dev', ({ primaryColor, secondaryColor }) => (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" fill={secondaryColor} fillOpacity="0.4" stroke={primaryColor} strokeWidth="1.8" />
      <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" stroke={primaryColor} strokeWidth="1.8" />
      <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke={primaryColor} strokeWidth="1.8" />
    </>
  )),

  // ==========================================================================
  // 4. SOCIAL & COMMUNAUTÉ (social_community)
  // ==========================================================================
  makeSvg('Poignée de Main Partenaire', 'social_community', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M2 11l4-4 5 5 3-3 6 6"
        stroke={primaryColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 17l4 4 8-8-3-3"
        stroke={primaryColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="8" fill={secondaryColor} fillOpacity="0.2" stroke={primaryColor} strokeWidth="1.5" />
    </>
  )),

  makeSvg('Groupe & Équipe Unie', 'social_community', ({ primaryColor, secondaryColor }) => (
    <>
      <circle cx="9" cy="7" r="3" fill={secondaryColor} fillOpacity="0.4" stroke={primaryColor} strokeWidth="1.8" />
      <circle cx="16" cy="9" r="2.5" fill={secondaryColor} fillOpacity="0.4" stroke={primaryColor} strokeWidth="1.8" />
      <path d="M3 19c0-3 3-5 6-5s6 2 6 5" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 15.5c2 0 4.5 1 4.5 3.5" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
    </>
  )),

  makeSvg('Bulle Discussion Active', 'social_community', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="12" r="1" fill={primaryColor} />
      <circle cx="12" cy="12" r="1" fill={primaryColor} />
      <circle cx="16" cy="12" r="1" fill={primaryColor} />
    </>
  )),

  makeSvg('Médaille Ambassadeur VIP', 'social_community', ({ primaryColor, secondaryColor }) => (
    <>
      <circle cx="12" cy="9" r="6" fill={secondaryColor} fillOpacity="0.35" stroke={primaryColor} strokeWidth="1.8" />
      <polygon points="12,5.5 13.5,8.5 16.5,8.5 14,10.5 15,13.5 12,11.5 9,13.5 10,10.5 7.5,8.5 10.5,8.5" fill={primaryColor} />
      <path d="M8.5 14L6 22l6-3 6 3-2.5-8" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )),

  makeSvg('Cœur Entraide Solidaire', 'social_community', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M12 6c-3-3-8 0-8 4 0 5 8 10 8 10s8-5 8-10c0-4-5-7-8-4z"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 11h10M12 8v6" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
    </>
  )),

  // ==========================================================================
  // 5. RÉSEAUX SOCIAUX - LOGOS (social_logos)
  // ==========================================================================
  makeSvg('WhatsApp Direct Client', 'social_logos', ({ primaryColor, secondaryColor }) => (
    <>
      <circle cx="12" cy="12" r="9" fill={secondaryColor} fillOpacity="0.3" stroke={primaryColor} strokeWidth="1.8" />
      <path
        d="M16 14.5c-.2.5-1.2 1-1.6 1.1-.4 0-.9.2-2.7-.6-2.2-1-3.6-3.2-3.7-3.4-.1-.1-.9-1.2-.9-2.3 0-1.1.6-1.6.8-1.8.2-.2.5-.3.7-.3h.5c.2 0 .4.1.6.4.2.5.7 1.7.8 1.8.1.1.1.3 0 .5-.1.1-.2.3-.3.4-.1.1-.2.3-.1.5.2.4.8 1.4 1.7 2.1 1.2.9 2.1 1.2 2.5 1.4.2.1.4.1.6-.1.2-.2.8-.9 1-1.2.2-.3.4-.3.6-.2.2.1 1.4.7 1.6.8.2.1.4.2.4.3.1.3 0 1-.2 1.5z"
        fill={primaryColor}
      />
    </>
  )),

  makeSvg('YouTube Vidéo Masterclass', 'social_logos', ({ primaryColor, secondaryColor }) => (
    <>
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="4"
        fill={secondaryColor}
        fillOpacity="0.35"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <polygon points="10,8.5 16,12 10,15.5" fill={primaryColor} />
    </>
  )),

  makeSvg('TikTok Viral Short', 'social_logos', ({ primaryColor, secondaryColor }) => (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" fill={secondaryColor} fillOpacity="0.25" stroke={primaryColor} strokeWidth="1.8" />
      <path
        d="M14 6v6.5a3.5 3.5 0 1 1-3.5-3.5"
        stroke={primaryColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M14 6c1 2 2.5 3 4.5 3" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
    </>
  )),

  makeSvg('Facebook Pro Community', 'social_logos', ({ primaryColor, secondaryColor }) => (
    <>
      <circle cx="12" cy="12" r="9" fill={secondaryColor} fillOpacity="0.3" stroke={primaryColor} strokeWidth="1.8" />
      <path
        d="M13.5 8H15V5h-2.5C10.5 5 9.5 6.2 9.5 8.5V11H7v3h2.5v7h3.5v-7h2.5l.5-3h-3V8.5c0-.8.4-1.2 1-1.2z"
        fill={primaryColor}
      />
    </>
  )),

  makeSvg('Instagram Reels & Shop', 'social_logos', ({ primaryColor, secondaryColor }) => (
    <>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4" stroke={primaryColor} strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.2" fill={primaryColor} />
    </>
  )),

  makeSvg('LinkedIn Réseau B2B', 'social_logos', ({ primaryColor, secondaryColor }) => (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" fill={secondaryColor} fillOpacity="0.3" stroke={primaryColor} strokeWidth="1.8" />
      <rect x="6.5" y="10" width="2.5" height="7.5" fill={primaryColor} />
      <circle cx="7.75" cy="7" r="1.25" fill={primaryColor} />
      <path d="M12 10v7.5M12 13.5c.5-1.5 2-2 3.5-2s2.5.8 2.5 2.5v3.5" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
    </>
  )),

  // ==========================================================================
  // 6. SOUFFRANCE & POINTS DE DOULEUR (pain_points)
  // ==========================================================================
  makeSvg('Pansement Urgence & Secours', 'pain_points', ({ primaryColor, secondaryColor }) => (
    <>
      <rect
        x="3"
        y="9"
        width="18"
        height="6"
        rx="3"
        transform="rotate(45 12 12)"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <rect
        x="3"
        y="9"
        width="18"
        height="6"
        rx="3"
        transform="rotate(-45 12 12)"
        fill={secondaryColor}
        fillOpacity="0.4"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="1" fill={primaryColor} />
    </>
  )),

  makeSvg('Nuage Orageux & Stress Client', 'pain_points', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M17.5 19H6.5A4.5 4.5 0 0 1 6.5 10c.2 0 .4 0 .6.1A6 6 0 0 1 18 11.2a3.5 3.5 0 0 1-.5 7.8Z"
        fill={secondaryColor}
        fillOpacity="0.35"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M13 15l-3 4h3l-2 4" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )),

  makeSvg('Flamme Alerte Rouge', 'pain_points', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="12" y1="13" x2="12" y2="16" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="18" r="1" fill={primaryColor} />
    </>
  )),

  makeSvg('Chronomètre Perte de Temps', 'pain_points', ({ primaryColor, secondaryColor }) => (
    <>
      <circle cx="12" cy="13" r="8" fill={secondaryColor} fillOpacity="0.3" stroke={primaryColor} strokeWidth="1.8" />
      <path d="M12 9v4l3 2" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 5V2M10 2h4" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
    </>
  )),

  makeSvg('Chaîne Brute / Blocage Vente', 'pain_points', ({ primaryColor, secondaryColor }) => (
    <>
      <rect x="3" y="10" width="8" height="4" rx="2" stroke={primaryColor} strokeWidth="1.8" fill={secondaryColor} fillOpacity="0.3" />
      <rect x="13" y="10" width="8" height="4" rx="2" stroke={primaryColor} strokeWidth="1.8" fill={secondaryColor} fillOpacity="0.3" />
      <line x1="9" y1="12" x2="15" y2="12" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
    </>
  )),

  // ==========================================================================
  // 7. FITNESS & SPORT (fitness_sport)
  // ==========================================================================
  makeSvg('Haltère Musculation Pro', 'fitness_sport', ({ primaryColor, secondaryColor }) => (
    <>
      <path d="M6 7v10M18 7v10" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M3 9v6M21 9v6" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <rect x="6" y="11" width="12" height="2" rx="1" fill={secondaryColor} stroke={primaryColor} strokeWidth="1.8" />
    </>
  )),

  makeSvg('Flamme Brûleur Calories', 'fitness_sport', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M12 2c1 3 4 5 4 9a6 6 0 1 1-12 0c0-4 3-6 4-9l4 0z"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 12c.5 1 2 2 2 4a3 3 0 1 1-6 0c0-2 1.5-3 2-4l2 0z" fill={primaryColor} />
    </>
  )),

  makeSvg('Chronomètre Performance', 'fitness_sport', ({ primaryColor, secondaryColor }) => (
    <>
      <circle cx="12" cy="14" r="7" fill={secondaryColor} fillOpacity="0.3" stroke={primaryColor} strokeWidth="1.8" />
      <path d="M12 11v3l2 2" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 7V4M10 4h4M17 8l1.5-1.5" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
    </>
  )),

  makeSvg('Basket Running Vitesse', 'fitness_sport', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M4 17h16c-1-3-3-5-6-6l-2-3H8L5 13l-1 4z"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <line x1="3" y1="19" x2="21" y2="19" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="11" x2="11" y2="14" stroke={primaryColor} strokeWidth="1.5" />
    </>
  )),

  makeSvg('Coupe Trophée Vainqueur', 'fitness_sport', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M6 3h12v6a6 6 0 0 1-12 0V3z"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <path d="M6 5H3a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1" stroke={primaryColor} strokeWidth="1.8" />
      <path d="M18 5h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1" stroke={primaryColor} strokeWidth="1.8" />
      <path d="M12 15v3M8 21h8" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
      <polygon points="12,6 13,8 15,8 13.5,9.5 14,11.5 12,10 10,11.5 10.5,9.5 9,8 11,8" fill={primaryColor} />
    </>
  )),

  // ==========================================================================
  // 8. LECTURE, LIVRES & ÉDUCATION (education_books)
  // ==========================================================================
  makeSvg('Livre Ouvert Savoir', 'education_books', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M2 5c4 0 7-1 10-3 3 2 6 3 10 3v13c-4 0-7-1-10-3-3 2-6 3-10 3V5z"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 2v16" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
    </>
  )),

  makeSvg('Toque Diplôme Académie', 'education_books', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M12 3L2 8l10 5 10-5-10-5z"
        fill={secondaryColor}
        fillOpacity="0.35"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M6 10.5V16c0 2.5 2.7 4.5 6 4.5s6-2 6-4.5v-5.5" stroke={primaryColor} strokeWidth="1.8" />
      <path d="M22 8v7" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
    </>
  )),

  makeSvg('Manuel & Guide Stratégique', 'education_books', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M4 19.5C4 18 5.5 17 7 17H20V3H7C5.5 3 4 4 4 5.5V19.5z"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <path d="M4 19.5C4 20.9 5.1 22 6.5 22H20" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 7h8M8 11h6" stroke={primaryColor} strokeWidth="1.6" strokeLinecap="round" />
    </>
  )),

  makeSvg('Ampoule Idée Géniale', 'education_books', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M9 18h6M10 21h4M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="9" r="1.5" fill={primaryColor} />
    </>
  )),

  makeSvg('Certificat Authentifié Sceau', 'education_books', ({ primaryColor, secondaryColor }) => (
    <>
      <rect
        x="3"
        y="3"
        width="18"
        height="14"
        rx="2"
        fill={secondaryColor}
        fillOpacity="0.25"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <path d="M6 7h8M6 10h6" stroke={primaryColor} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16" cy="15" r="3.5" fill={secondaryColor} fillOpacity="0.5" stroke={primaryColor} strokeWidth="1.8" />
      <path d="M15 18l-1 4 2-1 2 1-1-4" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )),

  // ==========================================================================
  // 9. MUSIQUE & AUDIO (music_audio)
  // ==========================================================================
  makeSvg('Casque Studio Audio', 'music_audio', ({ primaryColor, secondaryColor }) => (
    <>
      <path d="M3 14h3v6H3zM18 14h3v6h-3z" fill={secondaryColor} fillOpacity="0.4" stroke={primaryColor} strokeWidth="1.8" />
      <path d="M3 14v-3a9 9 0 0 1 18 0v3" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
    </>
  )),

  makeSvg('Note Musique Mélodie', 'music_audio', ({ primaryColor, secondaryColor }) => (
    <>
      <circle cx="6" cy="18" r="3" fill={secondaryColor} fillOpacity="0.4" stroke={primaryColor} strokeWidth="1.8" />
      <circle cx="18" cy="15" r="3" fill={secondaryColor} fillOpacity="0.4" stroke={primaryColor} strokeWidth="1.8" />
      <path d="M9 18V6l12-3v12" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 9l12-3" stroke={primaryColor} strokeWidth="1.8" />
    </>
  )),

  makeSvg('Microphone Enregistrement', 'music_audio', ({ primaryColor, secondaryColor }) => (
    <>
      <rect x="9" y="2" width="6" height="11" rx="3" fill={secondaryColor} fillOpacity="0.35" stroke={primaryColor} strokeWidth="1.8" />
      <path d="M5 10a7 7 0 0 0 14 0" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8" y1="21" x2="16" y2="21" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
    </>
  )),

  makeSvg('Onde Sonore Podcast', 'music_audio', ({ primaryColor, secondaryColor }) => (
    <>
      <line x1="3" y1="10" x2="3" y2="14" stroke={primaryColor} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="7" y1="6" x2="7" y2="18" stroke={primaryColor} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="11" y1="3" x2="11" y2="21" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="15" y1="7" x2="15" y2="17" stroke={primaryColor} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="19" y1="11" x2="19" y2="13" stroke={primaryColor} strokeWidth="2.2" strokeLinecap="round" />
    </>
  )),

  makeSvg('Disque Vinyle DJ', 'music_audio', ({ primaryColor, secondaryColor }) => (
    <>
      <circle cx="12" cy="12" r="9" fill={secondaryColor} fillOpacity="0.25" stroke={primaryColor} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="5" stroke={primaryColor} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2" fill={primaryColor} />
    </>
  )),

  // ==========================================================================
  // 10. DROIT, JUSTICE & LÉGALITÉ (law_justice)
  // ==========================================================================
  makeSvg('Balance de Justice Équitable', 'law_justice', ({ primaryColor, secondaryColor }) => (
    <>
      <line x1="12" y1="3" x2="12" y2="21" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="7" x2="20" y2="7" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <path d="M4 7l-2 6h8l-2-6" fill={secondaryColor} fillOpacity="0.3" stroke={primaryColor} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M20 7l-2 6h8l-2-6" fill={secondaryColor} fillOpacity="0.3" stroke={primaryColor} strokeWidth="1.6" strokeLinejoin="round" />
      <line x1="8" y1="21" x2="16" y2="21" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
    </>
  )),

  makeSvg('Marteau du Juge Légal', 'law_justice', ({ primaryColor, secondaryColor }) => (
    <>
      <rect x="2" y="6" width="10" height="5" rx="1.5" transform="rotate(-45 7 8.5)" fill={secondaryColor} fillOpacity="0.35" stroke={primaryColor} strokeWidth="1.8" />
      <line x1="10.5" y1="12" x2="19" y2="20.5" stroke={primaryColor} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="3" y1="21" x2="11" y2="21" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
    </>
  )),

  makeSvg('Parchemin Contrat Officiel', 'law_justice', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M19 20H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9l6 6v9a2 2 0 0 1-2 2z"
        fill={secondaryColor}
        fillOpacity="0.25"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <polyline points="14,3 14,9 20,9" stroke={primaryColor} strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="7" y1="13" x2="15" y2="13" stroke={primaryColor} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="7" y1="16" x2="12" y2="16" stroke={primaryColor} strokeWidth="1.6" strokeLinecap="round" />
    </>
  )),

  makeSvg('Sceau Juridique Cire', 'law_justice', ({ primaryColor, secondaryColor }) => (
    <>
      <circle cx="12" cy="10" r="7" fill={secondaryColor} fillOpacity="0.35" stroke={primaryColor} strokeWidth="1.8" />
      <path d="M12 6.5v7M8.5 10h7" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <path d="M9 16l-2 6 5-2.5 5 2.5-2-6" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )),

  makeSvg('Bouclier Protection Droit', 'law_justice', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M12 2l8 3v6c0 5.5-3.5 10.7-8 12-4.5-1.3-8-6.5-8-12V5l8-3z"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke={primaryColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )),

  // ==========================================================================
  // 11. NATURE, EAU & CIEL (nature_sky)
  // ==========================================================================
  makeSvg('Goutte d\'Eau Pure Hydratation', 'nature_sky', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        fill={secondaryColor}
        fillOpacity="0.35"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="14" r="1.5" fill={primaryColor} />
    </>
  )),

  makeSvg('Feuille Écologie Verte', 'nature_sky', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M11 20A7 7 0 0 1 4 13C4 7 11 3 20 3c0 9-4 16-9 17z"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
      />
      <path d="M4 20c4-4 8-8 12-12" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
    </>
  )),

  makeSvg('Soleil Levant Énergie', 'nature_sky', ({ primaryColor, secondaryColor }) => (
    <>
      <circle cx="12" cy="12" r="5" fill={secondaryColor} fillOpacity="0.4" stroke={primaryColor} strokeWidth="1.8" />
      <line x1="12" y1="1" x2="12" y2="3" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="21" x2="12" y2="23" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="1" y1="12" x2="3" y2="12" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="21" y1="12" x2="23" y2="12" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
    </>
  )),

  makeSvg('Montagne Sommet Excellence', 'nature_sky', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M2 20h20L15 6l-4 6-3-4-6 12z"
        fill={secondaryColor}
        fillOpacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <polyline points="15,6 13,10 16,11 15,6" fill={primaryColor} />
    </>
  )),

  makeSvg('Nuage Ciel Pureté', 'nature_sky', ({ primaryColor, secondaryColor }) => (
    <>
      <path
        d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
        fill={secondaryColor}
        fillOpacity="0.35"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </>
  ))
];

/**
 * Fonction utilitaire pour retrouver une icône par son nom/ID
 */
export const getNanaIconById = (idOrName) => {
  return NANA_ICONS_LIST.find(
    (icon) => icon.id === idOrName || icon.name === idOrName
  ) || NANA_ICONS_LIST[0];
};

/**
 * Rendu dynamique d'une icône NaNa Duotone
 */
export const renderNanaDuotoneIcon = (idOrName, props = {}) => {
  const icon = getNanaIconById(idOrName);
  return icon.render(props);
};
