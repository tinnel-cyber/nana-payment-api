/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Écran d'attente / 404 pour Domaine Personnalisé non associé.
 * Affiché exclusivement lorsqu'un visiteur accède via un domaine client personnalisé
 * qui n'a pas encore été rattaché à une boutique ou campus dans Firestore.
 * Bloque strictement l'accès à la landing page SaaS principale Nanasore.
 */

import React from 'react';
import { Globe, AlertCircle, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react';
import { extractSubdomain } from '../../services/tenantDomainService';
import { PublicDealPageView } from '../funnel/PublicDealPageView';

interface CustomDomainNotFoundScreenProps {
  hostname: string;
  onRetry?: () => void;
  isLoading?: boolean;
}

export const CustomDomainNotFoundScreen: React.FC<CustomDomainNotFoundScreenProps> = ({
  hostname,
  onRetry,
  isLoading = false,
}) => {
  // Sécurité absolue : si un sous-domaine Nanasore est fourni, afficher directement le tunnel !
  const detectedSub = extractSubdomain(hostname || (typeof window !== 'undefined' ? window.location.hostname : ''));
  if (detectedSub) {
    return (
      <PublicDealPageView
        slug={detectedSub}
        onBackToStore={() => {
          if (typeof window !== 'undefined') {
            window.location.href = 'https://nanasore.com';
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#070b14] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none font-sans relative overflow-hidden">
      {/* Halo décoratif d'arrière-plan */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
        
        {/* Icône du domaine */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-indigo-400 shadow-inner">
          <Globe className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse text-indigo-400" />
        </div>

        {/* Titres */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Domaine en attente d'association</span>
          </div>
          
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {hostname}
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Ce nom de domaine personnalisé est correctement relié à notre infrastructure Cloud, mais n'est pas encore associé à un tunnel de vente ou une boutique active.
          </p>
        </div>

        {/* Boîte d'instructions techniques pour le propriétaire */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-left space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Vous êtes le propriétaire de ce domaine ?</span>
          </div>
          <ol className="text-slate-400 space-y-1.5 list-decimal list-inside pl-1 text-[11px] leading-relaxed">
            <li>Connectez-vous à votre tableau de bord marchand sur <a href="https://nanasore.com" className="text-indigo-400 underline font-semibold">nanasore.com</a>.</li>
            <li>Ouvrez le <strong>Funnel Builder</strong> &gt; cliquez sur <strong>Paramètres</strong> (icône engrenage).</li>
            <li>Dans l'onglet <strong>Domaine Personnalisé</strong>, saisissez <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded font-mono">{hostname}</code>.</li>
            <li>Cliquez sur <strong>Enregistrer les Modifications</strong> pour finaliser la liaison immédiate.</li>
          </ol>
          <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
            💡 <em>Note DNS : La propagation CNAME peut nécessiter entre 5 et 30 minutes selon votre registraire (Cloudflare, Namecheap, GoDaddy, Hostinger, OVH...).</em>
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isLoading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-600/30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Vérification en cours...' : 'Actualiser la connexion'}</span>
            </button>
          )}

          <a
            href="https://nanasore.com"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition flex items-center justify-center gap-1.5"
          >
            <span>Accéder à Nanasore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Pied de page discret */}
        <div className="pt-4 border-t border-slate-800/60 text-[10px] text-slate-400">
          SSL Certifié • Résolution CDN Cloud Haute Disponibilité
        </div>
      </div>
    </div>
  );
};
