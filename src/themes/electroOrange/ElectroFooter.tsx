import React, { useState } from 'react';
import { 
  Send, Headphones, Star, ArrowUp, Facebook, 
  Twitter, Instagram, Github, CheckCircle2, PhoneCall
} from 'lucide-react';
import { StoreProductItem } from '../../components/storeBuilder/types';
import { ThemeCustomizationConfig } from '../../types';
import { formatCFA, playTapBeep, playValidationBeep } from '../../utils/audio';
import { 
  ELECTRO_HEADPHONES_HERO_SVG, 
  ELECTRO_SMARTWATCH_DUO_SVG, 
  ELECTRO_SPEAKER_OVAL_SVG,
  ELECTRO_SMARTPHONE_GOLD_SVG,
  ELECTRO_NX_CAMERA_SVG,
  ELECTRO_PRINTER_SVG,
  ELECTRO_USB_DRIVE_SVG,
  ELECTRO_VR_HEADSET_SVG,
  ELECTRO_REVERSIBLE_LAPTOP_SVG
} from './electroOrangeAssets';

interface ElectroFooterProps {
  storeName: string;
  onSelectProduct?: (p: StoreProductItem) => void;
  onNavigateCategory?: (category: string) => void;
  customConfig?: ThemeCustomizationConfig;
}

export const ElectroFooter: React.FC<ElectroFooterProps> = ({
  storeName,
  onSelectProduct,
  onNavigateCategory,
  customConfig
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribedToast, setSubscribedToast] = useState(false);
  const displayStoreName = customConfig?.storeName || storeName;

  // Logos de marques pour la barre des marques
  const BRANDS = [
    { name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
    { name: 'Samsung', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg' },
    { name: 'Sony', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg' },
    { name: 'Canon', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Canon_wordmark.svg' },
    { name: 'Xiaomi', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Xiaomi_logo_%282021-%29.svg' },
    { name: 'Logitech', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Logitech_logo.svg' }
  ];

  // 3 Listes Compactes de 3 Produits : Featured | Onsale | Top Rated (Image 4)
  const FEATURED_MINI = [
    {
      id: 'mini-feat-1',
      name: 'Purple Wireless Headphones Solo 2 HD',
      price: 114900,
      image: ELECTRO_HEADPHONES_HERO_SVG
    },
    {
      id: 'mini-feat-2',
      name: 'Powerbank 1130 mAh Slim Blue Edition',
      price: 21000,
      image: ELECTRO_USB_DRIVE_SVG
    },
    {
      id: 'mini-feat-3',
      name: 'Aerocool EN52377 Dead Silence Gaming Cube Case',
      price: 180000,
      image: ELECTRO_VR_HEADSET_SVG
    }
  ];

  const ONSALE_MINI = [
    {
      id: 'mini-sale-1',
      name: 'Yellow Earphones Waterproof with Bluetooth',
      price: 11000,
      originalPrice: 25000,
      image: ELECTRO_SPEAKER_OVAL_SVG
    },
    {
      id: 'mini-sale-2',
      name: 'Camera C430W 4K Waterproof Action Cam',
      price: 89900,
      originalPrice: 120000,
      image: ELECTRO_NX_CAMERA_SVG
    },
    {
      id: 'mini-sale-3',
      name: 'Smartphone 6S 32GB LTE Unlocked Gold',
      price: 210000,
      originalPrice: 329900,
      image: ELECTRO_SMARTPHONE_GOLD_SVG
    }
  ];

  const TOP_RATED_MINI = [
    {
      id: 'mini-top-1',
      name: 'Smartwatch 2.0 LTE Wifi Waterproof Sport',
      price: 72500,
      rating: 5,
      image: ELECTRO_SMARTWATCH_DUO_SVG
    },
    {
      id: 'mini-top-2',
      name: '22Mps Camera 6200U with 500GB SDCard Bundle',
      price: 299900,
      rating: 4,
      image: ELECTRO_NX_CAMERA_SVG
    },
    {
      id: 'mini-top-3',
      name: 'Full Color Laserjet Pro M452dn Duplex Network',
      price: 43900,
      rating: 5,
      image: ELECTRO_PRINTER_SVG
    }
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      alert("Veuillez saisir une adresse email valide.");
      return;
    }
    playValidationBeep();
    setSubscribedToast(true);
    setNewsletterEmail('');
    setTimeout(() => setSubscribedToast(false), 4000);
  };

  const scrollToTop = () => {
    playTapBeep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-[#FFFFFF] text-[#333E48] select-none mt-auto">
      
      {/* =========================================================================
          1. BARRE DES MARQUES (Entre deux lignes grises fines, logos en niveaux de gris)
         ========================================================================= */}
      <div className="w-full border-t border-b border-[#EAEAEA] py-6 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-8 overflow-x-auto">
          {BRANDS.map((brand) => (
            <div
              key={brand.name}
              className="flex-1 min-w-[120px] flex items-center justify-center p-2 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 transform hover:scale-105 cursor-pointer"
              title={`Marque ${brand.name}`}
            >
              <span className="font-extrabold text-sm sm:text-base tracking-widest uppercase text-slate-400 hover:text-slate-900">
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          2. 3 COLONNES DE MINI-LISTES (IMAGE 4)
          Featured Products | Onsale Products | Top Rated Products
          Titre souligné d'un trait Orange + 3 produits horizontaux compacts
         ========================================================================= */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Colonne 1 : Featured Products */}
          <div className="space-y-4">
            <div className="border-b border-[#EAEAEA] pb-2 relative">
              <h3 className="text-base font-extrabold text-[#333E48] tracking-tight">
                Featured Products
              </h3>
              <div className="absolute -bottom-[2px] left-0 w-16 h-[3px] bg-[#FF6A00]" />
            </div>

            <div className="divide-y divide-slate-100">
              {FEATURED_MINI.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectProduct && onSelectProduct(item as any)}
                  className="py-3 flex items-center gap-3.5 cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded bg-[#FAFBFD] border border-slate-100 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="electro-product-title text-xs line-clamp-2 leading-snug">
                      {item.name}
                    </h4>
                    <span className="text-xs font-black text-[#333E48] font-mono block">
                      {formatCFA(item.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne 2 : Onsale Products */}
          <div className="space-y-4">
            <div className="border-b border-[#EAEAEA] pb-2 relative">
              <h3 className="text-base font-extrabold text-[#333E48] tracking-tight">
                Onsale Products
              </h3>
              <div className="absolute -bottom-[2px] left-0 w-16 h-[3px] bg-[#FF6A00]" />
            </div>

            <div className="divide-y divide-slate-100">
              {ONSALE_MINI.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectProduct && onSelectProduct(item as any)}
                  className="py-3 flex items-center gap-3.5 cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded bg-[#FAFBFD] border border-slate-100 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="electro-product-title text-xs line-clamp-2 leading-snug">
                      {item.name}
                    </h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-black text-[#E52E04] font-mono">
                        {formatCFA(item.price)}
                      </span>
                      {item.originalPrice && (
                        <span className="text-[11px] text-slate-400 line-through">
                          {formatCFA(item.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne 3 : Top Rated Products */}
          <div className="space-y-4">
            <div className="border-b border-[#EAEAEA] pb-2 relative">
              <h3 className="text-base font-extrabold text-[#333E48] tracking-tight">
                Top Rated Products
              </h3>
              <div className="absolute -bottom-[2px] left-0 w-16 h-[3px] bg-[#FF6A00]" />
            </div>

            <div className="divide-y divide-slate-100">
              {TOP_RATED_MINI.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectProduct && onSelectProduct(item as any)}
                  className="py-3 flex items-center gap-3.5 cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded bg-[#FAFBFD] border border-slate-100 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="electro-product-title text-xs line-clamp-2 leading-snug">
                      {item.name}
                    </h4>
                    <div className="flex items-center text-[#FF6A00]">
                      {Array.from({ length: item.rating }).map((_, rIdx) => (
                        <Star key={rIdx} className="w-3 h-3 fill-[#FF6A00]" />
                      ))}
                    </div>
                    <span className="text-xs font-black text-[#333E48] font-mono block">
                      {formatCFA(item.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          3. BANDEAU NEWSLETTER (PLEINE LARGEUR EN ORANGE VIF #FF6A00) (IMAGES 4 & 5)
          À gauche : Icône avion en papier + texte
          À droite : Input email blanc fusionné avec bouton noir/gris foncé (#333E48)
         ========================================================================= */}
      <div className="w-full bg-[#FF6A00] text-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Gauche : Icône avion en papier + Texte de conversion */}
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Send className="w-6 h-6 text-white transform -rotate-12" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                {customConfig?.footerNewsletterTitle || 'Sign up to Newsletter'}
              </h3>
              <p className="text-xs sm:text-sm text-white/90 font-medium">
                {customConfig?.footerNewsletterSubtitle || (
                  <>...and receive <strong>$20 coupon (10 000 FCFA)</strong> for first shopping.</>
                )}
              </p>
            </div>
          </div>

          {/* Droite : Input blanc fusionné avec bouton sombre #333E48 */}
          <form 
            onSubmit={handleSubscribe}
            className="w-full md:w-auto flex items-stretch max-w-md bg-white rounded-full p-1 shadow-md"
          >
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address..."
              className="flex-1 bg-transparent px-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none rounded-l-full font-medium"
              required
            />
            <button
              type="submit"
              className="bg-[#333E48] hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-full transition cursor-pointer shrink-0"
            >
              Sign Up
            </button>
          </form>

        </div>
      </div>

      {/* Toast de confirmation Newsletter */}
      {subscribedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#333E48] text-white text-xs font-bold px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 border-l-4 border-[#FF6A00] animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#FF6A00]" />
          <span>Félicitations ! Votre bon de réduction de 10 000 FCFA a été généré.</span>
        </div>
      )}

      {/* =========================================================================
          4. FOOTER PRINCIPAL (FOND GRIS TRÈS CLAIR #F8F8F8) (IMAGE 5)
          4 Colonnes :
          Col 1 : Logo, hotline casque 24/7, adresse, réseaux sociaux
          Col 2 : Trouvez-le vite (Find it Fast)
          Col 3 : Suite des catégories (Printers & Ink, Software...)
          Col 4 : Service Client (Customer Care)
         ========================================================================= */}
      <div className="w-full bg-[#F8F8F8] border-b border-[#EAEAEA] py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-600">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Colonne 1 : Logo & Hotline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 tracking-tight font-black text-2xl text-[#333E48]">
              {customConfig?.logoUrl && (
                <img src={customConfig.logoUrl} alt={displayStoreName} className="w-7 h-7 rounded object-cover" />
              )}
              <div className="flex items-baseline">
                <span>{displayStoreName || 'electro'}</span>
                <span className="text-[#FF6A00] text-[30px] leading-none">.</span>
              </div>
            </div>

            {(customConfig?.customization?.footer?.aboutText || customConfig?.footerAboutText) && (
              <p className="text-xs text-slate-500 leading-relaxed">{customConfig?.customization?.footer?.aboutText || customConfig?.footerAboutText}</p>
            )}

            {/* Hotline Téléphonique Géante avec Casque Orange */}
            <div className="flex items-center gap-3 pt-2">
              <Headphones className="w-8 h-8 text-[#FF6A00] shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">
                  Got questions? Call us 24/7!
                </span>
                <strong className="text-base sm:text-lg font-black text-[#333E48] font-mono leading-tight">
                  {customConfig?.customization?.footer?.contactPhone || customConfig?.supportPhone || customConfig?.whatsappNumber || '(800) 8001-8588, (0600) 874 548'}
                </strong>
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-1 pt-2 text-slate-500">
              <span className="font-bold text-slate-700 block">Contact info</span>
              <p>{customConfig?.customization?.footer?.address || customConfig?.footerAddress || '17 Princess Road, London, Greater London NW1 8JR, UK'}</p>
              {(customConfig?.customization?.footer?.email || customConfig?.footerEmail) && (
                <p className="text-slate-600">{customConfig?.customization?.footer?.email || customConfig?.footerEmail}</p>
              )}
            </div>

            {/* Réseaux sociaux */}
            <div className="flex items-center gap-4 pt-3 text-slate-400">
              <button type="button" onClick={() => customConfig?.socialLinks?.facebook && window.open(customConfig.socialLinks.facebook, '_blank')} className="hover:text-[#FF6A00] transition cursor-pointer" title="Facebook">
                <Facebook className="w-4 h-4" />
              </button>
              <button type="button" className="hover:text-[#FF6A00] transition cursor-pointer" title="Twitter">
                <Twitter className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => customConfig?.socialLinks?.instagram && window.open(customConfig.socialLinks.instagram, '_blank')} className="hover:text-[#FF6A00] transition cursor-pointer" title="Instagram">
                <Instagram className="w-4 h-4" />
              </button>
              <button type="button" className="hover:text-[#FF6A00] transition cursor-pointer" title="GitHub">
                <Github className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Colonne 2 : Trouvez-le vite (Find it Fast) */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-[#333E48] uppercase tracking-wider">
              Find it Fast
            </h4>
            <ul className="space-y-2 text-slate-500">
              {[
                'Laptops & Computers', 
                'Cameras & Photography', 
                'Smart Phones & Tablets', 
                'Video Games & Consoles', 
                'TV & Audio', 
                'Gadgets', 
                'Car Electronic & GPS'
              ].map((link) => (
                <li key={link}>
                  <button 
                    type="button" 
                    onClick={() => onNavigateCategory && onNavigateCategory(link)}
                    className="hover:text-[#FF6A00] transition text-left cursor-pointer"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 3 : Suite des catégories */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-[#333E48] uppercase tracking-wider">
              Catégories & Bureau
            </h4>
            <ul className="space-y-2 text-slate-500">
              {[
                'Printers & Ink', 
                'Software & Licenses', 
                'Office Supplies', 
                'Computer Components', 
                'Accesories & Cables',
                'VR & Immersive Gear',
                'Gaming Accessories'
              ].map((link) => (
                <li key={link}>
                  <button 
                    type="button" 
                    onClick={() => onNavigateCategory && onNavigateCategory(link)}
                    className="hover:text-[#FF6A00] transition text-left cursor-pointer"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 4 : Service Client (Customer Care) */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-[#333E48] uppercase tracking-wider">
              Customer Care
            </h4>
            <ul className="space-y-2 text-slate-500">
              {[
                'My Account', 
                'Order Tracking', 
                'Wish List', 
                'Customer Service', 
                'Returns / Exchange', 
                'FAQs & Aide', 
                'Product Support'
              ].map((link) => (
                <li key={link}>
                  <button 
                    type="button" 
                    onClick={() => {
                      playTapBeep();
                      alert(`Service Client : Accès à la rubrique ${link}.`);
                    }}
                    className="hover:text-[#FF6A00] transition text-left cursor-pointer"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* =========================================================================
          5. SOUS-FOOTER (COPYRIGHT & BADGES DE PAIEMENT SÉCURISÉ) (IMAGE 5)
         ========================================================================= */}
      <div className="w-full bg-[#EAEAEA] py-4 px-4 sm:px-6 lg:px-8 text-[11.5px] text-slate-500">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Copyright à gauche */}
          <div>
            {customConfig?.customization?.footer?.copyright || customConfig?.copyrightText || (
              <>© {new Date().getFullYear()} <strong>{displayStoreName || 'Electro'}</strong> - All rights Reserved</>
            )}
          </div>

          {/* Badges de paiement sécurisés à droite + Bouton Scroll To Top */}
          <div className="flex items-center gap-4">
            {customConfig?.paymentIconsVisible !== false && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white font-black text-[10px] text-blue-900 shadow-2xs border border-slate-300">VISA</span>
              <span className="px-2 py-0.5 rounded bg-white font-black text-[10px] text-red-600 shadow-2xs border border-slate-300">MasterCard</span>
              <span className="px-2 py-0.5 rounded bg-white font-black text-[10px] text-orange-600 shadow-2xs border border-slate-300">Discover</span>
              <span className="px-2 py-0.5 rounded bg-white font-black text-[10px] text-purple-700 shadow-2xs border border-slate-300">Skrill</span>
              <span className="px-2 py-0.5 rounded bg-white font-black text-[10px] text-blue-600 shadow-2xs border border-slate-300">PayPal</span>
            </div>
            )}

            {/* Bouton retour en haut jaune/orange */}
            <button
              type="button"
              onClick={scrollToTop}
              className="w-8 h-8 rounded-full bg-[#FF6A00] hover:bg-[#E05D00] text-white flex items-center justify-center transition shadow-md cursor-pointer ml-2"
              title="Remonter en haut de page"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

    </footer>
  );
};
