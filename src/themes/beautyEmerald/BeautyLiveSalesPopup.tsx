import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Eye, ShoppingBag } from 'lucide-react';
import { StoreProductItem } from '../../components/storeBuilder/types';
import { playTapBeep } from '../../utils/audio';

export interface BeautyLiveSalesPopupProps {
  products: StoreProductItem[];
  onSelectProduct?: (product: StoreProductItem) => void;
}

interface LiveSaleEvent {
  buyerName: string;
  location: string;
  minutesAgo: number;
}

const BUYERS_POOL: LiveSaleEvent[] = [
  { buyerName: 'Fatou K.', location: 'Abidjan', minutesAgo: 8 },
  { buyerName: 'Aminata D.', location: 'Dakar', minutesAgo: 14 },
  { buyerName: 'David Thompson', location: 'Cotonou', minutesAgo: 22 },
  { buyerName: 'Olivia Mensah', location: 'Lomé', minutesAgo: 31 },
  { buyerName: 'Mariam Traoré', location: 'Bamako', minutesAgo: 5 },
  { buyerName: 'Aïcha S.', location: 'Yamoussoukro', minutesAgo: 18 }
];

export const BeautyLiveSalesPopup: React.FC<BeautyLiveSalesPopupProps> = ({
  products,
  onSelectProduct
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [eventIndex, setEventIndex] = useState(0);

  // Événement d'achat sélectionné
  const currentEvent = BUYERS_POOL[eventIndex % BUYERS_POOL.length];
  const currentProduct = products && products.length > 0
    ? products[eventIndex % products.length]
    : null;

  useEffect(() => {
    // Si l'utilisateur a fermé manuellement la popup pour la session, on peut respecter son choix
    if (isDismissed || !currentProduct) return;

    // Premier déclenchement après 4 secondes
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    // Boucle récurrente : reste visible 7s, puis réapparaît toutes les 38 secondes
    const cycleInterval = setInterval(() => {
      setEventIndex(prev => prev + 1);
      setIsVisible(true);

      // Auto-hide après 7 secondes
      setTimeout(() => {
        setIsVisible(false);
      }, 7000);
    }, 38000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(cycleInterval);
    };
  }, [isDismissed, currentProduct, products.length]);

  // Fermeture automatique après 7 secondes si visible
  useEffect(() => {
    if (!isVisible) return;
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 7000);
    return () => clearTimeout(hideTimer);
  }, [isVisible]);

  if (!isVisible || !currentProduct) return null;

  const handleClick = () => {
    playTapBeep();
    if (onSelectProduct && currentProduct) {
      onSelectProduct(currentProduct);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    // On ne bloque pas définitivement les futurs cycles, mais on ferme l'actuel
  };

  return (
    <div
      onClick={handleClick}
      className="beauty-live-sales-popup animate-in slide-in-from-bottom-5 fade-in duration-300"
      title="Voir ce produit"
    >
      {/* Bouton de fermeture discret ✕ */}
      <button
        type="button"
        onClick={handleClose}
        className="beauty-live-sales-close"
        aria-label="Fermer la notification"
      >
        <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
      </button>

      {/* Miniature produit à gauche */}
      <div className="beauty-live-sales-thumb">
        <img
          src={currentProduct.image}
          alt={currentProduct.name}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Détails de la vente à droite */}
      <div className="beauty-live-sales-info">
        <div className="font-['Outfit'] text-[12.5px] text-[#111C18] leading-tight pr-3">
          <span className="font-semibold text-slate-900">{currentEvent.buyerName}</span>{' '}
          <span className="text-slate-500 font-normal">vient d'acheter</span>{' '}
          <span className="font-bold text-[#0F4C3A] block truncate max-w-[190px]">
            {currentProduct.name}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="font-['Outfit'] text-[11px] text-slate-400">
            Il y a {currentEvent.minutesAgo} min
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#0F4C3A] font-['Outfit']">
            <CheckCircle2 className="w-3 h-3 text-[#0F4C3A]" />
            <span>Vérifié</span>
          </div>
        </div>
      </div>
    </div>
  );
};
