// =========================================================================
// ASSETS VECTORIELS HAUTE DÉFINITION - THEME MEGA-STORE PRO
// 100% autonome, zéro dépendance réseau, inspiré fidèlement de la maquette
// =========================================================================

// 1. Visuel pour le Banner Principal 70% (Femme & Produit Beauté / Soin)
export const MEGA_MODEL_HERO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500">
  <defs>
    <radialGradient id="faceGlow" cx="45%" cy="40%" r="55%">
      <stop offset="0%" stop-color="%23FDE2D2"/>
      <stop offset="50%" stop-color="%23E8B598"/>
      <stop offset="100%" stop-color="%23C98A68"/>
    </radialGradient>
    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%232D150A"/>
      <stop offset="40%" stop-color="%23180B04"/>
      <stop offset="100%" stop-color="%230F0502"/>
    </linearGradient>
    <linearGradient id="bottleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%23381B4D"/>
      <stop offset="35%" stop-color="%236B21A8"/>
      <stop offset="70%" stop-color="%23A855F7"/>
      <stop offset="100%" stop-color="%23381B4D"/>
    </linearGradient>
    <filter id="softShad" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="25" flood-color="%233B0764" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Arrière-plan doux -->
  <circle cx="340" cy="240" r="220" fill="%23DDD0F2" opacity="0.6"/>
  <ellipse cx="440" cy="380" rx="140" ry="80" fill="%23C4B5FD" opacity="0.4"/>

  <!-- Chevelure volumineuse bouclée -->
  <path d="M 120 220 Q 110 90 280 60 Q 450 60 480 200 Q 510 330 460 440 Q 320 470 180 430 Q 110 350 120 220 Z" fill="url(%23hairGrad)"/>
  
  <!-- Visage & Cou rayonnant -->
  <path d="M 230 180 Q 230 320 310 340 Q 390 320 390 180 Q 380 120 310 120 Q 240 120 230 180 Z" fill="url(%23faceGlow)"/>
  <path d="M 275 320 L 275 420 Q 310 440 345 420 L 345 320 Z" fill="%23DE9B75"/>
  
  <!-- Épaules -->
  <path d="M 160 420 Q 240 390 310 410 Q 380 390 460 420 L 480 500 L 140 500 Z" fill="%23E5A882"/>

  <!-- Yeux, Sourcils et Sourire doux -->
  <path d="M 255 170 Q 275 160 295 170" stroke="%233E1D0E" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M 325 170 Q 345 160 365 170" stroke="%233E1D0E" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="275" cy="185" r="7" fill="%23261107"/>
  <circle cx="345" cy="185" r="7" fill="%23261107"/>
  <circle cx="277" cy="183" r="2.5" fill="%23FFFFFF"/>
  <circle cx="347" cy="183" r="2.5" fill="%23FFFFFF"/>
  <!-- Nez délicat -->
  <path d="M 310 185 L 305 225 Q 310 232 318 228" stroke="%23C27953" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Lèvres éclatantes -->
  <path d="M 285 260 Q 310 285 335 260 Q 310 262 285 260 Z" fill="%23C026D3"/>
  <path d="M 292 263 Q 310 274 328 263" fill="%23FFFFFF"/>

  <!-- Flacon cosmétique tenu au premier plan (Love Beauty & Planet Style) -->
  <g transform="translate(340, 240) rotate(-12)" filter="url(%23softShad)">
    <!-- Bouteille violette nacrée -->
    <rect x="0" y="40" width="115" height="230" rx="30" fill="url(%23bottleGrad)"/>
    <rect x="40" y="10" width="35" height="30" rx="6" fill="%231E293B"/>
    <rect x="35" y="0" width="45" height="14" rx="4" fill="%23475569"/>
    
    <!-- Étiquette botanique blanche -->
    <rect x="12" y="70" width="91" height="150" rx="12" fill="%23FFFFFF"/>
    <text x="57" y="105" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="%23581C87" text-anchor="middle" letter-spacing="1">LOVE</text>
    <text x="57" y="122" font-family="system-ui, sans-serif" font-size="9" font-weight="800" fill="%23A855F7" text-anchor="middle">BEAUTY</text>
    <text x="57" y="136" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="%2315803D" text-anchor="middle">AND PLANET</text>
    <circle cx="57" cy="165" r="18" fill="%23F3E8FF"/>
    <path d="M 50 170 Q 57 155 64 170 Z" fill="%239333EA"/>
    <rect x="25" y="195" width="65" height="8" rx="4" fill="%236B21A8"/>
  </g>
</svg>`;

// 2. Visuel Bloc Supérieur Droit : GROCERY SHOP - NEW! (Canettes boissons fraîches)
export const MEGA_GROCERY_DRINKS_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
  <defs>
    <linearGradient id="splashNeon" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%2338BDF8"/>
      <stop offset="100%" stop-color="%230284C7"/>
    </linearGradient>
    <linearGradient id="cocaRed" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%23B91C1C"/>
      <stop offset="50%" stop-color="%23DC2626"/>
      <stop offset="100%" stop-color="%23991B1B"/>
    </linearGradient>
    <linearGradient id="fantaGreen" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%2315803D"/>
      <stop offset="50%" stop-color="%2322C55E"/>
      <stop offset="100%" stop-color="%23166534"/>
    </linearGradient>
  </defs>

  <!-- Éclaboussure d'eau / Splash en arrière-plan -->
  <path d="M 40 80 Q 90 20 160 50 Q 230 10 270 70 Q 300 130 250 160 Q 180 190 100 160 Q 30 140 40 80 Z" fill="url(%23splashNeon)" opacity="0.35"/>
  <ellipse cx="160" cy="175" rx="130" ry="16" fill="%23003087" opacity="0.4"/>

  <!-- Canette 1 : Splash Orange à gauche -->
  <g transform="translate(60, 65)">
    <rect x="0" y="10" width="45" height="95" rx="10" fill="%23F59E0B"/>
    <ellipse cx="22" cy="10" rx="20" ry="5" fill="%23E2E8F0"/>
    <rect x="6" y="30" width="33" height="50" rx="4" fill="%23FEF3C7"/>
    <text x="22" y="58" font-family="system-ui" font-size="8" font-weight="900" fill="%23B45309" text-anchor="middle">Splash</text>
  </g>

  <!-- Canette 2 : Boîte Rouge Centrale Festive -->
  <g transform="translate(115, 45)">
    <rect x="0" y="15" width="90" height="115" rx="14" fill="url(%23cocaRed)"/>
    <ellipse cx="45" cy="15" rx="42" ry="8" fill="%23CBD5E1"/>
    <ellipse cx="45" cy="15" rx="22" ry="4" fill="%2394A3B8"/>
    <!-- Logo ruban blanc ondulé -->
    <path d="M 15 70 Q 45 50 75 75 Q 45 90 15 70 Z" fill="%23FFFFFF"/>
    <text x="45" y="74" font-family="Georgia, serif" font-size="12" font-weight="900" font-style="italic" fill="%23DC2626" text-anchor="middle">Coca-Cola</text>
    <circle cx="22" cy="100" r="8" fill="%23FEF08A"/>
    <circle cx="70" cy="100" r="8" fill="%23FEF08A"/>
  </g>

  <!-- Canette 3 : Fanta Verte à droite -->
  <g transform="translate(215, 70)">
    <rect x="0" y="10" width="42" height="90" rx="10" fill="url(%23fantaGreen)"/>
    <ellipse cx="21" cy="10" rx="19" ry="5" fill="%23E2E8F0"/>
    <circle cx="21" cy="50" r="14" fill="%233B82F6"/>
    <text x="21" y="54" font-family="system-ui" font-size="8" font-weight="900" fill="%23FFFFFF" text-anchor="middle">FANTA</text>
  </g>
</svg>`;

// 3. Visuel Bloc Inférieur Droit : TV & VIDEO - SALE (Grand écran OLED)
export const MEGA_OLED_TV_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
  <defs>
    <radialGradient id="fireworksScreen" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="%23FEF08A"/>
      <stop offset="25%" stop-color="%23F97316"/>
      <stop offset="60%" stop-color="%23DC2626"/>
      <stop offset="85%" stop-color="%237C3AED"/>
      <stop offset="100%" stop-color="%230F172A"/>
    </radialGradient>
    <linearGradient id="tvBezel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%23334155"/>
      <stop offset="100%" stop-color="%230F172A"/>
    </linearGradient>
  </defs>

  <ellipse cx="160" cy="180" rx="120" ry="12" fill="%2300266B" opacity="0.6"/>

  <g transform="translate(30, 25)">
    <!-- Pied double support épuré -->
    <polygon points="50,140 60,140 45,155 35,155" fill="%230F172A"/>
    <polygon points="210,140 200,140 215,155 225,155" fill="%230F172A"/>
    
    <!-- Cadre TV fin noir titane -->
    <rect x="0" y="0" width="260" height="142" rx="4" fill="url(%23tvBezel)" stroke="%2364748B" stroke-width="1.5"/>
    
    <!-- Dalle OLED éclatante avec feu d'artifice -->
    <rect x="4" y="4" width="252" height="134" rx="2" fill="url(%23fireworksScreen)"/>
    
    <!-- Étiquette badge OLED en haut à gauche de l'écran -->
    <rect x="10" y="10" width="55" height="16" rx="2" fill="%23000000" opacity="0.75"/>
    <text x="37" y="22" font-family="system-ui" font-size="9" font-weight="900" fill="%23FFFFFF" text-anchor="middle">65" OLED</text>

    <!-- Particules d'explosion lumineuse -->
    <circle cx="126" cy="70" r="16" fill="%23FFFFFF" opacity="0.9"/>
    <circle cx="126" cy="70" r="28" fill="%23FBBF24" opacity="0.4"/>
    <line x1="126" y1="35" x2="126" y2="105" stroke="%23FEF08A" stroke-width="2"/>
    <line x1="91" y1="70" x2="161" y2="70" stroke="%23FEF08A" stroke-width="2"/>
  </g>
</svg>`;

// =========================================================================
// PRODUITS VENTES FLASH : PAIRES D'IMAGES HOVER SWAP (IMAGE 1 & IMAGE 2)
// =========================================================================

// Éclair Ventes Flash Logo
export const FLASH_THUNDER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <filter id="glowYellow">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="%23FBBF24" flood-opacity="0.8"/>
    </filter>
  </defs>
  <polygon points="90,10 30,90 80,90 60,150 135,70 85,70" fill="%23FACC15" stroke="%23CA8A04" stroke-width="4" stroke-linejoin="round" filter="url(%23glowYellow)"/>
</svg>`;

// Paire 1 : Casque Audio Hi-Fi Over-Ear (Image 1: Face, Image 2: Plié profil)
export const HEADSET_IMG_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="%23FFFFFF"/>
  <ellipse cx="150" cy="260" rx="90" ry="14" fill="%230F172A" opacity="0.1"/>
  <!-- Arceau principal -->
  <path d="M 60 150 Q 60 40 150 40 Q 240 40 240 150" fill="none" stroke="%230F172A" stroke-width="20" stroke-linecap="round"/>
  <path d="M 80 140 Q 80 55 150 55 Q 220 55 220 140" fill="none" stroke="%2394A3B8" stroke-width="8" stroke-linecap="round"/>
  <!-- Coussinets d'écouteurs -->
  <rect x="40" y="140" width="40" height="85" rx="20" fill="%23020617"/>
  <rect x="220" y="140" width="40" height="85" rx="20" fill="%23020617"/>
  <circle cx="60" cy="182" r="16" fill="%23334155"/>
  <circle cx="240" cy="182" r="16" fill="%23334155"/>
</svg>`;

export const HEADSET_IMG_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="%23FFFFFF"/>
  <ellipse cx="150" cy="260" rx="80" ry="12" fill="%230F172A" opacity="0.12"/>
  <!-- Casque plié vue 3/4 profil -->
  <circle cx="120" cy="170" r="55" fill="%230F172A"/>
  <circle cx="120" cy="170" r="42" fill="%23334155"/>
  <circle cx="120" cy="170" r="22" fill="%2394A3B8"/>
  <circle cx="190" cy="150" r="50" fill="%23020617"/>
  <path d="M 120 115 Q 160 80 200 100" fill="none" stroke="%230F172A" stroke-width="16" stroke-linecap="round"/>
</svg>`;

// Paire 2 : Caméra de Sécurité 360° Smart Home (Image 1: Dôme Blanc, Image 2: Vue smartphone connectée)
export const CAMERA_IMG_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="%23FFFFFF"/>
  <ellipse cx="150" cy="265" rx="75" ry="14" fill="%230F172A" opacity="0.1"/>
  <!-- Base circulaire -->
  <ellipse cx="150" cy="240" rx="65" ry="24" fill="%23E2E8F0"/>
  <rect x="85" y="160" width="130" height="80" rx="20" fill="%23F8FAFC"/>
  <!-- Tête sphérique rotative -->
  <circle cx="150" cy="130" r="60" fill="%23F1F5F9" stroke="%23E2E8F0" stroke-width="3"/>
  <!-- Lentille centrale noire avec reflet bleu -->
  <circle cx="150" cy="130" r="28" fill="%230F172A"/>
  <circle cx="150" cy="130" r="16" fill="%230284C7"/>
  <circle cx="145" cy="125" r="5" fill="%23FFFFFF"/>
  <circle cx="150" cy="85" r="3" fill="%2310B981"/>
</svg>`;

export const CAMERA_IMG_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="%23FFFFFF"/>
  <ellipse cx="150" cy="265" rx="85" ry="14" fill="%230F172A" opacity="0.1"/>
  <!-- Caméra à gauche -->
  <g transform="translate(-25, 10)">
    <circle cx="110" cy="130" r="45" fill="%23F1F5F9"/>
    <circle cx="110" cy="130" r="20" fill="%230F172A"/>
    <rect x="65" y="150" width="90" height="60" rx="15" fill="%23E2E8F0"/>
  </g>
  <!-- Smartphone avec flux live bébé à droite -->
  <g transform="translate(150, 40) rotate(6)">
    <rect x="0" y="0" width="85" height="160" rx="14" fill="%230F172A" stroke="%23475569" stroke-width="2"/>
    <rect x="4" y="6" width="77" height="148" rx="10" fill="%23E0F2FE"/>
    <circle cx="42" cy="70" r="22" fill="%23FED7AA"/>
    <text x="42" y="110" font-family="system-ui" font-size="9" font-weight="900" fill="%230284C7" text-anchor="middle">LIVE 1080P</text>
  </g>
</svg>`;

// Paire 3 : Manette Sans Fil Xbox Pro (Image 1: Controller, Image 2: Bundle jeux)
export const CONTROLLER_IMG_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="%23FFFFFF"/>
  <ellipse cx="150" cy="260" rx="90" ry="14" fill="%230F172A" opacity="0.12"/>
  <!-- Corps manette ergonomique -->
  <path d="M 60 160 Q 40 230 85 240 Q 110 240 130 190 L 170 190 Q 190 240 215 240 Q 260 230 240 160 Q 220 100 150 100 Q 80 100 60 160 Z" fill="%231E293B" stroke="%230F172A" stroke-width="3"/>
  <!-- Bouton Xbox Logo -->
  <circle cx="150" cy="130" r="14" fill="%23FFFFFF"/>
  <path d="M 143 124 Q 150 134 157 124 M 143 136 Q 150 126 157 136" stroke="%230F172A" stroke-width="3" fill="none"/>
  <!-- D-Pad & Joysticks -->
  <circle cx="110" cy="155" r="16" fill="%23020617"/>
  <circle cx="180" cy="180" r="16" fill="%23020617"/>
  <circle cx="195" cy="140" r="6" fill="%23EF4444"/>
  <circle cx="210" cy="155" r="6" fill="%233B82F6"/>
</svg>`;

export const CONTROLLER_IMG_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="%23FFFFFF"/>
  <ellipse cx="150" cy="260" rx="90" ry="14" fill="%230F172A" opacity="0.12"/>
  <!-- Boîte Game Pass à gauche -->
  <rect x="50" y="80" width="95" height="145" rx="6" fill="%2315803D" stroke="%23166534" stroke-width="2"/>
  <circle cx="97" cy="120" r="18" fill="%23FFFFFF"/>
  <text x="97" y="160" font-family="system-ui" font-size="11" font-weight="900" fill="%23FFFFFF" text-anchor="middle">GAME PASS</text>
  <rect x="65" y="180" width="65" height="16" rx="4" fill="%23FEF08A"/>
  <text x="97" y="192" font-family="system-ui" font-size="8" font-weight="900" fill="%231E293B" text-anchor="middle">ULTIMATE</text>
  <!-- Manette posée à droite -->
  <circle cx="205" cy="165" r="48" fill="%230F172A"/>
  <circle cx="190" cy="155" r="12" fill="%23475569"/>
  <circle cx="220" cy="175" r="12" fill="%23475569"/>
</svg>`;

// Paire 4 : Smartphone 5G Mint Pro (Image 1: Coque menthe & étui, Image 2: Vue écran)
export const MINT_PHONE_IMG_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="%23FFFFFF"/>
  <ellipse cx="150" cy="260" rx="80" ry="14" fill="%230F172A" opacity="0.1"/>
  <!-- Téléphone dos menthe avec capteurs -->
  <g transform="translate(85, 45) rotate(-10)">
    <rect x="0" y="0" width="95" height="190" rx="22" fill="%23A7F3D0" stroke="%2334D399" stroke-width="2"/>
    <rect x="10" y="10" width="38" height="48" rx="12" fill="%23065F46"/>
    <circle cx="29" cy="23" r="8" fill="%230F172A"/>
    <circle cx="29" cy="43" r="8" fill="%230F172A"/>
  </g>
  <!-- Deuxième téléphone incliné -->
  <g transform="translate(135, 60) rotate(16)">
    <rect x="0" y="0" width="85" height="175" rx="20" fill="%236EE7B7" stroke="%2310B981" stroke-width="2"/>
    <rect x="6" y="6" width="73" height="163" rx="14" fill="%23064E3B"/>
    <circle cx="42" cy="70" r="18" fill="%23FDE047"/>
  </g>
</svg>`;

export const MINT_PHONE_IMG_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="%23FFFFFF"/>
  <ellipse cx="150" cy="260" rx="70" ry="12" fill="%230F172A" opacity="0.1"/>
  <!-- Vue plein écran AMOLED dynamique -->
  <rect x="95" y="40" width="110" height="215" rx="24" fill="%230F172A" stroke="%2334D399" stroke-width="3"/>
  <rect x="100" y="46" width="100" height="203" rx="18" fill="%230284C7"/>
  <circle cx="150" cy="55" r="3.5" fill="%23000000"/>
  <!-- Fond coloré écran d'accueil -->
  <ellipse cx="150" cy="150" rx="42" ry="42" fill="%23F43F5E"/>
  <text x="150" y="115" font-family="system-ui" font-size="18" font-weight="900" fill="%23FFFFFF" text-anchor="middle">09:42</text>
  <text x="150" y="132" font-family="system-ui" font-size="9" font-weight="700" fill="%23BAE6FD" text-anchor="middle">5G ULTRA</text>
</svg>`;

// Paire 5 : Montre Connectée Pro Fitness (Image 1: Face, Image 2: Capteurs dos)
export const WATCH_IMG_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="%23FFFFFF"/>
  <ellipse cx="150" cy="265" rx="70" ry="12" fill="%230F172A" opacity="0.12"/>
  <!-- Bracelet silicone noir -->
  <rect x="120" y="25" width="60" height="80" rx="10" fill="%231E293B"/>
  <rect x="120" y="195" width="60" height="80" rx="10" fill="%231E293B"/>
  <!-- Boîtier rectangulaire incurvé -->
  <rect x="90" y="85" width="120" height="130" rx="28" fill="%230F172A" stroke="%23334155" stroke-width="3"/>
  <rect x="98" y="93" width="104" height="114" rx="22" fill="%23020617"/>
  <!-- Cadran numérique 09:35 -->
  <text x="150" y="145" font-family="system-ui" font-size="34" font-weight="900" fill="%2338BDF8" text-anchor="middle">09</text>
  <text x="150" y="185" font-family="system-ui" font-size="34" font-weight="900" fill="%2338BDF8" text-anchor="middle">35</text>
  <circle cx="178" cy="115" r="5" fill="%2322C55E"/>
</svg>`;

export const WATCH_IMG_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="%23FFFFFF"/>
  <ellipse cx="150" cy="265" rx="70" ry="12" fill="%230F172A" opacity="0.12"/>
  <rect x="120" y="25" width="60" height="80" rx="10" fill="%23334155"/>
  <rect x="120" y="195" width="60" height="80" rx="10" fill="%23334155"/>
  <!-- Dos de la montre avec capteurs LED verts cardio -->
  <rect x="90" y="85" width="120" height="130" rx="28" fill="%231E293B"/>
  <circle cx="150" cy="150" r="38" fill="%230F172A" stroke="%23475569" stroke-width="2"/>
  <circle cx="140" cy="142" r="6" fill="%2322C55E"/>
  <circle cx="160" cy="142" r="6" fill="%2322C55E"/>
  <circle cx="140" cy="158" r="6" fill="%2322C55E"/>
  <circle cx="160" cy="158" r="6" fill="%2322C55E"/>
</svg>`;
