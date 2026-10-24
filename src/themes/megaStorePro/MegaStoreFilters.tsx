import React from 'react';
import { RotateCcw, Check, ChevronDown, ChevronUp, Tag, SlidersHorizontal } from 'lucide-react';
import { formatCFA, playTapBeep } from '../../utils/audio';

export interface FilterState {
  maxPrice: number;
  selectedBrands: string[];
  selectedColors: string[];
  selectedSizes: string[];
}

interface MegaStoreFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  availableBrands: string[];
  maxPossiblePrice: number;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  totalProductsCount: number;
}

const COLOR_OPTIONS = [
  { id: 'black', name: 'Noir', hex: '#111827' },
  { id: 'white', name: 'Blanc', hex: '#F8FAFC', border: true },
  { id: 'blue', name: 'Bleu', hex: '#2563EB' },
  { id: 'red', name: 'Rouge', hex: '#DC2626' },
  { id: 'green', name: 'Vert', hex: '#16A34A' },
  { id: 'yellow', name: 'Jaune', hex: '#EAB308' },
  { id: 'purple', name: 'Violet', hex: '#9333EA' }
];

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'];

export const MegaStoreFilters: React.FC<MegaStoreFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableBrands,
  maxPossiblePrice,
  categories,
  selectedCategory,
  onSelectCategory,
  totalProductsCount
}) => {
  const hasActiveFilters = 
    filters.maxPrice < maxPossiblePrice || 
    filters.selectedBrands.length > 0 || 
    filters.selectedColors.length > 0 || 
    filters.selectedSizes.length > 0;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      maxPrice: Number(e.target.value)
    });
  };

  const toggleBrand = (brand: string) => {
    playTapBeep();
    const next = filters.selectedBrands.includes(brand)
      ? filters.selectedBrands.filter(b => b !== brand)
      : [...filters.selectedBrands, brand];
    onFilterChange({ ...filters, selectedBrands: next });
  };

  const toggleColor = (colorId: string) => {
    playTapBeep();
    const next = filters.selectedColors.includes(colorId)
      ? filters.selectedColors.filter(c => c !== colorId)
      : [...filters.selectedColors, colorId];
    onFilterChange({ ...filters, selectedColors: next });
  };

  const toggleSize = (size: string) => {
    playTapBeep();
    const next = filters.selectedSizes.includes(size)
      ? filters.selectedSizes.filter(s => s !== size)
      : [...filters.selectedSizes, size];
    onFilterChange({ ...filters, selectedSizes: next });
  };

  return (
    <div className="space-y-6 bg-white border border-[#EBEBEB] rounded p-4 text-xs">
      
      {/* En-tête des Filtres */}
      <div className="flex items-center justify-between border-b border-[#EBEBEB] pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#0056D2]" />
          <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs">
            Filtres Catalogue
          </h3>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              playTapBeep();
              onResetFilters();
            }}
            className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            title="Réinitialiser tous les filtres"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Effacer</span>
          </button>
        )}
      </div>

      {/* 1. Rayons & Catégories */}
      <div className="space-y-2.5">
        <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1">
          Rayons ({categories.length})
        </h4>
        <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
          <button
            type="button"
            onClick={() => {
              playTapBeep();
              onSelectCategory('Tous');
            }}
            className={`w-full text-left py-1 px-2 rounded font-bold transition flex items-center justify-between cursor-pointer ${
              selectedCategory === 'Tous' || !selectedCategory
                ? 'bg-blue-50 text-[#0056D2]'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Tous les rayons</span>
            <span className="text-[10px] text-slate-400 font-normal">{totalProductsCount}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                playTapBeep();
                onSelectCategory(cat);
              }}
              className={`w-full text-left py-1 px-2 rounded font-bold transition flex items-center justify-between cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-50 text-[#0056D2]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Filtre par Prix (Slider CSS Natif) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
            Prix Maximum
          </h4>
          <span className="font-black text-[#0056D2]">
            {formatCFA(filters.maxPrice)}
          </span>
        </div>
        <input
          type="range"
          min={500}
          max={maxPossiblePrice}
          step={500}
          value={filters.maxPrice}
          onChange={handlePriceChange}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0056D2]"
        />
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
          <span>{formatCFA(500)}</span>
          <span>{formatCFA(maxPossiblePrice)}</span>
        </div>
      </div>

      {/* 3. Filtre par Marques (Checkboxes) */}
      {availableBrands.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1">
            Marques
          </h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
            {availableBrands.map((brand) => {
              const isChecked = filters.selectedBrands.includes(brand);
              return (
                <label
                  key={brand}
                  className="flex items-center gap-2 cursor-pointer hover:text-slate-900 text-slate-600 font-medium"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleBrand(brand)}
                    className="w-3.5 h-3.5 rounded text-[#0056D2] border-slate-300 focus:ring-[#0056D2]"
                  />
                  <span className="truncate">{brand}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Filtre par Couleurs (Petits cercles cliquables border-radius: 50%) */}
      <div className="space-y-2.5">
        <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1">
          Couleurs
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          {COLOR_OPTIONS.map((c) => {
            const isSelected = filters.selectedColors.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleColor(c.id)}
                style={{ backgroundColor: c.hex }}
                className={`w-6 h-6 rounded-full cursor-pointer transition transform ${
                  isSelected 
                    ? 'ring-2 ring-offset-2 ring-slate-900 scale-110 shadow-xs' 
                    : 'hover:scale-105 opacity-85'
                } ${c.border ? 'border border-slate-300' : ''}`}
                title={c.name}
                aria-label={c.name}
              />
            );
          })}
        </div>
      </div>

      {/* 5. Filtre par Tailles (Petits carrés cliquables) */}
      <div className="space-y-2.5">
        <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1">
          Tailles
        </h4>
        <div className="flex items-center gap-1.5 flex-wrap">
          {SIZE_OPTIONS.map((size) => {
            const isSelected = filters.selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`w-8 h-8 rounded-xs font-black text-[11px] cursor-pointer transition border ${
                  isSelected
                    ? 'border-slate-950 bg-slate-950 text-white shadow-xs'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
