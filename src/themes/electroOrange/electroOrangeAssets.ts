// =========================================================================
// ASSETS VECTORIELS HAUTE FIDÉLITÉ - THÈME ELECTRO ORANGE (100% AUTONOMES)
// =========================================================================

/**
 * 1. Duo de Montres Connectées (Smartwatch Duo) - Visuel Phare du Hero Slide 1
 * Conforme à l'Image 1 : Montre Sportive Blanche avec Cadran Numérique Circulaire Vert Néon
 * et Montre Habillée Noire en Cuir avec Chronographe à Aiguilles.
 */
export const ELECTRO_SMARTWATCH_DUO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 560" width="700" height="560">
  <defs>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="25" stdDeviation="30" flood-color="%231E293B" flood-opacity="0.22"/>
    </filter>
    <radialGradient id="silverBezel" cx="35%" cy="35%" r="70%">
      <stop offset="0%" stop-color="%23FFFFFF"/>
      <stop offset="40%" stop-color="%23E2E8F0"/>
      <stop offset="70%" stop-color="%2394A3B8"/>
      <stop offset="100%" stop-color="%2364748B"/>
    </radialGradient>
    <radialGradient id="blackBezel" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="%23334155"/>
      <stop offset="60%" stop-color="%230F172A"/>
      <stop offset="100%" stop-color="%23020617"/>
    </radialGradient>
    <linearGradient id="whiteStrap" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%23E2E8F0"/>
      <stop offset="30%" stop-color="%23F8FAFC"/>
      <stop offset="70%" stop-color="%23FFFFFF"/>
      <stop offset="100%" stop-color="%23CBD5E1"/>
    </linearGradient>
    <linearGradient id="blackLeather" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%231E293B"/>
      <stop offset="50%" stop-color="%230F172A"/>
      <stop offset="100%" stop-color="%23020617"/>
    </linearGradient>
  </defs>

  <!-- MONTRE 2 : ARRIÈRE-PLAN DROITE (MONTRE NOIRE EN CUIR LUXE) -->
  <g transform="translate(320, 20)" filter="url(%23softShadow)">
    <!-- Bracelet Cuir Noir Haut -->
    <path d="M 70 -10 L 70 120 Q 150 130 230 120 L 230 -10 Z" fill="url(%23blackLeather)"/>
    <!-- Surpiqûres blanches du cuir -->
    <path d="M 80 -10 L 80 115" stroke="%2364748B" stroke-dasharray="5,4" stroke-width="1.5"/>
    <path d="M 220 -10 L 220 115" stroke="%2364748B" stroke-dasharray="5,4" stroke-width="1.5"/>

    <!-- Bracelet Cuir Noir Bas -->
    <path d="M 70 380 Q 150 370 230 380 L 230 540 L 70 540 Z" fill="url(%23blackLeather)"/>
    <path d="M 80 385 L 80 540" stroke="%2364748B" stroke-dasharray="5,4" stroke-width="1.5"/>
    <path d="M 220 385 L 220 540" stroke="%2364748B" stroke-dasharray="5,4" stroke-width="1.5"/>

    <!-- Boîtier Métal Noir Brossé avec Encoches -->
    <circle cx="150" cy="250" r="160" fill="url(%23blackBezel)"/>
    <circle cx="150" cy="250" r="150" fill="%230B111E"/>
    <!-- Couronne crantée extérieure -->
    <circle cx="150" cy="250" r="142" fill="none" stroke="%231E293B" stroke-width="6" stroke-dasharray="6,4"/>

    <!-- Cadran Noir Profond -->
    <circle cx="150" cy="250" r="132" fill="%23020617"/>
    
    <!-- Index des heures Luminescents -->
    <g stroke="%23F8FAFC" stroke-width="2.5" opacity="0.85">
      <line x1="150" y1="130" x2="150" y2="145"/>
      <line x1="150" y1="355" x2="150" y2="370"/>
      <line x1="30" y1="250" x2="45" y2="250"/>
      <line x1="255" y1="250" x2="270" y2="250"/>
      <line x1="235" y1="165" x2="225" y2="175"/>
      <line x1="65" y1="335" x2="75" y2="325"/>
    </g>

    <!-- Sous-Cadrans Chronographe (Compteur de pas, Date, Batterie) -->
    <!-- Sous-cadran haut : Batterie -->
    <circle cx="150" cy="195" r="28" fill="%230F172A" stroke="%23334155" stroke-width="1.5"/>
    <rect x="144" y="185" width="12" height="20" rx="2" fill="none" stroke="%2394A3B8" stroke-width="1.5"/>
    <rect x="146" y="193" width="8" height="10" rx="1" fill="%2310B981"/>

    <!-- Sous-cadran droite : Date 28 -->
    <circle cx="215" cy="250" r="24" fill="%230F172A" stroke="%23334155" stroke-width="1.5"/>
    <text x="215" y="255" font-family="Arial" font-size="13" font-weight="bold" fill="%23FFFFFF" text-anchor="middle">28</text>

    <!-- Sous-cadran bas : Pas & Cardio -->
    <circle cx="150" cy="305" r="28" fill="%230F172A" stroke="%23334155" stroke-width="1.5"/>
    <path d="M 144 300 Q 150 294 156 300 L 150 312 Z" fill="%23EF4444"/>

    <!-- Aiguilles Blanches et Trottinette Rouge -->
    <line x1="150" y1="250" x2="120" y2="180" stroke="%23F8FAFC" stroke-width="5" stroke-linecap="round"/>
    <line x1="150" y1="250" x2="210" y2="210" stroke="%23F8FAFC" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="150" y1="260" x2="150" y2="150" stroke="%23EF4444" stroke-width="2" stroke-linecap="round"/>
    <circle cx="150" cy="250" r="5" fill="%23EF4444"/>
  </g>

  <!-- MONTRE 1 : PREMIER PLAN GAUCHE (MONTRE ARGENT SPORT BRACELET BLANC) -->
  <g transform="translate(20, 10)" filter="url(%23softShadow)">
    <!-- Bracelet Sport Blanc Haut (Ergonomique) -->
    <path d="M 80 -10 Q 75 90 60 140 Q 160 155 260 140 Q 245 90 240 -10 Z" fill="url(%23whiteStrap)"/>
    <!-- Bracelet Sport Blanc Bas -->
    <path d="M 60 360 Q 160 345 260 360 Q 245 420 235 550 L 85 550 Q 75 420 60 360 Z" fill="url(%23whiteStrap)"/>

    <!-- Boîtier Métal Argenté Courbé Luxe -->
    <circle cx="160" cy="250" r="165" fill="url(%23silverBezel)"/>
    <circle cx="160" cy="250" r="150" fill="%230B132A"/>

    <!-- Bouton Poussoir Couronne Argentée à droite -->
    <rect x="320" y="232" width="16" height="36" rx="4" fill="url(%23silverBezel)"/>

    <!-- Anneau Vert Émeraude / Cyan Néon (La signature visuelle de l'image 1) -->
    <circle cx="160" cy="250" r="138" fill="none" stroke="%2310B981" stroke-width="12" stroke-linecap="round"/>
    <circle cx="160" cy="250" r="138" fill="none" stroke="%2334D399" stroke-width="3"/>

    <!-- Écran Intérieur Noir Pur -->
    <circle cx="160" cy="250" r="126" fill="%23020617"/>

    <!-- Indicateur d'Étape Vert Néon (Petit Cercle 28) -->
    <circle cx="230" cy="250" r="16" fill="%23064E3B" stroke="%2310B981" stroke-width="1.5"/>
    <text x="230" y="254" font-family="Arial" font-size="10.5" font-weight="bold" fill="%2334D399" text-anchor="middle">28</text>

    <!-- Aiguilles Minimalistes Blanches Phosphorescentes -->
    <line x1="160" y1="250" x2="85" y2="190" stroke="%23FFFFFF" stroke-width="8" stroke-linecap="round"/>
    <line x1="160" y1="250" x2="225" y2="150" stroke="%23FFFFFF" stroke-width="6" stroke-linecap="round"/>
    
    <!-- Aiguille Trottinette Rouge Vif -->
    <line x1="160" y1="265" x2="160" y2="135" stroke="%23FF6A00" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="160" cy="250" r="6" fill="%23FF6A00"/>
    <circle cx="160" cy="250" r="2" fill="%23FFFFFF"/>
  </g>
</svg>`;

/**
 * 2. Casque Audio Hi-Fi Wireless (Hero Slide 2)
 * Conforme à l'Image 4 : Casque Rose Gold & Blanc Haute Définition.
 */
export const ELECTRO_HEADPHONES_HERO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500">
  <defs>
    <filter id="headphoneShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="25" flood-color="%23000000" flood-opacity="0.2"/>
    </filter>
    <linearGradient id="roseGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23FBCFE8"/>
      <stop offset="30%" stop-color="%23F472B6"/>
      <stop offset="70%" stop-color="%23DB2777"/>
      <stop offset="100%" stop-color="%239D174D"/>
    </linearGradient>
    <linearGradient id="cushionWhite" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%23E2E8F0"/>
      <stop offset="50%" stop-color="%23FFFFFF"/>
      <stop offset="100%" stop-color="%23CBD5E1"/>
    </linearGradient>
  </defs>

  <g transform="translate(60, 20)" filter="url(%23headphoneShadow)">
    <!-- Arceau Blanc Ergonomique Épuré -->
    <path d="M 120 300 C 100 120 380 120 360 300" fill="none" stroke="%23F1F5F9" stroke-width="48" stroke-linecap="round"/>
    <path d="M 120 300 C 100 120 380 120 360 300" fill="none" stroke="url(%23roseGold)" stroke-width="12" stroke-linecap="round"/>

    <!-- Écouteur Gauche (Face Rose Gold) -->
    <g transform="translate(70, 250)">
      <ellipse cx="40" cy="80" rx="36" ry="68" fill="url(%23cushionWhite)"/>
      <ellipse cx="52" cy="80" rx="32" ry="58" fill="url(%23roseGold)"/>
      <circle cx="52" cy="80" r="22" fill="%23BE185D" opacity="0.4"/>
      <circle cx="52" cy="80" r="14" fill="url(%23roseGold)"/>
    </g>

    <!-- Écouteur Droit (Profil Rose Gold) -->
    <g transform="translate(320, 250)">
      <ellipse cx="40" cy="80" rx="36" ry="68" fill="url(%23cushionWhite)"/>
      <ellipse cx="28" cy="80" rx="32" ry="58" fill="url(%23roseGold)"/>
      <circle cx="28" cy="80" r="22" fill="%23BE185D" opacity="0.4"/>
      <circle cx="28" cy="80" r="14" fill="url(%23roseGold)"/>
    </g>
  </g>
</svg>`;

/**
 * 3. Les 4 Mini-Bannières sous le Hero (Image 2)
 */

// Mini-Banner 1 : Caméra Photo Numérique Haute Résolution
export const ELECTRO_CAMERA_MINI_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">
  <defs>
    <linearGradient id="camBody" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%23FFFFFF"/>
      <stop offset="100%" stop-color="%23E2E8F0"/>
    </linearGradient>
    <radialGradient id="camLens" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="%2338BDF8"/>
      <stop offset="40%" stop-color="%230284C7"/>
      <stop offset="80%" stop-color="%230F172A"/>
      <stop offset="100%" stop-color="%23020617"/>
    </radialGradient>
  </defs>
  <rect x="25" y="35" width="150" height="85" rx="10" fill="url(%23camBody)" stroke="%23CBD5E1" stroke-width="2"/>
  <rect x="40" y="24" width="35" height="12" rx="3" fill="%2394A3B8"/>
  <circle cx="110" cy="78" r="38" fill="%23475569" stroke="%23E2E8F0" stroke-width="3"/>
  <circle cx="110" cy="78" r="30" fill="url(%23camLens)"/>
  <circle cx="102" cy="70" r="8" fill="%23FFFFFF" opacity="0.6"/>
  <circle cx="48" cy="48" r="5" fill="%23EF4444"/>
</svg>`;

// Mini-Banner 2 : Ordinateur Portable & Tablette Hybride
export const ELECTRO_LAPTOP_MINI_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">
  <defs>
    <linearGradient id="screenGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%230284C7"/>
      <stop offset="50%" stop-color="%2338BDF8"/>
      <stop offset="100%" stop-color="%23F43F5E"/>
    </linearGradient>
  </defs>
  <!-- Écran ouvert incliné -->
  <path d="M 45 30 L 155 30 L 165 95 L 35 95 Z" fill="%230F172A" rx="4"/>
  <path d="M 50 36 L 150 36 L 159 90 L 41 90 Z" fill="url(%23screenGlow)"/>
  <!-- Clavier fin métal -->
  <path d="M 30 96 L 170 96 L 180 115 L 20 115 Z" fill="%23E2E8F0" stroke="%23CBD5E1" stroke-width="1.5"/>
  <rect x="80" y="102" width="40" height="8" rx="2" fill="%2394A3B8"/>
</svg>`;

// Mini-Banner 3 : Tour PC Desktop Gamer
export const ELECTRO_DESKTOP_MINI_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">
  <defs>
    <linearGradient id="rgbTower" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23FF6A00"/>
      <stop offset="50%" stop-color="%238B5CF6"/>
      <stop offset="100%" stop-color="%2306B6D4"/>
    </linearGradient>
  </defs>
  <!-- Tour PC Noir & Vitre Trempée -->
  <rect x="65" y="20" width="70" height="100" rx="6" fill="%230F172A" stroke="%23334155" stroke-width="2"/>
  <rect x="75" y="30" width="50" height="60" rx="3" fill="%23020617"/>
  <!-- Composants RGB -->
  <circle cx="100" cy="55" r="16" fill="none" stroke="url(%23rgbTower)" stroke-width="4"/>
  <rect x="80" y="100" width="40" height="4" rx="2" fill="%23FF6A00"/>
</svg>`;

// Mini-Banner 4 : Caméra 360° Sphérique & VR
export const ELECTRO_ACTION_CAM_MINI_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">
  <defs>
    <radialGradient id="cam360" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="%23FFFFFF"/>
      <stop offset="80%" stop-color="%23CBD5E1"/>
      <stop offset="100%" stop-color="%2394A3B8"/>
    </radialGradient>
  </defs>
  <!-- Deux caméras sphériques sur tige -->
  <g transform="translate(60, 20)">
    <rect x="18" y="45" width="24" height="60" rx="10" fill="%23E2E8F0" stroke="%2394A3B8" stroke-width="1.5"/>
    <circle cx="30" cy="35" r="26" fill="url(%23cam360)" stroke="%2394A3B8" stroke-width="2"/>
    <circle cx="30" cy="35" r="14" fill="%230F172A"/>
    <circle cx="28" cy="32" r="5" fill="%2338BDF8"/>
  </g>
  <g transform="translate(105, 28)">
    <rect x="18" y="45" width="24" height="55" rx="10" fill="%23E2E8F0" stroke="%2394A3B8" stroke-width="1.5"/>
    <circle cx="30" cy="35" r="24" fill="url(%23cam360)" stroke="%2394A3B8" stroke-width="2"/>
    <circle cx="30" cy="35" r="12" fill="%230F172A"/>
    <circle cx="28" cy="33" r="4" fill="%2338BDF8"/>
  </g>
</svg>`;

/**
 * 4. Contrôleur de Console de Jeu Vidéo (Offre Spéciale du Jour)
 * Conforme à l'Image 2 & 3 : Manette Blanche avec Sticks Analogiques, D-Pad, Touches A-B-X-Y et Câble.
 */
export const ELECTRO_XBOX_CONTROLLER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="500" height="400">
  <defs>
    <filter id="padShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="%230F172A" flood-opacity="0.18"/>
    </filter>
    <linearGradient id="padBody" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%23FFFFFF"/>
      <stop offset="60%" stop-color="%23F1F5F9"/>
      <stop offset="100%" stop-color="%23CBD5E1"/>
    </linearGradient>
    <radialGradient id="thumbStick" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="%23475569"/>
      <stop offset="70%" stop-color="%231E293B"/>
      <stop offset="100%" stop-color="%23020617"/>
    </radialGradient>
  </defs>
  
  <g filter="url(%23padShadow)">
    <!-- Corps Ergonomique du Contrôleur -->
    <path d="M 120 120 C 180 80 320 80 380 120 C 440 160 480 320 420 370 C 370 410 320 280 250 280 C 180 280 130 410 80 370 C 20 320 60 160 120 120 Z" fill="url(%23padBody)" stroke="%23CBD5E1" stroke-width="2"/>
    
    <!-- Zone Supérieure Noire / Connecteur USB -->
    <path d="M 190 95 C 220 90 280 90 310 95 C 330 115 330 130 310 135 C 280 140 220 140 190 135 C 170 130 170 115 190 95 Z" fill="%231E293B"/>
    <rect x="238" y="70" width="24" height="25" rx="3" fill="%23475569"/>
    
    <!-- Bouton Central Xbox / Guide -->
    <circle cx="250" cy="155" r="22" fill="%23F8FAFC" stroke="%23CBD5E1" stroke-width="2"/>
    <path d="M 238 147 Q 250 160 262 147 Q 250 170 238 147 Z" fill="%230F172A"/>
    
    <!-- Stick Analogique Gauche -->
    <circle cx="160" cy="190" r="34" fill="%23334155"/>
    <circle cx="160" cy="190" r="28" fill="url(%23thumbStick)" stroke="%2364748B" stroke-width="2"/>
    <circle cx="160" cy="190" r="18" fill="none" stroke="%23475569" stroke-width="2" stroke-dasharray="4,3"/>
    
    <!-- D-Pad Directionnel Croix Noire -->
    <g transform="translate(190, 240)">
      <rect x="18" y="0" width="18" height="54" rx="3" fill="%231E293B"/>
      <rect x="0" y="18" width="54" height="18" rx="3" fill="%231E293B"/>
      <circle cx="27" cy="27" r="7" fill="%230F172A"/>
    </g>
    
    <!-- Stick Analogique Droit -->
    <circle cx="310" cy="255" r="34" fill="%23334155"/>
    <circle cx="310" cy="255" r="28" fill="url(%23thumbStick)" stroke="%2364748B" stroke-width="2"/>
    <circle cx="310" cy="255" r="18" fill="none" stroke="%23475569" stroke-width="2" stroke-dasharray="4,3"/>
    
    <!-- Touches d'Action A, B, X, Y Colorées -->
    <!-- Y (Jaune/Ambre) -->
    <circle cx="345" cy="165" r="13" fill="%231E293B"/>
    <text x="345" y="170" font-family="Arial" font-size="12" font-weight="900" fill="%23F59E0B" text-anchor="middle">Y</text>
    
    <!-- X (Bleu) -->
    <circle cx="320" cy="190" r="13" fill="%231E293B"/>
    <text x="320" y="195" font-family="Arial" font-size="12" font-weight="900" fill="%233B82F6" text-anchor="middle">X</text>
    
    <!-- B (Rouge) -->
    <circle cx="370" cy="190" r="13" fill="%231E293B"/>
    <text x="370" y="195" font-family="Arial" font-size="12" font-weight="900" fill="%23EF4444" text-anchor="middle">B</text>
    
    <!-- A (Vert) -->
    <circle cx="345" cy="215" r="13" fill="%231E293B"/>
    <text x="345" y="220" font-family="Arial" font-size="12" font-weight="900" fill="%2310B981" text-anchor="middle">A</text>
    
    <!-- Boutons View & Menu -->
    <circle cx="215" cy="180" r="6" fill="%23475569"/>
    <circle cx="285" cy="180" r="6" fill="%23475569"/>
  </g>
</svg>`;

/**
 * 5. Enceinte Audio Ovoïde Multiroom 360° (Image 2)
 */
export const ELECTRO_SPEAKER_OVAL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 360" width="300" height="360">
  <defs>
    <radialGradient id="eggBody" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="%23FFFFFF"/>
      <stop offset="60%" stop-color="%23F1F5F9"/>
      <stop offset="100%" stop-color="%23CBD5E1"/>
    </radialGradient>
    <linearGradient id="chromeRing" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%2394A3B8"/>
      <stop offset="50%" stop-color="%23FFFFFF"/>
      <stop offset="100%" stop-color="%2364748B"/>
    </linearGradient>
  </defs>
  <!-- Base Pied Chromé Circulaire -->
  <ellipse cx="150" cy="330" rx="60" ry="14" fill="url(%23chromeRing)"/>
  <rect x="144" y="300" width="12" height="30" fill="url(%23chromeRing)"/>
  
  <!-- Corps Ovoïde Futuriste Épuré -->
  <ellipse cx="150" cy="170" rx="75" ry="115" fill="url(%23eggBody)" stroke="%23E2E8F0" stroke-width="2"/>
  
  <!-- Fente Acoustique 360 et Anneau Lumineux Cyan -->
  <ellipse cx="150" cy="245" rx="55" ry="14" fill="%230F172A"/>
  <ellipse cx="150" cy="245" rx="50" ry="6" fill="%2338BDF8"/>
  <rect x="135" y="248" width="30" height="40" rx="4" fill="url(%23chromeRing)"/>
</svg>`;

/**
 * 6. Smartphone 6S Gold & Blanc (Image 3)
 */
export const ELECTRO_SMARTPHONE_GOLD_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 360" width="300" height="360">
  <defs>
    <linearGradient id="goldBack" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23FEF3C7"/>
      <stop offset="50%" stop-color="%23FDE68A"/>
      <stop offset="100%" stop-color="%23D97706"/>
    </linearGradient>
    <radialGradient id="screenWallpaper" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%23FBBF24"/>
      <stop offset="50%" stop-color="%2338BDF8"/>
      <stop offset="100%" stop-color="%230284C7"/>
    </radialGradient>
  </defs>
  <!-- Téléphone de Dos Incliné -->
  <rect x="50" y="40" width="110" height="220" rx="18" fill="url(%23goldBack)" stroke="%23F59E0B" stroke-width="1.5" transform="rotate(-6 105 150)"/>
  <circle cx="85" cy="65" r="8" fill="%23475569" stroke="%23CBD5E1" stroke-width="2"/>
  
  <!-- Téléphone Face Avant Écran Blanc & Wallpaper -->
  <rect x="130" y="30" width="125" height="250" rx="20" fill="%23FFFFFF" stroke="%23CBD5E1" stroke-width="2"/>
  <rect x="140" y="60" width="105" height="185" rx="4" fill="url(%23screenWallpaper)"/>
  <!-- Haut-Parleur Appel & Caméra Selfie -->
  <circle cx="175" cy="45" r="3" fill="%2364748B"/>
  <rect x="185" y="44" width="22" height="3" rx="1.5" fill="%2364748B"/>
  <!-- Bouton Home Rond avec Anneau Gold -->
  <circle cx="192" cy="262" r="11" fill="%23FFFFFF" stroke="%23F59E0B" stroke-width="2"/>
</svg>`;

/**
 * 7. Tablette Hybride Revolve Laptop Écran Allumé (Image 2 & 4)
 */
export const ELECTRO_REVERSIBLE_LAPTOP_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 300" width="340" height="300">
  <defs>
    <linearGradient id="laptopBlueScreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%230369A1"/>
      <stop offset="50%" stop-color="%2338BDF8"/>
      <stop offset="100%" stop-color="%23F0FDF4"/>
    </linearGradient>
  </defs>
  <!-- Châssis Clavier Argenté Incliné -->
  <path d="M 40 180 L 260 170 L 310 220 L 20 235 Z" fill="%23E2E8F0" stroke="%23CBD5E1" stroke-width="2"/>
  <rect x="120" y="210" width="60" height="15" rx="3" fill="%2394A3B8"/>
  <!-- Écran Fin Ouvert 120° avec Fond Abyssal -->
  <path d="M 100 70 L 290 60 L 260 172 L 80 180 Z" fill="%230F172A"/>
  <path d="M 108 76 L 282 67 L 255 166 L 88 173 Z" fill="url(%23laptopBlueScreen)"/>
  <circle cx="185" cy="115" r="30" fill="none" stroke="%23FFFFFF" stroke-width="2" opacity="0.6"/>
</svg>`;

/**
 * 8. Appareil Photo Compact NX Mini Mint & Métal (Image 3)
 */
export const ELECTRO_NX_CAMERA_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" width="300" height="240">
  <defs>
    <radialGradient id="lensGlass" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="%2338BDF8"/>
      <stop offset="60%" stop-color="%230F172A"/>
      <stop offset="100%" stop-color="%23020617"/>
    </radialGradient>
  </defs>
  <!-- Boîtier Pastel Vert d'Eau / Mint Luxe -->
  <rect x="30" y="45" width="240" height="150" rx="14" fill="%23CCFBF1" stroke="%2399F6E4" stroke-width="2"/>
  <!-- Bande Métallique Supérieure Brossée -->
  <path d="M 30 55 C 30 45 40 45 50 45 L 250 45 C 260 45 270 45 270 55 L 270 75 L 30 75 Z" fill="%23F1F5F9" stroke="%23CBD5E1" stroke-width="1.5"/>
  <rect x="55" y="35" width="40" height="10" rx="3" fill="%2394A3B8"/>
  <!-- Gros Objectif Circulaire Centré -->
  <circle cx="170" cy="120" r="56" fill="%23E2E8F0" stroke="%23CBD5E1" stroke-width="3"/>
  <circle cx="170" cy="120" r="46" fill="url(%23lensGlass)"/>
  <circle cx="155" cy="105" r="14" fill="%23FFFFFF" opacity="0.65"/>
  <!-- Flash & Voyant -->
  <circle cx="65" cy="95" r="9" fill="%23F8FAFC" stroke="%23CBD5E1" stroke-width="2"/>
  <circle cx="95" cy="95" r="4" fill="%23EF4444"/>
</svg>`;

/**
 * 9. Imprimante LaserJet Pro Blanche Pro (Image 3)
 */
export const ELECTRO_PRINTER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260" width="320" height="260">
  <!-- Châssis Blanc Imprimante Pro -->
  <rect x="30" y="60" width="260" height="160" rx="10" fill="%23F8FAFC" stroke="%23CBD5E1" stroke-width="2"/>
  <!-- Bac à Feuilles Sortie Supérieur -->
  <rect x="60" y="80" width="160" height="35" rx="4" fill="%23E2E8F0"/>
  <rect x="70" y="70" width="140" height="30" rx="2" fill="%23FFFFFF" stroke="%23CBD5E1" stroke-width="1"/>
  <!-- Écran Tactile Couleur Incliné à Droite -->
  <rect x="235" y="45" width="42" height="36" rx="4" fill="%230F172A" stroke="%23334155" stroke-width="2"/>
  <rect x="240" y="50" width="32" height="22" rx="2" fill="%230284C7"/>
  <!-- Tiroir Bac Papier Inférieur -->
  <rect x="45" y="170" width="230" height="35" rx="4" fill="%23E2E8F0" stroke="%23CBD5E1" stroke-width="1.5"/>
  <rect x="140" y="180" width="40" height="8" rx="2" fill="%2394A3B8"/>
</svg>`;

/**
 * 10. Clé USB Flash Chromée Métal (Image 4)
 */
export const ELECTRO_USB_DRIVE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 200" width="280" height="200">
  <defs>
    <linearGradient id="usbMetal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23FFFFFF"/>
      <stop offset="40%" stop-color="%23E2E8F0"/>
      <stop offset="80%" stop-color="%2394A3B8"/>
      <stop offset="100%" stop-color="%2364748B"/>
    </linearGradient>
  </defs>
  <!-- Connecteur USB 3.0 Bleu -->
  <rect x="40" y="80" width="35" height="42" rx="3" fill="%23E2E8F0" stroke="%2394A3B8" stroke-width="1.5"/>
  <rect x="40" y="86" width="12" height="30" fill="%230284C7"/>
  <!-- Corps Métallique Pivotant avec Anneau -->
  <path d="M 70 70 L 200 60 C 230 60 250 80 250 100 C 250 120 230 140 200 140 L 70 130 Z" fill="url(%23usbMetal)" stroke="%23CBD5E1" stroke-width="2"/>
  <circle cx="215" cy="100" r="18" fill="%23FFFFFF" stroke="%2394A3B8" stroke-width="2"/>
</svg>`;

/**
 * 11. Casque Réalité Virtuelle Gear VR Noir (Image 4)
 */
export const ELECTRO_VR_HEADSET_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="320" height="220">
  <!-- Masque Ergonomique VR Noir et Visière Noire Miroir -->
  <rect x="40" y="50" width="240" height="120" rx="36" fill="%231E293B" stroke="%23334155" stroke-width="2"/>
  <rect x="55" y="65" width="210" height="90" rx="26" fill="%230B0F19"/>
  <!-- Reflet Miroir Visière -->
  <path d="M 65 75 Q 160 90 255 75 Q 240 105 75 105 Z" fill="%23334155" opacity="0.4"/>
  <!-- Molette de Réglage Supérieure -->
  <rect x="145" y="42" width="30" height="10" rx="3" fill="%23475569"/>
</svg>`;

