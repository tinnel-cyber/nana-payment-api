import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, ShoppingBag, Send, Flame, Heart, 
  Sparkles, Zap, Clock, ShieldCheck, CheckCircle2, User 
} from 'lucide-react';
import { 
  LiveChatMessage, 
  INITIAL_CHAT_MESSAGES, 
  MOCK_PURCHASE_EVENTS, 
  LiveProductItem 
} from './liveStreamAssets';
import { formatCFA, playTapBeep, playValidationBeep } from '../../utils/audio';

interface LiveChatPanelProps {
  products: LiveProductItem[];
  onOpenOffer: (product: LiveProductItem) => void;
  onAddToCart?: (product: LiveProductItem) => void;
  onTriggerReaction: (emoji: string) => void;
}

export const LiveChatPanel: React.FC<LiveChatPanelProps> = ({
  products,
  onOpenOffer,
  onAddToCart,
  onTriggerReaction
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'products'>('chat');
  const [messages, setMessages] = useState<LiveChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [inputMessage, setInputMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll en bas quand un nouveau message arrive
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  // Simulation vivante d'injections régulières de preuves sociales d'achat
  useEffect(() => {
    let purchaseIdx = 0;
    const interval = setInterval(() => {
      const currentEvent = MOCK_PURCHASE_EVENTS[purchaseIdx % MOCK_PURCHASE_EVENTS.length];
      purchaseIdx++;

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newPurchaseMsg: LiveChatMessage = {
        id: `sys-purchase-${Date.now()}`,
        sender: 'Notification Live',
        text: `🎉 ${currentEvent.name} vient de débloquer l'offre ${currentEvent.product} !`,
        avatarColor: 'from-amber-400 to-yellow-500',
        badge: 'Acheteur Vérifié',
        timestamp: timeStr,
        isSystemPurchase: true,
        purchaseProduct: currentEvent.product
      };

      setMessages((prev) => [...prev, newPurchaseMsg]);
    }, 22000);

    return () => clearInterval(interval);
  }, []);

  // Envoi de message par le visiteur
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    playTapBeep();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const userMsg: LiveChatMessage = {
      id: `user-msg-${Date.now()}`,
      sender: 'Vous',
      text: inputMessage.trim(),
      avatarColor: 'from-indigo-500 to-purple-600',
      badge: 'VIP',
      timestamp: timeStr
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    // Déclenche une petite réaction de célébration
    onTriggerReaction('💬');
  };

  const handleReactionClick = (emoji: string) => {
    playTapBeep();
    onTriggerReaction(emoji);
  };

  return (
    <div className="w-full h-full flex flex-col rounded-[20px] live-glass-card overflow-hidden border border-white/[0.08] bg-[#090A0F]/90 shadow-2xl">
      
      {/* ================= SÉLECTEUR À 2 ONGLETS EN HAUT ================= */}
      <div className="flex items-center border-b border-white/[0.08] bg-white/[0.02] p-1.5 shrink-0">
        
        {/* Onglet 1 : 💬 Chat en Direct */}
        <button
          type="button"
          onClick={() => {
            playTapBeep();
            setActiveTab('chat');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-white/[0.1] text-white shadow-sm border border-white/[0.12]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span>💬 Chat en Direct</span>
        </button>

        {/* Onglet 2 : 🛍️ Produits du Live (X) */}
        <button
          type="button"
          onClick={() => {
            playTapBeep();
            setActiveTab('products');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'products'
              ? 'bg-white/[0.1] text-white shadow-sm border border-white/[0.12]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-[#F59E0B]" />
          <span>🛍️ Produits du Live</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-black border border-[#F59E0B]/30">
            {products.length}
          </span>
        </button>
      </div>

      {/* ================= CONTENU SELON L'ONGLET ACTIF ================= */}
      {activeTab === 'chat' ? (
        /* ================= ONGLET 1 : FLUX SOCIAL & PREUVE D'ACHAT ================= */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Liste des messages scrollable */}
          <div 
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 live-scrollbar"
          >
            {messages.map((msg) => {
              // Bannière dorée de preuve d'achat
              if (msg.isSystemPurchase) {
                return (
                  <div 
                    key={msg.id}
                    className="p-2.5 rounded-xl gold-purchase-banner flex items-center gap-2 text-xs"
                  >
                    <span className="text-base shrink-0 animate-bounce-subtle">🎉</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-[#FDE047] text-[11px] leading-tight">
                        {msg.text}
                      </p>
                    </div>
                    <span className="text-[10px] text-amber-200/70 tabular-nums shrink-0">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              }

              // Message standard des participants
              return (
                <div key={msg.id} className="flex items-start gap-2.5 text-xs group">
                  {/* Avatar avec initiales */}
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${msg.avatarColor} flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm border border-white/10`}>
                    {msg.sender.charAt(0)}
                  </div>

                  {/* Bulle / Contenu du message */}
                  <div className="flex-1 min-w-0 bg-white/[0.03] hover:bg-white/[0.06] p-2 rounded-xl border border-white/[0.04] transition">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-white text-[11px]">
                          {msg.sender}
                        </span>

                        {msg.badge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                            msg.badge === 'Modérateur'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : msg.badge === 'Acheteur Vérifié'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : msg.badge === 'VIP'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'bg-white/[0.05] text-slate-300 border-white/[0.1]'
                          }`}>
                            {msg.badge}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {msg.timestamp}
                      </span>
                    </div>

                    <p className="text-slate-200 text-xs leading-relaxed break-words">
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barre de Réactions Rapides (🔥, ❤️, 👏, ⚡, 🎉) */}
          <div className="px-3 py-2 border-t border-white/[0.06] bg-black/40 flex items-center justify-between gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 hidden min-[420px]:inline">
              Réactions :
            </span>
            <div className="flex items-center gap-1.5 flex-1 justify-around">
              {['🔥', '❤️', '👏', '⚡', '🎉'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReactionClick(emoji)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.15] border border-white/[0.08] hover:border-white/[0.2] flex items-center justify-center text-sm transition transform hover:scale-125 active:scale-95 cursor-pointer"
                  title={`Envoyer ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Champ de saisie de question / message au présentateur */}
          <form 
            onSubmit={handleSendMessage}
            className="p-2.5 sm:p-3 border-t border-white/[0.08] bg-[#090A0F] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Poser une question au présentateur..."
              className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400/80 focus:ring-1 focus:ring-indigo-400/50 transition"
              maxLength={180}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 shadow-md shadow-indigo-500/25"
              title="Envoyer le message"
              aria-label="Envoyer le message"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>

        </div>
      ) : (
        /* ================= ONGLET 2 : OFFRES DÉBLOQUÉES PENDANT LE LIVE ================= */
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 live-scrollbar">
          <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between pb-1 border-b border-white/[0.06]">
            <span>Offres & Formations de la session</span>
            <span className="text-[#F59E0B]">Tarifs négociés en direct</span>
          </div>

          {products.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border transition flex flex-col gap-2.5 ${
                item.isPinnedOffer
                  ? 'bg-indigo-950/30 border-indigo-500/40 shadow-lg shadow-indigo-950/40'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06]'
              }`}
            >
              {/* Entête Produit : Miniature + Infos + Minute de passage */}
              <div className="flex items-start gap-3">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0 p-1 flex items-center justify-center">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-contain"
                  />
                  {item.isPinnedOffer && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#FF2A54] animate-ping" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.timestampPresentation && (
                      <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {item.timestampPresentation}
                      </span>
                    )}
                    {item.badge && (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded-full border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                    {item.name}
                  </h4>

                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-black text-[#F59E0B] tabular-nums">
                      {formatCFA(item.price)}
                    </span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="text-[11px] line-through text-slate-400 tabular-nums">
                        {formatCFA(item.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bouton d'Achat Rapide / Tunnel en 1 clic */}
              <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    playTapBeep();
                    onOpenOffer(item);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Saisir cette offre en direct</span>
                </button>

                {onAddToCart && (
                  <button
                    type="button"
                    onClick={() => {
                      playValidationBeep();
                      onAddToCart(item);
                    }}
                    className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white transition active:scale-95 cursor-pointer"
                    title="Ajouter au panier"
                    aria-label="Ajouter au panier"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
