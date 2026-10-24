/**
 * ==============================================================================
 * ROUTEUR DE PAIEMENT SEBPAY & CONFIGURATION 20 PAYS AFRICAINS + INTERNATIONAL
 * ==============================================================================
 * 
 * Supporte nativement et en production réelle :
 * - Zone UEMOA (XOF) : Burkina Faso (+226), Côte d'Ivoire (+225), Mali (+223),
 *   Sénégal (+221), Togo (+228), Bénin (+229), Niger (+227), Guinée (+224).
 * - Zone CEMAC (XAF) : Cameroun (+237), Gabon (+241), Congo-Brazzaville (+242), Tchad (+235).
 * - Autres Afrique : RDC (+243), Ghana (+233), Nigeria (+234), Kenya (+254),
 *   Mauritanie (+222), Rwanda (+250), Ouganda (+256).
 * - Option Carte Internationale / Diaspora : Visa, Mastercard, Apple Pay, Taptap Send.
 */

import sebpayConfigJson from '../config/sebpay_providers.json';

export interface PaymentOperatorConfig {
  id: string;
  name: string;
  code: string;
  needsOtp?: boolean;
  brandColor?: string;
  ussdTemplate?: string;
}

export interface CountryPaymentConfigItem {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  currency: string;
  currencySymbol: string;
  zone: 'UEMOA' | 'CEMAC' | 'AUTRES_AFRIQUE' | 'INTERNATIONAL' | string;
  defaultCity: string;
  operators: PaymentOperatorConfig[];
}

export const SEBPAY_ROUTER_CONFIG = sebpayConfigJson;

export const ALL_20_COUNTRIES_CONFIG: CountryPaymentConfigItem[] = sebpayConfigJson.countries as CountryPaymentConfigItem[];

/**
 * Table de correspondance indicatif téléphonique -> code pays
 * Triée du préfixe le plus long au plus court pour éviter les collisions (ex: +242 avant +24)
 */
const DIAL_CODE_TO_COUNTRY_MAP: Array<{ prefix: string; code: string }> = ALL_20_COUNTRIES_CONFIG
  .map(c => ({
    prefix: c.dialCode.replace(/[^0-9]/g, ''),
    code: c.code
  }))
  .sort((a, b) => b.prefix.length - a.prefix.length);

/**
 * Détecte automatiquement le pays à partir d'un numéro de téléphone saisi par le client
 * Reconnaît les formats :
 * - "+225 07 12 34 56" -> CI
 * - "00226 70 12 34 56" -> BF
 * - "221770000000" -> SN
 * - "237690000000" -> CM
 * - "+250780000000" -> RW
 * - "+22245000000" -> MR
 */
export function detectCountryFromPhone(phoneRaw: string): CountryPaymentConfigItem | null {
  if (!phoneRaw) return null;

  // Nettoyage complet : conserver uniquement les chiffres
  let digits = phoneRaw.replace(/[^0-9]/g, '');

  // Supprimer l'éventuel préfixe d'accès international '00'
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // Trouver l'indicatif correspondant
  for (const item of DIAL_CODE_TO_COUNTRY_MAP) {
    if (digits.startsWith(item.prefix)) {
      const found = ALL_20_COUNTRIES_CONFIG.find(c => c.code === item.code);
      if (found) return found;
    }
  }

  // Cas spécial indicatif France / Europe / Diaspora
  if (digits.startsWith('33') || digits.startsWith('44') || digits.startsWith('49') || digits.startsWith('32')) {
    const diaspora = ALL_20_COUNTRIES_CONFIG.find(c => c.code === 'DIASPORA');
    if (diaspora) return diaspora;
  }

  return null;
}

/**
 * Récupère la configuration d'un pays par son code ISO (ex: 'BF', 'CI', 'CM')
 */
export function getCountryPaymentConfig(countryCode: string): CountryPaymentConfigItem {
  const normalized = (countryCode || 'BF').toUpperCase().trim();
  const match = ALL_20_COUNTRIES_CONFIG.find(c => c.code === normalized);
  return match || ALL_20_COUNTRIES_CONFIG[0]; // Burkina Faso par défaut
}

/**
 * Récupère la liste des opérateurs autorisés pour un pays donné
 */
export function getOperatorsForCountry(countryCodeOrPhone: string): PaymentOperatorConfig[] {
  let country: CountryPaymentConfigItem | null = null;
  if (countryCodeOrPhone.includes('+') || countryCodeOrPhone.length > 5) {
    country = detectCountryFromPhone(countryCodeOrPhone);
  }
  if (!country) {
    country = getCountryPaymentConfig(countryCodeOrPhone);
  }
  return country.operators || [];
}

/**
 * Nettoie et formate un numéro de téléphone avec son indicatif international certifié
 */
export function formatPhoneWithCountry(phone: string, countryCode: string): string {
  const country = getCountryPaymentConfig(countryCode);
  const cleanDial = country.dialCode; // Ex: "+226"
  const dialDigits = cleanDial.replace(/[^0-9]/g, '');

  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);

  if (digits.startsWith(dialDigits)) {
    return `+${digits}`;
  }

  return `${cleanDial}${digits}`;
}
