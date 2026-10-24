import React from 'react';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import { StoreProductItem } from '../../components/storeBuilder/types';
import { formatCFA, playTapBeep } from '../../utils/audio';
import { AdminProductQuickBar } from '../../components/storeBuilder/AdminProductQuickBar';

export interface MegaProductExtended extends StoreProductItem {
  secondaryImage?: string;
  discountPercent?: number;
  statusBadge?: 'nouveau' | 'hot' | 'top';
  stockTotal?: number;
  stockLeft?: number;
}

interface MegaStoreProductCardProps {
  product: MegaProductExtended;
  onSelect: (product: StoreProductItem) => void;
  onBuyNow: (product: StoreProductItem, quantity: number) => void;
  className?: string;
  isPublicView?: boolean;
  isAdminPreview?: boolean;
  storeSlug?: string;
  onEditProduct?: (product: StoreProductItem, options?: { initialCard?: number }) => void;
  onPreviewFunnel?: (product: StoreProductItem) => void;
}

const DEFAULT_PRODUCT_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300"><rect width="300" height="300" fill="%23F8FAFC"/><circle cx="150" cy="130" r="50" fill="%23E2E8F0"/><path d="M120 150 L140 125 L155 140 L170 120 L190 150 Z" fill="%2394A3B8"/><circle cx="138" cy="115" r="8" fill="%23CBD5E1"/></svg>`;

export const MegaStoreProductCard: React.FC<MegaStoreProductCardProps> = ({
  product,
  onSelect,
  onBuyNow,
  className = '',
  isPublicView,
  isAdminPreview,
  storeSlug,
  onEditProduct,
  onPreviewFunnel
}) => {
  const [primarySrc, setPrimarySrc] = React.useState<string>(product.image || DEFAULT_PRODUCT_PLACEHOLDER);
  const [secondarySrc, setSecondarySrc] = React.useState<string | undefined>(product.secondaryImage);

  // Calcul dynamique de la remise si originalPrice existe
  const discountPercent = product.discountPercent || (
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null
  );

  // Barre de stock d'urgence
  const stockLeft = product.stockLeft ?? (product.stock || 25);
  const stockTotal = product.stockTotal || 150;
  const stockPercent = Math.min(100, Math.max(10, Math.round((stockLeft / stockTotal) * 100)));

  // Badges textuels en français
  const statusBadge = product.statusBadge || (product.badge?.toLowerCase().includes('new') ? 'nouveau' : product.badge?.toLowerCase().includes('hot') ? 'hot' : null);

  const handleCardClick = () => {
    playTapBeep();
    onSelect(product);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTapBeep();
    onBuyNow(product, 1);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`mega-product-card p-3 cursor-pointer group relative ${className}`}
    >
      <AdminProductQuickBar
        product={product}
        isPublicView={isPublicView}
        isAdminPreview={isAdminPreview}
        storeSlug={storeSlug}
        onEditProduct={onEditProduct}
        onPreviewFunnel={onPreviewFunnel}
      />
      {/* 1 & 2. CONTENEUR D'IMAGE AVEC BADGES D'URGENCE & HOVER SWAP */}
      <div className="mega-card-image-box">
        
        {/* Badge de Réduction Dynamique en haut à gauche */}
        {discountPercent && (
          <span className="mega-badge-discount">
            -{discountPercent}%
          </span>
        )}

        {/* Badge Statut en haut à droite (NOUVEAU / TOP VENTE) */}
        {statusBadge && (
          <span className={`mega-badge-status ${statusBadge === 'nouveau' ? 'new' : 'hot'}`}>
            {statusBadge === 'nouveau' ? 'Nouveau' : 'Top Vente'}
          </span>
        )}

        {/* Image Principale */}
        <img
          src={primarySrc}
          alt={product.name}
          onError={() => setPrimarySrc(DEFAULT_PRODUCT_PLACEHOLDER)}
          className={`mega-img-primary ${secondarySrc ? 'has-swap' : ''}`}
          loading="lazy"
        />

        {/* 2ème Image de la Galerie affichée au Survol (Hover Swap) */}
        {secondarySrc && (
          <img
            src={secondarySrc}
            alt={`${product.name} vue alternative`}
            onError={() => setSecondarySrc(undefined)}
            className="mega-img-secondary"
            loading="lazy"
          />
        )}

        {/* Boutons d'Action au Hover Glissant sur le Bas de l'Image */}
        <div className="mega-card-hover-actions">
          <button
            type="button"
            onClick={handleActionClick}
            className="flex-1 py-1.5 px-3 bg-[#0056D2] hover:bg-blue-700 text-white font-bold text-xs rounded-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            title="Acheter maintenant"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Acheter</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playTapBeep();
              onSelect(product);
            }}
            className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xs shadow-sm transition active:scale-95 cursor-pointer"
            title="Voir options"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. BLOC DE CONVERSION EN BAS DE LA CARTE */}
      <div className="pt-3 space-y-2 flex-1 flex flex-col justify-between">
        
        <div className="space-y-1">
          {/* Nom du produit bridé à 2 lignes */}
          <h4 className="mega-product-title group-hover:text-[#0056D2] transition-colors">
            {product.name}
          </h4>

          {/* Étoiles d'avis en jaune */}
          <div className="flex items-center gap-1 pt-0.5">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating || 5)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              ({product.reviewCount || 18})
            </span>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          {/* Prix Barré & Nouveau Prix en Grand */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-black text-[#0056D2]">
              {formatCFA(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] text-slate-400 line-through font-medium">
                {formatCFA(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Barre de Stock d'Urgence (Progress Bar fine avec "X restants") */}
          <div className="space-y-1 pt-0.5">
            <div className="mega-stock-track">
              <div
                className="mega-stock-fill"
                style={{ width: `${stockPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span className="text-blue-700 font-extrabold">
                {stockLeft} restant{stockLeft > 1 ? 's' : ''} en stock
              </span>
              <span className="text-slate-400 font-normal">
                {stockTotal - stockLeft} vendus
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
