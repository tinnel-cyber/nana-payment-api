import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, ChevronLeft, ChevronDown, Star, LayoutGrid, 
  Grid3X3, List, SlidersHorizontal, Check, RefreshCw, 
  ShoppingBag, ArrowRight, Filter as FilterIcon, X
} from 'lucide-react';
import { StoreProductItem } from '../../components/storeBuilder/types';
import { formatCFA, playTapBeep, playValidationBeep } from '../../utils/audio';
import { getSmartShortDescription } from '../../components/storeBuilder/AdaptiveProductRichText';
import { ElectroProductCard } from './ElectroProductCard';
import { 
  ELECTRO_SMARTWATCH_DUO_SVG, 
  ELECTRO_HEADPHONES_HERO_SVG, 
  ELECTRO_SPEAKER_OVAL_SVG,
  ELECTRO_REVERSIBLE_LAPTOP_SVG,
  ELECTRO_SMARTPHONE_GOLD_SVG,
  ELECTRO_NX_CAMERA_SVG,
  ELECTRO_PRINTER_SVG,
  ELECTRO_XBOX_CONTROLLER_SVG,
  ELECTRO_USB_DRIVE_SVG,
  ELECTRO_VR_HEADSET_SVG
} from './electroOrangeAssets';
import { 
  ELECTRO_SHOWCASE_PRODUCTS, 
  ELECTRO_ADDITIONAL_PRODUCTS,
  SPECIAL_OFFER_DEFAULT 
} from './electroTechData';

interface ElectroCatalogProps {
  products: StoreProductItem[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onSelectProduct: (p: StoreProductItem) => void;
  onAddToCart: (p: StoreProductItem, qty?: number) => void;
  onAddToWishlist?: (p: StoreProductItem) => void;
  onAddToCompare?: (p: StoreProductItem) => void;
  onNavigatePDP: (p: StoreProductItem) => void;
}

const BRAND_LIST = [
  'Adidas', 'New Balance', 'Nike', 'Fred Perry', 
  'The North Face', 'Apple', 'Samsung', 'Sony'
];

const COLOR_LIST = [
  'Black', 'Black Leather', 'Black with Red', 
  'Gold', 'Spacegrey', 'White', 'Silver'
];

export const ElectroCatalog: React.FC<ElectroCatalogProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
  onAddToCart,
  onAddToWishlist,
  onAddToCompare,
  onNavigatePDP
}) => {
  // Mode d'affichage de la grille : 3 colonnes, 4 colonnes, ou liste détaillée
  const [viewMode, setViewMode] = useState<'grid4' | 'grid3' | 'list'>('grid4');

  // Filtres actifs
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [showMoreBrands, setShowMoreBrands] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<number>(350000);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number>(500000);

  // Tri & Pagination
  const [sortBy, setSortBy] = useState<string>('default');
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Index carrousel Produits Recommandés / Récemment Vus
  const [recSlideIndex, setRecSlideIndex] = useState<number>(0);

  // Produits Recommandés / Recently Viewed pour le carrousel du haut
  const recommendedProducts = useMemo(() => {
    return [
      ...ELECTRO_SHOWCASE_PRODUCTS,
      ...ELECTRO_ADDITIONAL_PRODUCTS,
      SPECIAL_OFFER_DEFAULT
    ];
  }, []);

  // Derniers Produits (Latest Products) pour le Bloc 3 de la Sidebar
  const latestSidebarProducts = useMemo(() => {
    return [
      {
        id: 'latest-1',
        name: 'Notebook Black Spire V Nitro VN7-591G',
        category: 'Laptops',
        price: 199900,
        originalPrice: 229900,
        image: ELECTRO_REVERSIBLE_LAPTOP_SVG,
        rating: 4.8
      },
      {
        id: 'latest-2',
        name: 'Smartwatch Watch White Sport Silicone Band',
        category: 'Smartwatches',
        price: 49900,
        originalPrice: 65000,
        image: ELECTRO_SMARTWATCH_DUO_SVG,
        rating: 5.0
      },
      {
        id: 'latest-3',
        name: 'Tablet Thin EliteBook Revolve Multi-Touch',
        category: 'Tablets',
        price: 145000,
        originalPrice: 180000,
        image: ELECTRO_SMARTPHONE_GOLD_SVG,
        rating: 4.7
      },
      {
        id: 'latest-4',
        name: 'Headphones Wireless Solo 2 Rose Gold Hi-Fi',
        category: 'Headphones',
        price: 89000,
        originalPrice: 110000,
        image: ELECTRO_HEADPHONES_HERO_SVG,
        rating: 4.9
      }
    ];
  }, []);

  // Toggle filtre marque
  const toggleBrand = (brand: string) => {
    playTapBeep();
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
    setCurrentPage(1);
  };

  // Toggle filtre couleur
  const toggleColor = (color: string) => {
    playTapBeep();
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
    setCurrentPage(1);
  };

  // Filtrage des produits du catalogue
  const filteredProducts = useMemo(() => {
    let pool = products.length > 0 ? products : [...ELECTRO_SHOWCASE_PRODUCTS, ...ELECTRO_ADDITIONAL_PRODUCTS];

    // Filtrage par catégorie
    if (selectedCategory && selectedCategory !== 'Tous') {
      pool = pool.filter(p => p.category?.toLowerCase().includes(selectedCategory.toLowerCase()));
    }

    // Filtrage par marques
    if (selectedBrands.length > 0) {
      pool = pool.filter(p => selectedBrands.some(b => p.name.toLowerCase().includes(b.toLowerCase())));
    }

    // Filtrage par prix
    pool = pool.filter(p => p.price <= appliedMaxPrice);

    // Tri
    if (sortBy === 'price-low') {
      pool.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      pool.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      pool.sort((a, b) => a.name.localeCompare(b.name));
    }

    return pool;
  }, [products, selectedCategory, selectedBrands, appliedMaxPrice, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 select-none">
      
      {/* =========================================================================
          STRUCTURE PRINCIPALE : LAYOUT 270PX (SIDEBAR GAUCHE) + 1FR (CATALOGUE DROIT)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* =======================================================================
            COLONNE GAUCHE (SIDEBAR DE NAVIGATION & FILTRES - 270PX -> col-span-3)
           ======================================================================= */}
        <aside className="lg:col-span-3 space-y-6">
          
          {/* BLOC 1 (CATÉGORIES) : Encadré intitulé "Parcourir les catégories" avec (56) en gris clair */}
          <div className="bg-white border border-[#EAEAEA] rounded-md overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-[#FAFBFD] border-b border-[#EAEAEA] flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#333E48]">
                Parcourir les catégories
              </h3>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="divide-y divide-slate-100 p-2">
              <button
                type="button"
                onClick={() => {
                  playTapBeep();
                  onSelectCategory('Tous');
                }}
                className={`w-full px-3 py-2 text-xs font-medium rounded flex items-center justify-between transition cursor-pointer ${
                  selectedCategory === 'Tous' || !selectedCategory
                    ? 'bg-orange-50 text-[#FF6A00] font-bold'
                    : 'text-slate-600 hover:text-[#FF6A00] hover:bg-slate-50'
                }`}
              >
                <span>Toutes les catégories</span>
                <span className="text-[11px] text-slate-400 font-mono">(56)</span>
              </button>

              {['Audio & Casques', 'Laptops & Ordinateurs', 'Smartphones & Tablettes', 'Appareils Photo & Caméras', 'Jeux Vidéo & Consoles', 'Montres Connectées'].map((cat, idx) => {
                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                const count = [18, 14, 22, 9, 12, 16][idx] || 10;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      playTapBeep();
                      onSelectCategory(cat);
                    }}
                    className={`w-full px-3 py-2 text-xs font-medium rounded flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-orange-50 text-[#FF6A00] font-bold'
                        : 'text-slate-600 hover:text-[#FF6A00] hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BLOC 2 (FILTRES) : Titre "Filtres" souligné d'une bordure Orange + Marques & Couleurs */}
          <div className="bg-white border border-[#EAEAEA] rounded-md p-5 space-y-6 shadow-2xs">
            
            {/* Titre Filtres avec soulignement jaune/orange */}
            <div className="border-b border-[#EAEAEA] pb-2 relative">
              <h3 className="text-base font-extrabold text-[#333E48] tracking-tight">
                Filtres
              </h3>
              <div className="absolute -bottom-[2px] left-0 w-12 h-[3px] bg-[#FF6A00]" />
            </div>

            {/* Sous-section MARQUES */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Marques
              </h4>
              <div className="space-y-2">
                {(showMoreBrands ? BRAND_LIST : BRAND_LIST.slice(0, 5)).map((brand) => {
                  const isChecked = selectedBrands.includes(brand);
                  return (
                    <label 
                      key={brand}
                      className="flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleBrand(brand)}
                          className="w-4 h-4 text-[#FF6A00] accent-[#FF6A00] rounded cursor-pointer transition"
                        />
                        <span className={isChecked ? 'font-bold text-[#FF6A00]' : ''}>{brand}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">(56)</span>
                    </label>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowMoreBrands(prev => !prev)}
                  className="text-xs font-bold text-[#FF6A00] hover:underline pt-1 flex items-center gap-1 cursor-pointer"
                >
                  <span>{showMoreBrands ? '- Voir moins' : '+ Voir plus'}</span>
                </button>
              </div>
            </div>

            {/* Sous-section COULEURS */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Couleurs
              </h4>
              <div className="space-y-2">
                {COLOR_LIST.map((color) => {
                  const isChecked = selectedColors.includes(color);
                  return (
                    <label 
                      key={color}
                      className="flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleColor(color)}
                          className="w-4 h-4 text-[#FF6A00] accent-[#FF6A00] rounded cursor-pointer transition"
                        />
                        <span className={isChecked ? 'font-bold text-[#FF6A00]' : ''}>{color}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">(56)</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* FILTRE PRIX (RANGE SLIDER) : Jauge et poignées Orange + Texte Prix + Bouton Filtrer */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Prix
              </h4>

              {/* Slider interactif */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="10000"
                  max="500000"
                  step="5000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#FF6A00]"
                />
                <div className="flex items-center justify-between text-[11.5px] text-slate-500 font-semibold">
                  <span>Prix : <strong className="text-slate-800">{formatCFA(0)}</strong> — <strong className="text-[#FF6A00]">{formatCFA(priceRange)}</strong></span>
                </div>
              </div>

              {/* Bouton rectangulaire arrondi Orange Filtrer */}
              <button
                type="button"
                onClick={() => {
                  playValidationBeep();
                  setAppliedMaxPrice(priceRange);
                }}
                className="w-full py-2 px-4 rounded bg-[#FF6A00] hover:bg-[#E05D00] text-white font-extrabold text-xs uppercase tracking-wider transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FilterIcon className="w-3.5 h-3.5" />
                <span>Filtrer</span>
              </button>
            </div>

          </div>

          {/* BLOC 3 (DERNIERS PRODUITS) : Petite liste verticale de 4 mini-cartes horizontales */}
          <div className="bg-white border border-[#EAEAEA] rounded-md p-5 space-y-4 shadow-2xs">
            <div className="border-b border-[#EAEAEA] pb-2 relative">
              <h3 className="text-base font-extrabold text-[#333E48] tracking-tight">
                Derniers Produits
              </h3>
              <div className="absolute -bottom-[2px] left-0 w-12 h-[3px] bg-[#FF6A00]" />
            </div>

            <div className="divide-y divide-slate-100">
              {latestSidebarProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    playTapBeep();
                    onNavigatePDP(p as any);
                  }}
                  className="py-3 flex items-center gap-3 cursor-pointer group"
                >
                  {/* Miniature carrée à gauche */}
                  <div className="w-14 h-14 rounded bg-[#FAFBFD] border border-slate-200 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Titre bleu, étoiles orange et prix à droite */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <h4 className="electro-product-title text-xs line-clamp-1 leading-snug">
                      {p.name}
                    </h4>
                    
                    <div className="flex items-center text-[#FF6A00]">
                      <Star className="w-3 h-3 fill-[#FF6A00]" />
                      <Star className="w-3 h-3 fill-[#FF6A00]" />
                      <Star className="w-3 h-3 fill-[#FF6A00]" />
                      <Star className="w-3 h-3 fill-[#FF6A00]" />
                      <Star className="w-3 h-3 fill-[#FF6A00]" />
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10.5px] text-slate-400 line-through">
                        {formatCFA(p.originalPrice)}
                      </span>
                      <span className="text-xs font-black text-[#E52E04] font-mono">
                        {formatCFA(p.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </aside>

        {/* =======================================================================
            COLONNE DROITE (LE CATALOGUE - col-span-9)
           ======================================================================= */}
        <main className="lg:col-span-9 space-y-6">
          
          {/* CARROUSEL HORIZONTAL "PRODUITS RECOMMANDÉS" / "RECENTLY VIEWED" (Image 1 & 2) */}
          <div className="bg-white border border-[#EAEAEA] rounded-md p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2 relative">
              <div>
                <h3 className="text-lg font-black text-[#333E48] tracking-tight">
                  Recently Viewed & Recommandés
                </h3>
                <div className="absolute -bottom-[2px] left-0 w-16 h-[3px] bg-[#FF6A00]" />
              </div>

              {/* Boutons flèches < > */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    playTapBeep();
                    setRecSlideIndex(prev => Math.max(0, prev - 1));
                  }}
                  disabled={recSlideIndex === 0}
                  className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#FF6A00] hover:border-[#FF6A00] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTapBeep();
                    setRecSlideIndex(prev => Math.min(2, prev + 1));
                  }}
                  disabled={recSlideIndex >= 2}
                  className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#FF6A00] hover:border-[#FF6A00] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grille 4 cartes côte à côte */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recommendedProducts.slice(recSlideIndex * 2, recSlideIndex * 2 + 4).map((item) => (
                <div
                  key={`rec-${item.id}`}
                  onClick={() => {
                    playTapBeep();
                    onNavigatePDP(item);
                  }}
                  className="bg-white border border-slate-100 rounded hover:border-[#FF6A00] p-3 flex flex-col justify-between group cursor-pointer transition"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                      {item.category || 'High-Tech'}
                    </span>
                    <h4 className="electro-product-title text-xs line-clamp-2">
                      {item.name}
                    </h4>
                  </div>

                  <div className="w-full aspect-square my-2 p-2 flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-xs font-black text-[#333E48] font-mono">
                      {formatCFA(item.price)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playValidationBeep();
                        onAddToCart(item, 1);
                      }}
                      className="w-7 h-7 rounded-full bg-orange-50 hover:bg-[#FF6A00] text-[#FF6A00] hover:text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Petits points de pagination Orange en bas */}
            <div className="flex items-center justify-center gap-1.5 pt-2">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    playTapBeep();
                    setRecSlideIndex(idx);
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    recSlideIndex === idx ? 'w-6 bg-[#FF6A00]' : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* BARRE D'OUTILS (TOOLBAR) (Bandeau gris très clair #F8F8F8) */}
          <div className="bg-[#F8F8F8] border border-[#EAEAEA] rounded-md px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Gauche : Icônes de changement de vue (Grille 3, Grille 4, Liste) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playTapBeep();
                  setViewMode('grid3');
                }}
                className={`p-1.5 rounded transition cursor-pointer ${
                  viewMode === 'grid3' ? 'bg-[#FF6A00] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grille 3 colonnes"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapBeep();
                  setViewMode('grid4');
                }}
                className={`p-1.5 rounded transition cursor-pointer ${
                  viewMode === 'grid4' ? 'bg-[#FF6A00] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grille 4 colonnes"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapBeep();
                  setViewMode('list');
                }}
                className={`p-1.5 rounded transition cursor-pointer ${
                  viewMode === 'list' ? 'bg-[#FF6A00] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Liste détaillée"
              >
                <List className="w-4 h-4" />
              </button>

              <span className="text-xs text-slate-500 ml-2 hidden sm:inline">
                Affichage de 1-{Math.min(itemsPerPage, filteredProducts.length)} sur {filteredProducts.length} résultats
              </span>
            </div>

            {/* Droite : Menus déroulants Trier, Afficher 20, Pagination */}
            <div className="flex items-center gap-3 text-xs">
              {/* Trier par défaut */}
              <select
                value={sortBy}
                onChange={(e) => {
                  playTapBeep();
                  setSortBy(e.target.value);
                }}
                className="bg-white border border-[#EAEAEA] rounded px-2.5 py-1 text-slate-700 font-semibold cursor-pointer outline-none"
              >
                <option value="default">Default sorting</option>
                <option value="price-low">Prix croissant</option>
                <option value="price-high">Prix décroissant</option>
                <option value="name">Nom du produit</option>
              </select>

              {/* Afficher 20 */}
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  playTapBeep();
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#EAEAEA] rounded px-2 py-1 text-slate-700 font-semibold cursor-pointer outline-none"
              >
                <option value={12}>Show 12</option>
                <option value={20}>Show 20</option>
                <option value={32}>Show 32</option>
              </select>

              {/* Pagination 1 of 3 -> */}
              <div className="flex items-center gap-1.5 font-bold text-slate-600">
                <span>{currentPage} sur {totalPages}</span>
                <button
                  type="button"
                  onClick={() => {
                    playTapBeep();
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                  }}
                  disabled={currentPage >= totalPages}
                  className="p-1 text-slate-500 hover:text-[#FF6A00] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  →
                </button>
              </div>
            </div>

          </div>

          {/* LA GRILLE DES PRODUITS */}
          {paginatedList.length === 0 ? (
            <div className="bg-white border border-[#EAEAEA] rounded-md p-12 text-center space-y-3">
              <p className="text-sm font-bold text-slate-600">
                Aucun produit ne correspond à vos critères de recherche ou de filtre.
              </p>
              <button
                type="button"
                onClick={() => {
                  playTapBeep();
                  setSelectedBrands([]);
                  setSelectedColors([]);
                  setAppliedMaxPrice(500000);
                  setPriceRange(350000);
                }}
                className="px-4 py-2 rounded-full bg-[#FF6A00] text-white text-xs font-bold uppercase tracking-wider"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* Vue Liste Détaillée */
            <div className="divide-y divide-[#EAEAEA] border border-[#EAEAEA] rounded-md bg-white overflow-hidden">
              {paginatedList.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    playTapBeep();
                    onNavigatePDP(product);
                  }}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-6 hover:bg-slate-50/80 transition cursor-pointer group"
                >
                  <div className="w-36 h-36 aspect-square p-2 bg-white rounded border border-slate-100 flex items-center justify-center shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {product.category || 'High-Tech'}
                    </span>
                    <h3 className="electro-product-title text-base sm:text-lg">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {getSmartShortDescription(product) || "Équipement technologique de haute qualité avec garantie fabricant officielle."}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="text-right">
                      {product.originalPrice && (
                        <span className="text-xs text-slate-400 line-through block">
                          {formatCFA(product.originalPrice)}
                        </span>
                      )}
                      <span className="text-xl font-black text-[#333E48] font-mono">
                        {formatCFA(product.price)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playValidationBeep();
                        onAddToCart(product, 1);
                      }}
                      className="px-4 py-2 rounded-full bg-[#FF6A00] hover:bg-[#E05D00] text-white text-xs font-black uppercase flex items-center gap-1.5 shadow-2xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Ajouter</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Vue Grille (4 Colonnes ou 3 Colonnes) */
            <div className={`grid gap-4 ${
              viewMode === 'grid3' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            }`}>
              {paginatedList.map((product) => (
                <ElectroProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={onNavigatePDP}
                  onAddToCart={onAddToCart}
                  onAddToWishlist={onAddToWishlist}
                  onAddToCompare={onAddToCompare}
                />
              ))}
            </div>
          )}

        </main>

      </div>

    </div>
  );
};
