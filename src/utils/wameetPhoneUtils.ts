/**
 * Utilitaires de Formatage Téléphonique E.164 & Pays pour Wameet
 * Conforme aux standards internationaux et optimisé pour l'Afrique de l'Ouest & Centrale
 */

export interface CountryDialInfo {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  placeholder: string;
  example: string;
}

export const WEST_AFRICAN_COUNTRIES: CountryDialInfo[] = [
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫', placeholder: '70 12 34 56', example: '+22670123456' },
  { code: 'CI', name: "Côte d'Ivoire", dialCode: '+225', flag: '🇨🇮', placeholder: '07 01 23 45 67', example: '+2250701234567' },
  { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳', placeholder: '77 123 45 67', example: '+221771234567' },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱', placeholder: '66 12 34 56', example: '+22366123456' },
  { code: 'BJ', name: 'Bénin', dialCode: '+229', flag: '🇧🇯', placeholder: '97 12 34 56', example: '+22997123456' },
  { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬', placeholder: '90 12 34 56', example: '+22890123456' },
  { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪', placeholder: '96 12 34 56', example: '+22796123456' },
  { code: 'GN', name: 'Guinée', dialCode: '+224', flag: '🇬🇳', placeholder: '620 12 34 56', example: '+224620123456' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲', placeholder: '6 70 12 34 56', example: '+237670123456' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦', placeholder: '06 12 34 56', example: '+24106123456' },
  { code: 'CG', name: 'Congo-Brazzaville', dialCode: '+242', flag: '🇨🇬', placeholder: '06 123 45 67', example: '+242061234567' },
  { code: 'CD', name: 'RD Congo', dialCode: '+243', flag: '🇨🇩', placeholder: '81 234 56 78', example: '+243812345678' },
  { code: 'TD', name: 'Tchad', dialCode: '+235', flag: '🇹🇩', placeholder: '66 12 34 56', example: '+23566123456' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', placeholder: '6 12 34 56 78', example: '+33612345678' },
  { code: 'US', name: 'USA / Canada', dialCode: '+1', flag: '🇺🇸', placeholder: '555 123 4567', example: '+15551234567' }
];

/**
 * Normalise un numéro brut au format standard international E.164 (+226XXXXXXXX)
 */
export function formatToE164(rawNumber: string, defaultDialCode = '+226'): string {
  if (!rawNumber) return '';

  let cleaned = rawNumber.trim().replace(/[\s\-_().]/g, '');

  // Si commence déjà par '+', on conserve le '+' et les chiffres
  if (cleaned.startsWith('+')) {
    return '+' + cleaned.slice(1).replace(/\D/g, '');
  }

  // Si commence par '00' (ex: 00226...), convertir en '+'
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.slice(2).replace(/\D/g, '');
  }

  // Ne conserver que les chiffres
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (!digitsOnly) return '';

  const cleanDial = defaultDialCode.replace(/\D/g, '');

  // Si le numéro commence déjà par le code pays sans '+' (ex: 22670123456)
  if (digitsOnly.startsWith(cleanDial)) {
    return '+' + digitsOnly;
  }

  // Si le numéro commence par un 0 local (ex: 07000000 -> supprimer le 0 et préfixer)
  const nationalNumber = digitsOnly.startsWith('0') ? digitsOnly.slice(1) : digitsOnly;

  return `+${cleanDial}${nationalNumber}`;
}

/**
 * Normalise un numéro extrait du carnet d'adresses (pour le moteur de matching Firestore)
 */
export function normalizeContactPhoneNumber(contactTel: string, userDialCode = '+226'): string {
  if (!contactTel) return '';

  // Supprimer tout caractère non numérique sauf le '+' initial
  let cleaned = contactTel.trim().replace(/[\s\-_().\u00A0\u202F]/g, '');

  if (cleaned.startsWith('+')) {
    return '+' + cleaned.slice(1).replace(/\D/g, '');
  }
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.slice(2).replace(/\D/g, '');
  }

  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 6) return '';

  // Vérifier si un des indicatifs d'Afrique de l'Ouest matche le début
  for (const c of WEST_AFRICAN_COUNTRIES) {
    const rawDial = c.dialCode.replace('+', '');
    if (digits.startsWith(rawDial) && digits.length >= rawDial.length + 6) {
      return '+' + digits;
    }
  }

  // Sinon, utiliser l'indicatif par défaut de l'utilisateur
  const national = digits.startsWith('0') ? digits.slice(1) : digits;
  const dial = userDialCode.replace(/\D/g, '');
  return `+${dial}${national}`;
}

/**
 * Affichage aéré et convivial pour l'UI
 */
export function formatDisplayPhone(e164: string): string {
  if (!e164) return '';
  if (!e164.startsWith('+')) return e164;

  // Formatage par blocs de 2 ou 3 chiffres
  const plus = e164.slice(0, 1);
  const rest = e164.slice(1);

  if (rest.length <= 4) return `${plus}${rest}`;
  if (rest.length <= 7) return `${plus}${rest.slice(0, 3)} ${rest.slice(3)}`;
  return `${plus}${rest.slice(0, 3)} ${rest.slice(3, 5)} ${rest.slice(5, 7)} ${rest.slice(7, 9)} ${rest.slice(9)}`.trim();
}
