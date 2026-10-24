import React, { useState, useCallback } from 'react';
import { StoreUser, StoreSubscription, UserRole, CompletedSale, InventoryProduct } from '../../types';
import { QuotaWidget } from './QuotaWidget';
import { UpsellOpportunitiesWidget } from './UpsellOpportunitiesWidget';
import { Shield, UserCheck, Sparkles } from 'lucide-react';
import { playTapBeep } from '../../utils/audio';

export interface DashboardQuotaMonitorSwitchProps {
  currentUser?: StoreUser | null;
  subscription?: StoreSubscription | null;
  onOpenUpgrade?: () => void;
  className?: string;
  enableRolePreviewToggle?: boolean; // Permet aux testeurs de basculer facilement entre Gérant et Super Admin
  sales?: CompletedSale[];
  inventory?: InventoryProduct[];
  onNavigate?: (view: any) => void;
}

export const DashboardQuotaMonitorSwitch: React.FC<DashboardQuotaMonitorSwitchProps> = ({
  currentUser,
  subscription,
  onOpenUpgrade,
  className = '',
  enableRolePreviewToggle = false,
  sales = [],
  inventory = [],
  onNavigate
}) => {
  // Rôle réel de l'utilisateur
  const actualRole: UserRole = currentUser?.role || 'TENANT_MANAGER';
  const isSuperAdmin = actualRole === 'SUPER_ADMIN';
  const isTenantManager = actualRole === 'TENANT_MANAGER' || actualRole === 'GERANT' || actualRole === 'ADMIN';

  return (
    <div className={`w-full space-y-2.5 ${className}`}>
      {/* ── Sélecteur / Badge de Rôle SaaS (ZÉRO bouton Super Admin exposé) ── */}
      {enableRolePreviewToggle && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-300">Architecture SaaS Multi-Tenant :</span>
            <span className="text-slate-400 hidden sm:inline">Espace Gérant</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <div className="px-2.5 py-0.5 rounded-md text-[10.5px] font-bold bg-rose-600/30 text-rose-300 border border-rose-500/40 flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              <span>Gérant</span>
            </div>
          </div>
        </div>
      )}

      {/* ── SÉPARATION CONDITIONNELLE STRICTE ── */}
      {isSuperAdmin ? (
        /*
          1. LE DASHBOARD SUPER ADMIN (Le Propriétaire) :
          - Le Super Admin n'a aucune limite : NE LUI AFFICHE JAMAIS LE QUOTAWIDGET.
          - Affiche le tableau de monitoring des Opportunités d'Upsell.
        */
        <UpsellOpportunitiesWidget />
      ) : isTenantManager ? (
        /*
          2. LE DASHBOARD DU GÉRANT (Le Client / Tenant Manager) :
          - Affiche le QuotaWidget avec barres qui passent au rouge et bouton "Passer au Plan Pro".
          - Déclenche la friction commerciale nécessaire à l'upsell automatique.
        */
        <QuotaWidget
          currentUser={currentUser}
          subscription={subscription}
          onOpenUpgrade={onOpenUpgrade}
          sales={sales}
          inventory={inventory}
          onNavigate={onNavigate}
        />
      ) : (
        /* Fallback de sécurité : QuotaWidget par défaut pour tout utilisateur commercial */
        <QuotaWidget
          currentUser={currentUser}
          subscription={subscription}
          onOpenUpgrade={onOpenUpgrade}
          sales={sales}
          inventory={inventory}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};

export default DashboardQuotaMonitorSwitch;
