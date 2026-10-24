// ============================================================================
// MODÈLE DE DONNÉES RÉEL : DISCUSSIONS PRIVÉES, GROUPES & CHAÎNES WAMEET
// ============================================================================

export type DiscussionType = 'private' | 'group' | 'channel';

export type MessageDeliveryStatus = 'read' | 'delivered' | 'downloaded' | 'failed';

export interface GroupMember {
  id: string;
  name?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  isOnline?: boolean;
  role?: 'admin' | 'member';
}

export interface DiscussionLastMessage {
  text?: string;
  timestamp?: string;
  sender?: 'me' | 'them' | string;
  senderName?: string; // Pour les groupes : ex "Ali", "Awa"
  status?: MessageDeliveryStatus;
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'product';
}

export interface DiscussionItem {
  id: string;
  type?: DiscussionType; // 'private' (défaut) | 'group' | 'channel'
  
  // Champs communs / privés
  name?: string | null;
  phoneNumber?: string;
  countryCode?: string | null;
  avatarUrl?: string | null;
  isOnline?: boolean;
  status?: MessageDeliveryStatus;
  categories?: string[];
  unreadCount?: number;
  lastMessage?: string | DiscussionLastMessage | null;
  timestamp?: string | null;
  isPinned?: boolean;

  // CRM & Heatmap Prospect Engagement (Score 0 - 100)
  heatScore?: number;
  lastReplyTime?: number | string;
  messagesSentByUser?: number;
  linksClicked?: number;
  cartIntentDetected?: boolean;

  // Spécifique Groupes Wameet
  groupName?: string;
  members?: GroupMember[];
  admins?: string[]; // IDs des membres ayant le rôle admin
  groupDescription?: string;

  // Spécifique Chaînes Wameet (Broadcast)
  channelName?: string;
  subscribersCount?: number;
  isReadOnly?: boolean; // Vrai pour les abonnés réguliers (lecture seule)
  isSubscribed?: boolean; // Statut d'abonnement de l'utilisateur courant
  isVerified?: boolean;
  channelDescription?: string;

  [key: string]: any; // Prévient tout crash si des champs Firestore additionnels existent
}
