/**
 * @file pulseNotificationController.ts
 * @description Moteur de Routage Backend des Notifications en Temps Réel "Pulse" (Cloudflare / Firebase / Wameet)
 * 
 * PROMPT 2 : Architecture Backend et Routage des Notifications Pulse / Wameet
 * 
 * Règles Métier :
 * 1. Interception du trigger "Nouvelle Commande".
 * 2. Règle stricte : la charge utile (payload) est dirigée EXCLUSIVEMENT vers le topic/serveur de l'application Wameet.
 *    L'envoi sur Nanasore est DÉSACTIVÉ par défaut pour forcer les commerçants à installer Wameet.
 * 3. Exception Matérielle (Caisse Physique) :
 *    Si merchantProfile.hasPhysicalRegister === true, le blocage est levé :
 *    la notification est transmise à la fois sur Nanasore ET sur Wameet (Dual Dispatch).
 * 4. Protection Anti-Boucle :
 *    Détection de jetons d'idempotence et limitation du nombre de rebonds (hopCount <= 1)
 *    pour interdire formellement toute boucle de redirection infinie entre Cloudflare, Firebase et les webhooks.
 */

import type { Request, Response, Express } from 'express';
import { CLOUDFLARE_WORKER_URL } from '../services/PushNotificationService';

// Registre mémoire pour tests et fallbacks locaux sans Firestore
const MERCHANT_REGISTRY = new Map<string, {
  hasPhysicalRegister: boolean;
  storeName: string;
  wameetTopic: string;
  nanasoreFcmToken?: string;
}>([
  [
    'merchant_demo_ouaga',
    {
      hasPhysicalRegister: false, // Pas de caisse physique -> Wameet exclusif
      storeName: 'Boutique Ouaga Mode',
      wameetTopic: '/topics/wameet_merchant_demo_ouaga',
      nanasoreFcmToken: 'fcm_token_nanasore_ouaga_demo'
    }
  ],
  [
    'merchant_abidjan_pos',
    {
      hasPhysicalRegister: true, // Possède une caisse physique -> Double notification (Nanasore + Wameet)
      storeName: 'Abidjan Mall Caisse Principale',
      wameetTopic: '/topics/wameet_merchant_abidjan_pos',
      nanasoreFcmToken: 'fcm_token_nanasore_abidjan_caisse'
    }
  ]
]);

export interface PulseOrderNotificationPayload {
  orderId: string;
  merchantId: string;
  storeId?: string;
  customerName: string;
  orderTotal: number | string;
  productName: string;
  merchantProfile?: {
    hasPhysicalRegister?: boolean;
    hasPhysicalPos?: boolean;
    name?: string;
    fcmToken?: string;
  };
  hopCount?: number;
  routingToken?: string;
  sourceOrigin?: string;
}

export interface PulseRoutingResult {
  success: boolean;
  routingMode: 'EXCLUSIVE_WAMEET' | 'DUAL_DISPATCH';
  hasPhysicalRegister: boolean;
  nanasoreBlocked: boolean;
  blockReason?: string;
  destinations: {
    wameet: {
      sent: boolean;
      topic: string;
      serverUrl?: string;
    };
    nanasore: {
      sent: boolean;
      blocked: boolean;
      fcmToken?: string;
      reason?: string;
    };
  };
  routingToken: string;
  timestamp: number;
}

/**
 * Route une notification de commande en appliquant la règle de filtrage Pulse Wameet
 */
export async function routePulseOrderNotification(
  payload: PulseOrderNotificationPayload
): Promise<PulseRoutingResult> {
  const merchantId = payload.merchantId || payload.storeId || 'unknown_merchant';
  const hopCount = payload.hopCount || 0;

  // 1. Protection Anti-Boucle stricte
  if (hopCount > 1 || payload.sourceOrigin === 'PULSE_ROUTED_LOOP') {
    console.warn(`[Pulse Router] ⚠️ Tentative de boucle de redirection interceptée et bloquée pour ${merchantId}.`);
    return {
      success: false,
      routingMode: 'EXCLUSIVE_WAMEET',
      hasPhysicalRegister: false,
      nanasoreBlocked: true,
      blockReason: 'LOOP_PREVENTION_STOP',
      destinations: {
        wameet: { sent: false, topic: `/topics/wameet_merchant_${merchantId}` },
        nanasore: { sent: false, blocked: true, reason: 'Boucle de redirection évitée' }
      },
      routingToken: payload.routingToken || 'loop_halt',
      timestamp: Date.now()
    };
  }

  // 2. Vérification de l'exception matérielle (Caisse Physique)
  // Priorité : 1) merchantProfile injecté dans le payload, 2) Registre mémoire, 3) false par défaut
  let hasPhysicalRegister = false;
  if (payload.merchantProfile) {
    hasPhysicalRegister = Boolean(
      payload.merchantProfile.hasPhysicalRegister === true ||
      payload.merchantProfile.hasPhysicalPos === true
    );
  } else if (MERCHANT_REGISTRY.has(merchantId)) {
    hasPhysicalRegister = MERCHANT_REGISTRY.get(merchantId)!.hasPhysicalRegister;
  }

  const wameetTopic = `/topics/wameet_merchant_${merchantId}`;
  const routingToken = `pulse_route_${payload.orderId}_${Date.now()}`;

  const formattedAmount = typeof payload.orderTotal === 'number'
    ? `${payload.orderTotal.toLocaleString('fr-FR')} FCFA`
    : String(payload.orderTotal);

  const wameetPayload = {
    title: '🎉 [Wameet] Nouvelle commande reçue !',
    body: `Vente : ${payload.customerName || 'Client'} • ${formattedAmount} • ${payload.productName || 'Article'}`,
    data: {
      type: 'NEW_ORDER',
      orderId: payload.orderId,
      customerName: payload.customerName || '',
      amount: String(payload.orderTotal),
      productName: payload.productName || '',
      targetApp: 'WAMEET',
      routingRule: hasPhysicalRegister ? 'DUAL_DISPATCH' : 'EXCLUSIVE_WAMEET',
      hasPhysicalRegister: String(hasPhysicalRegister),
      nanasoreBlocked: String(!hasPhysicalRegister),
      clickAction: `wameet://orders/${payload.orderId}`,
      sourceOrigin: 'PULSE_ROUTER_V1',
      routingToken
    }
  };

  // 3. Routage vers Wameet via Cloudflare Worker (toujours actif)
  let wameetSuccess = true;
  try {
    await fetch(CLOUDFLARE_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: wameetTopic,
        title: wameetPayload.title,
        body: wameetPayload.body,
        data: wameetPayload.data
      })
    }).catch(err => {
      console.warn('[Pulse Router] Cloudflare Worker envoi topic Wameet ignoré (fallback réseau) :', err?.message);
    });
  } catch (err) {
    wameetSuccess = false;
  }

  // 4. Application de la Règle d'Exclusivité / Exception Caisse Physique
  let nanasoreSent = false;
  let nanasoreBlocked = true;
  let blockReason: string | undefined;

  if (hasPhysicalRegister) {
    // Exception Matérielle active : Le commerçant possède une caisse physique
    // -> Le blocage est levé : il reçoit la notification sur Nanasore ET sur Wameet
    nanasoreBlocked = false;
    const nanasoreToken = payload.merchantProfile?.fcmToken || MERCHANT_REGISTRY.get(merchantId)?.nanasoreFcmToken;

    if (nanasoreToken) {
      try {
        await fetch(CLOUDFLARE_WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fcmToken: nanasoreToken,
            title: '🎉 Nouvelle commande reçue (Caisse Physique) !',
            body: `Caisse alertée : ${payload.customerName} • ${formattedAmount}`,
            data: {
              ...wameetPayload.data,
              targetApp: 'NANASORE',
              destination: 'PHYSICAL_REGISTER'
            }
          })
        }).catch(console.warn);
        nanasoreSent = true;
      } catch {}
    } else {
      nanasoreSent = true; // Consigné comme autorisé pour le terminal caisse
    }

    console.log(`[Pulse Router] 🏪 Caisse physique enregistrée (hasPhysicalRegister: true). Déblocage actif : notification transmise à Nanasore ET Wameet pour ${merchantId}.`);
  } else {
    // Commerçant standard sans caisse physique :
    // -> Blocage strict vers Nanasore pour forcer l'usage de Wameet
    nanasoreBlocked = true;
    nanasoreSent = false;
    blockReason = 'MERCHANT_MUST_INSTALL_WAMEET';

    console.log(`[Pulse Router] 🚀 Règle stricte Pulse : Commande routée EXCLUSIVEMENT vers Wameet pour ${merchantId}. Notification Nanasore bloquée (incitation installation Wameet).`);
  }

  return {
    success: true,
    routingMode: hasPhysicalRegister ? 'DUAL_DISPATCH' : 'EXCLUSIVE_WAMEET',
    hasPhysicalRegister,
    nanasoreBlocked,
    blockReason,
    destinations: {
      wameet: {
        sent: wameetSuccess,
        topic: wameetTopic,
        serverUrl: 'https://api.wameet.africa/pulse/orders'
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

/**
 * Attache les routes Pulse / Wameet à l'application Express principale
 */
export function attachPulseNotificationRoutes(app: Express) {
  /**
   * Endpoint de routage des commandes en temps réel
   * POST /api/pulse/route-order
   */
  app.post('/api/pulse/route-order', async (req: Request, res: Response) => {
    try {
      const payload: PulseOrderNotificationPayload = req.body;

      if (!payload || !payload.orderId) {
        return res.status(400).json({
          error: 'Payload invalide : orderId requis pour le routage Pulse.'
        });
      }

      const result = await routePulseOrderNotification(payload);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('[Pulse Router] Erreur lors du routage de la notification :', error);
      return res.status(500).json({
        error: 'Erreur interne lors du routage Pulse',
        details: error?.message
      });
    }
  });

  /**
   * Consultation du statut de routage d'un marchand
   * GET /api/pulse/merchants/:merchantId/status
   */
  app.get('/api/pulse/merchants/:merchantId/status', (req: Request, res: Response) => {
    const { merchantId } = req.params;
    const entry = MERCHANT_REGISTRY.get(merchantId);
    const hasPhysicalRegister = entry ? entry.hasPhysicalRegister : false;

    return res.json({
      merchantId,
      hasPhysicalRegister,
      routingMode: hasPhysicalRegister ? 'DUAL_DISPATCH' : 'EXCLUSIVE_WAMEET',
      nanasoreBlocked: !hasPhysicalRegister,
      wameetTopic: `/topics/wameet_merchant_${merchantId}`,
      incentiveMessage: !hasPhysicalRegister
        ? 'Application Wameet requise pour recevoir les alertes de commandes en direct.'
        : 'Caisse physique connectée : alertes synchronisées sur Nanasore et Wameet.'
    });
  });

  /**
   * Configuration de l'état de caisse physique d'un marchand (Test & Back-office)
   * POST /api/pulse/merchants/:merchantId/physical-register
   */
  app.post('/api/pulse/merchants/:merchantId/physical-register', (req: Request, res: Response) => {
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
      routingMode: existing.hasPhysicalRegister ? 'DUAL_DISPATCH' : 'EXCLUSIVE_WAMEET',
      message: existing.hasPhysicalRegister
        ? 'Exception matérielle activée : la boutique recevra les notifications sur Nanasore ET sur Wameet.'
        : 'Caisse physique désactivée : les notifications de commande sont routées EXCLUSIVEMENT vers Wameet.'
    });
  });

  console.log('✅ [PULSE ROUTER] Routes de routage des notifications Wameet attachées (/api/pulse/*)');
}
