import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Play, 
  Pause, 
  CheckCircle2, 
  Settings, 
  Rocket, 
  Zap, 
  Gift, 
  ShieldCheck, 
  Clock, 
  Flame, 
  Crown,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronRight,
  Award
} from 'lucide-react';
import { AppRegistryItem, getAppPalmaresBadge, getAppTrialLabel } from '../../data/appsRegistry';
import { isAppActivated, activateApp } from '../../services/appActivationService';
import { playTapBeep, playValidationBeep, playCashChime } from '../../utils/audio';

export interface AppDetailModalProps {
  app: AppRegistryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (app: AppRegistryItem) => void;
  onConfigure?: (app: AppRegistryItem) => void;
}

export const AppDetailModal: React.FC<AppDetailModalProps> = ({
  app,
  isOpen,
  onClose,
  onLaunch,
  onConfigure
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(true);
  const [justActivated, setJustActivated] = useState<boolean>(false);

  useEffect(() => {
    if (app && isOpen) {
      setIsActive(isAppActivated(app.id));
      setJustActivated(false);
      setIsVideoPlaying(false);
    }
  }, [app, isOpen]);

  // Fermeture par touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !app) return null;

  const palmaresBadge = getAppPalmaresBadge(app);
  const trialLabel = getAppTrialLabel(app);

  // Détection du type de module pour le bouton dynamique
  const isManagementModule = 
    app.category === 'Gestion & Stock' || 
    app.category === 'Commerce & Ventes' ||
    app.id.includes('pos') || 
    app.id.includes('stock') || 
    app.id.includes('caisse');

  const isAiOrSmsModule = 
    app.category === 'Marketing & Studio' || 
    app.keywords.includes('ia') || 
    app.keywords.includes('sms') || 
    app.keywords.includes('video') || 
    app.id.includes('nanagenerator') || 
    app.id.includes('studio-ia');

  // Gestion de l'activation
  const handleActivate = () => {
    playCashChime();
    activateApp(app.id, app.trialType);
    setIsActive(true);
    setJustActivated(true);
  };

  const handleLaunchClick = () => {
    playValidationBeep();
    onClose();
    onLaunch(app);
  };

  const handleConfigureClick = () => {
    playTapBeep();
    if (onConfigure) {
      onConfigure(app);
    } else {
      handleLaunchClick();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#09152B] border-2 border-blue-500/60 rounded-3xl sm:rounded-[32px] shadow-2xl shadow-blue-950/90 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Bouton de Fermeture */}
        <button
          type="button"
          onClick={() => {
            playTapBeep();
            onClose();
          }}
          className="absolute top-4 right-4 z-20 p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition shadow-md"
          title="Fermer la fenêtre (Échap)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* =========================================================================
            1. EN-TÊTE : GRAND LOGO + NOM DE L'APP + BADGE DE CATÉGORIE
           ========================================================================= */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-b from-[#0F234A] to-[#09152B] border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
          {/* Grand Logo Vectoriel */}
          <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 border-2 border-blue-500/40 p-2.5 sm:p-3 flex items-center justify-center shadow-xl shadow-blue-950/60 overflow-hidden">
            {app.appLogo ? (
              <img 
                src={app.appLogo} 
                alt={app.appName}
                className="w-full h-full object-contain filter drop-shadow-md"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-blue-400 font-black text-xl">${app.appName.slice(0, 2).toUpperCase()}</span>`;
                  }
                }}
              />
            ) : (
              <Sparkles className="w-10 h-10 text-blue-400" />
            )}
          </div>

          {/* Nom de l'App & Badges */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                {app.category}
              </span>
              {app.isPro && (
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" /> PRO
                </span>
              )}
              {isActive && (
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Activée
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {app.appName}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed font-medium">
              {app.shortDescription}
            </p>
          </div>
        </div>

        {/* Corps Défilable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scroll-smooth">
          
          {/* =========================================================================
              2. PALMARÈS INCITATIF : STATISTIQUES DE RÉUSSITE LOCALES
             ========================================================================= */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900/60 border border-blue-500/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Impact & Statistiques
                </p>
                <p className="text-sm sm:text-base font-black text-amber-300">
                  {app.palmares}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
              <span className="text-xs font-bold text-slate-400 block">Confiance Marchande</span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 flex items-center gap-1 sm:justify-end">
                <ShieldCheck className="w-3.5 h-3.5" /> Utilisé par +500 boutiques à Ouagadougou
              </span>
            </div>
          </div>

          {/* =========================================================================
              3. LECTEUR VIDÉO / TUTORIEL : DÉMONSTRATION EN 1 MINUTE
             ========================================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                Démonstration Interactive
              </h3>
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Durée : 1 minute
              </span>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-video bg-black/90 border-2 border-slate-700/80 shadow-2xl flex items-center justify-center group">
              {isVideoPlaying ? (
                <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                  {/* Vidéo ou simulation de démonstration interactive */}
                  <video
                    src="/assets/videos/intro_nanasore.mp4"
                    autoPlay
                    loop
                    muted={isVideoMuted}
                    className="w-full h-full object-cover"
                  />
                  {/* Contrôles overlay vidéo */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-xs">
                    <button
                      type="button"
                      onClick={() => setIsVideoPlaying(false)}
                      className="flex items-center gap-1.5 font-bold hover:text-blue-400 transition"
                    >
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </button>
                    <span className="text-[10px] text-slate-300 font-mono">0:45 / 1:00</span>
                    <button
                      type="button"
                      onClick={() => setIsVideoMuted(prev => !prev)}
                      className="p-1 hover:text-blue-400 transition"
                      title={isVideoMuted ? "Activer le son" : "Couper le son"}
                    >
                      {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-tr from-blue-950/70 via-slate-900 to-indigo-950/80 p-6 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-xl shadow-blue-600/50 cursor-pointer transform group-hover:scale-110 active:scale-95 transition-all mb-3"
                    onClick={() => {
                      playTapBeep();
                      setIsVideoPlaying(true);
                    }}
                  >
                    <Play className="w-6 h-6 ml-1 fill-white" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playTapBeep();
                      setIsVideoPlaying(true);
                    }}
                    className="text-xs sm:text-sm font-black text-white hover:text-blue-300 transition tracking-tight"
                  >
                    ▶️ Voir la démonstration (1 min)
                  </button>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    Découvrez en 60 secondes comment {app.appName} accélère vos ventes au quotidien.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Message de succès après activation instantanée */}
          {justActivated && (
            <div className="p-4 rounded-2xl bg-emerald-950/70 border-2 border-emerald-500 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-black text-white">Application activée avec succès !</p>
                <p className="text-[11px] text-emerald-300/90 font-medium">
                  Votre période d'essai de {trialLabel} est prête. Vous pouvez lancer et configurer l'application dès maintenant.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* =========================================================================
            4. ZONE D'ACTION DYNAMIQUE (PIED DE MODALE)
           ========================================================================= */}
        <div className="bg-[#060F1E] border-t border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">
              Tarif : <strong className="text-white">{app.priceMonthly === 0 ? 'Gratuit' : `${app.priceMonthly.toLocaleString('fr-FR')} FCFA/mois`}</strong>
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{trialLabel}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isActive ? (
              <>
                {/* Si déjà Actif : Bouton '⚙️ Configurer' */}
                <button
                  type="button"
                  onClick={handleConfigureClick}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Settings className="w-4 h-4 text-slate-300" />
                  <span>⚙️ Configurer</span>
                </button>

                {/* Si déjà Actif : Bouton '🚀 Lancer l'application' */}
                <button
                  type="button"
                  onClick={handleLaunchClick}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-xs font-black text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-900/40"
                >
                  <Rocket className="w-4 h-4 text-white" />
                  <span>🚀 Lancer l'application</span>
                </button>
              </>
            ) : isManagementModule ? (
              /* Si Module de Gestion (POS, Stock) : Bouton '⚡ Essayer 7 jours gratuitement' */
              <button
                type="button"
                onClick={handleActivate}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-xs sm:text-sm font-black text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50"
              >
                <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>⚡ Essayer 7 jours gratuitement</span>
              </button>
            ) : isAiOrSmsModule ? (
              /* Si Module IA / SMS (Nanagénérateur, WhatsApp) : Bouton '🎁 Tester avec Crédits Offerts' */
              <button
                type="button"
                onClick={handleActivate}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-xs sm:text-sm font-black text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/50"
              >
                <Gift className="w-4 h-4 text-slate-950" />
                <span>🎁 Tester avec Crédits Offerts</span>
              </button>
            ) : (
              /* Autre Module : Essai / Activation Standard */
              <button
                type="button"
                onClick={handleActivate}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-xs sm:text-sm font-black text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/40"
              >
                <Rocket className="w-4 h-4 text-white" />
                <span>⚡ Activer {trialLabel}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
