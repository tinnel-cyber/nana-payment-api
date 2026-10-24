import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ReelErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Erreur isolée dans le composant Reel:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full bg-black/80 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-white/70 text-sm mb-3">Impossible de charger cette vidéo</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-white/10 backdrop-blur-md text-white text-xs rounded-lg border border-white/20 cursor-pointer hover:bg-white/20 transition active:scale-95"
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ReelErrorBoundary;
