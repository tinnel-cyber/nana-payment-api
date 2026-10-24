/**
 * Types pour le module Social Campus (BuddyBoss Natif)
 * Profils apprenants, fils communautaires, messagerie directe et gamification.
 */

export type BadgeRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface LearnerBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: BadgeRarity;
  unlockedAt?: number;
  category?: 'PROGRESSION' | 'COMMUNITY' | 'EXCELLENCE' | 'SPECIAL';
}

export interface LearnerCertificateItem {
  id: string;
  courseId: string;
  courseTitle: string;
  issuedAt: number;
  studentName: string;
  verificationCode: string;
  score?: number;
  badgeEarned?: string;
  pdfUrl?: string;
}

export interface LearnerCourseProgress {
  courseId: string;
  courseTitle: string;
  progressPercent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  enrolledAt: number;
  lastActiveAt: number;
}

export interface LearnerProfile {
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'COMMUNITY_LEADER';
  title?: string; // e.g. "Spécialiste Fintech UEMOA"
  location?: string; // e.g. "Ouagadougou, BF" | "Dakar, SN" | "Abidjan, CI"
  reputationPoints: number;
  levelTitle: string; // e.g. "Apprenant Curieux", "Praticien USSD", "Expert Fintech"
  enrolledCourses: LearnerCourseProgress[];
  badges: LearnerBadge[];
  certificates: LearnerCertificateItem[];
  joinedAt: number;
  isOnline?: boolean;
}

export type CommunityTopicTag = 'GENERAL' | 'DEVOIR' | 'ENTRAIDE' | 'ASTUCE' | 'ANNONCE';

export interface CommunityPost {
  id: string;
  courseId: string; // 'GLOBAL' ou identifiant de cours
  authorId: string;
  authorName: string;
  authorRole: 'STUDENT' | 'INSTRUCTOR';
  authorAvatar?: string;
  authorTitle?: string;
  authorReputation?: number;
  content: string; // Markdown / texte riche
  attachmentUrl?: string; // Image d'exercice, schéma ou capture
  attachmentType?: 'IMAGE' | 'PDF' | 'CODE';
  attachmentTitle?: string;
  likesCount: number;
  likedBy: string[]; // liste des userIds
  commentsCount: number;
  createdAt: number;
  updatedAt?: number;
  topicTag: CommunityTopicTag;
  isPinned?: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: 'STUDENT' | 'INSTRUCTOR';
  authorAvatar?: string;
  content: string;
  createdAt: number;
  likesCount: number;
  likedBy: string[];
  isInstructorEndorsed?: boolean; // Réponse validée par l'instructeur
  endorsedByInstructorName?: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  text: string;
  createdAt: number;
  read: boolean;
}

export interface DirectConversation {
  id: string;
  participants: string[]; // [userA, userB]
  participantDetails: Record<string, {
    name: string;
    avatar?: string;
    role: 'STUDENT' | 'INSTRUCTOR';
    title?: string;
  }>;
  lastMessage?: string;
  lastMessageAt?: number;
  unreadCounts: Record<string, number>; // userId -> number
}
