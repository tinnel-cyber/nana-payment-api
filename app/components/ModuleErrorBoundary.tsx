import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  moduleName: string; // Ex: "POS - Caisse", "Stock - Inventaire", "Twilio SMS", "CinetPay"
  fallbackComponent?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ModuleErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[CRASH MODULE ISOLÉ] - ${this.props.moduleName}:`, error, errorInfo);
    // Optionnel : Envoyer l'alerte ciblée à Sentry avec le tag du module
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: { module: this.props.moduleName },
      });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <div className="p-4 my-2 bg-slate-900/90 border border-amber-500/30 rounded-xl text-left backdrop-blur-md shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-amber-400 text-lg">⚠️</span>
            <h4 className="text-sm font-semibold text-slate-200">
              Module indisponible : <span className="text-amber-400">{this.props.moduleName}</span>
            </h4>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Une erreur est survenue dans ce sous-module. Les autres fonctionnalités de Nanasore restent opérationnelles.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            🔄 Relancer ce module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ModuleErrorBoundary;
