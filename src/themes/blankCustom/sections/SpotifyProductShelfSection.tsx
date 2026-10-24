import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, ShoppingBag, Flame, Sparkles } from 'lucide-react';
import { CustomThemeSection } from '../../../types';
import { StoreProductItem } from '../../../components/storeBuilder/types';
import { MoodStyleConfig } from '../moodStyles';
import { AdminProductQuickBar } from '../../../components/storeBuilder/AdminProductQuickBar';
import { triggerOpenFunnel } from '../../themeUtils';
import { playTapBeep } from '../../../utils/audio';

export interface SpotifyProductShelfSectionProps {
  section: CustomThemeSection;
  mood: MoodStyleConfig;
  buttonRadiusClass: string;
  products: StoreProductItem[];
  storeSlug?: string;
  onOpenTunnel?: (product: StoreProductItem) => void;
  onPreviewFunnel?: (product: StoreProductItem) => void;
  onSelectProduct?: (product: StoreProductItem) => void;
  onEditProduct?: (product: StoreProductItem, options?: { initialCard?: number }) => void;
  isPublicView?: boolean;
  isAdminPreview?: boolean;
  controlBar?: React.ReactNode;
}

export const SpotifyProductShelfSection: React.FC<SpotifyProductShelfSectionProps> = ({
  section,
  mood,
  buttonRadiusClass,
  products = [],
  storeSlug = 'boutique',
  onOpenTunnel,
  onPreviewFunnel,
  onSelectProduct,
  onEditProduct,
  isPublicView = false,
  isAdminPreview = false,
  controlBar
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const cfg = section.config || {};
  
  const title = section.title || cfg.title || "🎧 Les Hits de la Semaine";
  const subtitle = section.subtitle || cfg.subtitle || "Nos meilleures ventes à portée de main façon playlist Spotify";
  const categoryFilter = cfg.category || 'Tous les produits';

  const shelfProducts = products.filter(p => {
    if (categoryFilter === 'Tous les produits') return true;
    return p.category === categoryFilter;
  });

  const displayProducts = shelfProducts.length > 0 ? shelfProducts : products.slice(0, 8);

  const scroll = (direction: 'left' | 'right') => {
    playTapBeep();
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleProductClick = (product: StoreProductItem) => {
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
    <section className={`relative py-12 sm:py-16 ${mood.sectionBg} border-b border-black/5`}>
      {controlBar}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête de la Playlist */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${mood.accentBadge}`}>
                PLAYLIST SÉLECTIONNÉE
              </span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${mood.textPrimary}`}>
              {title}
            </h2>
            <p className={`text-xs sm:text-sm ${mood.textSecondary}`}>
              {subtitle}
            </p>
          </div>

          {/* Boutons de navigation Flèches */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              className={`p-2.5 rounded-full border border-slate-200/80 hover:bg-slate-100 transition cursor-pointer text-slate-700 active:scale-95`}
              aria-label="Faire défiler vers la gauche"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className={`p-2.5 rounded-full border border-slate-200/80 hover:bg-slate-100 transition cursor-pointer text-slate-700 active:scale-95`}
              aria-label="Faire défiler vers la droite"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Rail Horizontal Défilant façon Spotify */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory focus:outline-none -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayProducts.map((product, pIdx) => {
            const hasDiscount = product.originalPrice && product.originalPrice > product.price;
            const discountPercent = hasDiscount 
              ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) 
              : 0;

            return (
              <div
                key={product.id || pIdx}
                className={`relative shrink-0 w-[240px] sm:w-[260px] snap-start rounded-2xl p-3.5 transition-all duration-300 group ${mood.cardBg} flex flex-col justify-between`}
              >
                {/* Admin Quick Bar flottante (0ms survol vendeur) */}
                <AdminProductQuickBar
                  product={product}
                  storeSlug={storeSlug}
                  onEditProduct={onEditProduct}
                  onPreviewFunnel={onPreviewFunnel}
                  isPublicView={isPublicView}
                  isAdminPreview={isAdminPreview}
                />

                <div>
                  {/* Visuel Produit Ratio Carré avec Bouton Play / Cart flottant */}
                  <div 
                    onClick={() => handleProductClick(product)}
                    className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer mb-3 group/img"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transform group-hover/img:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Badge Promotion ou Bestseller */}
                    {hasDiscount ? (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] shadow">
                        -{discountPercent}%
                      </span>
                    ) : product.badge ? (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow">
                        {product.badge}
                      </span>
                    ) : null}

                    {/* Pastille Flottante Spotify Play / Panier */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(product);
                      }}
                      className={`absolute bottom-3 right-3 w-10 h-10 ${mood.accentButton} rounded-full shadow-2xl flex items-center justify-center transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer active:scale-90`}
                      title="Commander maintenant"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Détails du Produit */}
                  <div className="space-y-1">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${mood.textMuted}`}>
                      {product.category || 'Collection'}
                    </p>
                    <h3 
                      onClick={() => handleProductClick(product)}
                      className={`text-sm font-bold line-clamp-1 group-hover:text-blue-600 transition cursor-pointer ${mood.textPrimary}`}
                      title={product.name}
                    >
                      {product.name}
                    </h3>
                  </div>
                </div>

                {/* Prix & Bouton Achat Direct */}
                <div className="pt-3 mt-2 border-t border-black/5 flex items-center justify-between gap-2">
                  <div>
                    <span className={`text-sm font-black ${mood.textPrimary}`}>
                      {product.price.toLocaleString('fr-FR')} F
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] text-slate-400 line-through ml-1.5 font-semibold">
                        {product.originalPrice?.toLocaleString('fr-FR')} F
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleProductClick(product)}
                    className={`px-3 py-1.5 ${mood.accentButton} ${buttonRadiusClass} font-bold text-[11px] shrink-0 cursor-pointer flex items-center gap-1`}
                  >
                    <span>Commander</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
