import React, { useState } from 'react';
import { Sparkles, Brain, CheckCircle2, ArrowRight, RotateCcw, ShoppingBag, ShieldCheck, Zap } from 'lucide-react';
import { CustomSectionInstance } from '../../../types';
import { StoreProductItem } from '../../../components/storeBuilder/types';
import { MoodStyleConfig } from '../moodStyles';
import { AdminProductQuickBar } from '../../../components/storeBuilder/AdminProductQuickBar';
import { triggerOpenFunnel } from '../../themeUtils';
import { playTapBeep, playValidationBeep, playCashChime } from '../../../utils/audio';

export interface ProductFinderQuizModuleProps {
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

export const ProductFinderQuizModule: React.FC<ProductFinderQuizModuleProps> = ({
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
  const cfg = section.settings || section.config || {};
  const title = section.title || cfg.title || "🎯 Trouvez Votre Produit Idéal en 3 Clics";
  const subtitle = section.subtitle || cfg.subtitle || "DIAGNOSTIC EXPRESS IA • RECOMMANDATION PERSONNALISÉE";

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
  const [selectedFormula, setSelectedFormula] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [recommendedProduct, setRecommendedProduct] = useState<StoreProductItem | null>(null);

  // Étapes configurables
  const questions = [
    {
      step: 1,
      title: "Étape 1 sur 2 : Quel est votre objectif principal ?",
      subtitle: "Choisissez l'effet que vous souhaitez obtenir en priorité :",
      options: [
        { id: 'rapid', icon: '⚡', label: "Résultat Rapide & Immédiat", desc: "Transformation visible dès la première semaine" },
        { id: 'durab', icon: '🛡️', label: "Protection & Soin Durable", desc: "Solution préventive et confort au quotidien" },
        { id: 'allin', icon: '👑', label: "Pack Tout-en-Un Sans Compromis", desc: "La formule complète la plus plébiscitée" }
      ]
    },
    {
      step: 2,
      title: "Étape 2 sur 2 : Quelle formule correspond le mieux à votre profil ?",
      subtitle: "Sélectionnez votre formule idéale :",
      options: [
        { id: 'starter', icon: '📦', label: "Formule Découverte Essentielle", desc: "Idéal pour tester avec un budget maîtrisé" },
        { id: 'premium', icon: '💎', label: "Formule Complète Privilège", desc: "Le meilleur rapport qualité/prix garanti" }
      ]
    }
  ];

  const handleSelectOption = (optionId: string) => {
    playTapBeep();

    if (currentStep === 1) {
      setSelectedObjective(optionId);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setSelectedFormula(optionId);
      setIsAnalyzing(true);
      playValidationBeep();

      // Simulation de scan IA pendant 800ms
      setTimeout(() => {
        setIsAnalyzing(false);
        playCashChime();

        // Algorithme de matching
        let match = products[0];
        if (optionId === 'premium' && products.length > 1) {
          // Produit le plus complet / plus cher
          match = [...products].sort((a, b) => b.price - a.price)[0];
        } else if (optionId === 'starter' && products.length > 1) {
          // Produit le plus abordable
          match = [...products].sort((a, b) => a.price - b.price)[0];
        } else if (products.length > 2) {
          match = products[1];
        }

        setRecommendedProduct(match);
        setCurrentStep(3); // Écran résultat
      }, 750);
    }
  };

  const handleReset = () => {
    playTapBeep();
    setCurrentStep(1);
    setSelectedObjective(null);
    setSelectedFormula(null);
    setRecommendedProduct(null);
  };

  const handleOrder = (product: StoreProductItem) => {
    playValidationBeep();
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${moodStyle.accentBadge}`}>
            <Brain className="w-3.5 h-3.5" />
            <span>{subtitle}</span>
          </span>
          <h2 className={`text-2xl sm:text-4xl font-black tracking-tight ${moodStyle.textPrimary}`}>
            {title}
          </h2>
          <p className={`text-xs sm:text-sm ${moodStyle.textSecondary}`}>
            Répondez à 2 questions simples pour découvrir la référence exacte conçue pour vos besoins.
          </p>
        </div>

        {/* CONTAINER DU QUIZ */}
        <div className={`p-6 sm:p-10 rounded-3xl ${moodStyle.cardBg} border border-blue-500/30 shadow-2xl backdrop-blur-md relative overflow-hidden min-h-[380px] flex flex-col justify-center`}>
          {/* LOADER D'ANALYSE IA */}
          {isAnalyzing ? (
            <div className="text-center py-12 space-y-5 animate-in fade-in">
              <div className="w-20 h-20 rounded-full bg-blue-600/10 border-2 border-blue-500 text-blue-600 flex items-center justify-center text-3xl mx-auto animate-pulse">
                🧠
              </div>
              <div className="space-y-2 max-w-sm mx-auto">
                <h3 className={`text-lg font-black ${moodStyle.textPrimary}`}>
                  Analyse de votre profil en cours...
                </h3>
                <p className="text-xs text-slate-400">
                  Notre algorithme compare vos réponses avec l'ensemble du catalogue.
                </p>
                <div className="w-48 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mx-auto mt-3">
                  <div className="h-full bg-blue-600 rounded-full animate-[indeterminate_1s_infinite_linear]" style={{ width: '80%' }} />
                </div>
              </div>
            </div>
          ) : currentStep <= 2 ? (
            /* ÉTAPES 1 & 2 : CARTES DE QUESTIONS */
            <div className="space-y-6 animate-in fade-in">
              {/* Barre de progression des étapes */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Étape {currentStep} sur 2</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  {currentStep === 1 ? '50% complété' : '100% presque fini !'}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: currentStep === 1 ? '50%' : '100%' }}
                />
              </div>

              {/* Titre de la question */}
              <div className="text-left space-y-1">
                <h3 className={`text-lg sm:text-xl font-black ${moodStyle.textPrimary}`}>
                  {questions[currentStep - 1].title}
                </h3>
                <p className={`text-xs ${moodStyle.textSecondary}`}>
                  {questions[currentStep - 1].subtitle}
                </p>
              </div>

              {/* Options cliquables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {questions[currentStep - 1].options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className="p-5 rounded-2xl border border-black/10 dark:border-white/10 hover:border-blue-500 bg-white dark:bg-slate-900/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 text-left transition-all duration-150 cursor-pointer shadow-xs active:scale-98 group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-3xl block mb-2">{opt.icon}</span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {opt.label}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                    <div className="pt-3 mt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-blue-600">
                      <span>Sélectionner</span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ÉTAPE 3 : RÉSULTAT TRIOMPHANT (PRODUIT RECOMMANDÉ) */
            recommendedProduct && (
              <div className="text-left space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <AdminProductQuickBar
                  product={recommendedProduct}
                  storeSlug={storeSlug}
                  onEditProduct={onEditProduct}
                  onPreviewFunnel={onPreviewFunnel}
                  isPublicView={isPublicView}
                  isAdminPreview={isAdminPreview}
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-black/5">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🎯</span>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase">
                        Score IA : Compatibilité 98%
                      </span>
                      <h3 className={`text-xl font-black ${moodStyle.textPrimary} mt-0.5`}>
                        Voici Votre Solution Sur-Mesure !
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Recommencer le diagnostic</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  <div className="sm:col-span-5">
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
                      <img
                        src={recommendedProduct.image}
                        alt={recommendedProduct.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-black uppercase shadow-md">
                        Recommandation #1
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-7 space-y-4">
                    <div>
                      <h4 className={`text-lg sm:text-xl font-black ${moodStyle.textPrimary}`}>
                        {recommendedProduct.name}
                      </h4>
                      <p className={`text-xs ${moodStyle.textSecondary} mt-1 leading-relaxed`}>
                        {recommendedProduct.description || "Ce produit répond exactement aux critères sélectionnés lors de votre diagnostic pour un résultat optimal garanti."}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Formule validée pour votre profil personnel</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Livraison sous 24-48h avec contrôle du colis</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Tarif Recommandé</span>
                        <span className={`text-2xl font-black ${moodStyle.textPrimary}`}>
                          {recommendedProduct.price.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOrder(recommendedProduct)}
                        className={`px-8 py-4 ${moodStyle.accentButton} ${buttonRadiusClass} font-black text-sm flex items-center gap-2 cursor-pointer shadow-xl shadow-blue-600/30 active:scale-95 transition-transform`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Commander Mon Produit</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
};
