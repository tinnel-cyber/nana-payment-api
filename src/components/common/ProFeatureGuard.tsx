/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Composant UI de verrouillage valorisant (Psychologie de l'Upsell PLG).
 * Remplace les cadenas punitifs par une Couronne Dorée (👑) ou Sparkles animée.
 * Maintient le texte parfaitement lisible pour créer le désir (Vitrine Séduisante).
 * Intercepte le clic sur les comptes gratuits pour déclencher la modale d'Upsell.
 */

import React from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { ProFeatureKey, triggerProFeatureUpsell } from '../../utils/planFeatures';
import { playTapBeep } from '../../utils/audio';

export interface ProCrownIconProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const ProCrownIcon: React.FC<ProCrownIconProps> = ({
  className = '',
  size = 'sm',
  animated = true
}) => {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const currentSize = sizeMap[size];

  return (
    <span 
      className={`inline-flex items-center justify-center relative shrink-0 ${className}`}
      title="Fonctionnalité Pro — Déblocage disponible"
    >
      <Crown 
        className={`${currentSize} text-amber-400 fill-amber-400/30 ${animated ? 'animate-pulse' : ''} filter drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]`}
      />
    </span>
  );
};

export interface ProFeatureBadgeProps {
  label?: string;
  size?: 'xs' | 'sm';
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const ProFeatureBadge: React.FC<ProFeatureBadgeProps> = ({
  label = 'PRO',
  size = 'xs',
  className = '',
  onClick
}) => {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-black uppercase tracking-wider rounded-md border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-yellow-400/20 to-amber-500/15 text-amber-300 shadow-xs cursor-pointer select-none hover:scale-105 transition-transform ${
        size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
      } ${className}`}
    >
      <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400/30 animate-pulse" />
      <span>{label}</span>
    </span>
  );
};

export interface ProFeatureGuardProps {
  featureKey: ProFeatureKey;
  isLocked: boolean;
  children: React.ReactNode;
  fallbackAction?: () => void;
  className?: string;
  showBadge?: boolean;
  badgeLabel?: string;
  badgePosition?: 'right' | 'left' | 'top-right';
}

export const ProFeatureGuard: React.FC<ProFeatureGuardProps> = ({
  featureKey,
  isLocked,
  children,
  fallbackAction,
  className = '',
  showBadge = true,
  badgeLabel = 'PRO',
  badgePosition = 'right'
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      e.stopPropagation();
      playTapBeep();
      if (fallbackAction) {
        fallbackAction();
      } else {
        triggerProFeatureUpsell(featureKey);
      }
    }
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div
      onClick={handleClick}
      className={`relative group cursor-pointer transition-all duration-200 ${
        isLocked
          ? 'hover:border-amber-500/40 hover:bg-amber-500/5'
          : ''
      } ${className}`}
    >
      {/* Conteneur enfant avec opacité subtile pour un aspect exclusif sans grisage illisible */}
      <div className="opacity-95 group-hover:opacity-100 transition-opacity pointer-events-none select-none">
        {children}
      </div>

      {/* Couronne dorée PRO positionnée de façon visible */}
      {showBadge && (
        <div 
          className={`absolute z-20 flex items-center gap-1 ${
            badgePosition === 'right' 
              ? 'right-2.5 top-1/2 -translate-y-1/2' 
              : badgePosition === 'top-right'
              ? 'top-2 right-2'
              : 'left-2.5 top-1/2 -translate-y-1/2'
          }`}
        >
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950/90 border border-amber-500/50 text-amber-300 text-[9.5px] font-black shadow-lg shadow-amber-950/60 group-hover:border-amber-400 group-hover:bg-amber-950/80 transition-all">
            <Crown className="w-3 h-3 text-amber-400 fill-amber-400/40 animate-pulse" />
            <span>{badgeLabel}</span>
          </span>
        </div>
      )}
    </div>
  );
};
