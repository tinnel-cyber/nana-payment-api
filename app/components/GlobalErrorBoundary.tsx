import React, { Component, ErrorInfo, ReactNode } from 'react';
import { WifiOff, RefreshCw, Home, AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  isChunkOrPwaError: boolean;
  isOffline: boolean;
  errorMessage: string;
}

/**
 * GlobalErrorBoundary Épuré
 * Rôle unique :
 * 1. Intercepter les crashs globaux d'application (routing racine, réseau coupé).
 * 2. Purger le cache PWA et recharger automatiquement la page en cas d'erreur de Chunk / PWA.
 * 3. Ne plus s'encombrer des petites erreurs d'affichage des composants internes
 *    (désormais isolées par ReelErrorBoundary et FeatureErrorBoundary).
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isChunkOrPwaError: false,
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const message = error?.message || '';
    const isChunkOrPwaError =
      error?.name === 'ChunkLoadError' ||
      message.includes('Loading chunk') ||
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Importing a module script failed') ||
      message.includes('error loading dynamically imported module') ||
      message.includes('Failed to load module script');

    const isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;

    return {
      hasError: true,
      isChunkOrPwaError,
      isOffline,
      errorMessage: message,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CRASH SHIELD RACINE] Crash global intercepté :', error, errorInfo);

    // Détection mise à jour applicative PWA / Déploiement nouveau build
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.message?.includes('error loading dynamically imported module') ||
      error?.message?.includes('Failed to load module script');

    if (isChunkError) {
      this.handlePwaAutoUpdate();
    }
  }

  /**
   * En cas de nouvelle version sur le serveur (erreur chunk PWA),
   * on purge immédiatement le cache PWA et on recharge automatiquement la page.
   */
  private handlePwaAutoUpdate = async () => {
    try {
      const reloadCount = parseInt(sessionStorage.getItem('pwa_chunk_reload_count') || '0', 10);
      if (reloadCount < 2) {
        sessionStorage.setItem('pwa_chunk_reload_count', (reloadCount + 1).toString());

        // Nettoyage de l'ensemble des caches PWA
        if (typeof window !== 'undefined' && 'caches' in window) {
          const cacheKeys = await window.caches.keys();
          await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
        }

        // Dé-enregistrement des Service Workers pour forcer la dernière version
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((reg) => reg.unregister()));
        }

        // Rafraîchissement automatique instantané
        window.location.reload();
      }
    } catch (e) {
      console.warn('[PWA] Erreur lors du rechargement automatique :', e);
    }
  };

  /** Rechargement manuel forcé avec purge des caches PWA */
  private handleHardReload = async () => {
    try {
      if (typeof window !== 'undefined') {
        if ('caches' in window) {
          const keys = await window.caches.keys();
          await Promise.all(keys.map((k) => window.caches.delete(k)));
        }
        if (window.sessionStorage) {
          window.sessionStorage.clear();
        }
      }
    } catch {}
    window.location.reload();
  };

  /** Retour direct à la racine */
  private handleBackToHome = () => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
      }
    } catch {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // 1. Écran de transition PWA (si rechargement de mise à jour en cours)
      if (this.state.isChunkOrPwaError) {
        return (
          <div className="min-h-[100dvh] w-full bg-[#070b14] text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Mise à jour de l'application...</h2>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              Une nouvelle version est disponible. Nous actualisons vos composants en temps réel.
            </p>
            <button
              type="button"
              onClick={this.handleHardReload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Actualiser maintenant
            </button>
          </div>
        );
      }

      // 2. Écran Épuré pour Crash Système / Réseau Coupé
      const isOffline = this.state.isOffline || (typeof navigator !== 'undefined' && !navigator.onLine);

      return (
        <div className="min-h-[100dvh] w-full bg-[#070b14] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
          <div className="w-full max-w-md bg-[#0d1527] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
            
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
              {isOffline ? (
                <WifiOff className="w-8 h-8 text-amber-400 animate-pulse" />
              ) : (
                <AlertCircle className="w-8 h-8 text-blue-400" />
              )}
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-white mb-2">
              {isOffline
                ? 'Connexion réseau interrompue'
                : (this.props.fallbackTitle || 'Service momentanément indisponible')}
            </h1>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {isOffline
                ? 'Vérifiez votre connexion Internet mobile ou Wi-Fi pour continuer.'
                : (this.props.fallbackMessage || "Une interruption système a été détectée. Vos données sont en sécurité.")}
            </p>

            <div className="w-full space-y-3">
              <button
                type="button"
                onClick={this.handleHardReload}
                className="w-full min-h-[46px] bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition cursor-pointer text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Réessayer / Reconnecter</span>
              </button>

              <button
                type="button"
                onClick={this.handleBackToHome}
                className="w-full min-h-[44px] bg-slate-800/80 hover:bg-slate-700 active:scale-[0.98] text-slate-300 font-medium rounded-2xl flex items-center justify-center gap-2 border border-slate-700/60 transition cursor-pointer text-sm"
              >
                <Home className="w-4 h-4" />
                <span>Retour à l'accueil</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
