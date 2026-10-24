import React, { useState } from 'react';
import { X, Volume2, VolumeX, Maximize2, Zap, ArrowUpRight } from 'lucide-react';
import { LiveProductItem } from './liveStreamAssets';
import { formatCFA, playTapBeep, playValidationBeep } from '../../utils/audio';

interface LiveMiniPlayerProps {
  streamUrl?: string;
  pinnedProduct: LiveProductItem;
  onOpenOffer: (product: LiveProductItem) => void;
  isVisible: boolean;
  onClose: () => void;
  onScrollToTop: () => void;
}

const DEFAULT_DEMO_STREAM_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';

export const LiveMiniPlayer: React.FC<LiveMiniPlayerProps> = ({
  streamUrl,
  pinnedProduct,
  onOpenOffer,
  isVisible,
  onClose,
  onScrollToTop
}) => {
  const [isMuted, setIsMuted] = useState(true);

  if (!isVisible) return null;

  const isYouTube = streamUrl && (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be'));
  const isTwitch = streamUrl && streamUrl.includes('twitch.tv');

  const handleCta = (e: React.MouseEvent) => {
    e.stopPropagation();
    playValidationBeep();
    onOpenOffer(pinnedProduct);
  };

  const handleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTapBeep();
    setIsMuted(!isMuted);
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTapBeep();
    onScrollToTop();
  };

  return (
    <aside 
      aria-label="Mini-lecteur en direct Picture-in-Picture"
      className="hidden md:flex flex-col fixed bottom-6 left-6 z-[950] w-[320px] rounded-[12px] overflow-hidden border-2 border-[#8B5CF6] shadow-2xl shadow-black/80 bg-black animate-in slide-in-from-bottom-6 duration-300 group select-none"
    >
      {/* 1. Zone Vidéo Mini (Aspect Ratio 16/9) */}
      <div className="relative w-full aspect-video bg-black overflow-hidden">
        {isYouTube ? (
          <iframe
            src={`${streamUrl}?autoplay=1&mute=${isMuted ? 1 : 0}&enablejsapi=1`}
            title="Mini Live YouTube"
            className="w-full h-full border-0 pointer-events-none"
          />
        ) : isTwitch ? (
          <iframe
            src={`${streamUrl}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}&autoplay=true&muted=${isMuted}`}
            title="Mini Live Twitch"
            className="w-full h-full border-0 pointer-events-none"
          />
        ) : (
          <video
            src={streamUrl || DEFAULT_DEMO_STREAM_VIDEO}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {/* Gradient sombre pour lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

        {/* Barre supérieure du Mini Player */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
          {/* Badge Live */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FF2A54]/90 backdrop-blur-md text-white text-[9px] font-black shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white live-pulse-dot" />
            <span>EN DIRECT</span>
          </div>

          {/* Boutons d'action : Son, Agrandir & Fermer */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSound}
              className="w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer"
              title={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={handleExpand}
              className="w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer"
              title="Revenir à la scène principale"
            >
              <Maximize2 className="w-3 h-3 text-slate-300" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playTapBeep();
                onClose();
              }}
              className="w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Fermer le mini-lecteur"
              aria-label="Fermer le mini-lecteur"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bandeau Produit Épinglé & CTA Direct */}
      <div className="p-2.5 bg-[#090A0F]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 shrink-0 p-0.5 overflow-hidden flex items-center justify-center">
            <img 
              src={pinnedProduct.image} 
              alt={pinnedProduct.name} 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-bold text-white truncate">
              {pinnedProduct.name}
            </span>
            <span className="block text-[11px] font-black text-[#F59E0B] tabular-nums">
              {formatCFA(pinnedProduct.price)}
            </span>
          </div>
        </div>

        {/* Bouton "Acheter l'offre en cours" */}
        <button
          type="button"
          onClick={handleCta}
          className="px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide text-white live-btn-accent flex items-center gap-1 shrink-0 transition active:scale-95 cursor-pointer shadow-md shadow-indigo-600/30"
          title="Acheter l'offre en cours dans le tunnel dépliable"
        >
          <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
          <span>Acheter</span>
        </button>
      </div>
    </aside>
  );
};
