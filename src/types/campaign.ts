export type CampaignCtaType = 'MOBILE_MONEY' | 'WHATSAPP' | 'HYBRID';

export interface CampaignBonusItem {
  id: string;
  title: string;
  valueCFA: number;
  description: string;
}

export interface PromoCampaign {
  id: string;
  courseId: string;
  courseTitle: string;
  courseCoverImage: string;
  courseTrailerVideoUrl: string;
  category?: string;
  campaignName: string;
  headline: string;
  subheadline?: string;
  originalPrice: number;
  discountPrice: number;
  currency: string;
  deadlineTimestamp: number;
  ctaType: CampaignCtaType;
  ctaLabel?: string;
  bonusItems: CampaignBonusItem[];
  instructor: {
    name: string;
    title: string;
    avatarUrl: string;
    phoneWhatsApp: string;
  };
  urgencyScarcity: {
    totalSeats: number;
    remainingSeats: number;
  };
  stats: {
    viewsCount: number;
    clicksCount: number;
    conversionsCount: number;
    totalRevenueCFA: number;
  };
  status: 'active' | 'expired' | 'paused';
  createdAt: number;
  updatedAt: number;
}

export interface CreateCampaignInput {
  courseId: string;
  campaignName: string;
  headline: string;
  subheadline?: string;
  discountPrice: number;
  durationHours: number; // e.g. 12, 24, 48, 72, 168
  customDeadline?: number;
  ctaType: CampaignCtaType;
  ctaLabel?: string;
  bonusIds?: string[];
}
