import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Palette } from "lucide-react";

interface Props {
  children: ReactNode;
  themeId?: string;
  themeName?: string;
  onSwitchTheme?: (fallbackThemeId: string) => void;
  fallbackComponent?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ThemeErrorBoundary - Isolation Totale de Rendu par Thème
 * Empêche le plantage d'un thème spécifique de faire crasher le Studio ou la boutique.
 * Permet de recharger le thème ou de basculer instantanément sur le thème de secours Standard.
 */
export class ThemeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[CRASH THÈME ISOLÉ] - ${this.props.themeName || this.props.themeId || 'Thème'}:`, error, errorInfo);
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: { 
          boundary: 'ThemeErrorBoundary',
          themeId: this.props.themeId || 'unknown'
        },
      });
    }
  }

  public componentDidUpdate(prevProps: Props) {
    // Si l'utilisateur sélectionne un autre thème depuis le sélecteur, on réinitialise l'erreur automatiquement
    if (prevProps.themeId !== this.props.themeId && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleFallback = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onSwitchTheme) {
      this.props.onSwitchTheme('theme-default');
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      const displayThemeName = this.props.themeName || this.props.themeId || "Thème Actif";

      return (
        <div className="w-full min-h-[420px] p-6 sm:p-10 bg-slate-950 text-white flex flex-col items-center justify-center text-center select-none border border-amber-500/30 rounded-3xl m-2 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h3 className="text-base sm:text-lg font-black text-white mb-2">
            Affichage temporairement indisponible : <span className="text-amber-400">{displayThemeName}</span>
          </h3>

          <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            Ce thème a rencontré une anomalie lors du chargement de certains éléments. Le constructeur et les autres fonctionnalités de Nanasore restent 100% opérationnels.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 border border-slate-700 transition active:scale-95 cursor-pointer shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Relancer ce thème</span>
            </button>

            {this.props.onSwitchTheme && (
              <button
                type="button"
                onClick={this.handleFallback}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-600/30 transition active:scale-95 cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Basculer sur le thème Standard Élite</span>
              </button>
            )}
          </div>

          {this.state.error && (
            <div className="mt-6 p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 max-w-lg overflow-x-auto text-left">
              <span className="text-rose-400 font-bold block mb-1">Détail technique isolé :</span>
              {this.state.error.message || String(this.state.error)}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ThemeErrorBoundary;
