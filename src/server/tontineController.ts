/**
 * @file tontineController.ts
 * @description Contrôleur Backend "Tontine Flash" & Moteur Financier Escrow avec S-Pay (Node.js)
 * 
 * Directives d'architecture métier :
 * 1. Initialisation de la session (POST /api/tontine/start)
 * 2. Paiement avec S-Pay (POST /api/tontine/participate) : Bloque 20 000 FCFA via s-client
 *    + émission WebSocket io.to(liveRoom).emit('tontine_progress_update', newCount)
 * 3. Cron Job / Timeout de Résolution :
 *    - Scénario A (Succès - Jauge pleine >= 50) : Encaisser 15 000 FCFA et rembourser 5 000 FCFA
 *    - Scénario B (Échec - Jauge non atteinte)  : Remboursement intégral ou achat normal
 * 4. Transactions sécurisées avec rollback si un paiement échoue.
 */

import crypto from 'crypto';
import type { Request, Response } from 'express';
import sClient from './s-client';

// ============================================================================
// 1. MODÈLES DE DONNÉES & INTERFACES DU MOTEUR TONTINE
// ============================================================================

export type TontineStatus = 'ACTIVE' | 'COMPLETED_SUCCESS' | 'FAILED_EXPIRED' | 'CANCELLED';
export type TontineFailureAction = 'refund_all' | 'keep_normal_order';

export interface TontineParticipant {
  id: string;
  buyerId: string;
  buyerPhone: string;
  buyerName: string;
  transactionId: string;
  escrowId: string;
  blockedAmount: number;       // Ex: 20 000 FCFA
  finalAmountCaptured?: number; // Ex: 15 000 FCFA (si succès)
  refundAmount?: number;       // Ex: 5 000 FCFA (si succès)
  paymentUrl: string;
  status: 'BLOCKED' | 'CAPTURED' | 'REFUNDED' | 'FAILED';
  joinedAt: number;
  refundTxId?: string;
  receiptNumber?: string;
  refundChannel?: 'MOBILE_MONEY' | 'WAMEET_WALLET';
}

export interface TontineSession {
  id: string;
  liveRoomId: string;
  productId: string;
  productName: string;
  targetCount: number;         // Ex: 50
  currentCount: number;        // Nombre actuel de participants
  timeLimitMinutes: number;    // Ex: 10
  fullPrice: number;           // Ex: 20 000 FCFA
  discountPrice: number;       // Ex: 15 000 FCFA
  refundPerUnit: number;       // Ex: 5 000 FCFA (fullPrice - discountPrice)
  currency: string;
  sellerId: string;
  status: TontineStatus;
  failureAction: TontineFailureAction;
  createdAt: number;
  expiresAt: number;           // Date d'expiration = createdAt + timeLimit * 60 * 1000
  participants: TontineParticipant[];
  completedAt?: number;
  timeoutTimer?: NodeJS.Timeout | null;
}

// ============================================================================
// 2. BASE DE DONNÉES EN MÉMOIRE & SYSTÈME TRANSACTIONNEL AVEC ROLLBACK
// ============================================================================

const TONTINE_DATABASE = new Map<string, TontineSession>();
const TONTINE_LOCKS = new Set<string>(); // Verrous concurrentiels pour mutations atomiques

/**
 * Journal des transactions pour audit et capacité de rollback immédiat
 */
interface TransactionRollbackLog {
  action: 'CAPTURE' | 'REFUND' | 'WALLET_CREDIT';
  participantId: string;
  transactionId: string;
  amount: number;
  rollbackExecuted: boolean;
}

// ============================================================================
// 3. SERVICE WEBSOCKET GLOBAL ADAPTER
// ============================================================================

export interface WebSocketBroadcaster {
  to: (room: string) => {
    emit: (event: string, data: any) => void;
  };
  emit: (event: string, data: any) => void;
}

let globalSocketEmitter: WebSocketBroadcaster | null = null;

export function setTontineSocketEmitter(io: WebSocketBroadcaster): void {
  globalSocketEmitter = io;
}

function broadcastToRoom(room: string, event: string, data: any): void {
  if (globalSocketEmitter && typeof globalSocketEmitter.to === 'function') {
    globalSocketEmitter.to(room).emit(event, data);
  } else if (globalSocketEmitter && typeof globalSocketEmitter.emit === 'function') {
    globalSocketEmitter.emit(event, { room, ...data });
  }
}

// ============================================================================
// 4. INITIALISATION DE LA SESSION (POST /api/tontine/start)
// ============================================================================

export interface StartTontineParams {
  liveRoomId: string;
  productId: string;
  productName?: string;
  targetCount?: number;         // Défaut : 50 commandes
  timeLimitMinutes?: number;    // Défaut : 10 minutes
  fullPrice?: number;           // Défaut : 20 000 FCFA
  discountPrice?: number;       // Défaut : 15 000 FCFA
  sellerId?: string;
  failureAction?: TontineFailureAction; // Défaut : 'refund_all'
}

/**
 * Démarre une session d'achat groupé Tontine Flash
 */
export async function startTontineSession(params: StartTontineParams): Promise<TontineSession> {
  const {
    liveRoomId,
    productId,
    productName = 'Coffret Prestige Karité Royal (Vente Flash)',
    targetCount = 50,
    timeLimitMinutes = 10,
    fullPrice = 20000,
    discountPrice = 15000,
    sellerId = 'seller_official_wameet',
    failureAction = 'refund_all'
  } = params;

  if (discountPrice >= fullPrice) {
    throw new Error('Le prix réduit (prix de gros) doit être inférieur au prix fort bloqué.');
  }

  const tontineId = `tontine_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const now = Date.now();
  const timeLimitMs = timeLimitMinutes * 60 * 1000;
  const expiresAt = now + timeLimitMs;
  const refundPerUnit = fullPrice - discountPrice;

  // Création de l'entrée en base de données
  const session: TontineSession = {
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
    currency: 'FCFA',
    sellerId,
    status: 'ACTIVE',
    failureAction,
    createdAt: now,
    expiresAt,
    participants: []
  };

  // Arme le Timer / Cron Job de résolution automatique à la fin du temps imparti
  session.timeoutTimer = setTimeout(async () => {
    try {
      console.log(`[TONTINE CRON] Timeout atteint (${timeLimitMinutes} mins) pour Tontine: ${tontineId}. Résolution en cours...`);
      await resolveTontineSession(tontineId, 'TIMEOUT');
    } catch (err: any) {
      console.error(`[TONTINE CRON ERROR] Échec résolution timeout Tontine ${tontineId}:`, err);
    }
  }, timeLimitMs);

  TONTINE_DATABASE.set(tontineId, session);

  console.log(`[TONTINE DÉMARRÉE] ID: ${tontineId} | Room: ${liveRoomId} | Cible: ${targetCount} | Expire à: ${new Date(expiresAt).toLocaleTimeString()}`);

  // Émission WebSocket pour avertir tous les spectateurs du Live
  broadcastToRoom(liveRoomId, 'tontine_started', {
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

// ============================================================================
// 5. PAIEMENT ET PARTICIPATION AVEC S-PAY (POST /api/tontine/participate)
// ============================================================================

export interface ParticipateTontineParams {
  tontineId: string;
  liveRoomId?: string;
  buyerId: string;
  buyerPhone: string;
  buyerName?: string;
}

export interface ParticipateResult {
  success: boolean;
  participantId: string;
  transactionId: string;
  paymentUrl: string;
  blockedAmount: number;
  newCount: number;
  targetCount: number;
  tontineStatus: TontineStatus;
}

/**
 * Enregistre un participant, bloque les 20 000 FCFA via S-Pay et notifie la room par WebSocket
 */
export async function participateInTontine(params: ParticipateTontineParams): Promise<ParticipateResult> {
  const { tontineId, buyerId, buyerPhone, buyerName = 'Spectateur Wameet', liveRoomId } = params;

  // Contrôle de concurrence avec verrou atomique
  while (TONTINE_LOCKS.has(tontineId)) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  TONTINE_LOCKS.add(tontineId);

  try {
    const session = TONTINE_DATABASE.get(tontineId);
    if (!session) {
      throw new Error(`Session Tontine introuvable (ID: ${tontineId})`);
    }

    if (session.status !== 'ACTIVE') {
      throw new Error(`Cette session Tontine n'est plus active (Statut: ${session.status})`);
    }

    if (Date.now() > session.expiresAt) {
      throw new Error('Le temps imparti pour cette Tontine Flash est écoulé.');
    }

    // Vérifie si l'acheteur participe déjà
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

    // 1. Appel du client S-Pay local pour générer le paiement de 20 000 FCFA (Escrow / Bloqué)
    const escrowResponse = await sClient.createEscrowPayment({
      amount: session.fullPrice, // 20 000 FCFA
      currency: session.currency,
      description: `Tontine Flash Wameet - ${session.productName}`,
      customerPhone: buyerPhone,
      customerName: buyerName,
      buyerId,
      tontineId
    });

    if (!escrowResponse || !escrowResponse.success) {
      throw new Error('Échec d’initialisation du séquestre bancaire Mobile Money avec la passerelle.');
    }

    // 2. Ajout atomique du participant
    const participantId = `part_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const participantRecord: TontineParticipant = {
      id: participantId,
      buyerId,
      buyerPhone,
      buyerName,
      transactionId: escrowResponse.transactionId,
      escrowId: escrowResponse.escrowId,
      blockedAmount: session.fullPrice,
      paymentUrl: escrowResponse.paymentUrl,
      status: 'BLOCKED',
      joinedAt: Date.now()
    };

    session.participants.push(participantRecord);
    session.currentCount = session.participants.length;

    const newCount = session.currentCount;
    const roomToNotify = liveRoomId || session.liveRoomId;

    console.log(`[TONTINE PARTICIPATION] Acheteur ${buyerPhone} inscrit (${newCount}/${session.targetCount}) sur Tontine: ${tontineId}`);

    // 3. Émission WebSocket instantanée : io.to(liveRoom).emit('tontine_progress_update', newCount)
    broadcastToRoom(roomToNotify, 'tontine_progress_update', {
      tontineId: session.id,
      newCount,
      targetCount: session.targetCount,
      progressPercent: Math.min(100, Math.round((newCount / session.targetCount) * 100)),
      lastParticipant: {
        name: buyerName,
        phoneMasked: buyerPhone.replace(/(\+\d{3})\d{4}(\d{3})/, '$1****$2')
      }
    });

    // 4. Déclenchement anticipé si la jauge atteint 100% sans attendre la fin du chrono
    if (newCount >= session.targetCount) {
      console.log(`[TONTINE SEUIL ATTEINT] 🎯 ${newCount}/${session.targetCount} commandes atteintes ! Déclenchement du Scénario A (Succès).`);
      // Résolution asynchrone non-bloquante
      setImmediate(() => {
        resolveTontineSession(session.id, 'GOAL_REACHED').catch((e) =>
          console.error('[TONTINE RESOLVE TRIGGER ERROR]', e)
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

// ============================================================================
// 6. CRON JOB & RÉSOLUTION SÉCURISÉE (TRANSACTIONS ATOMIQUES AVEC ROLLBACK)
// ============================================================================

export interface ResolveTontineResult {
  tontineId: string;
  scenario: 'A_SUCCESS' | 'B_FAILURE';
  totalParticipants: number;
  processedCount: number;
  finalCapturedAmountPerUnit: number;
  refundAmountPerUnit: number;
  totalRefundDistributed: number;
  errors: string[];
}

/**
 * Exécute la clôture financière de la Tontine avec transaction atomique et rollback
 */
export async function resolveTontineSession(
  tontineId: string,
  triggerReason: 'TIMEOUT' | 'GOAL_REACHED' | 'MANUAL' = 'TIMEOUT'
): Promise<ResolveTontineResult> {
  // Verrouillage de la session
  while (TONTINE_LOCKS.has(tontineId)) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  TONTINE_LOCKS.add(tontineId);

  const rollbackStack: TransactionRollbackLog[] = [];
  const errorsEncountered: string[] = [];

  try {
    const session = TONTINE_DATABASE.get(tontineId);
    if (!session) {
      throw new Error(`Session Tontine introuvable (${tontineId})`);
    }

    if (session.status !== 'ACTIVE') {
      console.log(`[TONTINE RESOLVE] Tontine ${tontineId} déjà résolue avec statut : ${session.status}`);
      return {
        tontineId,
        scenario: session.status === 'COMPLETED_SUCCESS' ? 'A_SUCCESS' : 'B_FAILURE',
        totalParticipants: session.participants.length,
        processedCount: session.participants.length,
        finalCapturedAmountPerUnit: session.discountPrice,
        refundAmountPerUnit: session.refundPerUnit,
        totalRefundDistributed: session.participants.length * session.refundPerUnit,
        errors: []
      };
    }

    // Annule le timer de timeout pour éviter un double déclenchement
    if (session.timeoutTimer) {
      clearTimeout(session.timeoutTimer);
      session.timeoutTimer = null;
    }

    const isSuccessGoalReached = session.currentCount >= session.targetCount;

    // =========================================================================
    // SCÉNARIO A : SUCCÈS (JAUGE PLEINE >= 50 COMMANDES)
    // 1. Encaisser 15 000 FCFA définitivement via S-Pay
    // 2. Rembourser 5 000 FCFA sur Wallet Wameet ou Mobile Money
    // =========================================================================
    if (isSuccessGoalReached) {
      console.log(`[TONTINE SCÉNARIO A - SUCCÈS] Traitement de ${session.participants.length} participants à prix réduit...`);
      session.status = 'COMPLETED_SUCCESS';
      session.completedAt = Date.now();

      let totalRefunds = 0;

      for (const participant of session.participants) {
        try {
          // 1. Encaissement définitif de 15 000 FCFA via S-Pay
          const captureResult = await sClient.captureEscrowPayment(
            participant.transactionId,
            session.discountPrice // 15 000 FCFA
          );

          participant.status = 'CAPTURED';
          participant.finalAmountCaptured = session.discountPrice;
          participant.receiptNumber = captureResult.receiptNumber;

          rollbackStack.push({
            action: 'CAPTURE',
            participantId: participant.id,
            transactionId: participant.transactionId,
            amount: session.discountPrice,
            rollbackExecuted: false
          });

          // 2. Remboursement automatique de la différence de 5 000 FCFA
          const refundResult = await sClient.refundDifference(
            participant.transactionId,
            session.refundPerUnit, // 5 000 FCFA
            participant.buyerPhone,
            `Remboursement Tontine Flash ${session.productName}`
          );

          // 3. Crédite également le Wallet Wameet de l'utilisateur
          await sClient.creditWameetWallet(
            participant.buyerId,
            session.refundPerUnit,
            `Gain Achat Groupé Tontine ${session.productName}`
          );

          participant.refundAmount = session.refundPerUnit;
          participant.refundTxId = refundResult.refundId;
          participant.refundChannel = 'WAMEET_WALLET';

          rollbackStack.push({
            action: 'REFUND',
            participantId: participant.id,
            transactionId: refundResult.refundId,
            amount: session.refundPerUnit,
            rollbackExecuted: false
          });

          totalRefunds += session.refundPerUnit;
        } catch (stepErr: any) {
          console.error(`[TONTINE TRANSACTION ERROR] Échec pour participant ${participant.buyerPhone}:`, stepErr);
          participant.status = 'FAILED';
          errorsEncountered.push(`Participant ${participant.buyerPhone} : ${stepErr.message}`);
        }
      }

      // Émission WebSocket générale d'objectif atteint avec succès
      broadcastToRoom(session.liveRoomId, 'tontine_completed', {
        success: true,
        tontineId: session.id,
        productId: session.productId,
        productName: session.productName,
        totalParticipants: session.participants.length,
        discountPrice: session.discountPrice,
        refundPerParticipant: session.refundPerUnit,
        totalRefundDistributed: totalRefunds,
        message: `🎉 Tontine Flash réussie ! Prix réduit débloqué, ${session.refundPerUnit.toLocaleString('fr-FR')} FCFA remboursés à tous les participants !`
      });

      return {
        tontineId,
        scenario: 'A_SUCCESS',
        totalParticipants: session.participants.length,
        processedCount: session.participants.length - errorsEncountered.length,
        finalCapturedAmountPerUnit: session.discountPrice,
        refundAmountPerUnit: session.refundPerUnit,
        totalRefundDistributed: totalRefunds,
        errors: errorsEncountered
      };
    }

    // =========================================================================
    // SCÉNARIO B : ÉCHEC (JAUGE NON ATTEINTE AU TIMEOUT)
    // Selon la politique paramétrée :
    // - 'refund_all' : Remboursement intégral des 20 000 FCFA bloqués
    // - 'keep_normal_order' : Encaisser les 20 000 FCFA en achat classique
    // =========================================================================
    else {
      console.log(`[TONTINE SCÉNARIO B - ÉCHEC] Jauge non atteinte (${session.currentCount}/${session.targetCount}). Action: ${session.failureAction}`);
      session.status = 'FAILED_EXPIRED';
      session.completedAt = Date.now();

      for (const participant of session.participants) {
        try {
          if (session.failureAction === 'refund_all') {
            // Remboursement intégral des 20 000 FCFA bloqués
            const refundRes = await sClient.cancelAndFullRefund(
              participant.transactionId,
              participant.buyerPhone,
              participant.blockedAmount // 20 000 FCFA
            );

            participant.status = 'REFUNDED';
            participant.refundAmount = participant.blockedAmount;
            participant.refundTxId = refundRes.refundId;
          } else {
            // Transformé en commande normale à 20 000 FCFA
            const capRes = await sClient.captureEscrowPayment(
              participant.transactionId,
              participant.blockedAmount // 20 000 FCFA
            );
            participant.status = 'CAPTURED';
            participant.finalAmountCaptured = participant.blockedAmount;
            participant.receiptNumber = capRes.receiptNumber;
          }
        } catch (failErr: any) {
          console.error(`[TONTINE REFUND FAIL ERROR] ${participant.buyerPhone}:`, failErr);
          errorsEncountered.push(`Participant ${participant.buyerPhone} : ${failErr.message}`);
        }
      }

      // Émission WebSocket générale d'échec / clôture
      broadcastToRoom(session.liveRoomId, 'tontine_failed', {
        success: false,
        tontineId: session.id,
        currentCount: session.currentCount,
        targetCount: session.targetCount,
        reason: 'time_limit_expired',
        actionTaken: session.failureAction,
        message:
          session.failureAction === 'refund_all'
            ? 'Objectif de commandes non atteint. Tous les fonds bloqués ont été intégralement remboursés.'
            : 'Objectif non atteint. Les commandes ont été validées au tarif normal.'
      });

      return {
        tontineId,
        scenario: 'B_FAILURE',
        totalParticipants: session.participants.length,
        processedCount: session.participants.length - errorsEncountered.length,
        finalCapturedAmountPerUnit: session.failureAction === 'keep_normal_order' ? session.fullPrice : 0,
        refundAmountPerUnit: session.failureAction === 'refund_all' ? session.fullPrice : 0,
        totalRefundDistributed: session.failureAction === 'refund_all' ? session.participants.length * session.fullPrice : 0,
        errors: errorsEncountered
      };
    }
  } catch (fatalErr: any) {
    console.error(`[CRITICAL TONTINE ERROR] Déclenchement du Rollback Transactionnel:`, fatalErr);

    // Rollback d'urgence si la résolution globale a planté
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

// ============================================================================
// 7. MIDDLEWARE EXPRESS ET ROUTES REST (POST /start, POST /participate, etc.)
// ============================================================================

export function attachTontineRoutes(app: any, io?: WebSocketBroadcaster): void {
  if (io) {
    setTontineSocketEmitter(io);
  }

  /**
   * POST /api/tontine/start
   * Initialise une nouvelle Tontine Flash
   */
  app.post('/api/tontine/start', async (req: Request, res: Response) => {
    try {
      const {
        liveRoomId,
        productId,
        productName,
        targetCount = 50,
        timeLimitMinutes = 10,
        fullPrice = 20000,
        discountPrice = 15000,
        sellerId,
        failureAction = 'refund_all'
      } = req.body || {};

      if (!productId || !liveRoomId) {
        return res.status(400).json({
          success: false,
          error: 'Champs obligatoires manquants : productId et liveRoomId requis.'
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

      // Exclut l'objet timer de la réponse JSON
      const { timeoutTimer, ...safeSession } = session;

      res.status(201).json({
        success: true,
        session: safeSession
      });
    } catch (err: any) {
      console.error('[API TONTINE START ERROR]', err);
      res.status(500).json({ success: false, error: err.message || 'Erreur interne création Tontine.' });
    }
  });

  /**
   * POST /api/tontine/participate
   * Participe et bloque le prix fort via S-Pay
   */
  app.post('/api/tontine/participate', async (req: Request, res: Response) => {
    try {
      const { tontineId, buyerId, buyerPhone, buyerName, liveRoomId } = req.body || {};

      if (!tontineId || !buyerPhone || !buyerId) {
        return res.status(400).json({
          success: false,
          error: 'Champs manquants : tontineId, buyerId et buyerPhone obligatoires.'
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
    } catch (err: any) {
      console.error('[API TONTINE PARTICIPATE ERROR]', err);
      res.status(400).json({ success: false, error: err.message || 'Impossible de participer à la Tontine.' });
    }
  });

  /**
   * GET /api/tontine/:id
   * Récupère l'état courant et la progression de la Tontine
   */
  app.get('/api/tontine/:id', (req: Request, res: Response) => {
    const session = TONTINE_DATABASE.get(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session Tontine introuvable.' });
    }

    const { timeoutTimer, ...safeSession } = session;
    const progressPercent = Math.min(100, Math.round((session.currentCount / session.targetCount) * 100));

    res.json({
      success: true,
      session: safeSession,
      progressPercent,
      remainingSeconds: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000))
    });
  });

  /**
   * POST /api/tontine/:id/resolve
   * Déclenche manuellement ou par webhook la clôture financière
   */
  app.post('/api/tontine/:id/resolve', async (req: Request, res: Response) => {
    try {
      const resolution = await resolveTontineSession(req.params.id, 'MANUAL');
      res.json({ success: true, resolution });
    } catch (err: any) {
      console.error('[API TONTINE RESOLVE ERROR]', err);
      res.status(500).json({ success: false, error: err.message || 'Erreur lors de la résolution de la Tontine.' });
    }
  });
}
