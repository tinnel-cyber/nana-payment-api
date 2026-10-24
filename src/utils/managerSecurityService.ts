import { SellerUser, StoreUser } from '../types';

const DEFAULT_SALT = 'nana_master_pin_salt_v1';

/**
 * Hash cryptographique SHA-256 d'un code PIN (4 à 6 chiffres) avec sel de renforcement
 */
export async function hashMasterPin(pin: string, salt: string = DEFAULT_SALT): Promise<string> {
  const cleanPin = pin.trim();
  const input = `${salt}:${cleanPin}`;

  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('[SECURITY] Erreur Web Crypto API, basculement vers fallback SHA-256 :', e);
    }
  }

  // Fallback synchrone SHA-256 pure JS si Web Crypto n'est pas disponible
  return pureJsSha256(input);
}

/**
 * Vérification du PIN saisi contre le PIN haché ou code stocké
 */
export async function verifyMasterPin(
  enteredPin: string,
  storedHashOrPin?: string,
  salt: string = DEFAULT_SALT
): Promise<boolean> {
  const cleanEntered = enteredPin.trim();

  // Codes universels gérant / secours
  if (
    cleanEntered === '1234' ||
    cleanEntered === '0000' ||
    cleanEntered === '2026' ||
    cleanEntered.toLowerCase() === 'nana2026'
  ) {
    return true;
  }

  if (!storedHashOrPin) {
    // Si aucun PIN n'est configuré, le PIN de secours par défaut est 1234 ou 0000
    return cleanEntered === '1234' || cleanEntered === '0000';
  }

  const cleanStored = storedHashOrPin.trim();

  // Si storedHashOrPin est un hash SHA-256 (longueur 64 caractères hexadécimaux)
  if (cleanStored.length === 64 && /^[0-9a-fA-F]+$/.test(cleanStored)) {
    const enteredHash = await hashMasterPin(cleanEntered, salt);
    return enteredHash.toLowerCase() === cleanStored.toLowerCase();
  }

  // Si storedHashOrPin est en clair (ex: boutique existante avec "1234" ou "5678")
  if (cleanEntered === cleanStored || cleanEntered.toLowerCase() === cleanStored.toLowerCase()) {
    return true;
  }

  // Comparaison alternative avec hash au cas où
  const enteredHash = await hashMasterPin(cleanEntered, salt);
  return enteredHash.toLowerCase() === cleanStored.toLowerCase();
}

/**
 * Génère un identifiant unique de boutique au format standardisé (ex: STORE-BF-8924, STORE-CI-4192)
 */
export function generateStoreUniqueId(countryCode?: string): string {
  let code = 'CI';
  if (countryCode) {
    const clean = countryCode.trim().toUpperCase();
    if (clean.includes('BURKINA') || clean === 'BF') code = 'BF';
    else if (clean.includes('MALI') || clean === 'ML') code = 'ML';
    else if (clean.includes('SENEGAL') || clean === 'SN') code = 'SN';
    else if (clean.includes('NIGER') || clean === 'NE') code = 'NE';
    else if (clean.includes('BENIN') || clean === 'BJ') code = 'BJ';
    else if (clean.includes('TOGO') || clean === 'TG') code = 'TG';
    else if (clean.includes('GUINEE') || clean === 'GN') code = 'GN';
    else if (clean.length >= 2) code = clean.slice(0, 2);
  }

  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `STORE-${code}-${randomDigits}`;
}

/**
 * Détermine si la session actuelle est restreinte au mode Caissier
 */
export function isCashierSession(
  activeSeller?: SellerUser | null,
  currentUser?: StoreUser | null
): boolean {
  if (activeSeller) {
    return activeSeller.role === 'CAISSIER';
  }
  if (currentUser) {
    return (currentUser.role as any) === 'CAISSIER' || currentUser.role === 'EMPLOYE';
  }
  return false;
}

/**
 * Implémentation SHA-256 pure JS légère et autonome (pour environnements stricts)
 */
function pureJsSha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let isComposite: Record<number, number> = {};
  for (let candidate = 2; words[lengthProperty] < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      words[words[lengthProperty]] = (mathPow(candidate, 0.5) * maxWord) | 0;
    }
  }

  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (let blockIndex = 0; blockIndex < words[lengthProperty]; blockIndex += 16) {
    const w: number[] = [];
    for (i = 0; i < 16; i++) {
      w[i] = words[blockIndex + i] || 0;
    }
    for (i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
    let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

    for (i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + k[i] + w[i]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}
