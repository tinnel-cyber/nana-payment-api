import { useMemo } from 'react';

export interface HeatmapChatData {
  /** Temps de réponse en minutes ou timestamp ISO */
  lastReplyTime?: number | string;
  /** Nombre de clics sur les liens produits / fiches */
  linksClicked?: number;
  /** Le dernier message a-t-il été lu ? */
  isRead?: boolean;
  read?: boolean;
  /** Volume de messages */
  messagesSentByUser?: number;
  messageCount?: number;
  /** Intention de panier détectée */
  cartIntentDetected?: boolean;
  /** Score explicite (si déjà fourni par l'API) */
  heatScore?: number;
  [key: string]: any;
}

export type HeatmapLevel = 'cold' | 'warm' | 'hot';

export interface HeatmapScoreResult {
  score: number;
  level: HeatmapLevel;
  ringClass: string;
  label: string;
  badgeClass: string;
  isCold: boolean;
  isWarm: boolean;
  isHot: boolean;
}

/**
 * 1. ALGORITHME DE CALCUL PUR DU SCORE HEATMAP (0 à 100)
 * Poids stricts des critères :
 * - Temps de réponse (< 5 min = +20 pts)
 * - Clics sur des liens produits (+30 pts)
 * - Taux de lecture des messages (lu = +10 pts)
 * - Engagement initial & intention d'achat (+15 à +40 pts)
 */
export function calculateHeatmapScore(chatData?: HeatmapChatData | null): number {
  if (!chatData) return 20;

  // Si score explicite déjà calculé côté serveur
  if (typeof chatData.heatScore === 'number' && !isNaN(chatData.heatScore)) {
    return Math.min(100, Math.max(0, Math.round(chatData.heatScore)));
  }

  let score = 10; // Score de base d'un nouveau contact

  // --------------------------------------------------------------------------
  // CRITÈRE 1 : TEMPS DE RÉPONSE (< 5 min = +20 pts)
  // --------------------------------------------------------------------------
  let replyMinutes: number | null = null;
  if (typeof chatData.lastReplyTime === 'number') {
    replyMinutes = chatData.lastReplyTime;
  } else if (chatData.lastReplyTime) {
    const parsed = Date.parse(String(chatData.lastReplyTime));
    if (!isNaN(parsed)) {
      replyMinutes = Math.max(0, (Date.now() - parsed) / (1000 * 60));
    }
  }

  if (replyMinutes != null) {
    if (replyMinutes < 5) {
      score += 20; // Réponse ultra-rapide (< 5 min)
    } else if (replyMinutes < 30) {
      score += 12; // Réponse dans la demi-heure
    } else if (replyMinutes < 120) {
      score += 5; // Dans les 2 heures
    }
  } else {
    // Si pas de métrique de temps, valeur médiane par défaut
    score += 5;
  }

  // --------------------------------------------------------------------------
  // CRITÈRE 2 : CLICS SUR DES LIENS PRODUITS (+30 pts)
  // --------------------------------------------------------------------------
  const clicks = Number(chatData.linksClicked ?? 0);
  if (clicks >= 2) {
    score += 35; // Intérêt très fort pour les produits
  } else if (clicks >= 1) {
    score += 30; // Clic sur au moins un lien produit (+30 pts)
  }

  // --------------------------------------------------------------------------
  // CRITÈRE 3 : TAUX DE LECTURE DES MESSAGES (lu = +10 pts)
  // --------------------------------------------------------------------------
  const isMessageRead = Boolean(chatData.isRead ?? chatData.read ?? (chatData.unreadCount === 0));
  if (isMessageRead) {
    score += 10; // Message lu (+10 pts)
  }

  // --------------------------------------------------------------------------
  // BONUS COMPLÉMENTAIRES (Volume & Intention d'achat IA)
  // --------------------------------------------------------------------------
  const messagesCount = Number(chatData.messagesSentByUser ?? chatData.messageCount ?? 0);
  if (messagesCount >= 5) {
    score += 20;
  } else if (messagesCount >= 2) {
    score += 10;
  }

  if (chatData.cartIntentDetected) {
    score += 20; // Intention d'achat confirmée par Gemini AI
  }

  // Clamp strict entre 0 et 100
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * 2. MAPPAGE DES CLASSES CSS DE BORDURE SELON LE SCORE
 * Directives de design Tailwind strictes :
 * - Score < 30 (Froid) : ring-1 ring-blue-100
 * - Score 30-70 (Tiède) : ring-2 ring-orange-400 ring-offset-2
 * - Score > 70 (Chaud) : ring-2 ring-red-500 ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.6)]
 */
export function getHeatmapBorderClass(score: number): {
  level: HeatmapLevel;
  ringClass: string;
  label: string;
  badgeClass: string;
} {
  if (score > 70) {
    return {
      level: 'hot',
      ringClass: 'ring-2 ring-red-500 ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse',
      label: 'Chaud • Prêt à acheter',
      badgeClass: 'bg-red-50 text-red-700 border-red-200'
    };
  }

  if (score >= 30) {
    return {
      level: 'warm',
      ringClass: 'ring-2 ring-orange-400 ring-offset-2',
      label: 'Tiède • Intéressé',
      badgeClass: 'bg-orange-50 text-orange-700 border-orange-200'
    };
  }

  return {
    level: 'cold',
    ringClass: 'ring-1 ring-blue-100',
    label: 'Froid • Nouveau contact',
    badgeClass: 'bg-slate-50 text-slate-500 border-slate-200'
  };
}

/**
 * 3. CUSTOM HOOK useHeatmapScore(chatData)
 * Mémorise le calcul du score (useMemo) pour garantir une performance à 60 FPS
 * sans aucun ralentissement de rendu dans les longues listes de contacts.
 */
export function useHeatmapScore(chatData?: HeatmapChatData | null): HeatmapScoreResult {
  return useMemo(() => {
    const score = calculateHeatmapScore(chatData);
    const border = getHeatmapBorderClass(score);

    return {
      score,
      level: border.level,
      ringClass: border.ringClass,
      label: border.label,
      badgeClass: border.badgeClass,
      isCold: border.level === 'cold',
      isWarm: border.level === 'warm',
      isHot: border.level === 'hot'
    };
  }, [
    chatData?.heatScore,
    chatData?.lastReplyTime,
    chatData?.linksClicked,
    chatData?.isRead,
    chatData?.read,
    chatData?.unreadCount,
    chatData?.messagesSentByUser,
    chatData?.cartIntentDetected
  ]);
}
