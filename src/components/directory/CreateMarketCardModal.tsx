import React, { useState } from 'react';
import {
  X,
  Store,
  Upload,
  Sparkles,
  MapPin,
  Phone,
  MessageCircle,
  Globe,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { DIRECTORY_CATEGORIES, publishNanaMarketCard, PublishMarketCardPayload } from '../../services/marketDirectoryService';
import { playTapBeep, playValidationBeep, playCashChime, playCancelSound } from '../../utils/audio';
import confetti from 'canvas-confetti';

interface CreateMarketCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCardPublished?: (newCard: any) => void;
}

const PRESET_LOGOS = [
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&auto=format&fit=crop&q=80'
];

const PRESET_BANNERS = [
  'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1000&auto=format&fit=crop&q=80'
];

export const CreateMarketCardModal: React.FC<CreateMarketCardModalProps> = ({
  isOpen,
  onClose,
  onCardPublished
}) => {
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState(DIRECTORY_CATEGORIES[1]); // Électronique & High-Tech
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Abidjan');
  const [country, setCountry] = useState("Côte d'Ivoire");
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [wameetHandle, setWameetHandle] = useState('');
  const [shopUrl, setShopUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState(PRESET_LOGOS[0]);
  const [bannerImage, setBannerImage] = useState(PRESET_BANNERS[0]);
  const [customLogoInput, setCustomLogoInput] = useState('');
  const [customBannerInput, setCustomBannerInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setErrorMessage("Veuillez renseigner le nom de l'entreprise ou de la carte.");
      playCancelSound();
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Veuillez renseigner un numéro de téléphone ou WhatsApp.');
      playCancelSound();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    playTapBeep();

    try {
      const payload: PublishMarketCardPayload = {
        storeName: storeName.trim(),
        category,
        description: description.trim() || `Boutique officielle ${storeName.trim()} sur NanaMarket. Retrouvez nos meilleures offres et contactez-nous directement.`,
        city: city.trim() || 'Abidjan',
        country: country.trim() || "Côte d'Ivoire",
        phone: phone.trim(),
        whatsappPhone: (whatsappPhone || phone).trim(),
        wameetHandle: wameetHandle.trim(),
        shopUrl: shopUrl.trim(),
        logoUrl: customLogoInput.trim() || logoUrl,
        bannerImage: customBannerInput.trim() || bannerImage,
        merchantType: category.includes('Formation') || category.includes('Coaching')
          ? 'digital_creator'
          : category.includes('Webinaire') || category.includes('Live')
            ? 'event_host'
            : 'physical_store'
      };

      const published = await publishNanaMarketCard(payload);

      playCashChime();
      playValidationBeep();

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      if (onCardPublished) {
        onCardPublished(published);
      }

      onClose();
    } catch (err: any) {
      console.error('[PUBLISH CARD ERROR]', err);
      setErrorMessage(err?.message || 'Erreur lors de la publication de la carte.');
      playCancelSound();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 my-auto text-slate-900"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Publier ma Carte NanaMarket</h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  1-Click Publish
                </span>
              </div>
              <p className="text-xs text-blue-100">Visibilité publique immédiate dans le répertoire</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playTapBeep();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto scrollbar-thin">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Nom de l'entreprise */}
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1">
              Nom de la carte / entreprise <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              placeholder="Ex: TechZone Pro Abidjan, NaNa Couture..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </div>

          {/* 2. Catégorie & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-800">
                Catégorie <span className="text-rose-600">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:border-blue-600 outline-none cursor-pointer"
              >
                {DIRECTORY_CATEGORIES.filter(c => c !== 'Toutes les Catégories').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-800">
                Ville &amp; Pays <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Ex: Abidjan, Ouaga"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 outline-none"
                />
                <input
                  type="text"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="Côte d'Ivoire"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Description */}
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-800">
              Description de votre activité
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Présentez vos produits, services et garanties en quelques phrases..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:border-blue-600 outline-none resize-none"
            />
          </div>

          {/* 4. Téléphone, WhatsApp & WaMeet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Téléphone / Appel <span className="text-rose-600">*</span></span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ex: +225 07 00 11 22"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp (Direct)</span>
              </label>
              <input
                type="tel"
                value={whatsappPhone}
                onChange={e => setWhatsappPhone(e.target.value)}
                placeholder="Ex: +225 07 00 11 22"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900 outline-none"
              />
            </div>
          </div>

          {/* 5. WaMeet & Lien Shop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                <span className="text-xs">⚡</span>
                <span>Pseudo WaMeet</span>
              </label>
              <input
                type="text"
                value={wameetHandle}
                onChange={e => setWameetHandle(e.target.value)}
                placeholder="Ex: @techzone_abidjan"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Lien d'accès au Shop / Slug</span>
              </label>
              <input
                type="text"
                value={shopUrl}
                onChange={e => setShopUrl(e.target.value)}
                placeholder="Ex: boutique-techzone"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 outline-none"
              />
            </div>
          </div>

          {/* 6. Logo & Image */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="text-xs font-black text-slate-800 flex items-center justify-between">
              <span>Logo &amp; Visuel de la carte</span>
              <span className="text-[10px] text-slate-400 font-normal">Sélectionnez un preset ou saisissez une URL</span>
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PRESET_LOGOS.map((url, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setLogoUrl(url);
                    setCustomLogoInput('');
                  }}
                  className={`w-11 h-11 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                    logoUrl === url && !customLogoInput ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="url"
                value={customLogoInput}
                onChange={e => setCustomLogoInput(e.target.value)}
                placeholder="Collez ici l'URL ou téléchargez votre logo..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 outline-none"
              />
              <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Importer</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    playTapBeep();
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_SIZE = 800;
                        const scale = Math.min(MAX_SIZE / Math.max(img.width, img.height), 1);
                        canvas.width = Math.round(img.width * scale);
                        canvas.height = Math.round(img.height * scale);
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                          const compressedWebp = canvas.toDataURL('image/webp', 0.85);
                          setCustomLogoInput(compressedWebp);
                          playValidationBeep();
                        }
                      };
                      if (typeof event.target?.result === 'string') {
                        img.src = event.target.result;
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
          </div>

          {/* Bouton d'Action Immédiate */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                playCancelSound();
                onClose();
              }}
              className="px-4 py-3 rounded-2xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publication en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publier ma Carte sur NanaMarket (1-Click)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
