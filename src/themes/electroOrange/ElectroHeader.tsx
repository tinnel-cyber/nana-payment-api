import React, { useRef } from 'react';
import { 
  Search, ShoppingBag, Heart, RefreshCw, MapPin, Truck, 
  ChevronDown, Menu, User, Palette, ShoppingCart
} from 'lucide-react';
import { formatCFA, playTapBeep } from '../../utils/audio';
import { ELECTRO_DEPARTMENTS } from './electroOrangeCategoriesData';
import { ThemeCustomizationConfig } from '../../types';

interface ElectroHeaderProps {
  storeName: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  cartCount: number;
  wishlistCount: number;
  compareCount: number;
  currentView: 'home' | 'shop' | 'pdp';
  onNavigate: (view: 'home' | 'shop' | 'pdp') => void;
  onOpenThemeSelector?: () => void;
  isDepartmentsOpen: boolean;
  setIsDepartmentsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onCartClick?: () => void;
  customConfig?: ThemeCustomizationConfig;
}

export const ElectroHeader: React.FC<ElectroHeaderProps> = ({
  storeName,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  cartCount,
  wishlistCount,
  compareCount,
  currentView,
  onNavigate,
  onOpenThemeSelector,
  isDepartmentsOpen,
  setIsDepartmentsOpen,
  onCartClick,
  customConfig
}) => {
  const isInternal = currentView !== 'home';
  const searchInputRef = useRef<HTMLInputElement>(null);
  const displayStoreName = customConfig?.storeName || storeName;

  return (
    <div className="w-full flex flex-col shrink-0 select-none">
      {/* =========================================================================
          NIVEAU 1 : TOP BAR (Gris très clair #F5F5F5 avec bordure basse #EAEAEA)
         ========================================================================= */}
      {customConfig?.announcementBarEnabled !== false && (
      <div className="electro-top-bar w-full py-2 px-4 sm:px-6 lg:px-8 bg-[#F5F5F5] border-b border-[#EAEAEA]">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          
          {/* Texte d'accueil à gauche */}
          <div className="text-[11.5px] font-medium text-slate-600 flex items-center gap-2">
            <span>{customConfig?.announcementBarText || 'Welcome to Worldwide Electronics Store'}</span>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="hidden md:inline text-slate-700 font-semibold">
              {displayStoreName || 'Electro Orange Store'}
            </span>
          </div>

          {/* Liens utilitaires à droite */}
          <div className="flex items-center gap-4 sm:gap-6 text-[11.5px] font-semibold text-slate-600">
            <button 
              type="button" 
              onClick={() => {
                playTapBeep();
                alert("Store Locator : Points de retrait et boutiques partenaires Nanasore.");
              }}
              className="hover:text-[#FF6A00] transition flex items-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Store Locator</span>
            </button>

            <button 
              type="button" 
              onClick={() => {
                playTapBeep();
                alert("Track Your Order : Suivez l'acheminement de votre colis avec votre numéro de commande.");
              }}
              className="hover:text-[#FF6A00] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-slate-500" />
              <span>Track Your Order</span>
            </button>

            <div className="flex items-center gap-1 text-slate-700">
              <span className="font-bold text-[#FF6A00]">XOF CFA</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            <button 
              type="button" 
              onClick={() => {
                playTapBeep();
                alert("Espace Client : Connectez-vous ou créez votre compte.");
              }}
              className="hover:text-[#FF6A00] transition flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Register or Sign in</span>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* =========================================================================
          NIVEAU 2 : MAIN HEADER
          - Page d'accueil : fond BLANC épuré
          - Pages Internes (PDP, Shop/Catégorie) : FOND PLEIN ORANGE (#FF6A00) !
            Barre de recherche blanche avec bouton de loupe sombre (#333E48)
         ========================================================================= */}
      <header 
        className={`w-full py-5 px-4 sm:px-6 lg:px-8 border-b transition-colors duration-300 ${
          isInternal 
            ? 'bg-[#FF6A00] text-white border-[#E05D00] shadow-md' 
            : 'bg-white text-[#333E48] border-[#EAEAEA]'
        }`}
        style={!isInternal && customConfig?.headerBgColor ? { backgroundColor: customConfig.headerBgColor } : undefined}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 sm:gap-8">
          
          {/* GAUCHE : Logo de la boutique */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                playTapBeep();
                setIsDepartmentsOpen(prev => !prev);
              }}
              className={`p-1 lg:hidden transition cursor-pointer ${
                isInternal ? 'text-white hover:text-amber-200' : 'text-slate-700 hover:text-[#FF6A00]'
              }`}
              title="Menu des départements"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div 
              onClick={() => {
                playTapBeep();
                onNavigate('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer select-none flex items-center gap-2.5 tracking-tight font-black text-2xl sm:text-[32px] group"
              title="Retour à l'accueil"
            >
              {customConfig?.logoUrl && (
                <img src={customConfig.logoUrl} alt={displayStoreName} className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
              )}
              <div className="flex items-baseline">
                <span className={isInternal ? 'text-white' : 'text-[#333E48]'}>
                  {displayStoreName || 'electro'}
                </span>
                <span className={`text-[36px] leading-none ${isInternal ? 'text-amber-200' : 'text-[#FF6A00]'}`}>
                  .
                </span>
              </div>
            </div>
          </div>

          {/* CENTRE : Barre de recherche monumentale en pilule */}
          <div className="flex-1 max-w-2xl mx-2 hidden sm:block">
            <div 
              className={`electro-search-pill ${
                isInternal 
                  ? 'border-0 bg-white ring-2 ring-white/50 shadow-inner' 
                  : 'border-2 border-[#FF6A00] bg-white'
              }`}
            >
              {/* Input texte */}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    playTapBeep();
                    onNavigate('shop');
                  }
                }}
                placeholder="Search for Products / Rechercher des produits..."
                className="electro-search-input text-[#333E48]"
              />

              {/* Sélecteur de catégorie interne */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  playTapBeep();
                  onSelectCategory(e.target.value);
                  onNavigate('shop');
                }}
                className="electro-search-select text-[#555E68]"
              >
                <option value="Tous">All Categories</option>
                {ELECTRO_DEPARTMENTS.filter(d => d.hasSubmenu).map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>

              {/* Bouton Loupe : Sombre (#333E48) sur page interne pour contraster avec fond orange, Orange sur accueil */}
              <button
                type="button"
                onClick={() => {
                  playTapBeep();
                  onNavigate('shop');
                }}
                className={`w-[52px] h-full flex items-center justify-center transition-colors cursor-pointer border-none outline-none ${
                  isInternal
                    ? 'bg-[#333E48] hover:bg-slate-900 text-white'
                    : 'bg-[#FF6A00] hover:bg-[#E05D00] text-white'
                }`}
                title="Lancer la recherche"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* DROITE : Comparer, Favoris, et Panier */}
          <div className="flex items-center gap-5 sm:gap-6 shrink-0">
            
            {/* Comparer */}
            <button
              type="button"
              onClick={() => {
                playTapBeep();
                alert(`Comparateur : ${compareCount} produit(s) dans votre liste.`);
              }}
              className={`relative transition cursor-pointer ${
                isInternal ? 'text-white hover:text-amber-200' : 'text-slate-600 hover:text-[#FF6A00]'
              }`}
              title="Comparer des produits"
            >
              <RefreshCw className="w-5 h-5" />
              {compareCount > 0 && (
                <span className={`absolute -top-1.5 -right-2 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs ${
                  isInternal ? 'bg-[#333E48] text-white' : 'bg-[#FF6A00] text-white'
                }`}>
                  {compareCount}
                </span>
              )}
            </button>

            {/* Favoris */}
            <button
              type="button"
              onClick={() => {
                playTapBeep();
                alert(`Favoris : ${wishlistCount} produit(s) sauvegardé(s).`);
              }}
              className={`relative transition cursor-pointer ${
                isInternal ? 'text-white hover:text-amber-200' : 'text-slate-600 hover:text-[#FF6A00]'
              }`}
              title="Liste d'envies / Favoris"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className={`absolute -top-1.5 -right-2 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs ${
                  isInternal ? 'bg-[#333E48] text-white' : 'bg-[#FF6A00] text-white'
                }`}>
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Panier */}
            <div
              onClick={() => {
                playTapBeep();
                if (onCartClick) onCartClick();
                else alert(`Panier : ${cartCount} article(s).`);
              }}
              className="flex items-center gap-3 cursor-pointer group"
              title="Consulter le panier"
            >
              <div className="relative">
                <ShoppingBag className={`w-6 h-6 transition ${
                  isInternal ? 'text-white group-hover:text-amber-200' : 'text-slate-700 group-hover:text-[#FF6A00]'
                }`} />
                <span className={`absolute -top-1.5 -right-2 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs ${
                  isInternal ? 'bg-[#333E48] text-white ring-1 ring-white/40' : 'bg-[#FF6A00] text-white'
                }`}>
                  {cartCount}
                </span>
              </div>
              <div className="hidden sm:block leading-tight text-left">
                <span className={`text-[10px] font-bold uppercase block ${
                  isInternal ? 'text-white/80' : 'text-slate-400'
                }`}>
                  Panier
                </span>
                <strong className={`text-sm font-black transition ${
                  isInternal ? 'text-white group-hover:text-amber-200' : 'text-[#333E48] group-hover:text-[#FF6A00]'
                }`}>
                  {cartCount > 0 ? formatCFA(cartCount * 15000) : '0 FCFA'}
                </strong>
              </div>
            </div>

            {/* Sélecteur de Thème Storefront */}
            {onOpenThemeSelector && (
              <button
                type="button"
                onClick={() => {
                  playTapBeep();
                  onOpenThemeSelector();
                }}
                className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                  isInternal
                    ? 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                    : 'bg-orange-50 hover:bg-orange-100 text-[#FF6A00] border-orange-200'
                }`}
                title="Changer de thème storefront"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Thèmes</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          NIVEAU 3 : NAVIGATION & DÉPARTEMENTS
         ========================================================================= */}
      <div className="w-full bg-white border-b border-[#EAEAEA]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Bouton "Tous les départements" (largeur 270px) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                playTapBeep();
                setIsDepartmentsOpen(prev => !prev);
              }}
              className="electro-dept-btn"
            >
              <div className="flex items-center gap-2">
                <Menu className="w-4 h-4 text-white" />
                <span>Tous les départements</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDepartmentsOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Liens de Navigation Horizontale */}
          <div className="hidden lg:flex items-center justify-between flex-1 pl-8 text-xs font-bold tracking-wide uppercase text-slate-700">
            <nav className="flex items-center gap-7">
              <button 
                type="button" 
                onClick={() => {
                  playTapBeep();
                  onNavigate('home');
                }}
                className={`transition cursor-pointer ${
                  currentView === 'home' ? 'text-[#FF6A00] font-black' : 'hover:text-[#FF6A00]'
                }`}
              >
                Accueil
              </button>

              <button 
                type="button" 
                onClick={() => {
                  playTapBeep();
                  onNavigate('shop');
                }}
                className={`transition cursor-pointer flex items-center gap-1 ${
                  currentView === 'shop' ? 'text-[#FF6A00] font-black' : 'hover:text-[#FF6A00]'
                }`}
              >
                <span>Boutique & Filtres</span>
                <span className="text-[10px] bg-orange-100 text-[#FF6A00] px-1.5 py-0.2 rounded-full font-bold">
                  Shop
                </span>
              </button>

              <button 
                type="button" 
                onClick={() => {
                  playTapBeep();
                  onSelectCategory('Tous');
                  onNavigate('shop');
                }}
                className="text-[#FF6A00] flex items-center gap-1 hover:text-[#E05D00] transition cursor-pointer"
              >
                <span>Super Deals</span>
                <ChevronDown className="w-3 h-3 text-[#FF6A00]" />
              </button>

              <button 
                type="button" 
                onClick={() => {
                  playTapBeep();
                  onNavigate('shop');
                }}
                className="hover:text-[#FF6A00] transition cursor-pointer"
              >
                Marques Phares
              </button>

              <button 
                type="button" 
                onClick={() => {
                  playTapBeep();
                  onNavigate('shop');
                }}
                className="hover:text-[#FF6A00] transition cursor-pointer"
              >
                Tendances
              </button>

              <button 
                type="button" 
                onClick={() => {
                  playTapBeep();
                  alert("Bons d'Achat : Code promo & bons de réduction exclusifs Electro Orange.");
                }}
                className="hover:text-[#FF6A00] transition cursor-pointer"
              >
                Bons d'Achat
              </button>
            </nav>

            {/* Mention Livraison gratuite tout à droite */}
            <div className="text-[11px] font-semibold text-slate-500 normal-case tracking-normal">
              {customConfig?.reassurance1Title ? (
                <span>{customConfig.reassurance1Title} {customConfig.reassurance1Desc ? `— ${customConfig.reassurance1Desc}` : ''}</span>
              ) : (
                <>Livraison gratuite dès <strong className="text-slate-800">30 000 F</strong> d'achats</>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
