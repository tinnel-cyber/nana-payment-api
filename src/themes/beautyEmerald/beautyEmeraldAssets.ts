/**
 * ASSETS VECTORIELS FOOL-PROOF POUR LE THÈME BEAUTY EMERALD & OR
 * Garantit un rendu 100% indestructible et haute couture sans aucune dépendance réseau externe.
 */

// Motif botanique feuillage fin pour les coins du Hero (opacité 0.12, couleur #0F4C3A)
export const BOTANICAL_LEAF_PATTERN_CORNER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" fill="none">
  <g stroke="#0F4C3A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <!-- Branche principale fluide -->
    <path d="M15,15 C60,40 120,95 180,180 C210,225 245,265 285,285" fill="none"/>
    <path d="M60,40 C95,20 140,25 170,55" fill="none"/>
    <path d="M120,95 C145,75 195,85 215,120" fill="none"/>
    <path d="M180,180 C210,160 255,175 270,215" fill="none"/>

    <!-- Feuilles botaniques élancées (Style Eucalyptus & Olivier Sauvage) -->
    <path d="M30,22 C45,15 65,25 60,40 C55,55 35,45 30,22 Z" fill="#0F4C3A" fill-opacity="0.35"/>
    <path d="M75,32 C95,20 115,35 110,50 C105,65 85,55 75,32 Z" fill="#0F4C3A" fill-opacity="0.25"/>
    <path d="M120,40 C145,28 168,48 160,65 C152,82 130,70 120,40 Z" fill="#0F4C3A" fill-opacity="0.35"/>
    
    <path d="M90,75 C108,60 132,70 125,88 C118,105 98,95 90,75 Z" fill="#0F4C3A" fill-opacity="0.3"/>
    <path d="M140,98 C162,80 188,95 180,115 C172,132 148,120 140,98 Z" fill="#0F4C3A" fill-opacity="0.4"/>
    <path d="M175,125 C200,105 228,125 220,148 C212,168 185,152 175,125 Z" fill="#0F4C3A" fill-opacity="0.3"/>

    <path d="M150,150 C172,130 198,142 192,162 C185,180 160,172 150,150 Z" fill="#0F4C3A" fill-opacity="0.35"/>
    <path d="M195,185 C222,162 250,180 242,205 C232,228 205,212 195,185 Z" fill="#0F4C3A" fill-opacity="0.4"/>
    <path d="M225,225 C252,205 280,225 272,250 C262,272 235,255 225,225 Z" fill="#0F4C3A" fill-opacity="0.35"/>
    
    <!-- Bourgeons & détails dorés doux -->
    <circle cx="170" cy="55" r="3" fill="#C59B27" fill-opacity="0.5" stroke="none"/>
    <circle cx="215" cy="120" r="3.5" fill="#C59B27" fill-opacity="0.5" stroke="none"/>
    <circle cx="270" cy="215" r="3" fill="#C59B27" fill-opacity="0.5" stroke="none"/>
  </g>
</svg>
`)}`;

// Composition Podium Magazine Haute Couture (Flacons Skincare sur Podium Marbre & Or)
export const BEAUTY_HERO_PODIUM_FLACONS_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 800" width="100%" height="100%" fill="none">
  <defs>
    <!-- Dégradés podium marbre & lumière -->
    <linearGradient id="podiumGrad1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="60%" stop-color="#F2EFE9"/>
      <stop offset="100%" stop-color="#E2DCD2"/>
    </linearGradient>
    <linearGradient id="podiumGrad2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FDFBF7"/>
      <stop offset="100%" stop-color="#E5E0D5"/>
    </linearGradient>
    <linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#DFBF60"/>
      <stop offset="50%" stop-color="#FDE89D"/>
      <stop offset="100%" stop-color="#B88A1F"/>
    </linearGradient>
    
    <!-- Dégradé Flacon Brun Ambré / Noir Botanique Mat -->
    <linearGradient id="bottleMatte" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1A2823"/>
      <stop offset="35%" stop-color="#2D433A"/>
      <stop offset="70%" stop-color="#1A2823"/>
      <stop offset="100%" stop-color="#0E1814"/>
    </linearGradient>
    <linearGradient id="tubeMatte" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#555A4C"/>
      <stop offset="40%" stop-color="#727967"/>
      <stop offset="80%" stop-color="#4B5043"/>
      <stop offset="100%" stop-color="#3A3E33"/>
    </linearGradient>
    <linearGradient id="jarMatte" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#40322B"/>
      <stop offset="30%" stop-color="#5C4B41"/>
      <stop offset="75%" stop-color="#3A2C25"/>
      <stop offset="100%" stop-color="#241B17"/>
    </linearGradient>
    
    <!-- Dégradé Sphère Dorée Réfléchissante -->
    <radialGradient id="goldSphere" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#FFF5D6"/>
      <stop offset="30%" stop-color="#F3CE65"/>
      <stop offset="75%" stop-color="#C59B27"/>
      <stop offset="100%" stop-color="#7A580A"/>
    </radialGradient>
    
    <!-- Filtres d'ombres portées douces -->
    <filter id="softShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#111C18" flood-opacity="0.14"/>
    </filter>
    <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="35" result="blur"/>
    </filter>
  </defs>

  <!-- Halo de lumière chaude en arrière plan -->
  <circle cx="450" cy="380" r="300" fill="#EAE5DA" opacity="0.45" filter="url(#subtleGlow)"/>

  <!-- Grande Arche Circulaire Décorative Studio Minimaliste (Exacte Image 1) -->
  <g transform="translate(180, 70)">
    <circle cx="240" cy="240" r="235" stroke="#FFFFFF" stroke-width="16" fill="none" opacity="0.95" filter="url(#softShadow)"/>
    <circle cx="240" cy="240" r="230" stroke="#EFECE6" stroke-width="2" fill="none"/>
    <circle cx="240" cy="240" r="226" stroke="#DFBF60" stroke-width="1" fill="none" opacity="0.5"/>
  </g>

  <!-- Vase Céramique avec Herbes Botaniques Séchées à Gauche -->
  <g transform="translate(70, 420)">
    <!-- Tiges et épis de blé / pampas dorés séchés -->
    <path d="M60,-80 Q55,-140 40,-210" stroke="#C2B29A" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M60,-80 Q70,-150 85,-230" stroke="#C2B29A" stroke-width="2" stroke-linecap="round"/>
    <path d="M60,-80 Q62,-130 65,-190" stroke="#B8A58A" stroke-width="2" stroke-linecap="round"/>
    <!-- Épis délicats -->
    <ellipse cx="40" cy="-210" rx="6" ry="16" transform="rotate(-15 40 -210)" fill="#D4C5AE"/>
    <ellipse cx="43" cy="-185" rx="5" ry="14" transform="rotate(-10 43 -185)" fill="#C2B29A"/>
    <ellipse cx="85" cy="-230" rx="5" ry="15" transform="rotate(15 85 -230)" fill="#D4C5AE"/>
    <ellipse cx="80" cy="-205" rx="5" ry="14" transform="rotate(12 80 -205)" fill="#C2B29A"/>
    <ellipse cx="65" cy="-190" rx="5" ry="16" fill="#D8CBBA"/>
    
    <!-- Vase cannelé blanc mat -->
    <path d="M42,240 L45,-30 Q60,-35 75,-30 L78,240 Z" fill="#FDFCFB" filter="url(#softShadow)"/>
    <!-- Cannelures du vase -->
    <path d="M48,-28 L51,240" stroke="#EAE5DA" stroke-width="1.5"/>
    <path d="M54,-29 L57,240" stroke="#EAE5DA" stroke-width="1.5"/>
    <path d="M60,-30 L60,240" stroke="#EAE5DA" stroke-width="1.5"/>
    <path d="M66,-29 L63,240" stroke="#EAE5DA" stroke-width="1.5"/>
    <path d="M72,-28 L69,240" stroke="#EAE5DA" stroke-width="1.5"/>
  </g>

  <!-- GRAND PODIUM CYLINDRIQUE BLANC & MARBRE (BASE) -->
  <g transform="translate(140, 580)" filter="url(#softShadow)">
    <!-- Base podium -->
    <path d="M0,70 Q280,120 560,70 L560,180 Q280,230 0,180 Z" fill="url(#podiumGrad1)"/>
    <!-- Bordure dorée du bas -->
    <path d="M0,175 Q280,225 560,175 L560,180 Q280,230 0,180 Z" fill="url(#goldRing)"/>
    <!-- Plateau supérieur du podium -->
    <ellipse cx="280" cy="70" rx="280" ry="46" fill="#FFFFFF"/>
    <!-- Filet or champagne autour du plateau -->
    <ellipse cx="280" cy="70" rx="279" ry="45.5" stroke="url(#goldRing)" stroke-width="2.5" fill="none"/>
  </g>

  <!-- PETIT PODIUM SURELEVE A GAUCHE -->
  <g transform="translate(100, 620)" filter="url(#softShadow)">
    <path d="M0,45 Q130,75 260,45 L260,115 Q130,145 0,115 Z" fill="url(#podiumGrad2)"/>
    <ellipse cx="130" cy="45" rx="130" ry="26" fill="#FDFBF7"/>
    <ellipse cx="130" cy="45" rx="129" ry="25.5" stroke="url(#goldRing)" stroke-width="1.8" fill="none"/>
  </g>

  <!-- PRODUIT 1 (GAUCHE) : TUBE COSMÉTIQUE ÉLANCÉ MAT AVEC BOUCHON OR -->
  <g transform="translate(160, 420)" filter="url(#softShadow)">
    <!-- Corps du tube -->
    <path d="M22,30 C20,120 16,190 12,220 L68,220 C64,190 60,120 58,30 Z" fill="url(#tubeMatte)"/>
    <!-- Haut scellé serti du tube -->
    <rect x="20" y="22" width="40" height="8" rx="1.5" fill="#3D4236"/>
    <!-- Bouchon cylindrique en Or Champagne brossé -->
    <rect x="22" y="220" width="36" height="52" rx="2" fill="url(#goldRing)"/>
    <line x1="22" y1="242" x2="58" y2="242" stroke="#A77A16" stroke-width="1"/>
    
    <!-- Étiquette Minimaliste Bodoni sur le tube -->
    <text x="40" y="115" font-family="'Bodoni Moda', serif" font-size="7.5" font-weight="600" fill="#EFECE6" text-anchor="middle" letter-spacing="1">BOTANICAL</text>
    <text x="40" y="127" font-family="'Outfit', sans-serif" font-size="5.5" font-weight="400" fill="#C59B27" text-anchor="middle" letter-spacing="1.5">SOIN ÉCLAT</text>
    <text x="40" y="137" font-family="'Outfit', sans-serif" font-size="4" fill="#A8AEA1" text-anchor="middle">50ml • 1.7 fl.oz</text>
  </g>

  <!-- PRODUIT 2 (CENTRE-GAUCHE) : POT DE CRÈME LUXE AVEC COUVERCLE OR MAT -->
  <g transform="translate(285, 480)" filter="url(#softShadow)">
    <!-- Couvercle Or Champagne brossé -->
    <ellipse cx="65" cy="40" rx="64" ry="14" fill="#F8E5A7"/>
    <path d="M1,40 Q65,56 129,40 L129,78 Q65,94 1,78 Z" fill="url(#goldRing)"/>
    <ellipse cx="65" cy="78" rx="64" ry="14" fill="url(#goldRing)"/>
    <line x1="2" y1="58" x2="128" y2="58" stroke="#9E7311" stroke-width="0.8" opacity="0.6"/>

    <!-- Corps du pot de crème (verre mat teinté chaud) -->
    <path d="M6,78 Q65,94 124,78 L122,145 Q65,162 8,145 Z" fill="url(#jarMatte)"/>
    <ellipse cx="65" cy="144" rx="57" ry="11" fill="#1C1411"/>
    
    <!-- Étiquette sérigraphiée sur le pot -->
    <text x="65" y="114" font-family="'Bodoni Moda', serif" font-size="10" font-weight="600" font-style="italic" fill="#F2EFE9" text-anchor="middle" letter-spacing="1">Crème Royale</text>
    <text x="65" y="126" font-family="'Outfit', sans-serif" font-size="5.5" font-weight="600" fill="#DFBF60" text-anchor="middle" letter-spacing="2">SOIN JEUNESSE</text>
  </g>

  <!-- PRODUIT 3 (CENTRE-DROITE) : GRAND FLACON POMPE SÉRUM NOIR ÉMERAUDE & OR -->
  <g transform="translate(430, 360)" filter="url(#softShadow)">
    <!-- Buse et pompe de distribution dorée -->
    <path d="M68,52 L68,18 Q68,14 64,14 L30,16 Q26,16 26,20 L27,24 L60,22 L60,52 Z" fill="url(#goldRing)"/>
    <path d="M50,42 L72,42 L72,52 L50,52 Z" fill="url(#goldRing)"/>
    <!-- Col doré de fixation de la pompe -->
    <rect x="42" y="52" width="30" height="26" rx="2" fill="url(#goldRing)"/>
    <line x1="42" y1="65" x2="72" y2="65" stroke="#8E650A" stroke-width="1"/>
    
    <!-- Épaulement élégant arrondi -->
    <path d="M22,118 C22,86 42,78 57,78 C72,78 92,86 92,118 L92,305 C92,320 84,324 57,324 C30,324 22,320 22,305 Z" fill="url(#bottleMatte)"/>
    <!-- Base arrondie -->
    <ellipse cx="57" cy="305" rx="35" ry="10" fill="#0C1411"/>
    
    <!-- Ligne de reflet vertical verre luxueux -->
    <path d="M30,118 C30,95 44,88 52,86 L52,305 C44,305 30,300 30,290 Z" fill="#FFFFFF" opacity="0.08"/>

    <!-- Sérigraphie Haute Cosmétique Botanique -->
    <g transform="translate(57, 185)">
      <!-- Mini couronne / fleur de lotus stylisée dorée -->
      <path d="M-10,-24 Q0,-32 10,-24 Q6,-16 0,-14 Q-6,-16 -10,-24 Z" fill="#C59B27"/>
      <circle cx="0" cy="-28" r="1.5" fill="#FDE89D"/>
      
      <text x="0" y="0" font-family="'Bodoni Moda', serif" font-size="12" font-weight="600" font-style="italic" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">Élixir Botanique</text>
      <text x="0" y="14" font-family="'Outfit', sans-serif" font-size="6" font-weight="700" fill="#DFBF60" text-anchor="middle" letter-spacing="2">SOIN PURIFIANT</text>
      <line x1="-20" y1="22" x2="20" y2="22" stroke="#C59B27" stroke-width="0.8" opacity="0.7"/>
      <text x="0" y="32" font-family="'Outfit', sans-serif" font-size="4.8" fill="#D3DCD6" text-anchor="middle" letter-spacing="0.8">HUILE SACRÉE & HYALURONIQUE</text>
      <text x="0" y="44" font-family="'Outfit', sans-serif" font-size="5" font-weight="500" fill="#A8AEA1" text-anchor="middle">100ml • 3.4 fl.oz</text>
    </g>
  </g>

  <!-- SPHERES METALLIQUES DOREES SUR LE PODIUM (Reflets Studio Mode) -->
  <!-- Grande sphère au premier plan centre -->
  <g transform="translate(295, 680)" filter="url(#softShadow)">
    <circle cx="28" cy="28" r="28" fill="url(#goldSphere)"/>
    <ellipse cx="20" cy="18" rx="8" ry="5" transform="rotate(-30 20 18)" fill="#FFFFFF" opacity="0.6"/>
  </g>
  
  <!-- Petite sphère à droite -->
  <g transform="translate(540, 685)" filter="url(#softShadow)">
    <circle cx="18" cy="18" r="18" fill="url(#goldSphere)"/>
    <ellipse cx="13" cy="12" rx="5" ry="3" transform="rotate(-30 13 12)" fill="#FFFFFF" opacity="0.6"/>
  </g>
</svg>
`)}`;

// Flacon Sérum Pipette Goutte à Goutte Isolé (Haute Résolution)
export const BEAUTY_FLACON_SERUM_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" fill="none">
  <defs>
    <linearGradient id="serumBody" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0F4C3A"/>
      <stop offset="45%" stop-color="#1B6A53"/>
      <stop offset="85%" stop-color="#0F4C3A"/>
      <stop offset="100%" stop-color="#082A20"/>
    </linearGradient>
    <linearGradient id="goldCollar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#C59B27"/>
      <stop offset="50%" stop-color="#F9E29B"/>
      <stop offset="100%" stop-color="#9C7714"/>
    </linearGradient>
  </defs>
  <!-- Pipette Bulbe Caoutchouc Blanc Mat -->
  <path d="M175,40 C175,20 185,15 200,15 C215,15 225,20 225,40 L225,60 L175,60 Z" fill="#F4F4F4"/>
  <!-- Bague Dorée de la Pipette -->
  <rect x="170" y="60" width="60" height="35" rx="3" fill="url(#goldCollar)"/>
  <line x1="170" y1="78" x2="230" y2="78" stroke="#7E5F09" stroke-width="1"/>
  <!-- Flacon Cylindrique Émeraude Foncé -->
  <path d="M140,135 C140,105 160,95 178,95 L222,95 C240,95 260,105 260,135 L260,420 C260,435 250,445 235,445 L165,445 C150,445 140,435 140,420 Z" fill="url(#serumBody)"/>
  <!-- Étiquette Dorée -->
  <rect x="155" y="195" width="90" height="150" rx="2" fill="#FFFFFF" fill-opacity="0.95"/>
  <rect x="158" y="198" width="84" height="144" stroke="#C59B27" stroke-width="1" fill="none"/>
  <text x="200" y="240" font-family="'Bodoni Moda', serif" font-size="11" font-weight="600" font-style="italic" fill="#111C18" text-anchor="middle">Sérum C</text>
  <text x="200" y="258" font-family="'Outfit', sans-serif" font-size="6.5" font-weight="700" fill="#C59B27" text-anchor="middle" letter-spacing="1.5">ÉCLAT BOTANIQUE</text>
  <text x="200" y="280" font-family="'Outfit', sans-serif" font-size="5" fill="#666" text-anchor="middle">30ml • 1.0 fl.oz</text>
</svg>
`)}`;

// Pot Crème Régénérante Isolé
export const BEAUTY_FLACON_CREAM_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <defs>
    <linearGradient id="creamLid" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#C59B27"/>
      <stop offset="50%" stop-color="#FCEAB3"/>
      <stop offset="100%" stop-color="#8E6B0F"/>
    </linearGradient>
    <linearGradient id="creamJar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#EFECE6"/>
      <stop offset="40%" stop-color="#FFFFFF"/>
      <stop offset="85%" stop-color="#E2DDD4"/>
      <stop offset="100%" stop-color="#D0C9BD"/>
    </linearGradient>
  </defs>
  <!-- Couvercle Or Champagne -->
  <ellipse cx="200" cy="110" rx="100" ry="22" fill="#FCEAB3"/>
  <path d="M100,110 Q200,134 300,110 L300,165 Q200,190 100,165 Z" fill="url(#creamLid)"/>
  <ellipse cx="200" cy="165" rx="100" ry="22" fill="url(#creamLid)"/>
  <!-- Corps du Pot Porcelaine Chaude -->
  <path d="M110,165 Q200,190 290,165 L285,275 Q200,305 115,275 Z" fill="url(#creamJar)"/>
  <!-- Étiquette Dorée -->
  <text x="200" y="225" font-family="'Bodoni Moda', serif" font-size="14" font-weight="600" font-style="italic" fill="#111C18" text-anchor="middle">Baume Céleste</text>
  <text x="200" y="244" font-family="'Outfit', sans-serif" font-size="7.5" font-weight="700" fill="#C59B27" text-anchor="middle" letter-spacing="2">RÉGÉNÉRANT NUIT</text>
</svg>
`)}`;

// Flacon Parfum Cristal & Or
export const BEAUTY_FLACON_PARFUM_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" fill="none">
  <defs>
    <linearGradient id="perfumeGlass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#EAF1ED" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#D1E0D7" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="perfumeJuice" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#D7BA6B"/>
      <stop offset="50%" stop-color="#EED591"/>
      <stop offset="100%" stop-color="#B89437"/>
    </linearGradient>
  </defs>
  <!-- Capot Carré Or Champagne -->
  <rect x="165" y="40" width="70" height="60" rx="3" fill="#C59B27"/>
  <rect x="172" y="46" width="56" height="48" fill="#E8CD7E"/>
  <rect x="180" y="100" width="40" height="20" fill="#0F4C3A"/>
  <!-- Flacon Biseauté Style Joaillerie -->
  <rect x="120" y="120" width="160" height="280" rx="6" fill="url(#perfumeGlass)" stroke="#0F4C3A" stroke-width="2"/>
  <!-- Jus Parfumé Intérieur -->
  <rect x="135" y="160" width="130" height="225" rx="3" fill="url(#perfumeJuice)" fill-opacity="0.55"/>
  <!-- Plaque Étiquette Métallique -->
  <rect x="150" y="220" width="100" height="70" rx="2" fill="#FFFFFF" stroke="#C59B27" stroke-width="1.5"/>
  <text x="200" y="250" font-family="'Bodoni Moda', serif" font-size="12" font-weight="600" font-style="italic" fill="#111C18" text-anchor="middle">Oud & Rose</text>
  <text x="200" y="266" font-family="'Outfit', sans-serif" font-size="6.5" font-weight="700" fill="#0F4C3A" text-anchor="middle" letter-spacing="2">EXTRAIT PUR</text>
</svg>
`)}`;

// Flacon Spray Cosmétique Vert Sauge ("Smooth Essen" - Exact Image 1)
export const BEAUTY_SPRAY_SAGE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 650" fill="none">
  <defs>
    <linearGradient id="sageBody" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6F7C6B"/>
      <stop offset="30%" stop-color="#8E9B89"/>
      <stop offset="70%" stop-color="#7D8A78"/>
      <stop offset="100%" stop-color="#556051"/>
    </linearGradient>
    <linearGradient id="sprayCap" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#D1CABE"/>
      <stop offset="45%" stop-color="#F2ECE1"/>
      <stop offset="100%" stop-color="#BDB4A5"/>
    </linearGradient>
    <linearGradient id="nozzle" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#C59B27"/>
      <stop offset="50%" stop-color="#FDE89D"/>
      <stop offset="100%" stop-color="#9E7616"/>
    </linearGradient>
  </defs>
  <!-- Capuchon Spray Semi-Translucide -->
  <rect x="165" y="45" width="70" height="95" rx="5" fill="url(#sprayCap)" opacity="0.9"/>
  <!-- Buse spray intérieure -->
  <rect x="180" y="80" width="40" height="60" rx="3" fill="url(#nozzle)"/>
  <circle cx="200" cy="95" r="3.5" fill="#111C18"/>
  <!-- Bague / Col Doré brossé -->
  <rect x="160" y="135" width="80" height="28" rx="2" fill="url(#nozzle)"/>
  <!-- Corps du Flacon Cylindrique Mat -->
  <path d="M125,210 C125,170 145,160 170,160 L230,160 C255,160 275,170 275,210 L275,590 C275,615 255,625 230,625 L170,625 C145,625 125,615 125,590 Z" fill="url(#sageBody)"/>
  <!-- Reflet verre doux -->
  <path d="M138,210 C138,185 150,175 165,172 L165,610 C150,608 138,598 138,580 Z" fill="#FFFFFF" opacity="0.12"/>
  <!-- Sérigraphie Logo & Nom Image 1 -->
  <g transform="translate(200, 370)">
    <circle cx="0" cy="-60" r="18" stroke="#111C18" stroke-width="1.2" fill="none" opacity="0.6"/>
    <path d="M-10,-55 Q0,-72 10,-55" stroke="#111C18" stroke-width="1.2" fill="none" opacity="0.6"/>
    <text x="0" y="-20" font-family="'Outfit', sans-serif" font-size="8.5" font-weight="700" fill="#202A1E" text-anchor="middle" letter-spacing="3">COSMETIC</text>
    <text x="0" y="-8" font-family="'Outfit', sans-serif" font-size="9" font-weight="800" fill="#202A1E" text-anchor="middle" letter-spacing="4">SPRAY</text>
    <text x="0" y="42" font-family="'Syne', sans-serif" font-size="14" font-weight="800" fill="#111C18" text-anchor="middle">GLOW<tspan fill="#C59B27">.</tspan></text>
    <text x="0" y="65" font-family="'Outfit', sans-serif" font-size="7" font-weight="500" fill="#4B5647" text-anchor="middle" letter-spacing="1">150ml • 5.1 fl.oz</text>
  </g>
</svg>
`)}`;

// Flacon Spray Cosmétique Bleu Ciel ("Urban Decay" - Exact Image 1)
export const BEAUTY_SPRAY_BLUE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 650" fill="none">
  <defs>
    <linearGradient id="blueBody" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#469BC7"/>
      <stop offset="30%" stop-color="#67BEEB"/>
      <stop offset="70%" stop-color="#55A9D4"/>
      <stop offset="100%" stop-color="#327A9F"/>
    </linearGradient>
    <linearGradient id="silverCap" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#D0D6DC"/>
      <stop offset="45%" stop-color="#F5F8FA"/>
      <stop offset="100%" stop-color="#B2B9C0"/>
    </linearGradient>
    <linearGradient id="silverNozzle" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#CBD1D7"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#9DA5AD"/>
    </linearGradient>
  </defs>
  <!-- Capuchon -->
  <rect x="165" y="45" width="70" height="95" rx="5" fill="url(#silverCap)" opacity="0.95"/>
  <rect x="180" y="80" width="40" height="60" rx="3" fill="url(#silverNozzle)"/>
  <circle cx="200" cy="95" r="3.5" fill="#111C18"/>
  <rect x="160" y="135" width="80" height="28" rx="2" fill="url(#silverNozzle)"/>
  <!-- Corps Bleu -->
  <path d="M125,210 C125,170 145,160 170,160 L230,160 C255,160 275,170 275,210 L275,590 C275,615 255,625 230,625 L170,625 C145,625 125,615 125,590 Z" fill="url(#blueBody)"/>
  <path d="M138,210 C138,185 150,175 165,172 L165,610 C150,608 138,598 138,580 Z" fill="#FFFFFF" opacity="0.18"/>
  <!-- Sérigraphie -->
  <g transform="translate(200, 370)">
    <circle cx="0" cy="-60" r="18" stroke="#FFFFFF" stroke-width="1.2" fill="none" opacity="0.8"/>
    <path d="M-10,-55 Q0,-72 10,-55" stroke="#FFFFFF" stroke-width="1.2" fill="none" opacity="0.8"/>
    <text x="0" y="-20" font-family="'Outfit', sans-serif" font-size="8.5" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="3" opacity="0.9">COSMETIC</text>
    <text x="0" y="-8" font-family="'Outfit', sans-serif" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="4" opacity="0.9">SPRAY</text>
    <text x="0" y="42" font-family="'Syne', sans-serif" font-size="14" font-weight="800" fill="#FFFFFF" text-anchor="middle">GLOW<tspan fill="#FCEAB3">.</tspan></text>
    <text x="0" y="65" font-family="'Outfit', sans-serif" font-size="7" font-weight="500" fill="#D3E9F5" text-anchor="middle" letter-spacing="1">150ml • 5.1 fl.oz</text>
  </g>
</svg>
`)}`;

// Flacon Spray Cosmétique Rose Poudré ("Smoothing Essence" - Exact Image 1)
export const BEAUTY_SPRAY_ROSE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 650" fill="none">
  <defs>
    <linearGradient id="roseBody" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#9F686F"/>
      <stop offset="30%" stop-color="#BD868D"/>
      <stop offset="70%" stop-color="#AA7279"/>
      <stop offset="100%" stop-color="#804D54"/>
    </linearGradient>
    <linearGradient id="roseCap" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#DFD6D3"/>
      <stop offset="45%" stop-color="#F9F4F2"/>
      <stop offset="100%" stop-color="#C5B9B6"/>
    </linearGradient>
    <linearGradient id="goldCollarRose" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#C59B27"/>
      <stop offset="50%" stop-color="#FDE89D"/>
      <stop offset="100%" stop-color="#9E7616"/>
    </linearGradient>
  </defs>
  <!-- Capuchon -->
  <rect x="165" y="45" width="70" height="95" rx="5" fill="url(#roseCap)" opacity="0.95"/>
  <rect x="180" y="80" width="40" height="60" rx="3" fill="url(#goldCollarRose)"/>
  <circle cx="200" cy="95" r="3.5" fill="#111C18"/>
  <rect x="160" y="135" width="80" height="28" rx="2" fill="url(#goldCollarRose)"/>
  <!-- Corps Rose Mauve -->
  <path d="M125,210 C125,170 145,160 170,160 L230,160 C255,160 275,170 275,210 L275,590 C275,615 255,625 230,625 L170,625 C145,625 125,615 125,590 Z" fill="url(#roseBody)"/>
  <path d="M138,210 C138,185 150,175 165,172 L165,610 C150,608 138,598 138,580 Z" fill="#FFFFFF" opacity="0.15"/>
  <!-- Sérigraphie -->
  <g transform="translate(200, 370)">
    <circle cx="0" cy="-60" r="18" stroke="#FFFFFF" stroke-width="1.2" fill="none" opacity="0.8"/>
    <path d="M-10,-55 Q0,-72 10,-55" stroke="#FFFFFF" stroke-width="1.2" fill="none" opacity="0.8"/>
    <text x="0" y="-20" font-family="'Outfit', sans-serif" font-size="8.5" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="3" opacity="0.9">COSMETIC</text>
    <text x="0" y="-8" font-family="'Outfit', sans-serif" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="4" opacity="0.9">SPRAY</text>
    <text x="0" y="42" font-family="'Syne', sans-serif" font-size="14" font-weight="800" fill="#FFFFFF" text-anchor="middle">GLOW<tspan fill="#FCEAB3">.</tspan></text>
    <text x="0" y="65" font-family="'Outfit', sans-serif" font-size="7" font-weight="500" fill="#F4DFE2" text-anchor="middle" letter-spacing="1">150ml • 5.1 fl.oz</text>
  </g>
</svg>
`)}`;

// Flacon Spray Cosmétique Pêche / Abricot ("Red Lipstick" - Exact Image 1)
export const BEAUTY_SPRAY_PEACH_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 650" fill="none">
  <defs>
    <linearGradient id="peachBody" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#DF956C"/>
      <stop offset="30%" stop-color="#F2AE87"/>
      <stop offset="70%" stop-color="#E59E75"/>
      <stop offset="100%" stop-color="#C27A52"/>
    </linearGradient>
    <linearGradient id="peachCap" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#E3DDD7"/>
      <stop offset="45%" stop-color="#FAF6F2"/>
      <stop offset="100%" stop-color="#CEC5BC"/>
    </linearGradient>
    <linearGradient id="goldCollarPeach" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#C59B27"/>
      <stop offset="50%" stop-color="#FDE89D"/>
      <stop offset="100%" stop-color="#9E7616"/>
    </linearGradient>
  </defs>
  <!-- Capuchon -->
  <rect x="165" y="45" width="70" height="95" rx="5" fill="url(#peachCap)" opacity="0.95"/>
  <rect x="180" y="80" width="40" height="60" rx="3" fill="url(#goldCollarPeach)"/>
  <circle cx="200" cy="95" r="3.5" fill="#111C18"/>
  <rect x="160" y="135" width="80" height="28" rx="2" fill="url(#goldCollarPeach)"/>
  <!-- Corps Pêche Abricot -->
  <path d="M125,210 C125,170 145,160 170,160 L230,160 C255,160 275,170 275,210 L275,590 C275,615 255,625 230,625 L170,625 C145,625 125,615 125,590 Z" fill="url(#peachBody)"/>
  <path d="M138,210 C138,185 150,175 165,172 L165,610 C150,608 138,598 138,580 Z" fill="#FFFFFF" opacity="0.15"/>
  <!-- Sérigraphie -->
  <g transform="translate(200, 370)">
    <circle cx="0" cy="-60" r="18" stroke="#111C18" stroke-width="1.2" fill="none" opacity="0.6"/>
    <path d="M-10,-55 Q0,-72 10,-55" stroke="#111C18" stroke-width="1.2" fill="none" opacity="0.6"/>
    <text x="0" y="-20" font-family="'Outfit', sans-serif" font-size="8.5" font-weight="700" fill="#2E2018" text-anchor="middle" letter-spacing="3">COSMETIC</text>
    <text x="0" y="-8" font-family="'Outfit', sans-serif" font-size="9" font-weight="800" fill="#2E2018" text-anchor="middle" letter-spacing="4">SPRAY</text>
    <text x="0" y="42" font-family="'Syne', sans-serif" font-size="14" font-weight="800" fill="#111C18" text-anchor="middle">GLOW<tspan fill="#C59B27">.</tspan></text>
    <text x="0" y="65" font-family="'Outfit', sans-serif" font-size="7" font-weight="500" fill="#694C3B" text-anchor="middle" letter-spacing="1">150ml • 5.1 fl.oz</text>
  </g>
</svg>
`)}`;

// Vignette Vidéo UGC 1 : Application Sérum Goutte à Goutte
export const BEAUTY_ROUTINE_SERUM_REEL_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640" fill="none">
  <defs>
    <linearGradient id="reelGrad1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1A2D25"/>
      <stop offset="60%" stop-color="#0F4C3A"/>
      <stop offset="100%" stop-color="#071E16"/>
    </linearGradient>
  </defs>
  <rect width="360" height="640" fill="url(#reelGrad1)"/>
  <!-- Halo lumineux doux -->
  <circle cx="180" cy="280" r="140" fill="#EAE5DA" opacity="0.15"/>
  <!-- Pipette & Goutte de Sérum en suspension -->
  <path d="M172,120 L188,120 L188,260 L180,290 L172,260 Z" fill="#FFFFFF" opacity="0.9"/>
  <circle cx="180" cy="330" r="14" fill="#FCEAB3"/>
  <circle cx="178" cy="326" r="4" fill="#FFFFFF" opacity="0.8"/>
  <path d="M180,305 C184,315 186,325 180,335 C174,325 176,315 180,305 Z" fill="#FCEAB3"/>
  <!-- Particules d'éclat doré -->
  <circle cx="130" cy="240" r="3" fill="#C59B27"/>
  <circle cx="230" cy="270" r="4" fill="#C59B27"/>
  <circle cx="140" cy="380" r="2.5" fill="#C59B27"/>
  <circle cx="220" cy="370" r="3" fill="#C59B27"/>
</svg>
`)}`;

// Vignette Vidéo UGC 2 : Massage Liftant Gua Sha
export const BEAUTY_ROUTINE_MASSAGE_REEL_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640" fill="none">
  <defs>
    <linearGradient id="reelGrad2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2D1F23"/>
      <stop offset="60%" stop-color="#4A343A"/>
      <stop offset="100%" stop-color="#1E1418"/>
    </linearGradient>
    <linearGradient id="guashaStone" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F2C5CD"/>
      <stop offset="50%" stop-color="#DE9AA6"/>
      <stop offset="100%" stop-color="#C27A87"/>
    </linearGradient>
  </defs>
  <rect width="360" height="640" fill="url(#reelGrad2)"/>
  <circle cx="180" cy="300" r="130" fill="#FDF3E7" opacity="0.12"/>
  <!-- Pierre Gua Sha Quartz Rose Stylisée -->
  <path d="M120,240 C140,200 220,210 240,260 C260,310 230,370 180,390 C130,410 100,340 110,290 C115,265 110,250 120,240 Z" fill="url(#guashaStone)" filter="drop-shadow(0 15px 25px rgba(0,0,0,0.3))"/>
  <path d="M140,255 C160,230 210,240 220,280" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
  <!-- Lignes de drainage lymphatique douces -->
  <path d="M70,300 Q180,260 290,300" stroke="#C59B27" stroke-width="1.5" stroke-dasharray="4 6" opacity="0.7"/>
  <path d="M80,340 Q180,300 280,340" stroke="#C59B27" stroke-width="1.5" stroke-dasharray="4 6" opacity="0.7"/>
</svg>
`)}`;

// Vignette Vidéo UGC 3 : Brume Fixatrice & Nuage Botanique
export const BEAUTY_ROUTINE_MIST_REEL_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640" fill="none">
  <defs>
    <linearGradient id="reelGrad3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#14262E"/>
      <stop offset="50%" stop-color="#1D404E"/>
      <stop offset="100%" stop-color="#0E1A20"/>
    </linearGradient>
  </defs>
  <rect width="360" height="640" fill="url(#reelGrad3)"/>
  <!-- Nuage de brume micro-gouttelettes -->
  <circle cx="180" cy="270" r="90" fill="#E2F2FB" opacity="0.18"/>
  <circle cx="140" cy="240" r="60" fill="#FFFFFF" opacity="0.2"/>
  <circle cx="220" cy="250" r="70" fill="#CDE9F7" opacity="0.18"/>
  <!-- Micro gouttelettes scintillantes -->
  <circle cx="120" cy="200" r="4" fill="#FFFFFF"/>
  <circle cx="160" cy="180" r="3" fill="#FFFFFF"/>
  <circle cx="210" cy="190" r="5" fill="#FFFFFF"/>
  <circle cx="240" cy="230" r="3" fill="#FFFFFF"/>
  <circle cx="100" cy="260" r="2.5" fill="#FFFFFF"/>
  <circle cx="260" cy="290" r="4" fill="#FFFFFF"/>
  <circle cx="180" cy="340" r="3.5" fill="#FFFFFF"/>
  <!-- Silhouette flacon spray au bas -->
  <rect x="155" y="440" width="50" height="130" rx="6" fill="#67BEEB" opacity="0.6"/>
  <rect x="170" y="415" width="20" height="25" fill="#FFFFFF" opacity="0.7"/>
</svg>
`)}`;

// ======================= ÉTAPE 4 : ASSETS AVIS IMMERSIFS & FOOTER =======================

// 1. Photo Lifestyle / Résultat Olivia
export const BEAUTY_TESTIMONIAL_OLIVIA_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700" fill="none">
  <defs>
    <linearGradient id="oliviaSkinGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F7E6D8"/>
      <stop offset="50%" stop-color="#EED3C1"/>
      <stop offset="100%" stop-color="#D7B59F"/>
    </linearGradient>
    <linearGradient id="oliviaBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EBF4EE"/>
      <stop offset="60%" stop-color="#DFECE4"/>
      <stop offset="100%" stop-color="#C5DDD0"/>
    </linearGradient>
  </defs>
  <rect width="600" height="700" fill="url(#oliviaBg)"/>
  <!-- Rayon de soleil lumineux -->
  <circle cx="500" cy="100" r="280" fill="#FFFDF8" opacity="0.45"/>
  <!-- Éléments botaniques flous d'ambiance -->
  <path d="M-50,200 C50,150 150,250 120,400 C90,550 -30,600 -50,200 Z" fill="#0F4C3A" opacity="0.12"/>
  <path d="M450,400 C550,300 650,450 620,600 C590,750 470,700 450,400 Z" fill="#C59B27" opacity="0.1"/>
  <!-- Silhouette artistique visage radieux & éclat sain -->
  <circle cx="300" cy="310" r="140" fill="url(#oliviaSkinGrad)"/>
  <path d="M190,440 C210,500 250,560 300,560 C350,560 390,500 410,440 Z" fill="url(#oliviaSkinGrad)"/>
  <!-- Chevelure soyeuse stylisée -->
  <path d="M160,300 C150,160 250,120 300,120 C360,120 450,160 440,320 C420,460 440,580 430,680 L170,680 C160,580 180,440 160,300 Z" fill="#3D2B1F" opacity="0.88"/>
  <!-- Éclat de lumière sur les pommettes (Highlighter Glow) -->
  <ellipse cx="250" cy="330" rx="35" ry="20" fill="#FFFFFF" opacity="0.38"/>
  <ellipse cx="350" cy="330" rx="35" ry="20" fill="#FFFFFF" opacity="0.38"/>
  <ellipse cx="300" cy="270" rx="25" ry="12" fill="#FFFFFF" opacity="0.25"/>
  <!-- Paillettes de rosée dorée -->
  <circle cx="240" cy="320" r="3" fill="#C59B27"/>
  <circle cx="360" cy="320" r="3" fill="#C59B27"/>
  <!-- Flacon miniature tenu délicatement -->
  <rect x="275" y="470" width="50" height="90" rx="6" fill="#1A2823"/>
  <rect x="290" y="450" width="20" height="20" rx="2" fill="#C59B27"/>
</svg>
`)}`;

// Avatar rond Olivia
export const BEAUTY_TESTIMONIAL_OLIVIA_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <rect width="100" height="100" fill="#F4E6DC"/>
  <circle cx="50" cy="45" r="26" fill="#E2C2AB"/>
  <path d="M26,95 C28,72 40,68 50,68 C60,68 72,72 74,95 Z" fill="#3D2B1F"/>
  <path d="M24,45 C24,20 40,16 50,16 C60,16 76,20 76,45 C70,42 62,35 50,35 C38,35 30,42 24,45 Z" fill="#3D2B1F"/>
  <circle cx="50" cy="45" r="48" stroke="#FFFFFF" stroke-width="4"/>
</svg>
`)}`;

// 2. Photo Lifestyle / Résultat Emma
export const BEAUTY_TESTIMONIAL_EMMA_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700" fill="none">
  <defs>
    <linearGradient id="emmaSkinGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ECD7C8"/>
      <stop offset="60%" stop-color="#DEBEA8"/>
      <stop offset="100%" stop-color="#CFA78F"/>
    </linearGradient>
    <linearGradient id="emmaBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FBF7F0"/>
      <stop offset="50%" stop-color="#EFECE6"/>
      <stop offset="100%" stop-color="#DFD7CA"/>
    </linearGradient>
  </defs>
  <rect width="600" height="700" fill="url(#emmaBg)"/>
  <!-- Feuillage botanique stylisé -->
  <path d="M500,80 C400,120 320,240 380,360 C440,480 580,450 620,300 Z" fill="#0F4C3A" opacity="0.15"/>
  <circle cx="280" cy="300" r="140" fill="url(#emmaSkinGrad)"/>
  <path d="M170,440 C190,510 240,570 300,570 C360,570 410,510 430,440 Z" fill="url(#emmaSkinGrad)"/>
  <path d="M140,290 C130,130 250,90 300,90 C360,90 470,130 460,310 C440,450 470,580 460,680 L140,680 C130,580 160,450 140,290 Z" fill="#7A4B29" opacity="0.9"/>
  <!-- Éclat du teint -->
  <ellipse cx="230" cy="320" rx="32" ry="18" fill="#FFFFFF" opacity="0.4"/>
  <ellipse cx="330" cy="320" rx="32" ry="18" fill="#FFFFFF" opacity="0.4"/>
  <circle cx="230" cy="315" r="3.5" fill="#C59B27"/>
  <circle cx="330" cy="315" r="3.5" fill="#C59B27"/>
  <!-- Pot de crème de soin au bas -->
  <rect x="250" y="490" width="80" height="55" rx="8" fill="#FFFFFF" stroke="#C59B27" stroke-width="2"/>
  <rect x="245" y="475" width="90" height="15" rx="4" fill="#C59B27"/>
</svg>
`)}`;

// Avatar rond Emma
export const BEAUTY_TESTIMONIAL_EMMA_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <rect width="100" height="100" fill="#FBF3EC"/>
  <circle cx="50" cy="45" r="26" fill="#D7B59F"/>
  <path d="M26,95 C28,72 40,68 50,68 C60,68 72,72 74,95 Z" fill="#7A4B29"/>
  <path d="M22,45 C22,18 38,15 50,15 C62,15 78,18 78,45 C72,42 62,35 50,35 C38,35 28,42 22,45 Z" fill="#7A4B29"/>
  <circle cx="50" cy="45" r="48" stroke="#FFFFFF" stroke-width="4"/>
</svg>
`)}`;

// 3. Photo Lifestyle / Résultat Sophia
export const BEAUTY_TESTIMONIAL_SOPHIA_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700" fill="none">
  <defs>
    <linearGradient id="sophiaSkinGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#D9A888"/>
      <stop offset="50%" stop-color="#BE8B69"/>
      <stop offset="100%" stop-color="#9E6C4C"/>
    </linearGradient>
    <linearGradient id="sophiaBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F3F0E8"/>
      <stop offset="60%" stop-color="#E5DEC9"/>
      <stop offset="100%" stop-color="#D2C8AF"/>
    </linearGradient>
  </defs>
  <rect width="600" height="700" fill="url(#sophiaBg)"/>
  <!-- Halo champagne de fond -->
  <circle cx="300" cy="280" r="240" fill="#FDF7E7" opacity="0.6"/>
  <circle cx="300" cy="300" r="140" fill="url(#sophiaSkinGrad)"/>
  <path d="M180,440 C200,510 240,570 300,570 C360,570 400,510 420,440 Z" fill="url(#sophiaSkinGrad)"/>
  <path d="M150,280 C140,110 250,70 300,70 C360,70 460,110 450,290 C430,440 460,580 450,680 L150,680 C140,580 170,440 150,280 Z" fill="#1C1815" opacity="0.95"/>
  <!-- Éclat du teint sublimé -->
  <ellipse cx="250" cy="320" rx="30" ry="16" fill="#FFFFFF" opacity="0.32"/>
  <ellipse cx="350" cy="320" rx="30" ry="16" fill="#FFFFFF" opacity="0.32"/>
  <circle cx="250" cy="315" r="3.5" fill="#C59B27"/>
  <circle cx="350" cy="315" r="3.5" fill="#C59B27"/>
  <!-- Flacon parfum avec poire de vaporisation dorée -->
  <rect x="270" y="470" width="60" height="85" rx="6" fill="#0F4C3A"/>
  <circle cx="300" cy="450" r="12" fill="#C59B27"/>
</svg>
`)}`;

// Avatar rond Sophia
export const BEAUTY_TESTIMONIAL_SOPHIA_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <rect width="100" height="100" fill="#EAD9CC"/>
  <circle cx="50" cy="45" r="26" fill="#BE8B69"/>
  <path d="M26,95 C28,72 40,68 50,68 C60,68 72,72 74,95 Z" fill="#1C1815"/>
  <path d="M22,45 C22,18 38,15 50,15 C62,15 78,18 78,45 C72,42 62,35 50,35 C38,35 28,42 22,45 Z" fill="#1C1815"/>
  <circle cx="50" cy="45" r="48" stroke="#FFFFFF" stroke-width="4"/>
</svg>
`)}`;

// Motif Marbre Noir Subtil & Nervures Dorées pour le Footer
export const BEAUTY_MARBLE_DARK_PATTERN_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" fill="none">
  <g opacity="0.08" stroke="#FFFFFF" stroke-width="1.2">
    <!-- Nervures de marbre noir fines et élégantes -->
    <path d="M-50,120 Q120,80 250,180 T480,220 T650,150" fill="none"/>
    <path d="M250,180 Q320,310 290,440 T410,580" fill="none"/>
    <path d="M120,80 Q90,260 40,380 T150,550" fill="none"/>
    <path d="M380,30 Q440,160 520,290 T620,490" fill="none"/>
    <path d="M-20,420 Q150,380 290,440" fill="none"/>
  </g>
  <g opacity="0.06" stroke="#C59B27" stroke-width="1">
    <path d="M-20,200 Q200,160 380,280 T620,260" fill="none"/>
    <path d="M200,160 Q260,340 350,480" fill="none"/>
  </g>
</svg>
`)}`;

// Rameau botanique doré pour les angles du Footer
export const BEAUTY_FOOTER_BOTANICAL_CORNER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none">
  <g stroke="#C59B27" stroke-width="1.2" opacity="0.25">
    <path d="M10,10 C40,30 90,75 140,140 C170,180 200,210 230,230" fill="none"/>
    <path d="M25,18 C38,12 55,20 50,32 C45,44 28,36 25,18 Z" fill="#C59B27" fill-opacity="0.2"/>
    <path d="M60,28 C75,18 90,30 85,42 C80,54 65,46 60,28 Z" fill="#C59B27" fill-opacity="0.2"/>
    <path d="M98,38 C115,26 130,42 125,55 C120,68 105,58 98,38 Z" fill="#C59B27" fill-opacity="0.2"/>
    <path d="M75,65 C90,52 108,60 102,74 C96,88 80,80 75,65 Z" fill="#C59B27" fill-opacity="0.2"/>
    <path d="M115,85 C132,70 150,82 144,98 C138,112 120,102 115,85 Z" fill="#C59B27" fill-opacity="0.2"/>
    <circle cx="140" cy="50" r="2.5" fill="#C59B27"/>
    <circle cx="170" cy="100" r="2.5" fill="#C59B27"/>
  </g>
</svg>
`)}`;



