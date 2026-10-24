import { InventoryProduct, VoiceParseResult, VoiceItemMatch } from '../types';

const WORD_TO_NUMBER: Record<string, number> = {
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  quinze: 15,
  vingt: 20,
  trente: 30,
};

/**
 * Parses a spoken or typed text phrase (e.g. "3 lais 1500", "2 pains et 1 lait 800")
 * and extracts:
 * 1. Recognized items from inventory
 * 2. Quantity for each item
 * 3. Spoken total price (if pronounced)
 */
export function parseVoicePhrase(
  rawText: string,
  inventory: InventoryProduct[]
): VoiceParseResult {
  const cleanText = rawText.trim();
  if (!cleanText) {
    return {
      rawPhrase: '',
      recognizedItems: [],
      spokenPrice: null,
      calculatedTotal: 0,
      priceMatch: true,
      confidence: 'FAIBLE',
      extractedDetails: {
        itemsCount: 0,
        discrepancyNote: 'Veuillez saisir ou prononcer une phrase.',
      },
    };
  }

  // Normalize lower-case, remove accents for fuzzy matching
  const normalized = cleanText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Extract trailing or total price expressions (e.g., "1500", "1500f", "1500 f cfa", "total 1500", "a 1500")
  let spokenPrice: number | null = null;
  const priceMatches = [
    ...normalized.matchAll(/(?:total\s*(?:de)?|a|pour|\=)?\s*(\d{2,6})\s*(?:f|cfa|francs?)?(?:\s|$)/g),
  ];

  // Tokenize words and numbers
  // Split segments around commas, "et", "+", "&"
  const segments = normalized.split(/\s*(?:,|\bet\b|\+|\&)\s*/);

  const recognizedItems: VoiceItemMatch[] = [];
  const matchedProductIds = new Set<string>();

  // Process each segment or whole phrase
  for (const segment of segments) {
    const trimmedSeg = segment.trim();
    if (!trimmedSeg) continue;

    // Look for numbers in segment
    const words = trimmedSeg.split(/\s+/);

    for (const product of inventory) {
      if (matchedProductIds.has(product.id)) continue;

      // Check keywords
      let matchedKeyword = '';
      for (const kw of product.keywords) {
        const normKw = kw
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        // Match whole word or regex
        const kwRegex = new RegExp(`\\b${normKw}\\b`, 'i');
        if (kwRegex.test(trimmedSeg)) {
          matchedKeyword = kw;
          break;
        }
      }

      if (matchedKeyword) {
        // Find quantity preceding or surrounding the keyword
        let quantity = 1;

        // Try to locate quantity before the keyword (with support for containers: paquets, boîtes, sachets, sacs, etc.)
        const regexBefore = new RegExp(
          `(?:^|\\s)(\\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|quinze|vingt|trente)\\s+(?:paquets?\\s+(?:de)?|boites?\\s+(?:de)?|sachets?\\s+(?:d['’]?)?|sacs?\\s+(?:de)?|bouteilles?\\s+(?:d['’]?)?|plaquettes?\\s+(?:de)?|morceaux?\\s+(?:de)?|cartons?\\s+(?:de)?|pots?\\s+(?:de)?)?${matchedKeyword}`,
          'i'
        );
        const matchBefore = trimmedSeg.match(regexBefore);

        if (matchBefore && matchBefore[1]) {
          const val = matchBefore[1].toLowerCase();
          quantity = WORD_TO_NUMBER[val] || parseInt(val, 10) || 1;
        } else {
          // Check any leading number in the segment
          const leadingNum = trimmedSeg.match(/^(\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|quinze|vingt|trente)\b/i);
          if (leadingNum) {
            const val = leadingNum[1].toLowerCase();
            quantity = WORD_TO_NUMBER[val] || parseInt(val, 10) || 1;
          }
        }

        // Check if a specific price was dictated for this item (e.g. "à 500 francs", "pour 500 f")
        let itemCustomPrice = product.sellingPrice;
        const segmentCustomPriceMatch = trimmedSeg.match(/(?:(?:a|pour|\=)\s*)(\d{2,6})\s*(?:f|cfa|francs?)?/i);
        if (segmentCustomPriceMatch && segmentCustomPriceMatch[1]) {
          const parsedCustom = parseInt(segmentCustomPriceMatch[1], 10);
          if (parsedCustom > 0 && parsedCustom < 1000000) {
            // If parsed custom price is given for the line or per unit:
            itemCustomPrice = quantity > 1 && parsedCustom >= product.sellingPrice * 1.5
              ? Math.round(parsedCustom / quantity)
              : parsedCustom;
          }
        }

        recognizedItems.push({
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: itemCustomPrice,
          costPrice: product.costPrice,
          lineTotal: quantity * itemCustomPrice,
          matchedKeyword,
        });

        matchedProductIds.add(product.id);
      }
    }
  }

  // Fallback: If no items found from segments, scan full text for all keywords
  if (recognizedItems.length === 0) {
    for (const product of inventory) {
      for (const kw of product.keywords) {
        const normKw = kw
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        if (new RegExp(`\\b${normKw}\\b`, 'i').test(normalized)) {
          // Look for any number right before
          const beforeMatch = normalized.match(new RegExp(`(\\d+)\\s+.*${normKw}`, 'i'));
          const quantity = beforeMatch ? parseInt(beforeMatch[1], 10) || 1 : 1;

          recognizedItems.push({
            productId: product.id,
            productName: product.name,
            quantity,
            unitPrice: product.sellingPrice,
            costPrice: product.costPrice,
            lineTotal: quantity * product.sellingPrice,
            matchedKeyword: kw,
          });
          matchedProductIds.add(product.id);
          break;
        }
      }
    }
  }

  // Calculate total from recognized items
  const calculatedTotal = recognizedItems.reduce((sum, item) => sum + item.lineTotal, 0);

  // Extract spoken price
  // Find numbers in phrase that are likely the spoken total
  const numbersInText = [...normalized.matchAll(/\b(\d{2,7})\b/g)].map((m) => parseInt(m[1], 10));

  // If a number in the phrase matches the calculated total or is greater than item quantities
  if (numbersInText.length > 0) {
    // Check if the last number or one of the numbers is >= 50 (typical CFA min amount)
    const potentialPrices = numbersInText.filter((n) => n >= 50);
    if (potentialPrices.length > 0) {
      // Pick the number that matches calculatedTotal, or the last high number
      const matchingNumber = potentialPrices.find((n) => n === calculatedTotal);
      spokenPrice = matchingNumber !== undefined ? matchingNumber : potentialPrices[potentialPrices.length - 1];
    }
  }

  const priceMatch = spokenPrice !== null ? spokenPrice === calculatedTotal : true;

  let confidence: 'HAUTE' | 'MOYENNE' | 'FAIBLE' = 'FAIBLE';
  if (recognizedItems.length > 0) {
    if (spokenPrice !== null && priceMatch) {
      confidence = 'HAUTE';
    } else if (spokenPrice !== null && !priceMatch) {
      confidence = 'MOYENNE';
    } else {
      confidence = 'HAUTE';
    }
  }

  let discrepancyNote: string | undefined;
  if (spokenPrice !== null && spokenPrice !== calculatedTotal) {
    discrepancyNote = `Attention : Prix prononcé (${spokenPrice} F CFA) différent du calcul catalogue (${calculatedTotal} F CFA).`;
  }

  return {
    rawPhrase: cleanText,
    recognizedItems,
    spokenPrice,
    calculatedTotal,
    priceMatch,
    confidence,
    extractedDetails: {
      itemsCount: recognizedItems.reduce((acc, i) => acc + i.quantity, 0),
      discrepancyNote,
    },
  };
}
