import React from 'react';
import { Truck, ShieldCheck, MessageCircle, RotateCcw, CheckCircle2, Award, Headphones, CreditCard } from 'lucide-react';
import { CustomThemeSection } from '../../../types';
import { MoodStyleConfig } from '../moodStyles';

export interface TrustBadgesSectionProps {
  section: CustomThemeSection;
  mood: MoodStyleConfig;
  buttonRadiusClass?: string;
  isPublicView?: boolean;
  isAdminPreview?: boolean;
  controlBar?: React.ReactNode;
}

export const TrustBadgesSection: React.FC<TrustBadgesSectionProps> = ({
  section,
  mood,
  controlBar
}) => {
  const cfg = section.config || {};
  const title = section.title || cfg.title || "Pourquoi Faire Confiance à Notre Boutique ?";
  const subtitle = section.subtitle || cfg.subtitle;

  const defaultBadges = [
    {
      icon: 'truck',
      title: "Livraison Rapide 24-48h",
      desc: "Expédition soignée directement chez vous ou à votre bureau"
    },
    {
      icon: 'shield',
      title: "Paiement 100% Sécurisé",
      desc: "Payez à la réception en Cash, Wave ou Orange Money"
    },
    {
      icon: 'wameet',
      title: "Conseillers Wameet 24/7",
      desc: "Une équipe dédiée à votre écoute pour toute question"
    },
    {
      icon: 'rotate',
      title: "Garantie Satisfait ou Échangé",
      desc: "Contrôlez votre commande à l'arrivée en toute sérénité"
    }
  ];

  const badges = cfg.badges || defaultBadges;

  const renderIcon = (type: string) => {
    switch (type) {
      case 'truck':
        return <Truck className="w-6 h-6 text-blue-600" />;
      case 'shield':
        return <ShieldCheck className="w-6 h-6 text-emerald-600" />;
      case 'wameet':
      case 'w':
        return <MessageCircle className="w-6 h-6 text-green-600" />;
      case 'rotate':
      default:
        return <RotateCcw className="w-6 h-6 text-amber-600" />;
    }
  };

  return (
    <section className={`relative py-12 sm:py-16 ${mood.sectionAltBg} border-b border-black/5`}>
      {controlBar}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12 space-y-1">
            <h2 className={`text-xl sm:text-2xl font-black ${mood.textPrimary}`}>
              {title}
            </h2>
            {subtitle && (
              <p className={`text-xs sm:text-sm ${mood.textSecondary}`}>
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {badges.map((b: any, idx: number) => (
            <div
              key={idx}
              className={`p-6 rounded-3xl transition-all duration-200 border border-black/5 flex flex-col items-center sm:items-start text-center sm:text-left space-y-3 ${mood.cardBg}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800/80 flex items-center justify-center shrink-0 shadow-xs">
                {renderIcon(b.icon)}
              </div>
              <div>
                <h3 className={`text-sm sm:text-base font-black ${mood.textPrimary}`}>
                  {b.title}
                </h3>
                <p className={`text-xs mt-1 leading-relaxed ${mood.textSecondary}`}>
                  {b.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
