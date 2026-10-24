import React from 'react';
import { LucideIcon, Clock, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export type StatusVariant = 'warning' | 'success' | 'info' | 'neutral' | 'danger';

export interface StatusBadgeProps {
  /** Variante pastel */
  variant?: StatusVariant;
  /** Texte du statut */
  children: React.ReactNode;
  /** Icône optionnelle */
  icon?: LucideIcon;
  /** Classes CSS additionnelles */
  className?: string;
}

const VARIANT_STYLES: Record<StatusVariant, { badge: string; defaultIcon: LucideIcon }> = {
  // Statuts d'attente (ex: KYC en attente)
  warning: {
    badge: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    defaultIcon: Clock,
  },
  // Statuts de validation réussie
  success: {
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    defaultIcon: CheckCircle2,
  },
  // Statuts d'information neutre
  info: {
    badge: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    defaultIcon: AlertCircle,
  },
  // Statuts neutres ou inactifs
  neutral: {
    badge: 'bg-slate-100 text-slate-700 border border-slate-200/60',
    defaultIcon: AlertCircle,
  },
  // Statuts d'alerte ou rejet
  danger: {
    badge: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    defaultIcon: ShieldAlert,
  },
};

/**
 * StatusBadge — Design System Nanasore
 * 
 * Couleurs pastel claires pour tous les états de statut :
 * - KYC en attente : `bg-amber-50 text-amber-700` ou `bg-yellow-50 text-yellow-700`
 * - Succès : `bg-emerald-50 text-emerald-700`
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = 'warning',
  children,
  icon,
  className = '',
}) => {
  const config = VARIANT_STYLES[variant] || VARIANT_STYLES.warning;
  const IconComponent = icon || config.defaultIcon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold select-none ${config.badge} ${className}`}
    >
      <IconComponent className="w-3.5 h-3.5 shrink-0" />
      <span>{children}</span>
    </span>
  );
};

export default StatusBadge;
