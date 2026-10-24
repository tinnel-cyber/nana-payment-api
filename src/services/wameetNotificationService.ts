/**
 * @file wameetNotificationService.ts
 * @description Service de Notifications Push Firebase (FCM) & Alertes Intelligentes Wameet (Prompt 10).
 * 
 * Spécifications :
 * 1. Inscription automatique au Token FCM de l'utilisateur
 * 2. Déclencheur : Ouverture de Guichet en Direct
 * 3. Déclencheur : Rappel de Rendez-vous 10 min avant
 * 4. Déclencheur : Synergy Match (Résonance Mutuelle)
 * 5. Fallback élégant vers toasts locaux et Notifications API du navigateur
 */

import { getOrRegisterFcmToken, triggerNotification } from './PushNotificationService';
import { WameetAppointment } from './wameetAppointmentService';
import { playValidationBeep, playTapBeep } from '../utils/audio';

export interface WameetPushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

class WameetNotificationService {
  private currentFcmToken: string | null = null;
  private isInitialized = false;

  /**
   * Initialise et enregistre le token FCM de l'utilisateur
   */
  async initUserFCM(userId: string): Promise<string | null> {
    if (this.isInitialized && this.currentFcmToken) return this.currentFcmToken;

    try {
      const token = await getOrRegisterFcmToken({ merchantId: userId });
      this.currentFcmToken = token;
      this.isInitialized = true;
      console.log('[WameetNotificationService] Initialisation FCM réussie pour', userId);
      return token;
    } catch (err) {
      console.info('[WameetNotificationService] FCM non disponible ou refusé par le navigateur :', err);
      return null;
    }
  }

  /**
   * Déclencheur 1 : Ouverture de Guichet en Direct
   * "🚀 [Nom] vient d'ouvrir son Guichet Wameet ! Rejoignez la session en direct."
   */
  async notifyGuichetOpened(params: {
    creatorName: string;
    creatorId: string;
    roomId?: string;
    topic?: string;
  }): Promise<void> {
    const title = `🚀 ${params.creatorName} est en direct sur Wameet !`;
    const body = `${params.creatorName} vient d'ouvrir son Guichet Wameet${params.topic ? ` (${params.topic})` : ''} ! Rejoignez la session en direct.`;

    console.log('[WameetNotificationService] Envoi push Guichet Ouvert :', { title, body });

    // 1. Déclenchement FCM si un token est disponible
    if (this.currentFcmToken) {
      triggerNotification(this.currentFcmToken, title, body, {
        type: 'GUICHET_OPENED',
        creatorId: params.creatorId,
        roomId: params.roomId || 'wameet-live-guichet',
        url: `/wameet?room=${params.roomId || 'wameet-live-guichet'}`
      }).catch(() => {});
    }

    // 2. Notification locale de secours si permission accordée
    this.sendBrowserNotification(title, body);
  }

  /**
   * Déclencheur 2 : Rappel de Rendez-vous (10 minutes avant)
   */
  async notifyAppointmentReminder(appointment: WameetAppointment): Promise<void> {
    const title = `⏰ Rappel : Wameet avec ${appointment.creatorName}`;
    const body = `Votre session commence à ${appointment.timeSlot} pour "${appointment.reason}". Rejoignez le salon sécurisé dès maintenant !`;

    console.log('[WameetNotificationService] Envoi rappel rendez-vous :', { title, body });

    if (this.currentFcmToken) {
      triggerNotification(this.currentFcmToken, title, body, {
        type: 'APPOINTMENT_REMINDER',
        appointmentId: appointment.id,
        roomId: appointment.jitsiRoomId,
        url: `/wameet?room=${appointment.jitsiRoomId}`
      }).catch(() => {});
    }

    this.sendBrowserNotification(title, body);
  }

  /**
   * Déclencheur 3 : Synergy Match (Résonance Mutuelle)
   */
  async notifySynergyMatch(params: {
    partnerName: string;
    score: number;
    roomId?: string;
  }): Promise<void> {
    const title = `⚡ Synergy Match Détecté avec ${params.partnerName} !`;
    const body = `Votre vibration a résonné à ${params.score}% avec ${params.partnerName}. Un salon Wameet privé est ouvert pour votre échange !`;

    console.log('[WameetNotificationService] Envoi notification Synergy Match :', { title, body });

    if (this.currentFcmToken) {
      triggerNotification(this.currentFcmToken, title, body, {
        type: 'SYNERGY_MATCH',
        partnerName: params.partnerName,
        roomId: params.roomId || `wameet-synergy-${Date.now()}`
      }).catch(() => {});
    }

    this.sendBrowserNotification(title, body);
  }

  /**
   * Notification native de secours via l'API Web Notification
   */
  private sendBrowserNotification(title: string, body: string) {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `wameet-${Date.now()}`
        });
      } catch (e) {}
    }
  }
}

export const wameetNotificationService = new WameetNotificationService();
