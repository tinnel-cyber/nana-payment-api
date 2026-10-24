const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { 
  StoreUser, 
  AffiliateProfile, 
  ReferredStore, 
  AffiliateWithdrawal, 
  MobileMoneyProvider 
} from '../types';
import { 
  persistAffiliateProfile, 
  requestAffiliateWithdrawal 
} from '../utils/firestoreService';
import { formatCFA, playTapBeep, playValidationBeep } from '../utils/audio';
import {
  Users,
  Copy,
  Check,
  Wallet,
  ArrowUpRight,
  Store,
  X,
  MessageCircle,
  Facebook,
  Gift,
  CheckCircle2,
  TrendingUp,
  Percent
} from 'lucide-react';

interface AffiliateDashboardModalProps {
  currentUser?: StoreUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AffiliateDashboardModal: React.FC<AffiliateDashboardModalProps> = ({
  currentUser,
  isOpen,
  onClose,
}) => {
  const safeStoreId = currentUser?.storeId || 'store-nana-1';
  const safeName = currentUser?.name || 'Partenaire';
  const safePhone = currentUser?.phone || '';
  
  const affiliateCode = \`NANA-\${safeStoreId.slice(0, 5).toUpperCase()}\`;
  const referralLink = \`\${window.location.origin}/?ref=\${affiliateCode}\`;

  const [profile, setProfile] = useState<AffiliateProfile>({
    id: \`aff_\${safeStoreId}\`,
    storeId: safeStoreId,
    affiliateCode,
    name: safeName,
    phone: safePhone,
    commissionRate: 15, // 15%
    availableBalance: 12500, // Exemple initial
    totalEarned: 27500,
    referredStoresCount: 3,
    referredStores: [
      {
        storeId: 'str_ouaga_01',
        storeName: 'Alimentation du Faso',
        ownerName: 'Moussa Sawadogo',
        registeredAt: Date.now() - 15 * 86400000,
        status: 'ACTIVE',
        commissionGenerated: 7500,
      },
      {
        storeId: 'str_abidjan_04',
        storeName: 'Boutique Treichville',
        ownerName: 'Awa Koné',
        registeredAt: Date.now() - 8 * 86400000,
        status: 'ACTIVE',
        commissionGenerated: 5000,
      },
      {
        storeId: 'str_lome_09',
        storeName: 'Kiosque Assigamé',
        ownerName: 'Koffi Mensah',
        registeredAt: Date.now() - 2 * 86400000,
        status: 'TRIAL',
        commissionGenerated: 0,
      },
    ],
    createdAt: Date.now() - 30 * 86400000,
  });

  const [copied, setCopied] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(profile.availableBalance);
  const [withdrawProvider, setWithdrawProvider] = useState<MobileMoneyProvider>('ORANGE_MONEY');
  const [withdrawPhone, setWithdrawPhone] = useState(safePhone);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    playTapBeep();
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Erreur copie :', e);
    }
  };

  const shareText = \`Gérez votre boutique sans effort (Caisse tactile, stock, mode hors-ligne). Inscrivez-vous via mon lien partenaire : \${referralLink}\`;

  const handleShareWhatsApp = () => {
    playTapBeep();
    window.open(\`https://wa.me/?text=\${encodeURIComponent(shareText)}\`, '_blank');
  };

  const handleShareFacebook = () => {
    playTapBeep();
    window.open(\`https://www.facebook.com/sharer/sharer.php?u=\${encodeURIComponent(referralLink)}\`, '_blank');
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount < 5000 || withdrawAmount > profile.availableBalance) return;
    
    playTapBeep();
    
    const withdrawal: AffiliateWithdrawal = {
      id: \`WITH-\${Date.now().toString(36).toUpperCase()}\`,
      affiliateId: profile.id,
      affiliateName: profile.name,
      phone: withdrawPhone.trim() || profile.phone,
      amount: withdrawAmount,
      provider: withdrawProvider,
      status: 'PENDING',
      createdAt: Date.now(),
    };

    try {
      await requestAffiliateWithdrawal(withdrawal);
      playValidationBeep();
      setProfile((prev) => ({
        ...prev,
        availableBalance: prev.availableBalance - withdrawAmount,
      }));
      setWithdrawSuccess(true);
      setTimeout(() => {
        setWithdrawSuccess(false);
        setIsWithdrawOpen(false);
      }, 2500);
    } catch (err) {
      console.warn('Erreur demande retrait :', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white border border-slate-100 rounded-3xl shadow-2xl relative my-auto flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button
          type="button"
          onClick={() => { playTapBeep(); onClose(); }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-full transition-colors z-20 shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column : Hero & Links */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 sm:p-8 flex flex-col justify-between shrink-0 relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-inner">
              <Gift className="w-6 h-6 text-indigo-100" />
            </div>
            
            <h2 className="text-2xl font-black mb-2 tracking-tight">Programme Partenaires</h2>
            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
              Recommandez l'application à d'autres commerçants et gagnez <strong className="text-white">15% de commission</strong> récurrente sur chaque abonnement.
            </p>

            {/* Link Box */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl mb-6">
              <div className="text-xs font-semibold text-indigo-200 uppercase tracking-wider mb-2">Votre Lien de Parrainage</div>
              <div className="flex items-center justify-between bg-white/10 rounded-xl p-3 border border-white/10">
                <span className="text-xs font-mono font-medium truncate mr-3 text-indigo-50">
                  {referralLink}
                </span>
                <button
                  onClick={handleCopy}
                  className="bg-white text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600"/> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleShareWhatsApp}
                className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-transform active:scale-95 shadow-md shadow-emerald-900/20"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button
                onClick={handleShareFacebook}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-transform active:scale-95 shadow-md shadow-blue-900/20"
              >
                <Facebook className="w-4 h-4" /> Facebook
              </button>
            </div>
          </div>
        </div>

        {/* Right Column : Stats, Action & Table */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col bg-slate-50 relative overflow-y-auto max-h-[85vh]">
          
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 text-lg">Tableau de bord</h3>
            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 border border-indigo-200">
              <Percent className="w-3.5 h-3.5"/> 15% commission
            </span>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Solde Disponible</span>
              </div>
              <div className="text-2xl font-black text-slate-800">{formatCFA(profile.availableBalance)}</div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Total Gagné</span>
              </div>
              <div className="text-2xl font-black text-slate-800">{formatCFA(profile.totalEarned)}</div>
            </div>
          </div>

          {/* Withdrawal Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Retirer mes gains</h4>
              <p className="text-xs text-slate-500 mt-1">Paiement Mobile Money direct (Wave, Orange, Moov) dès 5 000 F CFA.</p>
            </div>
            <button
              onClick={() => { playTapBeep(); setIsWithdrawOpen(true); }}
              disabled={profile.availableBalance < 5000}
              className={\`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 \${
                profile.availableBalance >= 5000
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }\`}
            >
              <ArrowUpRight className="w-4 h-4" /> Demander le retrait
            </button>
          </div>

          {/* Referred Stores List */}
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" /> 
              Boutiques parrainées ({profile.referredStoresCount})
            </h4>
            
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100">
                {profile.referredStores.map((ref) => (
                  <div key={ref.storeId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800 text-sm">{ref.storeName}</span>
                        <span className={\`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border \${
                          ref.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-amber-50 text-amber-600 border-amber-200'
                        }\`}>
                          {ref.status === 'ACTIVE' ? 'Abonnée' : 'Essai'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {ref.ownerName} • Inscrit le {new Date(ref.registeredAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-sm font-black text-emerald-600">+{formatCFA(ref.commissionGenerated)}</div>
                      <div className="text-[10px] text-slate-400">
                        {ref.commissionGenerated > 0 ? 'Commission versée' : 'En attente abonnement'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Modal Inner */}
        {isWithdrawOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-500" /> Retrait des gains
                </h3>
                <button onClick={() => setIsWithdrawOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {withdrawSuccess ? (
                <div className="py-6 text-center">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h4 className="font-black text-slate-800 text-lg mb-2">Demande envoyée !</h4>
                  <p className="text-sm text-slate-500 px-4">
                    Vos {formatCFA(withdrawAmount)} seront virés sur votre compte Mobile Money d'ici 2h à 4h.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-sm">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5 text-xs">Montant (FCFA)</label>
                    <input
                      type="number"
                      min={5000}
                      max={profile.availableBalance}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      required
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 px-1 font-medium">
                      <span>Min: 5 000 FCFA</span>
                      <span>Max: {formatCFA(profile.availableBalance)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5 text-xs">Réseau de retrait</label>
                    <select
                      value={withdrawProvider}
                      onChange={(e) => setWithdrawProvider(e.target.value as MobileMoneyProvider)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="ORANGE_MONEY">Orange Money</option>
                      <option value="WAVE">Wave</option>
                      <option value="MOOV_MONEY">Moov Money</option>
                      <option value="MTN_MOMO">MTN MoMo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5 text-xs">Numéro du compte</label>
                    <input
                      type="tel"
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-transform active:scale-95 mt-4"
                  >
                    Confirmer le retrait
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/AffiliateDashboardModal.tsx', code);
console.log('Affiliate UI updated to clean light design!');
