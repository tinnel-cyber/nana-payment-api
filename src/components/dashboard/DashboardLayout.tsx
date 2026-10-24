import React from 'react';
import { Header } from '../Header';
import { AppSidebar } from '../common/AppSidebar';

export interface DashboardLayoutProps {
  children?: React.ReactNode;
  currentUser?: any;
  subscription?: any;
  currentView?: string;
  onNavigate?: (view: string) => void;
  isStoreOpen?: boolean;
}

// Structure du conteneur de page principale
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children,
  currentUser,
  subscription,
  currentView = 'MASTER_HUB',
  onNavigate = () => {},
  isStoreOpen = true
}) => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 flex font-sans">
      
      {/* Sidebar Latérale */}
      <aside className="w-64 bg-[#111827] text-white border-r border-slate-800 shrink-0 hidden md:flex flex-col">
        <AppSidebar
          currentUser={currentUser}
          subscription={subscription}
          currentView={currentView}
          isStoreOpen={isStoreOpen}
          onNavigate={onNavigate}
          className="w-full h-full"
        />
      </aside>

      {/* Zone de Contenu Principale */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header contenant l'Omnibar & Identité Entreprise */}
        <Header />

        {/* Corps de Page avec le Fond Blanc Cassé Original */}
        <main className="flex-1 p-6 bg-[#F8F9FA] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
