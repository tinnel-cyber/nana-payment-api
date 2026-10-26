/**
 * ==============================================================================
 * APPLICATION MODULAIRE : NANASWITCH CLOUD (PARTENAIRES AGRÉGÉS & MARCHANDS B2B)
 * ENTITÉ : NANASORE TECHNOLOGIES
 * CHARTE GRAPHIQUE : Bleu Royal (#1E40AF / #2563EB) & Blanc Cassé / Ardoise (#F8FAFC)
 * ==============================================================================
 * 
 * Ce composant autonome est intégrable via n'importe quel slug d'installation :
 * - Route slug native : /app/nanaswitch, /dashboard/nanaswitch, /nana-switch-app
 * - Composant Racine Réutilisable : <NanaSwitchApp slug="nanaswitch" />
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, Link2, 
  ShoppingCart, Users, BarChart3, Building2, UserCheck, ShieldCheck, 
  Key, Radio, History, AlertTriangle, Percent, HelpCircle, Settings, 
  Plus, CheckCircle2, Clock, XCircle, Search, Copy, Check, Eye, EyeOff, 
  ExternalLink, FileText, ChevronRight, LogOut, RefreshCw, Filter, Download,
  Send, ShieldAlert, BookOpen, Layers, Lock, Sparkles, AlertCircle, Upload, FileCheck, ArrowLeft,
  ChevronDown, PhoneCall, Code2, Globe2, Server
} from 'lucide-react';
import { DeveloperTab } from '../dashboard/DeveloperTab';
import { KycVolumeLimitCard } from '../dashboard/KycVolumeLimitCard';
import { db, auth } from '../../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';

export interface NanaSwitchAppProps {
  slug?: string;
  appId?: string;
  embedded?: boolean;
  onBack?: () => void;
  initialTab?: string;
  initialAppId?: string;
  className?: string;
}

export interface AppBalances {
  XOF: number;
  USD: number;
  XAF: number;
  GNF: number;
  GHS: number;
  [key: string]: number;
}

export interface AppKeys {
  pk: string;
  skHash: string;
  rawSk?: string;
  whSecret: string;
}

export interface AppKycData {
  companyName?: string;
  fullName?: string;
  rccm?: string;
  ifu?: string;
  ifuCompany?: string;
  ifuPersonal?: string;
  cnib?: string;
  cnibNumber?: string;
  manager?: string;
  managerName?: string;
  bankRib?: string;
  residence?: string;
  phone?: string;
  sector?: string;
  website?: string;
  description?: string;
  contractSigned?: boolean;
}

export interface MerchantCustomCredentials {
  saspay?: {
    api_key?: string;
  };
  sebpay?: {
    public_key?: string;
    secret_key?: string;
  };
}

export interface MerchantIntegrationConfig {
  mode: 'AGREGATED' | 'BYOK';
  custom_credentials?: MerchantCustomCredentials;
}

export interface MerchantApiPricingConfig {
  cost_per_request_xof: number;
  api_credits_balance: number;
  low_balance_threshold?: number;
  auto_block_on_zero?: boolean;
}

export interface NanaMerchantApp {
  id: string;
  name: string;
  sector: string;
  type: 'entreprise' | 'particulier';
  status: 'VERIFIED' | 'PENDING_KYC' | 'REJECTED';
  createdAt: string;
  balances: AppBalances;
  keys?: AppKeys;
  kyc: AppKycData;
  webhook_config?: {
    url: string | null;
    secret_key: string;
    is_active: boolean;
  };
  integration_mode?: 'AGREGATED' | 'BYOK';
  integration_config?: MerchantIntegrationConfig;
  custom_credentials?: MerchantCustomCredentials;
  api_credits_balance?: number;
  api_pricing_config?: MerchantApiPricingConfig;
  monthly_usage?: {
    month: string;
    volume_xof: number;
    transaction_count?: number;
    last_updated?: string;
  };
  kyc_limits?: {
    tier: 'INDIVIDUAL' | 'ENTERPRISE';
    max_monthly_volume_xof: number;
    description: string;
  };
  custom_monthly_limit_xof?: number;
}

export interface TransactionItem {
  id: string;
  amount: number;
  currency: string;
  operator: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  customer: string;
  date: string;
  fee: number;
  net: number;
}

export interface WebhookDeliveryLog {
  id: string;
  event: string;
  url: string;
  status: number | string;
  latency: string;
  date: string;
}

// Backend Node.js API base resolution
const PAYMENT_API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:10000'
  : 'https://nana-payment-api.onrender.com';

// --- INITIAL MOCK / SEED DATA ---
const INITIAL_APPS: NanaMerchantApp[] = [
  {
    id: 'app_nana_01',
    name: 'NanaApp Store',
    sector: 'E-commerce & Vente en ligne',
    type: 'entreprise',
    status: 'VERIFIED',
    createdAt: '2026-03-15',
    balances: {
      XOF: 1450000,
      USD: 2450,
      XAF: 890000,
      GNF: 12000000,
      GHS: 14200
    },
    keys: {
      pk: 'ns_live_pk_8f93a2e1c4b70129a007b',
      skHash: '$2a$10$e89abF...hidden',
      whSecret: 'ns_whsec_9f4e30815fb4aae712061aba45ed8ba8430b31d3b9c4bbf14dfb264ee2a165d2'
    },
    webhook_config: {
      url: 'https://boutique-client.com/api/nanaswitch-webhook',
      secret_key: 'ns_whsec_9f4e30815fb4aae712061aba45ed8ba8430b31d3b9c4bbf14dfb264ee2a165d2',
      is_active: true
    },
    kyc: {
      companyName: 'NANASORE TECH SARL',
      rccm: 'BF-OUA-01-2026-B12-09431',
      ifu: '001928473610L',
      manager: 'Ousmane Konkobo',
      bankRib: 'BF061 01001 012345678901 22'
    },
    monthly_usage: {
      month: '2026-10',
      volume_xof: 3850000,
      transaction_count: 42
    },
    kyc_limits: {
      tier: 'ENTERPRISE',
      max_monthly_volume_xof: 5000000,
      description: 'Compte Entreprise Enregistrée'
    }
  },
  {
    id: 'app_nana_02',
    name: 'Boutique Koudougou',
    sector: 'Commerce Général',
    type: 'particulier',
    status: 'PENDING_KYC',
    createdAt: '2026-10-24',
    balances: { XOF: 0, USD: 0, XAF: 0, GNF: 0, GHS: 0 },
    kyc: {
      fullName: 'Konkobo Rasmané',
      cnib: 'B12940291',
      ifu: '00098471201P',
      residence: 'Koudougou, Secteur 3'
    },
    monthly_usage: {
      month: '2026-10',
      volume_xof: 850000,
      transaction_count: 19
    },
    kyc_limits: {
      tier: 'INDIVIDUAL',
      max_monthly_volume_xof: 1000000,
      description: 'Compte Particulier / Indépendant'
    }
  }
];

const MOCK_TRANSACTIONS: TransactionItem[] = [
  { id: 'tx_9841', amount: 15000, currency: 'XOF', operator: 'Orange Money BF', status: 'SUCCESS', customer: '+226 70 12 34 56', date: '2026-10-26 18:45', fee: 900, net: 14100 },
  { id: 'tx_9840', amount: 25000, currency: 'XOF', operator: 'Moov Money BF', status: 'SUCCESS', customer: '+226 65 89 00 11', date: '2026-10-26 17:12', fee: 1500, net: 23500 },
  { id: 'tx_9839', amount: 5000, currency: 'XOF', operator: 'Wave CI', status: 'FAILED', customer: '+225 07 44 22 11', date: '2026-10-26 16:30', fee: 0, net: 0 },
  { id: 'tx_9838', amount: 50000, currency: 'XOF', operator: 'MTN CI', status: 'SUCCESS', customer: '+225 05 99 88 77', date: '2026-10-26 14:05', fee: 3000, net: 47000 },
  { id: 'tx_9837', amount: 12000, currency: 'XOF', operator: 'Orange Money BF', status: 'SUCCESS', customer: '+226 76 55 44 33', date: '2026-10-26 11:20', fee: 720, net: 11280 }
];

const PRICING_RULES = [
  { country: 'Burkina Faso 🇧🇫', operator: 'Orange Money BF', baseRate: '4.5%', margin: '+1.5%', totalFee: '6.0%', minFee: '12 XOF' },
  { country: 'Burkina Faso 🇧🇫', operator: 'Moov Africa BF', baseRate: '4.0%', margin: '+1.5%', totalFee: '5.5%', minFee: '10 XOF' },
  { country: 'Côte d\'Ivoire 🇨🇮', operator: 'Wave CI', baseRate: '1.0%', margin: '+1.5%', totalFee: '2.5%', minFee: '25 XOF' },
  { country: 'Côte d\'Ivoire 🇨🇮', operator: 'MTN Mobile Money', baseRate: '3.5%', margin: '+1.5%', totalFee: '5.0%', minFee: '15 XOF' },
  { country: 'Sénégal 🇸🇳', operator: 'Free Money SN', baseRate: '3.0%', margin: '+1.5%', totalFee: '4.5%', minFee: '20 XOF' },
  { country: 'Bénin 🇧🇯', operator: 'Celtiis Cash', baseRate: '3.2%', margin: '+1.5%', totalFee: '4.7%', minFee: '15 XOF' },
];

export const NanaSwitchApp: React.FC<NanaSwitchAppProps> = ({
  slug = 'nanaswitch',
  appId,
  embedded = false,
  onBack,
  initialTab = 'dashboard',
  initialAppId,
  className = ''
}) => {
  // State management
  const [apps, setApps] = useState<NanaMerchantApp[]>(INITIAL_APPS);
  const [selectedApp, setSelectedApp] = useState<NanaMerchantApp | null>(null);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showDocPortal, setShowDocPortal] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // KYC Form State
  const [kycForm, setKycForm] = useState({
    type: 'entreprise' as 'entreprise' | 'particulier',
    appName: '',
    sector: 'E-commerce',
    website: '',
    description: '',
    fullName: '',
    cnibNumber: '',
    ifuPersonal: '',
    phone: '',
    companyName: '',
    rccm: '',
    ifuCompany: '',
    managerName: '',
    bankRib: '',
    contractSigned: false
  });

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleUpdateApp = useCallback((updated: NanaMerchantApp) => {
    setSelectedApp(updated);
    setApps(prev => prev.map(a => a.id === updated.id ? updated : a));
  }, []);

  const copyToClipboard = useCallback((text?: string, label?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (label) {
      setCopiedKey(label);
      showToast(`${label} copié dans le presse-papier !`);
      setTimeout(() => setCopiedKey(''), 2000);
    }
  }, [showToast]);

  // Synchronisation avec Firestore au chargement
  useEffect(() => {
    let isMounted = true;
    async function loadFirestoreApps() {
      if (!db) return;
      setIsSyncing(true);
      try {
        const merchantsRef = collection(db, 'merchants');
        const snap = await getDocs(query(merchantsRef, limit(20)));
        if (!snap.empty && isMounted) {
          const loaded: NanaMerchantApp[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            loaded.push({
              id: docSnap.id,
              name: data.business_name || data.name || 'Application Marchand',
              sector: data.sector || 'Commerce Général & Services',
              type: data.account_type === 'INTERNAL' || data.account_type === 'AGREGATED' ? 'entreprise' : (data.type || 'entreprise'),
              status: data.status === 'ACTIVE' || data.status === 'VERIFIED' ? 'VERIFIED' : (data.status || 'PENDING_KYC'),
              createdAt: data.created_at ? String(data.created_at).slice(0, 10) : '2026-10-26',
              balances: {
                XOF: data.financials?.wallet_balance_xof ?? 1450000,
                USD: 0,
                XAF: 0,
                GNF: 0,
                GHS: 0
              },
              keys: data.nanaswitch_keys ? {
                pk: data.nanaswitch_keys.public_key,
                skHash: data.nanaswitch_keys.secret_key_hash || '$2a$10$...hidden',
                whSecret: data.webhook_config?.secret_key || 'ns_whsec_master_2026'
              } : undefined,
              webhook_config: data.webhook_config,
              integration_mode: data.integration_config?.mode || data.integration_mode || 'AGREGATED',
              integration_config: data.integration_config || {
                mode: data.integration_mode || 'AGREGATED',
                custom_credentials: data.custom_credentials || {}
              },
              custom_credentials: data.integration_config?.custom_credentials || data.custom_credentials || {},
              api_credits_balance: data.api_pricing_config?.api_credits_balance ?? data.switch_wallets?.api_credits_balance ?? 5000,
              api_pricing_config: data.api_pricing_config || {
                cost_per_request_xof: 0.02,
                api_credits_balance: 5000,
                low_balance_threshold: 500
              },
              monthly_usage: data.monthly_usage || {
                month: '2026-10',
                volume_xof: data.type === 'particulier' ? 850000 : 3850000,
                transaction_count: 24
              },
              kyc_limits: {
                tier: data.type === 'particulier' ? 'INDIVIDUAL' : 'ENTERPRISE',
                max_monthly_volume_xof: data.custom_monthly_limit_xof || (data.type === 'particulier' ? 1000000 : 5000000),
                description: data.type === 'particulier' ? 'Compte Particulier / Indépendant' : 'Compte Entreprise Enregistrée'
              },
              custom_monthly_limit_xof: data.custom_monthly_limit_xof,
              kyc: {
                companyName: data.business_name,
                rccm: data.rccm,
                ifu: data.ifu,
                fullName: data.business_name
              }
            });
          });

          if (loaded.length > 0) {
            // Fusionne avec les mock apps si non présentes
            setApps(prev => {
              const ids = new Set(loaded.map(a => a.id));
              const remaining = prev.filter(p => !ids.has(p.id));
              return [...loaded, ...remaining];
            });
          }
        }
      } catch (err) {
        console.warn('[NANASWITCH APP] Synchronisation Firestore silencieuse :', (err as Error).message);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    }

    loadFirestoreApps();

    return () => {
      isMounted = false;
    };
  }, []);

  // Détection du target appId initial si passé via prop
  useEffect(() => {
    const target = appId || initialAppId;
    if (target) {
      const match = apps.find(a => a.id === target);
      if (match && match.status === 'VERIFIED') {
        setSelectedApp(match);
      }
    }
  }, [appId, initialAppId, apps]);

  // Soumission d'une nouvelle application (avec persistance Firestore)
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `app_nana_${Date.now().toString().slice(-4)}`;
    const newApp: NanaMerchantApp = {
      id: newId,
      name: kycForm.appName || 'Nouvelle Application',
      sector: kycForm.sector,
      type: kycForm.type,
      status: 'PENDING_KYC',
      createdAt: new Date().toISOString().split('T')[0],
      balances: { XOF: 0, USD: 0, XAF: 0, GNF: 0, GHS: 0 },
      kyc: { ...kycForm }
    };

    setApps([newApp, ...apps]);
    setIsKycModalOpen(false);
    showToast('Dossier KYC soumis avec succès ! En attente de validation Super Admin.', 'success');

    // Sauvegarde asynchrone dans Firestore si disponible
    if (db) {
      try {
        await setDoc(doc(db, 'merchants', newId), {
          merchant_id: newId,
          business_name: kycForm.type === 'entreprise' ? (kycForm.companyName || kycForm.appName) : (kycForm.fullName || kycForm.appName),
          rccm: kycForm.rccm || null,
          ifu: kycForm.type === 'entreprise' ? kycForm.ifuCompany : kycForm.ifuPersonal,
          account_type: 'EXTERNAL_BYOK',
          type: kycForm.type,
          sector: kycForm.sector,
          status: 'PENDING_VERIFICATION',
          storeApprovalStatus: 'PENDING',
          created_at: new Date().toISOString(),
          kyc_payload: kycForm
        }, { merge: true });
      } catch (fbErr) {
        console.warn('[NANASWITCH FIRESTORE SAVE]', (fbErr as Error).message);
      }
    }
  };

  // Décision Super Admin (Approuver ou Rejeter avec génération cryptographique de clés réelles)
  const handleAdminDecision = async (targetAppId: string, status: 'VERIFIED' | 'REJECTED') => {
    let generatedKeys: AppKeys | null = null;

    if (status === 'VERIFIED') {
      try {
        // 1. Tente d'appeler le backend Node.js Render / localhost
        const resp = await fetch(`${PAYMENT_API_BASE}/v1/switch/keys/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId: targetAppId, mode: 'live' })
        });
        if (resp.ok) {
          const keyData = await resp.json();
          generatedKeys = {
            pk: keyData.public_key,
            skHash: '$2a$10$...bcrypt_protected',
            rawSk: keyData.secret_key,
            whSecret: keyData.webhook_secret || keyData.webhook_config?.secret_key
          };
        }
      } catch (apiErr) {
        console.warn('[BACKEND KEYS CALL FALLBACK]', (apiErr as Error).message);
      }

      // Fallback local Zero-Trust si backend hors-ligne
      if (!generatedKeys) {
        const randHex = (bytes: number) => Array.from({ length: bytes }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        generatedKeys = {
          pk: `ns_live_pk_${randHex(16)}`,
          skHash: `$2a$10$${randHex(20)}`,
          rawSk: `ns_live_sk_${randHex(24)}`,
          whSecret: `ns_whsec_${randHex(32)}`
        };
      }
    }

    setApps(prev => prev.map(a => {
      if (a.id === targetAppId) {
        const updated: NanaMerchantApp = { ...a, status };
        if (generatedKeys) {
          updated.keys = generatedKeys;
          updated.webhook_config = {
            url: a.webhook_config?.url || 'https://boutique-client.com/api/nanaswitch-webhook',
            secret_key: generatedKeys.whSecret,
            is_active: true
          };
        }
        return updated;
      }
      return a;
    }));

    // Met à jour Firestore si disponible
    if (db) {
      try {
        await updateDoc(doc(db, 'merchants', targetAppId), {
          status: status === 'VERIFIED' ? 'ACTIVE' : 'REJECTED',
          storeApprovalStatus: status === 'VERIFIED' ? 'APPROVED' : 'REJECTED',
          ...(generatedKeys ? {
            'nanaswitch_keys.public_key': generatedKeys.pk,
            'webhook_config.secret_key': generatedKeys.whSecret,
            'webhook_config.is_active': true
          } : {})
        });
      } catch (err) {
        console.warn('[SUPER ADMIN UPDATE FIRESTORE]', (err as Error).message);
      }
    }

    showToast(`Statut de l'application mis à jour : ${status === 'VERIFIED' ? 'Approuvée & Clés générées' : 'Rejetée'}`);
  };

  return (
    <div className={`min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-900 ${className}`}>
      
      {/* GLOBAL TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : toast.type === 'warning' ? (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* TOP NAVBAR (Bleu Royal #1E40AF / #2563EB & Blanc Cassé) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          
          {/* Logo et Slug Label */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => { setSelectedApp(null); setShowDocPortal(false); }}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1E40AF] to-[#2563EB] flex items-center justify-center text-white shadow-lg shadow-blue-600/20 font-black text-xl transition group-hover:scale-105">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">NanaSwitch</span>
                <span className="bg-blue-50 text-[#1E40AF] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border border-blue-200">
                  {slug ? slug.toUpperCase() : 'CLOUD'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">NANASORE TECHNOLOGIES</p>
            </div>
          </div>

          {/* Active Application Switcher Pill */}
          {selectedApp && !showDocPortal && (
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200">
              <span className="text-xs text-slate-400 font-medium">Application active :</span>
              <button 
                onClick={() => setSelectedApp(null)} 
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 transition"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{selectedApp.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* Back button if embedded */}
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Retour</span>
            </button>
          )}

          {/* Doc Portal Button */}
          <button 
            onClick={() => { setShowDocPortal(!showDocPortal); setSelectedApp(null); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              showDocPortal 
                ? 'bg-[#1E40AF] text-white shadow-md shadow-blue-700/25' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-500" />
            <span>Documentation API</span>
          </button>

          {/* External BYOK Switcher Button */}
          <a 
            href="#byok-cloud"
            onClick={(e) => { e.preventDefault(); showToast("Espace Développeur BYOK SaaS disponible sur /nana-switch/billing"); }}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Switch Développeurs</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          {/* Super Admin Toggle Switch */}
          <button
            onClick={() => setIsSuperAdmin(!isSuperAdmin)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition ${
              isSuperAdmin 
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${isSuperAdmin ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className="hidden lg:inline">{isSuperAdmin ? 'Mode Super Admin' : 'Vue Marchand'}</span>
          </button>

          {/* User Badge */}
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E40AF] flex items-center justify-center font-extrabold text-xs border border-blue-200 shadow-sm">
            OK
          </div>
        </div>
      </header>

      {/* DOCUMENTATION PORTAL VIEW */}
      {showDocPortal ? (
        <DocPortalView onClose={() => setShowDocPortal(false)} copyToClipboard={copyToClipboard} />
      ) : selectedApp ? (
        /* MAIN MERCHANT DASHBOARD VIEW (14+ MODULES) */
        <div className="flex min-h-[calc(100vh-65px)]">
          
          {/* LEFT SIDEBAR (Royal Blue Highlights) */}
          <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shrink-0 shadow-sm">
            <div className="space-y-6">
              
              {/* Back to apps list button */}
              <button 
                onClick={() => setSelectedApp(null)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Toutes les applications</span>
              </button>

              <div className="px-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Navigation Marchand</h4>
              </div>

              {/* 14+ NAV MODULES */}
              <nav className="space-y-1">
                {[
                  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
                  { id: 'wallet', label: 'Wallet & Solde', icon: Wallet },
                  { id: 'transactions', label: 'Transactions', icon: CreditCard },
                  { id: 'links', label: 'Liens de paiement', icon: Link2 },
                  { id: 'checkout', label: 'Sessions Checkout', icon: ShoppingCart },
                  { id: 'customers', label: 'Base Clients', icon: Users },
                  { id: 'analytics', label: 'Statistiques & Ventes', icon: BarChart3 },
                  { id: 'payouts', label: 'Retraits & Reversements', icon: ArrowUpRight },
                  { id: 'developer', label: 'Clés API & Accès', icon: Key },
                  { id: 'webhooks', label: 'Configuration Webhooks', icon: Radio },
                  { id: 'webhook_logs', label: 'Journal des Webhooks', icon: History },
                  { id: 'disputes', label: 'Litiges & Remboursements', icon: AlertTriangle },
                  { id: 'pricing', label: 'Tarification & Marges', icon: Percent },
                  { id: 'support', label: 'Support & Tickets', icon: HelpCircle },
                  { id: 'settings', label: 'Paramètres & KYC', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                        isActive 
                          ? 'bg-[#1E40AF] text-white font-bold shadow-md shadow-blue-700/20' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Merchant Footer Info */}
            <div className="pt-4 border-t border-slate-100 px-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                  OK
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {selectedApp.kyc?.companyName || selectedApp.kyc?.fullName || 'Ousmane Konkobo'}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Vérifié
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* DASHBOARD CONTENT AREA */}
          <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <TabDashboard app={selectedApp} copyToClipboard={copyToClipboard} setActiveTab={setActiveTab} onUpgradeClick={() => setIsKycModalOpen(true)} />}
            {activeTab === 'wallet' && <TabWallet app={selectedApp} showToast={showToast} />}
            {activeTab === 'transactions' && <TabTransactions />}
            {activeTab === 'links' && <TabPaymentLinks showToast={showToast} />}
            {activeTab === 'checkout' && <TabCheckoutSessions />}
            {activeTab === 'customers' && <TabCustomers />}
            {activeTab === 'analytics' && <TabAnalytics />}
            {activeTab === 'payouts' && <TabPayouts showToast={showToast} />}
            {activeTab === 'developer' && <DeveloperTab app={selectedApp} copyToClipboard={copyToClipboard} showToast={showToast} onUpdateApp={handleUpdateApp} />}
            {activeTab === 'webhooks' && <TabWebhooks app={selectedApp} copyToClipboard={copyToClipboard} showToast={showToast} />}
            {activeTab === 'webhook_logs' && <TabWebhookLogs />}
            {activeTab === 'disputes' && <TabDisputes />}
            {activeTab === 'pricing' && <TabPricing />}
            {activeTab === 'support' && <TabSupport showToast={showToast} />}
            {activeTab === 'settings' && <TabSettings app={selectedApp} onUpgradeClick={() => setIsKycModalOpen(true)} />}
          </main>
        </div>
      ) : (
        /* WELCOME / APP SELECTOR LANDING SCREEN */
        <main className="max-w-6xl mx-auto px-6 py-12">
          
          {/* Welcome Card Banner */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl shadow-slate-200/50 mb-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/50 to-indigo-100/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-[#1E40AF] px-3.5 py-1.5 rounded-full text-xs font-bold mb-4 border border-blue-200">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Espace Partenaire Agrégé NanaSwitch ({slug})</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
                Bonjour Konkobo, bienvenue sur NanaSwitch Cloud 👋
              </h1>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                Votre hub de paiements unifié pour le Burkina Faso et la sous-région UEMOA. Sélectionnez une application existante ou soumettez un nouveau dossier d'intégration pour démarrer les encaissements.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={() => setIsKycModalOpen(true)}
                  className="bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-bold px-5 py-3 rounded-2xl text-sm shadow-lg shadow-blue-700/25 transition flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Créer une nouvelle application</span>
                </button>
                <button 
                  onClick={() => setShowDocPortal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-5 py-3 rounded-2xl text-sm transition flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Consulter la Documentation API</span>
                </button>
              </div>
            </div>
          </div>

          {/* SUPER ADMIN QUEUE (Visible if isSuperAdmin = true) */}
          {isSuperAdmin && (
            <div className="mb-10 bg-amber-50/80 border border-amber-300 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6 text-amber-700" />
                  <div>
                    <h3 className="font-bold text-amber-900 text-base">File de Validation KYC (Super Admin)</h3>
                    <p className="text-xs text-amber-700">Examiner et approuver les demandes d'applications soumises par les partenaires</p>
                  </div>
                </div>
                <span className="bg-amber-200 text-amber-900 text-xs font-black px-3 py-1 rounded-full">
                  {apps.filter(a => a.status === 'PENDING_KYC').length} En attente
                </span>
              </div>

              <div className="space-y-3">
                {apps.filter(a => a.status === 'PENDING_KYC').length === 0 ? (
                  <p className="text-xs text-amber-700 italic">Aucun dossier en attente de révision pour le moment.</p>
                ) : (
                  apps.filter(a => a.status === 'PENDING_KYC').map((app) => (
                    <div key={app.id} className="bg-white p-4 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{app.name}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">{app.type}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Secteur: {app.sector} • Nom: {app.kyc?.companyName || app.kyc?.fullName}</p>
                        <p className="text-[11px] text-slate-400 mt-1">IFU: {app.kyc?.ifu || app.kyc?.ifuCompany || 'N/A'} • RCCM: {app.kyc?.rccm || 'Particulier'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleAdminDecision(app.id, 'REJECTED')}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                        >
                          Rejeter
                        </button>
                        <button 
                          onClick={() => handleAdminDecision(app.id, 'VERIFIED')}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approuver & Générer Clés</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* APPLICATION GRID SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Vos Applications ({apps.length})</h2>
              <span className="text-xs text-slate-500 font-medium">Cliquez sur une application vérifiée pour ouvrir le tableau de bord</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Existing Applications Cards */}
              {apps.map((app) => {
                const isVerified = app.status === 'VERIFIED';
                return (
                  <div
                    key={app.id}
                    onClick={() => {
                      if (isVerified) {
                        setSelectedApp(app);
                      } else {
                        showToast("Cette application est en cours de vérification KYC par nos équipes.", "warning");
                      }
                    }}
                    className={`group bg-white rounded-3xl p-6 border transition duration-300 relative overflow-hidden ${
                      isVerified 
                        ? 'border-slate-200/90 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-600/10 cursor-pointer' 
                        : 'border-amber-200/80 bg-amber-50/20 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1E40AF] to-[#2563EB] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-600/20">
                        {app.name.charAt(0)}
                      </div>

                      {/* Status Badge */}
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Vérifiée
                        </span>
                      ) : app.status === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-full border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Rejetée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          KYC En révision
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#1E40AF] transition mb-1">
                      {app.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mb-6">{app.sector}</p>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Solde principal :</span>
                      <span className="text-slate-900 font-extrabold text-sm">
                        {(app.balances.XOF || 0).toLocaleString()} XOF
                      </span>
                    </div>

                    {isVerified && (
                      <div className="mt-4 flex items-center justify-end text-xs font-bold text-[#1E40AF] group-hover:translate-x-1 transition">
                        <span>Ouvrir le tableau de bord</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Dotted "Créer une nouvelle application" Card */}
              <div
                onClick={() => setIsKycModalOpen(true)}
                className="bg-white/60 hover:bg-white rounded-3xl p-6 border-2 border-dashed border-slate-300 hover:border-blue-500 transition duration-300 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] group shadow-sm"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 group-hover:bg-[#1E40AF] text-[#1E40AF] group-hover:text-white flex items-center justify-center transition duration-300 mb-4 shadow-sm">
                  <Plus className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-900 text-base group-hover:text-[#1E40AF] transition">
                  Créer une nouvelle application
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 max-w-[200px]">
                  Soumettez vos pièces KYC pour ouvrir un nouveau canal d'encaissement.
                </p>
              </div>

            </div>
          </div>
        </main>
      )}

      {/* DYNAMIC MULTI-STEP KYC MODAL */}
      {isKycModalOpen && (
        <KycModal 
          onClose={() => setIsKycModalOpen(false)}
          kycForm={kycForm}
          setKycForm={setKycForm}
          handleKycSubmit={handleKycSubmit}
        />
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENTS & DASHBOARD TABS
// ==========================================

/* 1. TAB: OVERVIEW DASHBOARD */
function TabDashboard({ app, copyToClipboard, setActiveTab, onUpgradeClick }: { app: NanaMerchantApp; copyToClipboard: (t?: string, l?: string) => void; setActiveTab: (t: string) => void; onUpgradeClick?: () => void }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tableau de bord</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Vue d'ensemble de {app.name} — transactions et solde en temps réel.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('payouts')} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-slate-500" />
            <span>Retirer des fonds</span>
          </button>
          <button onClick={() => setActiveTab('links')} className="bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-700/20 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            <span>Créer un lien de paiement</span>
          </button>
        </div>
      </div>

      {/* MULTI-CURRENCY BALANCES GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#1E40AF]" />
            <span>Soldes disponibles par devise</span>
          </h3>
          <button onClick={() => setActiveTab('wallet')} className="text-xs font-bold text-[#1E40AF] hover:underline">Voir le wallet complet</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { symbol: 'XOF', amount: app.balances.XOF, label: 'Franc CFA (UEMOA)' },
            { symbol: 'USD', amount: app.balances.USD, label: 'US Dollar' },
            { symbol: 'XAF', amount: app.balances.XAF, label: 'Franc CFA (CEMAC)' },
            { symbol: 'GNF', amount: app.balances.GNF, label: 'Franc Guinéen' },
            { symbol: 'GHS', amount: app.balances.GHS, label: 'Cedi Ghanéen' },
          ].map((item) => (
            <div key={item.symbol} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">{item.symbol}</span>
              <p className="text-xl font-black text-slate-900 tracking-tight">{item.amount.toLocaleString()} <span className="text-xs font-semibold text-slate-500">{item.symbol}</span></p>
              <p className="text-[10px] text-slate-400 mt-1 truncate">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KYC MONTHLY VOLUME LIMIT PROGRESS CARD */}
      <KycVolumeLimitCard app={app} onUpgradeClick={onUpgradeClick} />

      {/* RECENT TRANSACTIONS & QUICK STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Transactions récentes</h3>
            <button onClick={() => setActiveTab('transactions')} className="text-xs font-bold text-[#1E40AF] hover:underline">Tout voir</button>
          </div>

          <div className="divide-y divide-slate-100">
            {MOCK_TRANSACTIONS.map((tx) => (
              <div key={tx.id} className="py-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {tx.status === 'SUCCESS' ? <ArrowDownLeft className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{tx.customer}</p>
                    <p className="text-[11px] text-slate-400">{tx.operator} • {tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-extrabold ${tx.status === 'SUCCESS' ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                    +{tx.amount.toLocaleString()} {tx.currency}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {tx.status === 'SUCCESS' ? 'Réussi' : 'Échoué'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Quick API Credentials & Gateway Status */}
        <div className="space-y-6">
          
          {/* API Keys Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Key className="w-4 h-4 text-[#1E40AF]" />
                <span>Clés API Live</span>
              </h3>
              <button onClick={() => setActiveTab('developer')} className="text-xs text-[#1E40AF] font-bold hover:underline">Gérer</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Clé Publique</label>
                <div className="flex items-center gap-2 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <code className="text-slate-800 font-mono text-[11px] truncate flex-1">{app.keys?.pk || 'ns_live_pk_...'}</code>
                  <button onClick={() => copyToClipboard(app.keys?.pk, 'Clé Publique')} className="text-slate-400 hover:text-slate-700">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Secret Webhook</label>
                <div className="flex items-center gap-2 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <code className="text-slate-800 font-mono text-[11px] truncate flex-1">{app.keys?.whSecret || 'ns_whsec_...'}</code>
                  <button onClick={() => copyToClipboard(app.keys?.whSecret, 'Secret Webhook')} className="text-slate-400 hover:text-slate-700">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Gateways Status */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Routeur Dynamique</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-200">Routage Actif UEMOA</p>
              <h4 className="text-xl font-bold mt-0.5">SasPay & Sebpay Dual Engine</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Basculement automatique sans interruption en cas de maintenance Orange Money ou Moov Africa.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

/* 2. TAB: WALLET & BALANCES */
function TabWallet({ app, showToast }: { app: NanaMerchantApp; showToast: (m: string, t?: any) => void }) {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('orange_money');

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    showToast(`Demande de retrait de ${Number(withdrawAmount).toLocaleString()} XOF enregistrée !`, 'success');
    setWithdrawAmount('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Wallet & Portefeuille</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Gérez vos avoirs multi-devises et effectuez des virements immédiats.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Balances List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Vos Devises Encaissées</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { code: 'XOF', name: 'Franc CFA (UEMOA)', val: app.balances.XOF, flag: '🇧🇫' },
              { code: 'USD', name: 'Dollar Américain', val: app.balances.USD, flag: '🇺🇸' },
              { code: 'XAF', name: 'Franc CFA (CEMAC)', val: app.balances.XAF, flag: '🇨🇲' },
              { code: 'GNF', name: 'Franc Guinéen', val: app.balances.GNF, flag: '🇬🇳' },
              { code: 'GHS', name: 'Cedi Ghanéen', val: app.balances.GHS, flag: '🇬🇭' },
            ].map(b => (
              <div key={b.code} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{b.flag}</span>
                    <span className="font-bold text-slate-900 text-sm">{b.name}</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 mt-2">{b.val.toLocaleString()} <span className="text-xs font-semibold text-slate-400">{b.code}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instant Payout Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-[#1E40AF]" />
            <span>Demander un Retrait</span>
          </h3>

          <form onSubmit={handleWithdraw} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Montant à retirer (XOF)</label>
              <input 
                type="number"
                placeholder="Ex: 500000"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Solde max disponible: {app.balances.XOF.toLocaleString()} XOF</span>
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Destination du Payout</label>
              <select 
                value={payoutMethod}
                onChange={e => setPayoutMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-semibold"
              >
                <option value="orange_money">Orange Money BF (+226 70...)</option>
                <option value="moov_money">Moov Money BF (+226 65...)</option>
                <option value="bank_transfer">Virement Bancaire (Coris Bank / BOA)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Frais de retrait (0.5%) :</span>
                <span className="font-bold text-slate-800">{Number(withdrawAmount || 0) * 0.005} XOF</span>
              </div>
              <div className="flex justify-between">
                <span>Montant net reçu :</span>
                <span className="font-bold text-emerald-600">{Number(withdrawAmount || 0) * 0.995} XOF</span>
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-bold rounded-xl shadow-md transition">
              Valider le virement
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

/* 3. TAB: TRANSACTIONS */
function TabTransactions() {
  const [filter, setFilter] = useState('ALL');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Historique des Transactions</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Consultez tous les paiements entrants enregistrés sur votre application.</p>
        </div>

        <button className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm">
          <Download className="w-4 h-4" />
          <span>Exporter CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['ALL', 'SUCCESS', 'FAILED'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg transition ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {f === 'ALL' ? 'Tous' : f === 'SUCCESS' ? 'Réussis' : 'Échoués'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-extrabold">
                <th className="py-3 px-2">ID Transaction</th>
                <th className="py-3 px-2">Client / Téléphone</th>
                <th className="py-3 px-2">Opérateur</th>
                <th className="py-3 px-2">Montant Brut</th>
                <th className="py-3 px-2">Frais (+1.5%)</th>
                <th className="py-3 px-2">Montant Net</th>
                <th className="py-3 px-2">Statut</th>
                <th className="py-3 px-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {MOCK_TRANSACTIONS
                .filter(t => filter === 'ALL' || t.status === filter)
                .map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-2 font-mono font-bold text-slate-900">{tx.id}</td>
                    <td className="py-3 px-2 font-bold">{tx.customer}</td>
                    <td className="py-3 px-2">{tx.operator}</td>
                    <td className="py-3 px-2 font-extrabold text-slate-900">{tx.amount.toLocaleString()} XOF</td>
                    <td className="py-3 px-2 text-rose-600 font-semibold">-{tx.fee} XOF</td>
                    <td className="py-3 px-2 text-emerald-600 font-bold">{tx.net.toLocaleString()} XOF</td>
                    <td className="py-3 px-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-400 text-[11px]">{tx.date}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* 4. TAB: PAYMENT LINKS GENERATOR */
function TabPaymentLinks({ showToast }: { showToast: (m: string) => void }) {
  const [links, setLinks] = useState([
    { id: 'lnk_01', title: 'Abonnement Mensuel VIP', amount: 10000, currency: 'XOF', url: 'https://nanaswitch.cloud/pay/lnk_01', clicks: 42, payments: 18 }
  ]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    const newLink = {
      id: `lnk_${Date.now().toString().slice(-4)}`,
      title,
      amount: Number(amount),
      currency: 'XOF',
      url: `https://nanaswitch.cloud/pay/lnk_${Date.now().toString().slice(-4)}`,
      clicks: 0,
      payments: 0
    };
    setLinks([newLink, ...links]);
    setTitle('');
    setAmount('');
    showToast('Lien de paiement créé avec succès !');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Liens de Paiement</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Créez des liens universels à partager sur WhatsApp, SMS ou Réseaux sociaux.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Link Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Nouveau Lien de Paiement</h3>
          <form onSubmit={handleCreateLink} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Titre de la prestation / Produit</label>
              <input 
                type="text"
                placeholder="Ex: Contribution Événement"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Montant à encaisser (XOF)</label>
              <input 
                type="number"
                placeholder="Ex: 5000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
              />
            </div>
            <button type="submit" className="w-full py-3 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-bold rounded-xl shadow-md transition">
              Générer le lien
            </button>
          </form>
        </div>

        {/* Existing Links List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Vos Liens Actifs</h3>
          <div className="space-y-3">
            {links.map(lnk => (
              <div key={lnk.id} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{lnk.title}</h4>
                  <p className="text-xs font-black text-blue-600 mt-0.5">{lnk.amount.toLocaleString()} {lnk.currency}</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">{lnk.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(lnk.url); showToast('Lien copié !'); }} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 5. TAB: CHECKOUT SESSIONS */
function TabCheckoutSessions() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sessions Checkout Hébergées</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Gérez les sessions d'achat intégrées via l'API NanaSwitch Checkout.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center max-w-xl mx-auto space-y-4">
        <ShoppingCart className="w-12 h-12 text-[#1E40AF] mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Checkout Redirection & Pop-up</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Permettez à vos clients de régler directement depuis votre site marchand via une page de paiement sécurisée aux couleurs de votre marque.
        </p>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left font-mono text-[11px] text-slate-700 space-y-1">
          <p className="text-blue-600 font-bold">// Exemple de création de session API :</p>
          <p>POST {PAYMENT_API_BASE}/v1/checkout/sessions</p>
          <p>Header: x-nanaswitch-skey: ns_live_sk_...</p>
        </div>
      </div>
    </div>
  );
}

/* 6. TAB: CUSTOMERS BASE */
function TabCustomers() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Base de Données Clients</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Acheteurs et clients récurrents identifiés par téléphone Mobile Money.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
        <div className="divide-y divide-slate-100">
          {[
            { phone: '+226 70 12 34 56', name: 'Oumar Diallo', country: 'Burkina Faso', totalPaid: '45,000 XOF', txCount: 3 },
            { phone: '+226 65 89 00 11', name: 'Aminata Ouédraogo', country: 'Burkina Faso', totalPaid: '120,000 XOF', txCount: 8 },
            { phone: '+225 07 44 22 11', name: 'Kouassi Jean', country: 'Côte d\'Ivoire', totalPaid: '85,000 XOF', txCount: 4 },
          ].map((c, i) => (
            <div key={i} className="py-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                  <p className="text-slate-400 text-[11px]">{c.phone} • {c.country}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-slate-900">{c.totalPaid}</p>
                <p className="text-[10px] text-slate-400 font-medium">{c.txCount} transactions</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 7. TAB: ANALYTICS */
function TabAnalytics() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Statistiques & Performance</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Analyse des volumes de ventes par opérateur et par pays.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Taux de Succès Réseau</span>
          <p className="text-3xl font-black text-emerald-600 mt-2">99.4%</p>
          <p className="text-[11px] text-slate-400 mt-1">Grâce au Smart Routing SasPay/Sebpay</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Opérateur N°1</span>
          <p className="text-3xl font-black text-[#1E40AF] mt-2">Orange BF</p>
          <p className="text-[11px] text-slate-400 mt-1">64% du volume total encaissement</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Panier Moyen</span>
          <p className="text-3xl font-black text-slate-900 mt-2">18 500 XOF</p>
          <p className="text-[11px] text-slate-400 mt-1">Sur les 30 derniers jours</p>
        </div>
      </div>
    </div>
  );
}

/* 8. TAB: PAYOUTS HISTORY */
function TabPayouts({ showToast }: { showToast: (m: string) => void }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Historique des Retraits (Payouts)</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Suivi de vos virements vers vos comptes Mobile Money et bancaires.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-extrabold">
              <th className="py-3 px-2">ID Payout</th>
              <th className="py-3 px-2">Destination</th>
              <th className="py-3 px-2">Montant Demandé</th>
              <th className="py-3 px-2">Statut</th>
              <th className="py-3 px-2">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            <tr className="hover:bg-slate-50 transition">
              <td className="py-3 px-2 font-mono font-bold text-slate-900">po_9012</td>
              <td className="py-3 px-2">Orange Money BF (+226 70 12...)</td>
              <td className="py-3 px-2 font-extrabold text-slate-900">500,000 XOF</td>
              <td className="py-3 px-2"><span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold">Effectué</span></td>
              <td className="py-3 px-2 text-slate-400">2026-10-25 10:15</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* 9. TAB: DEVELOPER & API KEYS */
function TabDeveloper(props: {
  app: NanaMerchantApp;
  copyToClipboard: (t?: string, l?: string) => void;
  showToast: (m: string) => void;
  onUpdateApp?: (app: NanaMerchantApp) => void;
}) {
  return <DeveloperTab {...props} />;
}

function LegacyTabDeveloperOld({ app, copyToClipboard, showToast }: { app: NanaMerchantApp; copyToClipboard: (t?: string, l?: string) => void; showToast: (m: string) => void }) {
  const [showSk, setShowSk] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Clés d'API & Sécurité</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Vos identifiants de connexion Zero-Trust pour vos applications backend.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
        
        {/* Warning Alert Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">Protégez votre Clé Secrète (ns_live_sk_...)</p>
            <p className="text-amber-800 leading-relaxed">
              Ne partagez jamais votre clé secrète dans du code côté client (frontend React, JS mobile). Seul son hash Bcrypt est conservé dans Firestore.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Clé Publique (Public Key)</label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={app.keys?.pk || 'ns_live_pk_8f93a2e1c4b70129a007b'}
                className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs font-semibold text-slate-800"
              />
              <button onClick={() => copyToClipboard(app.keys?.pk, 'Clé Publique')} className="px-4 py-2.5 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-bold rounded-xl text-xs transition">
                Copier
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Clé Secrète (Secret Key)</label>
              {app.keys?.rawSk && (
                <button onClick={() => setShowSk(!showSk)} className="text-[11px] text-[#1E40AF] font-bold flex items-center gap-1">
                  {showSk ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showSk ? 'Masquer' : 'Afficher'}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input 
                type={showSk ? 'text' : 'password'} 
                readOnly 
                value={app.keys?.rawSk || app.keys?.skHash || '$2a$10$e89abF...hidden'}
                className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-600 font-semibold"
              />
              {app.keys?.rawSk && (
                <button onClick={() => copyToClipboard(app.keys?.rawSk, 'Clé Secrète')} className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition">
                  Copier
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* 10. TAB: WEBHOOKS CONFIG */
function TabWebhooks({ app, copyToClipboard, showToast }: { app: NanaMerchantApp; copyToClipboard: (t?: string, l?: string) => void; showToast: (m: string) => void }) {
  const [webhookUrl, setWebhookUrl] = useState(app.webhook_config?.url || 'https://boutique-client.com/api/nanaswitch-webhook');

  const handleSaveWebhook = async () => {
    showToast('URL de Webhook sauvegardée avec succès !');
    if (db && app.id) {
      try {
        await updateDoc(doc(db, 'merchants', app.id), {
          'webhook_config.url': webhookUrl,
          'webhook_config.is_active': true
        });
      } catch (err) {
        console.warn('[WEBHOOK UPDATE ERROR]', (err as Error).message);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Configuration Webhooks</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Recevez des notifications instantanées signées HMAC-SHA256.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">URL de Webhook (POST)</label>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs font-semibold text-slate-800"
            />
            <button onClick={handleSaveWebhook} className="px-4 py-2.5 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-bold rounded-xl text-xs transition">
              Enregistrer
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Secret Webhook Marchand (HMAC-SHA256)</label>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              readOnly 
              value={app.keys?.whSecret || 'ns_whsec_9f4e30815fb4aae712061aba45ed8ba8430b31d3b9c4bbf14dfb264ee2a165d2'}
              className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs font-semibold text-slate-800"
            />
            <button onClick={() => copyToClipboard(app.keys?.whSecret, 'Secret Webhook')} className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition">
              Copier
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Utilisez ce secret pour vérifier l'en-tête <code className="text-[#1E40AF] font-bold">x-nanaswitch-signature</code>.</p>
        </div>
      </div>
    </div>
  );
}

/* 11. TAB: WEBHOOK LOGS */
function TabWebhookLogs() {
  const [logs, setLogs] = useState<WebhookDeliveryLog[]>([
    { id: 'del_01', event: 'payment.success', url: 'https://boutique-client.com/api/nanaswitch-webhook', status: '200 OK', latency: '142 ms', date: '2026-10-26 18:45' }
  ]);

  useEffect(() => {
    async function loadDeliveries() {
      if (!db) return;
      try {
        const delRef = collection(db, 'webhook_deliveries');
        const snap = await getDocs(query(delRef, orderBy('created_at', 'desc'), limit(10)));
        if (!snap.empty) {
          const loaded: WebhookDeliveryLog[] = [];
          snap.forEach(d => {
            const data = d.data();
            loaded.push({
              id: d.id,
              event: data.event || 'payment.success',
              url: data.url || 'https://boutique-client.com/api/nanaswitch-webhook',
              status: data.status_code ? `${data.status_code} OK` : '200 OK',
              latency: data.latency_ms ? `${data.latency_ms} ms` : '120 ms',
              date: data.created_at ? new Date(data.created_at.seconds * 1000).toLocaleString() : '2026-10-26 19:30'
            });
          });
          if (loaded.length > 0) setLogs(loaded);
        }
      } catch (e) {
        // Fallback silently to mock
      }
    }
    loadDeliveries();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Journal des Webhooks (webhook_deliveries)</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Historique d'envoi et réponses HTTP de vos endpoints.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-extrabold">
              <th className="py-3 px-2">Événement</th>
              <th className="py-3 px-2">URL Cible</th>
              <th className="py-3 px-2">Code HTTP</th>
              <th className="py-3 px-2">Latence</th>
              <th className="py-3 px-2">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition">
                <td className="py-3 px-2 font-mono font-bold text-[#1E40AF]">{log.event}</td>
                <td className="py-3 px-2 truncate max-w-[200px]">{log.url}</td>
                <td className="py-3 px-2"><span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">{log.status}</span></td>
                <td className="py-3 px-2 text-slate-500">{log.latency}</td>
                <td className="py-3 px-2 text-slate-400">{log.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* 12. TAB: DISPUTES */
function TabDisputes() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Litiges & Chargebacks</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Réclamations clients et contestations d'opérateurs.</p>
      </div>
      <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-900">Aucun litige en cours</h3>
        <p className="text-xs text-slate-500 mt-1">Votre compte bénéficie d'une excellente réputation anti-fraude.</p>
      </div>
    </div>
  );
}

/* 13. TAB: PRICING & MARGINS (+1.5%) */
function TabPricing() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tarification & Grille Réseau</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Transparence totale sur la marge plateforme (+1.5%) et frais opérateurs.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-extrabold">
                <th className="py-3 px-2">Pays & Zone</th>
                <th className="py-3 px-2">Opérateur Mobile</th>
                <th className="py-3 px-2">Coût Opérateur</th>
                <th className="py-3 px-2">Marge NanaSwitch</th>
                <th className="py-3 px-2">Taux Total Appliqué</th>
                <th className="py-3 px-2">Minimum / Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {PRICING_RULES.map((rule, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-2 font-bold text-slate-900">{rule.country}</td>
                  <td className="py-3.5 px-2 font-semibold">{rule.operator}</td>
                  <td className="py-3.5 px-2 text-slate-400">{rule.baseRate}</td>
                  <td className="py-3.5 px-2 text-[#1E40AF] font-extrabold">{rule.margin}</td>
                  <td className="py-3.5 px-2 font-black text-slate-900">{rule.totalFee}</td>
                  <td className="py-3.5 px-2 text-slate-500">{rule.minFee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* 14. TAB: SUPPORT */
function TabSupport({ showToast }: { showToast: (m: string) => void }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Support Technique & Assistance</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Assistance 24/7 dédiée aux partenaires NanaSwitch.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <PhoneCall className="w-8 h-8 text-[#1E40AF]" />
          <h3 className="font-bold text-slate-900 text-base">Assistance WhatsApp Directe</h3>
          <p className="text-xs text-slate-500">Contactez directement notre équipe backend d'urgence au Burkina Faso.</p>
          <button onClick={() => showToast('Ouverture du support WhatsApp...')} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition">
            Ouvrir WhatsApp (+226 70 00 00 00)
          </button>
        </div>
      </div>
    </div>
  );
}

/* 15. TAB: SETTINGS & KYC INFO */
function TabSettings({ app, onUpgradeClick }: { app: NanaMerchantApp; onUpgradeClick?: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Paramètres du Compte & KYC</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Fiche d'identité d'entreprise et plafonds de transactions mensuels.</p>
      </div>

      {/* KYC MONTHLY VOLUME LIMIT & UPGRADE INCENTIVE */}
      <KycVolumeLimitCard app={app} onUpgradeClick={onUpgradeClick} />

      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Informations Légales Consignées</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Raison Sociale / Nom</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{app.kyc?.companyName || app.kyc?.fullName}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Numéro IFU</span>
            <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{app.kyc?.ifu || app.kyc?.ifuCompany || 'N/A'}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Numéro RCCM</span>
            <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{app.kyc?.rccm || 'N/A (Particulier)'}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">RIB / Compte de Règlement</span>
            <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{app.kyc?.bankRib || 'Mobile Money Verified'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* DOCUMENTATION PORTAL ISOLATED VIEW */
function DocPortalView({ onClose, copyToClipboard }: { onClose: () => void; copyToClipboard: (t?: string, l?: string) => void }) {
  const [docTab, setDocTab] = useState('quickstart');

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold text-[#1E40AF] uppercase tracking-widest">Portail Développeur</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Documentation API NanaSwitch Cloud</h1>
          <p className="text-slate-500 text-xs mt-1">Intégrez rapidement l'API Zero-Trust et vérifiez vos signatures Webhooks HMAC-SHA256.</p>
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition">
          Fermer la Doc
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="space-y-1">
          {[
            { id: 'quickstart', label: 'Démarrage Rapide (Zero-Trust)' },
            { id: 'hmac', label: 'Vérification Signature HMAC' },
            { id: 'pricing', label: 'Débit Crédits (0.02 XOF SaaS)' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setDocTab(t.id)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition ${docTab === t.id ? 'bg-[#1E40AF] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {t.label}
            </button>
          ))}
        </aside>

        <main className="lg:col-span-3 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {docTab === 'quickstart' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <h2 className="text-lg font-bold text-slate-900">1. Authentification Header</h2>
              <p>Chaque requête backend doit comporter la clé secrète dans l'en-tête HTTP <code className="bg-slate-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">x-nanaswitch-skey</code>.</p>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto">
{`const response = await fetch('${PAYMENT_API_BASE}/api/payments/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-nanaswitch-skey': 'ns_live_sk_YOUR_SECRET_KEY'
  },
  body: JSON.stringify({
    amount: 10000,
    currency: 'XOF',
    customerPhone: '+22670000000',
    country: 'BF'
  })
});`}
              </pre>
            </div>
          )}

          {docTab === 'hmac' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <h2 className="text-lg font-bold text-slate-900">2. Verification Helper HMAC-SHA256 (Node.js)</h2>
              <p>Validez les webhooks entrants pour prévenir les attaques par rejeu.</p>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto">
{`const crypto = require('crypto');

function verifyWebhookSignature({ payload, signatureHeader, secretKey }) {
  const parts = signatureHeader.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
  const signature = parts.find(p => p.startsWith('v1='))?.split('=')[1];

  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(\`\${timestamp}.\${payload}\`)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHash));
}`}
              </pre>
            </div>
          )}

          {docTab === 'pricing' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <h2 className="text-lg font-bold text-slate-900">3. Modèle Hybride de Facturation (SaaS BYOK)</h2>
              <p>Les requêtes d'API externes sont décomptées à 0.02 XOF par transaction avec coupe-circuit 402 automatique lorsque le solde atteint 0.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* DYNAMIC MULTI-STEP KYC ONBOARDING MODAL */
function KycModal({ onClose, kycForm, setKycForm, handleKycSubmit }: { 
  onClose: () => void; 
  kycForm: any; 
  setKycForm: (f: any) => void; 
  handleKycSubmit: (e: React.FormEvent) => void 
}) {
  const isParticulier = kycForm.type === 'particulier';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Nouveau Dossier d'Intégration</span>
            <h2 className="text-xl font-bold mt-0.5">Formulaire d'Onboarding & KYC</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full transition">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleKycSubmit} className="p-6 space-y-6 text-xs">
          
          {/* STEP 1: Account Type Selection */}
          <div className="space-y-3">
            <label className="font-bold text-slate-900 block">1. Type de Compte Partenaire</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setKycForm({ ...kycForm, type: 'entreprise' })}
                className={`p-4 rounded-2xl border text-left transition ${
                  kycForm.type === 'entreprise' 
                    ? 'border-[#1E40AF] bg-blue-50/50 text-blue-900 ring-2 ring-blue-600/20' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Building2 className="w-6 h-6 text-[#1E40AF] mb-2" />
                <p className="font-bold text-sm">Entreprise / Société</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Pour SARL, SA, EURL enregistrées avec RCCM et IFU.</p>
              </button>

              <button
                type="button"
                onClick={() => setKycForm({ ...kycForm, type: 'particulier' })}
                className={`p-4 rounded-2xl border text-left transition ${
                  kycForm.type === 'particulier' 
                    ? 'border-[#1E40AF] bg-blue-50/50 text-blue-900 ring-2 ring-blue-600/20' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <UserCheck className="w-6 h-6 text-[#1E40AF] mb-2" />
                <p className="font-bold text-sm">Particulier / Freelance</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Pour auto-entrepreneurs avec CNIB & IFU personnel.</p>
              </button>
            </div>
          </div>

          {/* STEP 2: General Application Info */}
          <div className="space-y-4 border-t border-slate-100 pt-4">
            <h3 className="font-bold text-slate-900 text-sm">2. Informations sur l'Application</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nom de l'application / Boutique</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: NanaApp E-commerce"
                  value={kycForm.appName}
                  onChange={e => setKycForm({ ...kycForm, appName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Secteur d'activité</label>
                <select
                  value={kycForm.sector}
                  onChange={e => setKycForm({ ...kycForm, sector: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-semibold"
                >
                  <option value="E-commerce">E-commerce & Vente en ligne</option>
                  <option value="SaaS & App Mobile">SaaS & Application Mobile</option>
                  <option value="Éducation & Formation">Éducation & Formation</option>
                  <option value="Service & Consulting">Services aux Entreprises</option>
                </select>
              </div>
            </div>
          </div>

          {/* STEP 3: DYNAMIC DEDICATED KYC DOCUMENTS */}
          <div className="space-y-4 border-t border-slate-100 pt-4">
            <h3 className="font-bold text-slate-900 text-sm">
              3. Pièces Justificatives KYC ({isParticulier ? 'Particulier' : 'Entreprise'})
            </h3>

            {isParticulier ? (
              /* PARTICULIER DEDICATED FIELDS */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nom complet du titulaire</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Rasmané Konkobo"
                    value={kycForm.fullName}
                    onChange={e => setKycForm({ ...kycForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Numéro CNIB / Passeport</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: B12940291"
                    value={kycForm.cnibNumber}
                    onChange={e => setKycForm({ ...kycForm, cnibNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Numéro IFU Personnel</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: 00098471201P"
                    value={kycForm.ifuPersonal}
                    onChange={e => setKycForm({ ...kycForm, ifuPersonal: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Téléphone de réception</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="+226 70 00 00 00"
                    value={kycForm.phone}
                    onChange={e => setKycForm({ ...kycForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            ) : (
              /* ENTREPRISE DEDICATED FIELDS */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Raison Sociale de la Société</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: NANASORE TECHNOLOGIES SARL"
                    value={kycForm.companyName}
                    onChange={e => setKycForm({ ...kycForm, companyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Numéro RCCM</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: BF-OUA-01-2026-B12-09431"
                    value={kycForm.rccm}
                    onChange={e => setKycForm({ ...kycForm, rccm: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Numéro IFU Entreprise</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: 001928473610L"
                    value={kycForm.ifuCompany}
                    onChange={e => setKycForm({ ...kycForm, ifuCompany: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nom du Gérant / Représentant</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Ousmane Konkobo"
                    value={kycForm.managerName}
                    onChange={e => setKycForm({ ...kycForm, managerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            )}

            {/* Document Upload Zone */}
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center space-y-1">
              <Upload className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700">Téléverser les justificatifs (CNIB, RCCM, IFU)</p>
              <p className="text-[10px] text-slate-400">Formats acceptés: PDF, PNG, JPG (max 10MB)</p>
            </div>
          </div>

          {/* STEP 4: Contract Agreement */}
          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 flex items-start gap-3">
            <input 
              type="checkbox" 
              required
              id="contract"
              checked={kycForm.contractSigned}
              onChange={e => setKycForm({ ...kycForm, contractSigned: e.target.checked })}
              className="mt-1 w-4 h-4 text-[#1E40AF] rounded"
            />
            <label htmlFor="contract" className="text-[11px] text-blue-900 leading-tight">
              J'accepte les termes du <strong>Contrat Partenaire NanaSwitch Cloud</strong> et certifie l'exactitude des informations fournies pour vérification par le Super Admin.
            </label>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition">
              Annuler
            </button>
            <button type="submit" className="px-6 py-2.5 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-bold rounded-xl shadow-lg shadow-blue-700/25 transition flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              <span>Soumettre pour validation</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

export default NanaSwitchApp;
