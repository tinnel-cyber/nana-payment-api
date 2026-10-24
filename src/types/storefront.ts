/**
 * Types pour le module Visual Storefront Builder (Elementor Natif)
 * Conception drag-and-drop de pages de vente et tunnels de conversion.
 */

export type StorefrontBlockType = 
  | 'HERO' 
  | 'TESTIMONIALS' 
  | 'SYLLABUS' 
  | 'PRICING' 
  | 'FAQ' 
  | 'INSTRUCTOR_BIO';

export type StorefrontPalette = 'CYBER_INDIGO' | 'EMERALD_FINTECH' | 'SUNSET_AMBER' | 'ROSE_NEON';

export interface StorefrontThemeConfig {
  palette: StorefrontPalette;
  primaryColor: string;
  accentColor: string;
  badgeBg: string;
  fontPreset: 'CYBER_TECH' | 'MODERN_SANS' | 'EDITORIAL';
  darkMode: boolean;
}

export interface StorefrontBlockSettings {
  padding: 'sm' | 'md' | 'lg';
  background: 'dark' | 'gradient' | 'glass';
  align: 'left' | 'center';
  hidden?: boolean;
}

export interface HeroBlockData {
  headline: string;
  subheadline: string;
  badgeText: string;
  videoPitchUrl?: string;
  posterImageUrl?: string;
  primaryCtaText: string;
  secondaryCtaText?: string;
  bulletPoints: string[];
  socialProofBadge?: string;
}

export interface TestimonialItem {
  id: string;
  studentName: string;
  role: string;
  cityCountry: string;
  flagEmoji: string;
  avatarUrl?: string;
  rating: number; // 1-5
  comment: string;
  badgeVerified?: string;
}

export interface TestimonialsBlockData {
  title: string;
  subtitle: string;
  items: TestimonialItem[];
}

export interface SyllabusModulePreview {
  id: string;
  title: string;
  durationText: string;
  lessonsCount: number;
  highlightPoints: string[];
}

export interface SyllabusBlockData {
  title: string;
  subtitle: string;
  totalDurationText: string;
  totalLessonsText: string;
  modules: SyllabusModulePreview[];
  guaranteeText?: string;
}

export interface PricingPlanTier {
  id: string;
  name: string;
  badge?: string;
  priceCFA: number;
  originalPriceCFA?: number;
  isPopular?: boolean;
  features: string[];
  ctaLabel: string;
  mobileMoneyProviders: Array<'ORANGE' | 'WAVE' | 'MOOV' | 'MTN' | 'CARD'>;
}

export interface PricingBlockData {
  title: string;
  subtitle: string;
  countdownHours?: number;
  urgencyWarning?: string;
  plans: PricingPlanTier[];
  guaranteeNotice?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqBlockData {
  title: string;
  subtitle: string;
  items: FaqItem[];
}

export interface InstructorBioBlockData {
  title: string;
  instructorName: string;
  instructorTitle: string;
  bioSummary: string;
  avatarUrl?: string;
  stats: Array<{ label: string; value: string }>;
  verifiedCredentials: string[];
}

export type StorefrontBlockData = 
  | { type: 'HERO'; data: HeroBlockData }
  | { type: 'TESTIMONIALS'; data: TestimonialsBlockData }
  | { type: 'SYLLABUS'; data: SyllabusBlockData }
  | { type: 'PRICING'; data: PricingBlockData }
  | { type: 'FAQ'; data: FaqBlockData }
  | { type: 'INSTRUCTOR_BIO'; data: InstructorBioBlockData };

export interface StorefrontBlock {
  id: string;
  type: StorefrontBlockType;
  title: string;
  data: any; // HeroBlockData | TestimonialsBlockData | etc.
  settings: StorefrontBlockSettings;
}

export interface StorefrontPageSchema {
  id: string;
  courseId: string;
  courseTitle: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  theme: StorefrontThemeConfig;
  blocks: StorefrontBlock[];
  isPublished: boolean;
  publishedAt?: number;
  updatedAt: number;
}
