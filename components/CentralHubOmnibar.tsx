import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ref, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { rtdb, db } from '../src/firebase';
import { APPS_REGISTRY, searchAppsRegistry, AppRegistryItem } from '../src/data/appsRegistry';
import { 
  Search, 
  X, 
  Play, 
  Zap, 
  Star, 
  ArrowRight, 
  Video, 
  Image as ImageIcon, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  ExternalLink,
  Boxes,
  Check,
  Plus
} from 'lucide-react';

export interface HubCardItem {
  id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  routeUrl?: string;
  subtitle?: string;
  palmares?: string;
  trialBadge?: string;
  tutorialUrl?: string;
  trialType?: 'credits' | 'time_trial' | 'freemium' | string;
  priceMonthly?: number;
  targetView?: string;
  isRootApp?: boolean;
  linkedModuleIds?: string[];
  isActivated?: boolean;
  blocks?: any[];
}

export interface HubRowItem {
  id?: string;
  rowTitle: string;
  cards: HubCardItem[];
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to?: string;
}

export const Link: React.FC<LinkProps> = ({ to = '#', onClick, children, className = '', ...rest }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
    if (to && to !== '#') {
      if (to.startsWith('http://') || to.startsWith('https://')) {
        return;
      }
      e.preventDefault();
      try {
        window.history.pushState({}, '', to);
        window.dispatchEvent(new PopStateEvent('popstate'));
        window.dispatchEvent(new CustomEvent('app_navigate', { detail: { path: to } }));
      } catch (_) {
        window.location.href = to;
      }
    }
  };

  return (
    <a href={to || '#'} onClick={handleClick} className={className} {...rest}>
      {children}
    </a>
  );
};

export interface CentralHubOmnibarProps {
  onNavigate?: (view: string) => void;
  onOpenApp?: (app: any) => void;
  className?: string;
  placeholder?: string;
}

// REGISTRE OFFICIEL DE LA SUITE CAISSE ENREGISTREUSE & POS NANA (GARANTIE DE CHARGEMENT PERMANENT SANS MOCK)
export const OFFICIAL_POS_CORE_APP: HubCardItem & { subtitle?: string; rowTitle?: string } = {
  id: 'pos-caisse-core',
  title: 'Caisse Tactile & Point de Vente (POS)',
  subtitle: 'Caisse Magasin Offline • Encaissement Comptoir',
  palmares: 'N°1 des Ventes • POS Certifié',
  description: 'Interface tactile ultra-rapide pour encaissement comptoir, tickets de caisse, lecteur code-barres, gestion multi-vendeurs et synchronisation automatique hors-ligne.',
  mediaType: 'image',
  mediaUrl: '',
  routeUrl: '/dashboard/apps/pos',
  targetView: 'POS',
  trialBadge: 'Inclus • Illimité',
  isRootApp: true,
  rowTitle: 'Commerce & Caisse (POS)',
  linkedModuleIds: [
    'mod_pos_closing',
    'mod_receipt_printer',
    'mod_credit_book',
    'mod_barcode_scanner',
    'mod_cashier_sessions',
    'mod_offline_sync'
  ]
};

export const OFFICIAL_POS_MODULES: HubCardItem[] = [
  {
    id: 'mod_pos_closing',
    title: 'Clôture Journalière & Rapport Z de Caisse',
    subtitle: 'Comptabilité de Caisse',
    palmares: 'Indispensable',
    description: 'Génération instantanée du Z de caisse, comptage des espèces, réconciliation Mobile Money (Wave, Orange, Moov) et exportation PDF.',
    mediaType: 'image',
    mediaUrl: '',
    routeUrl: '/dashboard/apps/pos-closing',
    targetView: 'POS',
    trialBadge: 'Inclus'
  },
  {
    id: 'mod_receipt_printer',
    title: 'Imprimante Ticket Thermique (58/80mm)',
    subtitle: 'Matériel & Périphériques',
    palmares: 'Bluetooth / USB',
    description: 'Impression automatique des tickets de caisse, duplicatas et factures proforma avec en-tête personnalisée et logo.',
    mediaType: 'image',
    mediaUrl: '',
    routeUrl: '/dashboard/apps/receipt-printer',
    targetView: 'SETTINGS',
    trialBadge: 'Prêt'
  },
  {
    id: 'mod_credit_book',
    title: 'Carnet de Dettes & Ventes à Crédit',
    subtitle: 'Gestion des Créances Clients',
    palmares: 'Relances WhatsApp',
    description: 'Enregistrement des ardoises et crédits clients directement depuis la caisse avec rappels automatiques SMS et WhatsApp.',
    mediaType: 'image',
    mediaUrl: '',
    routeUrl: '/dashboard/apps/credit-book',
    targetView: 'CUSTOMERS',
    trialBadge: 'Actif'
  },
  {
    id: 'mod_barcode_scanner',
    title: 'Scanner Code-Barres & Douchette Laser',
    subtitle: 'Saisie Ultra-Rapide',
    palmares: 'Caméra & USB',
    description: 'Bip ultra-rapide des articles en rayon, gestion des codes EAN-13, QR codes et saisie automatique au panier sans contact.',
    mediaType: 'image',
    mediaUrl: '',
    routeUrl: '/dashboard/apps/barcode-scanner',
    targetView: 'POS',
    trialBadge: 'Inclus'
  },
  {
    id: 'mod_cashier_sessions',
    title: 'Multi-Caissiers & Gestion des Shifts',
    subtitle: 'Sécurité & Traçabilité',
    palmares: 'Anti-Fraude',
    description: 'Attribution de fonds de caisse individuels, code PIN par caissier, audit des écarts et historique complet des annulations.',
    mediaType: 'image',
    mediaUrl: '',
    routeUrl: '/dashboard/apps/cashier-sessions',
    targetView: 'SETTINGS',
    trialBadge: 'Sécurisé'
  },
  {
    id: 'mod_offline_sync',
    title: 'Mode Secours Hors-Ligne (Offline First)',
    subtitle: 'Résilience Réseau',
    palmares: 'Zéro Coupure',
    description: 'Continuez d\'encaisser vos clients même en cas de panne internet ou coupure réseau, avec synchronisation automatique au retour de la connexion.',
    mediaType: 'image',
    mediaUrl: '',
    routeUrl: '/dashboard/apps/pos',
    targetView: 'POS',
    trialBadge: 'Garanti'
  }
];

export const cleanUrl = (url: string | undefined): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  const match = trimmed.match(/\((https?:\/\/[^\)]+)\)/);
  const resolved = match ? match[1] : trimmed.replace(/^\[(.*?)\]$/, '$1').trim();
  const lower = resolved.toLowerCase();
  // PURGE STRICTE D'UNSPLASH, DES MOCK SITES ET DES PLACEHOLDERS
  if (
    lower.includes('unsplash.com') ||
    lower.includes('images.unsplash') ||
    lower.includes('via.placeholder') ||
    lower.includes('placeholder.com') ||
    lower.includes('sample-videos.com') ||
    lower.includes('commondatastorage.googleapis.com')
  ) {
    return '';
  }
  return resolved;
};

export interface OmnibarItemProps {
  block: any;
  index?: number;
  searchQuery?: string;
  hoveredCardId?: string | null;
  setHoveredCardId?: (id: string | null) => void;
  checkedModules?: Record<string, boolean>;
  toggleModuleCheck?: (id: string) => void;
  onOpenTutorial?: (e: React.MouseEvent, url?: string) => void;
  onActivateModule?: (e: React.MouseEvent, mod: any, linkedIds?: string[]) => void;
  onClose?: () => void;
}

export const OmnibarItem: React.FC<OmnibarItemProps> = ({
  block,
  index = 0,
  searchQuery = '',
  hoveredCardId,
  setHoveredCardId,
  checkedModules: externalCheckedModules,
  toggleModuleCheck: externalToggleModuleCheck,
  onOpenTutorial,
  onActivateModule,
  onClose,
}) => {
  const [localHoveredId, setLocalHoveredId] = useState<string | null>(null);
  const [localChecked, setLocalChecked] = useState<Record<string, boolean>>({});

  const currentHoveredId = hoveredCardId !== undefined ? hoveredCardId : localHoveredId;
  const setHovered = (id: string | null) => {
    if (setHoveredCardId) setHoveredCardId(id);
    else setLocalHoveredId(id);
  };

  const isChecked = (id: string) =>
    externalCheckedModules ? !!externalCheckedModules[id] : !!localChecked[id];

  const handleToggleCheck = (id: string) => {
    if (externalToggleModuleCheck) externalToggleModuleCheck(id);
    else setLocalChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTutorial = (e: React.MouseEvent, url?: string) => {
    if (onOpenTutorial) {
      onOpenTutorial(e, url);
    } else if (url) {
      window.open(cleanUrl(url), '_blank');
    } else {
      alert("Ce module dispose d'un tutoriel vidéo interactif bientôt disponible !");
    }
  };

  const handleActivate = (e: React.MouseEvent, mod: any, linkedIds?: string[]) => {
    if (onActivateModule) {
      onActivateModule(e, mod, linkedIds);
    } else {
      if (mod.routeUrl && mod.routeUrl !== '#') {
        window.history.pushState({}, '', mod.routeUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
        window.dispatchEvent(new CustomEvent('app_navigate', { detail: { path: mod.routeUrl } }));
      }
      alert(`⚡ Module « ${mod.title || 'App'} » activé avec succès !`);
      if (onClose) onClose();
    }
  };

  const q = (searchQuery || '').trim().toLowerCase();

  // Helper d'extraction d'une carte
  const extractCard = (c: any, cIdx: number) => {
    const rawBlocks = Array.isArray(c?.blocks) ? c.blocks : [];
    const h = rawBlocks.find((b: any) => b?.type === 'header');
    const d = rawBlocks.find((b: any) => b?.type === 'description');
    const m = rawBlocks.find((b: any) => b?.type === 'image' || b?.type === 'video');
    const cta = rawBlocks.find((b: any) => b?.type === 'cta');

    const title = c?.title || h?.title || 'Module';
    const subtitle = c?.subtitle || h?.badge || c?.palmares || '';
    const palmares = c?.palmares || h?.badge || '';
    const description = c?.description || d?.text || '';
    const rawUrl = c?.mediaUrl || c?.imageUrl || m?.url || m?.imageUrl || '';
    const mediaUrl = cleanUrl(rawUrl);
    const mediaType = c?.mediaType || (m?.type === 'video' || mediaUrl.includes('.mp4') ? 'video' : 'image');
    const tutorialUrl = c?.tutorialUrl || cta?.tutorialUrl || '';
    const trialBadge = c?.trialBadge || cta?.trialBadge || '';
    const routeUrl = c?.routeUrl || (c?.id === 'card-2' ? '/dashboard/apps/pos' : c?.id === 'card-1' ? '/dashboard/apps/ai-generator' : '');
    const linkedModuleIds = c?.linkedModuleIds || cta?.linkedModuleIds || [];
    const isRootApp = Boolean(c?.isRootApp || (linkedModuleIds && linkedModuleIds.length > 0));

    return {
      id: c?.id || `card-${index}-${cIdx}`,
      title,
      subtitle,
      palmares,
      description,
      mediaUrl,
      mediaType,
      tutorialUrl,
      trialBadge,
      routeUrl,
      linkedModuleIds,
      isRootApp
    };
  };

  // Déterminer si le block est une Rangée (Row)
  const rawCards: any[] = Array.isArray(block?.cards)
    ? block.cards
    : block?.cards && typeof block.cards === 'object'
    ? Object.values(block.cards)
    : [];

  const isRow = rawCards.length > 0 || Boolean(block?.rowTitle);

  if (isRow) {
    const rowTitle = block?.rowTitle || block?.title || `Section ${index + 1}`;
    const allCards = rawCards.map(extractCard);

    // Filtrage sur la requête si active
    const matchingCards = q
      ? allCards.filter(
          (c) =>
            rowTitle.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.palmares.toLowerCase().includes(q) ||
            c.subtitle.toLowerCase().includes(q)
        )
      : allCards;

    if (q && matchingCards.length === 0) return null;

    // Détection de l'Application Principale (BLOC 1)
    const rootCard = allCards.find((c) => c.isRootApp);
    const companionCards = rootCard
      ? allCards.filter((c) => c.id !== rootCard.id && (rootCard.linkedModuleIds.includes(c.id) || !c.isRootApp))
      : [];

    return (
      <div className="space-y-4 bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-800/80 mb-6">
        {/* Titre de Section / Rangée */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2.5">
            <Boxes className="w-4 h-4 text-[#4169E1]" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
              {rowTitle}
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            {allCards.length} module{allCards.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* CAS A : Rangée avec Application Racine (BLOC 1 + BLOC 2) */}
        {rootCard && (!q || matchingCards.some((c) => c.id === rootCard.id)) ? (
          <div className="space-y-4">
            {/* BLOC 1 : APPLICATION PRINCIPALE */}
            <div 
              onMouseEnter={() => setHovered(rootCard.id)}
              onMouseLeave={() => setHovered(null)}
              className="bg-[#28283D] border border-emerald-500/50 rounded-xl p-5 hover:border-emerald-400 transition-all shadow-xl shadow-emerald-500/5 cursor-pointer"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <a 
                    href={rootCard.routeUrl || '#'} 
                    onClick={(e) => {
                      e.preventDefault();
                      if (onClose) onClose();
                      handleActivate(e, rootCard);
                    }} 
                    className="text-base sm:text-lg font-black text-blue-400 hover:text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.85)] hover:underline transition-all flex items-center gap-2 cursor-pointer"
                    style={{ textShadow: '0 0 10px rgba(59, 130, 246, 0.8)' }}
                  >
                    <span>{rootCard.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider bg-blue-500/15 text-blue-300 border border-blue-400/30 shadow-xs shadow-blue-500/10 shrink-0">
                      [{getTaxonomyBadge(rootCard)}]
                    </span>
                    <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
                    {rootCard.trialBadge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20 no-underline">
                        {rootCard.trialBadge}
                      </span>
                    )}
                  </a>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Module Racine
                    </span>
                    {rootCard.palmares && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/25 shrink-0">
                        {rootCard.palmares}
                      </span>
                    )}
                  </div>
                </div>
                {rootCard.subtitle && <p className="text-xs text-slate-400">{rootCard.subtitle}</p>}
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">{rootCard.description}</p>
              </div>

              {/* Actions */}
              <div className="mt-3 pt-3 border-t border-slate-700/80">

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTutorial(e, rootCard.tutorialUrl);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-600 transition cursor-pointer active:scale-98"
                  >
                    ▶️ Voir le Tutoriel
                  </button>
                  
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const selectedMods = companionCards.filter((m) => isChecked(m.id)).map((m) => m.id);
                      handleActivate(e, rootCard, selectedMods);
                    }}
                    className="flex-1 px-5 py-2.5 bg-[#4169E1] hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-[#4169E1]/20 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>
                      {companionCards.filter((m) => isChecked(m.id)).length > 0 
                        ? `${getTaxonomyBadge(rootCard) === 'Outil' ? '🛒 Acheter' : '⚡ Activer'} ${rootCard.title} (+ ${companionCards.filter((m) => isChecked(m.id)).length} module${companionCards.filter((m) => isChecked(m.id)).length > 1 ? 's' : ''})` 
                        : `${getTaxonomyBadge(rootCard) === 'Outil' ? '🛒 Acheter' : '⚡ Activer'} ${rootCard.title}`}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* BLOC 2 : FONCTIONNALITÉS & MODULES ASSOCIÉS */}
            {companionCards.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#4169E1]" />
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-[#4169E1]">
                      FONCTIONNALITÉS & MODULES ASSOCIÉS
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Cochez pour activer simultanément
                  </span>
                </div>

                <div className="space-y-2.5">
                  {companionCards.map((mod, mIdx) => {
                    const checked = isChecked(mod.id);
                    return (
                      <div 
                        key={mod.id || mIdx}
                        onClick={() => handleToggleCheck(mod.id)}
                        className={`bg-[#28283D] border rounded-xl p-3.5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                          checked 
                            ? 'border-[#4169E1] bg-[#2E2E48] shadow-md shadow-[#4169E1]/15' 
                            : 'border-slate-700/60 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              id={`check-${mod.id}`}
                              checked={checked}
                              onChange={() => handleToggleCheck(mod.id)}
                              className="w-4 h-4 rounded accent-[#4169E1] cursor-pointer"
                            />
                          </div>
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <a 
                                href={mod.routeUrl || '#'}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (onClose) onClose();
                                  handleActivate(e, mod);
                                }}
                                className="text-xs sm:text-sm font-bold text-blue-400 hover:text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.85)] hover:underline flex items-center gap-1 transition-all cursor-pointer"
                                style={{ textShadow: '0 0 8px rgba(59, 130, 246, 0.75)' }}
                              >
                                <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0 drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                                <span>{mod.title}</span>
                              </a>
                              <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold tracking-wider bg-blue-500/15 text-blue-300 border border-blue-400/30 shadow-xs shrink-0">
                                [{getTaxonomyBadge(mod)}]
                              </span>
                              {mod.palmares && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                                  {mod.palmares}
                                </span>
                              )}
                              {mod.trialBadge && (
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20">
                                  {mod.trialBadge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 line-clamp-2">{mod.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                          {mod.tutorialUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTutorial(e, mod.tutorialUrl);
                              }}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                              title="Voir le tutoriel"
                            >
                              <Play className="w-3.5 h-3.5 text-[#4169E1]" />
                            </button>
                          )}
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCheck(mod.id);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                              checked 
                                ? 'bg-blue-600 text-white border-blue-500' 
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                            }`}
                          >
                            {checked ? '✓ Sélectionné' : '+ Cocher'}
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivate(e, mod);
                            }}
                            className="px-2.5 py-1 bg-[#4169E1] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition cursor-pointer active:scale-95"
                          >
                            {getTaxonomyBadge(mod) === 'Outil' ? '🛒 Acheter seul' : '⚡ Activer seul'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Barre collective d'activation */}
                <div className="pt-1">
                  <div className="bg-gradient-to-r from-blue-950/60 to-slate-900 border border-[#4169E1]/40 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-300">
                      Options sélectionnées : <strong className="text-emerald-400">{companionCards.filter((m) => isChecked(m.id)).length}</strong> sur {companionCards.length} module(s)
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={(e) => handleActivate(e, rootCard)}
                        className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-600 transition"
                      >
                        {getTaxonomyBadge(rootCard) === 'Outil' ? `Acheter ${rootCard.title} seule` : `Activer ${rootCard.title} seule`}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          const selectedMods = companionCards.filter((m) => isChecked(m.id)).map((m) => m.id);
                          handleActivate(e, rootCard, selectedMods);
                        }}
                        className="flex-1 sm:flex-initial px-4 py-1.5 bg-[#4169E1] hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-[#4169E1]/30 transition"
                      >
                        {getTaxonomyBadge(rootCard) === 'Outil' ? '🛒 Acheter Tout Ensemble' : '⚡ Activer Tout Ensemble'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* CAS B : Rangée Standard / Sans Application Racine (ex: Nanagénérateur AI) */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {matchingCards.map((card, cIdx) => (
              <div 
                key={card.id || cIdx}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => setHovered(null)}
                className="bg-[#28283D] border border-slate-700/60 hover:border-[#4169E1] rounded-xl p-4.5 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <a 
                        href={card.routeUrl || '#'}
                        onClick={(e) => {
                          e.preventDefault();
                          handleActivate(e, card);
                        }}
                        className="text-sm font-bold text-blue-400 hover:text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.85)] hover:underline flex items-center gap-1.5 transition-all cursor-pointer"
                        style={{ textShadow: '0 0 8px rgba(59, 130, 246, 0.75)' }}
                      >
                        <span>{card.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      </a>
                      <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold tracking-wider bg-blue-500/15 text-blue-300 border border-blue-400/30 shadow-xs shrink-0">
                        [{getTaxonomyBadge(card)}]
                      </span>
                    </div>
                    {card.palmares && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 shrink-0">
                        {card.palmares}
                      </span>
                    )}
                  </div>
                  {card.subtitle && <p className="text-[11px] text-slate-400 font-medium">{card.subtitle}</p>}
                  <p className="text-xs text-slate-300 leading-relaxed">{card.description}</p>
                </div>

                {/* Actions */}
                <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                  {card.trialBadge ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20">
                      {card.trialBadge}
                    </span>
                  ) : <span />}

                  <div className="flex items-center gap-2">
                    {card.tutorialUrl && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTutorial(e, card.tutorialUrl);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold border border-slate-600 transition"
                      >
                        ▶️ Tuto
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivate(e, card);
                      }}
                      className="px-3 py-1.5 bg-[#4169E1] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition shadow-md active:scale-95"
                    >
                      {getTaxonomyBadge(card) === 'Outil' ? '🛒 Acheter' : '⚡ Activer'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // CAS C : Le block est une Carte unique directe
  const singleCard = extractCard(block, index);
  if (q && !singleCard.title.toLowerCase().includes(q) && !singleCard.description.toLowerCase().includes(q)) {
    return null;
  }

  return (
    <div 
      className="bg-[#28283D] border border-slate-700/60 hover:border-[#4169E1] rounded-xl p-4.5 transition-all flex flex-col justify-between group shadow-lg mb-4"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <a
              href={singleCard.routeUrl || '#'}
              onClick={(e) => {
                e.preventDefault();
                handleActivate(e, singleCard);
              }}
              className="text-sm font-bold text-blue-400 hover:text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.85)] hover:underline flex items-center gap-1.5 transition-all cursor-pointer"
              style={{ textShadow: '0 0 8px rgba(59, 130, 246, 0.75)' }}
            >
              <span>{singleCard.title}</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            </a>
            <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold tracking-wider bg-blue-500/15 text-blue-300 border border-blue-400/30 shadow-xs shrink-0">
              [{getTaxonomyBadge(singleCard)}]
            </span>
          </div>
          {singleCard.palmares && (
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 shrink-0">
              {singleCard.palmares}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{singleCard.description}</p>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
        {singleCard.trialBadge ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20">
            {singleCard.trialBadge}
          </span>
        ) : <span />}

        <button 
          type="button"
          onClick={(e) => handleActivate(e, singleCard)}
          className="px-3 py-1.5 bg-[#4169E1] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition shadow-md active:scale-95"
        >
          {getTaxonomyBadge(singleCard) === 'Outil' ? '🛒 Acheter' : '⚡ Activer'}
        </button>
      </div>
    </div>
  );
};

/**
 * SYSTÈME DE BADGES VISUELS (TAXONOMIE) :
 * 4 types distincts : [Service], [Application], [Module], [Outil]
 */
export type TaxonomyBadgeType = 'Service' | 'Application' | 'Module' | 'Outil';

export function getTaxonomyBadge(item: any): TaxonomyBadgeType {
  if (!item) return 'Module';

  // 1. Propriété explicite prioritaire si définie dans la base
  const explicit = (
    item.taxonomyType || 
    item.badgeType || 
    item.itemType || 
    item.type ||
    item.taxonomy
  )?.toString().toLowerCase();

  if (explicit === 'service') return 'Service';
  if (explicit === 'application' || explicit === 'app') return 'Application';
  if (explicit === 'module') return 'Module';
  if (explicit === 'outil' || explicit === 'tool') return 'Outil';

  const title = (item.title || item.appName || item.name || '').toLowerCase();
  const cat = (item.category || item.subtitle || item.rowTitle || '').toLowerCase();
  const id = (item.id || '').toLowerCase();

  // 1.5 Mappings et priorités explicites
  if (
    title.includes('crm et automation') || 
    title.includes('crm & automation') || 
    id.includes('crm-automation') || 
    id === 'mod-crm-automation' ||
    id === 'connectors-webhooks'
  ) {
    return 'Service';
  }

  if (
    title.includes('studio de choix et construction') || 
    id.includes('theme-builder') ||
    id === 'mod-theme-builder-studio'
  ) {
    return 'Service';
  }

  if (
    title.includes('centre de creation de cours') || 
    title.includes('centre de création de cours') || 
    title.includes('espace formateur') || 
    id.includes('instructor')
  ) {
    return 'Service';
  }

  if (
    title.includes('centre de formation et d') || 
    title.includes('accompagnement') || 
    title.includes('aprend') || 
    id.includes('lms-academy')
  ) {
    return 'Service';
  }

  if (
    title.includes('nanaschish') || 
    title.includes('nana switch') || 
    title.includes('switch cloud') || 
    id.includes('nana-switch')
  ) {
    return 'Service';
  }

  if (
    title.includes('cours forge') || 
    title.includes('course forge') || 
    id.includes('cours-forge')
  ) {
    return 'Application';
  }

  if (
    title.includes('studio de generation de live') || 
    title.includes('studio de génération de live') || 
    id.includes('live-webinar')
  ) {
    return 'Application';
  }

  if (
    title.includes('wamett') || 
    title.includes('wameet') || 
    id.includes('wameet')
  ) {
    return 'Application';
  }

  if (
    title.includes('ultimate funnel') || 
    title.includes('funnel builder modulaire') || 
    title.includes('public deal') || 
    id.includes('ultimate-funnel') || 
    id.includes('modular-funnel') || 
    id.includes('public-deal')
  ) {
    return 'Application';
  }

  // 2. Détection [Module] prioritaire si c'est explicitement un module compagnon/fils
  if (item.isCompanion || id.startsWith('mod_') || item.companionFor) {
    return 'Module';
  }

  // 3. Détection [Service] : Livraisons, SMS direct, campagnes marketing, passerelles, coaching, formation
  if (
    title.includes('livraison') ||
    title.includes('sms') ||
    title.includes('campagne') ||
    title.includes('service') ||
    title.includes('formation') ||
    title.includes('coaching') ||
    title.includes('passerelle') ||
    title.includes('paiement') ||
    title.includes('support') ||
    title.includes('conciergerie') ||
    cat.includes('formation & coaching') ||
    cat.includes('service') ||
    cat.includes('communication & réseau') ||
    id.includes('delivery') ||
    id.includes('sms')
  ) {
    return 'Service';
  }

  // 4. Détection [Outil] : Matériel, périphériques, scanner, imprimante, importateurs, converters, PDF
  if (
    title.includes('scanner') ||
    title.includes('douchette') ||
    title.includes('imprimante') ||
    title.includes('barcode') ||
    title.includes('code-barre') ||
    title.includes('import') ||
    title.includes('export') ||
    title.includes('pdf') ||
    title.includes('excel') ||
    id.includes('scanner') ||
    id.includes('printer') ||
    id.includes('importer') ||
    cat.includes('technologie & api') ||
    cat.includes('matériel') ||
    cat.includes('outil')
  ) {
    return 'Outil';
  }

  // 5. Détection [Application] : Grandes applications autonomes et plateformes racines
  if (
    item.isRootApp ||
    title.includes('caisse') ||
    title.includes('pos') ||
    title.includes('studio') ||
    title.includes('tunnel') ||
    title.includes('nanagénérateur') ||
    title.includes('nanagenerator') ||
    title.includes('crm') ||
    title.includes('wameet') ||
    title.includes('boutique') ||
    title.includes('store') ||
    cat.includes('commerce') ||
    cat.includes('application')
  ) {
    return 'Application';
  }

  // 6. Détection [Module] : Sous-fonctionnalités, extensions, fiches de gestion, clôture, carnet, inventaire
  if (
    title.includes('module') ||
    title.includes('stock') ||
    title.includes('inventaire') ||
    title.includes('factur') ||
    title.includes('devis') ||
    title.includes('dette') ||
    title.includes('crédit') ||
    title.includes('clôture') ||
    title.includes('shift') ||
    title.includes('conseiller') ||
    cat.includes('gestion & stock') ||
    cat.includes('finances & trésorerie')
  ) {
    return 'Module';
  }

  return item.isRootApp ? 'Application' : 'Module';
}

/**
 * CONDITION 2 : Calcul de 4 suggestions de succession pertinentes selon la recherche du client
 * Règle stricte : MAXIMUM 4 MODULES (Interdit de déverser tous les modules)
 */
export function getSuccessionSuggestions(
  primaryModule: any,
  allAvailableCards: any[]
): any[] {
  if (!primaryModule) return [];

  const excludedIds = new Set<string>([
    primaryModule.id,
    (primaryModule.title || '').toLowerCase()
  ]);

  const candidates: any[] = [];

  const addCandidate = (item: any) => {
    if (!item) return;
    const id = item.id;
    const title = (item.title || item.appName || '').toLowerCase();
    if (!excludedIds.has(id) && !excludedIds.has(title)) {
      excludedIds.add(id);
      excludedIds.add(title);
      candidates.push({
        id: item.id,
        title: item.title || item.appName,
        subtitle: item.subtitle || item.category || '',
        description: item.description || item.shortDescription || '',
        palmares: item.palmares || item.badgePalmares || '⭐ 98% de satisfaction',
        trialBadge: item.trialBadge || item.trialLabel || 'Essai disponible',
        mediaUrl: item.mediaUrl || item.appLogo || '',
        mediaType: 'image' as const,
        routeUrl: item.routeUrl || item.route || `/dashboard/apps/${item.id}`,
        targetView: item.targetView,
        tutorialUrl: item.tutorialUrl || ''
      });
    }
  };

  const primaryTitle = (primaryModule.title || '').toLowerCase();
  const primaryCategory = (primaryModule.subtitle || primaryModule.category || primaryModule.rowTitle || '').toLowerCase();

  // A. Paires de workflow métier stratégiques (succession naturelle)
  const WORKFLOW_PAIRS: Record<string, string[]> = {
    whatsapp: ['pos', 'funnel-builder', 'sms-broadcast', 'crm-pro'],
    caisse: ['inventory', 'invoices', 'credit-book', 'whatsapp'],
    pos: ['inventory', 'invoices', 'credit-book', 'whatsapp'],
    stock: ['pos', 'invoices', 'delivery-tracker', 'barcode-scanner'],
    inventaire: ['pos', 'invoices', 'delivery-tracker', 'barcode-scanner'],
    nanagenerator: ['funnel-builder', 'studio-ia', 'ai-gemini', 'pos'],
    ia: ['nanagenerator', 'funnel-builder', 'studio-ia', 'pos'],
    funnel: ['whatsapp-crm', 'nanagenerator', 'pos', 'delivery-tracker'],
    tunnel: ['whatsapp-crm', 'nanagenerator', 'pos', 'delivery-tracker'],
    factur: ['pos', 'debts', 'accounting', 'docusign'],
    devis: ['pos', 'debts', 'accounting', 'docusign'],
    livraison: ['pos', 'whatsapp-crm', 'invoices', 'inventory'],
    dette: ['pos', 'invoices', 'accounting', 'whatsapp-crm']
  };

  const matchedKey = Object.keys(WORKFLOW_PAIRS).find((k) => primaryTitle.includes(k) || (primaryModule.id || '').includes(k));
  if (matchedKey) {
    const desiredIds = WORKFLOW_PAIRS[matchedKey];
    for (const dId of desiredIds) {
      const match = allAvailableCards.find(
        (c) =>
          c.id === dId ||
          c.id.includes(dId) ||
          (c.title || '').toLowerCase().includes(dId)
      );
      if (match) addCandidate(match);
      if (candidates.length >= 4) break;
    }
  }

  // B. Suggestions complémentaires dans la MÊME catégorie
  if (candidates.length < 4) {
    const sameCatMatches = allAvailableCards.filter((c) => {
      const s = (c.subtitle || c.category || c.rowTitle || '').toLowerCase();
      return primaryCategory && (s.includes(primaryCategory) || primaryCategory.includes(s));
    });
    for (const item of sameCatMatches) {
      addCandidate(item);
      if (candidates.length >= 4) break;
    }
  }

  // C. Suggestions des applications indispensables / piliers Nanasore
  if (candidates.length < 4) {
    const flagshipKeywords = ['caisse', 'nanagénérateur', 'whatsapp', 'tunnels', 'stock', 'factures'];
    for (const fKey of flagshipKeywords) {
      const match = allAvailableCards.find((c) => (c.title || '').toLowerCase().includes(fKey));
      if (match) addCandidate(match);
      if (candidates.length >= 4) break;
    }
  }

  // STRICTEMENT 4 MODULES AU MAXIMUM (Interdit de déverser tous les modules)
  return candidates.slice(0, 4);
}

export const CentralHubOmnibar: React.FC<CentralHubOmnibarProps> = ({
  onNavigate,
  onOpenApp,
  className = '',
  placeholder
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Normalisation & assainissement absolu des données Firebase RTDB (Array ou Object)
  const normalizeHubData = (rawData: any): HubRowItem[] => {
    if (!rawData) return [];
    let list: any[] = [];
    if (Array.isArray(rawData)) {
      list = rawData.filter(Boolean);
    } else if (typeof rawData === 'object') {
      list = Object.values(rawData).filter(Boolean);
    }

    if (list.length === 0) return [];

    const sanitizeCard = (c: any, cIdx: number) => {
      const sanitizedUrl = cleanUrl(c?.mediaUrl || c?.url);
      let sanitizedBlocks = c?.blocks;
      if (Array.isArray(c?.blocks)) {
        sanitizedBlocks = c.blocks.map((b: any) => {
          if (b.type === 'image' || b.type === 'video') {
            return { ...b, url: cleanUrl(b.url) };
          }
          return b;
        });
      }
      return {
        ...c,
        id: c?.id || `card-${cIdx}`,
        mediaUrl: sanitizedUrl,
        blocks: sanitizedBlocks
      };
    };

    const hasRows = list.some(item => item && (item.cards || item.rowTitle || (item.title && (Array.isArray(item.cards) || typeof item.cards === 'object'))));
    if (!hasRows) {
      return [{
        id: 'default-row',
        rowTitle: 'Applications & Services',
        cards: list.map(sanitizeCard)
      }];
    }

    return list.map((row: any, idx: number) => {
      let rowCards: any[] = [];
      if (Array.isArray(row?.cards)) {
        rowCards = row.cards.filter(Boolean);
      } else if (row?.cards && typeof row.cards === 'object') {
        rowCards = Object.values(row.cards).filter(Boolean);
      }
      return {
        ...row,
        id: row?.id || `row-${idx}`,
        rowTitle: row?.rowTitle || row?.title || 'Section',
        cards: rowCards.map(sanitizeCard)
      };
    });
  };

  const [blocks, setBlocks] = useState<any[]>(() => {
    try {
      const local = typeof window !== 'undefined' ? localStorage.getItem('central_hub_config') : null;
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
        if (parsed.blocks && Array.isArray(parsed.blocks)) return parsed.blocks;
        if (typeof parsed === 'object') return Object.values(parsed).filter(Boolean);
      }
    } catch (_) {}
    return [];
  });

  const [configRows, setConfigRows] = useState<HubRowItem[]>(() => {
    try {
      const local = typeof window !== 'undefined' ? localStorage.getItem('central_hub_config') : null;
      if (local) {
        const parsed = JSON.parse(local);
        const normalized = normalizeHubData(parsed);
        if (normalized.length > 0) return normalized;
      }
    } catch (_) {}
    return [];
  });

  // 1. Synchronisation temps-réel avec Firebase RTDB (/central_hub_config)
  useEffect(() => {
    const hubConfigRef = ref(rtdb, 'central_hub_config');

    const unsubscribe = onValue(hubConfigRef, (snapshot) => {
      if (snapshot.exists()) {
        const rawData = snapshot.val();
        console.log("🔥 [OMNIBAR RTDB RAW DATA]:", rawData);

        let parsedBlocks: any[] = [];

        // 1. Si c'est déjà un tableau
        if (Array.isArray(rawData)) {
          parsedBlocks = rawData.filter(Boolean);
        } 
        // 2. Si RTDB l'a converti en objet indexé { "0": {...}, "1": {...} }
        else if (typeof rawData === 'object' && rawData !== null) {
          if (rawData.blocks && Array.isArray(rawData.blocks)) {
            parsedBlocks = rawData.blocks;
          } else {
            parsedBlocks = Object.values(rawData).filter(Boolean);
          }
        }

        console.log("✅ [OMNIBAR PARSED BLOCKS]:", parsedBlocks);
        setBlocks(parsedBlocks);
        const normalized = normalizeHubData(parsedBlocks);
        setConfigRows(normalized);
        try {
          localStorage.setItem('central_hub_config', JSON.stringify(parsedBlocks));
        } catch (_) {}
      } else {
        console.warn("⚠️ [OMNIBAR]: Aucun bloc trouvé sous /central_hub_config");
        setBlocks([]);
      }
    }, (error) => {
      console.error("❌ [OMNIBAR RTDB ERROR]:", error);
    });

    const handleLocalUpdate = () => {
      try {
        const local = localStorage.getItem('central_hub_config');
        if (local) {
          const parsed = JSON.parse(local);
          let parsedBlocks: any[] = [];
          if (Array.isArray(parsed)) {
            parsedBlocks = parsed.filter(Boolean);
          } else if (typeof parsed === 'object' && parsed !== null) {
            if (parsed.blocks && Array.isArray(parsed.blocks)) {
              parsedBlocks = parsed.blocks;
            } else {
              parsedBlocks = Object.values(parsed).filter(Boolean);
            }
          }
          setBlocks(parsedBlocks);
          const normalized = normalizeHubData(parsedBlocks);
          setConfigRows(normalized);
        }
      } catch (_) {}
    };

    window.addEventListener('storage', handleLocalUpdate);
    window.addEventListener('central_hub_config_updated', handleLocalUpdate);
    const handleOpenOmnibar = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    window.addEventListener('nanasore_open_omnibar', handleOpenOmnibar);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleLocalUpdate);
      window.removeEventListener('central_hub_config_updated', handleLocalUpdate);
      window.removeEventListener('nanasore_open_omnibar', handleOpenOmnibar);
    };
  }, []);

  // 2. Blocage du scroll de l'arrière-plan quand l'overlay est actif (Masquage total)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
      setHoveredCardId(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 3. Gestion des raccourcis clavier (Échap pour fermer, Ctrl+K / Cmd+K pour ouvrir)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Extraction sécurisée des propriétés d'une carte (qu'elle soit au format blocs modulaire ou plate)
  const getCardDetails = (card: any): HubCardItem => {
    if (!card) {
      return {
        id: `card-${Math.random()}`,
        title: 'Module',
        routeUrl: '',
        subtitle: '',
        palmares: '',
        description: '',
        mediaType: 'image',
        mediaUrl: '',
        tutorialUrl: '',
        trialBadge: '',
        isRootApp: false,
        linkedModuleIds: []
      };
    }
    const linkedModuleIds = card.linkedModuleIds || (card.blocks && Array.isArray(card.blocks) && card.blocks.find((b: any) => b?.linkedModuleIds)?.linkedModuleIds) || [];
    const isRootApp = Boolean(card.isRootApp || (linkedModuleIds && linkedModuleIds.length > 0));
    const fallbackRoute = card.routeUrl || (card.id === 'card-3' ? '/dashboard/apps/pos' : card.id === 'card-1' ? '/dashboard/apps/ai-generator' : card.id === 'card-2' ? '/dashboard/apps/wameet' : '');

    if (card.blocks && Array.isArray(card.blocks)) {
      const h = card.blocks.find((b: any) => b?.type === 'header');
      const d = card.blocks.find((b: any) => b?.type === 'description');
      const m = card.blocks.find((b: any) => b?.type === 'image' || b?.type === 'video');
      const c = card.blocks.find((b: any) => b?.type === 'cta');
      return {
        id: card.id || `card-${Math.random()}`,
        title: card.title || h?.title || 'Module',
        routeUrl: card.routeUrl || fallbackRoute,
        subtitle: card.subtitle || h?.badge || card.palmares || '',
        palmares: card.palmares || h?.badge || '',
        description: card.description || d?.text || '',
        mediaType: card.mediaType || (m ? m.type : 'image'),
        mediaUrl: card.mediaUrl || m?.url || '',
        tutorialUrl: card.tutorialUrl || c?.tutorialUrl || '',
        trialBadge: card.trialBadge || c?.trialBadge || '',
        targetView: card.targetView,
        isRootApp,
        linkedModuleIds,
        blocks: card.blocks || []
      };
    }
    return {
      id: card.id || `card-${Math.random()}`,
      title: card.title || 'Module',
      routeUrl: card.routeUrl || fallbackRoute,
      subtitle: card.subtitle || card.palmares || '',
      palmares: card.palmares || '',
      description: card.description || '',
      mediaType: card.mediaType || 'image',
      mediaUrl: card.mediaUrl || '',
      tutorialUrl: card.tutorialUrl || '',
      trialBadge: card.trialBadge || '',
      targetView: card.targetView,
      isRootApp,
      linkedModuleIds,
      blocks: card.blocks || []
    };
  };

  // Catégories déduites des rangées RTDB + catalogue des 35+ applications Nanasore
  const categories = useMemo(() => {
    const list: string[] = [];
    if (blocks && Array.isArray(blocks)) {
      blocks.forEach((r: any) => {
        const t = r?.rowTitle || r?.title;
        if (t) list.push(t);
      });
    }
    APPS_REGISTRY.forEach((app) => {
      if (app.category) list.push(app.category);
    });
    return Array.from(new Set(list));
  }, [blocks]);

  // =========================================================================
  // RECHERCHE STRUCTURÉE (CONDITION 1 & CONDITION 2) :
  // - Quand on ne tape rien : RIEN NE SORT (prompt propre des 35+ modules)
  // - Quand on tape un module :
  //   * Le module sort en haut comme Module Principal
  //   * Condition 1 : S'il a des modules liés -> ils suivent en bas
  //   * Condition 2 : S'il n'a pas de modules liés -> UNIQUEMENT 4 modules de succession (interdit de tout déverser)
  // =========================================================================
  const structuredOutput = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const activeCat = selectedCategory ? selectedCategory.toLowerCase() : null;

    if (!q && !activeCat) {
      return null;
    }

    // 1. Aplatir toutes les cartes des blocs RTDB avec leur contexte de rangée et de liens
    const rtdbCardsWithContext: any[] = [];
    if (blocks && Array.isArray(blocks)) {
      blocks.forEach((row: any, rIdx: number) => {
        const rowTitle = row?.rowTitle || row?.title || `Section ${rIdx + 1}`;
        const rawCards = Array.isArray(row?.cards)
          ? row.cards
          : (row?.cards && typeof row.cards === 'object' ? Object.values(row.cards) : []);

        const extractedRowCards = rawCards.map((c: any, cIdx: number) => {
          const card = getCardDetails(c);
          return {
            ...card,
            id: card.id || `card-${rIdx}-${cIdx}`,
            rowTitle,
            isRtdb: true
          };
        });

        extractedRowCards.forEach((c: any) => {
          rtdbCardsWithContext.push({
            ...c,
            allRowCards: extractedRowCards
          });
        });
      });
    }

    // 2. Normaliser les 37 mini-applications officielles Nanasore (APPS_REGISTRY)
    const registryCards: any[] = APPS_REGISTRY.map((app) => ({
      id: app.id,
      title: app.appName,
      subtitle: app.category,
      category: app.category,
      description: app.shortDescription,
      palmares: app.badgePalmares || app.palmares || '⭐ 98% de satisfaction',
      trialBadge: app.trialLabel || 'Essai disponible',
      mediaUrl: app.appLogo || '',
      mediaType: 'image' as const,
      routeUrl: app.route || `/dashboard/apps/${app.id}`,
      targetView: app.targetView,
      taxonomyType: app.taxonomyType || (app as any).taxonomy,
      badge: app.badge,
      isRootApp: false,
      linkedModuleIds: [],
      keywords: app.keywords || [],
      isRtdb: false
    }));

    // Fusionner sans doublons : Priorité absolue aux modules configurés dans la RTDB par le Super-Admin
    const allAvailableCards: any[] = [...rtdbCardsWithContext];
    const existingIds = new Set(rtdbCardsWithContext.map((c) => c.id));
    const existingTitles = new Set(rtdbCardsWithContext.map((c) => (c.title || '').toLowerCase()));
    const hasRtdbCaisse = rtdbCardsWithContext.some((c) => (c.title || '').toLowerCase().includes('caisse'));
    const hasRtdbNanagenerator = rtdbCardsWithContext.some((c) => (c.title || '').toLowerCase().includes('nanagénérateur') || (c.title || '').toLowerCase().includes('nanagenerateur'));

    registryCards.forEach((rc) => {
      const tLower = rc.title.toLowerCase();
      if (hasRtdbCaisse && (rc.id === 'pos' || tLower.includes('caisse'))) return;
      if (hasRtdbNanagenerator && (rc.id === 'nanagenerator' || tLower.includes('nanagénérateur') || tLower.includes('nanagenerateur'))) return;
      if (existingIds.has(rc.id) || existingTitles.has(tLower)) return;
      allAvailableCards.push(rc);
    });

    // 3. Calculer les correspondances et le score de pertinence
    const scoredMatches: { card: any; score: number }[] = [];

    allAvailableCards.forEach((card) => {
      const t = (card.title || '').toLowerCase();
      const d = (card.description || '').toLowerCase();
      const p = (card.palmares || '').toLowerCase();
      const s = (card.subtitle || card.category || card.rowTitle || '').toLowerCase();
      const kw = Array.isArray(card.keywords) ? card.keywords.map((k: string) => k.toLowerCase()) : [];

      if (activeCat && !s.includes(activeCat) && !t.includes(activeCat)) {
        return;
      }

      if (!q) {
        scoredMatches.push({ card, score: card.isRootApp ? 100 : 50 });
        return;
      }

      let score = 0;
      if (t === q) score += 1200;
      else if (t.startsWith(q)) score += 800;
      else if (t.includes(q)) score += 400;

      if (kw.some((k: string) => k === q)) score += 500;
      else if (kw.some((k: string) => k.includes(q))) score += 250;

      if (d.includes(q)) score += 100;
      if (p.includes(q)) score += 80;
      if (s.includes(q)) score += 60;
      if (card.isRootApp) score += 100;
      if (card.isRtdb) score += 300; // Priorité aux modules réels configurés en RTDB

      if (score > 0) {
        scoredMatches.push({ card, score });
      }
    });

    if (scoredMatches.length === 0) {
      return null;
    }

    // Trier par score décroissant : le meilleur match est le MODULE PRINCIPAL
    scoredMatches.sort((a, b) => b.score - a.score);
    const primaryMatch = scoredMatches[0].card;

    // 4. CONDITION 1 : Déterminer si le Module Principal a des modules liés
    let linkedModules: any[] = [];
    const primaryLinkedIds: string[] = Array.isArray(primaryMatch.linkedModuleIds) ? primaryMatch.linkedModuleIds : [];

    if (primaryMatch.allRowCards && Array.isArray(primaryMatch.allRowCards)) {
      const siblings = primaryMatch.allRowCards.filter((c: any) => c.id !== primaryMatch.id);
      if (primaryLinkedIds.length > 0) {
        linkedModules = siblings.filter((c: any) => primaryLinkedIds.includes(c.id));
        if (linkedModules.length === 0) {
          linkedModules = siblings.filter((c: any) => !c.isRootApp);
        }
      } else if (primaryMatch.isRootApp) {
        linkedModules = siblings;
      }
    }

    const hasLinkedModules = linkedModules.length > 0;

    // 5. CONDITION 2 : S'il n'y a pas de modules liés, calculer STRICTEMENT 4 modules de succession
    let suggestedModules: any[] = [];
    if (!hasLinkedModules) {
      suggestedModules = getSuccessionSuggestions(primaryMatch, allAvailableCards);
    }

    return {
      primaryModule: primaryMatch,
      hasLinkedModules,
      linkedModules,
      suggestedModules
    };
  }, [blocks, searchQuery, selectedCategory]);

  // État des cases à cocher pour les modules associés
  const [checkedModules, setCheckedModules] = useState<Record<string, boolean>>({});

  const toggleModuleCheck = (modId: string) => {
    setCheckedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const hasSearchInput = Boolean(searchQuery.trim() || selectedCategory);

  const handleOpenTutorial = (e: React.MouseEvent, tutorialUrl?: string) => {
    e.stopPropagation();
    if (tutorialUrl) {
      window.open(cleanUrl(tutorialUrl), '_blank');
    } else {
      alert("Ce module dispose d'un tutoriel vidéo interactif bientôt disponible !");
    }
  };

  const handleActivateModule = (e: React.MouseEvent, card: HubCardItem, activatedSubModuleIds?: string[]) => {
    e.stopPropagation();
    setIsOpen(false);

    if (onOpenApp) {
      onOpenApp({ ...card, activatedSubModuleIds });
      return;
    }

    if (onNavigate) {
      if (card.targetView) {
        onNavigate(card.targetView);
        return;
      }
      const titleLower = (card.title || '').toLowerCase();
      const routeLower = (card.routeUrl || '').toLowerCase();
      const idLower = (card.id || '').toLowerCase();

      if (titleLower.includes('caisse') || routeLower.includes('pos') || idLower.includes('pos')) {
        onNavigate('POS');
        return;
      }
      if (titleLower.includes('stock') || titleLower.includes('inventaire') || routeLower.includes('inventory')) {
        onNavigate('INVENTORY');
        return;
      }
      if (titleLower.includes('factur') || titleLower.includes('devis') || routeLower.includes('invoice')) {
        onNavigate('INVOICES');
        return;
      }
      if (titleLower.includes('dette') || titleLower.includes('credit') || routeLower.includes('debt')) {
        onNavigate('CUSTOMERS');
        return;
      }
      if (titleLower.includes('crm') || routeLower.includes('crm')) {
        onNavigate('CRM');
        return;
      }
    }

    if (card.routeUrl && card.routeUrl !== '#') {
      window.history.pushState({}, '', card.routeUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.dispatchEvent(new CustomEvent('app_navigate', { detail: { path: card.routeUrl } }));
    }

    if (activatedSubModuleIds && activatedSubModuleIds.length > 0) {
      alert(`⚡ Application « ${card.title} » activée avec succès ainsi que ${activatedSubModuleIds.length} module(s) associé(s) : [${activatedSubModuleIds.join(', ')}] !`);
    } else {
      alert(`⚡ Module « ${card.title} » activé avec succès ! (${card.trialBadge || 'Essai disponible'})`);
    }
  };

  return (
    <>
      {/* =========================================================================
          1. BARRE STATIQUE FIXÉE DANS LE HEADER (STICKY TOP-0)
         ========================================================================= */}
      <div className={`w-full max-w-2xl mx-auto ${className}`}>
        <div
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="flex items-center gap-3 px-4 py-2 sm:py-2.5 bg-white border border-slate-300 rounded-xl shadow-xs hover:border-[#4169E1] transition-all group cursor-pointer"
          role="search"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-[#4169E1] transition-colors shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              if (!isOpen) setIsOpen(true);
            }}
            placeholder={placeholder || "Tapez pour chercher un Service, une Application, un Module ou un Outil..."}
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:outline-none cursor-text font-medium"
            aria-label="Rechercher un module"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200 shrink-0 pointer-events-none">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* =========================================================================
          2. OVERLAY SOMBRE PLEIN ÉCRAN & FLOUTÉ (PORTAIL DIRECT SUR DOCUMENT.BODY)
         ========================================================================= */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-start pt-4 sm:pt-8 px-3 sm:px-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop plein écran clicable pour fermer */}
          <div 
            className="absolute inset-0 z-0 bg-slate-950/80 backdrop-blur-md cursor-pointer" 
            onClick={() => setIsOpen(false)} 
          />

          {/* =======================================================================
              PANNEAU PRINCIPAL CENTRAL HUB (MODÈLE 1 COLONNE STACK)
             ======================================================================= */}
          <div className="relative z-10 w-full max-w-4xl bg-[#1E1E2E] rounded-2xl shadow-2xl border border-[#4169E1]/40 overflow-hidden flex flex-col max-h-[88vh] animate-in slide-in-from-top-4 duration-200">
            
            {/* Header Input avec icône loupe et bouton de fermeture */}
            <div className="flex items-center gap-3 px-5 py-4 bg-[#181825] border-b border-slate-800 shrink-0">
              <Search className="w-6 h-6 text-[#4169E1] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tapez pour chercher un Service, une Application, un Module ou un Outil..."
                className="w-full bg-transparent text-white placeholder-slate-400 text-base sm:text-lg focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Effacer la recherche"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Fermer l'overlay (Échap)"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Catégories rapides en pilules horizontales */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-[#141420] border-b border-slate-800/80 overflow-x-auto text-xs shrink-0 scrollbar-none">
                <span className="text-slate-400 shrink-0 font-medium">Catégories :</span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      if (selectedCategory === cat) {
                        setSelectedCategory(null);
                      } else {
                        setSelectedCategory(cat);
                      }
                    }}
                    className={`px-3 py-1 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#4169E1] text-white shadow-xs'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs text-rose-400 hover:underline shrink-0 ml-1 cursor-pointer"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            )}

            {/* =======================================================================
                ZONE DE CONTENU : RECHERCHE STRUCTURÉE (CONDITION 1 & CONDITION 2)
               ======================================================================= */}
            <div className="p-6 overflow-y-auto space-y-6 h-[600px] scrollbar-thin scrollbar-thumb-slate-700">
              {!searchQuery.trim() && !selectedCategory ? (
                /* État initial : Quand on touche la barre, RIEN ne sort par défaut */
                <div className="py-14 px-6 text-center text-slate-400 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#28283D] border border-slate-700/80 flex items-center justify-center mb-4 text-3xl shadow-xl shadow-blue-950/30">
                    🔍
                  </div>
                  <h4 className="text-base font-bold text-slate-200">
                    Rechercher parmi les 35+ Services, Applications, Modules et Outils Nanasore
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
                    Tapez le nom d'un élément pour l'afficher (ex : <strong>Caisse</strong>, <strong>Nanagénérateur</strong>, <strong>WhatsApp</strong>, <strong>Stock</strong>, <strong>Factures</strong>, <strong>Tunnels</strong>)...
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-5 max-w-lg">
                    {['Caisse', 'Nanagénérateur', 'Stock', 'Comptabilité', 'WhatsApp', 'Tunnels', 'Devis', 'Livraison'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSearchQuery(tag.toLowerCase())}
                        className="px-3 py-1 bg-slate-800/80 hover:bg-[#4169E1]/20 hover:border-[#4169E1] text-slate-300 hover:text-white rounded-lg text-xs border border-slate-700 transition cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : !structuredOutput ? (
                /* Aucun résultat pour la recherche tapée */
                <div className="py-14 px-6 text-center text-slate-400 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-3 text-xl">
                    🔍
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    Aucun module trouvé pour « {searchQuery || selectedCategory} »
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Vérifiez l'orthographe ou parcourez nos catégories ci-dessus.
                  </p>
                </div>
              ) : (
                /* RÉSULTAT DE SORTIE DE BLOC STRUCTURÉ */
                <div className="space-y-6">

                  {/* 1. MODULE PRINCIPAL : SORT EN HAUT */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ⭐ Module Principal
                        </span>
                        {structuredOutput.primaryModule.subtitle && (
                          <span className="text-xs text-slate-400 font-medium">
                            {structuredOutput.primaryModule.subtitle}
                          </span>
                        )}
                      </div>
                      {structuredOutput.primaryModule.palmares && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/25">
                          {structuredOutput.primaryModule.palmares}
                        </span>
                      )}
                    </div>

                    {/* Présentation Épurée Sans Carte : Le Nom est un Lien Allumant Bleu */}
                    <div className="py-3.5 px-4 rounded-xl bg-blue-950/20 border border-blue-500/30 hover:border-blue-400/60 transition-all shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <a
                              href={structuredOutput.primaryModule.routeUrl || '#'}
                              onClick={(e) => {
                                e.preventDefault();
                                handleActivateModule(e, structuredOutput.primaryModule);
                              }}
                              className="text-base sm:text-lg font-black text-blue-400 hover:text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.85)] hover:drop-shadow-[0_0_14px_rgba(96,165,250,1)] transition-all duration-200 cursor-pointer hover:underline inline-flex items-center gap-1.5"
                              style={{ textShadow: '0 0 10px rgba(59, 130, 246, 0.8), 0 0 20px rgba(37, 99, 235, 0.4)' }}
                            >
                              <span>{structuredOutput.primaryModule.title}</span>
                              <ExternalLink className="w-4 h-4 text-blue-400 shrink-0 drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                            </a>
                            <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold tracking-wider bg-blue-500/15 text-blue-300 border border-blue-400/30 shadow-xs shadow-blue-500/10 shrink-0">
                              [{getTaxonomyBadge(structuredOutput.primaryModule)}]
                            </span>
                            {structuredOutput.primaryModule.trialBadge && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-500/15 text-blue-300 rounded-full border border-blue-500/30 shrink-0">
                                {structuredOutput.primaryModule.trialBadge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2">
                            {structuredOutput.primaryModule.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                          {structuredOutput.primaryModule.tutorialUrl && (
                            <button 
                              type="button"
                              onClick={(e) => handleOpenTutorial(e, structuredOutput.primaryModule.tutorialUrl)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-600 transition cursor-pointer active:scale-95"
                            >
                              ▶️ Voir Tuto
                            </button>
                          )}
                          <button 
                            type="button"
                            onClick={(e) => handleActivateModule(e, structuredOutput.primaryModule)}
                            className="px-4 py-1.5 bg-[#4169E1] hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md shadow-[#4169E1]/20 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>{getTaxonomyBadge(structuredOutput.primaryModule) === 'Outil' ? '🛒 Acheter' : '⚡ Activer'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. CONDITION 1 : LES MODULES LIÉS AU MODULE PRINCIPAL SUIVENT EN BAS */}
                  {structuredOutput.hasLinkedModules && structuredOutput.linkedModules.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#4169E1]" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#4169E1]">
                            Modules Liés au Module Principal ({structuredOutput.linkedModules.length})
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Cochez pour activer simultanément
                        </span>
                      </div>

                      <div className="space-y-2">
                        {structuredOutput.linkedModules.map((mod: any, mIdx: number) => {
                          const checked = !!checkedModules[mod.id];
                          return (
                            <div 
                              key={mod.id || mIdx}
                              onClick={() => toggleModuleCheck(mod.id)}
                              className={`py-2 px-3 rounded-lg transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer border ${
                                checked 
                                  ? 'border-[#4169E1] bg-blue-950/30 shadow-xs' 
                                  : 'border-slate-800/80 hover:border-blue-500/30 bg-slate-900/30 hover:bg-slate-900/60'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                <div className="pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <input 
                                    type="checkbox"
                                    id={`check-${mod.id}`}
                                    checked={checked}
                                    onChange={() => toggleModuleCheck(mod.id)}
                                    className="w-4 h-4 rounded accent-[#4169E1] cursor-pointer"
                                  />
                                </div>
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <a
                                      href={mod.routeUrl || '#'}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleActivateModule(e, mod);
                                      }}
                                      className="text-xs sm:text-sm font-bold text-blue-400 hover:text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.85)] hover:drop-shadow-[0_0_12px_rgba(96,165,250,1)] transition-all cursor-pointer hover:underline inline-flex items-center gap-1"
                                      style={{ textShadow: '0 0 8px rgba(59, 130, 246, 0.75)' }}
                                    >
                                      <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0 drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                                      <span>{mod.title}</span>
                                    </a>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold tracking-wider bg-blue-500/15 text-blue-300 border border-blue-400/30 shadow-xs shrink-0">
                                      [{getTaxonomyBadge(mod)}]
                                    </span>
                                    {mod.palmares && (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                                        {mod.palmares}
                                      </span>
                                    )}
                                    {mod.trialBadge && (
                                      <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20">
                                        {mod.trialBadge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-300 line-clamp-1">{mod.description}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                {mod.tutorialUrl && (
                                  <button 
                                    type="button"
                                    onClick={(e) => handleOpenTutorial(e, mod.tutorialUrl)}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-600 transition"
                                  >
                                    ▶️ Tuto
                                  </button>
                                )}
                                <button 
                                  type="button"
                                  onClick={(e) => handleActivateModule(e, mod)}
                                  className="px-2.5 py-1 bg-[#4169E1] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition cursor-pointer active:scale-95"
                                >
                                  {getTaxonomyBadge(mod) === 'Outil' ? '🛒 Acheter seul' : '⚡ Activer seul'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Barre collective d'activation */}
                      <div className="pt-2">
                        <div className="bg-gradient-to-r from-blue-950/60 to-slate-900 border border-[#4169E1]/40 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="text-xs text-slate-300">
                            Options sélectionnées : <strong className="text-emerald-400">{structuredOutput.linkedModules.filter((m: any) => !!checkedModules[m.id]).length}</strong> sur {structuredOutput.linkedModules.length} module(s)
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={(e) => handleActivateModule(e, structuredOutput.primaryModule)}
                              className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-600 transition"
                            >
                              {getTaxonomyBadge(structuredOutput.primaryModule) === 'Outil' ? `Acheter ${structuredOutput.primaryModule.title} seule` : `Activer ${structuredOutput.primaryModule.title} seule`}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                const selectedMods = structuredOutput.linkedModules.filter((m: any) => !!checkedModules[m.id]).map((m: any) => m.id);
                                handleActivateModule(e, structuredOutput.primaryModule, selectedMods);
                              }}
                              className="flex-1 sm:flex-initial px-4 py-1.5 bg-[#4169E1] hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-[#4169E1]/30 transition"
                            >
                              {getTaxonomyBadge(structuredOutput.primaryModule) === 'Outil' ? '🛒 Acheter Tout Ensemble' : '⚡ Activer Tout Ensemble'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. CONDITION 2 : S'IL N'Y A PAS DE MODULES LIÉS -> UNIQUEMENT 4 AUTRES MODULES DE SUCCESSION */}
                  {!structuredOutput.hasLinkedModules && structuredOutput.suggestedModules && structuredOutput.suggestedModules.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                            Modules de succession conseillés (4 suggestions utiles selon vos recherches)
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Recommandations ciblées
                        </span>
                      </div>

                      <div className="space-y-2">
                        {structuredOutput.suggestedModules.map((sug: any, sIdx: number) => (
                          <div 
                            key={sug.id || sIdx}
                            className="py-2.5 px-3.5 rounded-xl border border-slate-800/80 hover:border-blue-500/40 bg-slate-900/30 hover:bg-slate-900/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                          >
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <a
                                  href={sug.routeUrl || '#'}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleActivateModule(e, sug);
                                  }}
                                  className="text-xs sm:text-sm font-bold text-blue-400 hover:text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.85)] hover:drop-shadow-[0_0_12px_rgba(96,165,250,1)] transition-all cursor-pointer hover:underline inline-flex items-center gap-1"
                                  style={{ textShadow: '0 0 8px rgba(59, 130, 246, 0.75)' }}
                                >
                                  <span>{sug.title}</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                </a>
                                <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold tracking-wider bg-blue-500/15 text-blue-300 border border-blue-400/30 shadow-xs shrink-0">
                                  [{getTaxonomyBadge(sug)}]
                                </span>
                                {sug.palmares && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 shrink-0">
                                    {sug.palmares}
                                  </span>
                                )}
                                {sug.trialBadge && (
                                  <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20 shrink-0">
                                    {sug.trialBadge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-300 line-clamp-1">{sug.description}</p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              {sug.tutorialUrl && (
                                <button 
                                  type="button"
                                  onClick={(e) => handleOpenTutorial(e, sug.tutorialUrl)}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold border border-slate-600 transition"
                                >
                                  ▶️ Tuto
                                </button>
                              )}
                              <button 
                                type="button"
                                onClick={(e) => handleActivateModule(e, sug)}
                                className="px-3 py-1 bg-[#4169E1] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition shadow-md active:scale-95"
                              >
                                {getTaxonomyBadge(sug) === 'Outil' ? '🛒 Acheter' : '⚡ Activer'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Pied du panneau overlay : Raccourci de fermeture */}
            <div className="px-5 py-2.5 bg-[#141420] border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
              <span>Appuyez sur <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Échap</kbd> ou cliquez à l'extérieur pour fermer</span>
              <span className="text-[#4169E1] font-semibold">Central Hub dynamique</span>
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default CentralHubOmnibar;
