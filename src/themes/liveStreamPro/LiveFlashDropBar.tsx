import React, { useState, useEffect } from 'react';
import { Zap, Clock, Flame } from 'lucide-react';

interface LiveFlashDropBarProps {
  initialSeconds?: number;
}

export const LiveFlashDropBar: React.FC<LiveFlashDropBarProps> = ({
  initialSeconds = 2538 // ~ 00h 42m 18s
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const pad = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-3">
      <div 
        className="w-full rounded-[16px] p-4 sm:p-5 lg:px-8 lg:py-5 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 shadow-2xl relative overflow-hidden select-none border border-white/20"
        style={{
          background: 'linear-gradient(90deg, #FF2A54 0%, #8B5CF6 100%)'
        }}
      >
        {/* Lueur d'ambiance d'arrière-plan */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-black/20 blur-2xl pointer-events-none" />

        {/* ================= GAUCHE : TITRE IMPACTANT ================= */}
        <div className="flex items-center gap-3 text-center md:text-left z-10">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
            <Zap className="w-6 h-6 text-amber-300 fill-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-200 bg-black/30 px-2 py-0.5 rounded-full border border-amber-300/30">
                OFFRE CHRONOMÉTRÉE
              </span>
              <span className="flex items-center text-[11px] font-bold text-white/90">
                <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300 mr-0.5" />
                Stocks limités
              </span>
            </div>
            <h3 className="text-sm sm:text-base lg:text-lg font-black uppercase tracking-tight text-white leading-tight mt-1">
              ⚡ VENTES FLASH DU DIRECT — LES PRIX EXPIRENT À LA FIN DU LIVE !
            </h3>
          </div>
        </div>

        {/* ================= DROITE : COMPTE À REBOURS GÉANT EN BOÎTES TRANSLUCIDES ================= */}
        <div className="flex items-center gap-2 sm:gap-3 z-10 shrink-0">
          
          {/* Boîte Heures */}
          <div className="flex flex-col items-center">
            <div className="w-14 sm:w-16 h-12 sm:h-14 rounded-xl bg-black/45 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <span className="text-xl sm:text-2xl font-black text-white tabular-nums tracking-tight">
                {pad(hours)}
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-white/80 tracking-wider mt-1">
              HEURES
            </span>
          </div>

          <span className="text-xl sm:text-2xl font-black text-white/80 -mt-4">:</span>

          {/* Boîte Minutes */}
          <div className="flex flex-col items-center">
            <div className="w-14 sm:w-16 h-12 sm:h-14 rounded-xl bg-black/45 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <span className="text-xl sm:text-2xl font-black text-white tabular-nums tracking-tight">
                {pad(minutes)}
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-white/80 tracking-wider mt-1">
              MINS
            </span>
          </div>

          <span className="text-xl sm:text-2xl font-black text-white/80 -mt-4">:</span>

          {/* Boîte Secondes */}
          <div className="flex flex-col items-center">
            <div className="w-14 sm:w-16 h-12 sm:h-14 rounded-xl bg-black/45 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <span className="text-xl sm:text-2xl font-black text-amber-300 tabular-nums tracking-tight">
                {pad(seconds)}
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-white/80 tracking-wider mt-1">
              SECS
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
