import React from 'react';
import { ArrowUp, ArrowDown, Settings, Trash2, Eye, EyeOff } from 'lucide-react';
import { playTapBeep } from '../../../utils/audio';

export interface SectionControlBarProps {
  sectionId: string;
  sectionIndex: number;
  totalSections: number;
  isPublicView?: boolean;
  isAdminPreview?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onConfigure?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
  isVisible?: boolean;
}

export const SectionControlBar: React.FC<SectionControlBarProps> = ({
  sectionIndex,
  totalSections,
  isPublicView,
  isAdminPreview,
  onMoveUp,
  onMoveDown,
  onConfigure,
  onDelete,
  onToggleVisibility,
  isVisible = true
}) => {
  // Règle de sécurité stricte : ZÉRO affichage côté acheteur public sur nsore.shop
  if (isPublicView || !isAdminPreview) {
    return null;
  }

  const isFirst = sectionIndex === 0;
  const isLast = sectionIndex === totalSections - 1;

  return (
    <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-2xl text-white select-none opacity-90 hover:opacity-100 transition-opacity">
      <span className="text-[10px] font-black text-blue-400 px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40 font-mono">
        #{sectionIndex + 1}
      </span>

      {/* Monter */}
      <button
        type="button"
        disabled={isFirst}
        onClick={(e) => {
          e.stopPropagation();
          playTapBeep();
          onMoveUp?.();
        }}
        title="Monter cette section"
        className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
          isFirst
            ? 'text-slate-600 cursor-not-allowed'
            : 'text-slate-300 hover:text-white hover:bg-slate-800 active:scale-90'
        }`}
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>

      {/* Descendre */}
      <button
        type="button"
        disabled={isLast}
        onClick={(e) => {
          e.stopPropagation();
          playTapBeep();
          onMoveDown?.();
        }}
        title="Descendre cette section"
        className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
          isLast
            ? 'text-slate-600 cursor-not-allowed'
            : 'text-slate-300 hover:text-white hover:bg-slate-800 active:scale-90'
        }`}
      >
        <ArrowDown className="w-3.5 h-3.5" />
      </button>

      {/* Masquer / Afficher */}
      {onToggleVisibility && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            playTapBeep();
            onToggleVisibility();
          }}
          title={isVisible ? "Masquer temporairement ce bloc" : "Afficher ce bloc"}
          className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
            isVisible
              ? 'text-slate-300 hover:text-white hover:bg-slate-800'
              : 'text-amber-400 bg-amber-950/50 hover:bg-amber-900/50'
          }`}
        >
          {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Configurer */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          playTapBeep();
          onConfigure?.();
        }}
        title="Configurer ce bloc dans le panneau"
        className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-md shadow-blue-900/40 active:scale-95"
      >
        <Settings className="w-3 h-3" />
        <span className="hidden sm:inline">Modifier</span>
      </button>

      {/* Supprimer */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          playTapBeep();
          if (window.confirm("Êtes-vous sûr de vouloir supprimer cette section ?")) {
            onDelete?.();
          }
        }}
        title="Supprimer cette section"
        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 transition cursor-pointer active:scale-90"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
