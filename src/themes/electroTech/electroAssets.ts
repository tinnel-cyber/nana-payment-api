// =========================================================================
// ASSETS VECTORIELS HAUTE DÉFINITION - THÈME PREMIUM ÉLECTRONIQUE TECH
// Inspiré fidèlement des maquettes officielles (Image 1 & Image 2)
// 100% autonome, zéro dépendance réseau, rendu ultra-net sur écran Retina/4K
// =========================================================================

// 1. Visuel Hero 3D Flottant (Écran incurvé gaming + Casque VR + Enceinte connectée)
export const HERO_SHOWCASE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="1000" height="650">
  <defs>
    <radialGradient id="heroGlow" cx="60%" cy="45%" r="55%">
      <stop offset="0%" stop-color="%2360A5FA" stop-opacity="0.25"/>
      <stop offset="60%" stop-color="%2393C5FD" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="%23FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="neonScreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%231E1B4B"/>
      <stop offset="30%" stop-color="%23DC2626"/>
      <stop offset="60%" stop-color="%23F59E0B"/>
      <stop offset="85%" stop-color="%2306B6D4"/>
      <stop offset="100%" stop-color="%233B82F6"/>
    </linearGradient>
    <linearGradient id="metallicBlack" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%23334155"/>
      <stop offset="50%" stop-color="%230F172A"/>
      <stop offset="100%" stop-color="%23020617"/>
    </linearGradient>
    <linearGradient id="speakerFabric" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%231E293B"/>
      <stop offset="50%" stop-color="%23334155"/>
      <stop offset="100%" stop-color="%230F172A"/>
    </linearGradient>
    <radialGradient id="speakerRing" cx="50%" cy="30%" r="50%">
      <stop offset="0%" stop-color="%23F43F5E"/>
      <stop offset="50%" stop-color="%238B5CF6"/>
      <stop offset="100%" stop-color="%233B82F6"/>
    </radialGradient>
    <filter id="floatShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feGaussianBlur stdDeviation="22" in="SourceAlpha"/>
      <feOffset dx="0" dy="38" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.32"/>
      </feComponentTransfer>
      <feMerge> 
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Lueur de fond -->
  <ellipse cx="620" cy="300" rx="420" ry="280" fill="url(%23heroGlow)"/>

  <!-- 1. ÉCRAN GAMING INCURVÉ CENTRAL AU SECOND PLAN -->
  <g transform="translate(360, 50)" filter="url(%23floatShadow)">
    <!-- Pied de l'écran (Trépied gamer) -->
    <path d="M 190 280 L 190 370 L 110 430 M 190 370 L 270 430 M 190 370 L 190 410" 
          stroke="%230F172A" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <polygon points="175,280 205,280 198,370 182,370" fill="%231E293B"/>
    <line x1="90" y1="432" x2="290" y2="432" stroke="%23334155" stroke-width="4" stroke-linecap="round"/>

    <!-- Châssis Incurvé de l'écran -->
    <path d="M 20 60 Q 190 30 380 75 L 375 275 Q 190 240 25 260 Z" fill="%230F172A" stroke="%23334155" stroke-width="3"/>
    
    <!-- Dalle incurvée avec scène de course néon -->
    <path d="M 26 66 Q 190 36 374 81 L 369 269 Q 190 236 31 254 Z" fill="url(%23neonScreen)"/>
    
    <!-- Reflet & Voilure Cyberpunk sur l'écran -->
    <path d="M 120 180 Q 200 130 290 190 L 310 240 Q 200 210 100 230 Z" fill="%23FFFFFF" opacity="0.18"/>
    <ellipse cx="200" cy="180" rx="35" ry="12" fill="%23EF4444" opacity="0.7"/>
    <line x1="50" y1="210" x2="350" y2="230" stroke="%23FBBF24" stroke-width="3" stroke-dasharray="12,12"/>
    <text x="200" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" fill="%23FFFFFF" text-anchor="middle" letter-spacing="4" opacity="0.9">ULTRA-WIDE 144Hz</text>
  </g>

  <!-- 2. CASQUE VR PRO 3D EN PREMIER PLAN GAUCHE -->
  <g transform="translate(60, 180)" filter="url(%23floatShadow)">
    <!-- Arceau ergonomique arrière -->
    <path d="M 40 120 Q 90 20 220 50 Q 270 90 260 160" fill="none" stroke="%230F172A" stroke-width="26" stroke-linecap="round"/>
    <path d="M 50 115 Q 100 25 215 52 Q 260 90 250 155" fill="none" stroke="%231E293B" stroke-width="18" stroke-linecap="round"/>

    <!-- Molette de serrage arrière -->
    <circle cx="40" cy="120" r="16" fill="%23334155" stroke="%230F172A" stroke-width="3"/>

    <!-- Corps principal de la visière VR -->
    <path d="M 120 80 Q 230 75 255 100 L 265 175 Q 210 200 130 185 Q 100 150 120 80 Z" fill="url(%23metallicBlack)"/>
    
    <!-- Visière frontale miroir avec capteurs -->
    <path d="M 145 92 Q 225 88 245 106 L 253 162 Q 210 182 150 170 Q 130 145 145 92 Z" fill="%23020617" stroke="%231E293B" stroke-width="2"/>
    
    <!-- Caméras Tracking 6DoF -->
    <circle cx="155" cy="110" r="5" fill="%2338BDF8" opacity="0.8"/>
    <circle cx="235" cy="115" r="5" fill="%2338BDF8" opacity="0.8"/>
    <circle cx="160" cy="155" r="4.5" fill="%2338BDF8" opacity="0.8"/>
    <circle cx="240" cy="150" r="4.5" fill="%2338BDF8" opacity="0.8"/>

    <!-- Lueur subtile de statut LED -->
    <line x1="185" y1="102" x2="205" y2="102" stroke="%230056D2" stroke-width="3" stroke-linecap="round"/>
  </g>

  <!-- 3. ENCEINTE SMART 360 ACOUSTIQUE À DROITE -->
  <g transform="translate(730, 210)" filter="url(%23floatShadow)">
    <!-- Corps cylindrique en maille acoustique noire -->
    <rect x="0" y="30" width="135" height="200" rx="36" fill="url(%23speakerFabric)"/>
    
    <!-- Trame acoustique fine -->
    <rect x="6" y="42" width="123" height="175" rx="30" fill="none" stroke="%23475569" stroke-width="1.5" stroke-dasharray="2,3" opacity="0.4"/>
    
    <!-- Disque tactile supérieur avec anneau lumineux RGB dynamique -->
    <ellipse cx="67" cy="40" rx="55" ry="18" fill="url(%23metallicBlack)"/>
    <ellipse cx="67" cy="38" rx="46" ry="14" fill="url(%23speakerRing)" opacity="0.9"/>
    <ellipse cx="67" cy="37" rx="34" ry="10" fill="%230F172A"/>
    <circle cx="67" cy="37" r="5" fill="%23FFFFFF" opacity="0.8"/>
  </g>
</svg>`;

// 2. Produit 1 : Casque de Réalité Virtuelle Pro 3D (Fidèle à Image 1)
export const VR_HEADSET_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <defs>
    <radialGradient id="vrGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%23E2E8F0" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="%23F9F9FB" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="vrBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23334155"/>
      <stop offset="50%" stop-color="%230F172A"/>
      <stop offset="100%" stop-color="%23020617"/>
    </linearGradient>
    <filter id="prodShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="24" stdDeviation="20" flood-color="%230F172A" flood-opacity="0.14"/>
    </filter>
  </defs>

  <rect width="600" height="450" fill="%23F9F9FB"/>
  <ellipse cx="300" cy="360" rx="190" ry="24" fill="%230F172A" opacity="0.08"/>

  <g transform="translate(90, 70)" filter="url(%23prodShadow)">
    <!-- Arceau supra-auriculaire rigide -->
    <path d="M 60 140 Q 140 20 320 60 Q 380 110 370 190" fill="none" stroke="%230F172A" stroke-width="32" stroke-linecap="round"/>
    <path d="M 70 135 Q 150 25 315 62 Q 370 110 360 185" fill="none" stroke="%231E293B" stroke-width="22" stroke-linecap="round"/>
    
    <!-- Molette arrière de serrage millimétrique -->
    <circle cx="58" cy="140" r="18" fill="%23334155" stroke="%230F172A" stroke-width="3"/>
    <circle cx="58" cy="140" r="8" fill="%2364748B"/>

    <!-- Bloc Optique Avant -->
    <path d="M 180 90 Q 320 80 355 110 L 370 210 Q 300 240 190 220 Q 150 175 180 90 Z" fill="url(%23vrBody)"/>
    
    <!-- Lentille de façade incurvée noir profond -->
    <path d="M 210 105 Q 315 98 340 120 L 352 192 Q 295 218 215 202 Q 190 170 210 105 Z" fill="%23020617" stroke="%231E293B" stroke-width="2"/>
    
    <!-- 4 Capteurs 6DoF de suivi spatial -->
    <circle cx="225" cy="125" r="6" fill="%2338BDF8" opacity="0.85"/>
    <circle cx="325" cy="130" r="6" fill="%2338BDF8" opacity="0.85"/>
    <circle cx="230" cy="180" r="5" fill="%2338BDF8" opacity="0.85"/>
    <circle cx="330" cy="175" r="5" fill="%2338BDF8" opacity="0.85"/>

    <!-- Témoin lumineux LED Power -->
    <line x1="265" y1="115" x2="285" y2="115" stroke="%230056D2" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>`;

// 3. Produit 2 : Écran Gaming Incurvé - 34" (Fidèle à Image 1 & Image 2)
export const CURVED_MONITOR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <defs>
    <linearGradient id="cyberScreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%231E1B4B"/>
      <stop offset="25%" stop-color="%23DC2626"/>
      <stop offset="55%" stop-color="%23EA580C"/>
      <stop offset="80%" stop-color="%230284C7"/>
      <stop offset="100%" stop-color="%233B82F6"/>
    </linearGradient>
    <filter id="monitorShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="%230F172A" flood-opacity="0.16"/>
    </filter>
  </defs>

  <rect width="600" height="450" fill="%23F9F9FB"/>
  <ellipse cx="300" cy="385" rx="210" ry="22" fill="%230F172A" opacity="0.10"/>

  <g transform="translate(50, 45)" filter="url(%23monitorShadow)">
    <!-- Pied Gamer Trépied en V -->
    <polygon points="240,250 260,250 255,340 245,340" fill="%230F172A"/>
    <path d="M 250 340 L 140 375 M 250 340 L 360 375 M 250 340 L 250 380" 
          stroke="%230F172A" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <line x1="120" y1="376" x2="380" y2="376" stroke="%23334155" stroke-width="4" stroke-linecap="round"/>

    <!-- Bordure Incurvée Forme 1500R -->
    <path d="M 20 80 Q 250 40 480 80 L 470 265 Q 250 220 30 265 Z" fill="%230F172A" stroke="%23334155" stroke-width="3"/>
    
    <!-- Dalle D'affichage Incurvée Active -->
    <path d="M 26 86 Q 250 46 474 86 L 464 259 Q 250 216 36 259 Z" fill="url(%23cyberScreen)"/>

    <!-- Véhicule Cyberpunk / Vitesse Lumineuse -->
    <ellipse cx="250" cy="180" rx="42" ry="15" fill="%23EF4444" opacity="0.85"/>
    <polygon points="230,175 270,175 260,195 240,195" fill="%23FBBF24"/>
    <line x1="50" y1="210" x2="450" y2="215" stroke="%23FDE047" stroke-width="3" stroke-dasharray="14,14"/>

    <!-- Reflet vitre antireflet -->
    <path d="M 140 100 Q 250 70 370 115 L 350 240 Q 250 205 130 230 Z" fill="%23FFFFFF" opacity="0.12"/>
  </g>
</svg>`;

// Miniature 2 : Vue avant éteinte / profil incurvé
export const CURVED_MONITOR_THUMB2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <rect width="600" height="450" fill="%23F9F9FB"/>
  <ellipse cx="300" cy="385" rx="190" ry="20" fill="%230F172A" opacity="0.12"/>
  <g transform="translate(50, 50)">
    <polygon points="240,250 260,250 255,340 245,340" fill="%230F172A"/>
    <path d="M 250 340 L 140 375 M 250 340 L 360 375" stroke="%230F172A" stroke-width="12" stroke-linecap="round" fill="none"/>
    <path d="M 20 80 Q 250 40 480 80 L 470 265 Q 250 220 30 265 Z" fill="%230F172A" stroke="%23334155" stroke-width="3"/>
    <path d="M 26 86 Q 250 46 474 86 L 464 259 Q 250 216 36 259 Z" fill="%23020617"/>
    <path d="M 80 100 Q 250 70 420 105 L 400 240 Q 250 205 70 230 Z" fill="%23FFFFFF" opacity="0.05"/>
  </g>
</svg>`;

// Miniature 3 : Vue arrière avec anneau RGB dynamique
export const CURVED_MONITOR_THUMB3 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <defs>
    <radialGradient id="rgbHalo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%2310B981"/>
      <stop offset="40%" stop-color="%2306B6D4"/>
      <stop offset="70%" stop-color="%238B5CF6"/>
      <stop offset="100%" stop-color="%23EC4899"/>
    </radialGradient>
  </defs>
  <rect width="600" height="450" fill="%23F9F9FB"/>
  <ellipse cx="300" cy="385" rx="190" ry="20" fill="%230F172A" opacity="0.12"/>
  <g transform="translate(50, 50)">
    <polygon points="240,230 260,230 255,340 245,340" fill="%230F172A"/>
    <path d="M 250 340 L 140 375 M 250 340 L 360 375" stroke="%230F172A" stroke-width="12" stroke-linecap="round" fill="none"/>
    <!-- Dos du moniteur incurvé -->
    <path d="M 20 80 Q 250 110 480 80 L 470 265 Q 250 295 30 265 Z" fill="%230F172A" stroke="%231E293B" stroke-width="3"/>
    <!-- Cercle RGB Vortex -->
    <circle cx="250" cy="180" r="46" fill="url(%23rgbHalo)"/>
    <circle cx="250" cy="180" r="32" fill="%230F172A"/>
    <circle cx="250" cy="180" r="22" fill="%231E293B"/>
  </g>
</svg>`;

// Miniature 4 : Vue 3/4 profil gaming
export const CURVED_MONITOR_THUMB4 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <rect width="600" height="450" fill="%23F9F9FB"/>
  <ellipse cx="320" cy="385" rx="170" ry="20" fill="%230F172A" opacity="0.12"/>
  <g transform="translate(90, 50)">
    <path d="M 270 220 L 270 340 L 210 375 M 270 340 L 350 375" stroke="%230F172A" stroke-width="12" stroke-linecap="round" fill="none"/>
    <!-- Profil incurvé vue 3/4 -->
    <path d="M 40 85 Q 160 55 380 90 L 370 270 Q 160 235 50 270 Z" fill="%230F172A"/>
    <path d="M 48 92 Q 160 62 372 96 L 362 263 Q 160 230 58 263 Z" fill="%231E293B"/>
    <circle cx="270" cy="175" r="35" fill="none" stroke="%2338BDF8" stroke-width="8" opacity="0.7"/>
  </g>
</svg>`;

// 4. Produit 3 : Écouteurs Pro ANC - Sans Fil (Fidèle à Image 1)
export const EARBUDS_ANC_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <defs>
    <linearGradient id="caseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%23334155"/>
      <stop offset="60%" stop-color="%230F172A"/>
      <stop offset="100%" stop-color="%23020617"/>
    </linearGradient>
    <filter id="earShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="%230F172A" flood-opacity="0.15"/>
    </filter>
  </defs>

  <rect width="600" height="450" fill="%23F9F9FB"/>
  <ellipse cx="300" cy="380" rx="160" ry="22" fill="%230F172A" opacity="0.10"/>

  <g transform="translate(130, 60)" filter="url(%23earShadow)">
    <!-- Boîtier de recharge ouvert/fermé -->
    <rect x="50" y="150" width="240" height="150" rx="50" fill="url(%23caseGrad)"/>
    <line x1="50" y1="195" x2="290" y2="195" stroke="%23475569" stroke-width="2"/>
    <circle cx="170" cy="225" r="3.5" fill="%2310B981"/>

    <!-- Écouteur Gauche redressé -->
    <g transform="translate(90, 30)">
      <rect x="25" y="30" width="16" height="85" rx="8" fill="%230F172A"/>
      <ellipse cx="33" cy="28" rx="26" ry="22" fill="%231E293B"/>
      <ellipse cx="20" cy="26" rx="14" ry="12" fill="%23020617"/>
      <!-- Grille micro antibruit -->
      <line x1="33" y1="18" x2="33" y2="26" stroke="%2364748B" stroke-width="2.5" stroke-linecap="round"/>
    </g>

    <!-- Écouteur Droit redressé -->
    <g transform="translate(185, 30)">
      <rect x="25" y="30" width="16" height="85" rx="8" fill="%230F172A"/>
      <ellipse cx="33" cy="28" rx="26" ry="22" fill="%231E293B"/>
      <ellipse cx="46" cy="26" rx="14" ry="12" fill="%23020617"/>
      <!-- Grille micro antibruit -->
      <line x1="33" y1="18" x2="33" y2="26" stroke="%2364748B" stroke-width="2.5" stroke-linecap="round"/>
    </g>
  </g>
</svg>`;

// 5. Produit 4 : Vidéoprojecteur Smart 4K Ultra (Fidèle à Image 1)
export const PROJECTOR_4K_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <defs>
    <linearGradient id="projectorBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23475569"/>
      <stop offset="50%" stop-color="%231E293B"/>
      <stop offset="100%" stop-color="%230F172A"/>
    </linearGradient>
    <radialGradient id="opticLens" cx="45%" cy="45%" r="55%">
      <stop offset="0%" stop-color="%2367E8F9"/>
      <stop offset="40%" stop-color="%230284C7"/>
      <stop offset="80%" stop-color="%231E1B4B"/>
      <stop offset="100%" stop-color="%23000000"/>
    </radialGradient>
    <filter id="projShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="%230F172A" flood-opacity="0.16"/>
    </filter>
  </defs>

  <rect width="600" height="450" fill="%23F9F9FB"/>
  <ellipse cx="300" cy="385" rx="210" ry="22" fill="%230F172A" opacity="0.10"/>

  <g transform="translate(60, 80)" filter="url(%23projShadow)">
    <!-- Corps du Vidéoprojecteur Cubique Premium -->
    <rect x="40" y="50" width="270" height="190" rx="36" fill="url(%23projectorBody)" stroke="%23334155" stroke-width="2"/>
    
    <!-- Grille de ventilation acoustique latérale -->
    <g transform="translate(48, 80)" opacity="0.4">
      <circle cx="5" cy="10" r="2" fill="%23CBD5E1"/><circle cx="15" cy="10" r="2" fill="%23CBD5E1"/><circle cx="25" cy="10" r="2" fill="%23CBD5E1"/>
      <circle cx="5" cy="25" r="2" fill="%23CBD5E1"/><circle cx="15" cy="25" r="2" fill="%23CBD5E1"/><circle cx="25" cy="25" r="2" fill="%23CBD5E1"/>
      <circle cx="5" cy="40" r="2" fill="%23CBD5E1"/><circle cx="15" cy="40" r="2" fill="%23CBD5E1"/><circle cx="25" cy="40" r="2" fill="%23CBD5E1"/>
    </g>

    <!-- Lentille Optique Grand Angle 4K -->
    <circle cx="130" cy="145" r="48" fill="%23020617" stroke="%2364748B" stroke-width="4"/>
    <circle cx="130" cy="145" r="38" fill="url(%23opticLens)"/>
    <ellipse cx="120" cy="135" rx="12" ry="8" fill="%23FFFFFF" opacity="0.6"/>

    <!-- Bouton Power & Capteurs ToF -->
    <circle cx="240" cy="95" r="8" fill="%23000000" stroke="%2364748B" stroke-width="1.5"/>
    <circle cx="240" cy="95" r="3" fill="%230056D2"/>
    
    <!-- Télécommande Bluetooth posée à droite -->
    <g transform="translate(340, 40) rotate(14)">
      <rect x="0" y="0" width="55" height="190" rx="20" fill="%230F172A" stroke="%23334155" stroke-width="2"/>
      <circle cx="27" cy="45" r="15" fill="%231E293B" stroke="%23475569" stroke-width="1.5"/>
      <circle cx="27" cy="45" r="6" fill="%230056D2"/>
      <rect x="14" y="80" width="12" height="12" rx="4" fill="%23334155"/>
      <rect x="30" y="80" width="12" height="12" rx="4" fill="%23334155"/>
      <rect x="14" y="102" width="28" height="10" rx="3" fill="%23334155"/>
      <rect x="14" y="122" width="28" height="10" rx="3" fill="%23334155"/>
    </g>
  </g>
</svg>`;
