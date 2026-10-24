import React from 'react';
import { CentralHubOmnibar } from './CentralHubOmnibar';

export const Header = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      
      {/* NOM D'ENTREPRISE CORRIGÉ (ALIGNÉ EN HORIZONTAL) */}
      <div className="flex items-center gap-3 min-w-0 pr-4">
        <div className="w-8 h-8 rounded-lg bg-[#4169E1] text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
          KP
        </div>
        <span className="text-sm font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">
          ENTREPRISE KONKOBO POUSBILA TELECOM
        </span>
      </div>

      {/* BARRE STATIQUE CENTRALE */}
      <div className="flex-1 max-w-2xl px-4">
        <CentralHubOmnibar/>
      </div>

      {/* DROITE : COMPTEUR / PROFIL SEULEMENT (PARAMÈTRES SUPPRIMÉS DU HEADER) */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
          ● Caisse Ouverte
        </span>
      </div>

    </header>
  );
};

export default Header;
