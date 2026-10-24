import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  /** Titre ou libellé de la métrique (ex: "Chiffre d'affaires", "Inscriptions actives") */
  title: string;
  /** Valeur principale / Chiffre clé (ex: "2 450 000 FCFA", "1 850") */
  value: string | number;
  /** Icône principale de la carte */
  icon?: LucideIcon;
  /** Pourcentage ou valeur de variation (ex: "+18.4%", "-2.1%") */
  change?: string;
  /** Direction de la tendance */
  trend?: 'up' | 'down' | 'neutral';
  /** Texte descriptif ou comparatif secondaire (ex: "vs mois précédent") */
  description?: string;
  /** Données optionnelles pour la courbe SVG sparkline (valeurs numériques) */
  sparklineData?: number[];
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * StatCard — Design System Nanasore (Thème Bleu & Blanc)
 * 
 * Respecte strictement la charte :
 * - Fond blanc pur : `bg-white`
 * - Conteneur avec ombre douce & coins arrondis : `rounded-2xl shadow-sm border border-slate-100 hover:shadow-md`
 * - Chiffre clé en gris ardoise très foncé : `text-slate-900 font-extrabold` (bannit le noir pur)
 * - Textes secondaires & labels : `text-slate-500`
 * - Icône & courbe graphique en Bleu/Indigo Nanasore : `bg-indigo-50 text-indigo-600` / `stroke-indigo-600`
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  trend = 'up',
  description = 'vs mois précédent',
  sparklineData,
  className = '',
}) => {
  // Rendu de la sparkline SVG avec courbe indigo
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const width = 100;
    const height = 32;

    const points = sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg className="w-24 h-8 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="text-indigo-600"
        />
      </svg>
    );
  };

  return (
    <div
      className={`bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      {/* En-tête : Label & Icône Nanasore */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Chiffre Clé (Typographie Slate-900) */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </div>
        {renderSparkline()}
      </div>

      {/* Ligne inférieure : Tendance pastel & Texte secondaire */}
      {(change || description) && (
        <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md ${
                trend === 'up'
                  ? 'bg-emerald-50 text-emerald-700'
                  : trend === 'down'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              {trend === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              <span>{change}</span>
            </span>
          )}
          {description && (
            <span className="text-slate-500 truncate">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
