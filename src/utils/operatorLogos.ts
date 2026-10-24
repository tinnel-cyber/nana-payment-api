// =============================================================================
// CATALOGUE VECTORIEL COMPLET DES LOGOS OPÉRATEURS AFRICAINS SEBPAY (20 PAYS)
// Conformité stricte : SVG 100% vectoriels, fonds transparents, hyper-localisation
// =============================================================================

// Chargement automatique et optimisé de tous les logos vectoriels SVG
const logoFiles = import.meta.glob<{ default: string }>('../assets/logos/*/*.svg', {
  eager: true,
  import: 'default'
});

// Table d'indexation ultra-rapide O(1)
export const OPERATOR_LOGOS_MAP: Record<string, string> = {};

for (const filePath in logoFiles) {
  // filePath a la forme "../assets/logos/bf/orange.svg" ou "/src/assets/logos/bf/orange.svg"
  const match = filePath.match(/logos\/([^/]+)\/([^/]+)\.svg$/i);
  if (match) {
    const country = match[1].toLowerCase().trim();
    const code = match[2].toLowerCase().trim();
    const url = (logoFiles[filePath] as unknown as string) || '';

    // Indexation croisée multi-clefs
    OPERATOR_LOGOS_MAP[`${country}/${code}`] = url;
    OPERATOR_LOGOS_MAP[`${code}-${country}`] = url;
    OPERATOR_LOGOS_MAP[`${country}-${code}`] = url;
    OPERATOR_LOGOS_MAP[`${code}_${country}`] = url;
    OPERATOR_LOGOS_MAP[`${country}_${code}`] = url;

    // Indexation générique par code si pas encore présent
    if (!OPERATOR_LOGOS_MAP[code]) {
      OPERATOR_LOGOS_MAP[code] = url;
    }
  }
}

/**
 * Récupère le logo vectoriel certifié officiel Sebpay pour un opérateur et son pays
 * @param operatorIdentifier Code, Nom ou Slug de l'opérateur (ex: "moov-bf", "orange", "mtn-ci", "M-PESA")
 * @param countryCode Code ISO du pays (ex: "BF", "CI", "SN", "BJ", "CD", etc.)
 */
export function getOperatorLogo(operatorIdentifier: string, countryCode?: string): string | null {
  if (!operatorIdentifier) return null;

  const raw = operatorIdentifier.toLowerCase().trim();
  const country = (countryCode || '').toLowerCase().trim();

  // Nettoyage des préfixes usuels ("wallet ligdicash" -> "wligdicash", "orange money" -> "orange")
  let cleanId = raw
    .replace(/^wallet\s+/i, 'w')
    .replace(/\s+money$/i, '')
    .replace(/\s+cash$/i, '')
    .replace(/\s+/g, '-')
    .trim();

  // 1. Recherche par couple explicite pays/code
  if (country) {
    if (OPERATOR_LOGOS_MAP[`${country}/${cleanId}`]) {
      return OPERATOR_LOGOS_MAP[`${country}/${cleanId}`];
    }
    if (OPERATOR_LOGOS_MAP[`${cleanId}-${country}`]) {
      return OPERATOR_LOGOS_MAP[`${cleanId}-${country}`];
    }
  }

  // 2. Recherche directe par slug (ex: "moov-bf", "orange-ci", "wligdicash-bf")
  if (OPERATOR_LOGOS_MAP[cleanId]) {
    return OPERATOR_LOGOS_MAP[cleanId];
  }
  if (OPERATOR_LOGOS_MAP[raw]) {
    return OPERATOR_LOGOS_MAP[raw];
  }

  // 3. Décomposition du slug (ex: "afrimoney-cd" -> "afrimoney", "cd")
  const parts = cleanId.split(/[-_]/);
  if (parts.length >= 2) {
    const [c1, c2] = [parts[0], parts[parts.length - 1]];
    if (OPERATOR_LOGOS_MAP[`${c2}/${c1}`]) return OPERATOR_LOGOS_MAP[`${c2}/${c1}`];
    if (OPERATOR_LOGOS_MAP[`${c1}/${c2}`]) return OPERATOR_LOGOS_MAP[`${c1}/${c2}`];
  }

  // 4. Mappage sémantique par mots-clés bancaires
  const brandKeywords = [
    'wligdicash', 'ligdicash',
    'afrimoney',
    'airtel',
    'mpesa', 'm-pesa',
    'vodacom',
    'orange',
    'mtn', 'momo',
    'moov',
    'wave',
    'mobicash',
    'amanata',
    'nita',
    'zamani',
    'togocom', 'tmoney', 't-money',
    'celtiis',
    'coris',
    'telecel',
    'tigopesa', 'tigo',
    'halopesa', 'halo',
    'ezypesa', 'ezy',
    'free',
    'emoney', 'e-money',
    'bankily',
    'masrvi',
    'sedad',
    'paystack',
    'visa', 'mastercard', 'apple'
  ];

  for (const kw of brandKeywords) {
    if (raw.includes(kw) || cleanId.includes(kw)) {
      const alias = kw === 'momo' ? 'mtn' :
                    kw === 'tmoney' || kw === 't-money' ? 'togocom' :
                    kw === 'ligdicash' ? 'wligdicash' :
                    kw === 'm-pesa' ? 'mpesa' :
                    kw === 'halo' ? 'halopesa' :
                    kw === 'ezy' ? 'ezypesa' :
                    kw === 'tigo' ? 'tigopesa' : kw;

      if (country && OPERATOR_LOGOS_MAP[`${country}/${alias}`]) {
        return OPERATOR_LOGOS_MAP[`${country}/${alias}`];
      }
      if (OPERATOR_LOGOS_MAP[alias]) {
        return OPERATOR_LOGOS_MAP[alias];
      }
    }
  }

  return null;
}
