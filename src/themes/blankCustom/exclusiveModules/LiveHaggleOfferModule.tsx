import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, ArrowRight, CheckCircle2, Clock, Flame, ShieldAlert, Award, Zap } from 'lucide-react';
import { CustomSectionInstance } from '../../../types';
import { StoreProductItem } from '../../../components/storeBuilder/types';
import { MoodStyleConfig } from '../moodStyles';
import { AdminProductQuickBar } from '../../../components/storeBuilder/AdminProductQuickBar';
import { triggerOpenFunnel } from '../../themeUtils';
import { playTapBeep, playValidationBeep, playCashChime } from '../../../utils/audio';

export interface LiveHaggleOfferModuleProps {
  section: CustomSectionInstance;
  moodStyle: MoodStyleConfig;
  buttonRadiusClass: string;
  products: StoreProductItem[];
  storeSlug?: string;
  onOpenTunnel?: (product: StoreProductItem) => void;
  onPreviewFunnel?: (product: StoreProductItem) => void;
  onSelectProduct?: (product: StoreProductItem) => void;
  onEditProduct?: (product: StoreProductItem, options?: { initialCard?: number }) => void;
  isPublicView?: boolean;
  isAdminPreview?: boolean;
}

export const LiveHaggleOfferModule: React.FC<LiveHaggleOfferModuleProps> = ({
  section,
  moodStyle,
  buttonRadiusClass,
  products = [],
  storeSlug = 'boutique',
  onOpenTunnel,
  onPreviewFunnel,
  onSelectProduct,
  onEditProduct,
  isPublicView = false,
  isAdminPreview = false
}) => {
  const cfg = (section.settings || (section as any).config || {}) as any;
  const DEMO_HAGGLE_PRODUCT: StoreProductItem = {
  id: 'demo-haggle-product',
  name: "Coffret Prestige Découverte",
  price: 25000,
  originalPrice: 32000,
  category: "Packs",
  image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
  stock: 6,
  description: "Faites votre offre directement pour ce coffret complet et obtenez une remise immédiate.",
  badge: "Négociable"
};

  const targetProduct = products.find(p => p.id === cfg.productId) || products[0] || DEMO_HAGGLE_PRODUCT;

  const title = section.title || cfg.title || "🤝 Faites Votre Offre au Vendeur !";
  const subtitle = section.subtitle || cfg.subtitle || "NÉGOCIATEUR FLASH IA • ACCORD IMMÉDIAT EN 1 CLIC";

  const normalPrice = targetProduct?.price || 25000;
  // Plancher par défaut : -15%
  const floorPercent = Number(cfg.floorDiscountPercent) || 15;
  const floorPrice = Math.round(normalPrice * (1 - floorPercent / 100));

  const [proposedPrice, setProposedPrice] = useState<number>(Math.round(normalPrice * 0.9));
  const [offerStatus, setOfferStatus] = useState<'idle' | 'accepted' | 'counter_offer'>('idle');
  const [acceptedPrice, setAcceptedPrice] = useState<number>(normalPrice);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(600); // 10 minutes

  // Compte à rebours une fois l'offre acceptée
  useEffect(() => {
    let timer: any = null;
    if (offerStatus === 'accepted' && timeLeftSec > 0) {
      timer = setInterval(() => {
        setTimeLeftSec(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [offerStatus, timeLeftSec]);

  const handleSubmitOffer = () => {
    playTapBeep();

    if (proposedPrice >= floorPrice) {
      // Offre acceptée !
      playCashChime();
      setAcceptedPrice(proposedPrice);
      setOfferStatus('accepted');
      setTimeLeftSec(600);
    } else {
      // Offre trop basse -> contre-offre au prix plancher
      playValidationBeep();
      setOfferStatus('counter_offer');
    }
  };

  const handleAcceptCounterOffer = () => {
    playCashChime();
    setAcceptedPrice(floorPrice);
    setOfferStatus('accepted');
    setTimeLeftSec(600);
  };

  const handleOrder = () => {
    if (!targetProduct) return;
    playValidationBeep();
    
    // Injecte le tarif négocié
    const negotiatedProduct: StoreProductItem = {
      ...targetProduct,
      price: acceptedPrice,
      originalPrice: normalPrice
    };

    if (onOpenTunnel) {
      onOpenTunnel(negotiatedProduct);
    } else if (onPreviewFunnel) {
      onPreviewFunnel(negotiatedProduct);
    } else {
      triggerOpenFunnel(targetProduct.linkedFunnelId || targetProduct.id, targetProduct.name);
    }

    if (onSelectProduct) {
      onSelectProduct(negotiatedProduct);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!targetProduct) return null;

  return (
    <section className={`relative py-14 sm:py-20 ${moodStyle.sectionAltBg} border-b border-black/5`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${moodStyle.accentBadge}`}>
            <Zap className="w-3.5 h-3.5" />
            <span>{subtitle}</span>
          </span>
          <h2 className={`text-2xl sm:text-4xl font-black tracking-tight ${moodStyle.textPrimary}`}>
            {title}
          </h2>
          <p className={`text-xs sm:text-sm ${moodStyle.textSecondary}`}>
            Proposez votre tarif pour un achat immédiat. Notre algorithme vendeur valide votre offre en direct !
          </p>
        </div>

        {/* Bloc interactif Négociateur */}
        <div className={`rounded-3xl p-6 sm:p-10 ${moodStyle.cardBg} border border-amber-500/30 shadow-2xl relative overflow-hidden backdrop-blur-md`}>
          <AdminProductQuickBar
            product={targetProduct}
            storeSlug={storeSlug}
            onEditProduct={onEditProduct}
            onPreviewFunnel={onPreviewFunnel}
            isPublicView={isPublicView}
            isAdminPreview={isAdminPreview}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Colonne Gauche : Aperçu du Produit */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative rounded-2xl overflow-hidden aspect-square bg-slate-100 dark:bg-slate-800 shadow-md">
                <img
                  src={targetProduct.image}
                  alt={targetProduct.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 text-xs font-black uppercase border border-amber-400/30">
                  Prix Boutique : {normalPrice.toLocaleString('fr-FR')} FCFA
                </div>
              </div>
              <div>
                <h3 className={`text-lg font-black ${moodStyle.textPrimary}`}>
                  {targetProduct.name}
                </h3>
                <p className={`text-xs ${moodStyle.textSecondary} line-clamp-2 mt-1`}>
                  {targetProduct.description}
                </p>
              </div>
            </div>

            {/* Colonne Droite : Interface de Négociation */}
            <div className="lg:col-span-7 space-y-6">
              {/* ÉTAT 1 : En attente d'offre (IDLE) */}
              {offerStatus === 'idle' && (
                <div className="space-y-6 text-left">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-bold flex items-center gap-1.5">
                      <span>💡</span>
                      <span>Règle du jeu :</span>
                    </p>
                    <p className="mt-1 leading-relaxed opacity-90">
                      Entrez un montant raisonnable. Si le système valide votre offre, vous débloquez ce tarif préférentiel pour commander immédiatement avec paiement à la livraison !
                    </p>
                  </div>

                  {/* Boutons d'offres rapides */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400">
                      Suggestions rapides de remise :
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[5, 10, 15, 20].map((pct) => {
                        const calculated = Math.round(normalPrice * (1 - pct / 100));
                        const isSelected = proposedPrice === calculated;
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              playTapBeep();
                              setProposedPrice(calculated);
                            }}
                            className={`py-2 px-1 rounded-xl text-center text-xs font-bold border transition cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-black/5 hover:border-blue-400'
                            }`}
                          >
                            <span className="block font-black">-{pct}%</span>
                            <span className="text-[10px] block opacity-80">{calculated.toLocaleString('fr-FR')} F</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Saisie personnalisée */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400">
                      Votre Offre Personnalisée (en FCFA) :
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min={Math.round(normalPrice * 0.5)}
                          max={normalPrice}
                          step={500}
                          value={proposedPrice}
                          onChange={(e) => setProposedPrice(Number(e.target.value))}
                          className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-lg font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                          FCFA
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmitOffer}
                        className={`px-6 sm:px-8 py-3.5 ${moodStyle.accentButton} ${buttonRadiusClass} font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95`}
                      >
                        <span>Proposer</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ÉTAT 2 : Contre-offre du vendeur (Prix proposé trop bas) */}
              {offerStatus === 'counter_offer' && (
                <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-left space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm">
                    <ShieldAlert className="w-5 h-5" />
                    <span>😅 Votre offre de {proposedPrice.toLocaleString('fr-FR')} FCFA est un peu trop basse !</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Pour préserver la qualité irréprochable du produit, le vendeur ne peut pas descendre en dessous du seuil de rentabilité. 
                    Cependant, nous pouvons vous accorder exceptionnellement notre <strong className="text-emerald-600 dark:text-emerald-400">meilleur tarif VIP :</strong>
                  </p>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Contre-Offre Ferme du Vendeur</span>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {floorPrice.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                      Économie de {(normalPrice - floorPrice).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleAcceptCounterOffer}
                      className={`flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white ${buttonRadiusClass} font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accepter cette contre-offre</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferStatus('idle')}
                      className="px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      Refaire une offre
                    </button>
                  </div>
                </div>
              )}

              {/* ÉTAT 3 : Offre validée avec succès ! (ACCEPTED) */}
              {offerStatus === 'accepted' && (
                <div className="p-6 sm:p-7 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/60 text-left space-y-5 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎉</span>
                      <h4 className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                        Félicitations ! Offre Validée à {acceptedPrice.toLocaleString('fr-FR')} FCFA
                      </h4>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-600 text-white font-mono text-xs font-black flex items-center gap-1.5 shadow-md">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>{formatTimer(timeLeftSec)} restants</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block line-through">
                        Prix normal : {normalPrice.toLocaleString('fr-FR')} FCFA
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        {acceptedPrice.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-black text-xs">
                        Vous économisez {(normalPrice - acceptedPrice).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOrder}
                    className={`w-full py-4.5 bg-emerald-600 hover:bg-emerald-500 text-white ${buttonRadiusClass} font-black text-sm sm:text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-xl shadow-emerald-600/30 active:scale-95 transition-transform`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Valider ma commande à {acceptedPrice.toLocaleString('fr-FR')} FCFA</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <p className="text-[11px] text-center text-slate-400">
                    🔒 Tarif garanti pendant 10 minutes • Paiement à la réception après contrôle
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
