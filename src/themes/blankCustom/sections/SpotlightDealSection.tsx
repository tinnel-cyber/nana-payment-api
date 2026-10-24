import React, { useState, useEffect } from 'react';
import { Flame, Clock, Check, ShoppingBag, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { CustomThemeSection } from '../../../types';
import { StoreProductItem } from '../../../components/storeBuilder/types';
import { MoodStyleConfig } from '../moodStyles';
import { AdminProductQuickBar } from '../../../components/storeBuilder/AdminProductQuickBar';
import { triggerOpenFunnel } from '../../themeUtils';
import { playTapBeep } from '../../../utils/audio';

export interface SpotlightDealSectionProps {
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

export const SpotlightDealSection: React.FC<SpotlightDealSectionProps> = ({
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
  const cfg = section.config || {};
  const title = section.title || cfg.title || "⚡ Vente Flash Exceptionnelle du Jour";
  const subtitle = section.subtitle || cfg.subtitle || "Stock ultra-limité : Tarif promotionnel garanti jusqu'à épuisement";
  
  const targetProduct = products.find(p => p.id === cfg.productId) || products[0];
  const countdownHours = Number(cfg.countdownHours) || 12;
  const stockLeft = Number(cfg.stockLeft) || (targetProduct?.stock ? Math.min(targetProduct.stock, 7) : 5);

  // Compte à rebours dynamique en temps réel
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>(() => {
    return { hours: countdownHours, minutes: 42, seconds: 18 };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: countdownHours, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownHours]);

  if (!targetProduct) return null;

  const hasDiscount = targetProduct.originalPrice && targetProduct.originalPrice > targetProduct.price;
  const savings = hasDiscount ? (targetProduct.originalPrice! - targetProduct.price) : 5000;

  const features = cfg.features || targetProduct.keyFeatures || [
    "Produit 100% original certifié avec garantie constructeur",
    "Paiement sécurisé à la livraison partout à Abidjan & intérieur",
    "Assistance & service après-vente Wameet disponible 7j/7"
  ];

  const handleCtaClick = () => {
    playTapBeep();
    if (onOpenTunnel) {
      onOpenTunnel(targetProduct);
    } else if (onPreviewFunnel) {
      onPreviewFunnel(targetProduct);
    } else {
      triggerOpenFunnel(targetProduct.linkedFunnelId || targetProduct.id, targetProduct.name);
    }
    if (onSelectProduct) {
      onSelectProduct(targetProduct);
    }
  };

  return (
    <section className={`relative py-14 sm:py-20 ${mood.sectionAltBg} border-b border-black/5`}>
      {controlBar}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`relative rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl border border-black/5 ${mood.cardBg} overflow-hidden`}>
          {/* Admin Quick Bar flottante */}
          <AdminProductQuickBar
            product={targetProduct}
            storeSlug={storeSlug}
            onEditProduct={onEditProduct}
            onPreviewFunnel={onPreviewFunnel}
            isPublicView={isPublicView}
            isAdminPreview={isAdminPreview}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Colonne Visuel Produit Vedette */}
            <div className="lg:col-span-5 relative">
              <div 
                onClick={handleCtaClick}
                className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-square shadow-lg cursor-pointer group"
              >
                <img
                  src={targetProduct.image}
                  alt={targetProduct.name}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Badge Promo Flash pulsant */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-lg animate-pulse">
                  <Flame className="w-3.5 h-3.5" />
                  <span>OFFRE DU JOUR</span>
                </div>

                {hasDiscount && (
                  <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-amber-300 font-black text-xs border border-white/20">
                    Économisez {savings.toLocaleString('fr-FR')} F
                  </div>
                )}
              </div>
            </div>

            {/* Colonne Offre & Chrono Décompte */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${mood.accentBadge}`}>
                  <Zap className="w-3.5 h-3.5" />
                  <span>{subtitle}</span>
                </span>
                <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${mood.textPrimary}`}>
                  {title}
                </h2>
                <h3 className={`text-lg sm:text-xl font-bold text-blue-600`}>
                  {targetProduct.name}
                </h3>
              </div>

              {/* Compte à Rebours Visuel */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Clock className="w-4 h-4 animate-spin text-amber-400" style={{ animationDuration: '6s' }} />
                  <span>Fin de la remise dans :</span>
                </div>

                <div className="flex items-center gap-2 text-center font-mono">
                  <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                    <span className="text-lg font-black text-white">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="block text-[9px] uppercase text-slate-400">Heures</span>
                  </div>
                  <span className="font-bold text-slate-400">:</span>
                  <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                    <span className="text-lg font-black text-white">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="block text-[9px] uppercase text-slate-400">Minutes</span>
                  </div>
                  <span className="font-bold text-slate-400">:</span>
                  <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                    <span className="text-lg font-black text-rose-400">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="block text-[9px] uppercase text-slate-400">Secondes</span>
                  </div>
                </div>
              </div>

              {/* Jauge d'Urgence Stock */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-rose-600 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    Plus que {stockLeft} exemplaires disponibles !
                  </span>
                  <span className={`text-[11px] ${mood.textMuted}`}>
                    87% du stock réservé
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full w-[87%] animate-pulse" />
                </div>
              </div>

              {/* 3 Points Forts Techniques (KeyFeatures) */}
              <div className="space-y-2 pt-1">
                {features.map((feat: string, fIdx: number) => (
                  <div key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className={mood.textSecondary}>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Prix & Bouton Commande Directe */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl sm:text-3xl font-black ${mood.textPrimary}`}>
                      {targetProduct.price.toLocaleString('fr-FR')} FCFA
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-slate-400 line-through font-semibold">
                        {targetProduct.originalPrice?.toLocaleString('fr-FR')} FCFA
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Paiement à la réception après contrôle du colis
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCtaClick}
                  className={`flex-1 px-8 py-4 ${mood.accentButton} ${buttonRadiusClass} font-black text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Profiter de l'offre flash</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
