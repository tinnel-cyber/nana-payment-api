import React from 'react';
import { Loader2, LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante de style (par défaut : primary) */
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  /** Taille du bouton */
  size?: 'sm' | 'md' | 'lg';
  /** État de chargement avec spinner */
  isLoading?: boolean;
  /** Icône facultative affichée à gauche */
  leftIcon?: LucideIcon;
  /** Icône facultative affichée à droite */
  rightIcon?: LucideIcon;
  /** Contenu du bouton */
  children: React.ReactNode;
}

const SIZE_STYLES = {
  sm: 'px-3.5 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-2xl gap-2.5',
};

/**
 * PrimaryButton — Bouton d'action majeur Nanasore
 * 
 * Respecte strictement la charte :
 * - Fond indigo primaire : `bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800`
 * - Ombre douce : `shadow-sm hover:shadow`
 * - Coins arrondis : `rounded-xl`
 * - Anneau d'accessibilité : `focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2`
 */
export const PrimaryButton: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  children,
  className = '',
  disabled,
  ...rest
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        // Bouton principal d'action majeure Nanasore
        return 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm hover:shadow focus-visible:ring-indigo-600';
      case 'secondary':
        // Bouton neutre / secondaire d'annulation
        return 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/60 focus-visible:ring-slate-400';
      case 'outline':
        return 'bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-indigo-600';
      case 'danger':
        return 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm focus-visible:ring-rose-600';
      default:
        return 'bg-indigo-600 text-white hover:bg-indigo-700';
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] ${SIZE_STYLES[size]} ${getVariantStyles()} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : LeftIcon ? (
        <LeftIcon className="w-4 h-4 text-current shrink-0" />
      ) : null}

      <span>{children}</span>

      {!isLoading && RightIcon && (
        <RightIcon className="w-4 h-4 text-current shrink-0" />
      )}
    </button>
  );
};

/**
 * SecondaryButton — Raccourci explicite pour boutons secondaires ou d'annulation
 * Utilise bg-slate-100 text-slate-700 hover:bg-slate-200
 */
export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => {
  return <PrimaryButton variant="secondary" {...props} />;
};

export default PrimaryButton;
