const fs = require('fs');
const path = require('path');

// =============================================================================
// LISTE EXHAUSTIVE DES OPÉRATEURS OFFICIELS SEBPAY PAR PAYS
// =============================================================================
const OPERATORS_CATALOG = [
  // Burkina Faso (bf)
  { country: 'bf', slug: 'moov-bf', code: 'moov', name: 'Moov Money BF', type: 'moov', label: 'BF • Onatel', flag: 'bf' },
  { country: 'bf', slug: 'orange-bf', code: 'orange', name: 'Orange Money BF', type: 'orange', label: 'BF • +226', flag: 'bf' },
  { country: 'bf', slug: 'wligdicash-bf', code: 'wligdicash', name: 'Wallet LigdiCash BF', type: 'ligdicash', label: 'BF • LigdiCash', flag: 'bf' },
  { country: 'bf', slug: 'wave-bf', code: 'wave', name: 'Wave BF', type: 'wave', label: 'BF • Wave', flag: 'bf' },

  // R.D.C (cd)
  { country: 'cd', slug: 'afrimoney-cd', code: 'afrimoney', name: 'Afri Money RDC', type: 'afrimoney', label: 'CD • Africell', flag: 'cd' },
  { country: 'cd', slug: 'airtel-cd', code: 'airtel', name: 'Airtel Money RDC', type: 'airtel', label: 'CD • +243', flag: 'cd' },
  { country: 'cd', slug: 'mpesa-cd', code: 'mpesa', name: 'M-Pesa RDC', type: 'mpesa', label: 'CD • Vodacom', flag: 'cd' },
  { country: 'cd', slug: 'orange-cd', code: 'orange', name: 'Orange Money RDC', type: 'orange', label: 'CD • +243', flag: 'cd' },
  { country: 'cd', slug: 'vodacom-cd', code: 'vodacom', name: 'Vodacom RDC', type: 'vodacom', label: 'CD • Vodacom', flag: 'cd' },

  // Congo (cg)
  { country: 'cg', slug: 'airtel-cg', code: 'airtel', name: 'Airtel Money Congo', type: 'airtel', label: 'CG • +242', flag: 'cg' },
  { country: 'cg', slug: 'mtn-cg', code: 'mtn', name: 'MTN Money Congo', type: 'mtn', label: 'CG • MoMo', flag: 'cg' },

  // Côte d'Ivoire (ci)
  { country: 'ci', slug: 'moov-ci', code: 'moov', name: 'Moov Money CI', type: 'moov', label: 'CI • Moov', flag: 'ci' },
  { country: 'ci', slug: 'mtn-ci', code: 'mtn', name: 'MTN Money CI', type: 'mtn', label: 'CI • MoMo', flag: 'ci' },
  { country: 'ci', slug: 'orange-ci', code: 'orange', name: 'Orange Money CI', type: 'orange', label: 'CI • +225', flag: 'ci' },
  { country: 'ci', slug: 'wave-ci', code: 'wave', name: 'Wave Money CI', type: 'wave', label: 'CI • Wave', flag: 'ci' },

  // Cameroun (cm)
  { country: 'cm', slug: 'mtn-cm', code: 'mtn', name: 'MTN Money Cameroun', type: 'mtn', label: 'CM • MoMo', flag: 'cm' },
  { country: 'cm', slug: 'orange-cm', code: 'orange', name: 'Orange Money Cameroun', type: 'orange', label: 'CM • +237', flag: 'cm' },

  // Gabon (ga)
  { country: 'ga', slug: 'airtel-ga', code: 'airtel', name: 'Airtel Money Gabon', type: 'airtel', label: 'GA • +241', flag: 'ga' },
  { country: 'ga', slug: 'moov-ga', code: 'moov', name: 'Moov Money Gabon', type: 'moov', label: 'GA • Gabon Telecom', flag: 'ga' },

  // Guinée Conakry (gn)
  { country: 'gn', slug: 'mtn-gn', code: 'mtn', name: 'MTN Money Guinée', type: 'mtn', label: 'GN • Areeba', flag: 'gn' },
  { country: 'gn', slug: 'orange-gn', code: 'orange', name: 'Orange Money Guinée', type: 'orange', label: 'GN • +224', flag: 'gn' },

  // Guinée-Bissau (gw)
  { country: 'gw', slug: 'orange-gw', code: 'orange', name: 'Orange Money Bissau', type: 'orange', label: 'GW • +245', flag: 'gw' },

  // Mali (ml)
  { country: 'ml', slug: 'mobicash-ml', code: 'mobicash', name: 'Mobicash Malitel', type: 'mobicash', label: 'ML • Malitel', flag: 'ml' },
  { country: 'ml', slug: 'moov-ml', code: 'moov', name: 'Moov Money Mali', type: 'moov', label: 'ML • Moov', flag: 'ml' },
  { country: 'ml', slug: 'orange-ml', code: 'orange', name: 'Orange Money Mali', type: 'orange', label: 'ML • +223', flag: 'ml' },

  // Niger (ne)
  { country: 'ne', slug: 'airtel-ne', code: 'airtel', name: 'Airtel Money Niger', type: 'airtel', label: 'NE • +227', flag: 'ne' },
  { country: 'ne', slug: 'amanata-ne', code: 'amanata', name: 'Amanata Transfert', type: 'amanata', label: 'NE • Amanata', flag: 'ne' },
  { country: 'ne', slug: 'moov-ne', code: 'moov', name: 'Moov Money Niger', type: 'moov', label: 'NE • Moov', flag: 'ne' },
  { country: 'ne', slug: 'nita-ne', code: 'nita', name: 'Nita Transfert', type: 'nita', label: 'NE • Nita', flag: 'ne' },
  { country: 'ne', slug: 'wligdicash-ne', code: 'wligdicash', name: 'Wallet LigdiCash Niger', type: 'ligdicash', label: 'NE • LigdiCash', flag: 'ne' },
  { country: 'ne', slug: 'zamani-ne', code: 'zamani', name: 'Zamani Telecom Niger', type: 'zamani', label: 'NE • Zamani', flag: 'ne' },

  // Sénégal (sn)
  { country: 'sn', slug: 'emoney-sn', code: 'emoney', name: 'E-money Sénégal', type: 'emoney', label: 'SN • Expresso', flag: 'sn' },
  { country: 'sn', slug: 'free-sn', code: 'free', name: 'Free Money Sénégal', type: 'free', label: 'SN • Free', flag: 'sn' },
  { country: 'sn', slug: 'orange-sn', code: 'orange', name: 'Orange Money Sénégal', type: 'orange', label: 'SN • Sonatel', flag: 'sn' },
  { country: 'sn', slug: 'wave-sn', code: 'wave', name: 'Wave Money Sénégal', type: 'wave', label: 'SN • Wave', flag: 'sn' },

  // Togo (tg)
  { country: 'tg', slug: 'moov-tg', code: 'moov', name: 'Moov Money Togo', type: 'moov', label: 'TG • Moov', flag: 'tg' },
  { country: 'tg', slug: 'togocom-tg', code: 'togocom', name: 'TogoCom T-Money', type: 'togocom', label: 'TG • T-Money', flag: 'tg' },

  // Bénin (bj)
  { country: 'bj', slug: 'celtiis-bj', code: 'celtiis', name: 'Celtiis Cash Bénin', type: 'celtiis', label: 'BJ • SBIN', flag: 'bj' },
  { country: 'bj', slug: 'coris-bj', code: 'coris', name: 'Coris Money Bénin', type: 'coris', label: 'BJ • Coris Bank', flag: 'bj' },
  { country: 'bj', slug: 'moov-bj', code: 'moov', name: 'Moov Money Bénin', type: 'moov', label: 'BJ • Moov', flag: 'bj' },
  { country: 'bj', slug: 'mtn-bj', code: 'mtn', name: 'MTN Money Bénin', type: 'mtn', label: 'BJ • MoMo', flag: 'bj' },

  // Gambie (gm)
  { country: 'gm', slug: 'afrimoney-gm', code: 'afrimoney', name: 'Afri Money Gambie', type: 'afrimoney', label: 'GM • Africell', flag: 'gm' },

  // Tchad (td)
  { country: 'td', slug: 'airtel-td', code: 'airtel', name: 'Airtel Tchad', type: 'airtel', label: 'TD • +235', flag: 'td' },
  { country: 'td', slug: 'moov-td', code: 'moov', name: 'Moov Tchad', type: 'moov', label: 'TD • Moov', flag: 'td' },

  // Nigéria (ng)
  { country: 'ng', slug: 'airtel-ng', code: 'airtel', name: 'Airtel Smartcash Nigéria', type: 'airtel', label: 'NG • +234', flag: 'ng' },
  { country: 'ng', slug: 'mtn-ng', code: 'mtn', name: 'MTN MoMo PSB Nigéria', type: 'mtn', label: 'NG • MoMo', flag: 'ng' },

  // Ghana (gh)
  { country: 'gh', slug: 'airtel-gh', code: 'airtel', name: 'AirtelTigo Money Ghana', type: 'airtel', label: 'GH • AT Money', flag: 'gh' },
  { country: 'gh', slug: 'mtn-gh', code: 'mtn', name: 'MTN Mobile Money Ghana', type: 'mtn', label: 'GH • MoMo', flag: 'gh' },
  { country: 'gh', slug: 'telecel-gh', code: 'telecel', name: 'Telecel Cash Ghana', type: 'telecel', label: 'GH • Telecel', flag: 'gh' },

  // Kenya (ke)
  { country: 'ke', slug: 'airtel-ke', code: 'airtel', name: 'Airtel Money Kenya', type: 'airtel', label: 'KE • +254', flag: 'ke' },
  { country: 'ke', slug: 'mpesa-ke', code: 'mpesa', name: 'M-Pesa Safaricom Kenya', type: 'mpesa', label: 'KE • Safaricom', flag: 'ke' },

  // Ouganda (ug)
  { country: 'ug', slug: 'airtel-ug', code: 'airtel', name: 'Airtel Money Ouganda', type: 'airtel', label: 'UG • +256', flag: 'ug' },
  { country: 'ug', slug: 'mtn-ug', code: 'mtn', name: 'MTN MoMo Ouganda', type: 'mtn', label: 'UG • MoMo', flag: 'ug' },

  // Tanzanie (tz)
  { country: 'tz', slug: 'airtel-tz', code: 'airtel', name: 'Airtel Money Tanzanie', type: 'airtel', label: 'TZ • +255', flag: 'tz' },
  { country: 'tz', slug: 'ezypesa-tz', code: 'ezypesa', name: 'Ezy Pesa Zantel', type: 'ezypesa', label: 'TZ • Zantel', flag: 'tz' },
  { country: 'tz', slug: 'halo_pesa', code: 'halopesa', name: 'Halo Pesa Halotel', type: 'halopesa', label: 'TZ • Halotel', flag: 'tz' },
  { country: 'tz', slug: 'mpesa-tz', code: 'mpesa', name: 'M-Pesa Vodacom Tanzanie', type: 'mpesa', label: 'TZ • Vodacom', flag: 'tz' },
  { country: 'tz', slug: 'tigopesa-tz', code: 'tigopesa', name: 'Tigo Pesa Tanzanie', type: 'tigopesa', label: 'TZ • Tigo', flag: 'tz' },
];

// Dictionnaires de drapeaux miniatures SVG
const FLAG_SVGS = {
  bf: '<circle cx="4.5" cy="4.5" r="4.5" fill="#ef4444"/><path d="M 0 4.5 A 4.5 4.5 0 0 0 9 4.5 Z" fill="#22c55e"/><circle cx="4.5" cy="4.5" r="1.3" fill="#eab308"/>',
  ci: '<rect x="0" y="0" width="3" height="9" fill="#f97316"/><rect x="3" y="0" width="3" height="9" fill="#ffffff"/><rect x="6" y="0" width="3" height="9" fill="#22c55e"/>',
  sn: '<rect x="0" y="0" width="3" height="9" fill="#16a34a"/><rect x="3" y="0" width="3" height="9" fill="#facc15"/><rect x="6" y="0" width="3" height="9" fill="#dc2626"/><circle cx="4.5" cy="4.5" r="1" fill="#16a34a"/>',
  bj: '<rect x="0" y="0" width="4" height="9" fill="#16a34a"/><rect x="4" y="0" width="5" height="4.5" fill="#facc15"/><rect x="4" y="4.5" width="5" height="4.5" fill="#dc2626"/>',
  cd: '<rect x="0" y="0" width="9" height="9" fill="#0284c7"/><polygon points="0,7 9,2 9,4 0,9" fill="#dc2626"/><polygon points="1,2 2,4 0,3" fill="#eab308"/>',
  cg: '<rect x="0" y="0" width="9" height="9" fill="#16a34a"/><polygon points="0,9 9,0 9,3 3,9" fill="#facc15"/><polygon points="5,9 9,5 9,9" fill="#dc2626"/>',
  cm: '<rect x="0" y="0" width="3" height="9" fill="#16a34a"/><rect x="3" y="0" width="3" height="9" fill="#dc2626"/><rect x="6" y="0" width="3" height="9" fill="#facc15"/><circle cx="4.5" cy="4.5" r="0.9" fill="#facc15"/>',
  ga: '<rect x="0" y="0" width="9" height="3" fill="#16a34a"/><rect x="0" y="3" width="9" height="3" fill="#facc15"/><rect x="0" y="6" width="9" height="3" fill="#0284c7"/>',
  gn: '<rect x="0" y="0" width="3" height="9" fill="#dc2626"/><rect x="3" y="0" width="3" height="9" fill="#facc15"/><rect x="6" y="0" width="3" height="9" fill="#16a34a"/>',
  gw: '<rect x="0" y="0" width="3.5" height="9" fill="#dc2626"/><rect x="3.5" y="0" width="5.5" height="4.5" fill="#facc15"/><rect x="3.5" y="4.5" width="5.5" height="4.5" fill="#16a34a"/><circle cx="1.7" cy="4.5" r="1.1" fill="#000000"/>',
  ml: '<rect x="0" y="0" width="3" height="9" fill="#16a34a"/><rect x="3" y="0" width="3" height="9" fill="#facc15"/><rect x="6" y="0" width="3" height="9" fill="#dc2626"/>',
  ne: '<rect x="0" y="0" width="9" height="3" fill="#ea580c"/><rect x="0" y="3" width="9" height="3" fill="#ffffff"/><rect x="0" y="6" width="9" height="3" fill="#16a34a"/><circle cx="4.5" cy="4.5" r="1.2" fill="#ea580c"/>',
  tg: '<rect x="0" y="0" width="9" height="9" fill="#16a34a"/><rect x="0" y="1.8" width="9" height="1.8" fill="#facc15"/><rect x="0" y="5.4" width="9" height="1.8" fill="#facc15"/><rect x="0" y="0" width="3.6" height="3.6" fill="#dc2626"/><circle cx="1.8" cy="1.8" r="0.8" fill="#ffffff"/>',
  gm: '<rect x="0" y="0" width="9" height="2.5" fill="#dc2626"/><rect x="0" y="2.5" width="9" height="4" fill="#1e40af"/><rect x="0" y="6.5" width="9" height="2.5" fill="#16a34a"/>',
  td: '<rect x="0" y="0" width="3" height="9" fill="#1e3a8a"/><rect x="3" y="0" width="3" height="9" fill="#facc15"/><rect x="6" y="0" width="3" height="9" fill="#dc2626"/>',
  ng: '<rect x="0" y="0" width="3" height="9" fill="#16a34a"/><rect x="3" y="0" width="3" height="9" fill="#ffffff"/><rect x="6" y="0" width="3" height="9" fill="#16a34a"/>',
  gh: '<rect x="0" y="0" width="9" height="3" fill="#dc2626"/><rect x="0" y="3" width="9" height="3" fill="#facc15"/><rect x="0" y="6" width="9" height="3" fill="#16a34a"/><circle cx="4.5" cy="4.5" r="1.1" fill="#000000"/>',
  ke: '<rect x="0" y="0" width="9" height="2.6" fill="#000000"/><rect x="0" y="3.2" width="9" height="2.6" fill="#b91c1c"/><rect x="0" y="6.4" width="9" height="2.6" fill="#16a34a"/>',
  ug: '<rect x="0" y="0" width="9" height="1.5" fill="#000000"/><rect x="0" y="1.5" width="9" height="1.5" fill="#facc15"/><rect x="0" y="3" width="9" height="1.5" fill="#dc2626"/><rect x="0" y="4.5" width="9" height="1.5" fill="#000000"/><rect x="0" y="6" width="9" height="1.5" fill="#facc15"/><rect x="0" y="7.5" width="9" height="1.5" fill="#dc2626"/>',
  tz: '<polygon points="0,0 9,0 0,9" fill="#16a34a"/><polygon points="0,9 9,0 9,9" fill="#0284c7"/><polygon points="0,8 8,0 9,1 1,9" fill="#facc15"/><polygon points="0,9 9,0 9,2 2,9" fill="#000000"/>'
};

function generateSvgContent(op) {
  const flagClipId = `flag-${op.country}-${op.code}-${Math.random().toString(36).substr(2, 5)}`;
  const flagContent = FLAG_SVGS[op.country] || FLAG_SVGS.bf;
  const flagMarkup = `
    <g transform="translate(4.5, 4.5)">
      <clipPath id="${flagClipId}">
        <circle cx="4.5" cy="4.5" r="4.5"/>
      </clipPath>
      <g clip-path="url(#${flagClipId})">
        ${flagContent}
      </g>
    </g>
  `;

  let innerEmblem = '';
  let brandText = '';
  let badgeColors = { bg: '#eff6ff', stroke: '#bfdbfe', text: '#1e40af' };

  switch (op.type) {
    case 'airtel':
      badgeColors = { bg: '#fef2f2', stroke: '#fecaca', text: '#b91c1c' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <rect x="-28" y="-18" width="56" height="36" rx="14" fill="#e11900"/>
          <path d="M -12 7 C -12 -5, -4 -10, 4 -10 C 12 -10, 14 -3, 14 3 C 14 8, 10 10, 5 10 C 1 10, -2 8, -2 5 C -2 3, 0 1, 4 1 C 8 1, 10 3, 10 6" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
          <circle cx="10" cy="-4" r="2.5" fill="#ffffff"/>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="900" fill="#e11900" text-anchor="middle" letter-spacing="-0.3">airtel<tspan fill="#1e293b" font-weight="700"> money</tspan></text>`;
      break;

    case 'orange':
      badgeColors = { bg: '#fff7ed', stroke: '#fdba74', text: '#c2410c' };
      innerEmblem = `
        <g transform="translate(14, 18) scale(0.42)">
          <path d="M90.15 11.05H24.34c-3.54 0-6.94 1.41-9.45 3.93a13.44 13.44 0 0 0-3.91 9.48c0 3.56 1.4 6.97 3.91 9.49 2.51 2.51 5.91 3.93 9.45 3.93h33.6L3.89 92.1a13.44 13.44 0 0 0-3.91 9.48c0 3.56 1.4 6.97 3.91 9.49 2.51 2.52 5.91 3.93 9.45 3.93 3.54 0 6.94-1.41 9.45-3.93l53.99-54.23v33.68c0 3.56 1.41 6.97 3.91 9.49 2.51 2.51 5.91 3.93 9.45 3.93 3.54 0 6.94-1.41 9.45-3.93a13.44 13.44 0 0 0 3.91-9.49V24.46c0-3.55-1.4-6.96-3.9-9.48a13.34 13.34 0 0 0-9.45-3.93Z" fill="#18181b"/>
          <path d="M130.24 103.95h65.79c3.54 0 6.94-1.41 9.44-3.93a13.44 13.44 0 0 0 3.92-9.48c0-3.56-1.41-6.97-3.92-9.49-2.5-2.51-5.9-3.93-9.44-3.93h-33.55l53.99-54.22a13.44 13.44 0 0 0 3.84-9.46 13.44 13.44 0 0 0-3.91-9.43 13.33 13.33 0 0 0-9.39-3.93 13.33 13.33 0 0 0-9.42 3.85l-54 54.22V24.46c0-3.55-1.4-6.96-3.91-9.48a13.33 13.33 0 0 0-9.45-3.93 13.33 13.33 0 0 0-9.44 3.93 13.44 13.44 0 0 0-3.92 9.48v66.06c0 1.8.36 3.54 1.02 5.14a13.41 13.41 0 0 0 2.9 4.35 13.34 13.34 0 0 0 9.44 3.93Z" fill="#ff7900"/>
        </g>
      `;
      brandText = `<text x="60" y="76" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" fill="#18181b" text-anchor="middle" letter-spacing="-0.3">orange<tspan fill="#ff7900"> money</tspan></text>`;
      break;

    case 'mtn':
      badgeColors = { bg: '#fefce8', stroke: '#fde047', text: '#854d0e' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <rect x="-34" y="-18" width="68" height="36" rx="18" fill="#ffcc00"/>
          <rect x="-30" y="-14" width="60" height="28" rx="14" fill="#000000"/>
          <text x="0" y="5" font-family="'Arial Black', Impact, sans-serif" font-size="14" font-weight="900" fill="#ffcc00" text-anchor="middle" letter-spacing="1.2">MTN</text>
        </g>
      `;
      brandText = `
        <g transform="translate(60, 72)">
          <rect x="-24" y="-9" width="48" height="15" rx="7.5" fill="#002b49"/>
          <text x="0" y="2" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="900" fill="#ffcc00" text-anchor="middle" letter-spacing="0.5">MoMo</text>
        </g>
      `;
      break;

    case 'moov':
      badgeColors = { bg: '#eff6ff', stroke: '#bfdbfe', text: '#1d4ed8' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <circle cx="0" cy="0" r="22" fill="#0066b2" fill-opacity="0.08"/>
          <path d="M -16 -4 C -12 -16, 12 -16, 16 -4 C 13 -1 9 -5, 0 -6 C -8 -6, -13 -2, -16 -4 Z" fill="#0066b2"/>
          <path d="M -18 3 C -14 16, 14 16, 18 3 C 14 6, 8 9, 0 9 C -8 9, -14 6, -18 3 Z" fill="#f37021"/>
          <circle cx="0" cy="0" r="10" fill="#0066b2"/>
          <path d="M -4 0 L 4 0 M 0 -4 L 0 4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
          <circle cx="10" cy="-6" r="3" fill="#f37021"/>
        </g>
      `;
      brandText = `<text x="60" y="73" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" fill="#0066b2" text-anchor="middle" letter-spacing="-0.2">moov<tspan fill="#f37021"> money</tspan></text>`;
      break;

    case 'wave':
      badgeColors = { bg: '#ecfeff', stroke: '#a5f3fc', text: '#0e7490' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <circle cx="0" cy="0" r="23" fill="#1dc4e9"/>
          <ellipse cx="0" cy="2" rx="13" ry="16" fill="#0b2545"/>
          <ellipse cx="0" cy="4" rx="8" ry="11" fill="#ffffff"/>
          <path d="M -11 0 C -15 -4, -18 -8, -17 -11 C -15 -11, -12 -7, -10 -4 Z" fill="#0b2545"/>
          <path d="M 11 0 C 14 3, 14 7, 12 11 C 10 9, 10 4, 9 1 Z" fill="#0b2545"/>
          <circle cx="-3.5" cy="-6" r="1.8" fill="#ffffff"/>
          <circle cx="-3.5" cy="-6" r="1" fill="#0b2545"/>
          <circle cx="3.5" cy="-6" r="1.8" fill="#ffffff"/>
          <circle cx="3.5" cy="-6" r="1" fill="#0b2545"/>
          <polygon points="0,-3 -3.2,-1 3.2,-1" fill="#ff9f1c"/>
          <ellipse cx="-4.5" cy="17" rx="3.5" ry="1.5" fill="#ff9f1c"/>
          <ellipse cx="4.5" cy="17" rx="3.5" ry="1.5" fill="#ff9f1c"/>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="900" fill="#0b2545" text-anchor="middle" letter-spacing="-0.5">wave</text>`;
      break;

    case 'mpesa':
      badgeColors = { bg: '#f0fdf4', stroke: '#bbf7d0', text: '#15803d' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <rect x="-30" y="-18" width="60" height="36" rx="12" fill="#00a859"/>
          <path d="M -14 0 L -4 10 L 14 -8" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <rect x="8" y="-14" width="14" height="14" rx="4" fill="#e11900"/>
          <text x="15" y="-4" font-family="system-ui, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">M</text>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="'Arial Black', sans-serif" font-size="12" font-weight="900" fill="#00a859" text-anchor="middle" letter-spacing="0.5">M-PESA</text>`;
      break;

    case 'vodacom':
      badgeColors = { bg: '#fef2f2', stroke: '#fecaca', text: '#b91c1c' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <circle cx="0" cy="0" r="22" fill="#e60000"/>
          <path d="M 0 -12 C 7 -12, 12 -7, 12 0 C 12 8, 5 14, -2 14 C -8 14, -12 9, -12 3 C -12 -5, -4 -12, 0 -12 Z" fill="#ffffff"/>
          <circle cx="0" cy="1" r="5" fill="#e60000"/>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#e60000" text-anchor="middle">vodacom</text>`;
      break;

    case 'afrimoney':
      badgeColors = { bg: '#faf5ff', stroke: '#e9d5ff', text: '#7e22ce' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <circle cx="0" cy="0" r="22" fill="#702082"/>
          <path d="M -12 8 L 0 -14 L 12 8 L 5 8 L 0 -2 L -5 8 Z" fill="#ff6600"/>
          <circle cx="0" cy="-6" r="3.5" fill="#ffffff"/>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, sans-serif" font-size="10.5" font-weight="900" fill="#702082" text-anchor="middle">afri<tspan fill="#ff6600">money</tspan></text>`;
      break;

    case 'togocom':
      badgeColors = { bg: '#f0fdf4', stroke: '#bbf7d0', text: '#166534' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <rect x="-30" y="-18" width="60" height="36" rx="12" fill="#009639"/>
          <path d="M -20 -6 C -10 -14, 10 -14, 20 -6" stroke="#ffcc00" stroke-width="3" stroke-linecap="round" fill="none"/>
          <text x="0" y="7" font-family="'Arial Black', sans-serif" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle">TMoney</text>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#009639" text-anchor="middle">togocom</text>`;
      break;

    case 'celtiis':
      badgeColors = { bg: '#eff6ff', stroke: '#bfdbfe', text: '#1d4ed8' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <circle cx="0" cy="0" r="22" fill="#0072ce"/>
          <path d="M -12 0 C -12 -8, -4 -8, 0 0 C 4 8, 12 8, 12 0 C 12 -8, 4 -8, 0 0 C -4 8, -12 8, -12 0 Z" stroke="#ffb81c" stroke-width="4" fill="none"/>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#0072ce" text-anchor="middle">celtiis<tspan fill="#da291c"> cash</tspan></text>`;
      break;

    case 'coris':
      badgeColors = { bg: '#eff6ff', stroke: '#93c5fd', text: '#1e3a8a' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <rect x="-24" y="-18" width="48" height="36" rx="10" fill="#003366"/>
          <polygon points="0,-12 3,-3 12,-3 5,2 8,11 0,6 -8,11 -5,2 -12,-3 -3,-3" fill="#cc0000"/>
          <circle cx="0" cy="0" r="3" fill="#ffffff"/>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, sans-serif" font-size="10.5" font-weight="900" fill="#003366" text-anchor="middle">coris<tspan fill="#cc0000"> money</tspan></text>`;
      break;

    case 'ligdicash':
      badgeColors = { bg: '#fff7ed', stroke: '#fed7aa', text: '#c2410c' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <rect x="-26" y="-16" width="52" height="32" rx="8" fill="#ff6f00"/>
          <rect x="-20" y="-10" width="40" height="20" rx="4" fill="#ffffff" fill-opacity="0.2"/>
          <circle cx="8" cy="0" r="5" fill="#2e7d32"/>
          <circle cx="8" cy="0" r="3" fill="#ffb300"/>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, sans-serif" font-size="10.5" font-weight="900" fill="#ff6f00" text-anchor="middle">ligdi<tspan fill="#2e7d32">cash</tspan></text>`;
      break;

    case 'telecel':
      badgeColors = { bg: '#fef2f2', stroke: '#fecaca', text: '#991b1b' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <circle cx="0" cy="0" r="22" fill="#e30613"/>
          <path d="M -12 -8 L 12 -8 M 0 -8 L 0 12" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#e30613" text-anchor="middle">telecel<tspan fill="#1e293b"> cash</tspan></text>`;
      break;

    case 'tigopesa':
      badgeColors = { bg: '#eff6ff', stroke: '#bfdbfe', text: '#1e40af' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <circle cx="0" cy="0" r="22" fill="#00377b"/>
          <circle cx="0" cy="0" r="14" fill="#fdb913"/>
          <circle cx="0" cy="0" r="8" fill="#00377b"/>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#00377b" text-anchor="middle">tigo<tspan fill="#fdb913"> pesa</tspan></text>`;
      break;

    case 'halopesa':
      badgeColors = { bg: '#fff7ed', stroke: '#fed7aa', text: '#c2410c' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <circle cx="0" cy="0" r="22" fill="#ff5000"/>
          <circle cx="0" cy="0" r="16" stroke="#ffffff" stroke-width="3" fill="none"/>
          <circle cx="0" cy="0" r="7" fill="#005bac"/>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#ff5000" text-anchor="middle">halo<tspan fill="#005bac"> pesa</tspan></text>`;
      break;

    case 'ezypesa':
      badgeColors = { bg: '#fef2f2', stroke: '#fecaca', text: '#b91c1c' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <rect x="-26" y="-18" width="52" height="36" rx="10" fill="#e20613"/>
          <text x="0" y="6" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">ezy</text>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#e20613" text-anchor="middle">ezy<tspan fill="#1e293b"> pesa</tspan></text>`;
      break;

    case 'zamani':
      badgeColors = { bg: '#f0fdf4', stroke: '#bbf7d0', text: '#15803d' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <polygon points="0,-20 18,-10 18,10 0,20 -18,10 -18,-10" fill="#00843d"/>
          <path d="M -8 -8 L 8 -8 L -8 8 L 8 8" stroke="#ff7900" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#00843d" text-anchor="middle">zamani</text>`;
      break;

    case 'nita':
    case 'amanata':
      badgeColors = { bg: '#eff6ff', stroke: '#bfdbfe', text: '#1d4ed8' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <rect x="-28" y="-18" width="56" height="36" rx="12" fill="#0284c7"/>
          <path d="M -12 6 L 0 -10 L 12 6" stroke="#f97316" stroke-width="4" stroke-linecap="round" fill="none"/>
          <circle cx="0" cy="2" r="3" fill="#ffffff"/>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#0284c7" text-anchor="middle">${op.type}</text>`;
      break;

    case 'mobicash':
      badgeColors = { bg: '#eff6ff', stroke: '#bfdbfe', text: '#1e40af' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <circle cx="0" cy="0" r="22" fill="#005a9c"/>
          <text x="0" y="7" font-family="'Arial Black', sans-serif" font-size="16" font-weight="900" fill="#f37021" text-anchor="middle">M</text>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, sans-serif" font-size="10.5" font-weight="900" fill="#005a9c" text-anchor="middle">mobi<tspan fill="#f37021">cash</tspan></text>`;
      break;

    case 'emoney':
      badgeColors = { bg: '#faf5ff', stroke: '#e9d5ff', text: '#7e22ce' };
      innerEmblem = `
        <g transform="translate(60, 42)">
          <circle cx="0" cy="0" r="22" fill="#6b21a8"/>
          <text x="0" y="7" font-family="system-ui, sans-serif" font-size="15" font-weight="900" fill="#ffffff" text-anchor="middle">e-</text>
        </g>
      `;
      brandText = `<text x="60" y="75" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#6b21a8" text-anchor="middle">e-money</text>`;
      break;

    case 'free':
      badgeColors = { bg: '#fef2f2', stroke: '#fca5a5', text: '#b91c1c' };
      innerEmblem = `
        <g transform="translate(60, 44)">
          <rect x="-36" y="-18" width="72" height="34" rx="17" fill="#fef2f2"/>
          <text x="-4" y="6" font-family="'Brush Script MT', cursive, sans-serif" font-size="28" font-style="italic" font-weight="900" fill="#cd1e25" text-anchor="middle" letter-spacing="-1">free</text>
        </g>
      `;
      brandText = `
        <g transform="translate(60, 72)">
          <rect x="-24" y="-9" width="48" height="16" rx="8" fill="#cd1e25"/>
          <text x="0" y="3" font-family="system-ui, sans-serif" font-size="9.5" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">MONEY</text>
        </g>
      `;
      break;

    default:
      innerEmblem = `<circle cx="60" cy="42" r="20" fill="#64748b"/>`;
      brandText = `<text x="60" y="75" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#1e293b" text-anchor="middle">${op.name}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" fill="none">
  <!-- ${op.name} (${op.label}) - Official Sebpay Vector Emblem (100% Transparent Background) -->
  <g id="${op.slug}">
    <rect x="4" y="4" width="112" height="112" rx="24" fill="#ffffff" fill-opacity="0.96" stroke="#e2e8f0" stroke-width="1.5"/>
    ${innerEmblem}
    ${brandText}
    <g transform="translate(24, 85)">
      <rect x="0" y="0" width="72" height="18" rx="9" fill="${badgeColors.bg}" stroke="${badgeColors.stroke}" stroke-width="1"/>
      ${flagMarkup}
      <text x="41" y="12.5" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="800" fill="${badgeColors.text}" text-anchor="middle" letter-spacing="0.3">
        ${op.label}
      </text>
    </g>
  </g>
</svg>`;
}

// Génération de tous les fichiers SVG
let generatedCount = 0;
for (const op of OPERATORS_CATALOG) {
  const dir = path.join(__dirname, '..', 'src', 'assets', 'logos', op.country);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Nom du fichier SVG : ex: "orange.svg", "moov.svg", "wligdicash.svg"
  const fileName = `${op.code}.svg`;
  const filePath = path.join(dir, fileName);

  const svg = generateSvgContent(op);
  fs.writeFileSync(filePath, svg, 'utf8');
  generatedCount++;
}

console.log(`SUCCÈS : ${generatedCount} logos vectoriels officiels Sebpay générés avec succès !`);
