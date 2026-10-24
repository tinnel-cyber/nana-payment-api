import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { CustomThemeSection } from '../../../types';
import { MoodStyleConfig } from '../moodStyles';
import { playTapBeep } from '../../../utils/audio';

export interface FaqAccordionSectionProps {
  section: CustomThemeSection;
  mood: MoodStyleConfig;
  buttonRadiusClass?: string;
  isPublicView?: boolean;
  isAdminPreview?: boolean;
  controlBar?: React.ReactNode;
}

export const FaqAccordionSection: React.FC<FaqAccordionSectionProps> = ({
  section,
  mood,
  controlBar
}) => {
  const cfg = section.config || {};
  const title = section.title || cfg.title || "Questions Fréquentes";
  const subtitle = section.subtitle || cfg.subtitle || "Tout ce que vous devez savoir avant de passer commande";

  const defaultItems = [
    {
      q: "Comment se déroule la livraison ?",
      a: "Notre service d'expédition prépare votre commande immédiatement. Un livreur vous appelle ou vous envoie un message Wameet Direct pour convenir d'une heure de passage directement à votre domicile ou à votre lieu de travail."
    },
    {
      q: "Quand et comment puis-je régler mon achat ?",
      a: "Vous ne payez qu'à la livraison, une fois le colis entre vos mains ! Nous acceptons les espèces ainsi que les paiements Mobile Money (Orange Money, Wave, MTN, Moov) sur place."
    },
    {
      q: "Puis-je vérifier le produit avant de payer ?",
      a: "Absolument. Nous encourageons nos clients à contrôler le colis en présence du livreur afin de s'assurer de sa conformité avant de finaliser le règlement."
    },
    {
      q: "Que faire si j'ai besoin d'aide après la réception ?",
      a: "Notre service client reste disponible 7j/7 sur Wameet Direct. Il vous suffit de nous écrire avec votre numéro de commande pour une prise en charge immédiate."
    }
  ];

  const items = cfg.items || defaultItems;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    playTapBeep();
    setOpenIndex(prev => prev === idx ? null : idx);
  };

  return (
    <section className={`relative py-14 sm:py-20 ${mood.sectionBg} border-b border-black/5`}>
      {controlBar}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14 space-y-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${mood.accentBadge}`}>
            AIDE & TRANQUILLITÉ D'ESPRIT
          </span>
          <h2 className={`text-2xl sm:text-4xl font-black tracking-tight ${mood.textPrimary}`}>
            {title}
          </h2>
          <p className={`text-xs sm:text-sm ${mood.textSecondary}`}>
            {subtitle}
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item: any, idx: number) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl transition border border-black/5 overflow-hidden ${mood.cardBg}`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full px-5 py-4 sm:py-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <span className={`text-sm sm:text-base font-bold ${mood.textPrimary}`}>
                    {item.q}
                  </span>
                  <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm leading-relaxed border-t border-black/5 animate-in fade-in duration-200">
                    <p className={mood.textSecondary}>
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
