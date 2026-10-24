import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Settings, X, Flame, Sparkles, Check, RotateCcw, Move } from 'lucide-react';
import { playTapBeep, playValidationBeep } from '../../utils/audio';

export interface CountdownConfig {
  enabled: boolean;
  title: string;
  targetEndTime: number; // timestamp en ms
}

interface StoreCountdownWidgetProps {
  canConfigure?: boolean;
  storeId: string;
  isPublicView?: boolean;
}

const DEFAULT_TITLE = "⚡ Vente Flash - Fin dans :";
// Par défaut : 24 heures à partir de l'initialisation si aucune configuration enregistrée
const DEFAULT_DURATION_HOURS = 24;

export const StoreCountdownWidget: React.FC<StoreCountdownWidgetProps> = ({
  canConfigure = false,
  storeId,
  isPublicView = false
}) => {
  const canShowAdminControls = canConfigure && !isPublicView;
  const storageKey = `nana_flash_countdown_${storeId}`;
  const dismissKey = `nana_flash_countdown_dismissed_${storeId}`;

  // 1. État de configuration du compte à rebours
  const [config, setConfig] = useState<CountdownConfig>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: CountdownConfig = JSON.parse(saved);
        // Si le temps est dépassé depuis plus de 2 heures, on le réinitialise sur un cycle de 24h
        if (parsed.targetEndTime && parsed.targetEndTime < Date.now()) {
          parsed.targetEndTime = Date.now() + 24 * 3600 * 1000;
          localStorage.setItem(storageKey, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {}

    const defaultCfg: CountdownConfig = {
      enabled: true,
      title: DEFAULT_TITLE,
      targetEndTime: Date.now() + DEFAULT_DURATION_HOURS * 3600 * 1000
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(defaultCfg));
    } catch (e) {}
    return defaultCfg;
  });

  // 2. État d'affichage / masquage (fermeture pour la session)
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(dismissKey) === 'true';
    } catch (e) {
      return false;
    }
  });

  // 3. Temps restant calculé en direct
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  // 4. Modale de configuration du commerçant
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editTitle, setEditTitle] = useState(config.title);
  const [editDays, setEditDays] = useState(0);
  const [editHours, setEditHours] = useState(12);
  const [editMinutes, setEditMinutes] = useState(0);
  const [editEnabled, setEditEnabled] = useState(config.enabled);

  // 5. Positionnement déplaçable (drag & drop tactile & souris)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0
  });

  // Initialisation du positionnement par défaut (en bas à droite au-dessus de la barre de panier)
  useEffect(() => {
    if (typeof window !== 'undefined' && !position) {
      const initialX = Math.max(16, window.innerWidth - 340);
      const initialY = Math.max(90, window.innerHeight - 150);
      setPosition({ x: initialX, y: initialY });
    }
  }, [position]);

  // Recalcul du compte à rebours chaque seconde
  useEffect(() => {
    if (!config.enabled) return;

    const updateCountdown = () => {
      const now = Date.now();
      const difference = config.targetEndTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [config.enabled, config.targetEndTime]);

  // Gestion du Drag & Drop via Pointer Events
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Si l'utilisateur clique sur un bouton interactif, ne pas démarrer le drag
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }

    e.preventDefault();
    isDraggingRef.current = true;
    const currentX = position?.x || 16;
    const currentY = position?.y || 90;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currentX,
      posY: currentY
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const newX = dragStartRef.current.posX + deltaX;
    const newY = dragStartRef.current.posY + deltaY;

    // Délimitation dans la zone visible de l'écran
    const widgetWidth = widgetRef.current?.offsetWidth || 300;
    const widgetHeight = widgetRef.current?.offsetHeight || 60;
    const maxX = window.innerWidth - widgetWidth - 10;
    const maxY = window.innerHeight - widgetHeight - 10;

    const clampedX = Math.max(10, Math.min(newX, maxX));
    const clampedY = Math.max(60, Math.min(newY, maxY));

    setPosition({ x: clampedX, y: clampedY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Masquer le widget pour la session
  const handleDismiss = () => {
    playTapBeep();
    setIsDismissed(true);
    try {
      sessionStorage.setItem(dismissKey, 'true');
    } catch (e) {}
  };

  // Sauvegarder la nouvelle configuration par le commerçant
  const handleSaveConfig = () => {
    playValidationBeep();
    const totalMs = ((editDays * 24 + editHours) * 60 + editMinutes) * 60 * 1000;
    const newTargetTime = Date.now() + Math.max(60000, totalMs); // Au moins 1 minute

    const updatedConfig: CountdownConfig = {
      enabled: editEnabled,
      title: editTitle.trim() || DEFAULT_TITLE,
      targetEndTime: newTargetTime
    };

    setConfig(updatedConfig);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedConfig));
    } catch (e) {}
    setShowConfigModal(false);
  };

  // Réinitialiser les champs de la modale lors de l'ouverture
  const handleOpenConfigModal = () => {
    playTapBeep();
    setEditTitle(config.title);
    setEditEnabled(config.enabled);
    if (timeLeft.isExpired) {
      setEditDays(0);
      setEditHours(24);
      setEditMinutes(0);
    } else {
      setEditDays(timeLeft.days);
      setEditHours(timeLeft.hours);
      setEditMinutes(timeLeft.minutes);
    }
    setShowConfigModal(true);
  };

  // Si désactivé par le marchand ou masqué par le visiteur, ne rien afficher
  if (!config.enabled || isDismissed) {
    // Si c'est le commerçant et qu'il est désactivé, on peut afficher un discret bouton pour le réactiver
    if (canConfigure && !config.enabled) {
      return (
        <button
          type="button"
          onClick={() => { playTapBeep(); setShowConfigModal(true); }}
          className="fixed bottom-20 right-4 z-40 bg-slate-900/90 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-full text-xs font-black shadow-xl flex items-center gap-1.5 backdrop-blur-md hover:bg-slate-800 transition cursor-pointer"
          title="Activer le Compteur Promo Flash"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>+ Compteur Promo</span>
        </button>
      );
    }
    return null;
  }

  // Formatage à 2 chiffres
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <>
      {/* Widget Flottant & Déplaçable */}
      <div
        ref={widgetRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: position ? `translate3d(${position.x}px, ${position.y}px, 0)` : undefined,
          touchAction: 'none'
        }}
        className={`fixed top-0 left-0 z-40 select-none cursor-grab active:cursor-grabbing transition-shadow duration-200
          ${!position ? 'bottom-20 right-4' : ''}`}
      >
        <div className="relative group bg-slate-900/90 hover:bg-slate-900/95 backdrop-blur-md border border-amber-500/40 hover:border-amber-400 text-amber-300 rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-amber-950/20 flex items-center gap-2.5 ring-1 ring-amber-500/20">
          
          {/* Poignée de déplacement subtile + Indicateur pulsant d'urgence */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Move className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400/80 transition" />
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
          </div>

          {/* Contenu : Titre & Compteur Chiffré */}
          <div className="flex flex-col min-w-0 pr-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-300 truncate max-w-[170px] sm:max-w-[210px]">
                {config.title}
              </span>
            </div>

            {/* Chiffres du compte à rebours */}
            <div className="flex items-center gap-1 font-mono font-black text-sm sm:text-base text-white tracking-tight mt-0.5">
              {timeLeft.isExpired ? (
                <span className="text-rose-400 text-xs font-bold animate-pulse">
                  Offre terminée !
                </span>
              ) : (
                <>
                  {timeLeft.days > 0 && (
                    <>
                      <span className="bg-slate-950/80 px-1.5 py-0.5 rounded-lg border border-amber-500/30 text-amber-400">
                        {pad(timeLeft.days)}<span className="text-[9px] text-amber-300/70 font-sans ml-0.5">j</span>
                      </span>
                      <span className="text-amber-500">:</span>
                    </>
                  )}
                  <span className="bg-slate-950/80 px-1.5 py-0.5 rounded-lg border border-amber-500/30 text-amber-400">
                    {pad(timeLeft.hours)}<span className="text-[9px] text-amber-300/70 font-sans ml-0.5">h</span>
                  </span>
                  <span className="text-amber-500">:</span>
                  <span className="bg-slate-950/80 px-1.5 py-0.5 rounded-lg border border-amber-500/30 text-amber-400">
                    {pad(timeLeft.minutes)}<span className="text-[9px] text-amber-300/70 font-sans ml-0.5">m</span>
                  </span>
                  <span className="text-amber-500">:</span>
                  <span className="bg-slate-950/80 px-1.5 py-0.5 rounded-lg border border-amber-500/30 text-white animate-pulse">
                    {pad(timeLeft.seconds)}<span className="text-[9px] text-amber-300/70 font-sans ml-0.5">s</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Boutons d'action (Config Commerçant + Fermer - Min 44x44 Touch Target) */}
          <div className="flex items-center gap-0.5 shrink-0 ml-1 border-l border-slate-800/80 pl-1">
            {canShowAdminControls && (
              <button
                type="button"
                onClick={handleOpenConfigModal}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-amber-300 rounded-xl transition cursor-pointer active:scale-95 touch-manipulation"
                title="Configurer le compte à rebours (Commerçant)"
                aria-label="Configurer le compte à rebours"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer active:scale-95 touch-manipulation"
              title="Masquer le compte à rebours"
              aria-label="Masquer le compte à rebours"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modale de Configuration Commerçant */}
      {canShowAdminControls && showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-3xl p-5 shadow-2xl text-slate-100 relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm text-white">
                  Réglages Compteur Promo Flash
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 cursor-pointer active:scale-95 touch-manipulation"
                aria-label="Fermer la modale"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Activer / Désactiver */}
            <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Afficher sur la boutique</span>
                <span className="text-[10.5px] text-slate-400">Rendre visible le bandeau d'urgence pour tous</span>
              </div>
              <button
                type="button"
                onClick={() => setEditEnabled(!editEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                  editEnabled ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    editEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Titre Personnalisé */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Titre de l'événement promo
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Ex: ⚡ Vente Flash - Fin dans :"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Durée du décompte */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Durée restante avant la fin
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Jours</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={editDays}
                    onChange={(e) => setEditDays(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-bold text-amber-400 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Heures</span>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={editHours}
                    onChange={(e) => setEditHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-bold text-amber-400 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Minutes</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-bold text-amber-400 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Raccourcis rapides */}
              <div className="flex items-center gap-1.5 pt-1.5">
                {[
                  { label: '2h', d: 0, h: 2, m: 0 },
                  { label: '6h', d: 0, h: 6, m: 0 },
                  { label: '12h', d: 0, h: 12, m: 0 },
                  { label: '24h', d: 1, h: 0, m: 0 },
                  { label: '48h', d: 2, h: 0, m: 0 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setEditDays(preset.d);
                      setEditHours(preset.h);
                      setEditMinutes(preset.m);
                    }}
                    className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 hover:text-amber-300 transition cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Enregistrer</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
