import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, CheckCircle2, Quote } from 'lucide-react';
import { playTapBeep } from '../../utils/audio';
import {
  BEAUTY_TESTIMONIAL_OLIVIA_IMG,
  BEAUTY_TESTIMONIAL_OLIVIA_AVATAR,
  BEAUTY_TESTIMONIAL_EMMA_IMG,
  BEAUTY_TESTIMONIAL_EMMA_AVATAR,
  BEAUTY_TESTIMONIAL_SOPHIA_IMG,
  BEAUTY_TESTIMONIAL_SOPHIA_AVATAR,
  BEAUTY_FLACON_SERUM_SVG,
  BEAUTY_FLACON_CREAM_SVG,
  BEAUTY_FLACON_PARFUM_SVG
} from './beautyEmeraldAssets';

export interface BeautyTestimonialItem {
  id: string;
  name: string;
  location: string;
  rating: number;
  productName: string;
  productImage: string;
  image: string;
  avatar: string;
  quote: string;
  tag: string;
  verified: boolean;
}

const DEFAULT_TESTIMONIALS: BeautyTestimonialItem[] = [
  {
    id: 't-olivia',
    name: 'Olivia',
    location: 'Abidjan, Cocody',
    rating: 5,
    productName: 'Sérum Éclat Botanique C+',
    productImage: BEAUTY_FLACON_SERUM_SVG,
    image: BEAUTY_TESTIMONIAL_OLIVIA_IMG,
    avatar: BEAUTY_TESTIMONIAL_OLIVIA_AVATAR,
    quote: "Ce soin est devenu mon rituel quotidien incontournable. La texture soyeuse pénètre immédiatement sans effet gras et apporte une fraîcheur instantanée. Après trois semaines, mon teint est visiblement unifié, lumineux et reposé.",
    tag: 'Résultat 14 Jours',
    verified: true
  },
  {
    id: 't-emma',
    name: 'Emma',
    location: 'Dakar, Almadies',
    rating: 5,
    productName: 'Crème Royale Régénérante Nuit',
    productImage: BEAUTY_FLACON_CREAM_SVG,
    image: BEAUTY_TESTIMONIAL_EMMA_IMG,
    avatar: BEAUTY_TESTIMONIAL_EMMA_AVATAR,
    quote: "Après quelques semaines d'utilisation, j'ai constaté une véritable transformation du grain de ma peau. Elle s'applique avec fluidité, protège l'hydratation toute la journée et laisse un toucher velouté d'une douceur incroyable.",
    tag: 'Teint Repulpé',
    verified: true
  },
  {
    id: 't-sophia',
    name: 'Sophia',
    location: 'Cotonou, Haie Vive',
    rating: 5,
    productName: 'Extrait Pur - Oud & Rose Précieuse',
    productImage: BEAUTY_FLACON_PARFUM_SVG,
    image: BEAUTY_TESTIMONIAL_SOPHIA_IMG,
    avatar: BEAUTY_TESTIMONIAL_SOPHIA_AVATAR,
    quote: "Ma peau était sujette aux tiraillements et aux rougeurs dues au climat. Cette formule a rééquilibré ma barrière cutanée tout en douceur sans aucune irritation. La texture est luxueuse et le sillage délicat est d'un raffinement rare.",
    tag: 'Éclat Naturel',
    verified: true
  }
];

export interface BeautyTestimonialsSectionProps {
  testimonials?: BeautyTestimonialItem[];
  title?: string;
  subtitle?: string;
}

export const BeautyTestimonialsSection: React.FC<BeautyTestimonialsSectionProps> = ({
  testimonials = DEFAULT_TESTIMONIALS,
  title = "Ce que disent nos clientes",
  subtitle = "Résultats Visibles & Témoignages"
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    playTapBeep();
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    playTapBeep();
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="beauty-testimonials-section max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full">
      {/* En-tête de section avec navigation flèches rondes */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
        <div>
          <span className="font-['Bodoni_Moda'] italic text-[#C59B27] font-semibold text-xl sm:text-2xl block tracking-wide">
            {subtitle}
          </span>
          <h2 className="font-['Syne'] font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[#111C18] mt-1 tracking-tight">
            {title}
          </h2>
        </div>

        {/* Flèches rondes de contrôle en haut à droite en #0F4C3A */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            className="w-11 h-11 rounded-full bg-[#0F4C3A] hover:bg-[#093326] text-white flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Témoignage précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-11 h-11 rounded-full bg-[#0F4C3A] hover:bg-[#093326] text-white flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Témoignage suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grille / Carrousel de Grandes Cartes 50/50 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* On affiche le témoignage actif et le suivant (ou répétition responsive) */}
        {[0, 1].map((offset) => {
          const itemIndex = (currentIndex + offset) % testimonials.length;
          const item = testimonials[itemIndex];

          return (
            <div
              key={`${item.id}-${offset}`}
              className="beauty-testimonial-card shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Moitié Gauche : Photo Résultat / Lifestyle avec Avatar & Prénom */}
              <div className="beauty-testimonial-left relative overflow-hidden bg-[#EFECE6]">
                <img
                  src={item.image}
                  alt={`Résultat soin ${item.name}`}
                  className="w-full h-full object-cover"
                />

                {/* Avatar rond incrusté en haut à gauche (48px x 48px, bordure blanche) */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-md bg-white">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Badge résultat en haut à droite */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-2.5 py-1 rounded-full bg-[#111C18]/80 backdrop-blur-sm text-[#C59B27] font-['Outfit'] font-bold text-[11px] uppercase tracking-wider border border-[#C59B27]/40">
                    {item.tag}
                  </span>
                </div>

                {/* Prénom en bas à gauche avec dégradé sombre protecteur */}
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 flex flex-col justify-end">
                  <span className="font-['Syne'] font-bold text-white text-lg tracking-wide">
                    {item.name}
                  </span>
                  <span className="font-['Outfit'] text-xs text-white/80">
                    {item.location}
                  </span>
                </div>
              </div>

              {/* Moitié Droite : Témoignage sur fond doux #F4F7F4 */}
              <div className="beauty-testimonial-right bg-[#F4F7F4] p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  {/* Miniature produit acheté + Étoiles Or Champagne #C59B27 */}
                  <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <div className="w-[50px] h-[50px] rounded-lg bg-[#EFECE6] p-1.5 flex items-center justify-center shrink-0 border border-[#C59B27]/30 shadow-xs">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <span className="font-['Outfit'] text-[11px] text-slate-500 block uppercase tracking-wider font-semibold">
                          Produit Acheté :
                        </span>
                        <h4 className="font-['Outfit'] font-bold text-xs sm:text-sm text-[#111C18] line-clamp-1">
                          {item.productName}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-[#C59B27] text-[#C59B27]"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Citation d'avis entre guillemets */}
                  <div className="relative mb-6">
                    <Quote className="w-8 h-8 text-[#0F4C3A]/15 absolute -top-3 -left-2 rotate-180 pointer-events-none" />
                    <p className="font-['Outfit'] text-sm sm:text-[15px] text-[#333333] leading-relaxed italic relative z-10 pl-2">
                      "{item.quote}"
                    </p>
                  </div>
                </div>

                {/* Pied de carte avec authenticité */}
                <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#0F4C3A] font-['Outfit'] font-bold">
                    <CheckCircle2 className="w-4 h-4 text-[#0F4C3A]" />
                    <span>Avis Cliente Vérifié</span>
                  </div>
                  <span className="font-['Outfit'] text-slate-400 font-medium">
                    {item.name}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicateur de pagination doux */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              playTapBeep();
              setCurrentIndex(idx);
            }}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              currentIndex === idx
                ? 'w-8 bg-[#0F4C3A]'
                : 'w-2 bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label={`Aller au témoignage ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
