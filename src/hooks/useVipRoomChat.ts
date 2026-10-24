/**
 * @file useVipRoomChat.ts
 * @description Hook React pour le Chat en Direct WebSocket dans les Salles VIP E-learning (Smart Haggle & Wameet Sync)
 * Fournit la connexion bidirectionnelle temps réel, les questions Q&A, les réactions Farotage, et le comptage des participants.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { playValidationBeep, playCashChime, playTapBeep } from '../utils/audio';

export interface VipChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: 'instructor' | 'student' | 'vip' | 'admin';
  text: string;
  timestamp: number;
  isQuestion?: boolean;
  farotageAmountFcfa?: number;
}

export interface UseVipRoomChatOptions {
  roomId: string;
  currentUser?: {
    uid?: string;
    id?: string;
    displayName?: string;
    name?: string;
    photoURL?: string;
    avatarUrl?: string;
    email?: string;
    role?: string;
  } | null;
  expertName?: string;
  expertAvatar?: string;
}

export interface UseVipRoomChatReturn {
  messages: VipChatMessage[];
  isConnected: boolean;
  participantsCount: number;
  sendMessage: (text: string, isQuestion?: boolean, farotageAmountFcfa?: number) => void;
  sendFarotageTip: (amount: number) => void;
  sendReaction: (emoji: string) => void;
  activeReaction: string | null;
  clearMessages: () => void;
}

export function useVipRoomChat({
  roomId,
  currentUser,
  expertName = 'Expert Formateur',
  expertAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
}: UseVipRoomChatOptions): UseVipRoomChatReturn {
  const [messages, setMessages] = useState<VipChatMessage[]>(() => [
    {
      id: `welcome-${roomId}`,
      roomId,
      senderId: 'expert-system',
      senderName: expertName,
      senderAvatar: expertAvatar,
      senderRole: 'instructor',
      text: `👋 Bienvenue dans cette Salle VIP ! Posez vos questions dans le chat, partagez vos remarques sur les leçons ou échangez en direct avec la communauté.`,
      timestamp: Date.now() - 60000,
      isQuestion: false
    }
  ]);

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [participantsCount, setParticipantsCount] = useState<number>(12);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Normalisation des informations de l'expéditeur
  const currentUserId = currentUser?.uid || currentUser?.id || `user_${Math.random().toString(36).substring(2, 8)}`;
  const currentUserName = currentUser?.displayName || currentUser?.name || currentUser?.email?.split('@')[0] || 'Étudiant VIP';
  const currentUserAvatar = currentUser?.photoURL || currentUser?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUserId}`;
  const currentUserRole: 'instructor' | 'student' | 'vip' = 
    currentUser?.role === 'TEACHER' || currentUser?.role === 'SUPER_ADMIN' ? 'instructor' : 'vip';

  // 1. Initialisation de la connexion WebSocket
  useEffect(() => {
    if (!roomId || typeof window === 'undefined') return;

    let isUnmounted = false;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Utilise l'hôte actuel ou le port 3000 si différent
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws/haggle`;

        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) return;
          setIsConnected(true);
          // Rejoindre la room VIP
          ws.send(JSON.stringify({
            event: 'join_vip_room',
            data: {
              roomId,
              userId: currentUserId,
              userName: currentUserName,
              role: currentUserRole
            }
          }));
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const parsed = JSON.parse(event.data);
            const { event: evType, data } = parsed || {};

            if (evType === 'vip_room_joined') {
              if (data?.participantsCount) {
                setParticipantsCount(data.participantsCount);
              }
            } else if (evType === 'vip_room_participant_joined') {
              if (data?.participantsCount) {
                setParticipantsCount(data.participantsCount);
              } else {
                setParticipantsCount(prev => prev + 1);
              }
            } else if (evType === 'vip_chat_message') {
              const newMsg: VipChatMessage = {
                id: data.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                roomId: data.roomId || roomId,
                senderId: data.senderId || 'unknown',
                senderName: data.senderName || 'Membre VIP',
                senderAvatar: data.senderAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=vip',
                senderRole: data.senderRole || 'student',
                text: data.text || data.message || '',
                timestamp: data.timestamp || Date.now(),
                isQuestion: Boolean(data.isQuestion),
                farotageAmountFcfa: data.farotageAmountFcfa
              };

              setMessages((prev) => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });

              if (newMsg.farotageAmountFcfa) {
                playCashChime();
              } else {
                playValidationBeep();
              }
            } else if (evType === 'vip_chat_reaction') {
              if (data?.emoji) {
                setActiveReaction(data.emoji);
                setTimeout(() => setActiveReaction(null), 2500);
              }
            }
          } catch (e) {
            console.warn('[VIP CHAT WS] Erreur décodage message :', e);
          }
        };

        ws.onerror = (err) => {
          console.warn('[VIP CHAT WS] Erreur WebSocket :', err);
          setIsConnected(false);
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          // Reconnexion automatique après 4s
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmounted) connectWebSocket();
          }, 4000);
        };
      } catch (err) {
        console.warn('[VIP CHAT WS] Impossible d’établir la connexion :', err);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (_) {}
      }
    };
  }, [roomId, currentUserId, currentUserName, currentUserRole]);

  // 2. Envoi d'un message texte ou question
  const sendMessage = useCallback((text: string, isQuestion: boolean = false, farotageAmountFcfa?: number) => {
    if (!text.trim() && !farotageAmountFcfa) return;
    playTapBeep();

    const newMsg: VipChatMessage = {
      id: `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      roomId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      senderRole: currentUserRole,
      text: text.trim(),
      timestamp: Date.now(),
      isQuestion,
      farotageAmountFcfa
    };

    // Optimistic UI : ajout immédiat en local
    setMessages((prev) => [...prev, newMsg]);

    // Envoi via WebSocket si disponible
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'send_vip_chat_message',
        data: {
          id: newMsg.id,
          roomId,
          senderId: currentUserId,
          senderName: currentUserName,
          senderAvatar: currentUserAvatar,
          senderRole: currentUserRole,
          text: newMsg.text,
          message: newMsg.text,
          timestamp: newMsg.timestamp,
          isQuestion,
          farotageAmountFcfa
        }
      }));
    }
  }, [roomId, currentUserId, currentUserName, currentUserAvatar, currentUserRole]);

  // 3. Envoi d'un Farotage / Pourboire
  const sendFarotageTip = useCallback((amount: number) => {
    playCashChime();
    sendMessage(`💸 A faroté ${amount.toLocaleString('fr-FR')} FCFA pour encourager le formateur !`, false, amount);
  }, [sendMessage]);

  // 4. Envoi d'une réaction rapide (emoji applaudir, coeur, flamme)
  const sendReaction = useCallback((emoji: string) => {
    playTapBeep();
    setActiveReaction(emoji);
    setTimeout(() => setActiveReaction(null), 2500);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'send_vip_chat_reaction',
        data: { roomId, emoji, senderName: currentUserName }
      }));
    }
  }, [roomId, currentUserName]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isConnected,
    participantsCount,
    sendMessage,
    sendFarotageTip,
    sendReaction,
    activeReaction,
    clearMessages
  };
}
