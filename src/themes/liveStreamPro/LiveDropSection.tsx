import React from 'react';
import { Flame, Sparkles, Zap, PackageCheck } from 'lucide-react';
import { LiveProductItem } from './liveStreamAssets';
import { LiveFlashDropBar } from './LiveFlashDropBar';
import { LiveDropProductCard } from './LiveDropProductCard';
import { StoreProductItem } from '../../components/storeBuilder/types';
import { ThemeCustomizationConfig } from '../../types';

interface LiveDropSectionProps {
  products: LiveProductItem[];
  onOpenTunnel: (product: LiveProductItem) => void;
  onAddToCart?: (product: LiveProductItem) => void;
  isPublicView?: boolean;
  isAdminPreview?: boolean;
  storeSlug?: string;
  onEditProduct?: (product: StoreProductItem, options?: { initialCard?: number }) => void;
  onPreviewFunnel?: (product: StoreProductItem) => void;
  customConfig?: ThemeCustomizationConfig;
}

export const LiveDropSection: React.FC<LiveDropSectionProps> = ({
  products,
  onOpenTunnel,
  onAddToCart,
  isPublicView,
  isAdminPreview,
  storeSlug,
  onEditProduct,
  onPreviewFunnel,
  customConfig
}) => {
  return (
    <section className="w-full py-8 space-y-6" aria-label="Drop Zone Ventes Flash">
      
      {/* 1. La Barre d'Urgence "Flash Drop" Pleine Largeur */}
      <LiveFlashDropBar />

      {/* 2. En-tête de la Drop Zone */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF2A54] animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-[#FF2A54] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-[#FF2A54]" />
                {customConfig?.catalogSubtitle || 'La Drop Zone • Lots Exclusifs'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              {customConfig?.catalogTitle || 'Les Ventes Flash & Offres Débloquées du Direct'}
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] max-w-2xl">
              {customConfig?.heroDescription || 'Ces tarifs préférentiels et bonus de session sont réservés aux spectateurs connectés. Les prix reprendront leur valeur standard dès la clôture de la diffusion.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/[0.05] px-3 py-1.5 rounded-xl border border-white/[0.08] self-start sm:self-auto shrink-0">
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            <span>Paiement Sécurisé Wave / OM</span>
          </div>
        </div>

        {/* 3. Grille 4 Colonnes des Produits Live Drop */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {products.map((product, idx) => (
            <LiveDropProductCard
              key={product.id || `drop-${idx}`}
              product={product}
              lotIndex={idx}
              onOpenTunnel={onOpenTunnel}
              onAddToCart={onAddToCart}
              isPublicView={isPublicView}
              isAdminPreview={isAdminPreview}
              storeSlug={storeSlug}
              onEditProduct={onEditProduct}
              onPreviewFunnel={onPreviewFunnel}
            />
          ))}
        </div>
      </div>

    </section>
  );
};
