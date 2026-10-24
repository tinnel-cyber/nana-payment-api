import React, { useState } from 'react';
import { 
  Mail, Phone, MapPin, ChevronUp, Facebook, Twitter, 
  Instagram, Youtube, Send, CheckCircle2 
} from 'lucide-react';
import { ThemeCustomizationConfig } from '../../types';
import { playTapBeep, playValidationBeep } from '../../utils/audio';

interface MegaStoreFooterProps {
  storeName?: string;
  whatsappPhone?: string;
  customConfig?: ThemeCustomizationConfig;
  onOpenContact?: () => void;
}

export const MegaStoreFooter: React.FC<MegaStoreFooterProps> = ({
  storeName = 'You&Me Shop',
  whatsappPhone,
  customConfig,
  onOpenContact
}) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const effectiveStoreName = customConfig?.storeName || storeName || 'You&Me Shop';
  const effectivePhone = customConfig?.customization?.footer?.contactPhone || customConfig?.whatsappNumber || customConfig?.supportPhone || whatsappPhone || '+221 77 000 00 00';
  const effectiveAddress = customConfig?.customization?.footer?.address || customConfig?.footerAddress || "Zone Commerciale Express • Livraison partout en Afrique de l'Ouest";
  const effectiveEmail = customConfig?.customization?.footer?.email || customConfig?.footerEmail || 'support@nanasore.com';
  const effectiveAbout = customConfig?.customization?.footer?.aboutText || customConfig?.footerAboutText;
  const showPayments = customConfig?.paymentIconsVisible !== false;
  const copyrightText = customConfig?.customization?.footer?.copyright || customConfig?.copyrightText || `© ${new Date().getFullYear()} ${effectiveStoreName}. Tous droits réservés. Propulsé par Nanasore Cloud.`;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    playValidationBeep();
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 5000);
  };

  const scrollToTop = () => {
    playTapBeep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-[#0B132A] text-slate-300 mt-16 border-t border-slate-800">
      
      {/* 1. BANDEAU SUPÉRIEUR NEWSLETTER & RETOUR EN HAUT (IMAGE 5) */}
      <div className="w-full border-b border-slate-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Titre Newsletter */}
          <div className="text-center md:text-left">
            <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
              {customConfig?.footerNewsletterTitle || 'INSCRIVEZ-VOUS À NOTRE NEWSLETTER'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {customConfig?.footerNewsletterSubtitle || 'Recevez nos offres exclusives, codes promos et nouveautés en avant-première.'}
            </p>
          </div>

          {/* Formulaire Email */}
          <form onSubmit={handleSubscribe} className="w-full max-w-md flex items-center">
            <div className="relative flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email..."
                className="w-full py-2.5 px-4 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-l-xs outline-none focus:border-[#0056D2]"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 px-6 bg-white hover:bg-slate-200 text-slate-950 font-black text-xs uppercase tracking-wider rounded-r-xs transition cursor-pointer shrink-0"
            >
              {subscribed ? 'MERCI !' : "S'INSCRIRE"}
            </button>
          </form>

          {/* Bouton Retour en Haut */}
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            title="Revenir tout en haut"
          >
            <span>RETOUR EN HAUT</span>
            <ChevronUp className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* 2. LES 4 GRANDES COLONNES DU CATALOGUE (IMAGE 5) */}
      <div className="max-w-[1400px] mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 text-xs">
          
          {/* Colonne 1 : NOS RAYONS & COLLECTIONS */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-white tracking-widest border-b border-slate-800 pb-2">
              NOS RAYONS & COLLECTIONS
            </h5>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Nouveautés 2026</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Meilleures Ventes High-Tech</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Grand Déstockage Ventes Flash</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Bons de Réduction & Coupons</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Rayon Épicerie & Fraîcheur</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Mode Urbaine & Accessoires</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Expédition Internationale Express</a></li>
            </ul>
          </div>

          {/* Colonne 2 : SERVICE CLIENT & HIGH-TECH */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-white tracking-widest border-b border-slate-800 pb-2">
              SERVICE CLIENT & HIGH-TECH
            </h5>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Câbles & Adaptateurs GaN</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Smartphones 5G & Tablettes</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Casques Audio & Écouteurs ANC</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Téléviseurs OLED & Vidéoprojecteurs</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Batteries Externes & Chargeurs</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Gaming & Manettes Pro</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Assistance SAV 7j/7</a></li>
            </ul>
          </div>

          {/* Colonne 3 : INFORMATIONS & GARANTIES */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-white tracking-widest border-b border-slate-800 pb-2">
              INFORMATIONS & GARANTIES
            </h5>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Conditions Générales de Vente</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Politique de Confidentialité</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Modalités de Livraison 24h</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Garantie Satisfait ou Remboursé</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Suivi de Commande par SMS</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Paiement Mobile Money Sécurisé</a></li>
              <li><a href="#mega-products-catalog" className="hover:text-white transition">Programme Partenaires & Affiliation</a></li>
            </ul>
          </div>

          {/* Colonne 4 : BOUTIQUE & COORDONNÉES */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-white tracking-widest border-b border-slate-800 pb-2">
              {effectiveStoreName.toUpperCase()}
            </h5>
            {effectiveAbout && (
              <p className="text-xs text-slate-400 leading-relaxed">
                {effectiveAbout}
              </p>
            )}
            <div className="space-y-2.5 text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#0056D2] shrink-0 mt-0.5" />
                <span>{effectiveAddress}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#0056D2] shrink-0" />
                <span className="text-white font-bold">{effectivePhone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#0056D2] shrink-0" />
                <span className="text-white font-bold">{effectiveEmail}</span>
              </div>
            </div>

            {/* Réseaux Sociaux */}
            <div className="pt-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                Suivez-nous :
              </span>
              <div className="flex items-center gap-2 text-slate-300">
                <a
                  href={customConfig?.socialLinks?.facebook || '#facebook'}
                  target={customConfig?.socialLinks?.facebook ? '_blank' : undefined}
                  rel="noreferrer"
                  className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-[#0056D2] hover:text-white transition cursor-pointer"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </a>
                <a
                  href={customConfig?.socialLinks?.tiktok || '#tiktok'}
                  target={customConfig?.socialLinks?.tiktok ? '_blank' : undefined}
                  rel="noreferrer"
                  className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-[#0056D2] hover:text-white transition cursor-pointer"
                >
                  <Twitter className="w-3.5 h-3.5" />
                </a>
                <a
                  href={customConfig?.socialLinks?.instagram || '#instagram'}
                  target={customConfig?.socialLinks?.instagram ? '_blank' : undefined}
                  rel="noreferrer"
                  className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-[#0056D2] hover:text-white transition cursor-pointer"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>
                <a
                  href={customConfig?.socialLinks?.youtube || '#youtube'}
                  target={customConfig?.socialLinks?.youtube ? '_blank' : undefined}
                  rel="noreferrer"
                  className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-[#0056D2] hover:text-white transition cursor-pointer"
                >
                  <Youtube className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BARRE INFÉRIEURE COPYRIGHT & PAIEMENTS */}
      <div className="w-full border-t border-slate-800 py-4 px-4 sm:px-6 lg:px-8 bg-slate-950 text-[11px] text-slate-500">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            {copyrightText}
          </div>
          {showPayments && (
            <div className="flex items-center gap-3 text-slate-400 font-semibold flex-wrap justify-center">
              <span>Visa</span>
              <span>•</span>
              <span>Mastercard</span>
              <span>•</span>
              <span>Wave Money</span>
              <span>•</span>
              <span>Orange Money</span>
              <span>•</span>
              <span>MTN MoMo</span>
              <span>•</span>
              <span>Livraison Sécurisée 24h</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
