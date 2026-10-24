import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  sectionType: string;
  sectionId?: string;
  sectionTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * SectionErrorBoundary - Isolation Module par Module sur la Toile Architect OS
 * Si un module (ex: Bento Hero, Quiz, ou Négociateur IA) rencontre une donnée corrompue,
 * seul ce bloc affiche une carte d'avertissement repliable sans bloquer les autres blocs.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn(`[MODULE ARCHITECT ISOLÉ] Erreur dans le module ${this.props.sectionTitle || this.props.sectionType}:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-4xl mx-auto my-4 p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-white shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">
                  Module temporairement indisponible : <span className="text-amber-400">{this.props.sectionTitle || this.props.sectionType}</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Une anomalie de données a été isolée dans ce bloc. Les autres modules de votre vitrine s'affichent normalement.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={this.handleRetry}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center gap-1.5 border border-slate-700 transition active:scale-95 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
              <span>Réessayer ce bloc</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
