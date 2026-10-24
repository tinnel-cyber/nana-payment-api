import React, { useState } from 'react';
import { Play, ShoppingBag, Video, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { CustomThemeSection } from '../../../types';
import { StoreProductItem } from '../../../components/storeBuilder/types';
import { MoodStyleConfig } from '../moodStyles';
import { triggerOpenFunnel } from '../../themeUtils';
import { playTapBeep } from '../../../utils/audio';

export interface VideoStoryReelSectionProps {
  section: CustomThemeSection;
  mood: MoodStyleConfig;
  buttonRadiusClass: string;
  products: StoreProductItem[];
  onOpenTunnel?: (product: StoreProductItem) => void;
  onPreviewFunnel?: (product: StoreProductItem) => void;
  onSelectProduct?: (product: StoreProductItem) => void;
  isPublicView?: boolean;
  isAdminPreview?: boolean;
  controlBar?: React.ReactNode;
}

export const VideoStoryReelSection: React.FC<VideoStoryReelSectionProps> = ({
  section,
  mood,
  buttonRadiusClass,
  products = [],
  onOpenTunnel,
  onPreviewFunnel,
  onSelectProduct,
  controlBar
}) => {
  const cfg = section.config || {};
  const title = section.title || cfg.title || "🎬 Démonstrations & Routines Vidéo";
  const subtitle = section.subtitle || cfg.subtitle || "Découvrez nos articles en action avant de passer commande";
  const mode = cfg.displayMode || 'vertical_trio'; // 'vertical_trio' | 'featured_single'

  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Vidéos par défaut ou personnalisées
  const defaultReels = [
    {
      title: "Routine Soin Quotidien",
      videoUrl: cfg.videoUrls?.[0] || "https://assets.mixkit.co/videos/preview/mixkit-woman-applying-facial-cream-41589-large.mp4",
      productId: cfg.linkedProductIds?.[0] || products[0]?.id,
      poster: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80"
    },
    {
      title: "Test d'Efficacité & Éclat",
      videoUrl: cfg.videoUrls?.[1] || "https://assets.mixkit.co/videos/preview/mixkit-young-woman-applying-anti-aging-cream-on-her-face-41584-large.mp4",
      productId: cfg.linkedProductIds?.[1] || products[1]?.id || products[0]?.id,
      poster: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80"
    },
    {
      title: "Déballage & Packaging Luxe",
      videoUrl: cfg.videoUrls?.[2] || "https://assets.mixkit.co/videos/preview/mixkit-dropper-bottle-of-skin-care-serum-41595-large.mp4",
      productId: cfg.linkedProductIds?.[2] || products[2]?.id || products[0]?.id,
      poster: "https://images.unsplash.com/photo-1608248597359-e93574c8b056?w=600&auto=format&fit=crop&q=80"
    }
  ];

  const handleProductOrder = (productId?: string) => {
    playTapBeep();
    const target = products.find(p => p.id === productId) || products[0];
    if (target) {
      if (onOpenTunnel) {
        onOpenTunnel(target);
      } else if (onPreviewFunnel) {
        onPreviewFunnel(target);
      } else {
        triggerOpenFunnel(target.linkedFunnelId || target.id, target.name);
      }
      if (onSelectProduct) {
        onSelectProduct(target);
      }
    }
  };

  return (
    <section className={`relative py-14 sm:py-20 ${mood.sectionBg} border-b border-black/5`}>
      {controlBar}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Titre de Section */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${mood.accentBadge}`}>
            TÉMOIGNAGES & DÉMOS UGC
          </span>
          <h2 className={`text-2xl sm:text-4xl font-black tracking-tight ${mood.textPrimary}`}>
            {title}
          </h2>
          <p className={`text-xs sm:text-sm ${mood.textSecondary}`}>
            {subtitle}
          </p>
        </div>

        {mode === 'featured_single' ? (
          // Mode 1 : 1 Grande Vidéo Immersive avec détails sur le côté
          <div className={`max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-black/10 ${mood.cardBg} grid grid-cols-1 md:grid-cols-12`}>
            <div className="md:col-span-7 relative bg-black aspect-video md:aspect-auto">
              <video
                src={defaultReels[activeVideoIndex].videoUrl}
                poster={defaultReels[activeVideoIndex].poster}
                controls
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Démonstration en direct
                </span>
                <h3 className={`text-xl font-bold ${mood.textPrimary}`}>
                  {defaultReels[activeVideoIndex].title}
                </h3>
                <p className={`text-xs ${mood.textSecondary}`}>
                  Observez les résultats immédiats et apprenez comment utiliser au mieux le produit pour maximiser son efficacité.
                </p>
              </div>

              {products[0] && (
                <div className="pt-4 border-t border-black/5 space-y-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={products[0].image} 
                      alt={products[0].name}
                      className="w-12 h-12 rounded-xl object-cover" 
                    />
                    <div>
                      <p className={`text-xs font-bold line-clamp-1 ${mood.textPrimary}`}>
                        {products[0].name}
                      </p>
                      <p className="text-xs font-black text-blue-600">
                        {products[0].price.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleProductOrder(products[0].id)}
                    className={`w-full py-3 ${mood.accentButton} ${buttonRadiusClass} font-bold text-xs flex items-center justify-center gap-2 cursor-pointer`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Commander ce produit</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Mode 2 : 3 Vidéos Verticales format Reel / Wameet
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {defaultReels.map((reel, rIdx) => {
              const matchedProduct = products.find(p => p.id === reel.productId) || products[rIdx] || products[0];

              return (
                <div
                  key={rIdx}
                  className={`rounded-3xl overflow-hidden shadow-lg border border-black/5 flex flex-col justify-between transition group hover:shadow-2xl ${mood.cardBg}`}
                >
                  {/* Conteneur Vidéo Vertical 9:16 */}
                  <div className="relative aspect-[9/16] bg-slate-950 overflow-hidden">
                    <video
                      src={reel.videoUrl}
                      poster={reel.poster}
                      playsInline
                      muted
                      loop
                      autoPlay
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Gradient Overlay pour lisibilité */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                      <Video className="w-3 h-3 text-rose-400" />
                      <span>{reel.title}</span>
                    </div>
                  </div>

                  {/* Fiche Produit Associée & CTA */}
                  {matchedProduct && (
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold truncate ${mood.textPrimary}`} title={matchedProduct.name}>
                            {matchedProduct.name}
                          </h4>
                          <span className="text-xs font-black text-blue-600">
                            {matchedProduct.price.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleProductOrder(matchedProduct.id)}
                          className={`px-3 py-2 ${mood.accentButton} ${buttonRadiusClass} font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1.5`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Acheter</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
