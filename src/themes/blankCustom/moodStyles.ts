import React from 'react';
import { CustomThemeMood, CustomThemeMoodPreset } from '../../types';

export const THEME_MOOD_PRESETS: Record<CustomThemeMoodPreset, CustomThemeMood> = {
  'nanasore-royal': {
    presetId: 'nanasore-royal',
    bgColor: '#FFFFFF',
    surfaceColor: '#F8FAFC',
    textColor: '#0F172A',
    mutedTextColor: '#64748B',
    accentColor: '#2563EB',
    buttonRadius: 'xl',
    fontPairing: 'modern-sans'
  },
  'spotify-obsidian': {
    presetId: 'spotify-obsidian',
    bgColor: '#121212',
    surfaceColor: '#181818',
    textColor: '#FFFFFF',
    mutedTextColor: '#A1A1AA',
    accentColor: '#1DB954',
    buttonRadius: 'full',
    fontPairing: 'modern-sans'
  },
  'hermes-sand': {
    presetId: 'hermes-sand',
    bgColor: '#FAF7F2',
    surfaceColor: '#FFFDF9',
    textColor: '#292524',
    mutedTextColor: '#78716C',
    accentColor: '#C25E00',
    buttonRadius: 'md',
    fontPairing: 'luxury-serif'
  },
  'emerald-botanic': {
    presetId: 'emerald-botanic',
    bgColor: '#0A1C16',
    surfaceColor: '#0F2C23',
    textColor: '#ECFDF5',
    mutedTextColor: '#6EE7B7',
    accentColor: '#10B981',
    buttonRadius: 'xl',
    fontPairing: 'modern-sans'
  },
  'cyber-neon': {
    presetId: 'cyber-neon',
    bgColor: '#08090E',
    surfaceColor: '#10131E',
    textColor: '#F8FAFC',
    mutedTextColor: '#94A3B8',
    accentColor: '#06B6D4',
    buttonRadius: 'none',
    fontPairing: 'tech-mono'
  },
  'custom': {
    presetId: 'custom',
    bgColor: '#FFFFFF',
    surfaceColor: '#F8FAFC',
    textColor: '#0F172A',
    mutedTextColor: '#64748B',
    accentColor: '#2563EB',
    buttonRadius: 'xl',
    fontPairing: 'modern-sans'
  }
};

export interface MoodStyleConfig {
  name: string;
  badgeLabel: string;
  bg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  sectionBg: string;
  sectionAltBg: string;
  accentButton: string;
  accentBadge: string;
  accentBorder: string;
  accentText: string;
  headerBg: string;
  footerBg: string;
  announcementBg: string;
  announcementText: string;
}

export const resolveCustomThemeMood = (moodInput?: CustomThemeMood | string): CustomThemeMood => {
  if (moodInput && typeof moodInput === 'object' && moodInput.presetId) {
    const base = THEME_MOOD_PRESETS[moodInput.presetId] || THEME_MOOD_PRESETS['nanasore-royal'];
    return { ...base, ...moodInput };
  }
  if (typeof moodInput === 'string') {
    if (moodInput === 'blue_white') return THEME_MOOD_PRESETS['nanasore-royal'];
    if (moodInput === 'spotify_dark') return THEME_MOOD_PRESETS['spotify-obsidian'];
    if (moodInput === 'sand_nature') return THEME_MOOD_PRESETS['hermes-sand'];
    if (moodInput === 'luxury_gold') return THEME_MOOD_PRESETS['emerald-botanic'];
    if (moodInput in THEME_MOOD_PRESETS) return THEME_MOOD_PRESETS[moodInput as CustomThemeMoodPreset];
  }
  return THEME_MOOD_PRESETS['nanasore-royal'];
};

export const getMoodCssVariables = (mood: CustomThemeMood): React.CSSProperties => {
  const radiusMap: Record<string, string> = {
    'none': '0px',
    'md': '8px',
    'xl': '16px',
    'full': '9999px'
  };

  return {
    '--theme-bg': mood.bgColor,
    '--theme-surface': mood.surfaceColor,
    '--theme-text': mood.textColor,
    '--theme-muted': mood.mutedTextColor,
    '--theme-accent': mood.accentColor,
    '--theme-radius': radiusMap[mood.buttonRadius] || '16px'
  } as React.CSSProperties;
};

export const getButtonRadiusClass = (radius?: string): string => {
  switch (radius) {
    case 'full':
    case 'rounded-full':
      return 'rounded-full';
    case 'none':
    case 'rounded-none':
      return 'rounded-none';
    case 'md':
      return 'rounded-lg';
    case 'xl':
    case 'rounded-xl':
    default:
      return 'rounded-2xl';
  }
};

export const getMoodStyle = (moodInput?: CustomThemeMood | string): MoodStyleConfig => {
  const resolved = resolveCustomThemeMood(moodInput);
  const preset = resolved.presetId;

  if (preset === 'spotify-obsidian') {
    return {
      name: 'Spotify Obsidian',
      badgeLabel: 'NOIR & ÉMERAUDE',
      bg: 'bg-[#121212]',
      textPrimary: 'text-white',
      textSecondary: 'text-zinc-400',
      textMuted: 'text-zinc-500',
      cardBg: 'bg-[#181818] border border-white/5 hover:border-emerald-500/40 hover:bg-[#202020] shadow-xl',
      sectionBg: 'bg-[#121212]',
      sectionAltBg: 'bg-[#181818] border-y border-white/5',
      accentButton: 'bg-emerald-500 hover:bg-emerald-400 text-black font-black shadow-lg shadow-emerald-500/20 active:scale-95',
      accentBadge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
      accentBorder: 'border-emerald-500',
      accentText: 'text-emerald-400',
      headerBg: 'bg-[#121212]/95 backdrop-blur-md border-b border-white/10 text-white',
      footerBg: 'bg-black text-white border-t border-white/10',
      announcementBg: 'bg-emerald-950 text-emerald-300 border-b border-emerald-800/40',
      announcementText: 'text-emerald-300'
    };
  }

  if (preset === 'hermes-sand') {
    return {
      name: 'Sable Hermes & Terracotta',
      badgeLabel: 'NATUREL • BOTANIQUE',
      bg: 'bg-[#FAF7F2]',
      textPrimary: 'text-[#292524]',
      textSecondary: 'text-[#57534E]',
      textMuted: 'text-[#78716C]',
      cardBg: 'bg-[#FFFDF9] border border-[#E7E1D8] hover:border-amber-700/40 shadow-sm hover:shadow-md',
      sectionBg: 'bg-[#FAF7F2]',
      sectionAltBg: 'bg-[#F3EFEA] border-y border-[#E7E1D8]',
      accentButton: 'bg-[#C25E00] hover:bg-[#A85100] text-white shadow-md shadow-amber-950/20 active:scale-95',
      accentBadge: 'bg-amber-100/80 text-amber-900 border border-amber-200',
      accentBorder: 'border-[#C25E00]',
      accentText: 'text-[#C25E00]',
      headerBg: 'bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E7E1D8] text-[#292524]',
      footerBg: 'bg-[#1C1917] text-amber-50 border-t border-amber-900/20',
      announcementBg: 'bg-[#C25E00] text-amber-100',
      announcementText: 'text-amber-100'
    };
  }

  if (preset === 'emerald-botanic') {
    return {
      name: 'Émeraude Botanique',
      badgeLabel: 'PRESTIGE • BIO',
      bg: 'bg-[#0A1C16]',
      textPrimary: 'text-[#ECFDF5]',
      textSecondary: 'text-emerald-200/70',
      textMuted: 'text-emerald-300/40',
      cardBg: 'bg-[#0F2C23] border border-emerald-500/20 hover:border-emerald-400/50 shadow-2xl hover:bg-[#143B30]',
      sectionBg: 'bg-[#0A1C16]',
      sectionAltBg: 'bg-[#0F2C23] border-y border-emerald-500/10',
      accentButton: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/25 active:scale-95',
      accentBadge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      accentBorder: 'border-emerald-400',
      accentText: 'text-emerald-400',
      headerBg: 'bg-[#0A1C16]/95 backdrop-blur-md border-b border-emerald-500/20 text-emerald-100',
      footerBg: 'bg-[#050D0A] text-emerald-200/80 border-t border-emerald-500/20',
      announcementBg: 'bg-emerald-600 text-slate-950 font-black',
      announcementText: 'text-slate-950 font-black'
    };
  }

  if (preset === 'cyber-neon') {
    return {
      name: 'Cyber Neon High-Tech',
      badgeLabel: 'CYBERPUNK • FUTURE',
      bg: 'bg-[#08090E]',
      textPrimary: 'text-[#F8FAFC]',
      textSecondary: 'text-slate-400',
      textMuted: 'text-slate-500',
      cardBg: 'bg-[#10131E] border border-cyan-500/20 hover:border-cyan-400/50 shadow-2xl hover:bg-[#151928]',
      sectionBg: 'bg-[#08090E]',
      sectionAltBg: 'bg-[#10131E] border-y border-cyan-500/10',
      accentButton: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-500/25 active:scale-95',
      accentBadge: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
      accentBorder: 'border-cyan-400',
      accentText: 'text-cyan-400',
      headerBg: 'bg-[#08090E]/95 backdrop-blur-md border-b border-cyan-500/20 text-slate-100',
      footerBg: 'bg-[#030407] text-slate-400 border-t border-cyan-500/20',
      announcementBg: 'bg-cyan-500 text-slate-950 font-black',
      announcementText: 'text-slate-950 font-black'
    };
  }

  // Défaut : Nanasore Bleu Royal & Blanc Original
  return {
    name: 'Bleu Nanasore Original',
    badgeLabel: 'OFFICIEL • ADN NSOURÉ',
    bg: 'bg-white',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-400',
    cardBg: 'bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300',
    sectionBg: 'bg-white',
    sectionAltBg: 'bg-slate-50/70 border-y border-slate-100',
    accentButton: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-95',
    accentBadge: 'bg-blue-50 text-blue-700 border border-blue-200',
    accentBorder: 'border-blue-600',
    accentText: 'text-blue-600',
    headerBg: 'bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900',
    footerBg: 'bg-slate-950 text-white border-t border-slate-800',
    announcementBg: 'bg-blue-600 text-white',
    announcementText: 'text-white'
  };
};
