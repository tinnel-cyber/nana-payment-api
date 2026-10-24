import React from 'react';
import { ShoppingBag, Heart, RefreshCw, Star } from 'lucide-react';
import { StoreProductItem } from '../../components/storeBuilder/types';
import { formatCFA, playTapBeep, playValidationBeep } from '../../utils/audio';
import { AdminProductQuickBar } from '../../components/storeBuilder/AdminProductQuickBar';

export interface ElectroProductCardProps {
  product: StoreProductItem;
  onSelectProduct: (p: StoreProductItem) => void;
  onAddToCart: (p: StoreProductItem, qty?: number) => void;
  onAddToWishlist?: (p: StoreProductItem) => void;
  onAddToCompare?: (p: StoreProductItem) => void;
  showDividers?: boolean;
  isPublicView?: boolean;
  isAdminPreview?: boolean;
  storeSlug?: string;
  onEditProduct?: (product: StoreProductItem, options?: { initialCard?: number }) => void;
  onPreviewFunnel?: (product: StoreProductItem) => void;
}

export const ElectroProductCard: React.FC<ElectroProductCardProps> = ({
  product,
  onSelectProduct,
  onAddToCart,
  onAddToWishlist,
  onAddToCompare,
  isPublicView,
  isAdminPreview,
  storeSlug,
  onEditProduct,
  onPreviewFunnel
}) => {
  const isDiscounted = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPercent = isDiscounted 
    ? Math.round((((product.originalPrice! - product.price) / product.originalPrice!) * 100))
    : null;

  return (
    <div
      onClick={() => {
        playTapBeep();
        onSelectProduct(product);
      }}
      className="electro-product-card group cursor-pointer relative"
    >
      <AdminProductQuickBar
        product={product}
        isPublicView={isPublicView}
        isAdminPreview={isAdminPreview}
        storeSlug={storeSlug}
        onEditProduct={onEditProduct}
        onPreviewFunnel={onPreviewFunnel}
      />

      {/* 1. HAUT DE CARTE : Catégorie en tout petit gris (12px) & Titre en Bleu AU-DESSUS de l'image */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
          {product.category || 'Électronique'}
        </span>
        <h3 
          className="electro-product-title line-clamp-2"
          title={product.name}
        >
          {product.name}
        </h3>
      </div>

      {/* 2. MILIEU : Image du produit (aspect-ratio: 1/1, object-fit: contain, padding: 15px) */}
      <div className="w-full aspect-square my-2 relative flex items-center justify-center p-3 bg-white">
        {discountPercent !== null && (
          <span className="absolute top-1 left-1 bg-[#E52E04] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
            -{discountPercent}%
          </span>
        )}
        <img
          src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
          alt={product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
      </div>

      {/* 3. BAS DE CARTE : Prix à gauche & Bouton rond d'ajout au panier à droite */}
      <div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            {isDiscounted && (
              <span className="text-[11px] text-slate-400 line-through leading-none mb-0.5 font-medium">
                {formatCFA(product.originalPrice!)}
              </span>
            )}
            <span className={`text-[15px] font-black font-mono leading-none ${isDiscounted ? 'text-[#E52E04]' : 'text-[#333E48]'}`}>
              {formatCFA(product.price)}
            </span>
          </div>

          {/* Bouton rond 38px gris clair par défaut -> Orange au survol avec panier blanc */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playValidationBeep();
              onAddToCart(product, 1);
            }}
            className="electro-card-round-cart"
            title="Ajouter au panier"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>

        {/* 4. PIED DE CARTE CACHÉ AU SURVOL (:hover) : ⇄ Comparer et ♡ Favoris */}
        <div className="electro-card-hover-footer">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playTapBeep();
              if (onAddToCompare) onAddToCompare(product);
            }}
            className="electro-hover-link"
          >
            <RefreshCw className="w-3 h-3 text-slate-400" />
            <span>Comparer</span>
          </button>

          <span className="text-slate-200 text-xs">|</span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playTapBeep();
              if (onAddToWishlist) onAddToWishlist(product);
            }}
            className="electro-hover-link"
          >
            <Heart className="w-3 h-3 text-slate-400" />
            <span>Favoris</span>
          </button>
        </div>
      </div>
    </div>
  );
};
