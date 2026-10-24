/**
 * ==============================================================================
 * Moteur IA d'Auto-Checkout Wameet & Détection d'Intention Commerciale
 * ==============================================================================
 * Analyse silencieuse des messages du chat via Google Gemini pour détecter
 * automatiquement les intentions d'achat et générer un panier prêt à payer.
 */

// Inventaire de secours (mock temporaire conforme au cahier des charges)
const DEFAULT_MOCK_INVENTORY = [
  {
    id: 'prod_chemise_bleue_01',
    name: 'Chemise Bleue Coton Pima',
    unitPrice: 15000,
    currency: 'XOF',
    keywords: ['chemise', 'chemises', 'bleu', 'bleue', 'coton']
  },
  {
    id: 'prod_karite_royal_02',
    name: 'Coffret Beauté Karité Royal Or',
    unitPrice: 18500,
    currency: 'XOF',
    keywords: ['karite', 'karité', 'or', 'coffret', 'beauté']
  },
  {
    id: 'prod_mocassins_cuir_03',
    name: 'Mocassins Cuir Artisanal Sahel',
    unitPrice: 25000,
    currency: 'XOF',
    keywords: ['chaussure', 'chaussures', 'mocassin', 'mocassins', 'cuir']
  }
];

/**
 * Nettoie et extrait un objet JSON valide même si le modèle a inclus du markdown
 */
function parseJsonSafely(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  try {
    // Tentative 1 : Parse direct
    return JSON.parse(rawText.trim());
  } catch {
    try {
      // Tentative 2 : Nettoyage des balises markdown ```json ... ```
      const cleaned = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*$/g, '')
        .trim();
      return JSON.parse(cleaned);
    } catch {
      try {
        // Tentative 3 : Extraction par Regex du premier bloc {...}
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[0]);
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Normalise l'historique du chat en une chaîne de texte lisible
 */
function normalizeChatHistory(chatHistory) {
  if (!chatHistory) return '';
  if (typeof chatHistory === 'string') return chatHistory.trim();

  if (Array.isArray(chatHistory)) {
    return chatHistory
      .map(msg => {
        if (typeof msg === 'string') return msg;
        const sender = msg.sender === 'me' ? 'Client' : msg.senderName || msg.sender || 'Interlocuteur';
        const text = msg.text || msg.content || '';
        return `${sender}: ${text}`;
      })
      .filter(Boolean)
      .join('\n');
  }

  return String(chatHistory);
}

/**
 * Fonction Principale : Analyse d'Intention de Commande par Gemini
 * 
 * @param {Array|string} chatHistory - Historique récent des messages ou dernier message
 * @param {Array} currentInventory - Catalogue des articles disponibles (optionnel)
 * @returns {Promise<{ isOrderIntent: boolean, detectedItems: Array<{ id: string, name: string, quantity: number, unitPrice: number }>, totalAmount: number } | null>}
 */
async function analyzeChatIntent(chatHistory, currentInventory = null) {
  try {
    // 1. Clé d'API Gemini Google AI Studio
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      '';

    if (!apiKey) {
      console.warn('[AI AUTO-CHECKOUT NOTICE] Clé GEMINI_API_KEY non configurée.');
      return null;
    }

    // 2. Inventaire effectif
    const inventory =
      Array.isArray(currentInventory) && currentInventory.length > 0
        ? currentInventory
        : DEFAULT_MOCK_INVENTORY;

    const formattedConversation = normalizeChatHistory(chatHistory);
    if (!formattedConversation) {
      return null;
    }

    // 3. Prompt Système Strict
    const systemPrompt = `Tu es l'Agent Commercial Invisible et Moteur d'Auto-Checkout de Wameet.
Ta mission : Analyser la discussion client ci-dessous pour détecter une intention d'achat ou de commande explicite ou implicite.

Catalogue d'inventaire disponible :
${JSON.stringify(inventory, null, 2)}

Règles d'analyse :
1. Détermine si le client souhaite commander ou acheter un ou plusieurs articles (ex: "je veux 2 chemises bleues", "je prends le coffret", "je réserve les mocassins", etc.).
2. Fais correspondre la demande aux articles du catalogue d'inventaire.
3. Extrais la quantité demandée (par défaut 1 si non précisée).
4. Associe l'identifiant exact de l'article ('id'), son libellé exact ('name'), sa quantité ('quantity') et son prix unitaire ('unitPrice').
5. Calcule le montant total ('totalAmount') = somme de (quantity * unitPrice).
6. Si le client ne manifeste AUCUNE intention d'achat ou si aucun article du catalogue ne correspond, renvoie isOrderIntent = false, detectedItems = [], totalAmount = 0.
7. RÈGLE STRICTE : Réponds UNIQUEMENT sous forme d'objet JSON valide, sans texte d'introduction ni de conclusion, sans bloc de code markdown.

Structure JSON attendue :
{
  "isOrderIntent": true,
  "detectedItems": [
    {
      "id": "identifiant_article",
      "name": "Nom de l'article",
      "quantity": 2,
      "unitPrice": 15000
    }
  ],
  "totalAmount": 30000
}`;

    const userContent = `Discussion du client à analyser :\n${formattedConversation}`;

    // 4. Appel avec SDK @google/genai ou repli direct HTTP REST Google AI Studio
    let rawJsonResponse = null;

    // Tentative A : SDK Google GenAI si disponible
    try {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      rawJsonResponse = response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (sdkErr) {
      // Tentative B : Appel HTTP direct natif (garantit 0 plantage même sans le SDK)
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const payload = {
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\n${userContent}` }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      };

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000) // Timeout court de 6s pour ne pas ralentir le chat
      });

      if (!resp.ok) {
        throw new Error(`Google Gemini HTTP ${resp.status}`);
      }

      const data = await resp.json();
      rawJsonResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    // 5. Décodage et validation du JSON
    const parsed = parseJsonSafely(rawJsonResponse);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    // Normalisation de sécurité de la structure
    const isOrderIntent = Boolean(parsed.isOrderIntent);
    const rawItems = Array.isArray(parsed.detectedItems) ? parsed.detectedItems : [];

    const detectedItems = rawItems.map(item => ({
      id: String(item.id || ''),
      name: String(item.name || ''),
      quantity: Math.max(1, Number(item.quantity) || 1),
      unitPrice: Number(item.unitPrice) || 0
    })).filter(item => item.id && item.unitPrice > 0);

    const calculatedTotal = detectedItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    return {
      isOrderIntent: isOrderIntent && detectedItems.length > 0,
      detectedItems,
      totalAmount: calculatedTotal || Number(parsed.totalAmount) || 0
    };
  } catch (err) {
    // RÈGLE STRICTE : Si le modèle est surchargé ou échoue, retourner silencieusement null
    // sans jamais faire crasher le chat ni bloquer l'interface.
    console.warn('[AI AUTO-CHECKOUT SILENT BYPASS]', err.message);
    return null;
  }
}

module.exports = {
  analyzeChatIntent,
  DEFAULT_MOCK_INVENTORY
};
