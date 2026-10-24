import React, { useState } from 'react';
import { MessageCircle, Check, CheckCheck, Sparkles, ShoppingBag, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { CustomSectionInstance } from '../../../types';
import { StoreProductItem } from '../../../components/storeBuilder/types';
import { MoodStyleConfig } from '../moodStyles';
import { triggerOpenFunnel } from '../../themeUtils';
import { playTapBeep, playValidationBeep } from '../../../utils/audio';

export interface SocialWallWameetModuleProps {
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

export const SocialWallWameetModule: React.FC<SocialWallWameetModuleProps> = ({
  section,
  moodStyle,
  buttonRadiusClass,
  products = [],
  onOpenTunnel,
  onPreviewFunnel,
  onSelectProduct
}) => {
  const cfg = section.settings || section.config || {};
  const title = section.title || cfg.title || "💬 Retours Wameet de Nos Vrais Clients";
  const subtitle = section.subtitle || cfg.subtitle || "PREUVES SOCIALES VÉRIFIÉES • 100% AUTHENTIQUE";

  const defaultTestimonials = [
    {
      id: 'tw_1',
      author: "Aïcha Traoré",
      location: "Abidjan, Cocody",
      time: "Hier à 14:28",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      message: "Colis bien reçu par le livreur tout à l'heure ! J'ai pu vérifier avant de payer par Wave. La qualité est juste incroyable, rien à voir avec les copies qu'on voit ailleurs. Merci beaucoup !",
      productName: products[0]?.name || "Produit Vedette",
      productImage: products[0]?.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300",
      productPrice: products[0]?.price || 18000,
      photoProof: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: 'tw_2',
      author: "Serge Kouamé",
      location: "Bouaké / Commerce",
      time: "Aujourd'hui à 10:15",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      message: "Franchement le service client est super réactif. Le livreur m'a appelé 30min avant pour caler l'heure. Produit testé immédiatement : 10/10 !",
      productName: products[1]?.name || products[0]?.name || "Pack Spécial",
      productImage: products[1]?.image || products[0]?.image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300",
      productPrice: products[1]?.price || products[0]?.price || 25000
    },
    {
      id: 'tw_3',
      author: "Fatou Dieng",
      location: "Dakar, Almadies",
      time: "Il y a 2 jours à 18:40",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      message: "J'avais un gros doute au début mais dès que j'ai ouvert le paquet j'étais rassurée. Emballage soigné avec le sceau de garantie. Je recommande à toutes mes copines !",
      productName: products[2]?.name || products[0]?.name || "Édition Privilège",
      productImage: products[2]?.image || products[0]?.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
      productPrice: products[2]?.price || products[0]?.price || 32000
    }
  ];

  const testimonials = cfg.testimonials || defaultTestimonials;

  const handleOrderProduct = (p: any) => {
    playValidationBeep();
    const target = products.find(prod => prod.name === p.productName || prod.id === p.productId) || products[0];
    if (!target) return;
    
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
  };

  return (
    <section className={`relative py-14 sm:py-20 ${moodStyle.sectionBg} border-b border-black/5`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${moodStyle.accentBadge}`}>
            <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>{subtitle}</span>
          </span>
          <h2 className={`text-2xl sm:text-4xl font-black tracking-tight ${moodStyle.textPrimary}`}>
            {title}
          </h2>
          <p className={`text-xs sm:text-sm ${moodStyle.textSecondary}`}>
            Pas de faux avis étoiles génériques : voici de vraies conversations et retours de nos clients livrés chez eux.
          </p>
        </div>

        {/* MUR DE CONVERSATIONS WAMEET */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {testimonials.map((t: any, idx: number) => (
            <div
              key={t.id || idx}
              className={`rounded-3xl p-5 sm:p-6 ${moodStyle.cardBg} border border-emerald-500/20 shadow-xl flex flex-col justify-between relative overflow-hidden backdrop-blur-md`}
            >
              <div>
                {/* En-tête style conversation Wameet */}
                <div className="flex items-center justify-between pb-3.5 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={t.avatar}
                        alt={t.author}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/30"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    </div>
                    <div>
                      <h4 className={`text-xs sm:text-sm font-black ${moodStyle.textPrimary} flex items-center gap-1`}>
                        <span>{t.author}</span>
                        <span className="text-[10px] text-emerald-600">✓</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        📍 {t.location}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {t.time}
                  </span>
                </div>

                {/* BULLE DE MESSAGE WAMEET */}
                <div className="my-4 space-y-2">
                  <div className="p-4 rounded-2xl rounded-tl-xs bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-relaxed text-left relative">
                    <p className="font-medium">"{t.message}"</p>
                    <div className="pt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                      <span>Lu</span>
                      <CheckCheck className="w-3.5 h-3.5 text-blue-500 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* Photo de preuve client déballée (optionnelle) */}
                  {t.photoProof && (
                    <div className="rounded-xl overflow-hidden aspect-video bg-slate-100 relative shadow-inner">
                      <img src={t.photoProof} alt="Preuve" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[9px] font-black uppercase">
                        📸 Photo envoyée par le client
                      </span>
                    </div>
                  )}

                  {/* Badge de vérification */}
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Achat vérifié • Payé à la livraison</span>
                  </div>
                </div>
              </div>

              {/* CARTE PRODUIT ACHETÉ SOUS L'AVIS */}
              <div className="pt-3.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={t.productImage}
                    alt={t.productName}
                    className="w-9 h-9 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Article commandé</span>
                    <p className={`text-xs font-black truncate ${moodStyle.textPrimary}`}>
                      {t.productName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOrderProduct(t)}
                  className={`px-3 py-1.5 ${moodStyle.accentButton} ${buttonRadiusClass} font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer shadow-sm active:scale-95`}
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>Commander</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
