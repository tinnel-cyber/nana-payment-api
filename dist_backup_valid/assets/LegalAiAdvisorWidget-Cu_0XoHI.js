import{r as n,j as e}from"./react-core-DqeaXjTS.js";import{u as Ne}from"./useNetworkStatus-CZ4WfM5U.js";import{g as Ae,a as te,s as N,G as se,c as Ce,b as Ie}from"./legalAiService-BgXORgZ7.js";import{b as i,a as ne}from"./index-C_KCxY58.js";import{p as q,O as ke,X as O,b0 as ae,u as re,v as Se,ak as Me,t as De,af as Ee,e as Te,aj as qe,o as Oe,a as oe,aq as Pe,ay as ze}from"./lucide-icons-CnhMY52a.js";import"./pdf-suite-BlMysfPA.js";import"./firebase-vendor-CUzzQY-r.js";const P=[11.5,13,14.5,16,18],ie=4,$e=({isOpen:z,onToggle:L,onClose:B,documentContext:le="",defaultPosition:R,apiKey:de})=>{const[ce,Y]=n.useState(!1),h=z!==void 0?z:ce,{isOnline:u}=Ne(),ue=()=>{i(),L?L():Y(t=>!t)},A=()=>{i(),B?B():Y(!1)},[r,C]=n.useState(!1),[I,F]=n.useState(1),H=P[I],[a,v]=n.useState(0),[X,$]=n.useState(null),[U,k]=n.useState(!1),[b,pe]=n.useState(()=>de||Ae()),[d,S]=n.useState(()=>{if(R)return R;const t=typeof window<"u"?Math.max(16,window.innerWidth-115):500,s=typeof window<"u"?Math.max(16,window.innerHeight-48):600;return{x:t,y:s}}),[f,_]=n.useState(!1),g=n.useRef({startX:0,startY:0,posX:0,posY:0}),y=n.useRef(!1),M=n.useRef(0),w=n.useRef({startX:0,startY:0,posX:0,posY:0});n.useEffect(()=>{const t=()=>{S(s=>{const l=typeof window<"u"?Math.max(10,window.innerWidth-100):500,c=typeof window<"u"?Math.max(10,window.innerHeight-44):600;return{x:Math.min(s.x,l),y:Math.min(s.y,c)}})};return window.addEventListener("resize",t),()=>window.removeEventListener("resize",t)},[]);const[j,m]=n.useState([]),[D,G]=n.useState(""),[E,K]=n.useState(!1),[me,V]=n.useState(null),W=n.useRef(null);n.useEffect(()=>{if(a<=0)return;const t=setInterval(()=>{v(s=>s<=1?(clearInterval(t),0):s-1)},1e3);return()=>clearInterval(t)},[a]),n.useEffect(()=>{const t=te();if(t.length===0){const s={id:"welcome-0",role:"assistant",text:`**Bonjour ! Je suis votre Expert Juriste d'Affaires & Financier.**

Spécialiste du **droit OHADA** (17 États), des règles bancaires **UEMOA / CEMAC** et du **Commerce International (Incoterms 2020)**.

Je vous assiste pour :
• 📄 **Relire et auditer un contrat** ou une clause à signer
• 🏢 **Baux commerciaux** : renouvellement, congés et indemnité d'éviction (AUDCG)
• 🛡️ **Sécuriser vos créances** : cautionnements solidaires, garanties autonomes et réserve de propriété
• 🚢 **Incoterms 2020** : répartition des risques, coûts de fret et douane (FOB, CIF, DAP)

*Vos échanges sont confidentiels et purgés automatiquement après 24 heures.*`,timestamp:Date.now()};m([s]),N([s])}else m(t)},[]),n.useEffect(()=>{h&&!r&&W.current?.scrollIntoView({behavior:"smooth"})},[j,h,r]),n.useEffect(()=>{const t=s=>{if(s.key==="nana_legal_ai_chat_history"){const l=te();l.length>0&&m(l)}};return window.addEventListener("storage",t),()=>window.removeEventListener("storage",t)},[]);const xe=t=>{t.target.closest("button, input, textarea, a")||(_(!0),g.current={startX:t.clientX,startY:t.clientY,posX:d.x,posY:d.y},t.target.setPointerCapture?.(t.pointerId))},he=n.useCallback(t=>{if(!f)return;const s=t.clientX-g.current.startX,l=t.clientY-g.current.startY,c=420,o=r?56:580,p=Math.max(10,window.innerWidth-c-10),x=Math.max(10,window.innerHeight-o-10),T=Math.min(p,Math.max(10,g.current.posX+s)),je=Math.min(x,Math.max(10,g.current.posY+l));S({x:T,y:je})},[f,r]),be=t=>{f&&(_(!1),t.target.releasePointerCapture?.(t.pointerId))},J=t=>{y.current=!0,M.current=0,w.current={startX:t.clientX,startY:t.clientY,posX:d.x,posY:d.y},t.currentTarget.setPointerCapture?.(t.pointerId)},Q=t=>{if(!y.current)return;const s=t.clientX-w.current.startX,l=t.clientY-w.current.startY;M.current=Math.hypot(s,l);const c=typeof window<"u"?Math.max(10,window.innerWidth-100):500,o=typeof window<"u"?Math.max(10,window.innerHeight-44):600,p=Math.min(c,Math.max(8,w.current.posX+s)),x=Math.min(o,Math.max(8,w.current.posY+l));S({x:p,y:x})},Z=t=>{y.current&&(y.current=!1,t.currentTarget.releasePointerCapture?.(t.pointerId),M.current<5&&ue())},ee=async t=>{if(!u){const o={id:`offline-${Date.now()}`,role:"assistant",text:"⚠️ **Connexion requise** : Le conseiller juridique IA nécessite un accès internet actif pour analyser vos contrats et requêtes en temps réel.",timestamp:Date.now()};m(p=>[...p,o]);return}const s=(t||D).trim();if(!s||E||a>0)return;i(),G(""),$(null);const l={id:`user-${Date.now()}`,role:"user",text:s,timestamp:Date.now()},c=[...j,l];m(c),N(c),K(!0);try{const o=await Ie({message:s,history:c,documentContext:le,apiKey:b});o.isRateLimited?(v(15),$("Quota Free Tier atteint (15 req/min). Temporisation de 15 secondes activée.")):v(ie);const p={id:`ai-${Date.now()}`,role:"assistant",text:o.reply,timestamp:Date.now()},x=[...c,p];m(x),N(x),ne()}catch(o){console.error("Erreur Legal AI :",o),v(ie);const p=o?.message?.includes("429")||o?.status===429,x={id:`err-${Date.now()}`,role:"assistant",text:p?`⚠️ **Limite de requêtes atteinte (Tier Gratuit : 15 requêtes/minute)**

Veuillez patienter quelques instants avant de poser votre prochaine question.`:"⚠️ Une anomalie temporaire est survenue lors de la consultation. Veuillez reformuler votre question ou vous référer aux modèles contractuels prédéfinis.",timestamp:Date.now()};m(T=>[...T,x])}finally{K(!1)}},fe=()=>{if(window.confirm("Voulez-vous effacer tout l’historique de conversation ? (Les données de plus de 24h sont déjà purgées automatiquement).")){i(),Ce();const t={id:`welcome-${Date.now()}`,role:"assistant",text:"Session réinitialisée. Comment puis-je vous assister sur vos contrats ou opérations commerciales OHADA aujourd'hui ?",timestamp:Date.now()};m([t]),N([t])}},ge=(t,s)=>{i(),navigator.clipboard.writeText(t),V(s),setTimeout(()=>V(null),2e3)},we=()=>{try{b.trim()?localStorage.setItem(se,b.trim()):localStorage.removeItem(se),ne(),k(!1)}catch{}},ve=()=>{i(),A();const t=window.open("","NanaOHADALegalAdvisor","width=480,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes");if(!t){alert("Veuillez autoriser les fenêtres pop-up pour détacher l’assistant juridique.");return}const s=`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>⚖️ Expert Juridique & Financier OHADA - Nana POS</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { background: #0b0f19; color: #f1f5f9; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
          header { background: #111827; border-bottom: 1px solid #1f2937; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
          h1 { font-size: 14px; font-weight: 800; display: flex; align-items: center; gap: 8px; color: #fbbf24; }
          .badge { font-size: 10px; background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); padding: 2px 6px; border-radius: 6px; }
          .privacy-notice { font-size: 10px; color: #64748b; padding: 6px 16px; background: #0f172a; border-bottom: 1px solid #1e293b; text-align: center; }
          #chat-container { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
          .msg { max-width: 85%; padding: 10px 14px; border-radius: 14px; font-size: 13.5px; line-height: 1.5; word-break: break-word; }
          .msg-user { align-self: flex-end; background: #2563eb; color: #ffffff; border-bottom-right-radius: 2px; }
          .msg-assistant { align-self: flex-start; background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-bottom-left-radius: 2px; }
          .msg-assistant blockquote { border-left: 3px solid #f59e0b; padding-left: 8px; margin: 8px 0; color: #cbd5e1; font-style: italic; background: rgba(0,0,0,0.2); padding: 6px; border-radius: 4px; }
          .msg-assistant h3 { font-size: 13.5px; margin-bottom: 6px; color: #fbbf24; }
          footer { padding: 12px; background: #111827; border-top: 1px solid #1f2937; display: flex; flex-direction: column; gap: 6px; }
          .input-row { display: flex; gap: 8px; }
          input { flex: 1; background: #1f2937; border: 1px solid #374151; color: #fff; padding: 10px 14px; border-radius: 12px; font-size: 13px; outline: none; }
          input:focus { border-color: #fbbf24; }
          button.btn-send { background: #d97706; color: #fff; border: none; padding: 10px 18px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
          button.btn-send:hover { background: #b45309; }
          button.btn-send:disabled { opacity: 0.4; cursor: not-allowed; }
          .cooldown-text { font-size: 10.5px; color: #f59e0b; text-align: center; }
        </style>
      </head>
      <body>
        <header>
          <div>
            <h1>⚖️ IA Juriste OHADA</h1>
            <div style="font-size: 11px; color: #94a3b8;">Droit des affaires, UEMOA/CEMAC & Incoterms</div>
          </div>
          <button id="clear-btn" style="background:transparent;border:1px solid #475569;color:#94a3b8;padding:4px 8px;border-radius:6px;font-size:10.5px;cursor:pointer;">Effacer</button>
        </header>
        <div class="privacy-notice">🔒 Données confidentielles • Purge automatique après 24 heures • Free Tier 15 req/min</div>
        <div id="chat-container"></div>
        <footer>
          <div id="cooldown-badge" class="cooldown-text" style="display:none;">⏳ Veuillez patienter quelques secondes...</div>
          <div class="input-row">
            <input type="text" id="msg-input" placeholder="Posez une question juridique ou soumettez une clause..." autofocus />
            <button class="btn-send" id="send-btn">Envoyer</button>
          </div>
        </footer>

        <script>
          const STORAGE_KEY = 'nana_legal_ai_chat_history';
          const chatContainer = document.getElementById('chat-container');
          const msgInput = document.getElementById('msg-input');
          const sendBtn = document.getElementById('send-btn');
          const clearBtn = document.getElementById('clear-btn');
          const cdBadge = document.getElementById('cooldown-badge');
          let cdTimer = 0;

          function getMessages() {
            try {
              const raw = localStorage.getItem(STORAGE_KEY);
              if (!raw) return [];
              const data = JSON.parse(raw);
              const now = Date.now();
              return (data.messages || []).filter(m => (now - m.timestamp) < 86400000);
            } catch(e) { return []; }
          }

          function saveMessages(msgs) {
            try {
              const now = Date.now();
              const valid = msgs.filter(m => (now - m.timestamp) < 86400000);
              localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, lastUpdated: now, messages: valid }));
            } catch(e) {}
          }

          function formatText(txt) {
            return txt
              .replace(/### (.*?)\\n/g, '<h3>$1</h3>')
              .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
              .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
              .replace(/> "(.*?)"/g, '<blockquote>"$1"</blockquote>')
              .replace(/\\n/g, '<br/>');
          }

          function render() {
            const msgs = getMessages();
            chatContainer.innerHTML = '';
            msgs.forEach(m => {
              const div = document.createElement('div');
              div.className = 'msg msg-' + m.role;
              div.innerHTML = formatText(m.text);
              chatContainer.appendChild(div);
            });
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }

          function startCooldown(sec) {
            cdTimer = sec;
            sendBtn.disabled = true;
            cdBadge.style.display = 'block';
            cdBadge.innerText = '⏳ Veuillez patienter (' + cdTimer + 's)...';
            const itv = setInterval(() => {
              cdTimer--;
              if (cdTimer <= 0) {
                clearInterval(itv);
                sendBtn.disabled = false;
                cdBadge.style.display = 'none';
              } else {
                cdBadge.innerText = '⏳ Veuillez patienter (' + cdTimer + 's)...';
              }
            }, 1000);
          }

          async function send() {
            const text = msgInput.value.trim();
            if (!text || cdTimer > 0) return;
            msgInput.value = '';

            const msgs = getMessages();
            const userMsg = { id: 'u-' + Date.now(), role: 'user', text, timestamp: Date.now() };
            msgs.push(userMsg);
            saveMessages(msgs);
            render();

            sendBtn.disabled = true;
            sendBtn.innerText = '...';

            try {
              const res = await fetch('/api/ai/legal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: msgs })
              });

              if (res.status === 429) {
                msgs.push({ id: 'err-' + Date.now(), role: 'assistant', text: '⚠️ Limite Free Tier atteinte (15 req/min). Veuillez patienter 20 secondes.', timestamp: Date.now() });
                saveMessages(msgs);
                render();
                startCooldown(15);
                return;
              }

              const contentType = res.headers.get("content-type") || "";
              if (!contentType.includes("application/json")) {
                throw new Error("URL du serveur IA non configurée ou invalide");
              }

              const data = await res.json();
              const reply = data && data.reply ? data.reply : 'Conseil disponible via le moteur local.';
              msgs.push({ id: 'a-' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() });
              saveMessages(msgs);
              render();
              startCooldown(4);
            } catch(e) {
              msgs.push({ id: 'err-' + Date.now(), role: 'assistant', text: 'Réponse générée en mode sécurisé.', timestamp: Date.now() });
              saveMessages(msgs);
              render();
              startCooldown(4);
            } finally {
              sendBtn.innerText = 'Envoyer';
              msgInput.focus();
            }
          }

          sendBtn.addEventListener('click', send);
          msgInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
          clearBtn.addEventListener('click', () => {
            if (confirm('Effacer la conversation ?')) {
              localStorage.removeItem(STORAGE_KEY);
              render();
            }
          });

          render();
        <\/script>
      </body>
      </html>
    `;t.document.open(),t.document.write(s),t.document.close()},ye=[{label:"🏢 Bail commercial AUDCG",query:"Quelles sont les conditions de renouvellement et les règles de résiliation d'un bail commercial selon l'AUDCG de l'OHADA ?"},{label:"🛡️ Clause de réserve de propriété",query:"Rédige une clause de réserve de propriété protectrice et conforme à l'Acte Uniforme sur les Sûretés de l'OHADA pour mes ventes à crédit."},{label:"🚢 Incoterms FOB vs CIF",query:"Quelle est la différence exacte entre les Incoterms 2020 FOB et CIF pour une cargaison à destination d'un port ouest-africain ?"},{label:"⚖️ Cautionnement vs Garantie bancaire",query:"Pourquoi est-il plus avantageux d'exiger une garantie autonome à première demande plutôt qu'un cautionnement simple selon l'AUS OHADA ?"},{label:"🏛️ SARL vs SAS",query:"Quels sont les avantages comparés entre créer une SARL et une SAS dans l'espace OHADA pour protéger les associés ?"}];return e.jsxs(e.Fragment,{children:[!h&&e.jsxs("button",{type:"button",onPointerDown:J,onPointerMove:Q,onPointerUp:Z,style:{position:"fixed",left:`${Math.min(d.x,typeof window<"u"?window.innerWidth-90:500)}px`,top:`${Math.min(d.y,typeof window<"u"?window.innerHeight-36:600)}px`,zIndex:50},className:"z-50 py-1 px-2 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-md shadow-black/40 flex items-center gap-1 border border-amber-300 active:scale-95 transition-transform cursor-pointer select-none touch-none",title:"Agent IA","aria-label":"Agent IA",children:[e.jsx("div",{className:"w-4 h-4 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-xs",children:e.jsx(q,{className:"w-3.5 h-3.5"})}),e.jsx("span",{className:"text-[10px] font-bold tracking-tight text-slate-950",children:"Agent IA"}),e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping shrink-0"})]}),h&&r&&e.jsxs("div",{onPointerDown:J,onPointerMove:Q,onPointerUp:Z,style:{position:"fixed",left:`${Math.min(Math.max(10,d.x),typeof window<"u"?window.innerWidth-130:500)}px`,top:`${Math.min(Math.max(10,d.y),typeof window<"u"?window.innerHeight-36:600)}px`,zIndex:50},className:"z-50 py-1 px-2 flex items-center gap-1 bg-slate-900/95 border border-amber-400 rounded-full shadow-md shadow-black/40 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none touch-none",children:[e.jsxs("button",{type:"button",onClick:()=>{i(),C(!1)},className:"flex items-center gap-1 cursor-pointer active:scale-95 transition-transform text-left",title:"Agent IA","aria-label":"Agent IA",children:[e.jsx("div",{className:"w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-xs",children:e.jsx(q,{className:"w-3.5 h-3.5"})}),e.jsx("span",{className:"text-[10px] font-bold tracking-tight text-amber-300",children:"Agent IA"})]}),e.jsx("button",{type:"button",onClick:()=>{i(),C(!1)},className:"w-4 h-4 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs active:scale-90 transition cursor-pointer",title:"Agrandir le popup (Restaurer)","aria-label":"Agrandir",children:e.jsx(ke,{className:"w-2.5 h-2.5"})}),e.jsx("button",{type:"button",onClick:()=>{A()},className:"w-4 h-4 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center shadow-xs active:scale-90 transition cursor-pointer",title:"Fermer","aria-label":"Fermer",children:e.jsx(O,{className:"w-2.5 h-2.5"})})]}),h&&!r&&e.jsxs("div",{onPointerMove:he,onPointerUp:be,style:{position:"fixed",left:`${Math.max(8,Math.min(d.x,typeof window<"u"?window.innerWidth-428:600))}px`,top:`${Math.max(8,Math.min(d.y,typeof window<"u"?window.innerHeight-590:100))}px`,zIndex:9999,width:"420px",maxWidth:"calc(100vw - 16px)",height:"580px",maxHeight:"calc(100vh - 32px)"},className:`flex flex-col bg-slate-950/98 text-slate-100 rounded-2xl border border-amber-500/40 shadow-2xl shadow-black/80 backdrop-blur-md overflow-hidden transition-shadow ${f?"ring-2 ring-amber-400 shadow-amber-500/20":""}`,children:[e.jsxs("div",{onPointerDown:xe,className:`px-3 py-2 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between select-none ${f?"cursor-grabbing":"cursor-grab"}`,children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0",children:e.jsx(q,{className:"w-4 h-4"})}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("h3",{className:"text-xs font-bold text-white leading-tight",children:"Juriste OHADA & Finance"}),e.jsx("span",{className:"px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30",children:"Gemini Flash"})]}),e.jsx("p",{className:"text-[10px] text-slate-400 leading-tight",children:"AUDCG • Sûretés • UEMOA • Incoterms"})]})]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:t=>{t.stopPropagation(),i(),k(!U)},className:`p-1 rounded-lg transition cursor-pointer ${b?"text-emerald-400 hover:bg-emerald-950/40":"text-slate-400 hover:bg-slate-800"}`,title:"Configurer votre Clé API Google AI Studio",children:e.jsx(ae,{className:"w-3.5 h-3.5"})}),e.jsx("button",{type:"button",onClick:t=>{t.stopPropagation(),i(),F(s=>Math.max(0,s-1))},disabled:I===0,className:"p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer",title:"Diminuer la police (A-)",children:e.jsx(re,{className:"w-3.5 h-3.5"})}),e.jsxs("span",{className:"text-[10px] font-mono text-amber-300 px-0.5 font-bold",children:[H,"px"]}),e.jsx("button",{type:"button",onClick:t=>{t.stopPropagation(),i(),F(s=>Math.min(P.length-1,s+1))},disabled:I===P.length-1,className:"p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer",title:"Agrandir la police (A+)",children:e.jsx(Se,{className:"w-3.5 h-3.5"})}),e.jsx("button",{type:"button",onClick:t=>{t.stopPropagation(),ve()},className:"p-1.5 rounded-lg hover:bg-slate-800 text-amber-400 hover:text-amber-300 cursor-pointer transition",title:"Détacher dans une fenêtre indépendante",children:e.jsx(Me,{className:"w-3.5 h-3.5"})}),e.jsxs("div",{className:"flex items-center gap-0.5 bg-slate-950/80 border border-slate-700/80 rounded-xl p-0.5 shadow-inner ml-1",children:[e.jsx("button",{type:"button",onClick:t=>{t.stopPropagation(),i(),C(!0)},className:"w-6 h-6 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 flex items-center justify-center font-bold text-xs transition cursor-pointer active:scale-90",title:"Réduire (Libère 100% de l'écran)","aria-label":"Réduire",children:e.jsx(re,{className:"w-3.5 h-3.5 stroke-[3]"})}),e.jsx("button",{type:"button",onClick:t=>{t.stopPropagation(),A()},className:"w-6 h-6 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs transition cursor-pointer active:scale-90",title:"Fermer l'assistant","aria-label":"Fermer",children:e.jsx(O,{className:"w-3.5 h-3.5 stroke-[2.5]"})})]})]})]}),U&&!r&&e.jsxs("div",{className:"bg-slate-900 border-b border-slate-800 p-3 text-xs space-y-2 animate-in fade-in",children:[e.jsxs("div",{className:"flex items-center justify-between text-slate-200 font-bold",children:[e.jsxs("span",{className:"flex items-center gap-1.5",children:[e.jsx(ae,{className:"w-3.5 h-3.5 text-amber-400"}),"Clé API Google AI Studio (Free Tier)"]}),e.jsx("button",{type:"button",onClick:()=>k(!1),className:"text-slate-400 hover:text-white",children:e.jsx(O,{className:"w-3.5 h-3.5"})})]}),e.jsxs("p",{className:"text-[10px] text-slate-400",children:["Modèle gratuit : ",e.jsx("code",{children:"gemini-2.5-flash"})," (15 req/min). Si aucune clé n'est saisie, l'appel transitera par le serveur Nana POS ou le moteur local."]}),e.jsxs("div",{className:"flex gap-1.5",children:[e.jsx("input",{type:"password",value:b,onChange:t=>pe(t.target.value),placeholder:"AIzaSy...",className:"flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-amber-400 font-mono"}),e.jsx("button",{type:"button",onClick:we,className:"bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs cursor-pointer",children:"Sauvegarder"})]})]}),!r&&e.jsxs("div",{className:"bg-slate-900/90 border-b border-slate-800 px-3 py-1 flex items-center justify-between text-[10px] text-slate-400 select-none",children:[e.jsxs("span",{className:"flex items-center gap-1.5 text-emerald-400 font-medium",children:[e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-emerald-400"}),"Purge automatique après 24h • 0 base de données"]}),e.jsxs("button",{type:"button",onClick:fe,className:"hover:text-rose-400 flex items-center gap-1 cursor-pointer transition",title:"Vider manuellement l'historique",children:[e.jsx(De,{className:"w-3 h-3"}),e.jsx("span",{children:"Effacer"})]})]}),X&&!r&&e.jsxs("div",{className:"bg-amber-950/80 border-b border-amber-500/40 px-3 py-1.5 text-[11px] text-amber-200 flex items-center gap-2",children:[e.jsx(Ee,{className:"w-4 h-4 text-amber-400 shrink-0"}),e.jsx("span",{children:X})]}),!r&&e.jsxs("div",{className:"flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-800",children:[j.map(t=>e.jsx("div",{className:`flex flex-col ${t.role==="user"?"items-end":"items-start"}`,children:e.jsxs("div",{style:{fontSize:`${H}px`,lineHeight:1.55},className:`relative group max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-md ${t.role==="user"?"bg-blue-600 text-white rounded-br-xs":"bg-slate-900 text-slate-100 border border-slate-800 rounded-bl-xs"}`,children:[e.jsx("div",{className:"space-y-1.5 whitespace-pre-wrap select-text",children:t.text}),e.jsxs("div",{className:"mt-1.5 pt-1 border-t border-white/10 flex items-center justify-between text-[9.5px] opacity-70",children:[e.jsx("span",{children:new Date(t.timestamp).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}),t.role==="assistant"&&e.jsx("button",{type:"button",onClick:()=>ge(t.text,t.id),className:"flex items-center gap-1 hover:text-amber-300 cursor-pointer ml-2",title:"Copier le texte de la clause",children:me===t.id?e.jsxs(e.Fragment,{children:[e.jsx(Te,{className:"w-2.5 h-2.5 text-emerald-400"}),e.jsx("span",{className:"text-emerald-400",children:"Copié"})]}):e.jsxs(e.Fragment,{children:[e.jsx(qe,{className:"w-2.5 h-2.5"}),e.jsx("span",{children:"Copier"})]})})]})]})},t.id)),E&&e.jsxs("div",{className:"flex items-start gap-2 text-xs text-amber-300 animate-pulse bg-amber-950/20 border border-amber-500/20 p-2.5 rounded-xl",children:[e.jsx(Oe,{className:"w-4 h-4 text-amber-400 animate-spin shrink-0"}),e.jsx("span",{children:"Analyse juridique & vérification des Actes Uniformes OHADA en cours..."})]}),e.jsx("div",{ref:W})]}),!r&&j.length<=2&&e.jsxs("div",{className:"px-3 py-1.5 bg-slate-900/50 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0",children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-500 uppercase shrink-0",children:"Thèmes :"}),ye.map((t,s)=>e.jsx("button",{type:"button",disabled:!u,onClick:()=>ee(t.query),className:"px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-[10.5px] font-medium whitespace-nowrap cursor-pointer transition border border-slate-700 active:scale-95 shrink-0",title:u?void 0:"Connexion requise",children:t.label},s))]}),!r&&e.jsxs("form",{onSubmit:t=>{t.preventDefault(),ee()},className:"p-2.5 bg-slate-900 border-t border-slate-800 flex flex-col gap-1.5",children:[u?a>0?e.jsxs("div",{className:"flex items-center gap-1.5 text-[10.5px] text-amber-400 font-medium px-1",children:[e.jsx(Pe,{className:"w-3 h-3 animate-spin text-amber-400 shrink-0"}),e.jsxs("span",{children:["Veuillez patienter (",a,"s) - temporisation Free Tier..."]})]}):null:e.jsxs("div",{className:"flex items-center gap-1.5 text-[10.5px] text-amber-400 font-medium px-1",children:[e.jsx(oe,{className:"w-3 h-3 text-amber-400 shrink-0"}),e.jsx("span",{children:"Connexion requise pour consulter l'IA Juridique"})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("input",{type:"text",value:D,onChange:t=>G(t.target.value),placeholder:u?a>0?`Veuillez patienter ${a}s...`:"Posez une question juridique ou soumettez une clause...":"Connexion requise...",disabled:!u||a>0,className:"flex-1 bg-slate-950 border border-slate-700 focus:border-amber-400 disabled:opacity-50 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition"}),e.jsx("button",{type:"submit",disabled:!u||!D.trim()||E||a>0,className:"bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-slate-950 font-black p-2 rounded-xl transition cursor-pointer shrink-0 shadow-md flex items-center justify-center min-w-[36px]",title:u?a>0?`Patientez ${a}s`:"Envoyer à l'expert juridique":"Connexion requise",children:u?a>0?e.jsx("span",{className:"text-xs font-mono font-black",children:a}):e.jsx(ze,{className:"w-4 h-4"}):e.jsx(oe,{className:"w-4 h-4 text-slate-950"})})]})]})]})]})};export{$e as LegalAiAdvisorWidget,$e as default};
