import { MobileOperatorConfig } from '../types';

export interface GeneratedUssdResult {
  ussdString: string;
  dialString: string; // alias
  telLink: string;
  telUri: string; // alias
  merchantCode: string;
  isBurkinaOrangeMoney: boolean;
  instructionText: string;
  instructions: string; // alias
}

const DEFAULT_BURKINA_ORANGE_MERCHANT_CODE = '65565805';

/**
 * Génère la syntaxe USSD dynamique et le lien direct de composition tel:*...%23
 */
export function generateUssdDialString(
  operator?: MobileOperatorConfig | null,
  amount: number = 0,
  fallbackMerchantCode: string = DEFAULT_BURKINA_ORANGE_MERCHANT_CODE
): GeneratedUssdResult {
  const cleanAmount = Math.max(0, Math.round(amount));

  // Vérifie s'il s'agit d'Orange Money Burkina Faso
  const isBurkina = operator?.country?.toLowerCase().includes('burkina') || false;
  const isOrange = operator?.operator?.toLowerCase().includes('orange') || false;
  const isBurkinaOrangeMoney = isBurkina && isOrange;

  // Résout le code marchand
  let merchantCode = operator?.merchantCode?.trim() || '';
  if (!merchantCode && operator?.merchantNumber) {
    const rawNumber = operator.merchantNumber.replace(/[^0-9]/g, '');
    // Si c'est un code marchand court (ex: 65565805), on l'utilise directement
    if (rawNumber.length >= 6 && rawNumber.length <= 8) {
      merchantCode = rawNumber;
    }
  }

  if (!merchantCode) {
    merchantCode = fallbackMerchantCode;
  }

  let ussdString = '';

  // 1. Burkina Faso Orange Money : Syntaxe normalisée *144*10*CodeMarchand*Montant#
  if (isBurkinaOrangeMoney) {
    ussdString = `*144*10*${merchantCode}*${cleanAmount}#`;
  } else if (operator?.ussdTemplate) {
    // 2. Modèle USSD dynamique configurable par l'admin
    ussdString = operator.ussdTemplate
      .replace(/\{merchantCode\}/gi, merchantCode)
      .replace(/\{codeMarchand\}/gi, merchantCode)
      .replace(/\{montant\}/gi, String(cleanAmount))
      .replace(/\{montantTotal\}/gi, String(cleanAmount));
  } else if (operator?.ussdCode) {
    // 3. Fallback sur le champ ussdCode existant
    ussdString = operator.ussdCode
      .replace(/montant/gi, String(cleanAmount))
      .replace(/\{montant\}/gi, String(cleanAmount));
  } else {
    ussdString = `*144*10*${merchantCode}*${cleanAmount}#`;
  }

  // Encodage strict du caractère '#' en '%23' pour le protocole tel: afin d'éviter la troncature par Android/iOS
  const telLink = `tel:${ussdString.replace(/#/g, '%23')}`;

  const instructionText = operator?.instructions ||
    (isBurkinaOrangeMoney
      ? `Veuillez composer le code suivant sur votre téléphone Orange Money pour valider votre règlement de ${cleanAmount.toLocaleString('fr-FR')} FCFA :`
      : `Veuillez composer le code USSD ci-dessous pour effectuer le paiement :`);

  return {
    ussdString,
    dialString: ussdString,
    telLink,
    telUri: telLink,
    merchantCode,
    isBurkinaOrangeMoney,
    instructionText,
    instructions: instructionText
  };
}
