import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Crown, CheckCircle2, Zap } from 'lucide-react';
import { AppRegistryItem, getAppTrialLabel, getAppPalmaresBadge } from '../../data/appsRegistry';
import { isAppActivated, onAppActivationChanged } from '../../services/appActivationService';
import { playTapBeep, playValidationBeep } from '../../utils/audio';

export interface AppCardProps {
  app: AppRegistryItem;
  onLaunch: (app: AppRegistryItem) => void;
  onOpenDetails?: (app: AppRegistryItem) => void;
  isSelected?: boolean;
  className?: string;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  onLaunch,
  onOpenDetails,
  isSelected = false,
  className = ''
}) => {
  const [isActive, setIsActive] = useState<boolean>(() => isAppActivated(app.id));

  useEffect(() => {
    setIsActive(isAppActivated(app.id));
    const unsubscribe = onAppActivationChanged((changedAppId) => {
      if (!changedAppId || changedAppId === app.id) {
        setIsActive(isAppActivated(app.id));
      }
    });
    return unsubscribe;
  }, [app.id]);

  const trialLabel = getAppTrialLabel(app);
  const palmaresBadge = getAppPalmaresBadge(app);
  const appDedicatedRoute = `/dashboard/apps/${app.id}`;

  // Clic sur le nom de l'application : Si active, lien direct vers /dashboard/apps/[app-id]
  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    playValidationBeep();
    if (isActive) {
      onLaunch(app);
    } else if (onOpenDetails) {
      onOpenDetails(app);
    } else {
      onLaunch(app);
    }
  };

  // Clic sur la carte : ouvre la modale de détails pour configurer / essayer / prévisualiser
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    playTapBeep();
    if (onOpenDetails) {
      onOpenDetails(app);
    } else {
      onLaunch(app);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(e as any);
        }
      }}
      className={`group relative flex flex-col justify-between p-4 rounded-2xl sm:rounded-3xl border transition-all duration-200 select-none cursor-pointer overflow-hidden backdrop-blur-md ${
        isSelected
          ? 'bg-blue-950/80 border-blue-400/80 shadow-xl shadow-blue-950/60 ring-2 ring-blue-500/30 -translate-y-0.5'
          : 'bg-[#0A1325]/80 hover:bg-[#0E1B36] border-white/[0.08] hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-950/40 hover:-translate-y-0.5'
      } ${className}`}
    >
      {/* 1. Zone Supérieure : Logo Vectoriel + Nom de l'App cliquable + Badge Palmarès */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          {/* Logo Vectoriel Haute Définition (En Haut à Gauche) */}
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 p-2 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:border-cyan-500/50 group-hover:bg-white/[0.07] transition-all duration-200">
            {app.appLogo ? (
              <img
                src={app.appLogo}
                alt={app.appName}
                className="w-full h-full object-contain filter drop-shadow-xs"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-cyan-400 font-black text-sm">${app.appName.slice(0, 2).toUpperCase()}</span>`;
                  }
                }}
              />
            ) : (
              <Sparkles className="w-6 h-6 text-cyan-400" />
            )}
          </div>

          {/* Badge Palmarès Incitatif (En Haut à Droite) */}
          <div className="flex flex-col items-end gap-1">
            <span
              className={`inline-flex items-center gap-1 text-[10.5px] font-black px-2.5 py-1 rounded-full border shadow-xs tracking-tight ${
                palmaresBadge.includes('🔥') || palmaresBadge.includes('Top')
                  ? 'bg-gradient-to-r from-amber-500/15 to-rose-500/15 text-amber-300 border-amber-500/30'
                  : palmaresBadge.includes('🚀') || palmaresBadge.includes('Boost')
                  ? 'bg-gradient-to-r from-blue-500/15 to-cyan-500/15 text-cyan-300 border-cyan-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {palmaresBadge}
            </span>

            {app.isPro && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Crown className="w-2.5 h-2.5 text-amber-400" /> PRO
              </span>
            )}
          </div>
        </div>

        {/* Nom de l'App (Agit comme un lien direct vers son espace dédié /dashboard/apps/[id] si activée) */}
        <div>
          <a
            href={appDedicatedRoute}
            onClick={handleNameClick}
            title={isActive ? `Ouvrir ${app.appName} (${appDedicatedRoute})` : `Découvrir ${app.appName}`}
            className="inline-flex items-center gap-1.5 text-sm sm:text-base font-black text-white group-hover:text-cyan-300 hover:underline transition-colors tracking-tight line-clamp-1"
          >
            <span>{app.appName}</span>
            {isActive && (
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" title="Application active" />
            )}
          </a>

          {/* Courte Description : 1 à 2 lignes claires */}
          <p className="text-xs text-slate-300/80 group-hover:text-slate-200 mt-1 line-clamp-2 leading-relaxed font-normal">
            {app.shortDescription}
          </p>
        </div>
      </div>

      {/* 2. Pied de Carte : Mode d'essai / Tarif & Action rapide */}
      <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Badge Statut / Mode d'Essai */}
          {isActive ? (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Active
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-white/[0.04] text-slate-200 border border-white/10 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              {trialLabel}
            </span>
          )}

          {/* Prix mensuel */}
          {app.priceMonthly > 0 ? (
            <span className="text-[11px] font-medium text-slate-400">
              {app.priceMonthly.toLocaleString('fr-FR')} F/m
            </span>
          ) : (
            <span className="text-[11px] font-medium text-emerald-400/90">
              Inclus
            </span>
          )}
        </div>

        {/* Bouton d'action / Flèche */}
        <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-cyan-400 group-hover:text-white transition-colors">
          <span className="hidden sm:inline text-[11px]">{isActive ? 'Ouvrir' : 'Détails'}</span>
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500 text-cyan-300 group-hover:text-slate-950 flex items-center justify-center transition-all duration-150">
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
