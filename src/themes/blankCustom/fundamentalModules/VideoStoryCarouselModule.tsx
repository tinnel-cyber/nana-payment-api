import React, { useState } from 'react';
import { Play, Pause, ShoppingBag, Video, Volume2, VolumeX, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { CustomSectionInstance } from '../../../types';
import { StoreProductItem } from '../../../components/storeBuilder/types';
import { MoodStyleConfig } from '../moodStyles';
import { triggerOpenFunnel } from '../../themeUtils';
import { playTapBeep } from '../../../utils/audio';

export interface VideoStoryCarouselModuleProps {
  section: CustomSectionInstance;
  moodStyle: MoodStyleConfig;
  buttonRadiusClass: string;
  products: StoreProductItem[];
  storeSlug?: string;
  onOpenTunnel?: (product: StoreProductItem) => void;
  onPreviewFunnel?: (product: StoreProductItem) => void;
  onSelectProduct?: (product: StoreProductItem) => void;
  isPublicView?: boolean;
  isAdminPreview?: boolean;
}

export const VideoStoryCarouselModule: React.FC<VideoStoryCarouselModuleProps> = ({
  section,
  moodStyle,
  buttonRadiusClass,
  products = [],
  onOpenTunnel,
  onPreviewFunnel,
  onSelectProduct
}) => {
  const cfg = section.settings || section.config || {};
  const title = section.title || cfg.title || "🎬 Démonstrations & Stories Shoppables";
  const subtitle = section.subtitle || cfg.subtitle || "Regardez nos produits en action et commandez directement sous la vidéo";

  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Vidéos par défaut de qualité HD ou extraites de routineVideoUrls des produits
  const stories = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      videoUrl: string;
      poster: string;
      product: StoreProductItem;
    }> = [];

    // 1. Chercher dans les produits qui ont déjà un routineVideoUrls
    products.forEach((p, idx) => {
      if (p.routineVideoUrls && p.routineVideoUrls.length > 0 && list.length < 4) {
        list.push({
          id: `story_prod_${p.id}_${idx}`,
          title: `Démo : ${p.name}`,
          videoUrl: p.routineVideoUrls[0],
          poster: p.image || '',
          product: p
        });
      }
    });

    // 2. Fallbacks si le vendeur n'a pas encore configuré de vidéos
    const fallbackClips = [
      {
        title: "Test d'Efficacité Immédiate",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-applying-anti-aging-cream-on-her-face-41584-large.mp4",
        poster: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Routine Soin & Éclat",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-applying-facial-cream-41589-large.mp4",
        poster: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80"
      },
      {
        title: "Packaging & Déballage Luxe",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-dropper-bottle-of-skin-care-serum-41595-large.mp4",
        poster: "https://images.unsplash.com/photo-1608248597359-e93574c8b056?w=600&auto=format&fit=crop&q=80"
      }
    ];

    while (list.length < 3) {
      const fb = fallbackClips[list.length % fallbackClips.length];
      const prod = products[list.length] || products[0];
      list.push({
        id: `story_fb_${list.length}`,
        title: fb.title,
        videoUrl: cfg.videoUrls?.[list.length] || fb.videoUrl,
        poster: prod?.image || fb.poster,
        product: prod
      });
    }

    return list;
  }, [products, cfg.videoUrls]);

  const handleProductOrder = (product?: StoreProductItem) => {
    if (!product) return;
    playTapBeep();
    if (onOpenTunnel) {
      onOpenTunnel(product);
    } else if (onPreviewFunnel) {
      onPreviewFunnel(product);
    } else {
      triggerOpenFunnel(product.linkedFunnelId || product.id, product.name);
    }
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  return (
    <section className={`relative py-14 sm:py-20 ${moodStyle.sectionBg} border-b border-black/5`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Titre & Sous-titre */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${moodStyle.accentBadge}`}>
            FORMAT 9:16 REELS & WAMEET
          </span>
          <h2 className={`text-2xl sm:text-4xl font-black tracking-tight ${moodStyle.textPrimary}`}>
            {title}
          </h2>
          <p className={`text-xs sm:text-sm ${moodStyle.textSecondary}`}>
            {subtitle}
          </p>
        </div>

        {/* Rangée de Stories Vidéo au format 9:16 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {stories.map((story, sIdx) => {
            const isPlaying = activeStoryIndex === sIdx;

            return (
              <div
                key={story.id || sIdx}
                className="relative rounded-3xl overflow-hidden shadow-2xl border border-black/10 aspect-[9/16] bg-slate-950 group/story flex flex-col justify-between"
              >
                {/* Lecteur Vidéo */}
                <video
                  src={story.videoUrl}
                  poster={story.poster}
                  loop
                  playsInline
                  autoPlay={isPlaying}
                  muted={isMuted}
                  className="absolute inset-0 w-full h-full object-cover transform group-hover/story:scale-103 transition-transform duration-700"
                />

                {/* Gradient Sombre Supérieur & Inférieur pour lisibilité */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />

                {/* En-Tête de la Story : Titre & Bouton Son */}
                <div className="relative z-10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[11px] font-black uppercase text-white drop-shadow-sm line-clamp-1">
                      {story.title}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(!isMuted);
                    }}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition cursor-pointer"
                    title={isMuted ? "Activer le son" : "Couper le son"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                </div>

                {/* Centre : Bouton Play Flottant au clic */}
                <div 
                  onClick={() => setActiveStoryIndex(isPlaying ? null : sIdx)}
                  className="relative z-10 flex-1 flex items-center justify-center cursor-pointer"
                >
                  {!isPlaying && (
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-2xl transform group-hover/story:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </div>
                  )}
                </div>

                {/* Bas : Mini-Carte Produit Translucide Shoppable (Glassmorphism) */}
                {story.product && (
                  <div className="relative z-10 p-3.5 m-3 rounded-2xl bg-black/75 backdrop-blur-md border border-white/20 text-white shadow-2xl space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={story.product.image}
                        alt={story.product.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/20"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate" title={story.product.name}>
                          {story.product.name}
                        </p>
                        <p className="text-xs font-black text-amber-300">
                          {story.product.price.toLocaleString('fr-FR')} FCFA
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductOrder(story.product);
                      }}
                      className={`w-full py-2.5 ${moodStyle.accentButton} ${buttonRadiusClass} font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-transform`}
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Commander en 1 clic</span>
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default VideoStoryCarouselModule;
