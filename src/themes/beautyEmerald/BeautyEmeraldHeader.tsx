import React, { useState, useEffect } from 'react';
import { Search, User, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react';
import { StoreConfig } from '../../components/storeBuilder/types';
import { ThemeCustomizationConfig } from '../../types';
import { playTapBeep } from '../../utils/audio';

interface BeautyEmeraldHeaderProps {
  storeConfig: StoreConfig;
  customConfig?: ThemeCustomizationConfig;
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenSearch?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSelectCategory?: (category: string) => void;
  selectedCategory?: string;
  categories?: string[];
}

interface NavLinkItem {
  id: string;
  label: string;
  badge?: {
    text: string;
    type: 'new' | 'sale' | 'hot';
  };
  categoryMatch?: string;
}

export const BeautyEmeraldHeader: React.FC<BeautyEmeraldHeaderProps> = ({
  storeConfig,
  customConfig,
  cartCount = 0,
  onOpenCart,
  onOpenSearch,
  searchQuery = '',
  onSearchChange,
  onSelectCategory,
  selectedCategory = 'Tous les produits',
  categories = []
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Détection du scroll pour ajouter une légère ombre douce
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const storeName = customConfig?.storeName || storeConfig?.storeName || storeConfig?.name || 'Glow';
  const logoUrl = customConfig?.logoUrl || storeConfig?.logoUrl || storeConfig?.logo_url;
  const announcementEnabled = customConfig?.announcementBarEnabled ?? true;
  const announcementText = customConfig?.announcementBarText;

  // Liens de navigation signature inspirés des maquettes avec micro-badges
  const defaultNavItems: NavLinkItem[] = [
    {
      id: 'home',
      label: storeName,
      badge: { text: 'NEW', type: 'new' },
      categoryMatch: 'Tous les produits'
    },
    {
      id: 'skincare',
      label: 'Soins Visage',
      categoryMatch: 'Soins Visage'
    },
    {
      id: 'serums',
      label: 'Sérums & Huiles',
      badge: { text: 'NEW', type: 'new' },
      categoryMatch: 'Sérums'
    },
    {
      id: 'body',
      label: 'Corps & Bain',
      badge: { text: 'SALE', type: 'sale' },
      categoryMatch: 'Corps'
    },
    {
      id: 'parfums',
      label: 'Parfumerie',
      categoryMatch: 'Parfums'
    },
    {
      id: 'bestsellers',
      label: 'Best-Sellers',
      badge: { text: 'HOT', type: 'hot' },
      categoryMatch: 'Nouveautés'
    }
  ];

  const navItems: NavLinkItem[] = customConfig?.navLinks && customConfig.navLinks.length > 0
    ? customConfig.navLinks.map((lnk, idx) => ({
        id: `nav-${idx}`,
        label: lnk.label,
        categoryMatch: lnk.category || lnk.label
      }))
    : defaultNavItems;

  const handleNavClick = (item: NavLinkItem) => {
    playTapBeep();
    if (item.categoryMatch && onSelectCategory) {
      onSelectCategory(item.categoryMatch);
    }
    setIsMobileMenuOpen(false);
  };

  const handleToggleSearch = () => {
    playTapBeep();
    setIsSearchOpen(prev => !prev);
    if (onOpenSearch) onOpenSearch();
  };

  return (
    <>
      {announcementEnabled && announcementText && (
        <div
          className="w-full py-2 px-4 text-center text-[11px] font-['Outfit'] font-bold tracking-wider uppercase text-white"
          style={{ backgroundColor: customConfig?.primaryAccentColor || '#0F4C3A' }}
        >
          {announcementText}
        </div>
      )}
      <header
        className={`beauty-emerald-header ${isScrolled ? 'scrolled' : ''}`}
        style={customConfig?.headerBgColor ? { backgroundColor: customConfig.headerBgColor } : undefined}
      >
        <div className="max-w-[1360px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* ================= GAUCHE : Logo Syne 800 avec point Or Champagne ================= */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              type="button" 
              onClick={() => handleNavClick(navItems[0])}
              className="beauty-emerald-logo text-left group cursor-pointer border-none bg-transparent p-0 flex items-center gap-2.5"
              title={`${storeName} - ${customConfig?.storeTagline || 'Cosmétiques & Soins'}`}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="h-10 w-auto max-w-[140px] object-contain" />
              ) : (
                <>
                  <span>{storeName}</span>
                  <span className="beauty-emerald-logo-dot">.</span>
                </>
              )}
            </button>
          </div>

        {/* ================= CENTRE : Menu horizontal espacé avec micro-badges ================= */}
        <nav className="hidden lg:flex items-center justify-center flex-1" aria-label="Navigation principale">
          <ul className="beauty-emerald-nav-list">
            {navItems.map((item) => {
              const isSelected = selectedCategory === item.categoryMatch;
              
              return (
                <li key={item.id} className="beauty-emerald-nav-item">
                  {/* Micro-Badge Flottant avec flèche CSS en triangle */}
                  {item.badge && (
                    <span 
                      className={`emerald-micro-badge ${
                        item.badge.type === 'new' 
                          ? 'emerald-micro-badge-new' 
                          : item.badge.type === 'sale' 
                          ? 'emerald-micro-badge-sale' 
                          : 'emerald-micro-badge-hot'
                      }`}
                    >
                      {item.badge.text}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleNavClick(item)}
                    className={`beauty-emerald-nav-link ${isSelected ? 'active' : ''}`}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ================= DROITE : 3 Icônes SVG au trait fin (stroke-width: 1.5px) ================= */}
        <div className="beauty-emerald-actions shrink-0">
          
          {/* 1. Recherche (Loupe) */}
          <button
            type="button"
            onClick={handleToggleSearch}
            className="beauty-emerald-icon-btn"
            aria-label="Rechercher un produit cosmétique"
            title="Rechercher un soin"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* 2. Compte (Utilisateur) */}
          <button
            type="button"
            onClick={() => playTapBeep()}
            className="beauty-emerald-icon-btn hidden sm:flex"
            aria-label="Mon compte client"
            title="Espace membre"
          >
            <User className="w-5 h-5" />
          </button>

          {/* 3. Panier avec badge rond Émeraude #0F4C3A */}
          <button
            type="button"
            onClick={() => {
              playTapBeep();
              if (onOpenCart) onOpenCart();
            }}
            className="beauty-emerald-icon-btn"
            aria-label={`Panier (${cartCount} article${cartCount > 1 ? 's' : ''})`}
            title="Voir mon panier"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="beauty-emerald-cart-badge animate-in zoom-in-50 duration-200">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => {
              playTapBeep();
              setIsMobileMenuOpen(prev => !prev);
            }}
            className="beauty-emerald-icon-btn lg:hidden ml-1"
            aria-label="Ouvrir le menu mobile"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Barre de Recherche déroulante intégrée */}
      {isSearchOpen && (
        <div className="border-t border-slate-100 bg-[#FFFFFF] px-4 py-3 shadow-md animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-[800px] mx-auto flex items-center gap-3">
            <Search className="w-5 h-5 text-[#0F4C3A] shrink-0" strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Rechercher un sérum, crème hydratante, nettoyant visage..."
              className="flex-1 bg-transparent border-none outline-none text-[#111C18] text-sm font-medium placeholder:text-slate-400 font-['Outfit']"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange && onSearchChange('')}
                className="text-xs uppercase tracking-wider text-slate-400 hover:text-[#0F4C3A] font-bold"
              >
                Effacer
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="p-1 text-slate-500 hover:text-[#111C18]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tiroir Mobile Slide-out */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[85px] bg-[#111C18]/60 backdrop-blur-sm z-40 animate-in fade-in duration-200">
          <div className="w-[85%] max-w-sm h-full bg-[#FFFFFF] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
                <span className="beauty-emerald-logo text-xl">
                  {storeName}<span className="beauty-emerald-logo-dot">.</span>
                </span>
                <span className="text-xs uppercase font-bold tracking-widest text-[#C59B27] truncate max-w-[140px]">
                  {customConfig?.storeTagline || 'Haute Cosmétique'}
                </span>
              </div>

              <ul className="space-y-4">
                {navItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleNavClick(item)}
                      className="text-base font-medium text-[#111C18] hover:text-[#0F4C3A] font-['Outfit'] flex items-center gap-2"
                    >
                      {item.label}
                    </button>
                    {item.badge && (
                      <span 
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded text-white ${
                          item.badge.type === 'new' 
                            ? 'bg-[#0F4C3A]' 
                            : item.badge.type === 'sale' 
                            ? 'bg-[#C59B27]' 
                            : 'bg-[#D9381E]'
                        }`}
                      >
                        {item.badge.text}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-2">
              <div className="flex items-center justify-between">
                <span>Devise</span>
                <span className="font-bold text-[#111C18]">FCFA (XOF)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Langue</span>
                <span className="font-bold text-[#111C18]">Français</span>
              </div>
            </div>
          </div>
        </div>
      )}
      </header>
    </>
  );
};
