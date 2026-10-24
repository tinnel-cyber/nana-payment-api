var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_crypto11 = __toESM(require("crypto"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai2 = require("@google/genai");
var import_ws = require("ws");

// src/server/smartHaggleController.ts
var import_crypto = __toESM(require("crypto"), 1);
var import_genai = require("@google/genai");
function sanitizeProductForFrontend(product) {
  const { floorPrice, ...safeProduct } = product;
  return safeProduct;
}
var NANA_PRODUCT_CATALOG = /* @__PURE__ */ new Map([
  [
    "prod_flash_live_1",
    {
      id: "prod_flash_live_1",
      name: "Coffret Karit\xE9 Royal Or Prestige (\xC9dition Limit\xE9e)",
      publicPrice: 2e4,
      floorPrice: 16e3,
      // Seuil de rentabilité absolu secret
      stock: 5,
      currency: "FCFA",
      imageUrl: "https://images.unsplash.com/photo-1608248597359-0e6d526a6c58?w=400&auto=format&fit=crop&q=80",
      category: "Cosm\xE9tique Bio"
    }
  ],
  [
    "prod_flash_live_2",
    {
      id: "prod_flash_live_2",
      name: "Robe Wax Royale Soie d\u2019Abidjan",
      publicPrice: 35e3,
      floorPrice: 28e3,
      // Seuil de rentabilité absolu secret
      stock: 3,
      currency: "FCFA",
      imageUrl: "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=400&auto=format&fit=crop&q=80",
      category: "Mode & Textile"
    }
  ],
  [
    "prod_flash_live_3",
    {
      id: "prod_flash_live_3",
      name: "Pack \xC9couteurs Sans Fil Pro Bass ANC",
      publicPrice: 15e3,
      floorPrice: 11500,
      // Seuil de rentabilité absolu secret
      stock: 12,
      currency: "FCFA",
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80",
      category: "High-Tech"
    }
  ]
]);
var HAGGLE_CACHE = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 18e4;
var USER_RATE_LIMIT = /* @__PURE__ */ new Map();
var RATE_LIMIT_COOLDOWN_MS = 1500;
var SMART_ESCROWS = /* @__PURE__ */ new Map();
var activeGeminiCalls = 0;
var MAX_CONCURRENT_GEMINI_CALLS = 12;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of HAGGLE_CACHE.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      HAGGLE_CACHE.delete(key);
    }
  }
  for (const [id, escrow] of SMART_ESCROWS.entries()) {
    if (escrow.status === "locked_temporary" && now > escrow.expiresAt) {
      escrow.status = "expired";
    }
  }
  for (const [id, lastTime] of USER_RATE_LIMIT.entries()) {
    if (now - lastTime > 1e4) {
      USER_RATE_LIMIT.delete(id);
    }
  }
}, 3e4);
var aiClient = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiClient) {
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "wameet-smart-haggle-engine"
        }
      }
    });
  }
  return aiClient;
}
function computeAlgorithmicFallback(product, userOffer) {
  if (userOffer >= product.publicPrice) {
    return {
      status: "accept",
      aiPrice: userOffer,
      message: "March\xE9 conclu mon ami ! C\u2019est un grand honneur de faire affaire avec toi !"
    };
  }
  if (userOffer >= product.floorPrice) {
    return {
      status: "accept",
      aiPrice: userOffer,
      message: "Tu as la b\xE9n\xE9diction du commerce ! Offre accept\xE9e avec grand enthousiasme !"
    };
  }
  const delta = product.publicPrice - product.floorPrice;
  const counterPrice = Math.max(
    product.floorPrice,
    Math.round((product.floorPrice + delta * 0.25) / 500) * 500
  );
  return {
    status: "counter",
    aiPrice: counterPrice,
    message: `\xC0 ${userOffer.toLocaleString("fr-FR")}F c'est compliqu\xE9, mais je te le laisse \xE0 ${counterPrice.toLocaleString("fr-FR")}F !`
  };
}
async function handleHaggleOffer(productId, userOffer, options = {}) {
  const startTime = Date.now();
  const { clientId = "anonymous", timeoutMs = 1800 } = options;
  const product = NANA_PRODUCT_CATALOG.get(productId);
  if (!product) {
    throw new Error(`Produit introuvable (ID: ${productId})`);
  }
  const negotiationId = `haggle_${Date.now()}_${import_crypto.default.randomBytes(3).toString("hex")}`;
  const now = Date.now();
  const lastRequest = USER_RATE_LIMIT.get(clientId);
  if (lastRequest && now - lastRequest < RATE_LIMIT_COOLDOWN_MS) {
    const safeCounter = Math.max(product.floorPrice, Math.round((userOffer + product.publicPrice) / 2 / 500) * 500);
    return {
      status: "counter",
      aiPrice: safeCounter,
      message: "Doucement mon ami, laisse le vendeur r\xE9fl\xE9chir ! Regarde plut\xF4t ma contre-offre.",
      productId: product.id,
      productName: product.name,
      publicPrice: product.publicPrice,
      userOffer,
      currency: product.currency || "FCFA",
      negotiationId,
      offerExpiresAt: Date.now() + 12e4,
      source: "edge_guard",
      latencyMs: Date.now() - startTime
    };
  }
  USER_RATE_LIMIT.set(clientId, now);
  if (userOffer >= product.publicPrice) {
    return {
      status: "accept",
      aiPrice: userOffer,
      message: "March\xE9 conclu tout de suite ! C\u2019est un honneur de traiter avec toi !",
      productId: product.id,
      productName: product.name,
      publicPrice: product.publicPrice,
      userOffer,
      currency: product.currency || "FCFA",
      negotiationId,
      offerExpiresAt: Date.now() + 12e4,
      source: "edge_guard",
      latencyMs: Date.now() - startTime
    };
  }
  if (userOffer < product.floorPrice * 0.35) {
    const floorPropose = Math.max(product.floorPrice, Math.round(product.floorPrice * 1.05 / 500) * 500);
    return {
      status: "counter",
      aiPrice: floorPropose,
      message: `Ah mon cher, \xE0 ${userOffer.toLocaleString("fr-FR")}F tu veux m'envoyer au village ! Le dernier geste c'est ${floorPropose.toLocaleString("fr-FR")}F.`,
      productId: product.id,
      productName: product.name,
      publicPrice: product.publicPrice,
      userOffer,
      currency: product.currency || "FCFA",
      negotiationId,
      offerExpiresAt: Date.now() + 12e4,
      source: "edge_guard",
      latencyMs: Date.now() - startTime
    };
  }
  const cacheKey = `${productId}:${userOffer}`;
  const cached = HAGGLE_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    const safeAiPrice = Math.max(product.floorPrice, cached.data.aiPrice);
    const safeStatus = safeAiPrice < product.floorPrice ? "counter" : cached.data.status;
    return {
      status: safeStatus,
      aiPrice: safeAiPrice,
      message: cached.data.message,
      productId: product.id,
      productName: product.name,
      publicPrice: product.publicPrice,
      userOffer,
      currency: product.currency || "FCFA",
      negotiationId,
      offerExpiresAt: Date.now() + 12e4,
      source: "cache",
      latencyMs: Date.now() - startTime
    };
  }
  const ai = getGeminiClient();
  if (!ai || activeGeminiCalls >= MAX_CONCURRENT_GEMINI_CALLS) {
    const fallback = computeAlgorithmicFallback(product, userOffer);
    return {
      status: fallback.status,
      aiPrice: Math.max(product.floorPrice, fallback.aiPrice),
      message: fallback.message,
      productId: product.id,
      productName: product.name,
      publicPrice: product.publicPrice,
      userOffer,
      currency: product.currency || "FCFA",
      negotiationId,
      offerExpiresAt: Date.now() + 12e4,
      source: "heuristic_fallback",
      latencyMs: Date.now() - startTime
    };
  }
  const systemPrompt = `Tu es un vendeur commer\xE7ant africain chaleureux mais redoutable en affaires. Le prix public est ${product.publicPrice}. Le client propose ${userOffer}. Ton seuil de rentabilit\xE9 absolu est ${product.floorPrice}. R\xE8gle 1 : Si l'offre est < ${product.floorPrice}, refuse poliment ou propose un prix juste au-dessus du floor. R\xE8gle 2 : Si l'offre est >= ${product.floorPrice}, accepte avec enthousiasme. R\xE8gle 3 : R\xE9ponds uniquement au format JSON : { "status": "accept" | "counter" | "reject", "aiPrice": number, "message": "texte court et vendeur" }.`;
  activeGeminiCalls++;
  try {
    const geminiPromise = ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("TIMEOUT_GEMINI_EXCEEDED")), timeoutMs)
    );
    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const rawText = response.text || "";
    const parsed = JSON.parse(rawText);
    if (parsed.status === "accept" && userOffer < product.floorPrice) {
      parsed.status = "counter";
      parsed.aiPrice = Math.max(
        product.floorPrice,
        Math.round((userOffer + product.publicPrice) / 2 / 500) * 500
      );
      parsed.message = `\xC0 ${userOffer.toLocaleString("fr-FR")}F c'est compliqu\xE9, mais je te le laisse \xE0 ${parsed.aiPrice.toLocaleString("fr-FR")}F !`;
    }
    if (parsed.aiPrice < product.floorPrice) {
      parsed.aiPrice = product.floorPrice;
      if (parsed.status === "accept" && userOffer < product.floorPrice) {
        parsed.status = "counter";
      }
    }
    HAGGLE_CACHE.set(cacheKey, {
      data: parsed,
      timestamp: Date.now()
    });
    return {
      status: parsed.status,
      aiPrice: parsed.aiPrice,
      message: parsed.message,
      productId: product.id,
      productName: product.name,
      publicPrice: product.publicPrice,
      userOffer,
      currency: product.currency || "FCFA",
      negotiationId,
      offerExpiresAt: Date.now() + 12e4,
      source: "gemini",
      latencyMs: Date.now() - startTime
    };
  } catch (err) {
    console.warn(`[SMART HAGGLE] Fallback heuristique activ\xE9 (${err.message}) en ${Date.now() - startTime}ms`);
    const fallback = computeAlgorithmicFallback(product, userOffer);
    return {
      status: fallback.status,
      aiPrice: Math.max(product.floorPrice, fallback.aiPrice),
      message: fallback.message,
      productId: product.id,
      productName: product.name,
      publicPrice: product.publicPrice,
      userOffer,
      currency: product.currency || "FCFA",
      negotiationId,
      offerExpiresAt: Date.now() + 12e4,
      source: "heuristic_fallback",
      latencyMs: Date.now() - startTime
    };
  } finally {
    activeGeminiCalls = Math.max(0, activeGeminiCalls - 1);
  }
}
async function generateCinetPayPaymentUrl(escrowId, amount, productName, buyerPhone, buyerName) {
  const cinetPayApiKey = process.env.CINETPAY_API_KEY;
  const cinetPaySiteId = process.env.CINETPAY_SITE_ID;
  if (cinetPayApiKey && cinetPaySiteId) {
    try {
      const payload = {
        apikey: cinetPayApiKey,
        site_id: cinetPaySiteId,
        transaction_id: escrowId,
        amount,
        currency: "XOF",
        description: `Wameet Smart Haggle : ${productName}`,
        return_url: `https://wameet.africa/live/payment-success?escrowId=${escrowId}`,
        notify_url: `https://nana-payment-api.onrender.com/api/webhooks/cinetpay`,
        customer_name: buyerName || "Acheteur Wameet",
        customer_surname: "Client",
        customer_phone_number: buyerPhone || "+2250700000000",
        customer_email: "paiement@wameet.africa",
        customer_address: "Plateau",
        customer_city: "Abidjan",
        customer_country: "CI",
        customer_state: "CI",
        customer_zip_code: "00225"
      };
      const response = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data && data.code === "201" && data.data?.payment_url) {
        return data.data.payment_url;
      }
    } catch (cinetErr) {
      console.error("[CINETPAY API ERROR]", cinetErr);
    }
  }
  return `https://checkout.cinetpay.com/payment/${escrowId}?amount=${amount}&currency=XOF&title=${encodeURIComponent(
    productName
  )}&desc=WameetSmartHaggle&site_id=${cinetPaySiteId || "sandbox_wameet"}`;
}
async function lockHaggleEscrow(params) {
  const {
    productId,
    agreedPrice,
    negotiationId = `neg_${Date.now()}`,
    buyerId = "client_wameet_buyer",
    buyerPhone = "+2250700000000",
    buyerName = "Acheteur Direct"
  } = params;
  const product = NANA_PRODUCT_CATALOG.get(productId);
  if (!product) {
    throw new Error(`Produit introuvable (${productId})`);
  }
  if (agreedPrice < product.floorPrice) {
    throw new Error(
      `Violation de rentabilit\xE9 : Le prix propos\xE9 (${agreedPrice} FCFA) est inf\xE9rieur au prix plancher de rentabilit\xE9.`
    );
  }
  const escrowId = `escrow_haggle_${Date.now()}_${import_crypto.default.randomBytes(4).toString("hex")}`;
  const now = Date.now();
  const expiresAt = now + 12e4;
  const paymentUrl = await generateCinetPayPaymentUrl(
    escrowId,
    agreedPrice,
    product.name,
    buyerPhone,
    buyerName
  );
  const escrowRecord = {
    escrowId,
    negotiationId,
    productId,
    productName: product.name,
    agreedPrice,
    currency: product.currency || "FCFA",
    buyerId,
    buyerPhone,
    buyerName,
    status: "locked_temporary",
    paymentUrl,
    paymentProvider: "cinetpay",
    createdAt: now,
    expiresAt
  };
  SMART_ESCROWS.set(escrowId, escrowRecord);
  console.log(
    `[SMART ESCROW VERROUILL\xC9] Tx: ${escrowId} | Produit: ${product.name} | Prix: ${agreedPrice} FCFA | Expire dans 120s`
  );
  return {
    success: true,
    escrowId,
    agreedPrice,
    currency: product.currency || "FCFA",
    expiresAt,
    remainingSeconds: 120,
    paymentUrl
  };
}
function attachSmartHaggleRoutes(app2) {
  app2.get("/api/haggle/products", (_req, res) => {
    const safeProducts = Array.from(NANA_PRODUCT_CATALOG.values()).map(sanitizeProductForFrontend);
    res.json({ success: true, products: safeProducts });
  });
  app2.get("/api/haggle/product/:id", (req, res) => {
    const product = NANA_PRODUCT_CATALOG.get(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: "Produit introuvable." });
    }
    res.json({ success: true, product: sanitizeProductForFrontend(product) });
  });
  app2.post("/api/haggle/offer", async (req, res) => {
    try {
      const { productId, userOffer, buyerName } = req.body || {};
      if (!productId || typeof userOffer !== "number") {
        return res.status(400).json({ success: false, error: "Param\xE8tres manquants : productId et userOffer requis." });
      }
      const clientId = req.headers["x-client-id"] || req.ip || "http_client";
      const aiResult = await handleHaggleOffer(productId, userOffer, { clientId, buyerName });
      res.json({ success: true, ...aiResult });
    } catch (err) {
      console.error("[API HAGGLE OFFER ERROR]", err);
      res.status(500).json({ success: false, error: err.message || "Erreur interne n\xE9gociation IA." });
    }
  });
  app2.post("/api/haggle/accept-escrow", async (req, res) => {
    try {
      const { productId, agreedPrice, buyerPhone, buyerName, buyerId, negotiationId } = req.body || {};
      if (!productId || typeof agreedPrice !== "number") {
        return res.status(400).json({ success: false, error: "Param\xE8tres manquants : productId et agreedPrice requis." });
      }
      const escrowResult = await lockHaggleEscrow({
        productId,
        agreedPrice,
        negotiationId,
        buyerId: buyerId || "http_buyer",
        buyerPhone: buyerPhone || "+2250700000000",
        buyerName: buyerName || "Acheteur Web"
      });
      res.json(escrowResult);
    } catch (err) {
      console.error("[API HAGGLE ESCROW ERROR]", err);
      res.status(400).json({ success: false, error: err.message || "Impossible de verrouiller le Smart Escrow." });
    }
  });
}

// src/server/tontineController.ts
var import_crypto3 = __toESM(require("crypto"), 1);

// src/server/sebpay-client.ts
var import_crypto2 = __toESM(require("crypto"), 1);
var SEBPAY_ESCROWS = /* @__PURE__ */ new Map();
var WAMEET_USER_WALLETS = /* @__PURE__ */ new Map();
var SebpayClient = class {
  constructor() {
    this.apiKey = process.env.SEBPAY_API_KEY || "sebpay_live_sec_key_2026";
    this.apiSecret = process.env.SEBPAY_API_SECRET || "sebpay_secret_hash_auth";
    this.baseUrl = process.env.SEBPAY_API_BASE_URL || "https://api.sebpay.africa/v1";
  }
  /**
   * Crée un paiement bloqué / sous séquestre (Escrow)
   * Bloque le montant plein (ex: 20 000 FCFA) lors de la participation à la Tontine
   */
  async createEscrowPayment(params) {
    const {
      amount,
      currency = "FCFA",
      description,
      customerPhone,
      customerName = "Participant Tontine",
      buyerId = `buyer_${Date.now()}`,
      tontineId = "tontine_default",
      metadata = {}
    } = params;
    const transactionId = `seb_tx_${Date.now()}_${import_crypto2.default.randomBytes(4).toString("hex")}`;
    const escrowId = `seb_escrow_${Date.now()}_${import_crypto2.default.randomBytes(3).toString("hex")}`;
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1e3;
    const paymentUrl = `https://checkout.sebpay.africa/pay/${transactionId}?amount=${amount}&currency=${currency}&phone=${encodeURIComponent(
      customerPhone
    )}&desc=${encodeURIComponent(description)}`;
    const escrowData = {
      transactionId,
      escrowId,
      amount,
      currency,
      description,
      customerPhone,
      customerName,
      buyerId,
      tontineId,
      status: "BLOCKED",
      paymentUrl,
      metadata,
      createdAt: now,
      expiresAt
    };
    SEBPAY_ESCROWS.set(transactionId, escrowData);
    console.log(
      `[SEBPAY CLIENT] Escrow initialis\xE9 pour ${customerPhone} : ${amount} ${currency} (Tx: ${transactionId})`
    );
    return {
      success: true,
      transactionId,
      escrowId,
      amount,
      currency,
      paymentUrl,
      status: "BLOCKED",
      expiresAt,
      createdAt: now
    };
  }
  /**
   * Encaisse définitivement un montant sous séquestre (ex: 15 000 FCFA au lieu de 20 000 FCFA)
   */
  async captureEscrowPayment(transactionId, amountToCapture) {
    const escrow = SEBPAY_ESCROWS.get(transactionId);
    if (!escrow) {
      console.warn(`[SEBPAY CLIENT] Transaction non trouv\xE9e en m\xE9moire (${transactionId}), encaissement forc\xE9.`);
    }
    const receiptNumber = `RCPT_SEB_${Date.now()}_${import_crypto2.default.randomBytes(3).toString("hex").toUpperCase()}`;
    if (escrow) {
      escrow.status = "CAPTURED";
      escrow.capturedAmount = amountToCapture;
      escrow.receiptNumber = receiptNumber;
    }
    console.log(
      `[SEBPAY CLIENT] Encaissement d\xE9finitif de ${amountToCapture} FCFA valid\xE9 sur Tx: ${transactionId} (Re\xE7u: ${receiptNumber})`
    );
    return {
      success: true,
      transactionId,
      capturedAmount: amountToCapture,
      currency: "FCFA",
      status: "CAPTURED",
      capturedAt: Date.now(),
      receiptNumber
    };
  }
  /**
   * Rembourse la différence (ex: 5 000 FCFA) directement sur le Mobile Money ou Wallet Wameet
   */
  async refundDifference(transactionId, refundAmount, customerPhone, reason = "Tontine Flash - Remboursement Prix de Gros") {
    const refundId = `seb_ref_${Date.now()}_${import_crypto2.default.randomBytes(3).toString("hex")}`;
    console.log(
      `[SEBPAY CLIENT] Remboursement de la diff\xE9rence (${refundAmount} FCFA) vers ${customerPhone} (Tx: ${transactionId}) - Motif: ${reason}`
    );
    return {
      success: true,
      refundId,
      originalTransactionId: transactionId,
      refundAmount,
      currency: "FCFA",
      recipientPhone: customerPhone,
      status: "REFUNDED",
      refundedAt: Date.now(),
      channel: "MOBILE_MONEY"
    };
  }
  /**
   * Annulation totale et remboursement intégral (Scénario d'échec de la Tontine)
   */
  async cancelAndFullRefund(transactionId, customerPhone, amount) {
    const refundId = `seb_fullref_${Date.now()}_${import_crypto2.default.randomBytes(3).toString("hex")}`;
    console.log(
      `[SEBPAY CLIENT] Annulation et Remboursement Int\xE9gral (${amount} FCFA) vers ${customerPhone} pour Tx: ${transactionId}`
    );
    return {
      success: true,
      refundId,
      originalTransactionId: transactionId,
      refundAmount: amount,
      currency: "FCFA",
      recipientPhone: customerPhone,
      status: "REFUNDED",
      refundedAt: Date.now(),
      channel: "MOBILE_MONEY"
    };
  }
  /**
   * Crédite le Wallet interne Wameet de l'utilisateur avec gestion de solde
   */
  async creditWameetWallet(userId, amount, reason) {
    const current = WAMEET_USER_WALLETS.get(userId) || 0;
    const newBalance = current + amount;
    WAMEET_USER_WALLETS.set(userId, newBalance);
    console.log(
      `[WAMEET WALLET] Cr\xE9dit de ${amount} FCFA pour ${userId}. Nouveau solde: ${newBalance} FCFA (Motif: ${reason})`
    );
    return {
      success: true,
      walletId: `wallet_${userId}`,
      creditedAmount: amount,
      balance: newBalance,
      timestamp: Date.now()
    };
  }
  /**
   * Retourne le solde actuel du Wallet interne Wameet
   */
  getWameetWalletBalance(userId) {
    return WAMEET_USER_WALLETS.get(userId) || 0;
  }
};
var sebpayClientInstance = new SebpayClient();
sebpayClientInstance.default = sebpayClientInstance;
sebpayClientInstance.sebpay = sebpayClientInstance;
var sebpay_client_default = sebpayClientInstance;

// src/server/tontineController.ts
var TONTINE_DATABASE = /* @__PURE__ */ new Map();
var TONTINE_LOCKS = /* @__PURE__ */ new Set();
var globalSocketEmitter = null;
function setTontineSocketEmitter(io) {
  globalSocketEmitter = io;
}
function broadcastToRoom(room, event, data) {
  if (globalSocketEmitter && typeof globalSocketEmitter.to === "function") {
    globalSocketEmitter.to(room).emit(event, data);
  } else if (globalSocketEmitter && typeof globalSocketEmitter.emit === "function") {
    globalSocketEmitter.emit(event, { room, ...data });
  }
}
async function startTontineSession(params) {
  const {
    liveRoomId,
    productId,
    productName = "Coffret Prestige Karit\xE9 Royal (Vente Flash)",
    targetCount = 50,
    timeLimitMinutes = 10,
    fullPrice = 2e4,
    discountPrice = 15e3,
    sellerId = "seller_official_wameet",
    failureAction = "refund_all"
  } = params;
  if (discountPrice >= fullPrice) {
    throw new Error("Le prix r\xE9duit (prix de gros) doit \xEAtre inf\xE9rieur au prix fort bloqu\xE9.");
  }
  const tontineId = `tontine_${Date.now()}_${import_crypto3.default.randomBytes(3).toString("hex")}`;
  const now = Date.now();
  const timeLimitMs = timeLimitMinutes * 60 * 1e3;
  const expiresAt = now + timeLimitMs;
  const refundPerUnit = fullPrice - discountPrice;
  const session = {
    id: tontineId,
    liveRoomId,
    productId,
    productName,
    targetCount,
    currentCount: 0,
    timeLimitMinutes,
    fullPrice,
    discountPrice,
    refundPerUnit,
    currency: "FCFA",
    sellerId,
    status: "ACTIVE",
    failureAction,
    createdAt: now,
    expiresAt,
    participants: []
  };
  session.timeoutTimer = setTimeout(async () => {
    try {
      console.log(`[TONTINE CRON] Timeout atteint (${timeLimitMinutes} mins) pour Tontine: ${tontineId}. R\xE9solution en cours...`);
      await resolveTontineSession(tontineId, "TIMEOUT");
    } catch (err) {
      console.error(`[TONTINE CRON ERROR] \xC9chec r\xE9solution timeout Tontine ${tontineId}:`, err);
    }
  }, timeLimitMs);
  TONTINE_DATABASE.set(tontineId, session);
  console.log(`[TONTINE D\xC9MARR\xC9E] ID: ${tontineId} | Room: ${liveRoomId} | Cible: ${targetCount} | Expire \xE0: ${new Date(expiresAt).toLocaleTimeString()}`);
  broadcastToRoom(liveRoomId, "tontine_started", {
    tontineId,
    productId,
    productName,
    targetCount,
    fullPrice,
    discountPrice,
    refundPerUnit,
    expiresAt,
    timeLimitSeconds: timeLimitMinutes * 60
  });
  return session;
}
async function participateInTontine(params) {
  const { tontineId, buyerId, buyerPhone, buyerName = "Spectateur Wameet", liveRoomId } = params;
  while (TONTINE_LOCKS.has(tontineId)) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  TONTINE_LOCKS.add(tontineId);
  try {
    const session = TONTINE_DATABASE.get(tontineId);
    if (!session) {
      throw new Error(`Session Tontine introuvable (ID: ${tontineId})`);
    }
    if (session.status !== "ACTIVE") {
      throw new Error(`Cette session Tontine n'est plus active (Statut: ${session.status})`);
    }
    if (Date.now() > session.expiresAt) {
      throw new Error("Le temps imparti pour cette Tontine Flash est \xE9coul\xE9.");
    }
    const existing = session.participants.find((p) => p.buyerId === buyerId || p.buyerPhone === buyerPhone);
    if (existing) {
      return {
        success: true,
        participantId: existing.id,
        transactionId: existing.transactionId,
        paymentUrl: existing.paymentUrl,
        blockedAmount: existing.blockedAmount,
        newCount: session.currentCount,
        targetCount: session.targetCount,
        tontineStatus: session.status
      };
    }
    const escrowResponse = await sebpay_client_default.createEscrowPayment({
      amount: session.fullPrice,
      // 20 000 FCFA
      currency: session.currency,
      description: `Tontine Flash Wameet - ${session.productName}`,
      customerPhone: buyerPhone,
      customerName: buyerName,
      buyerId,
      tontineId
    });
    if (!escrowResponse || !escrowResponse.success) {
      throw new Error("\xC9chec d\u2019initialisation du s\xE9questre bancaire Mobile Money avec Sebpay.");
    }
    const participantId = `part_${Date.now()}_${import_crypto3.default.randomBytes(3).toString("hex")}`;
    const participantRecord = {
      id: participantId,
      buyerId,
      buyerPhone,
      buyerName,
      transactionId: escrowResponse.transactionId,
      escrowId: escrowResponse.escrowId,
      blockedAmount: session.fullPrice,
      paymentUrl: escrowResponse.paymentUrl,
      status: "BLOCKED",
      joinedAt: Date.now()
    };
    session.participants.push(participantRecord);
    session.currentCount = session.participants.length;
    const newCount = session.currentCount;
    const roomToNotify = liveRoomId || session.liveRoomId;
    console.log(`[TONTINE PARTICIPATION] Acheteur ${buyerPhone} inscrit (${newCount}/${session.targetCount}) sur Tontine: ${tontineId}`);
    broadcastToRoom(roomToNotify, "tontine_progress_update", {
      tontineId: session.id,
      newCount,
      targetCount: session.targetCount,
      progressPercent: Math.min(100, Math.round(newCount / session.targetCount * 100)),
      lastParticipant: {
        name: buyerName,
        phoneMasked: buyerPhone.replace(/(\+\d{3})\d{4}(\d{3})/, "$1****$2")
      }
    });
    if (newCount >= session.targetCount) {
      console.log(`[TONTINE SEUIL ATTEINT] \u{1F3AF} ${newCount}/${session.targetCount} commandes atteintes ! D\xE9clenchement du Sc\xE9nario A (Succ\xE8s).`);
      setImmediate(() => {
        resolveTontineSession(session.id, "GOAL_REACHED").catch(
          (e) => console.error("[TONTINE RESOLVE TRIGGER ERROR]", e)
        );
      });
    }
    return {
      success: true,
      participantId,
      transactionId: escrowResponse.transactionId,
      paymentUrl: escrowResponse.paymentUrl,
      blockedAmount: session.fullPrice,
      newCount,
      targetCount: session.targetCount,
      tontineStatus: session.status
    };
  } finally {
    TONTINE_LOCKS.delete(tontineId);
  }
}
async function resolveTontineSession(tontineId, triggerReason = "TIMEOUT") {
  while (TONTINE_LOCKS.has(tontineId)) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  TONTINE_LOCKS.add(tontineId);
  const rollbackStack = [];
  const errorsEncountered = [];
  try {
    const session = TONTINE_DATABASE.get(tontineId);
    if (!session) {
      throw new Error(`Session Tontine introuvable (${tontineId})`);
    }
    if (session.status !== "ACTIVE") {
      console.log(`[TONTINE RESOLVE] Tontine ${tontineId} d\xE9j\xE0 r\xE9solue avec statut : ${session.status}`);
      return {
        tontineId,
        scenario: session.status === "COMPLETED_SUCCESS" ? "A_SUCCESS" : "B_FAILURE",
        totalParticipants: session.participants.length,
        processedCount: session.participants.length,
        finalCapturedAmountPerUnit: session.discountPrice,
        refundAmountPerUnit: session.refundPerUnit,
        totalRefundDistributed: session.participants.length * session.refundPerUnit,
        errors: []
      };
    }
    if (session.timeoutTimer) {
      clearTimeout(session.timeoutTimer);
      session.timeoutTimer = null;
    }
    const isSuccessGoalReached = session.currentCount >= session.targetCount;
    if (isSuccessGoalReached) {
      console.log(`[TONTINE SC\xC9NARIO A - SUCC\xC8S] Traitement de ${session.participants.length} participants \xE0 prix r\xE9duit...`);
      session.status = "COMPLETED_SUCCESS";
      session.completedAt = Date.now();
      let totalRefunds = 0;
      for (const participant of session.participants) {
        try {
          const captureResult = await sebpay_client_default.captureEscrowPayment(
            participant.transactionId,
            session.discountPrice
            // 15 000 FCFA
          );
          participant.status = "CAPTURED";
          participant.finalAmountCaptured = session.discountPrice;
          participant.receiptNumber = captureResult.receiptNumber;
          rollbackStack.push({
            action: "CAPTURE",
            participantId: participant.id,
            transactionId: participant.transactionId,
            amount: session.discountPrice,
            rollbackExecuted: false
          });
          const refundResult = await sebpay_client_default.refundDifference(
            participant.transactionId,
            session.refundPerUnit,
            // 5 000 FCFA
            participant.buyerPhone,
            `Remboursement Tontine Flash ${session.productName}`
          );
          await sebpay_client_default.creditWameetWallet(
            participant.buyerId,
            session.refundPerUnit,
            `Gain Achat Group\xE9 Tontine ${session.productName}`
          );
          participant.refundAmount = session.refundPerUnit;
          participant.refundTxId = refundResult.refundId;
          participant.refundChannel = "WAMEET_WALLET";
          rollbackStack.push({
            action: "REFUND",
            participantId: participant.id,
            transactionId: refundResult.refundId,
            amount: session.refundPerUnit,
            rollbackExecuted: false
          });
          totalRefunds += session.refundPerUnit;
        } catch (stepErr) {
          console.error(`[TONTINE TRANSACTION ERROR] \xC9chec pour participant ${participant.buyerPhone}:`, stepErr);
          participant.status = "FAILED";
          errorsEncountered.push(`Participant ${participant.buyerPhone} : ${stepErr.message}`);
        }
      }
      broadcastToRoom(session.liveRoomId, "tontine_completed", {
        success: true,
        tontineId: session.id,
        productId: session.productId,
        productName: session.productName,
        totalParticipants: session.participants.length,
        discountPrice: session.discountPrice,
        refundPerParticipant: session.refundPerUnit,
        totalRefundDistributed: totalRefunds,
        message: `\u{1F389} Tontine Flash r\xE9ussie ! Prix r\xE9duit d\xE9bloqu\xE9, ${session.refundPerUnit.toLocaleString("fr-FR")} FCFA rembours\xE9s \xE0 tous les participants !`
      });
      return {
        tontineId,
        scenario: "A_SUCCESS",
        totalParticipants: session.participants.length,
        processedCount: session.participants.length - errorsEncountered.length,
        finalCapturedAmountPerUnit: session.discountPrice,
        refundAmountPerUnit: session.refundPerUnit,
        totalRefundDistributed: totalRefunds,
        errors: errorsEncountered
      };
    } else {
      console.log(`[TONTINE SC\xC9NARIO B - \xC9CHEC] Jauge non atteinte (${session.currentCount}/${session.targetCount}). Action: ${session.failureAction}`);
      session.status = "FAILED_EXPIRED";
      session.completedAt = Date.now();
      for (const participant of session.participants) {
        try {
          if (session.failureAction === "refund_all") {
            const refundRes = await sebpay_client_default.cancelAndFullRefund(
              participant.transactionId,
              participant.buyerPhone,
              participant.blockedAmount
              // 20 000 FCFA
            );
            participant.status = "REFUNDED";
            participant.refundAmount = participant.blockedAmount;
            participant.refundTxId = refundRes.refundId;
          } else {
            const capRes = await sebpay_client_default.captureEscrowPayment(
              participant.transactionId,
              participant.blockedAmount
              // 20 000 FCFA
            );
            participant.status = "CAPTURED";
            participant.finalAmountCaptured = participant.blockedAmount;
            participant.receiptNumber = capRes.receiptNumber;
          }
        } catch (failErr) {
          console.error(`[TONTINE REFUND FAIL ERROR] ${participant.buyerPhone}:`, failErr);
          errorsEncountered.push(`Participant ${participant.buyerPhone} : ${failErr.message}`);
        }
      }
      broadcastToRoom(session.liveRoomId, "tontine_failed", {
        success: false,
        tontineId: session.id,
        currentCount: session.currentCount,
        targetCount: session.targetCount,
        reason: "time_limit_expired",
        actionTaken: session.failureAction,
        message: session.failureAction === "refund_all" ? "Objectif de commandes non atteint. Tous les fonds bloqu\xE9s ont \xE9t\xE9 int\xE9gralement rembours\xE9s." : "Objectif non atteint. Les commandes ont \xE9t\xE9 valid\xE9es au tarif normal."
      });
      return {
        tontineId,
        scenario: "B_FAILURE",
        totalParticipants: session.participants.length,
        processedCount: session.participants.length - errorsEncountered.length,
        finalCapturedAmountPerUnit: session.failureAction === "keep_normal_order" ? session.fullPrice : 0,
        refundAmountPerUnit: session.failureAction === "refund_all" ? session.fullPrice : 0,
        totalRefundDistributed: session.failureAction === "refund_all" ? session.participants.length * session.fullPrice : 0,
        errors: errorsEncountered
      };
    }
  } catch (fatalErr) {
    console.error(`[CRITICAL TONTINE ERROR] D\xE9clenchement du Rollback Transactionnel:`, fatalErr);
    for (const rb of rollbackStack) {
      if (!rb.rollbackExecuted) {
        console.warn(`[ROLLBACK OPERATION] Annulation pour Tx ${rb.transactionId} (${rb.amount} FCFA)...`);
        rb.rollbackExecuted = true;
      }
    }
    throw fatalErr;
  } finally {
    TONTINE_LOCKS.delete(tontineId);
  }
}
function attachTontineRoutes(app2, io) {
  if (io) {
    setTontineSocketEmitter(io);
  }
  app2.post("/api/tontine/start", async (req, res) => {
    try {
      const {
        liveRoomId,
        productId,
        productName,
        targetCount = 50,
        timeLimitMinutes = 10,
        fullPrice = 2e4,
        discountPrice = 15e3,
        sellerId,
        failureAction = "refund_all"
      } = req.body || {};
      if (!productId || !liveRoomId) {
        return res.status(400).json({
          success: false,
          error: "Champs obligatoires manquants : productId et liveRoomId requis."
        });
      }
      const session = await startTontineSession({
        liveRoomId,
        productId,
        productName,
        targetCount: Number(targetCount),
        timeLimitMinutes: Number(timeLimitMinutes),
        fullPrice: Number(fullPrice),
        discountPrice: Number(discountPrice),
        sellerId,
        failureAction
      });
      const { timeoutTimer, ...safeSession } = session;
      res.status(201).json({
        success: true,
        session: safeSession
      });
    } catch (err) {
      console.error("[API TONTINE START ERROR]", err);
      res.status(500).json({ success: false, error: err.message || "Erreur interne cr\xE9ation Tontine." });
    }
  });
  app2.post("/api/tontine/participate", async (req, res) => {
    try {
      const { tontineId, buyerId, buyerPhone, buyerName, liveRoomId } = req.body || {};
      if (!tontineId || !buyerPhone || !buyerId) {
        return res.status(400).json({
          success: false,
          error: "Champs manquants : tontineId, buyerId et buyerPhone obligatoires."
        });
      }
      const result = await participateInTontine({
        tontineId,
        buyerId,
        buyerPhone,
        buyerName,
        liveRoomId
      });
      res.status(200).json(result);
    } catch (err) {
      console.error("[API TONTINE PARTICIPATE ERROR]", err);
      res.status(400).json({ success: false, error: err.message || "Impossible de participer \xE0 la Tontine." });
    }
  });
  app2.get("/api/tontine/:id", (req, res) => {
    const session = TONTINE_DATABASE.get(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: "Session Tontine introuvable." });
    }
    const { timeoutTimer, ...safeSession } = session;
    const progressPercent = Math.min(100, Math.round(session.currentCount / session.targetCount * 100));
    res.json({
      success: true,
      session: safeSession,
      progressPercent,
      remainingSeconds: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1e3))
    });
  });
  app2.post("/api/tontine/:id/resolve", async (req, res) => {
    try {
      const resolution = await resolveTontineSession(req.params.id, "MANUAL");
      res.json({ success: true, resolution });
    } catch (err) {
      console.error("[API TONTINE RESOLVE ERROR]", err);
      res.status(500).json({ success: false, error: err.message || "Erreur lors de la r\xE9solution de la Tontine." });
    }
  });
}

// src/server/posSyncController.ts
var POS_SYNC_M2M_TOKEN = process.env.POS_SYNC_M2M_TOKEN || "nana_pos_m2m_phygital_secret_token_2026";
var ACTIVE_LIVE_ROOMS = /* @__PURE__ */ new Map([
  [
    "live_room_abidjan",
    {
      liveRoomId: "live_room_abidjan",
      title: "Vente Flash Prestige Abidjan Mall \u{1F525}",
      sellerId: "awa_nana_empire",
      status: "active",
      pinnedProductId: "prod_flash_live_1",
      pinnedProductName: "Coffret Karit\xE9 Royal Or Prestige (\xC9dition Limit\xE9e)",
      currentStock: 5,
      viewersCount: 142,
      updatedAt: Date.now()
    }
  ],
  [
    "live_room_ouaga",
    {
      liveRoomId: "live_room_ouaga",
      title: "Grand D\xE9stockage Textile & Wax Ouagadougou",
      sellerId: "moussa_fashion_bf",
      status: "active",
      pinnedProductId: "prod_flash_live_2",
      pinnedProductName: "Robe Wax Royale Soie d\u2019Abidjan",
      currentStock: 3,
      viewersCount: 89,
      updatedAt: Date.now()
    }
  ]
]);
var globalSocketEmitter2 = null;
function setPosSyncSocketEmitter(io) {
  globalSocketEmitter2 = io;
}
function setPinnedProductInLiveRoom(liveRoomId, productId, productName, stock) {
  const room = ACTIVE_LIVE_ROOMS.get(liveRoomId);
  if (room) {
    room.pinnedProductId = productId;
    room.pinnedProductName = productName;
    room.currentStock = stock;
    room.status = "active";
    room.updatedAt = Date.now();
  } else {
    ACTIVE_LIVE_ROOMS.set(liveRoomId, {
      liveRoomId,
      title: `Live Shopping Wameet #${liveRoomId}`,
      sellerId: "seller_default",
      status: "active",
      pinnedProductId: productId,
      pinnedProductName: productName,
      currentStock: stock,
      viewersCount: 1,
      updatedAt: Date.now()
    });
  }
}
function getActiveLiveRooms() {
  return Array.from(ACTIVE_LIVE_ROOMS.values()).filter((r) => r.status === "active");
}
async function handlePosSyncSale(payload, io) {
  const startTime = Date.now();
  const emitter = io || globalSocketEmitter2;
  const { storeLocation, items } = payload;
  const result = {
    processedItems: items.length,
    activeMatches: [],
    unmatchedItems: []
  };
  for (const item of items) {
    const { productId, quantitySold } = item;
    const catalogProduct = NANA_PRODUCT_CATALOG.get(productId);
    if (catalogProduct) {
      catalogProduct.stock = Math.max(0, catalogProduct.stock - quantitySold);
    }
    let isMatchedInLive = false;
    for (const room of ACTIVE_LIVE_ROOMS.values()) {
      if (room.status === "active" && room.pinnedProductId === productId) {
        isMatchedInLive = true;
        const updatedStock = Math.max(0, room.currentStock - quantitySold);
        room.currentStock = updatedStock;
        room.updatedAt = Date.now();
        const resolvedProductName = item.productName || room.pinnedProductName || catalogProduct?.name || "Produit Phygital";
        const isOutOfStock = updatedStock <= 0;
        result.activeMatches.push({
          liveRoomId: room.liveRoomId,
          productId,
          productName: resolvedProductName,
          quantitySold,
          newStock: updatedStock,
          storeLocation,
          isOutOfStock
        });
        console.log(
          `[PHYGITAL MATCH] \u26A1 Vente physique d\xE9tect\xE9e pour ${resolvedProductName} \xE0 ${storeLocation} ! Nouveau stock: ${updatedStock} (Room: ${room.liveRoomId})`
        );
        if (emitter) {
          emitter.to(room.liveRoomId).emit("physical_store_sale", {
            productId,
            productName: resolvedProductName,
            newStock: updatedStock,
            quantitySold,
            location: storeLocation,
            timestamp: Date.now()
          });
          if (isOutOfStock) {
            console.warn(
              `[SECURITY ALERT] \u{1F6D1} RUPTURE DE STOCK IMM\xC9DIATE pour ${resolvedProductName} ! \xC9mission de lock_product_sales sur ${room.liveRoomId}.`
            );
            emitter.to(room.liveRoomId).emit("lock_product_sales", {
              productId,
              productName: resolvedProductName,
              newStock: 0,
              reason: "physical_store_stock_exhausted",
              location: storeLocation,
              timestamp: Date.now()
            });
            room.pinnedProductId = null;
          }
        }
      }
    }
    if (!isMatchedInLive) {
      result.unmatchedItems.push(productId);
    }
  }
  const durationMs = Date.now() - startTime;
  console.log(`[PHYGITAL ENGINE] Synchronisation caisse achev\xE9e en ${durationMs}ms (${result.activeMatches.length} alertes \xE9mises).`);
  return result;
}
function verifyM2mAuth(req) {
  const customHeaderToken = req.headers["x-pos-m2m-token"];
  const authHeader = req.headers["authorization"];
  const apiKeyHeader = req.headers["x-api-key"];
  if (customHeaderToken && customHeaderToken === POS_SYNC_M2M_TOKEN) {
    return true;
  }
  if (apiKeyHeader && apiKeyHeader === POS_SYNC_M2M_TOKEN) {
    return true;
  }
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (bearer === POS_SYNC_M2M_TOKEN) {
      return true;
    }
  }
  return false;
}
function attachPosSyncRoutes(app2, io) {
  if (io) {
    setPosSyncSocketEmitter(io);
  }
  app2.post("/api/pos/sync-sale", async (req, res) => {
    try {
      if (!verifyM2mAuth(req)) {
        console.error("[SECURITY REJECTION] Requ\xEAte POS sync rejet\xE9e : Token M2M invalide ou manquant.");
        return res.status(401).json({
          success: false,
          error: "Acc\xE8s non autoris\xE9 : Token d\u2019authentification Machine-to-Machine (M2M) invalide."
        });
      }
      const { storeLocation, items, receiptId, cashierId } = req.body || {};
      if (!storeLocation || typeof storeLocation !== "string") {
        return res.status(400).json({
          success: false,
          error: 'Champ obligatoire manquant : storeLocation requis (ex: "Boutique Ouagadougou").'
        });
      }
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Champ obligatoire manquant : items doit \xEAtre un tableau non vide."
        });
      }
      for (const it of items) {
        if (!it.productId || typeof it.quantitySold !== "number" || it.quantitySold <= 0) {
          return res.status(400).json({
            success: false,
            error: "Chaque item doit contenir un productId valide et un quantitySold > 0."
          });
        }
      }
      const syncResult = await handlePosSyncSale({
        storeLocation,
        items,
        receiptId,
        cashierId,
        timestamp: Date.now()
      });
      return res.status(200).json({
        success: true,
        message: "Synchronisation phygitale ex\xE9cut\xE9e avec succ\xE8s.",
        syncedAt: Date.now(),
        ...syncResult
      });
    } catch (err) {
      console.error("[FATAL POS SYNC ERROR]", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Erreur interne lors de la synchronisation phygitale."
      });
    }
  });
  app2.get("/api/pos/live-rooms", (req, res) => {
    if (!verifyM2mAuth(req)) {
      return res.status(401).json({ success: false, error: "Unauthorized M2M" });
    }
    return res.json({ success: true, rooms: getActiveLiveRooms() });
  });
  app2.post("/api/pos/pin-product", (req, res) => {
    if (!verifyM2mAuth(req)) {
      return res.status(401).json({ success: false, error: "Unauthorized M2M" });
    }
    const { liveRoomId, productId, productName, stock } = req.body || {};
    if (!liveRoomId || !productId) {
      return res.status(400).json({ success: false, error: "liveRoomId et productId requis" });
    }
    setPinnedProductInLiveRoom(liveRoomId, productId, productName || productId, Number(stock || 5));
    return res.json({ success: true, message: "Produit \xE9pingl\xE9 avec succ\xE8s." });
  });
  app2.post("/api/pos/auto-order", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const isInternal = authHeader === `Bearer ${POS_SYNC_M2M_TOKEN}` || req.headers["x-internal-token"] === POS_SYNC_M2M_TOKEN || req.headers["x-m2m-token"] === POS_SYNC_M2M_TOKEN;
      if (!isInternal && process.env.NODE_ENV === "production") {
        return res.status(401).json({ success: false, error: "Unauthorized M2M Token" });
      }
      const {
        productId,
        productName,
        orderAmount,
        cagnotteId,
        recipientName,
        deliverySlot,
        deliveryAddress,
        merchantWalletId
      } = req.body || {};
      const orderId = `CMD-POS-AUTO-${Date.now().toString().slice(-6)}`;
      console.log(
        `[POS AUTO-ORDER] \u{1F4E6} Commande physique automatique g\xE9n\xE9r\xE9e : ${orderId} pour ${productName || productId} (${orderAmount} FCFA). Destinataire: ${recipientName}`
      );
      return res.status(200).json({
        success: true,
        orderId,
        productId,
        productName,
        orderAmount,
        status: "PREPARING_GIFT",
        merchantWalletId: merchantWalletId || "wallet_pos_merchant",
        deliverySlot: deliverySlot || "Livraison \xE0 la f\xEAte",
        deliveryAddress: deliveryAddress || "Adresse client",
        createdAt: Date.now()
      });
    } catch (err) {
      console.error("[POS AUTO-ORDER ERROR]", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
}

// src/server/microRelayController.ts
var import_crypto4 = __toESM(require("crypto"), 1);

// src/server/swarmLogisticsController.ts
var SWARM_ORDERS_REGISTRY = /* @__PURE__ */ new Map();
var ORDER_MUTEX_LOCKS = /* @__PURE__ */ new Set();
var globalSocketEmitter3 = null;
var DELIVERY_DRIVER_SOCKETS = /* @__PURE__ */ new Set();
function setLogisticsSocketEmitter(io) {
  globalSocketEmitter3 = io;
}
function registerDriverSocket(socketId) {
  DELIVERY_DRIVER_SOCKETS.add(socketId);
  console.log(`[SWARM LOGISTICS] Socket ${socketId} a rejoint 'delivery_drivers_room'`);
}
function unregisterDriverSocket(socketId) {
  DELIVERY_DRIVER_SOCKETS.delete(socketId);
}
async function acquireOrderLocks(orderIds, maxWaitMs = 2500) {
  const acquired = [];
  const start = Date.now();
  for (const orderId of orderIds) {
    while (ORDER_MUTEX_LOCKS.has(orderId)) {
      if (Date.now() - start > maxWaitMs) {
        releaseOrderLocks(acquired);
        throw new Error(`[LOCK TIMEOUT] Conflit d'acc\xE8s pour la commande ${orderId}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
    ORDER_MUTEX_LOCKS.add(orderId);
    acquired.push(orderId);
  }
  return acquired;
}
function releaseOrderLocks(orderIds) {
  for (const orderId of orderIds) {
    ORDER_MUTEX_LOCKS.delete(orderId);
  }
}
function emitLogisticsEvent(targetId, event, data) {
  if (!globalSocketEmitter3) {
    console.warn(`[SWARM LOGISTICS] Aucun \xE9metteur WebSocket actif pour "${event}" vers ${targetId}`);
    return;
  }
  try {
    globalSocketEmitter3.to(targetId).emit(event, data);
  } catch (err) {
    console.warn(`[SWARM LOGISTICS] Erreur \xE9mission io.to(${targetId}) :`, err);
  }
  if (targetId === "delivery_drivers_room" && DELIVERY_DRIVER_SOCKETS.size > 0) {
    for (const socketId of DELIVERY_DRIVER_SOCKETS) {
      try {
        globalSocketEmitter3.to(socketId).emit(event, data);
      } catch {
      }
    }
  }
}
function emitNewOrderPing(orderData) {
  const {
    orderId,
    orderNumber = `CMD-${Math.floor(1e3 + Math.random() * 9e3)}`,
    buyerId,
    buyerName = "Client Live Wameet",
    buyerPhone = "+22670000000",
    sellerId = "usr_seller_default",
    sellerName = "Boutique Wameet",
    lat = 12.315 + (Math.random() - 0.5) * 0.015,
    lng = -1.505 + (Math.random() - 0.5) * 0.015,
    neighborhood = "Ouaga 2000",
    address = "Ouaga 2000, Secteur 15",
    productName = "Article Live Shopping",
    amount = 15e3,
    deliveryFee = 1e3,
    liveId = "live-123"
  } = orderData;
  const order = {
    orderId,
    orderNumber,
    buyerId,
    buyerName,
    buyerPhone,
    sellerId,
    sellerName,
    lat,
    lng,
    neighborhood,
    address,
    productName,
    amount,
    deliveryFee,
    status: "awaiting_driver",
    liveId,
    driverId: null,
    driverName: null,
    eta: null,
    createdAt: Date.now()
  };
  SWARM_ORDERS_REGISTRY.set(orderId, order);
  console.log(
    `[SWARM LOGISTICS] \u{1F4E2} Nouvelle commande g\xE9olocalis\xE9e ${orderNumber} (${neighborhood}, lat: ${lat}, lng: ${lng})`
  );
  emitLogisticsEvent("delivery_drivers_room", "new_order_ping", {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    buyerId: order.buyerId,
    customerName: order.buyerName,
    customerPhone: order.buyerPhone,
    productName: order.productName,
    productPrice: order.amount,
    deliveryFee: order.deliveryFee,
    lat: order.lat,
    lng: order.lng,
    neighborhood: order.neighborhood,
    address: order.address,
    status: "awaiting_driver",
    liveId: order.liveId,
    createdAt: order.createdAt
  });
  return order;
}
async function acceptBatchTransaction(payload) {
  const {
    batchId = `batch_${Date.now()}`,
    orderIds,
    driverId,
    driverName,
    driverPhone = "+22670112233",
    eta = "45 mins"
  } = payload;
  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    throw {
      status: 400,
      code: "INVALID_PAYLOAD",
      message: "Le tableau orderIds est obligatoire et ne peut \xEAtre vide."
    };
  }
  if (!driverId || !driverName) {
    throw {
      status: 400,
      code: "INVALID_DRIVER",
      message: "driverId et driverName sont obligatoires."
    };
  }
  const lockedOrders = await acquireOrderLocks(orderIds);
  try {
    const ordersToAssign = [];
    for (const orderId of orderIds) {
      let order = SWARM_ORDERS_REGISTRY.get(orderId);
      if (!order) {
        order = {
          orderId,
          orderNumber: `CMD-${orderId.substring(orderId.length - 4)}`,
          buyerId: `buyer_${orderId}`,
          buyerName: "Client Live",
          buyerPhone: "+22670000000",
          sellerId: "usr_seller",
          lat: 12.315,
          lng: -1.505,
          neighborhood: "Ouaga 2000",
          address: "Ouaga 2000",
          productName: "Article Live",
          amount: 15e3,
          deliveryFee: 1e3,
          status: "awaiting_driver",
          createdAt: Date.now()
        };
        SWARM_ORDERS_REGISTRY.set(orderId, order);
      }
      if (order.status !== "awaiting_driver") {
        console.warn(
          `[SWARM CONFLIT] La commande ${orderId} a d\xE9j\xE0 \xE9t\xE9 assign\xE9e au livreur "${order.driverName}" (${order.driverId}) !`
        );
        throw {
          status: 409,
          code: "BATCH_ALREADY_CLAIMED",
          message: "Ce lot a d\xE9j\xE0 \xE9t\xE9 r\xE9cup\xE9r\xE9 par un autre pilote",
          conflictedOrderId: orderId,
          claimedBy: order.driverName
        };
      }
      ordersToAssign.push(order);
    }
    const now = Date.now();
    for (const order of ordersToAssign) {
      order.status = "assigned";
      order.driverId = driverId;
      order.driverName = driverName;
      order.driverPhone = driverPhone;
      order.eta = eta;
      order.assignedAt = now;
    }
    console.log(
      `[SWARM ASSIGNATION COMMIT] \u2705 Lot ${batchId} (${orderIds.length} commandes) assign\xE9 avec succ\xE8s au livreur ${driverName} (${driverId})`
    );
    emitLogisticsEvent("delivery_drivers_room", "batch_claimed", {
      batchId,
      orderIds,
      claimedByDriverId: driverId,
      claimedByDriverName: driverName,
      timestamp: now
    });
    for (const order of ordersToAssign) {
      if (order.buyerId) {
        emitLogisticsEvent(order.buyerId, "driver_assigned", {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          driverName,
          driverPhone,
          eta,
          productName: order.productName,
          neighborhood: order.neighborhood,
          message: `\u2705 G\xE9nial ! Le livreur ${driverName} vient de r\xE9cup\xE9rer votre commande. Arriv\xE9e pr\xE9vue dans ${eta} !`,
          timestamp: now
        });
        console.log(
          `[WOW EFFECT CLIENT] \u{1F680} Notification de r\xE9confort \xE9mise vers l'acheteur ${order.buyerId} : "${driverName} en route, ETA ${eta}"`
        );
      }
    }
    return {
      success: true,
      batchId,
      assignedCount: ordersToAssign.length,
      orders: ordersToAssign,
      driver: { driverId, driverName, driverPhone },
      eta
    };
  } finally {
    releaseOrderLocks(lockedOrders);
  }
}
function attachSwarmLogisticsRoutes(app2) {
  app2.post("/api/logistics/accept-batch", async (req, res) => {
    try {
      const { batchId, orderIds, driverId, driverName, driverPhone, eta } = req.body;
      const result = await acceptBatchTransaction({
        batchId,
        orderIds,
        driverId: driverId || "driver_default",
        driverName: driverName || "Livreur Partenaire Wameet",
        driverPhone,
        eta: eta || "45 mins"
      });
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      const code = err.code || "ACCEPT_BATCH_ERROR";
      const message = err.message || "Erreur lors de l\u2019acceptation du lot";
      console.error(`[ROUTE ERROR /api/logistics/accept-batch] (${status}):`, message);
      return res.status(status).json({
        success: false,
        code,
        message,
        details: err
      });
    }
  });
  app2.get("/api/logistics/orders", (req, res) => {
    const statusFilter = req.query.status;
    const neighborhood = req.query.neighborhood;
    let list = Array.from(SWARM_ORDERS_REGISTRY.values());
    if (statusFilter) {
      list = list.filter((o) => o.status === statusFilter);
    }
    if (neighborhood) {
      list = list.filter((o) => o.neighborhood.toLowerCase() === neighborhood.toLowerCase());
    }
    return res.status(200).json({
      success: true,
      total: list.length,
      orders: list
    });
  });
  app2.post("/api/logistics/new-order", (req, res) => {
    try {
      const order = emitNewOrderPing(req.body);
      return res.status(201).json({ success: true, order });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.post("/api/logistics/simulate-race-condition", async (_req, res) => {
    try {
      const testOrderId = `ord_race_${Date.now()}`;
      emitNewOrderPing({
        orderId: testOrderId,
        orderNumber: "CMD-RACE-1",
        buyerId: "buyer_race_vip",
        buyerName: "Awa Test VIP",
        neighborhood: "Ouaga 2000",
        amount: 18500
      });
      const driverAPromise = acceptBatchTransaction({
        batchId: "batch_race_1",
        orderIds: [testOrderId],
        driverId: "drv_moussa_fast",
        driverName: "Moussa l\u2019\xC9clair"
      });
      const driverBPromise = acceptBatchTransaction({
        batchId: "batch_race_1",
        orderIds: [testOrderId],
        driverId: "drv_salif_late",
        driverName: "Salif En Retard"
      });
      const [resA, resB] = await Promise.allSettled([driverAPromise, driverBPromise]);
      return res.status(200).json({
        success: true,
        message: "Simulation de course critique effectu\xE9e avec succ\xE8s.",
        driverA_result: resA.status === "fulfilled" ? resA.value : resA.reason,
        driverB_result: resB.status === "fulfilled" ? resB.value : resB.reason
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  console.log("\u2705 Routes Swarm Logistics attach\xE9es sur /api/logistics/accept-batch");
}

// src/server/microRelayController.ts
var AFFILIATE_ATTRIBUTION_REGISTRY = /* @__PURE__ */ new Map();
var SEBPAY_ORDERS_REGISTRY = /* @__PURE__ */ new Map();
var ACID_AUDIT_LOGS = [];
var WALLET_MUTEXES = /* @__PURE__ */ new Set();
var USER_CONNECTED_SOCKETS = /* @__PURE__ */ new Map();
var globalSocketEmitter4 = null;
function setMicroRelaySocketEmitter(io) {
  globalSocketEmitter4 = io;
}
function registerUserSocket(userId, socketId) {
  if (!USER_CONNECTED_SOCKETS.has(userId)) {
    USER_CONNECTED_SOCKETS.set(userId, /* @__PURE__ */ new Set());
  }
  USER_CONNECTED_SOCKETS.get(userId).add(socketId);
  console.log(`[MICRO-RELAIS WS] Utilisateur ${userId} associ\xE9 au socket ${socketId}`);
}
function unregisterUserSocket(socketId) {
  for (const [userId, sockets] of USER_CONNECTED_SOCKETS.entries()) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      USER_CONNECTED_SOCKETS.delete(userId);
    }
  }
}
async function acquireWalletLock(walletId, maxWaitMs = 3e3) {
  const startTime = Date.now();
  while (WALLET_MUTEXES.has(walletId)) {
    if (Date.now() - startTime > maxWaitMs) {
      throw new Error(`[ACID LOCK TIMEOUT] Impossible d'acqu\xE9rir le verrou pour ${walletId}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  WALLET_MUTEXES.add(walletId);
  return true;
}
function releaseWalletLock(walletId) {
  WALLET_MUTEXES.delete(walletId);
}
async function executeAcidSplitTransaction(params) {
  const {
    transactionId,
    orderId,
    sellerId,
    sellerAmount,
    affiliateId,
    commissionAmount,
    totalAmount
  } = params;
  if (sellerAmount + commissionAmount !== totalAmount) {
    throw new Error(
      `[ACID COH\xC9RENCE] Incoh\xE9rence des montants : ${sellerAmount} + ${commissionAmount} != ${totalAmount}`
    );
  }
  const auditEntry = {
    transactionId,
    orderId,
    sellerId,
    sellerAmount,
    affiliateId,
    commissionAmount,
    sellerWalletBefore: 0,
    sellerWalletAfter: 0,
    status: "STARTED",
    timestamp: Date.now()
  };
  const sellerWalletKey = `wallet_${sellerId}`;
  const affiliateWalletKey = affiliateId ? `wallet_${affiliateId}` : null;
  await acquireWalletLock(sellerWalletKey);
  if (affiliateWalletKey) {
    await acquireWalletLock(affiliateWalletKey);
  }
  let sellerCredited = false;
  let affiliateCredited = false;
  try {
    const sellerTx = await sebpay_client_default.creditWameetWallet(
      sellerId,
      sellerAmount,
      `Vente Live Micro-Relais (Tx: ${transactionId} - Commande ${orderId})`
    );
    auditEntry.sellerWalletAfter = sellerTx.balance;
    auditEntry.sellerWalletBefore = sellerTx.balance - sellerAmount;
    sellerCredited = true;
    if (affiliateId && commissionAmount > 0) {
      const affiliateTx = await sebpay_client_default.creditWameetWallet(
        affiliateId,
        commissionAmount,
        `Commission Micro-Relais 5% (Tx: ${transactionId} - Commande ${orderId})`
      );
      auditEntry.affiliateWalletAfter = affiliateTx.balance;
      auditEntry.affiliateWalletBefore = affiliateTx.balance - commissionAmount;
      affiliateCredited = true;
    }
    auditEntry.status = "COMMITTED";
    ACID_AUDIT_LOGS.push(auditEntry);
    console.log(
      `[ACID TRANSACTION COMMIT] Succ\xE8s Tx: ${transactionId} | Vendeur (${sellerId}): +${sellerAmount} FCFA | Affili\xE9 (${affiliateId || "aucun"}): +${commissionAmount} FCFA`
    );
    return auditEntry;
  } catch (err) {
    console.error(`[ACID TRANSACTION ERROR] \xC9chec de la transaction ${transactionId} :`, err);
    auditEntry.status = "ROLLED_BACK";
    auditEntry.error = err.message || "Erreur ex\xE9cution ACID";
    if (sellerCredited) {
      try {
        console.warn(`[ACID ROLLBACK] Annulation du cr\xE9dit vendeur (${sellerAmount} FCFA)...`);
        await sebpay_client_default.creditWameetWallet(
          sellerId,
          -sellerAmount,
          `COMPENSATION ROLLBACK Tx: ${transactionId}`
        );
      } catch (rollbackErr) {
        console.error("[ACID CRITICAL ROLLBACK FAILURE]", rollbackErr);
      }
    }
    if (affiliateCredited && affiliateId) {
      try {
        await sebpay_client_default.creditWameetWallet(
          affiliateId,
          -commissionAmount,
          `COMPENSATION ROLLBACK Tx: ${transactionId}`
        );
      } catch (rollbackErr) {
        console.error("[ACID CRITICAL ROLLBACK FAILURE]", rollbackErr);
      }
    }
    ACID_AUDIT_LOGS.push(auditEntry);
    throw err;
  } finally {
    releaseWalletLock(sellerWalletKey);
    if (affiliateWalletKey) {
      releaseWalletLock(affiliateWalletKey);
    }
  }
}
function emitToTarget(targetId, event, payload) {
  if (!globalSocketEmitter4) {
    console.warn(`[MICRO-RELAIS WS] Pas d'\xE9metteur WebSocket actif pour \xE9mettre "${event}" \xE0 ${targetId}`);
    return;
  }
  try {
    globalSocketEmitter4.to(targetId).emit(event, payload);
  } catch (err) {
    console.warn(`[MICRO-RELAIS WS] \xC9chec \xE9mission directe \xE0 ${targetId} :`, err);
  }
  const userSockets = USER_CONNECTED_SOCKETS.get(targetId);
  if (userSockets && userSockets.size > 0) {
    for (const socketId of userSockets) {
      try {
        globalSocketEmitter4.to(socketId).emit(event, payload);
      } catch {
      }
    }
  }
}
function trackLiveAffiliateJoin(params) {
  const { liveId, userId = "anon_viewer", socketId, ref: ref2, metadata } = params;
  if (!ref2 || ref2.trim() === "") {
    return {
      success: true,
      liveId,
      trackedAffiliateId: null,
      hasAffiliate: false,
      message: "Spectateur connect\xE9 sans parrainage Micro-Relais."
    };
  }
  const cleanAffiliateId = ref2.trim();
  const sessionKey = `${liveId}_${userId}`;
  const sessionData = {
    buyerId: userId,
    liveId,
    affiliateId: cleanAffiliateId,
    socketId,
    trackedAt: Date.now(),
    metadata
  };
  AFFILIATE_ATTRIBUTION_REGISTRY.set(sessionKey, sessionData);
  if (socketId) {
    AFFILIATE_ATTRIBUTION_REGISTRY.set(`socket_${socketId}`, sessionData);
    registerUserSocket(userId, socketId);
  }
  console.log(
    `[MICRO-RELAIS TRACKING] Acheteur ${userId} affili\xE9 \xE0 ${cleanAffiliateId} pour le Live ${liveId}`
  );
  return {
    success: true,
    liveId,
    trackedAffiliateId: cleanAffiliateId,
    hasAffiliate: true,
    message: `Lien d'affiliation Micro-Relais (${cleanAffiliateId}) rattach\xE9 avec succ\xE8s.`
  };
}
async function initiateSebpayCheckout(payload) {
  const {
    buyerId,
    buyerPhone,
    buyerName = "Acheteur Live",
    sellerId,
    liveId,
    productId,
    productName = "Article Flash Live",
    amount,
    currency = "FCFA",
    ref: ref2,
    commissionRate = 0.05
    // 5%
  } = payload;
  if (!amount || amount <= 0) {
    throw new Error("Le montant de paiement est invalide.");
  }
  let resolvedAffiliateId = ref2 || null;
  if (!resolvedAffiliateId) {
    const sessionKey = `${liveId}_${buyerId}`;
    const trackedSession = AFFILIATE_ATTRIBUTION_REGISTRY.get(sessionKey);
    if (trackedSession && trackedSession.affiliateId) {
      resolvedAffiliateId = trackedSession.affiliateId;
    }
  }
  if (resolvedAffiliateId === buyerId || resolvedAffiliateId === sellerId) {
    console.info("[MICRO-RELAIS] Auto-parrainage d\xE9tect\xE9 et neutralis\xE9.");
    resolvedAffiliateId = null;
  }
  const orderId = `ord_seb_${Date.now()}_${import_crypto4.default.randomBytes(3).toString("hex")}`;
  const totalAmount = Math.round(amount);
  let commissionAmount = 0;
  let sellerAmount = totalAmount;
  if (resolvedAffiliateId) {
    commissionAmount = Math.round(totalAmount * commissionRate);
    sellerAmount = totalAmount - commissionAmount;
  }
  const escrowRes = await sebpay_client_default.createEscrowPayment({
    amount: totalAmount,
    currency,
    description: `Achat Live Micro-Relais: ${productName}`,
    customerPhone: buyerPhone,
    customerName: buyerName,
    buyerId,
    metadata: {
      orderId,
      liveId,
      productId,
      sellerId,
      affiliateId: resolvedAffiliateId,
      commissionRate,
      commissionAmount,
      sellerAmount
    }
  });
  const transactionId = escrowRes.transactionId;
  const orderRecord = {
    orderId,
    transactionId,
    buyerId,
    buyerName,
    buyerPhone,
    sellerId,
    affiliateId: resolvedAffiliateId,
    liveId,
    productId,
    productName,
    totalAmount,
    sellerAmount,
    commissionAmount,
    commissionRate: commissionRate * 100,
    currency,
    paymentStatus: "PENDING",
    splitExecuted: false,
    createdAt: Date.now()
  };
  SEBPAY_ORDERS_REGISTRY.set(transactionId, orderRecord);
  SEBPAY_ORDERS_REGISTRY.set(orderId, orderRecord);
  console.log(
    `[MICRO-RELAIS CHECKOUT] Commande ${orderId} initialis\xE9e pour ${totalAmount} ${currency} (Tx: ${transactionId}) | Split pr\xE9vu: Vendeur ${sellerAmount} / Affili\xE9 ${commissionAmount}`
  );
  return {
    success: true,
    orderId,
    transactionId,
    amount: totalAmount,
    currency,
    paymentUrl: escrowRes.paymentUrl,
    affiliateTracked: Boolean(resolvedAffiliateId),
    affiliateId: resolvedAffiliateId,
    splitPreview: {
      total: totalAmount,
      sellerShare: sellerAmount,
      affiliateCommission: commissionAmount,
      ratePercentage: commissionRate * 100
    }
  };
}
async function handleSebpayPaymentConfirmation(params) {
  const { transactionId } = params;
  const order = SEBPAY_ORDERS_REGISTRY.get(transactionId);
  if (!order) {
    throw new Error(`Commande introuvable pour la transaction Sebpay : ${transactionId}`);
  }
  if (order.splitExecuted) {
    console.log(`[MICRO-RELAIS WEBHOOK] Transaction ${transactionId} d\xE9j\xE0 finalis\xE9e.`);
    return { success: true, message: "Split d\xE9j\xE0 ex\xE9cut\xE9", order };
  }
  await sebpay_client_default.captureEscrowPayment(transactionId, order.totalAmount);
  const auditResult = await executeAcidSplitTransaction({
    transactionId,
    orderId: order.orderId,
    sellerId: order.sellerId,
    sellerAmount: order.sellerAmount,
    affiliateId: order.affiliateId,
    commissionAmount: order.commissionAmount,
    totalAmount: order.totalAmount
  });
  order.paymentStatus = "CONFIRMED";
  order.splitExecuted = true;
  order.confirmedAt = Date.now();
  emitToTarget(order.sellerId, "sale_completed", {
    amount: order.sellerAmount,
    totalAmount: order.totalAmount,
    commission: order.commissionAmount,
    currency: order.currency,
    buyerName: order.buyerName,
    productName: order.productName,
    transactionId: order.transactionId,
    orderId: order.orderId,
    liveId: order.liveId,
    timestamp: Date.now()
  });
  if (order.affiliateId && order.commissionAmount > 0) {
    emitToTarget(order.affiliateId, "commission_earned", {
      amount: order.commissionAmount,
      currency: order.currency,
      totalSaleAmount: order.totalAmount,
      commissionRate: order.commissionRate,
      buyerName: order.buyerName,
      productName: order.productName,
      transactionId: order.transactionId,
      orderId: order.orderId,
      liveId: order.liveId,
      timestamp: Date.now()
    });
    console.log(
      `[MICRO-RELAIS WS] \u{1F389} Signal de commission \xE9mis vers l'affili\xE9 ${order.affiliateId} : +${order.commissionAmount} ${order.currency}`
    );
  }
  if (order.liveId) {
    emitToTarget(order.liveId, "live_order_placed", {
      liveId: order.liveId,
      buyerName: order.buyerName,
      productName: order.productName,
      amount: order.totalAmount,
      hasAffiliate: Boolean(order.affiliateId),
      timestamp: Date.now()
    });
  }
  try {
    emitNewOrderPing({
      orderId: order.orderId,
      orderNumber: `CMD-${order.orderId.substring(order.orderId.length - 4)}`,
      buyerId: order.buyerId,
      buyerName: order.buyerName,
      buyerPhone: order.buyerPhone,
      sellerId: order.sellerId,
      productName: order.productName,
      amount: order.totalAmount,
      deliveryFee: 1e3,
      neighborhood: "Ouaga 2000",
      liveId: order.liveId
    });
  } catch (swarmErr) {
    console.warn("[MICRO-RELAIS] Erreur ping logistique essaim :", swarmErr);
  }
  return {
    success: true,
    orderId: order.orderId,
    transactionId: order.transactionId,
    totalAmount: order.totalAmount,
    sellerCredited: order.sellerAmount,
    affiliateCommission: order.commissionAmount,
    affiliateId: order.affiliateId,
    acidAudit: auditResult
  };
}
function attachMicroRelayRoutes(app2) {
  app2.get("/api/live/join", (req, res) => {
    try {
      const liveId = req.query.liveId || req.query.roomId || "live-default";
      const userId = req.query.userId || req.query.buyerId || `user_${Date.now()}`;
      const socketId = req.query.socketId;
      const ref2 = req.query.ref || req.query.affiliateId || void 0;
      const result = trackLiveAffiliateJoin({
        liveId,
        userId,
        socketId,
        ref: ref2
      });
      return res.status(200).json(result);
    } catch (err) {
      console.error("[ROUTE ERROR /api/live/join]", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.post("/api/checkout/sebpay", async (req, res) => {
    try {
      const {
        buyerId,
        buyerPhone,
        buyerName,
        sellerId,
        liveId,
        productId,
        productName,
        amount,
        currency,
        ref: ref2,
        commissionRate
      } = req.body;
      if (!sellerId || !amount) {
        return res.status(400).json({
          success: false,
          error: "sellerId et amount sont obligatoires."
        });
      }
      const result = await initiateSebpayCheckout({
        buyerId: buyerId || `buyer_${Date.now()}`,
        buyerPhone: buyerPhone || "+22670000000",
        buyerName: buyerName || "Spectateur Wameet",
        sellerId,
        liveId: liveId || "live-default",
        productId: productId || "prod-live-1",
        productName: productName || "Article Live Shopping",
        amount: Number(amount),
        currency: currency || "FCFA",
        ref: ref2,
        commissionRate: commissionRate ? Number(commissionRate) : 0.05
      });
      return res.status(200).json(result);
    } catch (err) {
      console.error("[ROUTE ERROR /api/checkout/sebpay]", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.post(["/api/checkout/sebpay/webhook", "/api/webhooks/sebpay"], async (req, res) => {
    try {
      const transactionId = req.body?.transactionId || req.body?.tx_ref || req.body?.order_id || req.query.transactionId;
      if (!transactionId) {
        return res.status(400).json({
          success: false,
          error: "transactionId est manquant dans le payload du webhook."
        });
      }
      const result = await handleSebpayPaymentConfirmation({
        transactionId,
        receiptNumber: req.body?.receiptNumber,
        status: req.body?.status || "SUCCESS"
      });
      return res.status(200).json(result);
    } catch (err) {
      console.error("[WEBHOOK ERROR /api/checkout/sebpay/webhook]", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.post("/api/micro-relay/simulate-commission", async (req, res) => {
    try {
      const {
        affiliateId = "usr_relay_demo",
        sellerId = "usr_seller_awa",
        buyerName = "Amadou Traor\xE9",
        productName = "Coffret Prestige Karit\xE9 Royal",
        amount = 15e3,
        liveId = "live-shopping-direct"
      } = req.body;
      const checkout = await initiateSebpayCheckout({
        buyerId: `buyer_${Date.now()}`,
        buyerPhone: "+22670112233",
        buyerName,
        sellerId,
        liveId,
        productId: "prod_karite_royal",
        productName,
        amount: Number(amount),
        currency: "FCFA",
        ref: affiliateId,
        commissionRate: 0.05
      });
      const confirmed = await handleSebpayPaymentConfirmation({
        transactionId: checkout.transactionId
      });
      return res.status(200).json({
        success: true,
        message: "Simulation Micro-Relais ex\xE9cut\xE9e avec succ\xE8s !",
        checkout,
        confirmation: confirmed
      });
    } catch (err) {
      console.error("[SIMULATE ERROR]", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.get("/api/micro-relay/audit", (_req, res) => {
    return res.status(200).json({
      success: true,
      totalTransactions: ACID_AUDIT_LOGS.length,
      auditLogs: ACID_AUDIT_LOGS.slice(-50).reverse()
    });
  });
  console.log("\u2705 Routes Micro-Relais & Split Sebpay attach\xE9es sur /api/checkout/sebpay & /api/live/join");
}

// src/server/farotageController.ts
var import_crypto5 = __toESM(require("crypto"), 1);
var FAROTAGE_TRANSACTIONS = /* @__PURE__ */ new Map();
var FAROTAGE_BY_ORDER_ID = /* @__PURE__ */ new Map();
var WALLET_MUTEX_LOCKS = /* @__PURE__ */ new Set();
var SEBPAY_FAROTAGE_SECRET = process.env.SEBPAY_WEBHOOK_SECRET || "wameet_farotage_sebpay_secret_key_2026";
var globalSocketEmitter5 = null;
var GROUP_CONNECTED_SOCKETS = /* @__PURE__ */ new Map();
function setFarotageSocketEmitter(io) {
  globalSocketEmitter5 = io;
}
function registerSocketToFarotageGroup(groupId, socketId) {
  if (!GROUP_CONNECTED_SOCKETS.has(groupId)) {
    GROUP_CONNECTED_SOCKETS.set(groupId, /* @__PURE__ */ new Set());
  }
  GROUP_CONNECTED_SOCKETS.get(groupId).add(socketId);
  console.log(`[FAROTAGE WS] Socket ${socketId} rattach\xE9 au groupe de c\xE9l\xE9bration "${groupId}"`);
}
function unregisterSocketFromFarotageGroup(socketId) {
  for (const [groupId, sockets] of GROUP_CONNECTED_SOCKETS.entries()) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      GROUP_CONNECTED_SOCKETS.delete(groupId);
    }
  }
}
async function acquireWalletLock2(walletId, maxWaitMs = 3e3) {
  const start = Date.now();
  while (WALLET_MUTEX_LOCKS.has(walletId)) {
    if (Date.now() - start > maxWaitMs) {
      throw new Error(`[FAROTAGE ACID TIMEOUT] Impossible d'acqu\xE9rir le verrou pour ${walletId}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 15));
  }
  WALLET_MUTEX_LOCKS.add(walletId);
  return true;
}
function releaseWalletLock2(walletId) {
  WALLET_MUTEX_LOCKS.delete(walletId);
}
function emitFarotageEvent(targetId, event, data) {
  if (!globalSocketEmitter5) {
    console.warn(`[FAROTAGE WS] Aucun \xE9metteur WebSocket actif pour "${event}" vers ${targetId}`);
    return;
  }
  try {
    globalSocketEmitter5.to(targetId).emit(event, data);
  } catch (err) {
    console.warn(`[FAROTAGE WS] Erreur io.to(${targetId}) :`, err);
  }
  const sockets = GROUP_CONNECTED_SOCKETS.get(targetId);
  if (sockets && sockets.size > 0) {
    for (const socketId of sockets) {
      try {
        globalSocketEmitter5.to(socketId).emit(event, data);
      } catch {
      }
    }
  }
}
function verifySebpaySignature(payloadString, signatureHeader) {
  if (!signatureHeader) {
    if (process.env.NODE_ENV !== "production") {
      return true;
    }
    return false;
  }
  try {
    const computedHmac = import_crypto5.default.createHmac("sha256", SEBPAY_FAROTAGE_SECRET).update(payloadString).digest("hex");
    return import_crypto5.default.timingSafeEqual(
      Buffer.from(computedHmac, "utf8"),
      Buffer.from(signatureHeader, "utf8")
    );
  } catch {
    return false;
  }
}
async function initializeFarotage(payload) {
  const {
    groupId,
    senderId,
    senderName,
    senderPhone = "+22670000000",
    recipientId,
    amount,
    currency = "FCFA",
    note = "Vive les mari\xE9s ! \u{1F389}"
  } = payload;
  if (!groupId || !senderId || !recipientId || !amount || amount <= 0) {
    throw {
      status: 400,
      code: "INVALID_FAROTAGE_PAYLOAD",
      message: "groupId, senderId, recipientId et un montant positif sont obligatoires."
    };
  }
  const rawAmount = Math.round(Number(amount));
  const commissionRate = 0.02;
  const wameetFee = Math.round(rawAmount * commissionRate);
  const netAmount = rawAmount - wameetFee;
  const orderId = `farotage_${Date.now()}_${import_crypto5.default.randomBytes(3).toString("hex")}`;
  const escrowRes = await sebpay_client_default.createEscrowPayment({
    amount: rawAmount,
    currency,
    description: `Farotage Digital Wameet : ${senderName}`,
    customerPhone: senderPhone,
    customerName: senderName,
    buyerId: senderId,
    metadata: {
      orderId,
      groupId,
      senderId,
      senderName,
      recipientId,
      wameetFee,
      netAmount,
      note,
      type: "FAROTAGE_DIGITAL"
    }
  });
  const transactionId = escrowRes.transactionId;
  const farotageTx = {
    transactionId,
    orderId,
    groupId,
    senderId,
    senderName,
    senderPhone,
    recipientId,
    amount: rawAmount,
    wameetFee,
    netAmount,
    currency,
    note,
    status: "pending",
    paymentUrl: escrowRes.paymentUrl,
    createdAt: Date.now()
  };
  FAROTAGE_TRANSACTIONS.set(transactionId, farotageTx);
  FAROTAGE_BY_ORDER_ID.set(orderId, transactionId);
  console.log(
    `[FAROTAGE INIT] Transaction ${transactionId} cr\xE9\xE9e (${rawAmount} ${currency}) par "${senderName}" pour les mari\xE9s (${recipientId}) dans le groupe "${groupId}"`
  );
  return {
    success: true,
    transactionId,
    orderId,
    amount: rawAmount,
    netAmount,
    currency,
    paymentUrl: escrowRes.paymentUrl,
    groupId,
    senderName
  };
}
async function handleFarotageWebhook(params) {
  const { transactionId, rawPayload, signature } = params;
  if (rawPayload && signature) {
    const isSignatureValid = verifySebpaySignature(rawPayload, signature);
    if (!isSignatureValid) {
      console.warn(`[FAROTAGE S\xC9CURIT\xC9] \u274C Signature Webhook invalide pour Tx ${transactionId}`);
      throw {
        status: 403,
        code: "INVALID_WEBHOOK_SIGNATURE",
        message: "Signature de s\xE9curit\xE9 Sebpay invalide."
      };
    }
  }
  let tx = FAROTAGE_TRANSACTIONS.get(transactionId);
  if (!tx && FAROTAGE_BY_ORDER_ID.has(transactionId)) {
    const resolvedId = FAROTAGE_BY_ORDER_ID.get(transactionId);
    tx = FAROTAGE_TRANSACTIONS.get(resolvedId);
  }
  if (!tx) {
    throw {
      status: 404,
      code: "TRANSACTION_NOT_FOUND",
      message: `Transaction de Farotage introuvable : ${transactionId}`
    };
  }
  if (tx.status === "completed") {
    console.log(`[FAROTAGE WEBHOOK] Transaction ${tx.transactionId} d\xE9j\xE0 valid\xE9e (Idempotence).`);
    return {
      success: true,
      message: "Farotage d\xE9j\xE0 c\xE9l\xE9br\xE9 avec succ\xE8s.",
      alreadyCompleted: true,
      transaction: tx
    };
  }
  await sebpay_client_default.captureEscrowPayment(tx.transactionId, tx.amount);
  const walletKey = `wallet_${tx.recipientId}`;
  await acquireWalletLock2(walletKey);
  try {
    const walletRes = await sebpay_client_default.creditWameetWallet(
      tx.recipientId,
      tx.netAmount,
      `Farotage Digital de ${tx.senderName} (Tx: ${tx.transactionId})`
    );
    tx.status = "completed";
    tx.completedAt = Date.now();
    console.log(
      `[FAROTAGE ACID COMMIT] \u2705 Wallet des mari\xE9s (${tx.recipientId}) cr\xE9dit\xE9 de +${tx.netAmount} ${tx.currency} (Nouveau solde: ${walletRes.balance} ${tx.currency})`
    );
  } catch (creditErr) {
    console.error(`[FAROTAGE CRITICAL ERROR] \xC9chec du cr\xE9dit des mari\xE9s :`, creditErr);
    throw creditErr;
  } finally {
    releaseWalletLock2(walletKey);
  }
  const celebrationPayload = {
    transactionId: tx.transactionId,
    groupId: tx.groupId,
    senderName: tx.senderName,
    senderId: tx.senderId,
    recipientId: tx.recipientId,
    amount: tx.amount,
    currency: tx.currency,
    netAmount: tx.netAmount,
    note: tx.note,
    timestamp: tx.completedAt || Date.now()
  };
  emitFarotageEvent(tx.groupId, "farotage_success", celebrationPayload);
  console.log(
    `[FAROTAGE EXPLOSION WS] \u{1F4B8} Signal "farotage_success" \xE9mis vers le groupe "${tx.groupId}" : ${tx.senderName} a envoy\xE9 ${tx.amount} ${tx.currency} !`
  );
  return {
    success: true,
    message: "Farotage valid\xE9 et pluie de billets d\xE9clench\xE9e !",
    celebration: celebrationPayload,
    transaction: tx
  };
}
function attachFarotageRoutes(app2) {
  app2.post("/api/farotage/init", async (req, res) => {
    try {
      const result = await initializeFarotage(req.body);
      return res.status(200).json(result);
    } catch (err) {
      console.error("[ROUTE ERROR /api/farotage/init]", err);
      return res.status(err.status || 500).json({
        success: false,
        code: err.code || "FAROTAGE_INIT_ERROR",
        message: err.message || "Erreur lors de l\u2019initialisation du farotage"
      });
    }
  });
  app2.post("/api/farotage/webhook", async (req, res) => {
    try {
      const transactionId = req.body?.transactionId || req.body?.tx_ref || req.body?.order_id || req.query.transactionId;
      if (!transactionId) {
        return res.status(400).json({
          success: false,
          code: "MISSING_TX_ID",
          message: "transactionId est manquant dans le payload."
        });
      }
      const signature = req.headers["x-sebpay-signature"] || req.headers["x-signature"];
      const rawPayload = JSON.stringify(req.body);
      const result = await handleFarotageWebhook({
        transactionId,
        receiptNumber: req.body?.receiptNumber,
        status: req.body?.status || "SUCCESS",
        rawPayload,
        signature
      });
      return res.status(200).json(result);
    } catch (err) {
      console.error("[ROUTE ERROR /api/farotage/webhook]", err);
      return res.status(err.status || 500).json({
        success: false,
        code: err.code || "FAROTAGE_WEBHOOK_ERROR",
        message: err.message || "Erreur lors du traitement du webhook"
      });
    }
  });
  app2.get("/api/farotage/transactions", (req, res) => {
    const groupId = req.query.groupId;
    let list = Array.from(FAROTAGE_TRANSACTIONS.values());
    if (groupId) {
      list = list.filter((t) => t.groupId === groupId);
    }
    const completedList = list.filter((t) => t.status === "completed");
    const totalCollected = completedList.reduce((sum, t) => sum + t.amount, 0);
    const netTotal = completedList.reduce((sum, t) => sum + t.netAmount, 0);
    return res.status(200).json({
      success: true,
      totalCount: completedList.length,
      totalCollected,
      netTotal,
      currency: "FCFA",
      transactions: completedList.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
    });
  });
  app2.post("/api/farotage/simulate", async (req, res) => {
    try {
      const {
        groupId = "mariage_awa_moussa_2026",
        senderName = "Tonton Boureima",
        senderId = `guest_${Date.now()}`,
        recipientId = "wallet_maries_2026",
        amount = 1e4,
        note = "F\xE9licitations et longue vie d\u2019amour aux mari\xE9s ! \u{1F48D}\u{1F389}"
      } = req.body;
      const initResult = await initializeFarotage({
        groupId,
        senderId,
        senderName,
        recipientId,
        amount: Number(amount),
        currency: "FCFA",
        note
      });
      const confirmResult = await handleFarotageWebhook({
        transactionId: initResult.transactionId
      });
      return res.status(200).json({
        success: true,
        message: "Simulation Farotage Digital ex\xE9cut\xE9e avec succ\xE8s !",
        init: initResult,
        confirmation: confirmResult
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  console.log("\u2705 Routes Farotage Digital attach\xE9es sur /api/farotage/init & /api/farotage/webhook");
}

// src/server/cagnotteController.ts
var import_crypto6 = __toESM(require("crypto"), 1);

// src/types/cagnotte.ts
var NANA_POS_GIFT_CATALOG = [
  {
    id: "gift_iphone_15_pro_max",
    name: "Apple iPhone 15 Pro Max (256 Go Titane Naturel)",
    category: "High-Tech & Smartphone",
    price: 65e4,
    currency: "FCFA",
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80",
    description: '\xC9cran Super Retina XDR 6.7", Puce A17 Pro, Cam\xE9ra 48 MP avec Zoom Optique 5x, Ch\xE2ssis en Titane ultra-l\xE9ger.',
    stock: 4,
    merchantId: "merchant_istore_ouaga_2000",
    merchantName: "iStore Ouaga 2000 (Revendeur Agr\xE9\xE9 Apple)",
    merchantLocation: "Avenue Pascal Zagre, Ouaga 2000, Ouagadougou",
    merchantPhone: "+226 25 37 40 40",
    merchantWalletId: "wallet_istore_ouaga_2000",
    estimatedDeliveryMinutes: 45,
    badge: "\u{1F451} Best-Seller Anniversaire"
  },
  {
    id: "gift_billet_avion_abidjan",
    name: "Billet d\u2019Avion A/R Air Burkina (Ouaga - Abidjan)",
    category: "Voyages & Exp\xE9riences",
    price: 285e3,
    currency: "FCFA",
    imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80",
    description: "Vol direct Aller/Retour Ouagadougou - Abidjan F\xE9lix-Houphou\xEBt-Boigny, bagage en soute 2x23kg inclus, dates modifiables.",
    stock: 10,
    merchantId: "merchant_sahel_voyages",
    merchantName: "Agence Sahel Voyages & Billetterie",
    merchantLocation: "Boulevard Charles de Gaulle, Ouagadougou",
    merchantPhone: "+226 25 31 12 12",
    merchantWalletId: "wallet_sahel_voyages",
    estimatedDeliveryMinutes: 30,
    badge: "\u2708\uFE0F Billet \xC9lectronique Instantan\xE9"
  },
  {
    id: "gift_coffret_parfum_luxe",
    name: "Coffret Parfumerie & Soins de Luxe Paris-Abidjan",
    category: "Beaut\xE9 & Bien-\xEAtre",
    price: 85e3,
    currency: "FCFA",
    imageUrl: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600&auto=format&fit=crop&q=80",
    description: "Eau de Parfum Niche 100ml, cr\xE8me hydratante soyeuse au Karit\xE9 enrichi et bougie parfum\xE9e signature.",
    stock: 8,
    merchantId: "merchant_sublime_cosmetique",
    merchantName: "Boutique Sublime Cosm\xE9tique",
    merchantLocation: "Centre Commercial NaNa Mall, Niveau 1",
    merchantPhone: "+226 70 88 99 00",
    merchantWalletId: "wallet_sublime_cosmetique",
    estimatedDeliveryMinutes: 35,
    badge: "\u2728 Emballage Cadeau Luxe Offert"
  },
  {
    id: "gift_ps5_slim_bundle",
    name: "Console Sony PlayStation 5 Slim + 2 Manettes DualSense",
    category: "Gaming & High-Tech",
    price: 42e4,
    currency: "FCFA",
    imageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80",
    description: "\xC9dition standard avec lecteur de disque, 1 To SSD, 2 manettes sans fil DualSense et le jeu EA Sports FC 25 inclus.",
    stock: 3,
    merchantId: "merchant_gaming_world",
    merchantName: "Gaming World Ouaga",
    merchantLocation: "Quartier Koulouba, Rue du Commerce",
    merchantPhone: "+226 76 54 32 10",
    merchantWalletId: "wallet_gaming_world",
    estimatedDeliveryMinutes: 40,
    badge: "\u{1F3AE} Pack Gamer VIP"
  },
  {
    id: "gift_apple_watch_9",
    name: "Apple Watch Series 9 GPS 45mm Bo\xEEtier Minuit",
    category: "High-Tech & Montres",
    price: 22e4,
    currency: "FCFA",
    imageUrl: "https://images.unsplash.com/photo-1509741102003-ca64bfe5f069?w=600&auto=format&fit=crop&q=80",
    description: "Puce S9 SiP, geste Double Toucher, capteur d\u2019oxyg\xE8ne sanguin, ECG et \xE9cran Retina lumineux jusqu\u2019\xE0 2 000 nits.",
    stock: 6,
    merchantId: "merchant_techzone_abidjan",
    merchantName: "TechZone NaNa Mall",
    merchantLocation: "Zone Commerciale Kamsonghin, Ouagadougou",
    merchantPhone: "+226 25 41 80 80",
    merchantWalletId: "wallet_techzone_abidjan",
    estimatedDeliveryMinutes: 45,
    badge: "\u231A Sant\xE9 & \xC9l\xE9gance"
  },
  {
    id: "gift_samsung_tv_55",
    name: 'Smart TV 55" Crystal UHD 4K Samsung',
    category: "\xC9lectrom\xE9nager & Maison",
    price: 31e4,
    currency: "FCFA",
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80",
    description: "R\xE9solution 4K UHD 3840x2160, HDR 10+, Processeur Crystal 4K, Smart Hub Tizen avec Netflix et YouTube int\xE9gr\xE9s.",
    stock: 5,
    merchantId: "merchant_electro_plus",
    merchantName: "\xC9lectro-Plus Ouaga",
    merchantLocation: "Avenue de la Nation, Secteur 4",
    merchantPhone: "+226 25 30 65 65",
    merchantWalletId: "wallet_electro_plus",
    estimatedDeliveryMinutes: 60,
    badge: "\u{1F4FA} Cin\xE9ma \xE0 la Maison"
  }
];

// src/server/cagnotteController.ts
var SEBPAY_WEBHOOK_SECRET = process.env.SEBPAY_WEBHOOK_SECRET || "wameet_cagnotte_sebpay_secret_key_2026";
function verifySebpaySignature2(payloadString, signatureHeader) {
  if (!signatureHeader) {
    if (process.env.NODE_ENV !== "production") return true;
    return false;
  }
  try {
    const computedHmac = import_crypto6.default.createHmac("sha256", SEBPAY_WEBHOOK_SECRET).update(payloadString).digest("hex");
    return import_crypto6.default.timingSafeEqual(
      Buffer.from(computedHmac, "utf8"),
      Buffer.from(signatureHeader, "utf8")
    );
  } catch {
    return false;
  }
}
var CAGNOTTE_REGISTRY = /* @__PURE__ */ new Map();
var GROUP_TO_CAGNOTTE_MAP = /* @__PURE__ */ new Map();
var CAGNOTTE_MUTEX_LOCKS = /* @__PURE__ */ new Set();
var cagnotteSocketEmitter = null;
var GROUP_CONNECTED_SOCKETS2 = /* @__PURE__ */ new Map();
function setCagnotteSocketEmitter(io) {
  cagnotteSocketEmitter = io;
}
function registerSocketToCagnotteGroup(groupId, socketId) {
  if (!GROUP_CONNECTED_SOCKETS2.has(groupId)) {
    GROUP_CONNECTED_SOCKETS2.set(groupId, /* @__PURE__ */ new Set());
  }
  GROUP_CONNECTED_SOCKETS2.get(groupId).add(socketId);
  console.log(`[CAGNOTTE WS] Socket ${socketId} abonn\xE9 \xE0 la cagnotte du groupe "${groupId}"`);
}
function unregisterSocketFromCagnotteGroup(socketId) {
  for (const [groupId, sockets] of GROUP_CONNECTED_SOCKETS2.entries()) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      GROUP_CONNECTED_SOCKETS2.delete(groupId);
    }
  }
}
function broadcastCagnotteEvent(groupId, event, data) {
  if (!cagnotteSocketEmitter) {
    console.warn(`[CAGNOTTE WS] Aucun \xE9metteur actif pour "${event}" vers ${groupId}`);
    return;
  }
  try {
    cagnotteSocketEmitter.to(groupId).emit(event, data);
  } catch (e) {
    console.warn(`[CAGNOTTE WS] Erreur to(${groupId}) :`, e);
  }
  const sockets = GROUP_CONNECTED_SOCKETS2.get(groupId);
  if (sockets && sockets.size > 0) {
    for (const sid of sockets) {
      try {
        cagnotteSocketEmitter.to(sid).emit(event, data);
      } catch {
      }
    }
  }
}
async function acquireCagnotteLock(cagnotteId, maxWaitMs = 4e3) {
  const start = Date.now();
  while (CAGNOTTE_MUTEX_LOCKS.has(cagnotteId)) {
    if (Date.now() - start > maxWaitMs) {
      throw new Error(`[CAGNOTTE MUTEX TIMEOUT] Impossible d'acqu\xE9rir le verrou pour ${cagnotteId}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  CAGNOTTE_MUTEX_LOCKS.add(cagnotteId);
  return true;
}
function releaseCagnotteLock(cagnotteId) {
  CAGNOTTE_MUTEX_LOCKS.delete(cagnotteId);
}
function seedInitialSarahBirthdayCagnotte() {
  const cagnotteId = "cagnotte_anniv_sarah_2026";
  const groupId = "group_anniv_sarah";
  const gift = NANA_POS_GIFT_CATALOG[0];
  const initialContributions = [
    {
      id: "contrib_1",
      cagnotteId,
      contributorId: "user_moussa_01",
      contributorName: "Moussa Traor\xE9 (Organisateur)",
      contributorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      amount: 1e5,
      currency: "FCFA",
      note: "Pour la reine de la f\xEAte ! On t\u2019aime Sarah \u{1F451}\u2764\uFE0F",
      paymentMethod: "ORANGE_MONEY",
      status: "completed",
      transactionId: "seb_c_100k_moussa",
      timestamp: Date.now() - 36e5 * 18
    },
    {
      id: "contrib_2",
      cagnotteId,
      contributorId: "user_fatou_02",
      contributorName: "Fatou K.",
      contributorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      amount: 75e3,
      currency: "FCFA",
      note: "Joyeux anniversaire ma s\u0153ur ch\xE9rie ! \u{1F382}\u{1F942}",
      paymentMethod: "WAVE",
      status: "completed",
      transactionId: "seb_c_75k_fatou",
      timestamp: Date.now() - 36e5 * 14
    },
    {
      id: "contrib_3",
      cagnotteId,
      contributorId: "user_awa_03",
      contributorName: "Awa Ouedraogo",
      contributorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
      amount: 5e4,
      currency: "FCFA",
      note: "Que du bonheur et du succ\xE8s ! Plein de bisous \u{1F495}",
      paymentMethod: "MOOV",
      status: "completed",
      transactionId: "seb_c_50k_awa",
      timestamp: Date.now() - 36e5 * 9
    },
    {
      id: "contrib_4",
      cagnotteId,
      contributorId: "user_boureima_04",
      contributorName: "Tonton Boureima",
      contributorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      amount: 1e5,
      currency: "FCFA",
      note: "F\xE9licitations ma fille, que Dieu te garde ! \u{1F64F}\u{1F3FD}\u2728",
      paymentMethod: "ORANGE_MONEY",
      status: "completed",
      transactionId: "seb_c_100k_boureima",
      timestamp: Date.now() - 36e5 * 5
    },
    {
      id: "contrib_5",
      cagnotteId,
      contributorId: "user_aminata_05",
      contributorName: "Aminata Diallo",
      contributorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      amount: 4e4,
      currency: "FCFA",
      note: "H\xE2te de te voir samedi soir pour souffler les bougies ! \u{1F389}",
      paymentMethod: "WAVE",
      status: "completed",
      transactionId: "seb_c_40k_aminata",
      timestamp: Date.now() - 36e5 * 3
    },
    {
      id: "contrib_6",
      cagnotteId,
      contributorId: "user_ibrahim_06",
      contributorName: "Ibrahim Sangar\xE9",
      contributorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      amount: 35e3,
      currency: "FCFA",
      note: "Super initiative cette cagnotte automatique ! Joyeux anniv ! \u{1F4F1}\u{1F525}",
      paymentMethod: "WAMEET_WALLET",
      status: "completed",
      transactionId: "seb_c_35k_ibrahim",
      timestamp: Date.now() - 36e5 * 1
    },
    {
      id: "contrib_7",
      cagnotteId,
      contributorId: "user_mariam_07",
      contributorName: "Mariam K.",
      contributorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      amount: 25e3,
      currency: "FCFA",
      note: "Petite contribution pour le grand cadeau ! Vive Sarah \u{1F496}",
      paymentMethod: "MTN",
      status: "completed",
      transactionId: "seb_c_25k_mariam",
      timestamp: Date.now() - 18e5
    }
  ];
  const totalCollected = initialContributions.reduce((sum, c) => sum + c.amount, 0);
  const progressPercentage = Math.round(totalCollected / gift.price * 100);
  const state = {
    id: cagnotteId,
    groupId,
    groupName: "Anniversaire de Sarah \u{1F382}",
    beneficiaryName: "Sarah Kabor\xE9",
    beneficiaryAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    creatorId: "user_moussa_01",
    creatorName: "Moussa Traor\xE9",
    gift,
    targetAmount: gift.price,
    // 650 000 FCFA
    collectedAmount: totalCollected,
    // 425 000 FCFA
    progressPercentage,
    contributionsCount: initialContributions.length,
    contributions: initialContributions,
    status: "active",
    eventDate: "Samedi 24 Octobre \xE0 19h30",
    eventLocation: "Villa 42, Rue des Ambassades, Ouaga 2000",
    smartContract: {
      isExecuted: false,
      deliveryStatus: "pending",
      deliverySlot: "Samedi 24 Octobre \xE0 19h30 (Heure de la f\xEAte)",
      deliveryAddress: "Villa 42, Rue des Ambassades, Ouaga 2000",
      deliveryPinCode: "7842",
      terms: "R\xE8glement 100% direct au marchand NaNa POS iStore Ouaga 2000 d\xE8s atteinte des 650 000 FCFA. Fonds s\xE9questr\xE9s par contrat intelligent Sebpay. 0 FCFA per\xE7u par un particulier."
    },
    createdAt: Date.now() - 864e5,
    updatedAt: Date.now()
  };
  CAGNOTTE_REGISTRY.set(cagnotteId, state);
  GROUP_TO_CAGNOTTE_MAP.set(groupId, cagnotteId);
  return state;
}
seedInitialSarahBirthdayCagnotte();
async function createCagnotte(payload) {
  const {
    groupId,
    groupName,
    beneficiaryName,
    beneficiaryAvatar,
    creatorId,
    creatorName,
    giftId,
    eventDate,
    eventLocation
  } = payload;
  const gift = NANA_POS_GIFT_CATALOG.find((g) => g.id === giftId);
  if (!gift) {
    throw { status: 400, message: `Cadeau NaNa POS introuvable pour l'id: ${giftId}` };
  }
  const cagnotteId = `cagnotte_${Date.now()}_${import_crypto6.default.randomBytes(3).toString("hex")}`;
  const deliveryPinCode = Math.floor(1e3 + Math.random() * 9e3).toString();
  const state = {
    id: cagnotteId,
    groupId,
    groupName: groupName || `Cagnotte ${beneficiaryName}`,
    beneficiaryName,
    beneficiaryAvatar,
    creatorId,
    creatorName,
    gift,
    targetAmount: gift.price,
    collectedAmount: 0,
    progressPercentage: 0,
    contributionsCount: 0,
    contributions: [],
    status: "active",
    eventDate: eventDate || "Date de f\xEAte \xE0 confirmer",
    eventLocation: eventLocation || "Lieu \xE0 confirmer",
    smartContract: {
      isExecuted: false,
      deliveryStatus: "pending",
      deliverySlot: `${eventDate} (Heure de la f\xEAte)`,
      deliveryAddress: eventLocation,
      deliveryPinCode,
      terms: `R\xE8glement direct de ${gift.price} FCFA vers le marchand NaNa POS ${gift.merchantName} d\xE8s atteinte de 100%. S\xE9curit\xE9 Escrow tripartite sans interm\xE9diaire individuel.`
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  CAGNOTTE_REGISTRY.set(cagnotteId, state);
  GROUP_TO_CAGNOTTE_MAP.set(groupId, cagnotteId);
  broadcastCagnotteEvent(groupId, "cagnotte_created", state);
  return state;
}
function getCagnotteByGroup(groupId) {
  const cagnotteId = GROUP_TO_CAGNOTTE_MAP.get(groupId);
  if (!cagnotteId) {
    return null;
  }
  return CAGNOTTE_REGISTRY.get(cagnotteId) || null;
}
async function initiateContribution(payload) {
  const {
    cagnotteId,
    contributorId,
    contributorName,
    contributorPhone = "+22670000000",
    contributorAvatar,
    amount,
    paymentMethod = "ORANGE_MONEY",
    note = "Joyeux anniversaire ! \u{1F389}"
  } = payload;
  const cagnotte = CAGNOTTE_REGISTRY.get(cagnotteId);
  if (!cagnotte) {
    throw { status: 404, message: `Cagnotte introuvable : ${cagnotteId}` };
  }
  if (cagnotte.status === "funded" || cagnotte.smartContract.isExecuted) {
    throw {
      status: 400,
      code: "CAGNOTTE_ALREADY_FUNDED",
      message: "La cagnotte est d\xE9j\xE0 financ\xE9e \xE0 100% ! Le cadeau est d\xE9j\xE0 command\xE9 chez le marchand."
    };
  }
  const cleanAmount = Math.max(1e3, Math.round(Number(amount)));
  const escrowRes = await sebpay_client_default.createEscrowPayment({
    amount: cleanAmount,
    currency: "FCFA",
    description: `Contribution Cagnotte Wameet : ${cagnotte.beneficiaryName} par ${contributorName}`,
    customerPhone: contributorPhone,
    customerName: contributorName,
    buyerId: contributorId,
    metadata: {
      type: "CAGNOTTE_PHYGITALE",
      cagnotteId,
      groupId: cagnotte.groupId,
      contributorId,
      contributorName,
      contributorAvatar,
      paymentMethod,
      note
    }
  });
  return {
    success: true,
    transactionId: escrowRes.transactionId,
    paymentUrl: escrowRes.paymentUrl,
    amount: cleanAmount,
    cagnotteId,
    groupId: cagnotte.groupId
  };
}
async function processContributionValidation(params) {
  const {
    cagnotteId,
    contributorId,
    contributorName,
    contributorPhone,
    contributorAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    amount,
    paymentMethod = "ORANGE_MONEY",
    note = "Joyeux anniversaire ! \u{1F381}",
    transactionId = `seb_tx_${Date.now()}_${import_crypto6.default.randomBytes(3).toString("hex")}`
  } = params;
  await acquireCagnotteLock(cagnotteId);
  try {
    const cagnotte = CAGNOTTE_REGISTRY.get(cagnotteId);
    if (!cagnotte) {
      throw { status: 404, message: `Cagnotte introuvable : ${cagnotteId}` };
    }
    try {
      await sebpay_client_default.captureEscrowPayment(transactionId, amount);
    } catch {
    }
    const newContrib = {
      id: `contrib_${Date.now()}_${import_crypto6.default.randomBytes(2).toString("hex")}`,
      cagnotteId,
      contributorId,
      contributorName,
      contributorPhone,
      contributorAvatar,
      amount,
      currency: "FCFA",
      note,
      paymentMethod,
      status: "completed",
      transactionId,
      timestamp: Date.now()
    };
    cagnotte.contributions.unshift(newContrib);
    cagnotte.contributionsCount = cagnotte.contributions.length;
    cagnotte.collectedAmount += amount;
    cagnotte.progressPercentage = Math.min(
      100,
      Math.round(cagnotte.collectedAmount / cagnotte.targetAmount * 100)
    );
    cagnotte.updatedAt = Date.now();
    console.log(
      `[CAGNOTTE PROGRESS] +${amount} FCFA par ${contributorName} ! Nouveau cumul: ${cagnotte.collectedAmount} / ${cagnotte.targetAmount} FCFA (${cagnotte.progressPercentage}%)`
    );
    broadcastCagnotteEvent(cagnotte.groupId, "cagnotte_contribution_added", {
      cagnotteId,
      contribution: newContrib,
      collectedAmount: cagnotte.collectedAmount,
      targetAmount: cagnotte.targetAmount,
      progressPercentage: cagnotte.progressPercentage
    });
    let smartContractTriggered = false;
    if (cagnotte.collectedAmount >= cagnotte.targetAmount && !cagnotte.smartContract.isExecuted) {
      smartContractTriggered = true;
      cagnotte.status = "completed";
      cagnotte.progressPercentage = 100;
      let posOrderId = `CMD-POS-AUTO-${Date.now().toString().slice(-6)}`;
      try {
        const port = process.env.PORT || 3e3;
        const autoOrderUrl = `http://127.0.0.1:${port}/api/pos/auto-order`;
        const autoOrderResponse = await fetch(autoOrderUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${POS_SYNC_M2M_TOKEN}`,
            "x-m2m-token": POS_SYNC_M2M_TOKEN
          },
          body: JSON.stringify({
            productId: cagnotte.gift.id,
            productName: cagnotte.gift.name,
            orderAmount: cagnotte.targetAmount,
            cagnotteId: cagnotte.id,
            recipientName: cagnotte.beneficiaryName,
            deliverySlot: cagnotte.smartContract.deliverySlot,
            deliveryAddress: cagnotte.smartContract.deliveryAddress,
            merchantWalletId: cagnotte.gift.merchantWalletId
          })
        });
        if (autoOrderResponse.ok) {
          const posData = await autoOrderResponse.json();
          if (posData?.orderId) {
            posOrderId = posData.orderId;
            console.log(`[CAGNOTTE SMART CONTRACT] \u2705 Bon de commande NaNa POS g\xE9n\xE9r\xE9 avec succ\xE8s : ${posOrderId}`);
          }
        }
      } catch (httpErr) {
        console.warn(`[CAGNOTTE SMART CONTRACT] Appel HTTP /api/pos/auto-order en fallback local (${httpErr.message})`);
      }
      const payoutId = `payout_pos_${Date.now()}_${import_crypto6.default.randomBytes(4).toString("hex")}`;
      const merchantWalletResult = await sebpay_client_default.creditWameetWallet(
        cagnotte.gift.merchantWalletId,
        cagnotte.targetAmount,
        `Paiement Contrat Intelligent Cagnotte : Achat ${cagnotte.gift.name} pour ${cagnotte.beneficiaryName}`
      );
      cagnotte.smartContract = {
        isExecuted: true,
        executedAt: Date.now(),
        merchantPayoutId: payoutId,
        merchantWalletCredited: cagnotte.targetAmount,
        posOrderId,
        deliveryStatus: "preparing",
        deliverySlot: cagnotte.smartContract.deliverySlot,
        deliveryAddress: cagnotte.smartContract.deliveryAddress,
        deliveryPinCode: cagnotte.smartContract.deliveryPinCode,
        terms: cagnotte.smartContract.terms
      };
      console.log(
        `[SMART CONTRACT EXECUTED] \u{1F680} 100% ATTEINT ! Versement automatique de ${cagnotte.targetAmount} FCFA effectu\xE9 directement au marchand NaNa POS "${cagnotte.gift.merchantName}" (Wallet: ${cagnotte.gift.merchantWalletId}, Nouveau solde: ${merchantWalletResult.balance} FCFA). Commande POS ${posOrderId} g\xE9n\xE9r\xE9e pour livraison \xE0 l'heure de la f\xEAte !`
      );
      const smartTransactionBubble = {
        id: `bubble_${Date.now()}_${import_crypto6.default.randomBytes(2).toString("hex")}`,
        groupId: cagnotte.groupId,
        type: "smart_transaction_bubble",
        senderName: "Smart Contract Wameet x NaNa POS",
        text: "\u{1F389} Incroyable ! La cagnotte est pleine, le cadeau est en cours de pr\xE9paration par la boutique !",
        cagnotteId: cagnotte.id,
        giftName: cagnotte.gift.name,
        targetAmount: cagnotte.targetAmount,
        posOrderId,
        deliverySlot: cagnotte.smartContract.deliverySlot,
        deliveryPinCode: cagnotte.smartContract.deliveryPinCode,
        timestamp: Date.now()
      };
      broadcastCagnotteEvent(cagnotte.groupId, "smart_transaction_bubble", smartTransactionBubble);
      broadcastCagnotteEvent(cagnotte.groupId, "chat_message", smartTransactionBubble);
      broadcastCagnotteEvent(cagnotte.groupId, "cagnotte_completed", {
        cagnotteId: cagnotte.id,
        groupId: cagnotte.groupId,
        groupName: cagnotte.groupName,
        beneficiaryName: cagnotte.beneficiaryName,
        gift: cagnotte.gift,
        targetAmount: cagnotte.targetAmount,
        collectedAmount: cagnotte.collectedAmount,
        merchantName: cagnotte.gift.merchantName,
        merchantWalletId: cagnotte.gift.merchantWalletId,
        posOrderId,
        deliverySlot: cagnotte.smartContract.deliverySlot,
        deliveryAddress: cagnotte.smartContract.deliveryAddress,
        deliveryPinCode: cagnotte.smartContract.deliveryPinCode,
        executedAt: cagnotte.smartContract.executedAt,
        contributionsCount: cagnotte.contributionsCount
      });
    }
    broadcastCagnotteEvent(cagnotte.groupId, "cagnotte_updated", cagnotte.collectedAmount);
    broadcastCagnotteEvent(cagnotte.groupId, "cagnotte_state", cagnotte);
    return {
      success: true,
      cagnotte,
      contribution: newContrib,
      smartContractTriggered
    };
  } finally {
    releaseCagnotteLock(cagnotteId);
  }
}
function attachCagnotteRoutes(app2) {
  app2.get("/api/cagnotte/catalog", (_req, res) => {
    return res.status(200).json({
      success: true,
      catalog: NANA_POS_GIFT_CATALOG
    });
  });
  app2.post("/api/cagnotte/create", async (req, res) => {
    try {
      const state = await createCagnotte(req.body);
      return res.status(201).json({ success: true, cagnotte: state });
    } catch (err) {
      console.error("[ROUTE ERROR /api/cagnotte/create]", err);
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  });
  app2.get("/api/cagnotte/group/:groupId", (req, res) => {
    const { groupId } = req.params;
    const cagnotte = getCagnotteByGroup(groupId);
    if (!cagnotte) {
      return res.status(404).json({
        success: false,
        message: `Aucune cagnotte active pour le groupe : ${groupId}`
      });
    }
    return res.status(200).json({ success: true, cagnotte });
  });
  app2.post("/api/cagnotte/contribute", async (req, res) => {
    try {
      const result = await initiateContribution(req.body);
      return res.status(200).json(result);
    } catch (err) {
      console.error("[ROUTE ERROR /api/cagnotte/contribute]", err);
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  });
  app2.post("/api/cagnotte/webhook", async (req, res) => {
    try {
      const signature = req.headers["x-sebpay-signature"] || req.headers["x-signature"];
      const rawPayload = JSON.stringify(req.body);
      if (signature && !verifySebpaySignature2(rawPayload, signature)) {
        console.warn("[CAGNOTTE SECURITY] \u274C Signature Webhook invalide");
        return res.status(403).json({ success: false, error: "Signature Sebpay invalide" });
      }
      const {
        cagnotteId,
        groupId,
        contributorId,
        contributorName,
        amount,
        metadata,
        transactionId
      } = req.body;
      const targetCagnotteId = cagnotteId || metadata?.cagnotteId || (groupId ? GROUP_TO_CAGNOTTE_MAP.get(groupId) : void 0) || (metadata?.groupId ? GROUP_TO_CAGNOTTE_MAP.get(metadata.groupId) : void 0) || "cagnotte_anniv_sarah_2026";
      const targetAmount = Number(amount || metadata?.amount || req.body?.total_amount);
      if (!targetCagnotteId || !targetAmount || targetAmount <= 0) {
        return res.status(400).json({ success: false, message: "Donn\xE9es de cagnotte incompl\xE8tes ou montant invalide." });
      }
      const result = await processContributionValidation({
        cagnotteId: targetCagnotteId,
        contributorId: contributorId || metadata?.contributorId || `guest_${Date.now()}`,
        contributorName: contributorName || metadata?.contributorName || "Ami Wameet",
        contributorAvatar: metadata?.contributorAvatar,
        contributorPhone: req.body.customerPhone || metadata?.customerPhone,
        amount: targetAmount,
        paymentMethod: metadata?.paymentMethod || "ORANGE_MONEY",
        note: metadata?.note,
        transactionId: transactionId || req.body.order_id || req.body.tx_ref
      });
      return res.status(200).json(result);
    } catch (err) {
      console.error("[ROUTE ERROR /api/cagnotte/webhook]", err);
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  });
  app2.post("/api/cagnotte/simulate-contribution", async (req, res) => {
    try {
      const {
        cagnotteId = "cagnotte_anniv_sarah_2026",
        contributorName = "Ali Badra (Ami proche)",
        amount = 25e3,
        note = "On t\u2019aime fort Sarah, profite \xE0 fond de ton iPhone 15 ! \u{1F389}\u{1F4F1}",
        autoCompleteTo100 = false
      } = req.body;
      const cagnotte = CAGNOTTE_REGISTRY.get(cagnotteId);
      if (!cagnotte) {
        return res.status(404).json({ success: false, message: "Cagnotte non trouv\xE9e" });
      }
      let contributionAmount = Number(amount);
      if (autoCompleteTo100) {
        const remaining = Math.max(0, cagnotte.targetAmount - cagnotte.collectedAmount);
        contributionAmount = remaining > 0 ? remaining : 1e4;
      }
      const result = await processContributionValidation({
        cagnotteId,
        contributorId: `sim_user_${Date.now()}`,
        contributorName,
        amount: contributionAmount,
        note,
        paymentMethod: "ORANGE_MONEY"
      });
      return res.status(200).json({
        success: true,
        message: result.smartContractTriggered ? "\u{1F3AF} 100% Atteint ! Le Contrat Intelligent a r\xE9gl\xE9 le commer\xE7ant NaNa POS directement !" : `Contribution de ${contributionAmount} FCFA ajout\xE9e avec succ\xE8s !`,
        ...result
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });
  app2.post("/api/cagnotte/reset-demo", (_req, res) => {
    const state = seedInitialSarahBirthdayCagnotte();
    broadcastCagnotteEvent(state.groupId, "cagnotte_updated", state);
    return res.status(200).json({
      success: true,
      message: "D\xE9mo Anniversaire de Sarah r\xE9initialis\xE9e \xE0 425 000 FCFA (65%).",
      cagnotte: state
    });
  });
  console.log("\u2705 Routes Cagnotte Phygitale attach\xE9es sur /api/cagnotte/*");
}

// src/server/discoverySearchController.ts
var USER_SEARCH_HISTORY_DB = /* @__PURE__ */ new Map();
USER_SEARCH_HISTORY_DB.set("usr_default", [
  { id: "h-1", userId: "usr_default", query: "Chaussures Ouaga", searchedAt: Date.now() - 1e3 * 60 * 15, count: 4 },
  { id: "h-2", userId: "usr_default", query: "Concert Live", searchedAt: Date.now() - 1e3 * 60 * 60, count: 3 },
  { id: "h-3", userId: "usr_default", query: "G\xE2teau d'anniversaire NaNa POS", searchedAt: Date.now() - 1e3 * 3600 * 3, count: 2 },
  { id: "h-4", userId: "usr_default", query: "Masterclass Vente 1-Clic", searchedAt: Date.now() - 1e3 * 3600 * 12, count: 1 }
]);
var WAMEET_USERS_TABLE = [
  {
    id: "u-awa",
    name: "Awa Ou\xE9draogo",
    username: "awa.empire.bf",
    handle: "@awa.empire.bf",
    avatarUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&auto=format&fit=crop&q=80",
    verified: true,
    followersCount: 184500,
    likesCount: 12e5,
    salesCount: 4280,
    isLiveNow: true,
    bio: "Boutique officielle Chaussures & Sacs en cuir \xE0 Ouagadougou et Abidjan. Livraison physique express NaNa POS.",
    category: "Mode & E-Commerce",
    createdAtTimestamp: Date.now() - 180 * 86400 * 1e3
  },
  {
    id: "u-idriss",
    name: "Dr. Idriss Kabor\xE9",
    username: "idriss.academie",
    handle: "@idriss.academie",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    verified: true,
    followersCount: 31e4,
    likesCount: 24e5,
    salesCount: 8920,
    isLiveNow: false,
    bio: "Fondateur Acad\xE9mie Wameet. Sp\xE9cialiste du Tunnel 12 Blocs et de la mon\xE9tisation WhatsApp.",
    category: "Formation & Tech",
    createdAtTimestamp: Date.now() - 365 * 86400 * 1e3
  },
  {
    id: "u-ibrahim",
    name: "Ibrahim Konat\xE9",
    username: "ibrahim",
    handle: "@ibrahim",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    verified: true,
    followersCount: 92400,
    likesCount: 89e4,
    salesCount: 1420,
    isLiveNow: true,
    bio: "Artiste Wameet, live concerts acoustiques et exp\xE9dition de cadeaux myst\xE8res physiques \xE0 domicile.",
    category: "Musique & Show",
    createdAtTimestamp: Date.now() - 90 * 86400 * 1e3
  },
  {
    id: "u-clarisse",
    name: "Clarisse Zongo",
    username: "clarisse.coach",
    handle: "@clarisse.coach",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    verified: false,
    followersCount: 45200,
    likesCount: 34e4,
    salesCount: 890,
    isLiveNow: false,
    bio: "Coach bien-\xEAtre et business du soir. Retrouvons-nous chaque soir apr\xE8s le boulot.",
    category: "Coaching",
    createdAtTimestamp: Date.now() - 60 * 86400 * 1e3
  }
];
var USERNAME_EXACT_INDEX = /* @__PURE__ */ new Map();
for (const user of WAMEET_USERS_TABLE) {
  USERNAME_EXACT_INDEX.set(user.username.toLowerCase(), user);
  USERNAME_EXACT_INDEX.set(user.handle.toLowerCase().replace(/^@/, ""), user);
}
var WAMEET_VIDEOS_TABLE = [
  {
    id: "vid-1",
    title: "Arrivage Chaussures Cuir V\xE9ritable Ouaga \u2022 Prix de gros direct",
    category: "shorts",
    creatorId: "u-awa",
    creatorName: "Awa Ou\xE9draogo",
    creatorHandle: "@awa.empire.bf",
    creatorAvatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&auto=format&fit=crop&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    viewCount: 94500,
    likesCount: 12400,
    sharesCount: 3200,
    // Partages Micro-Relais
    durationSec: 42,
    durationLabel: "0:42",
    hashtags: ["#chaussuresouaga", "#nanapos", "#modeafricaine", "#cuir"],
    createdAt: "Il y a 2h",
    createdAtTimestamp: Date.now() - 2 * 3600 * 1e3,
    productTag: { name: "Escarpins Royaux Ouaga", priceFcfa: 19500 }
  },
  {
    id: "vid-2",
    title: "\u{1F534} Concert Live Acoustique & Surprise Cadeaux en Direct Abidjan",
    category: "lives",
    creatorId: "u-ibrahim",
    creatorName: "Ibrahim Konat\xE9",
    creatorHandle: "@ibrahim",
    creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80",
    viewCount: 18500,
    likesCount: 15400,
    sharesCount: 4890,
    durationSec: 3600,
    durationLabel: "En Direct",
    isLive: true,
    viewersCount: 3890,
    hashtags: ["#concertlive", "#musique", "#abidjan", "#cadeaumystere"],
    createdAt: "En Direct",
    createdAtTimestamp: Date.now() - 30 * 60 * 1e3
  },
  {
    id: "vid-3",
    title: "Je livre un cadeau surprise en scooter \xE0 un abonn\xE9 \u{1F6F5}\u{1F381}",
    category: "shorts",
    creatorId: "u-ibrahim",
    creatorName: "Ibrahim Konat\xE9",
    creatorHandle: "@ibrahim",
    creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80",
    viewCount: 245e3,
    likesCount: 32e3,
    sharesCount: 7850,
    durationSec: 48,
    durationLabel: "0:48",
    hashtags: ["#cadeaumystere", "#wameetexpress", "#abidjan", "#surprise"],
    createdAt: "Il y a 1j",
    createdAtTimestamp: Date.now() - 86400 * 1e3,
    productTag: { name: "G\xE2teau d'anniversaire Signature", priceFcfa: 15e3 }
  },
  {
    id: "vid-4",
    title: "Masterclass Compl\xE8te : B\xE2tir son Empire de Vente 1-Clic WhatsApp & NaNa POS",
    category: "longs",
    creatorId: "u-idriss",
    creatorName: "Dr. Idriss Kabor\xE9",
    creatorHandle: "@idriss.academie",
    creatorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80",
    videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    viewCount: 52e4,
    likesCount: 45e3,
    sharesCount: 14200,
    durationSec: 1335,
    durationLabel: "22:15",
    hashtags: ["#masterclass", "#businessafrique", "#tunneldevente", "#nanapos"],
    createdAt: "Hier",
    createdAtTimestamp: Date.now() - 86400 * 1e3
  },
  {
    id: "vid-5",
    title: "Chaussures Ouaga : Test de durabilit\xE9 du cuir pleine fleur",
    category: "shorts",
    creatorId: "u-awa",
    creatorName: "Awa Ou\xE9draogo",
    creatorHandle: "@awa.empire.bf",
    creatorAvatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&auto=format&fit=crop&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=600&auto=format&fit=crop&q=80",
    viewCount: 31e4,
    likesCount: 41200,
    sharesCount: 9100,
    durationSec: 35,
    durationLabel: "0:35",
    hashtags: ["#chaussuresouaga", "#cuirartisanal", "#burkina"],
    createdAt: "Il y a 5j",
    createdAtTimestamp: Date.now() - 5 * 86400 * 1e3,
    productTag: { name: "Sandales Cuir Ouaga", priceFcfa: 12e3 }
  },
  {
    id: "vid-6",
    title: "\u{1F534} LIVE SHOPPING : D\xE9ballage et vente flash 50 paires Escarpins Royaux",
    category: "lives",
    creatorId: "u-awa",
    creatorName: "Awa Ou\xE9draogo",
    creatorHandle: "@awa.empire.bf",
    creatorAvatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&auto=format&fit=crop&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&auto=format&fit=crop&q=80",
    viewCount: 14200,
    likesCount: 8900,
    sharesCount: 3100,
    durationSec: 2400,
    durationLabel: "En Direct",
    isLive: true,
    viewersCount: 1420,
    hashtags: ["#liveshopping", "#chaussuresouaga", "#venteflash"],
    createdAt: "En Direct",
    createdAtTimestamp: Date.now() - 40 * 60 * 1e3
  }
];
var WAMEET_SOUNDS_TABLE = [
  {
    id: "snd-1",
    title: "Farotage Vibes (Son Officiel Wameet)",
    artist: "Ibrahim Konat\xE9 & Dj Mix",
    duration: "0:30",
    usesCount: 142e3,
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
    isTrending: true,
    createdAtTimestamp: Date.now() - 20 * 86400 * 1e3
  },
  {
    id: "snd-2",
    title: "Ouaga Night Groove",
    artist: "Burkina Sounds All-Stars",
    duration: "0:45",
    usesCount: 89500,
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80",
    isTrending: true,
    createdAtTimestamp: Date.now() - 10 * 86400 * 1e3
  },
  {
    id: "snd-3",
    title: "Acoustic Soul Abidjan",
    artist: "Ibrahim Konat\xE9",
    duration: "1:00",
    usesCount: 63400,
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80",
    isTrending: false,
    createdAtTimestamp: Date.now() - 40 * 86400 * 1e3
  }
];
var WAMEET_HASHTAGS_TABLE = [
  { id: "h-1", tag: "#ChaussuresOuaga", cleanTag: "chaussuresouaga", viewsCount: 145e4, postsCount: 3420, isTrending: true },
  { id: "h-2", tag: "#ConcertLive", cleanTag: "concertlive", viewsCount: 289e4, postsCount: 6810, isTrending: true },
  { id: "h-3", tag: "#NaNaPOS", cleanTag: "nanapos", viewsCount: 54e5, postsCount: 12400, isTrending: true },
  { id: "h-4", tag: "#WameetReels", cleanTag: "wameetreels", viewsCount: 39e5, postsCount: 8900, isTrending: true },
  { id: "h-5", tag: "#CadeauMystere", cleanTag: "cadeaumystere", viewsCount: 98e4, postsCount: 1850, isTrending: false }
];
function parseSearchQuery(rawQuery = "") {
  const trimmed = rawQuery.trim();
  if (trimmed.startsWith("@")) {
    const handleWithoutAt = trimmed.slice(1).trim().toLowerCase();
    return {
      raw: trimmed,
      clean: handleWithoutAt,
      isHandleMatch: true,
      targetHandle: handleWithoutAt,
      isHashtagMatch: false,
      terms: [handleWithoutAt]
    };
  }
  if (trimmed.startsWith("#")) {
    const tagWithoutHash = trimmed.slice(1).trim().toLowerCase();
    return {
      raw: trimmed,
      clean: tagWithoutHash,
      isHandleMatch: false,
      isHashtagMatch: true,
      targetTag: "#" + tagWithoutHash,
      terms: [tagWithoutHash]
    };
  }
  const lower = trimmed.toLowerCase();
  const terms = lower.split(/\s+/).filter((t) => t.length > 0);
  return {
    raw: trimmed,
    clean: lower,
    isHandleMatch: false,
    isHashtagMatch: false,
    terms
  };
}
function computeTopViralScore(video, parsed, nowTimestamp = Date.now()) {
  const viewsScore = Math.log10(Math.max(1, video.viewCount)) * 20;
  const sharesScore = (video.sharesCount || 0) * 0.08;
  const ageInHours = Math.max(0, (nowTimestamp - video.createdAtTimestamp) / (1e3 * 3600));
  const recencyMultiplier = Math.exp(-ageInHours / 72);
  const recencyBonus = recencyMultiplier * 45;
  const liveBonus = video.isLive ? 60 : 0;
  let relevanceBonus = 0;
  const titleLower = video.title.toLowerCase();
  if (parsed.clean) {
    if (titleLower === parsed.clean) {
      relevanceBonus += 80;
    } else if (titleLower.includes(parsed.clean)) {
      relevanceBonus += 40;
    } else {
      for (const term of parsed.terms) {
        if (titleLower.includes(term)) relevanceBonus += 15;
      }
    }
    for (const tag of video.hashtags) {
      if (tag.toLowerCase().includes(parsed.clean)) {
        relevanceBonus += 25;
      }
    }
  }
  return viewsScore + sharesScore + recencyBonus + liveBonus + relevanceBonus;
}
async function handleDiscoverySearch(req, res) {
  const startTime = Date.now();
  try {
    const rawQuery = String(req.query.q || "").trim();
    const category = String(req.query.category || "top").toLowerCase();
    const sortBy = String(req.query.sortBy || "views").toLowerCase();
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
    const offset = Math.max(0, parseInt(String(req.query.offset || "0"), 10));
    const parsed = parseSearchQuery(rawQuery);
    if (parsed.isHandleMatch && parsed.targetHandle) {
      const exactUser = USERNAME_EXACT_INDEX.get(parsed.targetHandle);
      const matchedUsers = exactUser ? [exactUser] : WAMEET_USERS_TABLE.filter(
        (u) => u.username.toLowerCase() === parsed.targetHandle || u.handle.toLowerCase() === `@${parsed.targetHandle}`
      );
      let creatorVideos = [];
      if (exactUser) {
        creatorVideos = WAMEET_VIDEOS_TABLE.filter((v) => v.creatorId === exactUser.id);
        if (sortBy === "newest") {
          creatorVideos.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
        } else {
          creatorVideos.sort((a, b) => b.viewCount - a.viewCount);
        }
      }
      res.status(200).json({
        success: true,
        operator: "HANDLE_EXACT_MATCH",
        query: rawQuery,
        targetHandle: parsed.targetHandle,
        total: matchedUsers.length,
        execTimeMs: Date.now() - startTime,
        results: {
          users: matchedUsers,
          videos: creatorVideos,
          playlist: exactUser ? creatorVideos.map((v) => ({
            id: v.id,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl,
            viewsCount: v.viewCount,
            duration: v.durationLabel,
            category: v.category,
            productTag: v.productTag
          })) : []
        }
      });
      return;
    }
    if (parsed.isHashtagMatch && parsed.targetTag) {
      const cleanTag = parsed.targetTag.toLowerCase();
      let matchedVideos = WAMEET_VIDEOS_TABLE.filter(
        (v) => v.hashtags.some((h) => h.toLowerCase() === cleanTag || h.toLowerCase().includes(parsed.clean))
      );
      if (sortBy === "newest") {
        matchedVideos.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
      } else {
        matchedVideos.sort((a, b) => b.viewCount - a.viewCount);
      }
      const matchedTags = WAMEET_HASHTAGS_TABLE.filter(
        (h) => h.tag.toLowerCase() === cleanTag || h.cleanTag.includes(parsed.clean)
      );
      res.status(200).json({
        success: true,
        operator: "HASHTAG_MATCH",
        query: rawQuery,
        targetTag: parsed.targetTag,
        total: matchedVideos.length,
        execTimeMs: Date.now() - startTime,
        results: {
          hashtags: matchedTags,
          videos: matchedVideos.slice(offset, offset + limit),
          shorts: matchedVideos.filter((v) => v.category === "shorts"),
          lives: matchedVideos.filter((v) => v.category === "lives")
        }
      });
      return;
    }
    let videos = WAMEET_VIDEOS_TABLE.filter((v) => {
      if (!parsed.clean) return true;
      const titleMatches = v.title.toLowerCase().includes(parsed.clean);
      const creatorMatches = v.creatorName.toLowerCase().includes(parsed.clean) || v.creatorHandle.toLowerCase().includes(parsed.clean);
      const tagMatches = v.hashtags.some((h) => h.toLowerCase().includes(parsed.clean));
      return titleMatches || creatorMatches || tagMatches;
    });
    let users = WAMEET_USERS_TABLE.filter((u) => {
      if (!parsed.clean) return true;
      return u.name.toLowerCase().includes(parsed.clean) || u.handle.toLowerCase().includes(parsed.clean) || u.category.toLowerCase().includes(parsed.clean) || u.bio.toLowerCase().includes(parsed.clean);
    });
    let sounds = WAMEET_SOUNDS_TABLE.filter((s) => {
      if (!parsed.clean) return true;
      return s.title.toLowerCase().includes(parsed.clean) || s.artist.toLowerCase().includes(parsed.clean);
    });
    let hashtags = WAMEET_HASHTAGS_TABLE.filter((h) => {
      if (!parsed.clean) return true;
      return h.tag.toLowerCase().includes(parsed.clean) || h.cleanTag.includes(parsed.clean);
    });
    if (category === "top") {
      const now = Date.now();
      videos = videos.map((v) => ({ ...v, score: computeTopViralScore(v, parsed, now) })).sort((a, b) => (b.score || 0) - (a.score || 0));
      users.sort((a, b) => b.followersCount - a.followersCount);
    } else if (sortBy === "newest") {
      videos.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
      users.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
      sounds.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
    } else {
      videos.sort((a, b) => b.viewCount - a.viewCount);
      users.sort((a, b) => b.followersCount - a.followersCount);
      sounds.sort((a, b) => b.usesCount - a.usesCount);
      hashtags.sort((a, b) => b.viewsCount - a.viewsCount);
    }
    let categorizedOutput = {};
    switch (category) {
      case "users":
        categorizedOutput = { users: users.slice(offset, offset + limit) };
        break;
      case "shorts":
        categorizedOutput = {
          shorts: videos.filter((v) => v.category === "shorts").slice(offset, offset + limit)
        };
        break;
      case "longs":
        categorizedOutput = {
          longs: videos.filter((v) => v.category === "longs").slice(offset, offset + limit)
        };
        break;
      case "lives":
        categorizedOutput = {
          lives: videos.filter((v) => v.category === "lives" || v.isLive).slice(offset, offset + limit)
        };
        break;
      case "sounds":
        categorizedOutput = { sounds: sounds.slice(offset, offset + limit) };
        break;
      case "tags":
        categorizedOutput = { hashtags: hashtags.slice(offset, offset + limit) };
        break;
      case "top":
      default:
        categorizedOutput = {
          topCreators: users.slice(0, 3),
          lives: videos.filter((v) => v.isLive).slice(0, 4),
          shorts: videos.filter((v) => v.category === "shorts").slice(0, 6),
          longs: videos.filter((v) => v.category === "longs").slice(0, 3),
          sounds: sounds.slice(0, 3),
          hashtags: hashtags.slice(0, 4)
        };
        break;
    }
    res.status(200).json({
      success: true,
      query: rawQuery,
      category,
      sortBy,
      execTimeMs: Date.now() - startTime,
      results: categorizedOutput
    });
  } catch (error) {
    console.error("[DISCOVERY SEARCH API] Erreur interne :", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors du traitement de la recherche Discovery",
      message: error?.message || "Erreur inconnue"
    });
  }
}
async function handleGetSearchHistory(req, res) {
  try {
    const userId = String(req.query.userId || req.headers["x-user-id"] || "usr_default").trim();
    const userHistory = USER_SEARCH_HISTORY_DB.get(userId) || [];
    const sorted = [...userHistory].sort((a, b) => b.searchedAt - a.searchedAt);
    res.status(200).json({
      success: true,
      userId,
      count: sorted.length,
      history: sorted.map((h) => ({
        id: h.id,
        query: h.query,
        searchedAt: h.searchedAt,
        count: h.count
      }))
    });
  } catch (error) {
    console.error("[DISCOVERY HISTORY GET] Erreur :", error);
    res.status(500).json({ success: false, error: "Impossible de r\xE9cup\xE9rer l\u2019historique de recherche" });
  }
}
async function handleSaveSearchHistory(req, res) {
  try {
    const userId = String(req.body.userId || req.headers["x-user-id"] || "usr_default").trim();
    const rawQuery = String(req.body.query || "").trim();
    if (!rawQuery) {
      res.status(400).json({ success: false, error: "La requ\xEAte de recherche (query) est obligatoire." });
      return;
    }
    let userHistory = USER_SEARCH_HISTORY_DB.get(userId) || [];
    const existingIndex = userHistory.findIndex(
      (h) => h.query.toLowerCase() === rawQuery.toLowerCase()
    );
    const now = Date.now();
    if (existingIndex >= 0) {
      const existing = userHistory[existingIndex];
      existing.searchedAt = now;
      existing.count += 1;
      userHistory.splice(existingIndex, 1);
      userHistory.unshift(existing);
    } else {
      const newItem = {
        id: `sh-${now}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        query: rawQuery,
        searchedAt: now,
        count: 1
      };
      userHistory.unshift(newItem);
    }
    if (userHistory.length > 15) {
      userHistory = userHistory.slice(0, 15);
    }
    USER_SEARCH_HISTORY_DB.set(userId, userHistory);
    res.status(201).json({
      success: true,
      message: "Recherche enregistr\xE9e dans l\u2019historique",
      historyCount: userHistory.length,
      latest: userHistory[0]
    });
  } catch (error) {
    console.error("[DISCOVERY HISTORY POST] Erreur :", error);
    res.status(500).json({ success: false, error: "Impossible d\u2019enregistrer la recherche" });
  }
}
async function handleDeleteSearchHistory(req, res) {
  try {
    const userId = String(req.query.userId || req.headers["x-user-id"] || "usr_default").trim();
    const itemQuery = req.query.query ? String(req.query.query).trim().toLowerCase() : null;
    if (!itemQuery) {
      USER_SEARCH_HISTORY_DB.set(userId, []);
      res.status(200).json({ success: true, message: "Historique de recherche vid\xE9 avec succ\xE8s" });
      return;
    }
    let userHistory = USER_SEARCH_HISTORY_DB.get(userId) || [];
    userHistory = userHistory.filter((h) => h.query.toLowerCase() !== itemQuery);
    USER_SEARCH_HISTORY_DB.set(userId, userHistory);
    res.status(200).json({
      success: true,
      message: `Terme "${itemQuery}" supprim\xE9 de l\u2019historique`,
      remainingCount: userHistory.length
    });
  } catch (error) {
    console.error("[DISCOVERY HISTORY DELETE] Erreur :", error);
    res.status(500).json({ success: false, error: "Impossible de supprimer de l\u2019historique" });
  }
}
function attachDiscoverySearchRoutes(app2) {
  app2.get("/api/discovery/search", handleDiscoverySearch);
  app2.get("/api/discovery/history", handleGetSearchHistory);
  app2.post("/api/discovery/history", handleSaveSearchHistory);
  app2.delete("/api/discovery/history", handleDeleteSearchHistory);
}

// src/server/vipSubscriptionController.ts
var import_crypto7 = __toESM(require("crypto"), 1);
var VIP_SUBSCRIPTIONS = /* @__PURE__ */ new Map();
var VIP_USER_ACCESS_INDEX = /* @__PURE__ */ new Map();
async function createVipSubscription(params) {
  const {
    loungeId,
    loungeTitle = "Salon VIP Wameet",
    planId,
    amount,
    customerPhone,
    customerName = "Membre VIP Wameet",
    userId = `user_${customerPhone.replace(/\D/g, "") || Date.now()}`,
    paymentMethod = "SEBPAY_MOBILE_MONEY",
    autoValidateWebhook = true
  } = params;
  const planLabel = planId === "lifetime" ? "Acc\xE8s \xE0 vie" : planId === "annual" ? "Pass Annuel" : "Pass Mensuel";
  const description = `Abonnement VIP Wameet : ${loungeTitle} (${planLabel})`;
  const sebpayResult = await sebpay_client_default.createEscrowPayment({
    amount,
    currency: "FCFA",
    description,
    customerPhone,
    customerName,
    buyerId: userId,
    tontineId: `vip_${loungeId}`,
    metadata: {
      type: "VIP_SUBSCRIPTION",
      loungeId,
      planId,
      paymentMethod
    }
  });
  const now = Date.now();
  let expiresAt = null;
  if (planId === "monthly") {
    expiresAt = now + 30 * 24 * 60 * 60 * 1e3;
  } else if (planId === "annual") {
    expiresAt = now + 365 * 24 * 60 * 60 * 1e3;
  } else {
    expiresAt = null;
  }
  const subscriptionId = `vip_sub_${Date.now()}_${import_crypto7.default.randomBytes(3).toString("hex")}`;
  let receiptNumber = `RCPT_VIP_${Date.now()}_${import_crypto7.default.randomBytes(2).toString("hex").toUpperCase()}`;
  if (autoValidateWebhook) {
    const captureResult = await sebpay_client_default.captureEscrowPayment(sebpayResult.transactionId, amount);
    if (captureResult.receiptNumber) {
      receiptNumber = captureResult.receiptNumber;
    }
  }
  const record = {
    id: subscriptionId,
    transactionId: sebpayResult.transactionId,
    receiptNumber,
    loungeId,
    loungeTitle,
    planId,
    planLabel,
    amount,
    currency: "FCFA",
    customerPhone,
    customerName,
    userId,
    paymentMethod,
    status: "ACTIVE",
    accessGranted: true,
    subscribedAt: now,
    expiresAt
  };
  VIP_SUBSCRIPTIONS.set(subscriptionId, record);
  VIP_USER_ACCESS_INDEX.set(`${userId}_${loungeId}`, subscriptionId);
  VIP_USER_ACCESS_INDEX.set(`${customerPhone}_${loungeId}`, subscriptionId);
  console.log(
    `[VIP CONTROLLER] \u2705 Abonnement VIP activ\xE9 pour ${customerPhone} dans "${loungeTitle}" (${planLabel} - ${amount} FCFA) - Tx: ${sebpayResult.transactionId}`
  );
  return record;
}
function checkVipAccess(loungeId, userIdentifier) {
  const subId = VIP_USER_ACCESS_INDEX.get(`${userIdentifier}_${loungeId}`);
  if (!subId) {
    return { hasAccess: false, subscription: null };
  }
  const sub = VIP_SUBSCRIPTIONS.get(subId);
  if (!sub || sub.status !== "ACTIVE") {
    return { hasAccess: false, subscription: null };
  }
  if (sub.expiresAt !== null && sub.expiresAt < Date.now()) {
    sub.status = "EXPIRED";
    sub.accessGranted = false;
    return { hasAccess: false, subscription: sub };
  }
  return { hasAccess: true, subscription: sub };
}
function attachVipSubscriptionRoutes(app2) {
  app2.post("/api/vip/subscribe", async (req, res) => {
    try {
      const {
        loungeId,
        loungeTitle,
        planId = "monthly",
        amount,
        customerPhone,
        customerName,
        userId,
        paymentMethod = "SEBPAY_MOBILE_MONEY",
        autoValidateWebhook = true
      } = req.body || {};
      if (!loungeId) {
        return res.status(400).json({
          success: false,
          message: "Le param\xE8tre loungeId est obligatoire."
        });
      }
      if (!customerPhone) {
        return res.status(400).json({
          success: false,
          message: "Le num\xE9ro de t\xE9l\xE9phone Mobile Money (customerPhone) est requis pour Sebpay."
        });
      }
      const parsedAmount = Number(amount) || (planId === "lifetime" ? 5e4 : 1e4);
      const subscription = await createVipSubscription({
        loungeId,
        loungeTitle,
        planId,
        amount: parsedAmount,
        customerPhone,
        customerName,
        userId,
        paymentMethod,
        autoValidateWebhook: Boolean(autoValidateWebhook)
      });
      return res.status(200).json({
        success: true,
        message: `\u{1F389} Abonnement ${subscription.planLabel} d\xE9verrouill\xE9 avec succ\xE8s via Sebpay !`,
        subscription,
        accessGranted: true
      });
    } catch (err) {
      console.error("[VIP CONTROLLER ERROR]", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Erreur lors de l'activation de l'abonnement Sebpay."
      });
    }
  });
  app2.post("/api/vip/webhook", (req, res) => {
    try {
      const { transactionId, status, receiptNumber } = req.body || {};
      console.log(`[VIP WEBHOOK] Webhook Sebpay re\xE7u pour Tx: ${transactionId} (Status: ${status})`);
      for (const sub of VIP_SUBSCRIPTIONS.values()) {
        if (sub.transactionId === transactionId) {
          if (status === "SUCCESS" || status === "CAPTURED") {
            sub.status = "ACTIVE";
            sub.accessGranted = true;
            if (receiptNumber) sub.receiptNumber = receiptNumber;
          } else if (status === "FAILED" || status === "REFUNDED") {
            sub.status = status;
            sub.accessGranted = false;
          }
          break;
        }
      }
      return res.status(200).json({ received: true, timestamp: Date.now() });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.get("/api/vip/status/:loungeId", (req, res) => {
    try {
      const { loungeId } = req.params;
      const userIdentifier = req.query.userId || req.query.phone || "";
      if (!userIdentifier) {
        return res.status(400).json({
          success: false,
          message: "userId ou phone requis en param\xE8tre de requ\xEAte."
        });
      }
      const result = checkVipAccess(loungeId, userIdentifier);
      return res.status(200).json({
        success: true,
        loungeId,
        ...result
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });
  app2.get("/api/vip/plans", (_req, res) => {
    return res.status(200).json({
      success: true,
      plans: [
        {
          id: "monthly",
          name: "Pass Mensuel",
          priceFcfa: 1e4,
          period: "Par mois, sans engagement",
          badge: "Populaire",
          features: [
            "Acc\xE8s 1-to-1 avec le Coach & Mentors",
            "Webinaires priv\xE9s hebdomadaires micro ouvert",
            "R\xE9seau exclusif de dirigeants et investisseurs",
            "Acc\xE8s aux replays vid\xE9o HD et fiches confidentielles"
          ]
        },
        {
          id: "lifetime",
          name: "Acc\xE8s \xE0 vie",
          priceFcfa: 5e4,
          period: "Paiement unique, acc\xE8s perp\xE9tuel",
          badge: "\xC9conomie 60%",
          recommended: true,
          features: [
            "Tous les avantages du Pass Mensuel \xE0 vie",
            "Canal audio WhatsApp VIP ultra-priv\xE9",
            "Mise en relation directe avec les Business Angels",
            "Certificat d\u2019Appartenance au Cercle des Dirigeants",
            "Invitations gratuites aux d\xEEners d\u2019affaires annuels"
          ]
        }
      ]
    });
  });
  console.log("\u2705 Routes Abonnements VIP Sebpay attach\xE9es sur /api/vip/*");
}

// src/server/wameetSyncController.ts
var import_crypto8 = __toESM(require("crypto"), 1);
var NANA_WAMEET_M2M_SECRET = process.env.NANA_WAMEET_M2M_SECRET || "nana_wameet_m2m_studio_sync_secret_2026";
var NANA_M2M_API_KEY = process.env.NANA_M2M_API_KEY || "nana_pos_studio_m2m_key_prod_v1";
var MAX_REQUEST_AGE_MS = 5 * 60 * 1e3;
var WAMEET_SYNCED_ROOMS = /* @__PURE__ */ new Map();
var CREATOR_ROOMS_INDEX = /* @__PURE__ */ new Map();
var NANA_PRO_SUBSCRIBERS = /* @__PURE__ */ new Set([
  "creator_ibrahim_traore",
  "creator_marcelle_gnakpa",
  "creator_koffi_mensah",
  "creator_aissata_ndiaye",
  "creator_nana_admin"
]);
initializeDefaultSyncedRooms();
function initializeDefaultSyncedRooms() {
  const initialLMS = {
    id: "course-sync-1",
    roomCode: "WMT-CRS-1001",
    roomType: "COURSE_ROOM",
    creatorId: "creator_marcelle_gnakpa",
    creatorName: "Marcelle Gnakpa",
    creatorRole: "Architecte Cloud & DevSecOps Senior",
    creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    creatorBio: "Ex-Lead Cloud Architect chez MTN & Orange. Formatrice certifi\xE9e.",
    isCreatorVerified: true,
    title: "Masterclass Cloud Architecture & Haute Disponibilit\xE9 Afrique",
    description: "Apprenez \xE0 concevoir et d\xE9ployer des infrastructures r\xE9silientes distribu\xE9es adapt\xE9es aux contraintes de connectivit\xE9 et de latence locales.",
    category: "Cloud & DevOps",
    tags: ["Kubernetes", "Cloud", "Haute Disponibilit\xE9", "Docker", "DevOps"],
    accessType: "PREMIUM",
    subscriptionPrice: {
      amount: 45e3,
      currency: "FCFA",
      periodLabel: "acc\xE8s complet",
      formattedLabel: "45 000 FCFA"
    },
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    contentPayload: {
      durationHours: 32,
      hasCertificate: true,
      chapters: [
        {
          id: "chap-1",
          title: "Fondations et Architecture Multi-R\xE9gion",
          lessons: [
            {
              id: "les-1",
              title: "Introduction aux contraintes de peering et CDN en Afrique",
              type: "video",
              duration: "18 min",
              videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            },
            {
              id: "les-2",
              title: "Livre Blanc : Guide Pratique du D\xE9ploiement Cloud OHADA",
              type: "pdf",
              duration: "Lecture 25 min",
              pdfUrl: "#",
              pdfSize: "3.4 MB"
            }
          ]
        }
      ],
      quizQuestions: [
        {
          id: "q-1",
          question: "Quelle est la latence moyenne optimale vis\xE9e entre Abidjan et Dakar ?",
          options: ["< 35 ms", "150 ms", "500 ms", "> 1 seconde"],
          correctAnswerIndex: 0,
          explanation: "Gr\xE2ce aux c\xE2bles sous-marins r\xE9cents et aux points d\u2019\xE9change IXP locaux, une latence sous les 35 ms est d\xE9sormais la norme."
        }
      ]
    },
    publishedAt: Date.now() - 864e5,
    updatedAt: Date.now() - 864e5,
    version: 1,
    status: "PUBLISHED",
    webSocketChannel: "vip_room_course-sync-1",
    roomUrl: "https://wameet.nana.africa/vip/course-sync-1"
  };
  WAMEET_SYNCED_ROOMS.set(initialLMS.id, initialLMS);
  CREATOR_ROOMS_INDEX.set(initialLMS.creatorId, /* @__PURE__ */ new Set([initialLMS.id]));
}
var wsEmitter = null;
var VIP_ROOM_CLIENTS = /* @__PURE__ */ new Map();
var CLIENT_VIP_ROOM = /* @__PURE__ */ new Map();
function setWameetSyncSocketEmitter(emitter) {
  wsEmitter = emitter;
  console.log("[WAMEET SYNC] \xC9metteur WebSocket Wameet Studio Cr\xE9ateur initialis\xE9.");
}
function registerSocketToVipRoom(roomId, socketId) {
  if (!VIP_ROOM_CLIENTS.has(roomId)) {
    VIP_ROOM_CLIENTS.set(roomId, /* @__PURE__ */ new Set());
  }
  VIP_ROOM_CLIENTS.get(roomId).add(socketId);
  CLIENT_VIP_ROOM.set(socketId, roomId);
  console.log(`[WAMEET SYNC WS] Socket ${socketId} a rejoint la salle VIP : ${roomId}`);
}
function unregisterSocketFromVipRoom(socketId) {
  const roomId = CLIENT_VIP_ROOM.get(socketId);
  if (roomId) {
    const clients = VIP_ROOM_CLIENTS.get(roomId);
    if (clients) {
      clients.delete(socketId);
      if (clients.size === 0) {
        VIP_ROOM_CLIENTS.delete(roomId);
      }
    }
    CLIENT_VIP_ROOM.delete(socketId);
    console.log(`[WAMEET SYNC WS] Socket ${socketId} a quitt\xE9 la salle VIP : ${roomId}`);
  }
}
function broadcastToVipRoom(roomId, event, data) {
  const clients = VIP_ROOM_CLIENTS.get(roomId);
  if (clients && wsEmitter) {
    for (const socketId of clients) {
      wsEmitter.to(socketId).emit(event, data);
    }
  }
}
function getVipRoomClientCount(roomId) {
  return VIP_ROOM_CLIENTS.get(roomId)?.size || 0;
}
function verifyNanaM2MAuth(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const m2mTokenHeader = req.headers["x-nana-m2m-token"] || "";
  const signatureHeader = req.headers["x-nana-signature"] || "";
  const timestampHeader = req.headers["x-nana-timestamp"] || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const providedToken = m2mTokenHeader || bearerToken;
  if (providedToken && (providedToken === NANA_M2M_API_KEY || providedToken === NANA_WAMEET_M2M_SECRET)) {
    return next();
  }
  if (signatureHeader && timestampHeader) {
    const timestamp = parseInt(timestampHeader, 10);
    const now = Date.now();
    if (isNaN(timestamp) || Math.abs(now - timestamp) > MAX_REQUEST_AGE_MS) {
      return res.status(401).json({
        success: false,
        error: "M2M_TIMESTAMP_EXPIRED",
        message: "Signature M2M expir\xE9e ou horodatage invalide. \xC9cart sup\xE9rieur \xE0 5 minutes.",
        serverTime: now
      });
    }
    const rawBody = req.rawBody ? req.rawBody.toString("utf-8") : JSON.stringify(req.body);
    const payloadToSign = `${timestamp}.${rawBody}`;
    const expectedSignature = import_crypto8.default.createHmac("sha256", NANA_WAMEET_M2M_SECRET).update(payloadToSign).digest("hex");
    if (import_crypto8.default.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSignature))) {
      return next();
    }
  }
  return res.status(401).json({
    success: false,
    error: "M2M_UNAUTHORIZED",
    message: "Acc\xE8s refus\xE9 : Authentification Machine-to-Machine invalide entre NaNa POS et Wameet. Fournissez x-nana-m2m-token ou x-nana-signature.",
    hint: "Utilisez la cl\xE9 secr\xE8te configur\xE9e dans NANA_WAMEET_M2M_SECRET."
  });
}
async function handlePublishRoom(req, res) {
  try {
    const payload = req.body;
    const {
      creatorId,
      creatorName,
      creatorRole = "Expert & Formateur NaNa",
      creatorAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      creatorBio,
      creatorIsPro = true,
      roomType,
      title,
      description,
      category = "Affaires & \xC9ducation",
      tags = [],
      accessType = "SUBSCRIPTION",
      subscriptionPrice,
      bannerUrl = "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80",
      contentPayload = {}
    } = payload || {};
    if (!creatorId || !creatorName || !roomType || !title || !description) {
      return res.status(400).json({
        success: false,
        error: "MISSING_REQUIRED_FIELDS",
        message: "Les champs creatorId, creatorName, roomType, title et description sont obligatoires."
      });
    }
    const isPro = creatorIsPro || NANA_PRO_SUBSCRIBERS.has(creatorId);
    if (!isPro) {
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN_PRO_REQUIRED",
        message: "Seuls les cr\xE9ateurs abonn\xE9s au statut Pro Subscriber dans NaNa POS sont autoris\xE9s \xE0 publier des espaces VIP Wameet.",
        creatorId
      });
    }
    const nanoSuffix = import_crypto8.default.randomBytes(4).toString("hex");
    const roomId = roomType === "COURSE_ROOM" ? `course_sync_${nanoSuffix}` : `lounge_sync_${nanoSuffix}`;
    const roomCodePrefix = roomType === "COURSE_ROOM" ? "WMT-CRS" : "WMT-VIP";
    const roomCode = `${roomCodePrefix}-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const webSocketChannel = `vip_room_${roomId}`;
    const roomUrl = `https://wameet.nana.africa/vip/${roomId}`;
    const rawPrice = subscriptionPrice?.amount ?? 25e3;
    const normalizedPrice = {
      amount: rawPrice,
      currency: subscriptionPrice?.currency || "FCFA",
      periodLabel: subscriptionPrice?.periodLabel || (accessType === "FREE" ? "Gratuit" : "mois"),
      formattedLabel: subscriptionPrice?.formattedLabel || (accessType === "FREE" ? "Acc\xE8s Offert" : `${rawPrice.toLocaleString("fr-FR")} ${subscriptionPrice?.currency || "FCFA"} / mois`)
    };
    const newRoom = {
      id: roomId,
      roomCode,
      roomType,
      creatorId,
      creatorName,
      creatorRole,
      creatorAvatar,
      creatorBio,
      isCreatorVerified: true,
      title,
      description,
      category,
      tags,
      accessType,
      subscriptionPrice: normalizedPrice,
      bannerUrl,
      contentPayload,
      publishedAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      status: "PUBLISHED",
      webSocketChannel,
      roomUrl
    };
    WAMEET_SYNCED_ROOMS.set(roomId, newRoom);
    if (!CREATOR_ROOMS_INDEX.has(creatorId)) {
      CREATOR_ROOMS_INDEX.set(creatorId, /* @__PURE__ */ new Set());
    }
    CREATOR_ROOMS_INDEX.get(creatorId).add(roomId);
    console.log(
      `[WAMEET SYNC] \u{1F680} Nouvelle Room VIP publi\xE9e avec succ\xE8s : ${roomId} ("${title}") par ${creatorName} (${creatorId})`
    );
    if (wsEmitter) {
      wsEmitter.emit("wameet_vip_room_published", {
        event: "wameet_vip_room_published",
        roomId,
        roomType,
        room: {
          id: newRoom.id,
          title: newRoom.title,
          category: newRoom.category,
          creatorName: newRoom.creatorName,
          creatorRole: newRoom.creatorRole,
          creatorAvatar: newRoom.creatorAvatar,
          accessType: newRoom.accessType,
          priceLabel: newRoom.subscriptionPrice.formattedLabel,
          bannerUrl: newRoom.bannerUrl,
          tags: newRoom.tags,
          isOnline: true,
          rating: 5,
          studentsCount: 0,
          activeMembersCount: 1,
          roomCode: newRoom.roomCode
        },
        timestamp: Date.now()
      });
      console.log(`[WAMEET SYNC WS] \xC9v\xE9nement 'wameet_vip_room_published' diffus\xE9 \xE0 tous les clients.`);
    }
    return res.status(201).json({
      success: true,
      message: "Espace VIP Wameet cr\xE9\xE9 et synchronis\xE9 avec succ\xE8s depuis NaNa POS.",
      data: newRoom
    });
  } catch (error) {
    console.error("[WAMEET SYNC PUBLISH ERROR]", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_SYNC_ERROR",
      message: error.message || "Une erreur est survenue lors de la synchronisation de la salle VIP."
    });
  }
}
async function handleUpdateContent(req, res) {
  try {
    const payload = req.body;
    const { roomId, creatorId, updateType, updatedContent } = payload || {};
    if (!roomId || !creatorId || !updateType || updatedContent === void 0) {
      return res.status(400).json({
        success: false,
        error: "MISSING_FIELDS",
        message: "Les champs roomId, creatorId, updateType et updatedContent sont obligatoires."
      });
    }
    const room = WAMEET_SYNCED_ROOMS.get(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "ROOM_NOT_FOUND",
        message: `La salle VIP ${roomId} n\u2019existe pas dans Wameet.`
      });
    }
    if (room.creatorId !== creatorId) {
      return res.status(403).json({
        success: false,
        error: "UNAUTHORIZED_CREATOR",
        message: "Vous n\u2019\xEAtes pas autoris\xE9 \xE0 modifier cet espace VIP (identifiant cr\xE9ateur non concordant)."
      });
    }
    room.version += 1;
    room.updatedAt = Date.now();
    switch (updateType) {
      case "ADD_LESSON": {
        const { chapterId, lesson } = updatedContent || {};
        if (!room.contentPayload.chapters) {
          room.contentPayload.chapters = [];
        }
        let targetChapter = room.contentPayload.chapters.find((c) => c.id === chapterId);
        if (!targetChapter) {
          targetChapter = {
            id: chapterId || `chap_${Date.now()}`,
            title: updatedContent.chapterTitle || "Nouveau Module",
            lessons: []
          };
          room.contentPayload.chapters.push(targetChapter);
        }
        targetChapter.lessons.push(lesson);
        break;
      }
      case "UPDATE_QUIZ": {
        room.contentPayload.quizQuestions = updatedContent;
        break;
      }
      case "ADD_FEED_POST": {
        if (!room.contentPayload.feedPosts) {
          room.contentPayload.feedPosts = [];
        }
        room.contentPayload.feedPosts.unshift(updatedContent);
        break;
      }
      case "UPDATE_METADATA": {
        if (updatedContent.title) room.title = updatedContent.title;
        if (updatedContent.description) room.description = updatedContent.description;
        if (updatedContent.bannerUrl) room.bannerUrl = updatedContent.bannerUrl;
        if (updatedContent.subscriptionPrice) {
          room.subscriptionPrice = {
            ...room.subscriptionPrice,
            ...updatedContent.subscriptionPrice
          };
        }
        break;
      }
      case "FULL_SYNC":
      default: {
        room.contentPayload = {
          ...room.contentPayload,
          ...updatedContent
        };
        break;
      }
    }
    WAMEET_SYNCED_ROOMS.set(roomId, room);
    console.log(
      `[WAMEET SYNC] \u{1F504} Contenu de la Room ${roomId} mis \xE0 jour (Type: ${updateType}, v${room.version}).`
    );
    if (wsEmitter) {
      wsEmitter.to(room.webSocketChannel).emit("room_content_updated", {
        roomId,
        roomType: room.roomType,
        updateType,
        updatedContent,
        version: room.version,
        timestamp: Date.now()
      });
      wsEmitter.emit("vip_room_catalog_updated", {
        roomId,
        title: room.title,
        version: room.version,
        updatedAt: room.updatedAt
      });
      console.log(
        `[WAMEET SYNC WS] Notification WebSocket transmise sur le canal '${room.webSocketChannel}'.`
      );
    }
    return res.json({
      success: true,
      message: `Contenu de la salle mis \xE0 jour en temps r\xE9el avec succ\xE8s (v${room.version}).`,
      data: {
        roomId: room.id,
        version: room.version,
        updatedAt: room.updatedAt,
        updateType,
        contentPayload: room.contentPayload
      }
    });
  } catch (error) {
    console.error("[WAMEET SYNC UPDATE ERROR]", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_UPDATE_ERROR",
      message: error.message || "Une erreur est survenue lors de la mise \xE0 jour en temps r\xE9el."
    });
  }
}
function handleGetSyncedRooms(req, res) {
  const rooms = Array.from(WAMEET_SYNCED_ROOMS.values()).filter(
    (r) => r.status === "PUBLISHED"
  );
  return res.json({
    success: true,
    count: rooms.length,
    rooms
  });
}
function handleGetRoomById(req, res) {
  const { roomId } = req.params;
  const room = WAMEET_SYNCED_ROOMS.get(roomId);
  if (!room) {
    return res.status(404).json({
      success: false,
      error: "ROOM_NOT_FOUND",
      message: `La salle VIP ${roomId} est introuvable.`
    });
  }
  return res.json({
    success: true,
    room
  });
}
function handleDeleteRoom(req, res) {
  const { roomId } = req.params;
  const creatorId = req.headers["x-creator-id"];
  const room = WAMEET_SYNCED_ROOMS.get(roomId);
  if (!room) {
    return res.status(404).json({ success: false, error: "ROOM_NOT_FOUND" });
  }
  if (creatorId && room.creatorId !== creatorId) {
    return res.status(403).json({ success: false, error: "FORBIDDEN" });
  }
  room.status = "ARCHIVED";
  WAMEET_SYNCED_ROOMS.set(roomId, room);
  if (wsEmitter) {
    wsEmitter.to(room.webSocketChannel).emit("room_closed", {
      roomId,
      reason: "Archiv\xE9 par le cr\xE9ateur depuis NaNa POS",
      timestamp: Date.now()
    });
  }
  return res.json({
    success: true,
    message: `La salle ${roomId} a \xE9t\xE9 archiv\xE9e avec succ\xE8s.`
  });
}
function attachWameetSyncRoutes(app2) {
  app2.get("/api/wameet-sync/rooms", handleGetSyncedRooms);
  app2.get("/api/wameet-sync/rooms/:roomId", handleGetRoomById);
  app2.post("/api/wameet-sync/publish-room", verifyNanaM2MAuth, handlePublishRoom);
  app2.put("/api/wameet-sync/update-content", verifyNanaM2MAuth, handleUpdateContent);
  app2.delete("/api/wameet-sync/rooms/:roomId", verifyNanaM2MAuth, handleDeleteRoom);
  console.log("[WAMEET SYNC] \u{1F309} Routes du Pont Backend NaNa POS -> Wameet VIP attach\xE9es avec succ\xE8s.");
}

// src/services/PushNotificationService.ts
var import_messaging = require("firebase/messaging");
var import_firestore4 = require("firebase/firestore");

// src/firebase.ts
var import_app = require("firebase/app");
var import_auth = require("firebase/auth");
var import_firestore3 = require("firebase/firestore");
var import_functions = require("firebase/functions");
var import_storage = require("firebase/storage");
var import_database = require("firebase/database");

// src/utils/firestoreService.ts
var import_firestore2 = require("firebase/firestore");

// src/services/casierSessionService.ts
var import_firestore = require("firebase/firestore");

// src/utils/firestoreService.ts
var DEFAULT_PRIVACY_POLICY = `
# Politique de Confidentialit\xE9 & Protection des Donn\xE9es - Nanasore

**Derni\xE8re mise \xE0 jour : 12 Septembre 2026**

Bienvenue sur **Nanasore**, la plateforme de gestion commerciale, e-commerce, campus e-learning et terminal de point de vente tactile.

### 1. Collecte et Utilisation des Donn\xE9es
Nanasore respecte scrupuleusement la confidentialit\xE9 de vos op\xE9rations commerciales. Nous collectons uniquement les informations indispensables au bon fonctionnement de votre caisse :
- **Identit\xE9 de la Boutique :** Nom commercial, t\xE9l\xE9phone, ville, devise utilis\xE9e (F CFA), logo et coordonn\xE9es du g\xE9rant.
- **Donn\xE9es d'Inventaire :** Liste de vos articles, codes-barres, prix de revient, prix de vente et historiques des mouvements de stock.
- **Enregistrement des Ventes et Dettes :** Montants des tickets de caisse, moyens de paiement (Esp\xE8ces, Cr\xE9dit), et fiches de suivi des clients r\xE9guliers.

### 2. Mode Hors-ligne et S\xE9curit\xE9 Locale
Pour garantir que votre boutique continue \xE0 vendre sans interruption m\xEAme en cas de coupure r\xE9seau ou d'\xE9lectricit\xE9 :
- Vos donn\xE9es sont conserv\xE9es localement dans le stockage s\xE9curis\xE9 chiffr\xE9 de votre navigateur (**IndexedDB**).
- D\xE8s le retour de la connexion internet, une synchronisation automatique et bidirectionnelle s'op\xE8re avec notre infrastructure Cloud Firestore hautement s\xE9curis\xE9e.
- Aucune donn\xE9e de carte bancaire ni de code confidentiel Mobile Money n'est jamais stock\xE9e sur nos serveurs.

### 3. Propri\xE9t\xE9 Exclusif de Vos Donn\xE9es
Vos donn\xE9es commerciales et vos bilans de ventes restent la propri\xE9t\xE9 pleine et exclusive de votre \xE9tablissement. Nana POS ne commercialise ni ne loue jamais les donn\xE9es de ses clients \xE0 des tiers \xE0 des fins publicitaires.

### 4. Vos Droits et Contact
Conform\xE9ment aux r\xE9glementations applicables en mati\xE8re de protection des donn\xE9es personnelles, vous disposez d'un droit permanent d'acc\xE8s, de rectification et d'exportation compl\xE8te de vos donn\xE9es (au format PDF ou Excel/JSON).

Pour toute assistance ou question relative \xE0 la protection de vos donn\xE9es :
- **Support WhatsApp Officiel :** +226 70 00 00 00 / +225 07 00 00 00
- **Email de contact :** support@nanapos.africa
`.trim();
var DEFAULT_PLATFORM_LEGAL = {
  ticker_text: "\xA9 2026 Nanasore. Tous droits r\xE9serv\xE9s. \u2022 Mentions L\xE9gales \u2022 Politique de Confidentialit\xE9 \u2022 S\xE9curit\xE9 & protection des donn\xE9es marchandes.",
  legal_mentions_content: `# Mentions L\xE9gales \u2014 Nanasore

## 1. \xC9diteur de l'Application
L'application et la plateforme **Nanasore** sont \xE9dit\xE9es par le consortium technologique Nanasore Digital Solutions SAS, immatricul\xE9e au registre du commerce sous le num\xE9ro CI-ABJ-2024-B-1089.
- **Si\xE8ge social** : Abidjan, Plateau, Avenue Chardy, Immeuble Horizon Tech, 4\xE8me \xE9tage.
- **Directeur de la publication** : Direction des Op\xE9rations Nanasore.
- **Contact Support & Assistance** : support@nanasore.com / +225 07 00 00 00 00.

## 2. H\xE9bergement & Infrastructure Cloud
Les donn\xE9es de caisse, bases de donn\xE9es et services temps r\xE9el sont h\xE9berg\xE9s sur des infrastructures cloud s\xE9curis\xE9es hautement disponibles :
- **H\xE9bergeur principal** : Google Cloud Platform (GCP) & Firebase Services.
- **Centres de donn\xE9es** : R\xE9gion Europe & R\xE9plication multi-r\xE9gionale s\xE9curis\xE9e.
- **Garantie de service (SLA)** : 99.9% de disponibilit\xE9 avec redondance hors-ligne locale (PWA SQLite / IndexedDB).

## 3. Propri\xE9t\xE9 Intellectuelle & Droits R\xE9serv\xE9s
L'ensemble des marques, logos, algorithmes de recommandation, mod\xE8les de calcul de rendu monnaie, codes sources et \xE9l\xE9ments graphiques de l'application Nanasore constituent des \u0153uvres de l'esprit prot\xE9g\xE9es par les dispositions de l'OAPI (Organisation Africaine de la Propri\xE9t\xE9 Intellectuelle) et les trait\xE9s internationaux relatifs au droit d'auteur.
Toute reproduction, repr\xE9sentation, modification ou extraction sans autorisation pr\xE9alable expresse est strictement prohib\xE9e.

## 4. Limitation de Responsabilit\xE9
Nanasore met tout en \u0153uvre pour assurer l'exactitude des calculs comptables, des stocks et de la transmission des paiements Mobile Money. Toutefois, la v\xE9rification physique des esp\xE8ces et l'encaissement effectif des sommes restent sous la pleine responsabilit\xE9 du commer\xE7ant gestionnaire de la caisse.`.trim(),
  privacy_policy_content: `# Politique de Confidentialit\xE9 & Protection des Donn\xE9es Marchandes

## 1. Engagement & Transparence
Nanasore s'engage fermement \xE0 respecter la vie priv\xE9e des commer\xE7ants, de leurs vendeurs et de leurs clients finaux. Les donn\xE9es enregistr\xE9es lors de chaque vente sont la propri\xE9t\xE9 exclusive du commer\xE7ant titulaire de la boutique.

## 2. Donn\xE9es Collect\xE9es & Traitements
Dans le cadre de l'exploitation de la caisse, les donn\xE9es suivantes sont trait\xE9es :
- **Donn\xE9es d'authentification** : Adresse email, nom du g\xE9rant, num\xE9ro de t\xE9l\xE9phone, code PIN chiffr\xE9.
- **Donn\xE9es d'activit\xE9 commerciale** : Historique des ventes, montants, modes de r\xE8glement (Cash, Mobile Money, Cr\xE9dit client), r\xE9f\xE9rences de commandes.
- **Carnet de Dettes & Clients** : Noms, pr\xE9noms, num\xE9ros WhatsApp et soldes de dettes des clients fid\xE8les.
- **Inventaire & Produits** : Prix d'achat, prix de vente, niveaux d'alerte de stock, photos compress\xE9es.

## 3. S\xE9curit\xE9 & Chiffrement
- **Chiffrement de bout en bout** : Toutes les communications entre le terminal de caisse et les serveurs Firestore utilisent le protocole HTTPS / TLS 1.3 avec cl\xE9s de chiffrement AES-256.
- **Isolation Multi-tenant** : Chaque boutique dispose de son propre partitionnement strict de donn\xE9es gr\xE2ce aux r\xE8gles de s\xE9curit\xE9 Firestore (stores/{userId}/*). Aucune boutique ne peut acc\xE9der aux transactions ou au carnet de dettes d'un confr\xE8re.

## 4. Cookies & Donn\xE9es Locales
L'application fonctionne en mode PWA (Progressive Web App). Les donn\xE9es sont synchronis\xE9es localement sur le terminal (Local Storage & Cache Storage) pour permettre un encaissement continu m\xEAme en cas de coupure de connexion Internet. Aucun traceur publicitaire tiers n'est utilis\xE9.

## 5. Droits d'Acc\xE8s, Rectification & Suppression
Conform\xE9ment aux r\xE9glementations sur la protection des donn\xE9es personnelles (dont la loi ivoirienne n\xB0 2013-450 et le RGPD), vous disposez d'un droit permanent d'acc\xE8s, d'exportation de vos donn\xE9es comptables au format PDF/CSV et de suppression totale de votre compte sur simple demande \xE0 contact@nanasore.com.`.trim(),
  show_ticker: true,
  lastUpdated: "15 Septembre 2026",
  updatedBy: "Direction Juridique Nanasore"
};

// src/firebase.ts
var RTDB_DEFAULT_URL = "https://pos-app-1759a-default-rtdb.firebaseio.com";
var firebaseConfig = {
  apiKey: "AIzaSyAds0VCLfekX8qQw-ya8ATlUbSyrG4Y6Zk",
  authDomain: "pos-app-1759a.firebaseapp.com",
  databaseURL: RTDB_DEFAULT_URL,
  projectId: "pos-app-1759a",
  storageBucket: "pos-app-1759a.firebasestorage.app",
  messagingSenderId: "60089897725",
  appId: "1:60089897725:web:0c675e63e72040dea56494",
  measurementId: "G-W8N6127LE5"
};
var app = !(0, import_app.getApps)().length ? (0, import_app.initializeApp)(firebaseConfig) : (0, import_app.getApp)();
var auth = (0, import_auth.getAuth)(app);
var googleProvider = new import_auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});
if (typeof window !== "undefined") {
  (0, import_auth.onAuthStateChanged)(auth, (user) => {
    if (!user) {
      (0, import_auth.signInAnonymously)(auth).catch((err) => {
        console.info("[FIREBASE AUTH] Mode local / persistance autonome :", err?.message || err);
      });
    }
  });
}
var firestoreDb;
try {
  firestoreDb = (0, import_firestore3.initializeFirestore)(app, {
    localCache: (0, import_firestore3.persistentLocalCache)({
      tabManager: (0, import_firestore3.persistentMultipleTabManager)()
    })
  });
  console.log("[FIRESTORE] Cache hors-ligne persistant (IndexedDB multi-onglets) initialis\xE9.");
} catch (err) {
  try {
    firestoreDb = (0, import_firestore3.initializeFirestore)(app, {
      localCache: (0, import_firestore3.persistentLocalCache)({
        tabManager: (0, import_firestore3.persistentSingleTabManager)({})
      })
    });
    console.log("[FIRESTORE] Cache hors-ligne persistant (IndexedDB mono-onglet) initialis\xE9.");
  } catch (err2) {
    console.warn("[FIRESTORE] Fallback vers instance existante Firestore :", err2);
    firestoreDb = (0, import_firestore3.getFirestore)(app);
    try {
      (0, import_firestore3.enableIndexedDbPersistence)(firestoreDb).catch(() => {
      });
    } catch {
    }
  }
}
var db = firestoreDb;
var storage = (0, import_storage.getStorage)(app);
var rtdb = (0, import_database.getDatabase)(app, RTDB_DEFAULT_URL);
var functions = (0, import_functions.getFunctions)(app, "europe-west1");

// src/services/PushNotificationService.ts
var CLOUDFLARE_WORKER_URL = "https://proud-block-9615.pousbila04.workers.dev/";

// src/server/pulseNotificationController.ts
var MERCHANT_REGISTRY = /* @__PURE__ */ new Map([
  [
    "merchant_demo_ouaga",
    {
      hasPhysicalRegister: false,
      // Pas de caisse physique -> Wameet exclusif
      storeName: "Boutique Ouaga Mode",
      wameetTopic: "/topics/wameet_merchant_demo_ouaga",
      nanasoreFcmToken: "fcm_token_nanasore_ouaga_demo"
    }
  ],
  [
    "merchant_abidjan_pos",
    {
      hasPhysicalRegister: true,
      // Possède une caisse physique -> Double notification (Nanasore + Wameet)
      storeName: "Abidjan Mall Caisse Principale",
      wameetTopic: "/topics/wameet_merchant_abidjan_pos",
      nanasoreFcmToken: "fcm_token_nanasore_abidjan_caisse"
    }
  ]
]);
async function routePulseOrderNotification(payload) {
  const merchantId = payload.merchantId || payload.storeId || "unknown_merchant";
  const hopCount = payload.hopCount || 0;
  if (hopCount > 1 || payload.sourceOrigin === "PULSE_ROUTED_LOOP") {
    console.warn(`[Pulse Router] \u26A0\uFE0F Tentative de boucle de redirection intercept\xE9e et bloqu\xE9e pour ${merchantId}.`);
    return {
      success: false,
      routingMode: "EXCLUSIVE_WAMEET",
      hasPhysicalRegister: false,
      nanasoreBlocked: true,
      blockReason: "LOOP_PREVENTION_STOP",
      destinations: {
        wameet: { sent: false, topic: `/topics/wameet_merchant_${merchantId}` },
        nanasore: { sent: false, blocked: true, reason: "Boucle de redirection \xE9vit\xE9e" }
      },
      routingToken: payload.routingToken || "loop_halt",
      timestamp: Date.now()
    };
  }
  let hasPhysicalRegister = false;
  if (payload.merchantProfile) {
    hasPhysicalRegister = Boolean(
      payload.merchantProfile.hasPhysicalRegister === true || payload.merchantProfile.hasPhysicalPos === true
    );
  } else if (MERCHANT_REGISTRY.has(merchantId)) {
    hasPhysicalRegister = MERCHANT_REGISTRY.get(merchantId).hasPhysicalRegister;
  }
  const wameetTopic = `/topics/wameet_merchant_${merchantId}`;
  const routingToken = `pulse_route_${payload.orderId}_${Date.now()}`;
  const formattedAmount = typeof payload.orderTotal === "number" ? `${payload.orderTotal.toLocaleString("fr-FR")} FCFA` : String(payload.orderTotal);
  const wameetPayload = {
    title: "\u{1F389} [Wameet] Nouvelle commande re\xE7ue !",
    body: `Vente : ${payload.customerName || "Client"} \u2022 ${formattedAmount} \u2022 ${payload.productName || "Article"}`,
    data: {
      type: "NEW_ORDER",
      orderId: payload.orderId,
      customerName: payload.customerName || "",
      amount: String(payload.orderTotal),
      productName: payload.productName || "",
      targetApp: "WAMEET",
      routingRule: hasPhysicalRegister ? "DUAL_DISPATCH" : "EXCLUSIVE_WAMEET",
      hasPhysicalRegister: String(hasPhysicalRegister),
      nanasoreBlocked: String(!hasPhysicalRegister),
      clickAction: `wameet://orders/${payload.orderId}`,
      sourceOrigin: "PULSE_ROUTER_V1",
      routingToken
    }
  };
  let wameetSuccess = true;
  try {
    await fetch(CLOUDFLARE_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: wameetTopic,
        title: wameetPayload.title,
        body: wameetPayload.body,
        data: wameetPayload.data
      })
    }).catch((err) => {
      console.warn("[Pulse Router] Cloudflare Worker envoi topic Wameet ignor\xE9 (fallback r\xE9seau) :", err?.message);
    });
  } catch (err) {
    wameetSuccess = false;
  }
  let nanasoreSent = false;
  let nanasoreBlocked = true;
  let blockReason;
  if (hasPhysicalRegister) {
    nanasoreBlocked = false;
    const nanasoreToken = payload.merchantProfile?.fcmToken || MERCHANT_REGISTRY.get(merchantId)?.nanasoreFcmToken;
    if (nanasoreToken) {
      try {
        await fetch(CLOUDFLARE_WORKER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fcmToken: nanasoreToken,
            title: "\u{1F389} Nouvelle commande re\xE7ue (Caisse Physique) !",
            body: `Caisse alert\xE9e : ${payload.customerName} \u2022 ${formattedAmount}`,
            data: {
              ...wameetPayload.data,
              targetApp: "NANASORE",
              destination: "PHYSICAL_REGISTER"
            }
          })
        }).catch(console.warn);
        nanasoreSent = true;
      } catch {
      }
    } else {
      nanasoreSent = true;
    }
    console.log(`[Pulse Router] \u{1F3EA} Caisse physique enregistr\xE9e (hasPhysicalRegister: true). D\xE9blocage actif : notification transmise \xE0 Nanasore ET Wameet pour ${merchantId}.`);
  } else {
    nanasoreBlocked = true;
    nanasoreSent = false;
    blockReason = "MERCHANT_MUST_INSTALL_WAMEET";
    console.log(`[Pulse Router] \u{1F680} R\xE8gle stricte Pulse : Commande rout\xE9e EXCLUSIVEMENT vers Wameet pour ${merchantId}. Notification Nanasore bloqu\xE9e (incitation installation Wameet).`);
  }
  return {
    success: true,
    routingMode: hasPhysicalRegister ? "DUAL_DISPATCH" : "EXCLUSIVE_WAMEET",
    hasPhysicalRegister,
    nanasoreBlocked,
    blockReason,
    destinations: {
      wameet: {
        sent: wameetSuccess,
        topic: wameetTopic,
        serverUrl: "https://api.wameet.africa/pulse/orders"
      },
      nanasore: {
        sent: nanasoreSent,
        blocked: nanasoreBlocked,
        fcmToken: payload.merchantProfile?.fcmToken,
        reason: blockReason
      }
    },
    routingToken,
    timestamp: Date.now()
  };
}
function attachPulseNotificationRoutes(app2) {
  app2.post("/api/pulse/route-order", async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || !payload.orderId) {
        return res.status(400).json({
          error: "Payload invalide : orderId requis pour le routage Pulse."
        });
      }
      const result = await routePulseOrderNotification(payload);
      return res.status(200).json(result);
    } catch (error) {
      console.error("[Pulse Router] Erreur lors du routage de la notification :", error);
      return res.status(500).json({
        error: "Erreur interne lors du routage Pulse",
        details: error?.message
      });
    }
  });
  app2.get("/api/pulse/merchants/:merchantId/status", (req, res) => {
    const { merchantId } = req.params;
    const entry = MERCHANT_REGISTRY.get(merchantId);
    const hasPhysicalRegister = entry ? entry.hasPhysicalRegister : false;
    return res.json({
      merchantId,
      hasPhysicalRegister,
      routingMode: hasPhysicalRegister ? "DUAL_DISPATCH" : "EXCLUSIVE_WAMEET",
      nanasoreBlocked: !hasPhysicalRegister,
      wameetTopic: `/topics/wameet_merchant_${merchantId}`,
      incentiveMessage: !hasPhysicalRegister ? "Application Wameet requise pour recevoir les alertes de commandes en direct." : "Caisse physique connect\xE9e : alertes synchronis\xE9es sur Nanasore et Wameet."
    });
  });
  app2.post("/api/pulse/merchants/:merchantId/physical-register", (req, res) => {
    const { merchantId } = req.params;
    const { hasPhysicalRegister } = req.body;
    const existing = MERCHANT_REGISTRY.get(merchantId) || {
      hasPhysicalRegister: false,
      storeName: `Boutique ${merchantId}`,
      wameetTopic: `/topics/wameet_merchant_${merchantId}`
    };
    existing.hasPhysicalRegister = Boolean(hasPhysicalRegister);
    MERCHANT_REGISTRY.set(merchantId, existing);
    return res.json({
      success: true,
      merchantId,
      hasPhysicalRegister: existing.hasPhysicalRegister,
      routingMode: existing.hasPhysicalRegister ? "DUAL_DISPATCH" : "EXCLUSIVE_WAMEET",
      message: existing.hasPhysicalRegister ? "Exception mat\xE9rielle activ\xE9e : la boutique recevra les notifications sur Nanasore ET sur Wameet." : "Caisse physique d\xE9sactiv\xE9e : les notifications de commande sont rout\xE9es EXCLUSIVEMENT vers Wameet."
    });
  });
  console.log("\u2705 [PULSE ROUTER] Routes de routage des notifications Wameet attach\xE9es (/api/pulse/*)");
}

// src/server/resonanceController.ts
var import_crypto9 = __toESM(require("crypto"), 1);
var import_firestore5 = require("firebase/firestore");
var localResonances = [];
var localMatches = [];
var notificationListeners = [];
async function registerResonance(senderId, receiverId, postId) {
  const normalizedSender = senderId.trim();
  const normalizedReceiver = receiverId.trim();
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  let resonanceId = `res_${Date.now()}_${import_crypto9.default.randomUUID().slice(0, 8)}`;
  try {
    if (db) {
      const colRef = (0, import_firestore5.collection)(db, "resonances");
      const docRef = await (0, import_firestore5.addDoc)(colRef, {
        senderId: normalizedSender,
        receiverId: normalizedReceiver,
        postId,
        createdAt: nowIso
      });
      resonanceId = docRef.id;
    }
  } catch (err) {
    console.warn("[RESONANCE BDD] \xC9criture Firestore en fallback local :", err);
  }
  localResonances.push({
    id: resonanceId,
    senderId: normalizedSender,
    receiverId: normalizedReceiver,
    postId,
    createdAt: nowIso
  });
  let hasMatch = false;
  try {
    if (db) {
      const q = (0, import_firestore5.query)(
        (0, import_firestore5.collection)(db, "resonances"),
        (0, import_firestore5.where)("senderId", "==", normalizedReceiver),
        (0, import_firestore5.where)("receiverId", "==", normalizedSender)
      );
      const querySnap = await (0, import_firestore5.getDocs)(q);
      hasMatch = !querySnap.empty;
    }
  } catch (err) {
    console.warn("[RESONANCE MATCH] Requ\xEAte Firestore inverse en fallback local :", err);
  }
  if (!hasMatch) {
    hasMatch = localResonances.some(
      (r) => r.senderId === normalizedReceiver && r.receiverId === normalizedSender
    );
  }
  if (hasMatch) {
    const jitsiRoomId = import_crypto9.default.randomUUID();
    const matchId = `wameet_match_${Date.now()}_${jitsiRoomId.slice(0, 8)}`;
    const wameetUrl = `https://meet.jit.si/wameet-synergy-${jitsiRoomId}`;
    const matchDoc = {
      id: matchId,
      jitsiRoomId,
      participantIds: [normalizedSender, normalizedReceiver],
      user1Id: normalizedSender,
      user2Id: normalizedReceiver,
      postId,
      status: "SYNERGY_MATCH",
      wameetUrl,
      createdAt: nowIso,
      notified: true
    };
    try {
      if (db) {
        const wameetsCol = (0, import_firestore5.collection)(db, "wameets");
        await (0, import_firestore5.setDoc)((0, import_firestore5.doc)(wameetsCol, matchId), matchDoc);
        console.log(`[SYNERGY MATCH] Document ins\xE9r\xE9 dans 'wameets' : ${matchId}`);
      }
    } catch (err) {
      console.warn("[WAMEET BDD] \xC9criture match wameets en fallback local :", err);
    }
    localMatches.push(matchDoc);
    console.log(`[NOTIFICATION SILENCIEUSE] Match Synergique entre ${normalizedSender} et ${normalizedReceiver} !`);
    console.log(`[NOTIFICATION SILENCIEUSE] Lien Jitsi g\xE9n\xE9r\xE9 : ${wameetUrl}`);
    notificationListeners.forEach((fn) => {
      try {
        fn(matchDoc);
      } catch (e) {
        console.error("Erreur listener notification r\xE9sonance", e);
      }
    });
    return {
      success: true,
      resonanceId,
      isMatch: true,
      match: matchDoc
    };
  }
  return {
    success: true,
    resonanceId,
    isMatch: false
  };
}
function attachResonanceRoutes(app2) {
  app2.post("/api/resonances", async (req, res) => {
    try {
      const { senderId, receiverId, postId } = req.body;
      if (!senderId || !receiverId || !postId) {
        res.status(400).json({
          error: "Les param\xE8tres senderId, receiverId et postId sont obligatoires."
        });
        return;
      }
      const result = await registerResonance(senderId, receiverId, postId);
      res.json(result);
    } catch (error) {
      console.error("[API RESONANCE ERROR]", error);
      res.status(500).json({ error: error?.message || "Erreur interne du serveur" });
    }
  });
  app2.get("/api/resonances/user/:userId", (req, res) => {
    const userId = req.params.userId;
    const sent = localResonances.filter((r) => r.senderId === userId);
    const received = localResonances.filter((r) => r.receiverId === userId);
    res.json({ sent, received });
  });
  app2.get("/api/wameets/matches/:userId", (req, res) => {
    const userId = req.params.userId;
    const matches = localMatches.filter(
      (m) => m.user1Id === userId || m.user2Id === userId || m.participantIds.includes(userId)
    );
    res.json({ matches });
  });
}

// src/server/wameetPremiumController.ts
var import_crypto10 = __toESM(require("crypto"), 1);
var import_firestore6 = require("firebase/firestore");
var localConsultations = /* @__PURE__ */ new Map();
var localTransactions = /* @__PURE__ */ new Map();
var premiumNotificationListeners = [];
async function initiateWameetConsultation(params) {
  const wameetId = `wameet_prem_${Date.now()}_${import_crypto10.default.randomUUID().slice(0, 8)}`;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const consultation = {
    id: wameetId,
    expertId: params.expertId,
    expertName: params.expertName,
    requesterId: params.requesterId,
    requesterName: params.requesterName,
    amount: params.amount,
    currency: "FCFA",
    topic: params.topic || "Consultation d'Expert Wameet",
    status: "PENDING_PAYMENT",
    jitsiRoomId: null,
    // Verrouillé
    wameetUrl: null,
    // Verrouillé
    transactionId: null,
    createdAt: nowIso,
    paidAt: null
  };
  localConsultations.set(wameetId, consultation);
  try {
    if (db) {
      await (0, import_firestore6.setDoc)((0, import_firestore6.doc)((0, import_firestore6.collection)(db, "wameet_consultations"), wameetId), consultation);
    }
  } catch (err) {
    console.warn("[WAMEET CONSULTATION] \xC9criture Firestore en fallback local :", err);
  }
  return consultation;
}
async function handlePaymentWebhook(payload) {
  const { wameetId, status, provider = "ORANGE_MONEY", payerPhone } = payload;
  let consultation = localConsultations.get(wameetId);
  if (!consultation && db) {
    try {
      const snap = await (0, import_firestore6.getDoc)((0, import_firestore6.doc)((0, import_firestore6.collection)(db, "wameet_consultations"), wameetId));
      if (snap.exists()) {
        consultation = snap.data();
      }
    } catch (e) {
      console.warn("[WEBHOOK WAMEET] Lecture consultation Firestore:", e);
    }
  }
  if (!consultation) {
    return {
      success: false,
      error: `Consultation Wameet ${wameetId} introuvable.`
    };
  }
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const txId = payload.transactionId || `tx_${Date.now()}_${import_crypto10.default.randomUUID().slice(0, 8)}`;
  const finalAmount = payload.amount || consultation.amount;
  const transactionRecord = {
    id: txId,
    wameetId,
    type: "WAMEET_PREMIUM_COACHING",
    amount: finalAmount,
    currency: "FCFA",
    status,
    provider,
    payerPhone,
    expertId: consultation.expertId,
    requesterId: consultation.requesterId,
    createdAt: nowIso
  };
  localTransactions.set(txId, transactionRecord);
  try {
    if (db) {
      await (0, import_firestore6.setDoc)((0, import_firestore6.doc)((0, import_firestore6.collection)(db, "transactions"), txId), transactionRecord);
      console.log(`[TRANSACTIONS BDD] Transaction enregistr\xE9e pour Wameet ${wameetId} : ${txId}`);
    }
  } catch (err) {
    console.warn("[TRANSACTIONS BDD] \xC9criture transaction Firestore en fallback local :", err);
  }
  if (status !== "SUCCESS") {
    consultation.status = "FAILED";
    localConsultations.set(wameetId, consultation);
    return {
      success: false,
      error: "Le paiement n'a pas abouti (statut: " + status + "). Salle Wameet non autoris\xE9e.",
      transaction: transactionRecord
    };
  }
  const jitsiRoomId = import_crypto10.default.randomUUID();
  const wameetUrl = `https://meet.jit.si/wameet-premium-${jitsiRoomId}`;
  consultation.status = "PAID_ACTIVE";
  consultation.jitsiRoomId = jitsiRoomId;
  consultation.wameetUrl = wameetUrl;
  consultation.transactionId = txId;
  consultation.paidAt = nowIso;
  localConsultations.set(wameetId, consultation);
  try {
    if (db) {
      await (0, import_firestore6.setDoc)((0, import_firestore6.doc)((0, import_firestore6.collection)(db, "wameet_consultations"), wameetId), consultation);
      await (0, import_firestore6.setDoc)((0, import_firestore6.doc)((0, import_firestore6.collection)(db, "wameets"), wameetId), {
        ...consultation,
        status: "PAID_ACTIVE"
      });
    }
  } catch (err) {
    console.warn("[WAMEET BDD] Mise \xE0 jour consultation pay\xE9e :", err);
  }
  console.log(`[WAMEET PREMIUM SUCCESS] Salle d\xE9bloqu\xE9e pour l'expert ${consultation.expertName} et le client ${consultation.requesterName}`);
  console.log(`[WAMEET ROOM AUTORIS\xC9E] ${wameetUrl} (Tx: ${txId})`);
  premiumNotificationListeners.forEach((fn) => {
    try {
      fn({
        event: "CONSULTATION_PAID_READY",
        consultation,
        transaction: transactionRecord
      });
    } catch (e) {
      console.error("[PREMIUM NOTIFICATION ERROR]", e);
    }
  });
  return {
    success: true,
    jitsiRoomId,
    wameetUrl,
    transaction: transactionRecord
  };
}
async function getVerifiedJitsiRoom(wameetId, userId) {
  let consultation = localConsultations.get(wameetId);
  if (!consultation && db) {
    try {
      const snap = await (0, import_firestore6.getDoc)((0, import_firestore6.doc)((0, import_firestore6.collection)(db, "wameet_consultations"), wameetId));
      if (snap.exists()) {
        consultation = snap.data();
      }
    } catch (e) {
      console.warn("[VERIFY JITSI ROOM] Erreur lecture consultation Firestore:", e);
    }
  }
  if (!consultation) {
    return {
      allowed: false,
      error: "Consultation introuvable."
    };
  }
  let hasValidTx = false;
  for (const tx of localTransactions.values()) {
    if (tx.wameetId === wameetId && tx.status === "SUCCESS") {
      hasValidTx = true;
      break;
    }
  }
  if (!hasValidTx && db) {
    try {
      const q = (0, import_firestore6.query)(
        (0, import_firestore6.collection)(db, "transactions"),
        (0, import_firestore6.where)("wameetId", "==", wameetId),
        (0, import_firestore6.where)("status", "==", "SUCCESS")
      );
      const snap = await (0, import_firestore6.getDocs)(q);
      hasValidTx = !snap.empty;
    } catch (e) {
      console.warn("[VERIFY JITSI ROOM] Erreur v\xE9rification transaction Firestore:", e);
    }
  }
  if (!hasValidTx || consultation.status !== "PAID_ACTIVE" || !consultation.jitsiRoomId) {
    return {
      allowed: false,
      error: "Acc\xE8s verrouill\xE9 : cette consultation requiert un paiement valid\xE9 par webhook Mobile Money."
    };
  }
  return {
    allowed: true,
    jitsiRoomId: consultation.jitsiRoomId,
    wameetUrl: consultation.wameetUrl || `https://meet.jit.si/wameet-premium-${consultation.jitsiRoomId}`
  };
}
function attachWameetPremiumRoutes(app2) {
  app2.post("/api/wameet/premium/initiate", async (req, res) => {
    try {
      const { expertId, expertName, requesterId, requesterName, amount, topic } = req.body;
      if (!expertId || !amount) {
        res.status(400).json({ error: "expertId et amount sont obligatoires." });
        return;
      }
      const consultation = await initiateWameetConsultation({
        expertId,
        expertName: expertName || "Expert Wameet",
        requesterId: requesterId || "anonymous_buyer",
        requesterName: requesterName || "Client Wameet",
        amount: Number(amount),
        topic
      });
      res.status(201).json({
        success: true,
        consultation,
        message: "Demande de consultation enregistr\xE9e. Paiement Mobile Money en attente."
      });
    } catch (error) {
      console.error("[API WAMEET PREMIUM INITIATE ERROR]", error);
      res.status(500).json({ error: error?.message || "Erreur serveur" });
    }
  });
  app2.post("/api/webhooks/wameet-payment", async (req, res) => {
    try {
      const { wameetId, status, transactionId, amount, provider, payerPhone } = req.body;
      if (!wameetId || !status) {
        res.status(400).json({ error: "wameetId et status sont obligatoires." });
        return;
      }
      const result = await handlePaymentWebhook({
        wameetId,
        status: status === "SUCCESS" ? "SUCCESS" : "FAILED",
        transactionId,
        amount: amount ? Number(amount) : void 0,
        provider,
        payerPhone
      });
      if (!result.success) {
        res.status(402).json({
          error: result.error,
          transaction: result.transaction
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Paiement valid\xE9 par webhook. Salle Wameet d\xE9verrouill\xE9e et transmise aux parties.",
        jitsiRoomId: result.jitsiRoomId,
        wameetUrl: result.wameetUrl,
        transaction: result.transaction
      });
    } catch (error) {
      console.error("[API WAMEET WEBHOOK ERROR]", error);
      res.status(500).json({ error: error?.message || "Erreur interne traitement webhook" });
    }
  });
  app2.post("/api/wameet/premium/room", async (req, res) => {
    try {
      const { wameetId, userId } = req.body;
      if (!wameetId) {
        res.status(400).json({ error: "wameetId est obligatoire." });
        return;
      }
      const result = await getVerifiedJitsiRoom(wameetId, userId || "user");
      if (!result.allowed) {
        res.status(403).json({
          allowed: false,
          error: result.error
        });
        return;
      }
      res.status(200).json({
        allowed: true,
        jitsiRoomId: result.jitsiRoomId,
        wameetUrl: result.wameetUrl
      });
    } catch (error) {
      console.error("[API WAMEET ROOM ERROR]", error);
      res.status(500).json({ error: error?.message || "Erreur serveur" });
    }
  });
  app2.get("/api/transactions/wameet/:wameetId", async (req, res) => {
    const wameetId = req.params.wameetId;
    const tx = Array.from(localTransactions.values()).find((t) => t.wameetId === wameetId);
    if (tx) {
      res.json({ transaction: tx });
      return;
    }
    if (db) {
      try {
        const q = (0, import_firestore6.query)((0, import_firestore6.collection)(db, "transactions"), (0, import_firestore6.where)("wameetId", "==", wameetId));
        const snap = await (0, import_firestore6.getDocs)(q);
        if (!snap.empty) {
          res.json({ transaction: snap.docs[0].data() });
          return;
        }
      } catch (e) {
        console.warn("[TRANSACTION QUERY ERROR]", e);
      }
    }
    res.status(404).json({ error: "Aucune transaction trouv\xE9e pour ce Wameet" });
  });
  app2.post("/api/wameet/report-abuse", async (req, res) => {
    try {
      const { wameetId, reporterId, reportedParticipantId, reason } = req.body;
      if (!wameetId) {
        res.status(400).json({ error: "wameetId est obligatoire pour signaler un abus." });
        return;
      }
      const result = await reportWameetAbuse({
        wameetId,
        reporterId,
        reportedParticipantId,
        reason
      });
      res.status(200).json(result);
    } catch (error) {
      console.error("[API REPORT ABUSE ERROR]", error);
      res.status(500).json({ error: error?.message || "Erreur serveur lors du signalement" });
    }
  });
}
async function reportWameetAbuse(params) {
  const { wameetId, reporterId, reportedParticipantId, reason } = params;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  let consultation = localConsultations.get(wameetId);
  if (consultation) {
    consultation.status = "FAILED";
    localConsultations.set(wameetId, consultation);
  }
  try {
    if (db) {
      const wameetRef = (0, import_firestore6.doc)((0, import_firestore6.collection)(db, "wameets"), wameetId);
      await (0, import_firestore6.setDoc)(
        wameetRef,
        {
          status: "REPORTED_ABUSE",
          reportedAt: nowIso,
          reportedBy: reporterId || "victim",
          reportedParticipantId: reportedParticipantId || "other_party",
          reason: reason || "Signalement d'urgence en direct",
          penaltyScore: -500
        },
        { merge: true }
      );
      const consultRef = (0, import_firestore6.doc)((0, import_firestore6.collection)(db, "wameet_consultations"), wameetId);
      await (0, import_firestore6.setDoc)(
        consultRef,
        {
          status: "REPORTED_ABUSE",
          reportedAt: nowIso
        },
        { merge: true }
      );
      if (reportedParticipantId) {
        const userRef = (0, import_firestore6.doc)((0, import_firestore6.collection)(db, "wameet_profiles"), reportedParticipantId);
        const userSnap = await (0, import_firestore6.getDoc)(userRef);
        const currentScore = userSnap.exists() ? userSnap.data().impactScore || 18450 : 18450;
        const newScore = Math.max(0, currentScore - 500);
        await (0, import_firestore6.setDoc)(
          userRef,
          {
            impactScore: newScore,
            lastSanctionAt: nowIso,
            sanctionReason: "REPORTED_ABUSE_DIRECT"
          },
          { merge: true }
        );
        console.log(`[SANCTION BACKEND] Score d'impact de ${reportedParticipantId} r\xE9duit de -500 points (Nouveau score: ${newScore})`);
      }
    }
  } catch (err) {
    console.warn("[ABUSE REPORT ERROR] Fallback local :", err);
  }
  console.log(`[ABUSE REPORT] Wameet ${wameetId} pass\xE9 au statut REPORTED_ABUSE.`);
  return {
    success: true,
    status: "REPORTED_ABUSE",
    penaltyApplied: -500,
    message: "Appel s\xE9curis\xE9. Notre \xE9quipe analyse le signalement."
  };
}

// server.ts
import_dotenv.default.config();
var PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "konkobo_telecom_webhook_secret_key_2026";
function extractThemeFromReq(req) {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)nana_theme=([^;]+)/);
    if (match) {
      const val = decodeURIComponent(match[1]);
      if (val === "dark" || val === "light" || val === "blue") {
        return val;
      }
    }
  }
  return "dark";
}
function injectThemeIntoHtml(html, theme) {
  const isDarkClass = theme === "dark" || theme === "blue" ? " dark" : "";
  const htmlTagReplacement = `<html lang="fr" class="theme-${theme}${isDarkClass}">`;
  const bodyTagReplacement = `<body class="theme-${theme} bg-primary text-body antialiased selection:bg-blue-600/30 selection:text-white min-h-[100dvh]">`;
  let processed = html.replace(/<html[^>]*>/i, htmlTagReplacement);
  processed = processed.replace(/<body[^>]*>/i, bodyTagReplacement);
  return processed;
}
var PORT = 3e3;
var aiClient2 = null;
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiClient2) {
    aiClient2 = new import_genai2.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient2;
}
async function callGeminiWithRetry(ai, request) {
  const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest"];
  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: request.contents,
          config: request.config
        });
        if (response && response.text) {
          return { text: response.text, modelUsed: model };
        }
      } catch (err) {
        const isTemporary = err?.status === "UNAVAILABLE" || err?.status === 503 || err?.toString?.().includes("503") || err?.toString?.().includes("demand") || err?.toString?.().includes("UNAVAILABLE") || err?.toString?.().includes("RESOURCE_EXHAUSTED") || err?.toString?.().includes("429");
        if (isTemporary && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
        break;
      }
    }
  }
  return null;
}
async function startServer() {
  const app2 = (0, import_express.default)();
  app2.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  app2.use(import_express.default.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });
  app2.post("/api/get-upload-url", async (req, res) => {
    try {
      let fileName = req.body?.fileName;
      let fileType = req.body?.fileType;
      if ((!fileName || !fileType) && req.rawBody) {
        const rawStr = req.rawBody.toString("utf8");
        const nameMatch = rawStr.match(/name="fileName"[^\r\n]*[\r\n]+([^\r\n]+)/);
        const typeMatch = rawStr.match(/name="fileType"[^\r\n]*[\r\n]+([^\r\n]+)/);
        if (nameMatch) fileName = nameMatch[1].trim();
        if (typeMatch) fileType = typeMatch[1].trim();
      }
      fileName = fileName || `video_${Date.now()}.mp4`;
      fileType = fileType || "video/mp4";
      const region = process.env.AWS_REGION || "eu-west-1";
      const bucket = process.env.AWS_BUCKET_NAME || "nanasore-videos";
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      const fileKey = `videos/${Date.now()}-${fileName}`;
      const finalVideoUrl = `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;
      if (!accessKeyId || !secretAccessKey) {
        console.warn("[API S3 UPLOAD] Variables AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY non d\xE9tect\xE9es dans .env, mode simulation pr\xEAt.");
        return res.json({
          uploadUrl: `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}?mock=true`,
          finalVideoUrl
        });
      }
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
      const s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey
        }
      });
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: fileKey,
        ContentType: fileType
      });
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
      return res.json({ uploadUrl, finalVideoUrl });
    } catch (err) {
      console.error("[API S3 UPLOAD] Erreur g\xE9n\xE9ration lien pr\xE9-sign\xE9 :", err);
      return res.status(500).json({ error: err?.message || "Erreur interne" });
    }
  });
  attachSmartHaggleRoutes(app2);
  attachTontineRoutes(app2);
  attachPosSyncRoutes(app2);
  attachMicroRelayRoutes(app2);
  attachSwarmLogisticsRoutes(app2);
  attachFarotageRoutes(app2);
  attachCagnotteRoutes(app2);
  attachDiscoverySearchRoutes(app2);
  attachVipSubscriptionRoutes(app2);
  attachWameetSyncRoutes(app2);
  attachPulseNotificationRoutes(app2);
  attachResonanceRoutes(app2);
  attachWameetPremiumRoutes(app2);
  app2.all("/aws-lambda*", async (req, res) => {
    try {
      const lambdaUrl = "https://lvl7sz2hihrrp6jdui35hm7qnq0zxbkl.lambda-url.eu-north-1.on.aws/";
      const subPath = req.url.replace(/^\/aws-lambda/, "");
      const targetUrl = subPath ? `${lambdaUrl}${subPath.replace(/^\//, "")}` : lambdaUrl;
      const headers = {
        "Accept": "application/json"
      };
      if (req.headers["content-type"]) {
        headers["Content-Type"] = req.headers["content-type"];
      } else {
        headers["Content-Type"] = "application/json";
      }
      const fetchOptions = {
        method: req.method,
        headers
      };
      if (req.method !== "GET" && req.method !== "HEAD") {
        fetchOptions.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      }
      const response = await fetch(targetUrl, fetchOptions);
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        return res.status(response.status).json(data);
      } else {
        const text = await response.text();
        return res.status(response.status).send(text);
      }
    } catch (err) {
      console.error("[SERVER AWS LAMBDA PROXY ERROR]", err);
      return res.status(500).json({ error: err.message || "Erreur proxy AWS Lambda c\xF4t\xE9 serveur" });
    }
  });
  app2.post("/api/ai/lambda", async (req, res) => {
    try {
      const lambdaUrl = req.headers["x-target-lambda-url"] || process.env.AWS_LAMBDA_URL || process.env.LAMBDA_URL || process.env.VITE_AWS_LAMBDA_URL;
      if (!lambdaUrl) {
        const replicateToken = process.env.REPLICATE_API_TOKEN;
        if (replicateToken) {
          try {
            const { type = "image", prompt = "", image } = req.body || {};
            const Replicate = (await import("replicate")).default;
            const replicate = new Replicate({ auth: replicateToken });
            if (type === "image") {
              const output = await replicate.run("black-forest-labs/flux-schnell", {
                input: { prompt, aspect_ratio: "1:1" }
              });
              return res.json({ success: true, output });
            } else if (type === "text") {
              const output = await replicate.run("meta/meta-llama-3-8b-instruct", {
                input: { prompt }
              });
              return res.json({ success: true, output });
            } else if (type === "video") {
              const inputPayload = { prompt };
              if (image) inputPayload.image = image;
              const output = await replicate.run("minimax/video-01", { input: inputPayload });
              return res.json({ success: true, output });
            }
          } catch (repErr) {
            console.error("[REPLICATE DIRECT FALLBACK ERROR]", repErr);
            return res.status(500).json({ error: repErr.message || "Erreur Replicate" });
          }
        }
        return res.status(400).json({
          error: "URL du backend AWS Lambda non configur\xE9e. Veuillez d\xE9finir AWS_LAMBDA_URL dans le fichier .env ou dans les param\xE8tres du g\xE9n\xE9rateur."
        });
      }
      const response = await fetch(lambdaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        return res.status(response.status).json(data);
      } else {
        const text = await response.text();
        return res.status(response.status).json({
          error: text.trim().startsWith("<") ? `Erreur backend AWS Lambda (${response.status} : ${response.statusText || "Serveur indisponible"})` : text
        });
      }
    } catch (err) {
      console.error("[NANA GENERATOR LAMBDA PROXY ERROR]", err);
      return res.status(500).json({ error: err.message || "Erreur de communication avec le backend." });
    }
  });
  app2.post("/api/webhooks/payment", (req, res) => {
    try {
      const providedSignature = req.headers["x-webhook-signature"] || req.headers["x-fedapay-signature"] || req.headers["x-cinetpay-signature"] || req.headers["x-signature-sha256"];
      if (!providedSignature) {
        console.error("[SECURITY ALERT] Requ\xEAte webhook rejet\xE9e : Signature cryptographique absente.");
        return res.status(401).json({
          error: "Acc\xE8s non autoris\xE9 : Signature cryptographique HMAC SHA-256 absente."
        });
      }
      const rawPayload = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body);
      const hmac = import_crypto11.default.createHmac("sha256", PAYMENT_WEBHOOK_SECRET);
      hmac.update(rawPayload);
      const expectedSignature = hmac.digest("hex");
      let isSignatureValid = false;
      try {
        const provBuf = Buffer.from(String(providedSignature).trim().toLowerCase(), "utf8");
        const expBuf = Buffer.from(String(expectedSignature).trim().toLowerCase(), "utf8");
        if (provBuf.length === expBuf.length) {
          isSignatureValid = import_crypto11.default.timingSafeEqual(provBuf, expBuf);
        }
      } catch (cryptoErr) {
        console.error("[SECURITY ERROR] Erreur comparaison signature:", cryptoErr);
        isSignatureValid = false;
      }
      if (!isSignatureValid) {
        console.error("[SECURITY ALERT] Alt\xE9ration ou signature invalide d\xE9tect\xE9e.");
        return res.status(401).json({
          error: "Acc\xE8s rejet\xE9 : Signature cryptographique HMAC invalide."
        });
      }
      const payload = req.body || {};
      const txData = payload.data || payload;
      const txId = txData.txId || txData.transactionId || txData.id;
      const userId = txData.userId || "student-demo";
      const courseId = txData.courseId || "telecom-fintech-masterclass";
      const amount = Number(txData.amount || 45e3);
      const provider = txData.provider || "WAVE";
      console.log(`[SUCCESS] Webhook valid\xE9 par HMAC SHA-256 pour ${userId} sur ${courseId} (Tx: ${txId})`);
      return res.status(200).json({
        success: true,
        txId,
        userId,
        courseId,
        amount,
        provider,
        status: "COMPLETED",
        message: "Signature cryptographique v\xE9rifi\xE9e. Droits d'acc\xE8s enregistr\xE9s par l'autorit\xE9 serveur."
      });
    } catch (err) {
      console.error("[FATAL WEBHOOK ERROR]", err);
      return res.status(500).json({
        error: "Erreur interne traitement webhook",
        details: err.message
      });
    }
  });
  app2.post("/api/ai/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType = "audio/wav" } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ error: "Flux audio manquant" });
      }
      const ai = getGenAI();
      if (!ai) {
        return res.json({ success: false, text: "", message: "Gemini API non configur\xE9e (mode local actif)" });
      }
      let cleanMime = (mimeType || "audio/wav").split(";")[0].trim().toLowerCase();
      if (!cleanMime || cleanMime === "audio/undefined") cleanMime = "audio/wav";
      const promptText = "Tu es le transcripteur vocal ultra-pr\xE9cis d'une caisse de boutique africaine (monnaie Franc CFA). \xC9coute attentivement cet enregistrement audio et transcris EXACTEMENT en fran\xE7ais les articles, quantit\xE9s et prix dict\xE9s par le g\xE9rant ou le client (exemples typiques : 'Deux paquets de sucre \xE0 500 francs et une bo\xEEte de lait', '2 pains et 1 lait 800', 'trois laits 1500', 'un sac de riz 25kg et deux bouteilles d'huile'). R\xE9ponds UNIQUEMENT avec la phrase exacte transcrite, sans guillemets, sans politesse et sans balisage markdown. Si l'enregistrement est du silence ou inaudible, r\xE9ponds par une cha\xEEne vide.";
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: audioBase64
              }
            },
            { text: promptText }
          ]
        }
      });
      const text = response?.text?.trim() || "";
      res.json({
        success: true,
        text,
        source: "gemini-3.8-flash"
      });
    } catch (err) {
      console.warn("Erreur transcription en ligne Gemini, passage hors-ligne :", err?.message);
      res.json({ success: false, text: "", message: err?.message || "Erreur transcription" });
    }
  });
  app2.post("/api/ai/advisor", async (req, res) => {
    try {
      const { inventory = [], customers = [], sales = [], losses = [] } = req.body;
      const ai = getGenAI();
      const hasApiKey = Boolean(ai);
      const totalStockItems = inventory.length;
      const lowStockProducts = inventory.filter((p) => p.stock < 5);
      const totalDebt = customers.reduce((sum, c) => sum + (c.totalDebt || 0), 0);
      const overdueCustomers = customers.filter((c) => c.status === "OVERDUE" || c.totalDebt > 15e3);
      if (ai) {
        try {
          const prompt = `Tu es le copilote IA expert en gestion de boutique d'alimentation g\xE9n\xE9rale en Afrique de l'Ouest/Centrale (monnaie F CFA).
Analyse ces donn\xE9es r\xE9elles de la boutique :
- Articles en stock : ${totalStockItems} r\xE9f\xE9rences. Articles en alerte rupture (< 5 unit\xE9s) : ${lowStockProducts.map((p) => `${p.name} (${p.stock} restant)`).join(", ") || "Aucun"}
- Sucre : stock actuel de ${inventory.find((p) => p.id === "sucre")?.stock ?? 50} unit\xE9s.
- Dettes clients : Total impay\xE9s = ${totalDebt} F CFA. Clients critiques : ${overdueCustomers.map((c) => `${c.name} (${c.totalDebt} F CFA, retard ${c.daysOverdue || 14}j)`).join(", ") || "Aucun"}
- Ventes enregistr\xE9es r\xE9cemment : ${sales.length} ventes.
- Pertes/Casse : ${losses.length} d\xE9clarations.

Donne une analyse claire sous format JSON strict avec la structure suivante :
{
  "summary": "synth\xE8se en 2 phrases de la sant\xE9 de la boutique",
  "alerts": [
    {
      "type": "RUPTURE",
      "title": "Alerte Rupture",
      "message": "Attention, vous allez manquer de Sucre dans 2 jours selon vos ventes r\xE9centes et autres.",
      "severity": "HIGH",
      "action": "Commander Sucre"
    },
    {
      "type": "IMPAYE",
      "title": "Alerte Impay\xE9s",
      "message": "Mamadou a d\xE9pass\xE9 son plafond de cr\xE9dit de 15 000 F CFA.",
      "severity": "CRITICAL",
      "action": "Relancer Mamadou"
    }
  ],
  "topProducts": [
    { "name": "Riz 25kg", "margin": 3000, "note": "Meilleure marge unitaire" },
    { "name": "Lait", "margin": 150, "note": "Forte rotation quotidienne" },
    { "name": "Huile 1L", "margin": 200, "note": "Indispensable cuisine" }
  ],
  "reinvestmentSuggestion": {
    "title": "Opportunit\xE9 du Vendredi",
    "message": "Vos ventes de pain augmentent de 20% le vendredi, pensez \xE0 commander plus de beurre.",
    "expectedImpact": "+15% de marge sur le petit-d\xE9jeuner"
  },
  "concreteActions": [
    {
      "title": "S\xE9curiser les cr\xE9ances clients critiques",
      "description": "Exiger au moins 50% d'acompte sur tout nouveau cr\xE9dit pour Mamadou et geler les nouveaux cr\xE9dits non urgents.",
      "estimatedGain": "+45 000 F CFA de tr\xE9sorerie"
    },
    {
      "title": "R\xE9approvisionner le Sucre et les conserves avant le week-end",
      "description": "Le sucre s'\xE9puise vite et la tomate/sardine sont en rupture imminente. R\xE9approvisionner 2 cartons pour ne pas refuser de clients.",
      "estimatedGain": "+25 000 F CFA de ventes pr\xE9serv\xE9es"
    },
    {
      "title": "Pack Petit-D\xE9jeuner matinal (Pain + Beurre/Lait)",
      "description": "Capitaliser sur la hausse du vendredi en proposant du beurre frais et du lait en bo\xEEte aux acheteurs de pain.",
      "estimatedGain": "+15% de panier moyen le matin"
    }
  ]
}
R\xE9ponds UNIQUEMENT avec un JSON valide, sans balises markdown additionnelles si possible.`;
          const geminiResult = await callGeminiWithRetry(ai, {
            contents: prompt,
            config: {
              responseMimeType: "application/json"
            }
          });
          if (geminiResult && geminiResult.text) {
            try {
              const parsed = JSON.parse(geminiResult.text.trim());
              return res.json({
                success: true,
                source: geminiResult.modelUsed,
                data: parsed
              });
            } catch {
            }
          }
        } catch {
        }
      }
      const smartResult = {
        summary: `Votre boutique a ${totalStockItems} r\xE9f\xE9rences actives avec ${lowStockProducts.length} articles en rupture imminente et ${totalDebt.toLocaleString()} F CFA d'impay\xE9s \xE0 s\xE9curiser.`,
        alerts: [
          {
            type: "RUPTURE",
            title: "Alerte Rupture",
            message: "Attention, vous allez manquer de Sucre dans 2 jours selon vos ventes r\xE9centes et autres.",
            severity: "HIGH",
            action: "Commander Sucre",
            productId: "sucre"
          },
          {
            type: "IMPAYE",
            title: "Alerte Impay\xE9s",
            message: "Mamadou a d\xE9pass\xE9 son plafond de cr\xE9dit de 15 000 F CFA.",
            severity: "CRITICAL",
            action: "Relancer Mamadou",
            customerId: "cust-mamadou",
            amount: 35e3
          }
        ],
        topProducts: [
          {
            name: "Riz 25kg",
            costPrice: 14500,
            sellingPrice: 17500,
            margin: 3e3,
            marginPercent: "17.1%",
            note: "Plus forte marge unitaire brute du magasin"
          },
          {
            name: "Lait (bo\xEEte)",
            costPrice: 350,
            sellingPrice: 500,
            margin: 150,
            marginPercent: "30.0%",
            note: "Forte rotation quotidienne et fid\xE9lisation"
          },
          {
            name: "Huile 1L",
            costPrice: 900,
            sellingPrice: 1100,
            margin: 200,
            marginPercent: "18.2%",
            note: "Produit de base \xE0 forte r\xE9currence"
          }
        ],
        reinvestmentSuggestion: {
          title: "Suggestion de r\xE9investissement",
          message: "Vos ventes de pain augmentent de 20% le vendredi, pensez \xE0 commander plus de beurre.",
          reason: "Les clients achetant le pain le matin recherchent syst\xE9matiquement du beurre ou du lait. Vendre le beurre en accompagnement double la marge du ticket.",
          expectedImpact: "+18 000 F CFA de marge suppl\xE9mentaire le week-end"
        },
        concreteActions: [
          {
            title: "1. Geler le cr\xE9dit de Mamadou et r\xE9cup\xE9rer 20 000 F CFA",
            description: "Mamadou a 35 000 F CFA d'impay\xE9 (d\xE9passement de 15 000 F CFA). Exigez un versement partiel aujourd'hui avant tout nouvel achat \xE0 cr\xE9dit pour alimenter la caisse.",
            estimatedGain: "+20 000 F CFA de tr\xE9sorerie disponible",
            tag: "Tr\xE9sorerie Imm\xE9diate"
          },
          {
            title: "2. R\xE9approvisionner le Sucre et les 3 produits critiques",
            description: "Le Sucre sera en rupture d'ici 48h, et la Tomate (3 restants), Sardine (2 restants) et Spaghetti (4 restants) sont au niveau critique. Un arrivage rapide \xE9vite 35 000 F CFA de ventes perdues.",
            estimatedGain: "+35 000 F CFA de chiffre d'affaires s\xE9curis\xE9",
            tag: "Anti-Rupture"
          },
          {
            title: "3. Activer la suggestion crois\xE9e Pain + Beurre d\xE8s jeudi soir",
            description: "Anticiper le pic de 20% sur le pain du vendredi en commandant 1 carton de beurre et 1 douzaine de lait concentr\xE9 pour doper la marge matinale.",
            estimatedGain: "+15 000 F CFA de b\xE9n\xE9fice net estim\xE9",
            tag: "Rentabilit\xE9 & Marge"
          }
        ]
      };
      res.json({
        success: true,
        source: hasApiKey ? "gemini-fallback" : "local-advisor-engine",
        data: smartResult
      });
    } catch (err) {
      console.error("Advisor route error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app2.post("/api/ai/chat", async (req, res) => {
    try {
      const { message = "", context = {} } = req.body;
      if (!message || message.trim() === "") {
        return res.status(400).json({ error: "Message requis" });
      }
      const ai = getGenAI();
      if (ai) {
        try {
          const systemInstruction = `Tu es l'Agent IA Gemini, conseiller financier et expert en gestion de boutique d'alimentation g\xE9n\xE9rale en Afrique de l'Ouest/Centrale (monnaie: Franc CFA / F CFA).
Ton r\xF4le est d'aider le boutiquier \xE0 maximiser ses b\xE9n\xE9fices, g\xE9rer ses cr\xE9dits clients (cahier de dettes), \xE9viter les ruptures de stock, calculer ses vraies marges et n\xE9gocier avec ses fournisseurs grossistes.
R\xE8gles de communication :
- Sois direct, chaleureux, bienveillant et pratique (termes simples, exemples concrets de boutique).
- Tous les montants doivent \xEAtre formul\xE9s en F CFA.
- Structure tes r\xE9ponses avec des puces courtes et des actions faciles \xE0 appliquer d\xE8s aujourd'hui.
- Contexte boutique actuel : Total impay\xE9s = ${context.totalDebt || 108e3} F CFA, Articles en rupture imminente = ${context.lowStockCount || 3}, Ventes du jour = ${context.todaySales || 45e3} F CFA.`;
          const geminiResult = await callGeminiWithRetry(ai, {
            contents: message,
            config: {
              systemInstruction,
              temperature: 0.7
            }
          });
          if (geminiResult && geminiResult.text) {
            return res.json({
              success: true,
              source: geminiResult.modelUsed,
              reply: geminiResult.text
            });
          }
        } catch {
        }
      }
      const q = message.toLowerCase();
      let reply = "";
      if (q.includes("impay\xE9") || q.includes("dette") || q.includes("cr\xE9dit") || q.includes("recouvrer")) {
        reply = `**\u{1F4A1} Strat\xE9gie pour r\xE9duire vos impay\xE9s sans perdre vos clients :**

1. **Fixez un plafond strict par client** : Fixez par exemple un maximum de 15 000 F CFA pour les fid\xE8les et 5 000 F CFA pour les nouveaux.
2. **Exigez un acompte de 50%** : D\xE8s qu'un client avec une dette ancienne (comme Mamadou \xE0 35 000 F CFA) souhaite acheter \xE0 nouveau, demandez-lui de verser la moiti\xE9 de sa dette en cash pour d\xE9bloquer le prochain achat.
3. **Relance amicale mais r\xE9guli\xE8re par WhatsApp/SMS** : Envoyez un message courtois la veille du jour de paie (le 28 du mois ou les samedis).
4. **R\xE9compensez les bons payeurs** : Un client qui r\xE8gle \xE0 temps peut b\xE9n\xE9ficier d'un petit bonus (ex: un stick de caf\xE9 offert).`;
      } else if (q.includes("rentable") || q.includes("marge") || q.includes("prix") || q.includes("b\xE9n\xE9fice")) {
        reply = `**\u{1F4C8} Comment maximiser vos marges et calculer votre vrai b\xE9n\xE9fice :**

1. **Distinguez Chiffre d'Affaires et B\xE9n\xE9fice Net** : Si vous vendez pour 100 000 F CFA de marchandises achet\xE9es \xE0 80 000 F CFA, votre marge brute est de 20 000 F CFA. D\xE9duisez vos frais (\xE9lectricit\xE9, sachets, casse) pour avoir votre b\xE9n\xE9fice net r\xE9el.
2. **Vos produits \xE0 plus forte marge** :
   - *Riz 25kg* : +3 000 F CFA par sac (gros volume de cash).
   - *Lait en bo\xEEte* : 30% de marge brute (+150 F CFA par bo\xEEte).
   - *Savon de m\xE9nage* : 31% de marge brute (+110 F CFA par morceau).
3. **Ne bradez jamais les produits de d\xE9pannage du soir** : Les clients qui ach\xE8tent tard acceptent volontiers le prix juste car vous leur rendez service.`;
      } else if (q.includes("pain") || q.includes("beurre") || q.includes("vendredi") || q.includes("reinvestir")) {
        reply = `**\u{1F950} Optimisation Ventes du Vendredi & R\xE9investissement :**

- **Constat** : Vos ventes de pain progressent de +20% le vendredi matin.
- **Action concr\xE8te** : Commandez du beurre en portion ou en plaquette d\xE8s le jeudi apr\xE8s-midi.
- **Argument de vente** : En proposant le beurre ou du lait concentr\xE9 au moment o\xF9 le client demande sa baguette, 4 clients sur 10 prennent l'accompagnement, ce qui fait passer un panier de 150 F CFA \xE0 550 F CFA (+266% de chiffre d'affaires sur ce ticket !).`;
      } else if (q.includes("grossiste") || q.includes("fournisseur") || q.includes("achat") || q.includes("commander")) {
        reply = `**\u{1F4E6} Conseil d'achat et n\xE9gociation grossistes :**

1. **Achetez toujours par carton plein pour les indispensables** (Sucre, Lait, Huile, Savon). L'achat \xE0 l'unit\xE9 chez le demi-grossiste vous fait perdre entre 5% et 12% de marge.
2. **N\xE9gociez un d\xE9lai de paiement de 7 jours** : Si vous r\xE9glez vos grossistes apr\xE8s avoir encaiss\xE9 le cash de vos clients du week-end, vous travaillez avec la tr\xE9sorerie du fournisseur !
3. **Surveillez les dates de p\xE9remption** d\xE8s la r\xE9ception du carton pour ne jamais accepter un lot proche de l'expiration.`;
      } else {
        reply = `**\u2728 Analyse financi\xE8re de votre boutique par Gemini :**

- **Priorit\xE9 1 (Liquidit\xE9s)** : Vous avez plus de 100 000 F CFA de dettes dans votre carnet. R\xE9cup\xE9rer un quart de cette somme (25 000 F CFA) vous donne le cash n\xE9cessaire pour r\xE9approvisionner le Sucre et les conserves sans toucher \xE0 votre r\xE9serve personnelle.
- **Priorit\xE9 2 (Anti-Rupture)** : Le Sucre et les produits \xE0 moins de 5 unit\xE9s (Tomate, Sardines, Spaghetti) doivent \xEAtre command\xE9s d'urgence pour ne pas perdre vos clients au profit de la boutique voisine.
- **Priorit\xE9 3 (Opportunit\xE9)** : D\xE9veloppez les ventes associ\xE9es (Pain + Beurre/Lait) le vendredi matin pour booster la marge moyenne par client.`;
      }
      res.json({
        success: true,
        source: "local-financial-engine",
        reply
      });
    } catch (err) {
      console.error("Chat route error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app2.post("/api/ai/course-tutor", async (req, res) => {
    try {
      const {
        courseTitle = "Formation Professionnelle",
        courseCategory = "E-Learning & Syst\xE8mes T\xE9l\xE9com",
        instructorName = "Ibrahim Pousbila Konkobo",
        modules = [],
        price = 0,
        message = "",
        history = []
      } = req.body;
      if (!message || message.trim() === "") {
        return res.status(400).json({ error: "Message requis" });
      }
      const ai = getGenAI();
      if (ai) {
        try {
          const modulesSummary = Array.isArray(modules) ? modules.map((m, i) => `Module ${i + 1}: ${m.title || m}`).join(", ") : "Modules pratiques & \xE9tudes de cas";
          const systemInstruction = `Tu es "Tinnela AI Tutor", le Conseiller P\xE9dagogique Virtuel et l'assistant officiel de NaNa Academy pour la formation : "${courseTitle}".
Instructeur principal : ${instructorName}.
Cat\xE9gorie : ${courseCategory}.
Tarif officiel : ${price > 0 ? `${Number(price).toLocaleString("fr-FR")} F CFA` : "Offre sp\xE9ciale"}.
Programme des modules : ${modulesSummary}.

Ton objectif :
1. R\xE9pondre avec pr\xE9cision, clart\xE9 et bienveillance aux questions des prospects ou \xE9tudiants h\xE9sitants.
2. Lever leurs objections (peur du niveau technique, pr\xE9requis, compatibilit\xE9 smartphone Android, valeur du certificat homologu\xE9, paiement Wave/Orange Money/Moov/MTN).
3. Rester concis (2 \xE0 4 paragraphes maximum), chaleureux et professionnel.
4. Terminer TOUJOURS ta r\xE9ponse par un appel \xE0 l'action (Call-To-Action) encourageant et percutant pour s'inscrire d\xE8s maintenant.`;
          const contents = [
            ...Array.isArray(history) ? history.map((h) => ({
              role: h.role === "model" ? "model" : "user",
              parts: [{ text: h.text || h.message || "" }]
            })) : [],
            {
              role: "user",
              parts: [{ text: message }]
            }
          ];
          const geminiResult = await callGeminiWithRetry(ai, {
            contents,
            config: {
              systemInstruction,
              temperature: 0.7
            }
          });
          if (geminiResult && geminiResult.text) {
            return res.json({
              success: true,
              source: geminiResult.modelUsed,
              reply: geminiResult.text
            });
          }
        } catch (err) {
          console.warn("[COURSE_TUTOR] Gemini upstream notice:", err?.message);
        }
      }
      const q = message.toLowerCase();
      let reply = "";
      if (q.includes("d\xE9butant") || q.includes("niveau") || q.includes("pr\xE9requis") || q.includes("difficile")) {
        reply = `**Absolument, cette formation est 100% accessible aux d\xE9butants !** \u{1F393}

${instructorName} a con\xE7u ce cours avec une p\xE9dagogie progressive par la pratique : vous d\xE9marrez des fondamentaux pour monter en comp\xE9tence pas \xE0 pas, sans jargon complexe.

Chaque notion est illustr\xE9e par des d\xE9monstrations concr\xE8tes sur smartphone et ordinateur. Vous \xEAtes guid\xE9 de A \xE0 Z.

\u{1F449} **Faites le premier pas aujourd'hui : cliquez sur "S'inscrire en 1-Clic" pour s\xE9curiser votre place !**`;
      } else if (q.includes("paiement") || q.includes("payer") || q.includes("wave") || q.includes("orange") || q.includes("moov") || q.includes("mtn")) {
        reply = `**Les paiements sont 100% s\xE9curis\xE9s et adapt\xE9s au march\xE9 africain !** \u{1F4B3}

Vous pouvez r\xE9gler instantan\xE9ment par **Wave, Orange Money, Moov Money ou MTN Mobile Money** en Francs CFA, sans carte bancaire internationale.

D\xE8s la validation de votre transfert, votre acc\xE8s au Campus Virtuel est d\xE9bloqu\xE9 imm\xE9diatement et automatiquement.

\u{1F449} **Rejoignez la promotion d\xE8s maintenant en cliquant sur le bouton d'inscription !**`;
      } else if (q.includes("certificat") || q.includes("dipl\xF4me") || q.includes("attestation")) {
        reply = `**Oui, vous recevez un Certificat Professionnel Officiel !** \u{1F4DC}

\xC0 l'issue des modules et de la validation des quiz pratiques, NaNa Academy d\xE9livre votre attestation certifi\xE9e avec identifiant unique v\xE9rifiable et signature de ${instructorName}.

Ce certificat valorise vos comp\xE9tences aupr\xE8s des employeurs, clients et partenaires de la zone UEMOA.

\u{1F449} **Validez vos comp\xE9tences et d\xE9crochez votre certificat officiel en vous inscrivant maintenant !**`;
      } else if (q.includes("dur\xE9e") || q.includes("temps") || q.includes("heure") || q.includes("quand")) {
        reply = `**Vous apprenez \xE0 votre propre rythme, sans pression !** \u23F1\uFE0F

L'acc\xE8s est illimit\xE9 24h/24 et 7j/7 \xE0 vie. Que vous ayez 30 minutes par jour ou le week-end, vous progressez \xE0 votre convenance sur mobile ou PC.

\u{1F449} **Ne remettez pas votre mont\xE9e en comp\xE9tences \xE0 demain : inscrivez-vous d\xE8s maintenant !**`;
      } else {
        reply = `**Bienvenue sur la formation "${courseTitle}" !** \u{1F680}

Ce programme anim\xE9 par ${instructorName} est ax\xE9 sur les r\xE9sultats r\xE9els et l'autonomie business. Vous y d\xE9couvrirez des m\xE9thodes \xE9prouv\xE9es pour ma\xEEtriser chaque \xE9tape, des bases aux techniques avanc\xE9es.

Toutes les le\xE7ons sont optimis\xE9es pour les connexions mobiles 3G/4G avec support continu.

\u{1F449} **Passez \xE0 l'action d\xE8s aujourd'hui : inscrivez-vous en 1-Clic pour d\xE9buter la premi\xE8re le\xE7on !**`;
      }
      return res.json({
        success: true,
        source: "local-edtech-engine",
        reply
      });
    } catch (err) {
      console.error("Course tutor route error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app2.post("/api/ai/marketing", async (req, res) => {
    try {
      const {
        productName = "",
        keyFeatures = "",
        channel = "DESCRIPTION",
        storeName = "Votre Boutique",
        price = 0
      } = req.body;
      if (!productName || productName.trim() === "") {
        return res.status(400).json({ error: "Le nom du produit est requis" });
      }
      const formattedPrice = price > 0 ? `${Number(price).toLocaleString("fr-FR")} F CFA` : "Prix attractif en boutique";
      const ai = getGenAI();
      if (ai) {
        try {
          let channelPromptDescription = "";
          switch (channel) {
            case "TIKTOK_REELS":
              channelPromptDescription = `un Script Vid\xE9o Court (TikTok / Reels / Shorts, 30 \xE0 45 secondes) ultra-captivant :
- [0-3s] ACCROCHE CHOC VISUELLE ET AUDITIVE : Une phrase directe qui arr\xEAte le scroll imm\xE9diatement (probl\xE8me client ou curiosit\xE9).
- [3-15s] LE PROBL\xC8ME / D\xC9SIR : Pourquoi les clients gal\xE8rent sans ce produit.
- [15-30s] LA D\xC9MO / SOLUTION : Mise en valeur des fonctionnalit\xE9s cl\xE9s (${keyFeatures || "qualit\xE9 premium"}).
- [30-45s] APPEL \xC0 L'ACTION (CTA) : Prix (${formattedPrice}), stock limit\xE9, et invitation \xE0 cliquer sur le lien WhatsApp ou profil pour commander.
Formatte le script avec les indications visuelles [Visuel] et paroles [Voix off].`;
              break;
            case "FACEBOOK":
              channelPromptDescription = `une Publication Facebook & Instagram \xE0 fort engagement commercial :
- Titre accrocheur avec emojis percutants.
- Histoire courte ou situation quotidienne reconnaissable pour le client africain.
- Liste des 3 \xE0 4 b\xE9n\xE9fices concrets sous forme de puces claires.
- Offre irr\xE9sistible avec le prix clair : ${formattedPrice}.
- Appel \xE0 l'action pr\xE9cis (Ex: "Cliquez sur notre lien WhatsApp pour r\xE9server ou commentez 'INFOS'").
- 3 \xE0 5 hashtags cibl\xE9s (#AfriqueCommerce, #${productName.replace(/\s+/g, "")}, etc.).`;
              break;
            case "WHATSAPP_CLOSING":
              channelPromptDescription = `un Message de Closing Commercial WhatsApp pr\xEAt \xE0 envoyer \xE0 un client int\xE9ress\xE9 :
- Salutation chaleureuse, personnalis\xE9e et respectueuse.
- Confirmation enthousiaste de la disponibilit\xE9 de ${productName}.
- R\xE9assurance sur la qualit\xE9, l'authenticit\xE9 et la garantie satisfaction.
- Rappel du prix net (${formattedPrice}) et des options de livraison rapide ou retrait boutique chez ${storeName}.
- Question de closing engageante pour conclure la vente imm\xE9diatement (ex: "Pr\xE9f\xE9rez-vous \xEAtre livr\xE9 cet apr\xE8s-midi \xE0 domicile ou au bureau ?").`;
              break;
            case "DESCRIPTION":
            default:
              channelPromptDescription = `une Description de Produit pour Vitrine Web E-commerce :
- Accroche percutante qui donne envie d'acheter d\xE8s les premiers mots.
- Pr\xE9sentation \xE9l\xE9gante et vendeuse du produit (${productName}).
- Points forts et caract\xE9ristiques d\xE9taill\xE9es (${keyFeatures || "Qualit\xE9 sup\xE9rieure garantie"}).
- Pourquoi choisir ${storeName} (authenticit\xE9, rapidit\xE9, service client r\xE9actif).
- Prix affich\xE9 : ${formattedPrice}.
- Appel \xE0 l'action clair et rassurant pour passer commande.`;
              break;
          }
          const systemInstruction = `Tu es l'Expert en Copywriting et Strat\xE9gie Marketing E-commerce de Nana POS.
Tu es sp\xE9cialis\xE9 dans la vente au d\xE9tail et en ligne pour les commer\xE7ants en Afrique francophone (monnaie : Franc CFA / F CFA).
R\xE8gles :
- Ton style est dynamique, vendeur, engageant et professionnel.
- Utilise des emojis adapt\xE9s avec mod\xE9ration pour structurer visuellement le texte.
- Int\xE8gre naturellement les arguments de vente et la monnaie F CFA.
- Ne mentionne pas de balises techniques ou de m\xE9tadonn\xE9es, fournis directement le texte final pr\xEAt \xE0 \xEAtre publi\xE9 ou envoy\xE9 par le commer\xE7ant.`;
          const prompt = `G\xE9n\xE8re ${channelPromptDescription}
Donn\xE9es du produit :
- Nom de l'article : ${productName}
- Caract\xE9ristiques cl\xE9s fournies : ${keyFeatures || "Article de qualit\xE9 sup\xE9rieure, disponible en boutique."}
- Boutique vendeuse : ${storeName}
- Prix : ${formattedPrice}`;
          const geminiResult = await callGeminiWithRetry(ai, {
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.7
            }
          });
          if (geminiResult && geminiResult.text) {
            return res.json({
              success: true,
              source: geminiResult.modelUsed,
              channel,
              copyText: geminiResult.text.trim()
            });
          }
        } catch (apiErr) {
          console.warn("Gemini marketing generation fallback:", apiErr);
        }
      }
      let fallbackCopy = "";
      const safeFeatures = keyFeatures ? keyFeatures.trim() : "Qualit\xE9 garantie, satisfaction assur\xE9e";
      switch (channel) {
        case "TIKTOK_REELS":
          fallbackCopy = `\u{1F3AC} [SCRIPT TIKTOK / REELS : ${productName.toUpperCase()}]

[0-3s | Visuel : Plan serr\xE9 sur le produit avec un geste dynamique]
\u{1F5E3}\uFE0F Voix Off : "Attendez ! Si vous cherchez le meilleur pour votre quotidien, regardez ceci..."

[3-15s | Visuel : D\xE9monstration de l'utilisation en situation r\xE9elle]
\u{1F5E3}\uFE0F Voix Off : "Fini les produits de mauvaise qualit\xE9 qui ne durent pas ! D\xE9couvrez ${productName}. C'est exactement ce qu'il vous faut pour faire la diff\xE9rence."

[15-30s | Visuel : Gros plan sur les d\xE9tails et fonctionnalit\xE9s]
\u{1F5E3}\uFE0F Voix Off : "Pourquoi tout le monde en parle ?
\u2728 ${safeFeatures.replace(/\n/g, " ")}
C'est certifi\xE9, test\xE9 et approuv\xE9 par nos clients !"

[30-45s | Visuel : Le commer\xE7ant tenant le produit avec le sourire]
\u{1F5E3}\uFE0F Voix Off : "Disponible d\xE8s maintenant \xE0 seulement ${formattedPrice} chez ${storeName} ! Attention, les stocks partent tr\xE8s vite. Cliquez sur le lien WhatsApp dans notre bio pour commander avant la rupture !" \u{1F525}\u{1F4E6}`;
          break;
        case "FACEBOOK":
          fallbackCopy = `\u{1F525} ARRIVAGE EXCLUSIF CHEZ ${storeName.toUpperCase()} ! \u{1F525}

Vous nous l'avez demand\xE9, il est enfin disponible ! D\xE9couvrez d\xE8s aujourd'hui :
\u{1F449} *${productName}*

\u{1F4A1} Ce qui fait toute la diff\xE9rence :
\u2705 ${safeFeatures.replace(/\n/g, "\n\u2705 ")}
\u2705 Garantie authenticit\xE9 et satisfaction 100%
\u2705 Disponible imm\xE9diatement en magasin ou en livraison express

\u{1F4B0} Tarif promo exceptionnel : *${formattedPrice}*
\u26A0\uFE0F Stock limit\xE9 selon les arrivages de la semaine !

\u{1F4F2} Comment commander ?
1\uFE0F\u20E3 \xC9crivez-nous directement sur WhatsApp en cliquant sur notre lien
2\uFE0F\u20E3 Ou commentez "JE VEUX" sous ce post et nous vous r\xE9pondons dans la minute !

\u{1F69A} Livraison rapide et s\xE9curis\xE9e. Paiement cash \xE0 la livraison ou par Mobile Money.
#${productName.replace(/[^a-zA-Z0-9]/g, "")} #BoutiqueNana #CommerceLocal #PromoDuJour`;
          break;
        case "WHATSAPP_CLOSING":
          fallbackCopy = `Bonjour et merci pour votre message ! \u{1F60A}

C'est un excellent choix. Nous avons bien en stock l'article *${productName}*.

Voici ce que nos clients appr\xE9cient particuli\xE8rement :
\u{1F48E} ${safeFeatures.replace(/\n/g, " - ")}

\u{1F3F7}\uFE0F *Prix : ${formattedPrice}*
\u{1F4E6} Disponibilit\xE9 : En stock imm\xE9diat chez *${storeName}*

Nous pouvons vous l'exp\xE9dier d\xE8s aujourd'hui avec notre livreur ou vous le r\xE9server en boutique.

\u{1F449} *Souhaitez-vous \xEAtre livr\xE9 directement chez vous ou pr\xE9f\xE9rez-vous passer r\xE9cup\xE9rer votre colis ?* (Indiquez-moi simplement votre quartier ou contact) \u{1F44D}`;
          break;
        case "DESCRIPTION":
        default:
          fallbackCopy = `\u2B50 ${productName.toUpperCase()} - L'EXCELLENCE POUR VOTRE QUOTIDIEN

Offrez-vous ce qu'il y a de meilleur avec *${productName}*. Con\xE7u pour r\xE9pondre aux exigences les plus strictes de durabilit\xE9 et d'efficacit\xE9, ce produit est le choix id\xE9al pour un usage quotidien optimal.

\u2728 CARACT\xC9RISTIQUES PRINCIPALES :
\u2022 ${safeFeatures.replace(/\n/g, "\n\u2022 ")}
\u2022 Qualit\xE9 premium rigoureusement s\xE9lectionn\xE9e par ${storeName}
\u2022 Excellent rapport qualit\xE9-prix

\u{1F3F7}\uFE0F PRIX : ${formattedPrice}

\u{1F6E1}\uFE0F ENGAGEMENT QUALIT\xC9 :
Produit 100% authentique. Commandez d\xE8s maintenant en toute confiance avec livraison rapide et service client d\xE9di\xE9.`;
          break;
      }
      res.json({
        success: true,
        source: "nana-heuristic-engine",
        channel,
        copyText: fallbackCopy
      });
    } catch (err) {
      console.error("Marketing route error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app2.post("/api/ai/resume-enhance", async (req, res) => {
    try {
      const { title = "", bulletText = "" } = req.body;
      if (!bulletText || !bulletText.trim()) {
        return res.status(400).json({ error: "Texte \xE0 am\xE9liorer manquant" });
      }
      const prompt = `En tant qu'expert international en recrutement RH, optimise les r\xE9alisations professionnelles suivantes pour un CV moderne au poste de "${title || "Professionnel"}".
R\xE8gles strictes :
- Reformule chaque point pour le rendre percutant, orient\xE9 r\xE9sultat avec verbe d'action fort.
- Conserve le sens d'origine sans inventer de faux faits, mais valorise l'impact et la rigueur.
- Renvoie UNIQUEMENT la liste des puces (chaque puce commen\xE7ant par "\u2022 ") sans texte avant ni apr\xE8s.

Texte d'origine :
${bulletText}`;
      const ai = getGenAI();
      if (ai) {
        const result = await callGeminiWithRetry(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
        if (result && result.text) {
          return res.json({
            success: true,
            enhancedText: result.text.trim(),
            source: result.modelUsed
          });
        }
      }
      const lines = bulletText.split("\n").map((l) => l.replace(/^[•\-\*]\s*/, "").trim()).filter(Boolean);
      const enhancedFallback = lines.map((line) => {
        const capitalized = line.charAt(0).toUpperCase() + line.slice(1);
        return `\u2022 Pilotage et r\xE9alisation avec succ\xE8s : ${capitalized}, en garantissant qualit\xE9, conformit\xE9 et respect des d\xE9lais op\xE9rationnels.`;
      }).join("\n");
      res.json({
        success: true,
        enhancedText: enhancedFallback || `\u2022 ${bulletText}`,
        source: "nana-heuristic-engine"
      });
    } catch (err) {
      console.error("Resume enhance route error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app2.post("/api/ai/cover-letter", async (req, res) => {
    try {
      const { candidateName = "", title = "", skills = [], targetCompany = "" } = req.body;
      const skillsStr = Array.isArray(skills) ? skills.slice(0, 6).join(", ") : "";
      const prompt = `R\xE9dige un message court, percutant et professionnel (120 \xE0 180 mots) pour une candidature directe sur LinkedIn ou par email pour le poste de "${title || "Poste vis\xE9"}"${targetCompany ? ` aupr\xE8s de l'entreprise ${targetCompany}` : ""}.
Le candidat s'appelle ${candidateName || "le candidat"}.
Comp\xE9tences cl\xE9s : ${skillsStr || "Gestion, Organisation, Relation client, Esprit d'\xE9quipe"}.
Style : Dynamique, courtois, ax\xE9 sur la valeur ajout\xE9e imm\xE9diate et le professionnalisme.
Renvoie uniquement le texte du message pr\xEAt \xE0 \xEAtre envoy\xE9.`;
      const ai = getGenAI();
      if (ai) {
        const result = await callGeminiWithRetry(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
        if (result && result.text) {
          return res.json({
            success: true,
            letter: result.text.trim(),
            source: result.modelUsed
          });
        }
      }
      const fallbackMsg = `Madame, Monsieur,

Je me permets de vous contacter afin de vous pr\xE9senter ma candidature au poste de ${title || "ce r\xF4le"} au sein de votre structure${targetCompany ? ` chez ${targetCompany}` : ""}.

Fort d'un parcours solide et ax\xE9 sur l'efficacit\xE9 op\xE9rationnelle, je mets \xE0 votre disposition mes comp\xE9tences cl\xE9s en ${skillsStr || "gestion, rigueur et coordination d\u2019activit\xE9s"}. Reconnue pour mon sens de l'organisation et mon adaptabilit\xE9, je suis enthousiaste \xE0 l'id\xE9e d'apporter une contribution concr\xE8te \xE0 vos projets et \xE0 la performance de vos \xE9quipes.

Je me tiens \xE0 votre enti\xE8re disposition pour \xE9changer de vive voix lors d'un entretien.

Bien cordialement,
${candidateName || "Le Candidat"}`;
      res.json({
        success: true,
        letter: fallbackMsg,
        source: "nana-heuristic-engine"
      });
    } catch (err) {
      console.error("Cover letter route error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app2.post("/api/ai/legal", async (req, res) => {
    try {
      const { message = "", history = [], documentContext = "" } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message requis" });
      }
      const ai = getGenAI();
      const systemInstruction = `Tu es l'Expert Juriste d'Affaires & Sp\xE9cialiste en Droit Commercial et Financier International de Nana POS.
Tu es un avocat d'affaires et juriste d'entreprise chevronn\xE9 avec plus de 20 ans d'exp\xE9rience en Afrique de l'Ouest, Afrique Centrale et Commerce International.

Tes domaines de ma\xEEtrise absolue :
1. DROIT DES AFFAIRES OHADA :
   - AUDCG (Acte Uniforme sur le Droit Commercial G\xE9n\xE9ral) : statut du commer\xE7ant, bail \xE0 usage professionnel (bail commercial), cession de fonds de commerce, vente commerciale, prescription.
   - AUSCGIE (Soci\xE9t\xE9s Commerciales et GIE) : SARL, SAS, SA, GIE, statuts, pactes d'associ\xE9s, g\xE9rance, assembl\xE9es, responsabilit\xE9 des dirigeants.
   - AUS (S\xFBret\xE9s) : cautionnement simple et solidaire, garantie autonome \xE0 premi\xE8re demande, nantissement de fonds de commerce, nantissement de cr\xE9ances, clause de r\xE9serve de propri\xE9t\xE9, hypoth\xE8que conventionnelle.
   - AUPCAP (Proc\xE9dures Collectives) : conciliation, r\xE8glement pr\xE9ventif, redressement judiciaire, cessation des paiements.
   - AUCTMR (Transport de Marchandises par Route) : lettre de voiture, responsabilit\xE9 du transporteur.
   - Arbitrage CCJA (Cour Commune de Justice et d'Arbitrage).

2. PRATIQUES BANCAIRES & FINANCI\xC8RES (UEMOA / CEMAC) :
   - R\xE9glementation bancaire BCEAO / BEAC, contr\xF4le des changes, effets de commerce (lettre de change, billet \xE0 ordre, prot\xEAt, ch\xE8ques sans provision).
   - Garanties de paiement, cr\xE9dits documentaires, s\xFBret\xE9s personnelles et bancaires.
   - Droit du travail et conventions collectives (CDD, CDI, pr\xE9avis, licenciement, indemnit\xE9s).

3. COMMERCE INTERNATIONAL :
   - Incoterms 2020 de la CCI (EXW, FCA, CPT, CIP, DAP, DPU, DDP, FAS, FOB, CFR, CIF) : transfert de risques, de frais et formalit\xE9s douani\xE8res.
   - Cr\xE9dits Documentaires (RUU 600) : irr\xE9vocable, confirm\xE9, stand-by.
   - Contrats d'import/export, clauses de r\xE9serve de propri\xE9t\xE9, clauses p\xE9nales, force majeure, clause compromissoire.

R\xE8gles de r\xE9ponse :
- R\xE9ponds avec clart\xE9, rigueur et autorit\xE9 en citant les articles des Actes Uniformes OHADA ou les r\xE8gles de la CCI lorsque c'est pertinent.
- Fournis une analyse concr\xE8te des risques juridiques et financiers.
- Lorsque l'utilisateur demande une clause, donne une r\xE9daction juridique protectrice pr\xEAte \xE0 \xEAtre ins\xE9r\xE9e dans le contrat, avec des crochets [Nom des Parties].
- Structure avec des titres Markdown clairs et des listes \xE0 puces.`;
      if (ai) {
        try {
          const contents = [];
          if (Array.isArray(history) && history.length > 0) {
            const recentHistory = history.slice(-6);
            for (const h of recentHistory) {
              contents.push({
                role: h.role === "assistant" ? "model" : "user",
                parts: [{ text: h.text || h.content || "" }]
              });
            }
          }
          let currentPrompt = message;
          if (documentContext && documentContext.trim()) {
            currentPrompt = `[Contexte du document actuellement examin\xE9 dans DocuSign : "${documentContext.trim()}"]

Question de l'utilisateur :
${message}`;
          }
          contents.push({
            role: "user",
            parts: [{ text: currentPrompt }]
          });
          const geminiResult = await callGeminiWithRetry(ai, {
            contents,
            config: {
              systemInstruction,
              temperature: 0.4
            }
          });
          if (geminiResult && geminiResult.text) {
            return res.json({
              success: true,
              reply: geminiResult.text.trim(),
              source: geminiResult.modelUsed
            });
          }
        } catch (apiErr) {
          console.warn("Gemini Legal AI fallback:", apiErr);
        }
      }
      const q = message.toLowerCase();
      let fallbackReply = "";
      if (q.includes("bail") || q.includes("loyer") || q.includes("locaux")) {
        fallbackReply = `### \u{1F3E2} Analyse Juridique : Bail \xE0 Usage Professionnel (Droit OHADA)

Selon les articles 101 et suivants de l'**Acte Uniforme sur le Droit Commercial G\xE9n\xE9ral (AUDCG)** :

1. **Dur\xE9e et Renouvellement** :
   - Le bail peut \xEAtre \xE0 dur\xE9e d\xE9termin\xE9e ou ind\xE9termin\xE9e.
   - **Droit au renouvellement (Art. 123)** : Le preneur (locataire) qui justifie avoir exploit\xE9 l'activit\xE9 pendant une dur\xE9e minimale de **2 ans** a droit au renouvellement de son bail.
   - Pour exercer ce droit, le preneur doit notifier sa demande de renouvellement par acte d'huissier ou lettre recommand\xE9e avec AR au moins **3 mois avant l'expiration** du bail.

2. **R\xE9siliation et Pr\xE9avis** :
   - En cas de bail \xE0 dur\xE9e ind\xE9termin\xE9e, le cong\xE9 doit \xEAtre signifi\xE9 au moins **6 mois \xE0 l'avance** (Art. 122).
   - En cas de manquement (ex: d\xE9faut de paiement de loyers), une mise en demeure pr\xE9alable d'au moins **1 mois** est obligatoire avant toute action en expulsion.

3. **Clause Recommand\xE9e pour le Propri\xE9taire** :
> *"\xC0 d\xE9faut de paiement d'un seul terme de loyer \xE0 son \xE9ch\xE9ance exacte, ou en cas d'inex\xE9cution d'une clause du pr\xE9sent contrat, et un mois apr\xE8s une mise en demeure par acte d'huissier demeur\xE9e infructueuse conform\xE9ment \xE0 l'article 133 de l'AUDCG OHADA, le pr\xE9sent bail sera r\xE9sili\xE9 de plein droit."*`;
      } else if (q.includes("caution") || q.includes("garantie") || q.includes("s\xFBret\xE9") || q.includes("impay\xE9")) {
        fallbackReply = `### \u2696\uFE0F S\xE9curisation des Cr\xE9ances : Cautionnement vs Garantie Autonome (OHADA AUS)

Conform\xE9ment \xE0 l'**Acte Uniforme portant organisation des S\xFBret\xE9s (AUS)** :

1. **Le Cautionnement (Art. 13 \xE0 38 AUS)** :
   - **Accessoire \xE0 la dette principale** : La caution peut opposer au cr\xE9ancier toutes les exceptions inh\xE9rentes \xE0 la dette (nullit\xE9 du contrat principal, contestation de facture).
   - *Conseil pratique* : Toujours stipuler un **cautionnement solidaire avec renonciation expresse aux b\xE9n\xE9fices de discussion et de division** pour pouvoir poursuivre directement la caution d\xE8s le 1er impay\xE9.

2. **La Garantie Autonome \xE0 Premi\xE8re Demande (Art. 39 \xE0 49 AUS)** :
   - **Incontestablement la s\xFBret\xE9 la plus forte** pour le commerce et les banques dans l'espace OHADA/UEMOA.
   - La banque ou le garant s'engage de fa\xE7on irr\xE9vocable \xE0 payer une somme d\xE9termin\xE9e sur simple demande \xE9crite du b\xE9n\xE9ficiaire, **sans pouvoir diff\xE9rer le paiement ni soulever d'objection** tir\xE9e du contrat de base.
   - L'engagement ne peut \xEAtre bloqu\xE9 qu'en cas de fraude ou d'abus manifeste.

3. **Clause de R\xE9serve de Propri\xE9t\xE9 (Art. 72 \xE0 78 AUS)** :
> *"Le vendeur conserve la propri\xE9t\xE9 exclusive des marchandises livr\xE9es jusqu'au paiement int\xE9gral et effectif du prix en principal et accessoires. En cas de non-paiement \xE0 l'\xE9ch\xE9ance convenue, le vendeur se r\xE9serve le droit d'en exiger la restitution imm\xE9diate aux frais de l'acheteur."*`;
      } else if (q.includes("fob") || q.includes("cif") || q.includes("incoterm") || q.includes("port") || q.includes("douane")) {
        fallbackReply = `### \u{1F6A2} Commerce International : Incoterms 2020 (FOB vs CIF)

1. **FOB (Free On Board - Franco \xE0 bord)** :
   - **Transfert des risques** : Au port de d\xE9part convenu, d\xE8s que la marchandise est charg\xE9e \xE0 bord du navire d\xE9sign\xE9 par l'acheteur.
   - **Frais acheteur** : Le fret maritime principal, l'assurance transport maritime, le d\xE9chargement et le d\xE9douanement \xE0 l'importation au port de destination (ex: Port Autonome d'Abidjan, Dakar, Lom\xE9 ou Cotonou).
   - *Id\xE9al si* : Vous disposez d'un transitaire de confiance capable de n\xE9gocier un taux de fret avantageux.

2. **CIF (Cost, Insurance and Freight - Co\xFBt, Assurance et Fret)** :
   - **Obligation vendeur** : Le vendeur paie le co\xFBt de la marchandise, le fret maritime jusqu'au port de destination et souscrit l'assurance maritime minimale (Clause C des Institute Cargo Clauses).
   - **Attention** : M\xEAme si le vendeur paie le fret et l'assurance, le **transfert des risques a lieu d\xE8s la mise \xE0 bord** au port d'embarquement !

3. **Recommandation Strat\xE9gique pour l'Afrique de l'Ouest/Centrale** :
   - Pour les importations conteneuris\xE9es, privil\xE9giez le **CIP (Carriage and Insurance Paid to)** ou **DAP (Delivered at Place)** qui clarifient les responsabilit\xE9s jusqu'au terminal int\xE9rieur d\xE9douan\xE9.`;
      } else if (q.includes("sarl") || q.includes("sas") || q.includes("associ\xE9") || q.includes("g\xE9rant") || q.includes("capital")) {
        fallbackReply = `### \u{1F3DB}\uFE0F Soci\xE9t\xE9s Commerciales OHADA : SARL vs SAS (AUSCGIE)

Selon l'**Acte Uniforme relatif aux Soci\xE9t\xE9s Commerciales et GIE (AUSCGIE r\xE9vis\xE9)** :

1. **La SARL (Soci\xE9t\xE9 \xE0 Responsabilit\xE9 Limit\xE9e)** :
   - Capital social minimum : Fix\xE9 librement par les statuts (auparavant 1 000 000 F CFA, d\xE9sormais possible \xE0 partir de 100 000 F CFA ou selon la loi nationale de l'\xC9tat partie).
   - Forme juridique rassurante pour les PME familiales et commer\xE7ants. Cession de parts \xE0 des tiers soumise au consentement de la majorit\xE9 des associ\xE9s repr\xE9sentant au moins les 3/4 du capital.
   - Responsabilit\xE9 des associ\xE9s limit\xE9e aux apports.

2. **La SAS (Soci\xE9t\xE9 par Actions Simplifi\xE9e)** :
   - Grande libert\xE9 statutaire : Id\xE9ale pour lever des fonds, int\xE9grer des investisseurs ou structurer des start-ups.
   - Statuts tr\xE8s souples pour d\xE9finir les droits de vote, les comit\xE9s de direction et les clauses d'exclusion d'associ\xE9s.
   - Direction assur\xE9e obligatoirement par un Pr\xE9sident (personne physique ou morale).

3. **Protection des Dirigeants** :
   - Toujours formaliser un Proc\xE8s-Verbal d'Assembl\xE9e G\xE9n\xE9rale annuelle approuvant les comptes pour d\xE9charger la responsabilit\xE9 de la g\xE9rance (Art. 347 AUSCGIE).`;
      } else {
        fallbackReply = `### \u2696\uFE0F Conseil Juridique & Financier OHADA / International

En tant qu'expert juridique de Nana POS sp\xE9cialis\xE9 en droit des affaires africain (**OHADA**, **UEMOA**, **CEMAC**) et **Commerce International**, voici les principes cl\xE9s \xE0 appliquer :

1. **S\xE9curisation des Contrats Commerciaux (AUDCG)** :
   - Mentionnez toujours avec pr\xE9cision l'identit\xE9 des parties (RCCM, NIF/IFU, adresse du si\xE8ge social).
   - Sp\xE9cifiez l'objet, le bar\xE8me de prix hors taxes et toutes taxes comprises, ainsi que les d\xE9lais de livraison stricts.
   - Ins\xE9rez une **clause p\xE9nale forfaitaire** en cas de retard de paiement (ex: int\xE9r\xEAt moratoire de 1,5% par mois de retard) et une **clause de r\xE9serve de propri\xE9t\xE9**.

2. **Clause de R\xE8glement des Litiges Recommand\xE9e (Arbitrage CCJA)** :
> *"Tout litige n\xE9 du pr\xE9sent contrat ou s'y rapportant sera tranch\xE9 d\xE9finitivement suivant le R\xE8glement d'arbitrage de la Cour Commune de Justice et d'Arbitrage (CCJA) de l'OHADA par un ou plusieurs arbitres nomm\xE9s conform\xE9ment \xE0 ce R\xE8glement. Le si\xE8ge du tribunal arbitral sera fix\xE9 d'un commun accord ou \xE0 Abidjan."*

3. **Comment puis-je vous assister pr\xE9cis\xE9ment ?**
   - \u{1F4C4} *Relire une clause ou un contrat en cours*
   - \u{1F3E2} *Bail commercial & litiges de loyers*
   - \u{1F6A2} *Incoterms 2020 et litiges transport / fret maritime*
   - \u{1F6E1}\uFE0F *R\xE9daction d'une garantie bancaire ou cautionnement*`;
      }
      res.json({
        success: true,
        reply: fallbackReply,
        source: "nana-ohada-legal-engine"
      });
    } catch (err) {
      console.error("Legal AI route error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app2.post("/api/ai/voice-simulation/turn", async (req, res) => {
    try {
      const { scenario, conversationHistory, userTranscript } = req.body;
      const genAI = getGenAI();
      if (genAI && scenario) {
        const historyText = (conversationHistory || []).map((t) => `${t.role === "user" ? "Apprenant" : "Vous"}: ${t.text}`).join("\n");
        const systemPrompt = `Tu incarnes le persona suivant dans un jeu de r\xF4le vocal ultra-r\xE9aliste :
PERSONA : ${scenario.persona}
OBJECTIF DE L'APPRENANT : ${scenario.objective}
R\xC8GLES CRITIQUES :
1. Reste strictement dans ton personnage, ne brise JAMAIS le quatri\xE8me mur.
2. R\xE9ponds oralement de fa\xE7on concise (1 \xE0 2 phrases courtes maximum) afin que la synth\xE8se vocale soit instantan\xE9e (< 800ms).
3. Adapte ton niveau d'agacement ou de satisfaction selon la qualit\xE9 des arguments de l'apprenant.
4. R\xE9ponds toujours en fran\xE7ais naturel adapt\xE9 au contexte \xE9conomique d'Afrique de l'Ouest.

Historique de la conversation :
${historyText}
Apprenant : ${userTranscript}
Votre r\xE9plique imm\xE9diate :`;
        const aiResponse = await callGeminiWithRetry(genAI, {
          contents: systemPrompt,
          config: {
            temperature: 0.7,
            maxOutputTokens: 120
          }
        });
        if (aiResponse?.text) {
          return res.json({ success: true, text: aiResponse.text.trim() });
        }
      }
      res.json({
        success: true,
        text: "Je comprends ce que vous dites, mais que proposez-vous concr\xE8tement pour r\xE9soudre la situation imm\xE9diatement ?"
      });
    } catch (err) {
      console.error("Voice simulation turn error:", err);
      res.status(500).json({ error: err.message || "Internal error" });
    }
  });
  app2.post("/api/ai/voice-simulation/evaluate", async (req, res) => {
    try {
      const { scenario, conversationHistory, studentId, courseId, lessonId } = req.body;
      const genAI = getGenAI();
      const passingScore = scenario?.passingScore || 70;
      if (genAI && scenario && conversationHistory?.length > 0) {
        const historyText = conversationHistory.map((t) => `${t.role === "user" ? "Apprenant" : "IA"}: ${t.text}`).join("\n");
        const prompt = `\xC9value ce jeu de r\xF4le vocal p\xE9dagogique entre un apprenant et une IA.
SC\xC9NARIO : ${scenario.title}
PERSONA DE L'IA : ${scenario.persona}
OBJECTIF VIS\xC9 : ${scenario.objective}
SEUIL DE PASSAGE : ${passingScore}%

HISTORIQUE DU DIALOGUE :
${historyText}

Fournis une \xE9valuation impartiale et bienveillante au format JSON STRICT suivant :
{
  "score": <nombre entre 0 et 100>,
  "passed": <true si score >= ${passingScore} sinon false>,
  "summary": "<synth\xE8se de 2 phrases>",
  "strengths": ["<point fort 1>", "<point fort 2>"],
  "weaknesses": ["<axe d'am\xE9lioration 1>", "<axe d'am\xE9lioration 2>"],
  "recommendation": "<conseil pratique pr\xE9cis>",
  "rubrics": {
    "empathy": <0-100>,
    "technicalAccuracy": <0-100>,
    "resolution": <0-100>,
    "communication": <0-100>
  }
}`;
        const aiResponse = await callGeminiWithRetry(genAI, {
          contents: prompt,
          config: {
            temperature: 0.3,
            responseMimeType: "application/json"
          }
        });
        if (aiResponse?.text) {
          try {
            const parsed = JSON.parse(aiResponse.text);
            const report = {
              submissionId: `eval-${Date.now()}`,
              studentId: studentId || "student-guest",
              courseId: courseId || "course-default",
              lessonId: lessonId || "lesson-default",
              createdAt: Date.now(),
              ...parsed
            };
            return res.json({ success: true, report });
          } catch (pe) {
            console.error("JSON parse error in voice eval:", pe);
          }
        }
      }
      const turnsCount = conversationHistory?.length || 0;
      const score = Math.min(95, Math.max(55, 60 + turnsCount * 5));
      const passed = score >= passingScore;
      res.json({
        success: true,
        report: {
          submissionId: `eval-${Date.now()}`,
          studentId: studentId || "student-guest",
          courseId: courseId || "course-default",
          lessonId: lessonId || "lesson-default",
          score,
          passed,
          summary: passed ? "L'apprenant a su d\xE9samorcer la tension avec professionnalisme et a propos\xE9 une solution op\xE9rationnelle adapt\xE9e." : "L'attitude \xE9tait courtoise mais manquait de propositions techniques claires pour rassurer le client.",
          strengths: [
            "\xC9coute active et respect du protocole d'accueil",
            "Ton calme face aux objections formul\xE9es"
          ],
          weaknesses: [
            "D\xE9lai d'explication de la proc\xE9dure technique de contournement",
            "Proposition commerciale compensatoire \xE0 formaliser plus t\xF4t"
          ],
          recommendation: "Concentrez-vous sur l'\xE9nonc\xE9 imm\xE9diat d'une solution d'attente d\xE8s la premi\xE8re minute d'\xE9change.",
          rubrics: {
            empathy: Math.min(100, score + 5),
            technicalAccuracy: Math.max(50, score - 5),
            resolution: score,
            communication: score
          },
          createdAt: Date.now()
        }
      });
    } catch (err) {
      console.error("Voice simulation evaluation error:", err);
      res.status(500).json({ error: err.message || "Internal error" });
    }
  });
  app2.post("/api/ai/remediation/generate", async (req, res) => {
    try {
      const { failedLessonTitle, incorrectQuestions, parentModuleTitle, score } = req.body;
      const genAI = getGenAI();
      if (genAI) {
        const questionsSummary = (incorrectQuestions || []).map((q, i) => `Q${i + 1}: ${q.questionText} (R\xE9ponse \xE9l\xE8ve: index ${q.studentAnswerIndex}, Bonne r\xE9ponse: index ${q.correctAnswerIndex})`).join("\n");
        const prompt = `Tu es le Grand Tuteur P\xE9dagogique NaNa AI pour les formations certifiantes FinTech & T\xE9l\xE9coms en Afrique de l'Ouest.
L'apprenant a obtenu un score insuffisant de ${score}% sur la le\xE7on "${failedLessonTitle}" (Module: "${parentModuleTitle}").
Questions \xE9chou\xE9es :
${questionsSummary}

G\xE9n\xE8re une capsule de rem\xE9diation personnalis\xE9e ultra-cibl\xE9e (Module 2.5) au format JSON STRICT suivant :
{
  "title": "<Titre percutant de r\xE9vision, ex: Capsule Rapprochement USSD Express>",
  "targetConcepts": ["<concept cl\xE9 1>", "<concept cl\xE9 2>"],
  "keyTakeaways": ["<point essentiel 1>", "<point essentiel 2>", "<point essentiel 3>"],
  "markdownContent": "<Explication claire, p\xE9dagogique et structur\xE9e en Markdown des erreurs courantes et de la r\xE8gle technique exacte. Inclure des exemples concrets du march\xE9 UEMOA (Wave, Orange Money, Moov, MTN).>",
  "quickCheckQuestion": {
    "question": "<Question pratique pour v\xE9rifier la compr\xE9hension>",
    "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
    "correctOptionIndex": <0, 1, 2 ou 3>,
    "explanation": "<Explication d\xE9taill\xE9e de pourquoi cette r\xE9ponse est la bonne>"
  }
}`;
        const aiResponse = await callGeminiWithRetry(genAI, {
          contents: prompt,
          config: {
            temperature: 0.4,
            responseMimeType: "application/json"
          }
        });
        if (aiResponse?.text) {
          try {
            const parsed = JSON.parse(aiResponse.text);
            return res.json({ success: true, remediation: parsed });
          } catch (pe) {
            console.error("JSON parse error in remediation:", pe);
          }
        }
      }
      res.json({
        success: true,
        remediation: {
          title: `R\xE9vision Cibl\xE9e : Ma\xEEtrise des protocoles de ${failedLessonTitle}`,
          targetConcepts: ["Synchronisation USSD", "Idempotence des transactions", "Notifications Push"],
          keyTakeaways: [
            "Toujours v\xE9rifier la signature HMAC des webhooks op\xE9rateurs",
            "En cas de timeout USSD, d\xE9clencher le m\xE9canisme de requ\xEAte de statut apr\xE8s 30 secondes",
            "Ne jamais d\xE9biter le client deux fois gr\xE2ce \xE0 la cl\xE9 d'idempotence"
          ],
          markdownContent: `### Principes Fondamentaux & R\xE9solution

Lors de l'\xE9valuation pr\xE9c\xE9dente, des h\xE9sitations sont apparues sur le traitement des accus\xE9s de r\xE9ception et la gestion de la latence r\xE9seau.

#### 1. Le cycle de vie d'une transaction Mobile Money
1. **Initiation** : Le client compose la syntaxe USSD ou scanne le QR code.
2. **Notification Asynchrone** : Le serveur t\xE9l\xE9com \xE9met un webhook HTTP POST s\xE9curis\xE9.
3. **Validation & Cl\xF4ture** : Votre caisse enregistre la transaction et lib\xE8re la marchandise.

> \u{1F4A1} **R\xE8gle d'or UEMOA** : Toujours maintenir une file d'attente hors-ligne pour absorber les coupures temporaires sans perdre de vente.`,
          quickCheckQuestion: {
            question: "Que devez-vous faire en cas d'absence de r\xE9ponse imm\xE9diate lors d'un paiement USSD ?",
            options: [
              "Annuler la commande imm\xE9diatement et recommencer",
              "Interroger le statut de la transaction via l'API de v\xE9rification avec la m\xEAme r\xE9f\xE9rence",
              "D\xE9biter \xE0 nouveau le compte du client par pr\xE9caution",
              "\xC9teindre et red\xE9marrer la caisse"
            ],
            correctOptionIndex: 1,
            explanation: "L'interrogation du statut avec la r\xE9f\xE9rence d'idempotence \xE9vite le double d\xE9bit tout en confirmant si l'op\xE9rateur a enregistr\xE9 l'op\xE9ration."
          }
        }
      });
    } catch (err) {
      console.error("Remediation generation error:", err);
      res.status(500).json({ error: err.message || "Internal error" });
    }
  });
  app2.post("/api/ai/auto-funnel/generate", async (req, res) => {
    try {
      const { productName, productDescription, productPrice, productImageUrl, targetAudience } = req.body;
      const genAI = getGenAI();
      if (genAI && productName) {
        const prompt = `Tu es le meilleur copywriter e-commerce direct-response au monde, expert du march\xE9 africain et des tunnels de vente ClickFunnels/Elementor \xE0 haute conversion.
PRODUIT : ${productName}
DESCRIPTION : ${productDescription}
PRIX : ${productPrice} FCFA
IMAGE : ${productImageUrl || "Image produit fournie"}
AUDIENCE : ${targetAudience || "Consommateurs zone Afrique de l'Ouest"}

R\xE9dige une page de vente compl\xE8te qui convertit \xE0 +15% sur mobile. Format JSON STRICT conforme au sch\xE9ma de blocs suivant :
{
  "pageTitle": "<Titre ultra accrocheur>",
  "metaDescription": "<Description SEO & WhatsApp>",
  "blocks": [
    {
      "id": "hero-1",
      "type": "HERO",
      "title": "<Titre principal irr\xE9sistible>",
      "subtitle": "<Sous-titre r\xE9solvant le probl\xE8me>",
      "ctaText": "Commander et Payer \xE0 la Livraison",
      "price": ${productPrice},
      "originalPrice": ${Math.round(Number(productPrice) * 1.5)},
      "imageUrl": "${productImageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"}",
      "badge": "Offre Exclusive Limit\xE9e"
    },
    {
      "id": "urgency-1",
      "type": "SCARCITY_URGENCY",
      "title": "Stock Limit\xE9 en Entrep\xF4t",
      "stockCount": 7,
      "totalStock": 50,
      "countdownMinutes": 15
    },
    {
      "id": "benefits-1",
      "type": "BENEFITS",
      "title": "Pourquoi nos clients adorent ce produit",
      "items": [
        "<B\xE9n\xE9fice concret 1>",
        "<B\xE9n\xE9fice concret 2>",
        "<B\xE9n\xE9fice concret 3>"
      ]
    },
    {
      "id": "trust-1",
      "type": "TRUST_BADGES",
      "badges": ["Paiement \xE0 la Livraison", "Livraison Rapide 24-48h", "Garantie Satisfait ou Rembours\xE9"]
    },
    {
      "id": "checkout-1",
      "type": "INLINE_CHECKOUT",
      "title": "Finalisez votre commande en 1 clic"
    }
  ]
}`;
        const aiResponse = await callGeminiWithRetry(genAI, {
          contents: prompt,
          config: {
            temperature: 0.5,
            responseMimeType: "application/json"
          }
        });
        if (aiResponse?.text) {
          try {
            const parsed = JSON.parse(aiResponse.text);
            return res.json({ success: true, funnel: parsed });
          } catch (pe) {
            console.error("JSON parse error in auto-funnel:", pe);
          }
        }
      }
      res.json({
        success: true,
        funnel: {
          pageTitle: `${productName} \u2022 Offre Sp\xE9ciale NaNa`,
          metaDescription: `D\xE9couvrez ${productName}. Stock limit\xE9 avec livraison express et paiement s\xE9curis\xE9 Mobile Money ou esp\xE8ces.`,
          blocks: [
            {
              id: "hero-1",
              type: "HERO",
              title: `R\xE9volutionnez votre quotidien avec ${productName}`,
              subtitle: productDescription || "La qualit\xE9 professionnelle au meilleur prix du march\xE9 ouest-africain.",
              ctaText: "Commander Maintenant & Payer \xE0 la R\xE9ception",
              price: Number(productPrice) || 15e3,
              originalPrice: Math.round((Number(productPrice) || 15e3) * 1.5),
              imageUrl: productImageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
              badge: "Vente Flash Exclusive"
            },
            {
              id: "urgency-1",
              type: "SCARCITY_URGENCY",
              title: "Derni\xE8res pi\xE8ces disponibles",
              stockCount: 8,
              totalStock: 50,
              countdownMinutes: 20
            },
            {
              id: "benefits-1",
              type: "BENEFITS",
              title: "Les Avantages Incontournables",
              items: [
                "Efficacit\xE9 imm\xE9diate prouv\xE9e par nos utilisateurs",
                "Con\xE7u avec des mat\xE9riaux durables et r\xE9sistants",
                "Support client disponible 7j/7 sur WhatsApp"
              ]
            },
            {
              id: "trust-1",
              type: "TRUST_BADGES",
              badges: ["Paiement S\xE9curis\xE9 Mobile Money & Cash", "Garantie 30 Jours", "Livraison Rapide"]
            },
            {
              id: "checkout-1",
              type: "INLINE_CHECKOUT",
              title: "Validez votre commande ci-dessous"
            }
          ]
        }
      });
    } catch (err) {
      console.error("Auto-funnel generation error:", err);
      res.status(500).json({ error: err.message || "Internal error" });
    }
  });
  app2.post("/api/sms/send", async (req, res) => {
    try {
      const { to, message, sender = "NANA_STORE", provider = "LOCAL_AFRICA", config = {} } = req.body || {};
      if (!to || !message) {
        return res.status(400).json({ error: "Num\xE9ro destinataire et message obligatoires." });
      }
      if (provider === "BREVO" || !provider && process.env.BREVO_API_KEY) {
        const brevoKey = config.apiKey || process.env.BREVO_API_KEY;
        if (brevoKey && !brevoKey.startsWith("xkeysib-demo") && brevoKey !== "xkeysib-78b190f845a7201c-sec49281") {
          try {
            const brevoResp = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
              method: "POST",
              headers: {
                "api-key": brevoKey,
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify({
                sender: String(sender).substring(0, 11),
                recipient: to,
                content: message,
                type: "transactional"
              })
            });
            const brevoData = await brevoResp.json().catch(() => ({}));
            if (brevoResp.ok) {
              return res.json({
                success: true,
                provider: "BREVO",
                ackId: brevoData.reference || brevoData.messageId || `BREVO-${Date.now()}`,
                message: `SMS transmis via Brevo \xE0 ${to} !`
              });
            } else {
              console.warn("[BREVO API ERROR]", brevoData);
              return res.status(400).json({
                error: brevoData.message || "Erreur lors de la transmission du SMS via Brevo."
              });
            }
          } catch (brevoErr) {
            console.error("[BREVO EXCEPTION]", brevoErr);
            return res.status(500).json({ error: brevoErr.message || "Erreur r\xE9seau vers Brevo." });
          }
        }
      }
      if (provider === "TWILIO" || !provider && process.env.TWILIO_ACCOUNT_SID) {
        const twilioSid = config.accountSid || process.env.TWILIO_ACCOUNT_SID;
        const twilioToken = config.authToken || process.env.TWILIO_AUTH_TOKEN;
        const twilioFrom = config.fromPhoneNumber || process.env.TWILIO_PHONE_NUMBER;
        if (twilioSid && twilioToken && !twilioSid.startsWith("ACdemo") && twilioSid !== "AC98f21908a1c890124e5a67b89") {
          try {
            const twilioBody = new URLSearchParams();
            twilioBody.append("To", to);
            twilioBody.append("From", twilioFrom || sender);
            twilioBody.append("Body", message);
            const authString = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
            const twilioResp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
              method: "POST",
              headers: {
                "Authorization": `Basic ${authString}`,
                "Content-Type": "application/x-www-form-urlencoded"
              },
              body: twilioBody.toString()
            });
            const twilioData = await twilioResp.json().catch(() => ({}));
            if (twilioResp.ok) {
              return res.json({
                success: true,
                provider: "TWILIO",
                ackId: twilioData.sid || `TW-${Date.now()}`,
                message: `SMS transmis via Twilio Global \xE0 ${to} !`
              });
            } else {
              return res.status(400).json({
                error: twilioData.message || "Erreur lors de la transmission Twilio."
              });
            }
          } catch (twilioErr) {
            console.error("[TWILIO EXCEPTION]", twilioErr);
            return res.status(500).json({ error: twilioErr.message || "Erreur r\xE9seau vers Twilio." });
          }
        }
      }
      if (provider === "LOCAL_AFRICA" && config.localEndpoint && !config.localEndpoint.includes("api.sms-afrique-passerelle.com")) {
        try {
          const localResp = await fetch(config.localEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Client-Id": config.localClientId || "",
              "X-Secret-Key": config.localSecretKey || ""
            },
            body: JSON.stringify({
              to,
              message,
              sender
            })
          });
          const localData = await localResp.json().catch(() => ({}));
          if (localResp.ok) {
            return res.json({
              success: true,
              provider: "LOCAL_AFRICA",
              ackId: localData.ackId || localData.id || `LOCAL-${Date.now()}`,
              message: `SMS d\xE9livr\xE9 via passerelle locale \xE0 ${to} !`
            });
          }
        } catch (localErr) {
          console.warn("[LOCAL GATEWAY NOTICE]", localErr.message);
        }
      }
      const simAckId = `SMS-${provider.substring(0, 3)}-${Math.floor(1e5 + Math.random() * 9e5)}`;
      return res.json({
        success: true,
        provider,
        ackId: simAckId,
        simulated: true,
        message: `Message transmis \xE0 la passerelle t\xE9l\xE9com vers ${to} (Mode bac \xE0 sable / Simulation r\xE9aliste).`
      });
    } catch (err) {
      console.error("[SERVER SMS HANDLER ERROR]", err);
      return res.status(500).json({ error: err.message || "Erreur interne envoi SMS" });
    }
  });
  app2.post("/api/woocommerce/test", async (req, res) => {
    try {
      const { siteUrl, consumerKey, consumerSecret } = req.body || {};
      if (!siteUrl || !consumerKey || !consumerSecret) {
        return res.status(400).json({
          success: false,
          message: "Veuillez renseigner l\u2019URL du site, la cl\xE9 client (ck_...) et le secret (cs_...)."
        });
      }
      if (siteUrl.includes("epicerie-moderne-abidjan.com") || consumerKey === "ck_9f83a82e1c0d4567ba91f2389e1a0b" || consumerSecret === "cs_4b7190e4f21a5678cd89012ef34a5c") {
        return res.json({
          success: false,
          isDemo: true,
          message: "Identifiants de d\xE9monstration d\xE9tect\xE9s. Veuillez entrer l\u2019adresse r\xE9elle de votre site WordPress et vos cl\xE9s API WooCommerce."
        });
      }
      let cleanUrl = siteUrl.trim();
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = "https://" + cleanUrl;
      }
      cleanUrl = cleanUrl.replace(/\/+$/, "");
      const authHeader = "Basic " + Buffer.from(`${consumerKey.trim()}:${consumerSecret.trim()}`).toString("base64");
      const testEndpoint = `${cleanUrl}/wp-json/wc/v3/products?per_page=1`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8e3);
      try {
        const response = await fetch(testEndpoint, {
          method: "GET",
          headers: {
            "Authorization": authHeader,
            "User-Agent": "NanaPOS-WooCommerce-Connector/2.0"
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const totalCountHeader = response.headers.get("x-wp-total");
          const productsCount = totalCountHeader ? parseInt(totalCountHeader, 10) : 1;
          return res.json({
            success: true,
            message: `Connexion API r\xE9ussie ! Boutique WooCommerce d\xE9tect\xE9e (${productsCount} articles r\xE9f\xE9renc\xE9s).`,
            productsCount
          });
        } else if (response.status === 401 || response.status === 403) {
          return res.json({
            success: false,
            message: `\xC9chec d\u2019authentification (HTTP ${response.status}) : Cl\xE9 client (ck_...) ou Secret (cs_...) invalide.`
          });
        } else if (response.status === 404) {
          return res.json({
            success: false,
            message: 'API WooCommerce introuvable (HTTP 404) : V\xE9rifiez que WooCommerce est actif et que vos permaliens WordPress sont configur\xE9s sur "Nom de l\u2019article".'
          });
        } else {
          return res.json({
            success: false,
            message: `R\xE9ponse du serveur WordPress inattendue : HTTP ${response.status} (${response.statusText}).`
          });
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (fetchErr.name === "AbortError") {
          return res.json({
            success: false,
            message: `D\xE9lai d\xE9pass\xE9 (8s) en tentant de joindre ${cleanUrl}. Le serveur ne r\xE9pond pas.`
          });
        }
        return res.json({
          success: false,
          message: `Impossible de contacter ${cleanUrl} (${fetchErr.message}). V\xE9rifiez l\u2019URL et le certificat SSL.`
        });
      }
    } catch (err) {
      console.error("[WOOCOMMERCE TEST ERROR]", err);
      return res.status(500).json({ success: false, message: err.message || "Erreur serveur interne test WooCommerce." });
    }
  });
  const distPath = import_path.default.join(process.cwd(), "dist");
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "custom"
    });
    app2.use(vite.middlewares);
    app2.use(
      import_express.default.static(distPath, {
        index: false,
        setHeaders: (res, filePath) => {
          const relative = import_path.default.relative(distPath, filePath).replace(/\\/g, "/");
          if (relative.startsWith("assets/")) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        }
      })
    );
    app2.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.includes(".") && !url.endsWith(".html")) {
        return next();
      }
      try {
        const theme = extractThemeFromReq(req);
        const indexPath = import_path.default.join(process.cwd(), "index.html");
        let template = import_fs.default.readFileSync(indexPath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        const html = injectThemeIntoHtml(template, theme);
        res.status(200).set({
          "Content-Type": "text/html",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app2.use(
      import_express.default.static(distPath, {
        index: false,
        setHeaders: (res, filePath) => {
          const relative = import_path.default.relative(distPath, filePath).replace(/\\/g, "/");
          if (relative.startsWith("assets/")) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          } else if (relative === "sw.js" || relative.endsWith(".json")) {
            res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
          } else {
            res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
          }
        }
      })
    );
    app2.get("*", (req, res) => {
      const theme = extractThemeFromReq(req);
      const indexPath = import_path.default.join(distPath, "index.html");
      if (import_fs.default.existsSync(indexPath)) {
        const template = import_fs.default.readFileSync(indexPath, "utf-8");
        const html = injectThemeIntoHtml(template, theme);
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.send(html);
      } else {
        res.status(404).send("Not Found");
      }
    });
  }
  const httpServer = import_http.default.createServer(app2);
  const wss = new import_ws.WebSocketServer({ server: httpServer, path: "/ws/haggle" });
  const socketMap = /* @__PURE__ */ new Map();
  const userSocketMap = /* @__PURE__ */ new Map();
  const io = {
    to: (targetId) => ({
      emit: (event, data) => {
        const payload = JSON.stringify({ event, data });
        const directClient = socketMap.get(targetId);
        if (directClient && directClient.readyState === import_ws.WebSocket.OPEN) {
          directClient.send(payload);
        }
        const userClients = userSocketMap.get(targetId);
        if (userClients) {
          for (const client of userClients) {
            if (client !== directClient && client.readyState === import_ws.WebSocket.OPEN) {
              client.send(payload);
            }
          }
        }
      }
    }),
    emit: (event, data) => {
      const payload = JSON.stringify({ event, data });
      for (const client of socketMap.values()) {
        if (client.readyState === import_ws.WebSocket.OPEN) {
          client.send(payload);
        }
      }
    }
  };
  setTontineSocketEmitter(io);
  setPosSyncSocketEmitter(io);
  setMicroRelaySocketEmitter(io);
  setLogisticsSocketEmitter(io);
  setFarotageSocketEmitter(io);
  setCagnotteSocketEmitter(io);
  setWameetSyncSocketEmitter(io);
  wss.on("connection", (ws) => {
    const socketId = `ws_${Date.now()}_${import_crypto11.default.randomBytes(3).toString("hex")}`;
    socketMap.set(socketId, ws);
    let registeredUserId = null;
    console.log(`[SMART HAGGLE & MICRO-RELAIS WS] Spectateur connect\xE9 : ${socketId}`);
    ws.send(JSON.stringify({ event: "connected", data: { socketId } }));
    ws.on("message", async (raw) => {
      try {
        const text = raw.toString();
        const parsed = JSON.parse(text);
        const { event, data } = parsed || {};
        if (event === "register_user" || event === "join_live") {
          const { userId, liveId, ref: ref2 } = data || {};
          if (userId) {
            registeredUserId = userId;
            if (!userSocketMap.has(userId)) {
              userSocketMap.set(userId, /* @__PURE__ */ new Set());
            }
            userSocketMap.get(userId).add(ws);
            registerUserSocket(userId, socketId);
          }
          if (ref2) {
            trackLiveAffiliateJoin({
              liveId: liveId || "live-default",
              userId: userId || socketId,
              socketId,
              ref: ref2
            });
          }
          ws.send(JSON.stringify({
            event: "user_registered",
            data: { socketId, userId, trackedAffiliate: ref2 || null }
          }));
        } else if (event === "submit_haggle_offer") {
          const { productId, userOffer, buyerName } = data || {};
          const aiResult = await handleHaggleOffer(productId, userOffer, {
            clientId: socketId,
            buyerName
          });
          io.to(socketId).emit("haggle_response", aiResult);
        } else if (event === "accept_haggle_offer") {
          const escrowResult = await lockHaggleEscrow({
            ...data,
            buyerId: data?.buyerId || socketId
          });
          io.to(socketId).emit("haggle_escrow_locked", escrowResult);
        } else if (event === "submit_tontine_participate") {
          const partResult = await participateInTontine({
            ...data,
            buyerId: data?.buyerId || socketId
          });
          io.to(socketId).emit("tontine_participate_response", partResult);
        } else if (event === "register_driver" || event === "join_delivery_room") {
          registerDriverSocket(socketId);
          ws.send(JSON.stringify({
            event: "driver_registered",
            data: { socketId, room: "delivery_drivers_room" }
          }));
        } else if (event === "join_farotage_group") {
          const { groupId } = data || {};
          if (groupId) {
            registerSocketToFarotageGroup(groupId, socketId);
            ws.send(JSON.stringify({
              event: "farotage_group_joined",
              data: { socketId, groupId }
            }));
          }
        } else if (event === "join_cagnotte_group") {
          const { groupId } = data || {};
          if (groupId) {
            registerSocketToCagnotteGroup(groupId, socketId);
            ws.send(JSON.stringify({
              event: "cagnotte_group_joined",
              data: { socketId, groupId }
            }));
          }
        } else if (event === "join_vip_room") {
          const { roomId } = data || {};
          if (roomId) {
            registerSocketToVipRoom(roomId, socketId);
            const count = getVipRoomClientCount(roomId);
            ws.send(JSON.stringify({
              event: "vip_room_joined",
              data: { socketId, roomId, participantsCount: count }
            }));
            broadcastToVipRoom(roomId, "vip_room_participant_joined", {
              roomId,
              socketId,
              participantsCount: count
            });
          }
        } else if (event === "send_vip_chat_message") {
          const { roomId, message, text: text2, senderId, senderName, senderAvatar, senderRole, isQuestion, farotageAmountFcfa, id } = data || {};
          if (roomId && (text2 || message || farotageAmountFcfa)) {
            const chatPayload = {
              id: id || `msg_${Date.now()}_${import_crypto11.default.randomBytes(3).toString("hex")}`,
              roomId,
              senderId: senderId || socketId,
              senderName: senderName || "Membre VIP",
              senderAvatar: senderAvatar || "",
              senderRole: senderRole || "student",
              text: text2 || message || "",
              timestamp: Date.now(),
              isQuestion: Boolean(isQuestion),
              farotageAmountFcfa: farotageAmountFcfa || null
            };
            broadcastToVipRoom(roomId, "vip_chat_message", chatPayload);
          }
        } else if (event === "send_vip_chat_reaction") {
          const { roomId, emoji, senderName } = data || {};
          if (roomId && emoji) {
            broadcastToVipRoom(roomId, "vip_chat_reaction", {
              roomId,
              emoji,
              senderName: senderName || "Membre"
            });
          }
        }
      } catch (err) {
        console.error("[WS ERROR]", err);
        io.to(socketId).emit("haggle_error", { message: err.message || "Erreur traitement" });
      }
    });
    ws.on("close", () => {
      socketMap.delete(socketId);
      unregisterDriverSocket(socketId);
      unregisterSocketFromFarotageGroup(socketId);
      unregisterSocketFromCagnotteGroup(socketId);
      unregisterSocketFromVipRoom(socketId);
      if (registeredUserId) {
        const userSet = userSocketMap.get(registeredUserId);
        if (userSet) {
          userSet.delete(ws);
          if (userSet.size === 0) {
            userSocketMap.delete(registeredUserId);
          }
        }
        unregisterUserSocket(socketId);
      }
    });
  });
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Nana Server with Gemini AI & Smart Haggle WebSocket running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Moteur Universel d'Auto-Slug Nanasore OS
 * Garantit qu'aucune boutique, aucun produit et aucun tunnel n'existe sans slug valide,
 * et protège contre les collisions entre comptes via un suffixe déterministe d'UID.
 */
//# sourceMappingURL=server.cjs.map
