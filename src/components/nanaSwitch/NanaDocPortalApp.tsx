import React, { useState, useMemo } from 'react';
import { 
  Bot, BookOpen, Key, Cpu, ShieldCheck, Layers, Lock, ShoppingCart, 
  AlertCircle, Download, Copy, Check, ExternalLink, ArrowRight, ArrowLeft, 
  Search, Sparkles, Send, Terminal, CheckCircle2, RefreshCw, FileCode,
  ShieldAlert, Radio, HelpCircle, FileText, ChevronRight, LogIn
} from 'lucide-react';

interface NanaDocPortalAppProps {
  onClose?: () => void;
  copyToClipboard?: (text?: string, label?: string) => void;
  initialPrompt?: string;
  isPublicPortal?: boolean;
}

// Complete raw text of Prompt 1 (system:nanaswitch_integration_skill)
const SYSTEM_PROMPT_CONTENT = `---
name: nanaswitch_integration_skill
description: Autonomous AI Integration Assistant for NanaSwitch Cloud Payment Gateway. Guides engineers and merchants step-by-step through Zero-Trust credentials (ns_live_pk_*, ns_live_sk_*), hybrid routing (AGREGATED vs BYOK), HMAC-SHA256 webhooks, KYC volume limits, and multi-language implementation across Node.js, PHP, Python, and WooCommerce.
---

# 🤖 NanaSwitch Autonomous Integration AI Skill (\`system:nanaswitch_integration_skill\`)

Bienvenue dans le Skill officiel de l'Assistant IA Spécialisé **NanaSwitch Cloud** (Entité : **NANASORE TECHNOLOGIES**). Ce guide opérationnel et ce prompt système fournissent toutes les instructions techniques, règles de gouvernance et modèles de code pour assister les développeurs et intégrateurs dans l'implémentation de la passerelle de paiement intelligente NanaSwitch.

---

## 🎯 Rôle et Mission de l'Assistant

Vous agissez en tant que **Lead Integration Solutions Architect & Security Officer** certifié sur la plateforme NanaSwitch Cloud.
Votre mission est de :
1. **Accompagner les développeurs** pas à pas, de la génération de leurs clés Zero-Trust jusqu'au déploiement en production.
2. **Garantir le respect absolu de la sécurité** : interdire l'exposition des clés secrètes côté client, exiger la validation HMAC-SHA256 anti-rejeu des webhooks.
3. **Clarifier le modèle hybride** : expliquer la différence entre le mode **Simplifié (Agrégé)** et le mode **BYOK (SaaS / API Router)**.
4. **Prévenir les blocages de conformité** : informer les marchands de leurs plafonds mensuels KYC (Particulier : 1M XOF vs Entreprise : 5M XOF).
5. **Générer du code prêt à la production** dans tous les langages (Node.js/Express, PHP/cURL, Python, WordPress/WooCommerce, React/Next.js, Flutter).

---

## 🔑 Matrice des Clés d'Authentification Zero-Trust

| Identifiant | Format Officiel | Rôle & Visibilité | Règle de Sécurité Stricte |
|---|---|---|---|
| **Public Key** | \`ns_live_pk_[a-f0-9]{32}\` | Clé publique / Identifiant Marchand | Exposée côté frontend, widgets JS, applications mobiles ou plugins. |
| **Secret Key** | \`ns_live_sk_[a-f0-9]{32}\` | Clé privée de signature API serveur | **STRICTEMENT CONFIDENTIELLE**. Utilisée uniquement backend dans \`Authorization: Bearer\` ou \`x-nanaswitch-skey\`. Seul son hash SHA-256 est conservé dans Firestore. |
| **Webhook Secret** | \`ns_whsec_[a-f0-9]{64}\` | Secret de signature HMAC-SHA256 | Utilisée côté serveur pour certifier l'authenticité de l'en-tête \`x-nanaswitch-signature\`. |

---

## ⚡ Modèle Hybride B2B : Quel Mode Choisir ?

### 1. Mode Simplifié (Agrégé) — \`AGREGATED\`
- **Pour qui ?** Marchands, e-commerçants et PME sans contrats opérateurs directs.
- **Fonctionnement :** Les fonds sont collectés via le compte maître de régulation NanaSwitch Cloud.
- **Tarification :** Frais opérateur de base + **1.5% de marge de switch** retenue à la source.
- **Solde :** Crédité instantanément sur le wallet NanaSwitch multi-devises (XOF, USD, XAF, GNF, GHS) avec demande de reversement (payout) à la demande.

### 2. Mode Développeurs & Routeur SaaS — \`BYOK\` (Bring Your Own Keys)
- **Pour qui ?** Startups fintech, grandes entreprises et plateformes disposant de leurs propres comptes marchands SasPay ou Sebpay.
- **Fonctionnement :** Routage direct pass-through vers les passerelles partenaires avec les clés privées du marchand (\`saspay_api_key\`, \`sebpay_public_key\`, \`sebpay_secret_key\`).
- **Tarification :** **0% de commission de switch**. Facturation à l'usage SaaS : **0,02 XOF débité du solde de crédits API** par requête.
- **Coupe-circuit :** Si le solde de crédits API atteint 0, l'API renvoie le code **HTTP 402 Payment Required (\`402_INSUFFICIENT_CLOUD_CREDITS\`)**.

---

## 🛡️ Plafonds Mensuels & Gestion des Risques KYC

L'API applique un contrôle strict avant d'autoriser toute transaction ou lien de paiement :

\`\`\`json
{
  "INDIVIDUAL": {
    "max_monthly_volume_xof": 1000000,
    "description": "Compte Particulier / Indépendant (CNIB + Selfie requis)"
  },
  "ENTERPRISE": {
    "max_monthly_volume_xof": 5000000,
    "description": "Compte Entreprise Enregistrée (RCCM + IFU + Gérant requis)"
  }
}
\`\`\`

* **Comportement en cas de dépassement :**
  L'API rejette immédiatement la requête avec un code **HTTP 403 Forbidden** :
  \`\`\`json
  {
    "success": false,
    "error": "ERROR_MONTHLY_VOLUME_LIMIT_REACHED",
    "code": 403,
    "message": "Plafond mensuel de transactions dépassé pour votre profil KYC (Compte Particulier : max 1 000 000 XOF/mois).",
    "status_text": "Volume mensuel actuel : 950 000 / 1 000 000 XOF"
  }
  \`\`\`

---

## 🚀 Spécification des Endpoints d'Intégration

### Base URL :
* **Production :** \`https://nana-payment-api.onrender.com\`
* **Localhost / Staging :** \`http://localhost:10000\`

### Endpoint 1 : Initiation Universelle & Routage Intelligent
\`POST /v1/switch/route\` ou \`POST /api/payments/initiate\`

#### En-têtes HTTP Requis :
\`\`\`http
Content-Type: application/json
Authorization: Bearer ns_live_sk_YOUR_SECRET_KEY
x-nanaswitch-skey: ns_live_sk_YOUR_SECRET_KEY
x-nanaswitch-key: ns_live_pk_YOUR_PUBLIC_KEY
\`\`\`

#### Corps de la Requête (JSON) :
\`\`\`json
{
  "amount": 10000,
  "currency": "XOF",
  "country": "BF",
  "orderId": "CMD_2026_9841",
  "reference": "REF-WC-9841",
  "customer": {
    "name": "Ousmane Konkobo",
    "email": "client@example.com",
    "phone": "+22670123456",
    "country": "BF"
  },
  "returnUrl": "https://maboutique.com/checkout/merci",
  "callbackUrl": "https://maboutique.com/api/nanaswitch-webhook",
  "description": "Achat Panier #CMD_2026_9841"
}
\`\`\`

#### Réponse de Succès (HTTP 200 / 201) :
\`\`\`json
{
  "success": true,
  "transaction_id": "sw_749102",
  "reference": "REF-WC-9841",
  "status": "PENDING",
  "gateway": "saspay",
  "checkout_url": "https://newapi.sebpay.bj/checkout/session/sess_live_89a0f...",
  "payment_url": "https://newapi.sebpay.bj/checkout/session/sess_live_89a0f...",
  "message": "Session de paiement initiée avec succès."
}
\`\`\`

---

## 🔒 Validation Cryptographique Webhook (HMAC-SHA256)

NanaSwitch signe toutes les notifications sortantes à l'aide du secret \`ns_whsec_...\`.

### Format de l'en-tête \`x-nanaswitch-signature\` :
\`\`\`
t=1793051514,v1=d7e6c8d3fbd22cafca8ecb398b5ac507d596499f31cd6623d1005947653fb0b2
\`\`\`

### Règles de Vérification Stricte :
1. **Extraction :** Séparer le timestamp \`t\` et la signature \`v1\`.
2. **Anti-Rejeu :** Rejeter si \`|timestamp_actuel - t| > 300 secondes (5 minutes)\`.
3. **Payload Signé :** Concaténer \`\${t}.\${raw_request_body}\`.
4. **Calcul HMAC :** \`hash_hmac('sha256', "\${t}.\${raw_body}", webhook_secret)\`.
5. **Comparaison Sécurisée :** Utiliser \`crypto.timingSafeEqual\` ou \`hash_equals()\` pour contrer les attaques temporelles.

---

## 💻 Implémentations de Référence

### Node.js / Express (Serveur Marchand)
\`\`\`javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

// Écouter et Valider les Webhooks Entrants
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sigHeader = req.headers['x-nanaswitch-signature'];
  const secretKey = process.env.NANASWITCH_WEBHOOK_SECRET;

  if (!sigHeader) return res.status(401).send('En-tête de signature manquant');

  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')));
  const timestamp = parseInt(parts.t, 10);
  const signature = parts.v1;

  if (Math.abs(Date.now() / 1000 - timestamp) > 300) {
    return res.status(400).send('Horodatage expiré');
  }

  const rawBody = req.body.toString('utf8');
  const expectedSig = crypto
    .createHmac('sha256', secretKey)
    .update(\`\${timestamp}.\${rawBody}\`)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expectedSig, 'utf8')
  );

  if (!isValid) return res.status(401).send('Signature invalide');

  const event = JSON.parse(rawBody);
  if (event.event === 'payment.success' || event.status === 'SUCCESS') {
    console.log(\`✓ Commande #\${event.order_id} payée avec succès via \${event.gateway} !\`);
  }

  return res.status(200).json({ received: true });
});
\`\`\`

---

## 🛠️ Matrice de Résolution des Erreurs Fréquentes

| Code HTTP | Cause Identifiée | Solution Recommandée par l'Assistant IA |
|---|---|---|
| **401 Unauthorized** | Clé secrète \`ns_live_sk_...\` absente ou invalide. | Vérifier le header \`Authorization: Bearer ns_live_sk_...\` ou \`x-nanaswitch-skey\`. |
| **402 Payment Required** | Solde de crédits API SaaS épuisé en mode BYOK (\`0.02 XOF/req\`). | Dashboard Marchand > Développeur > Recharger mon portefeuille de crédits API. |
| **403 Forbidden** | Plafond mensuel KYC atteint (1M XOF Particulier / 5M XOF Entreprise). | Soumettre RCCM & IFU pour basculer vers Entreprise ou contacter le Super Admin. |
| **400 Timestamp Expired** | Écart > 5 minutes entre l'horodatage webhook et le serveur. | Vérifier la synchronisation NTP de l'horloge système du serveur. |
`;

// Pre-configured Q&A for the Interactive AI Simulator
const SIMULATED_PROMPTS = [
  {
    q: "Comment valider la signature Webhook HMAC-SHA256 en Node.js ?",
    a: `Pour valider cryptographiquement la signature d'un webhook NanaSwitch en Node.js :
1. Récupérez le corps brut de la requête (\`express.raw({ type: 'application/json' })\`).
2. Découpez l'en-tête \`x-nanaswitch-signature\` pour extraire le timestamp \`t\` et la signature \`v1\`.
3. Vérifiez que \`Math.abs(Date.now() / 1000 - t) <= 300\` (fenêtre anti-rejeu stricte de 5 min).
4. Calculez le digest HMAC-SHA256 sur la chaîne \`\${t}.\${rawBody}\` avec votre secret \`ns_whsec_...\`.
5. Utilisez \`crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(computed))\` pour vous prémunir des attaques temporelles.
6. Renvoyez immédiatement un code \`HTTP 200 { "received": true }\`.`
  },
  {
    q: "Quelle est la différence exacte entre le mode Agrégé et le mode BYOK ?",
    a: `Voici les deux modes du moteur hybride NanaSwitch Cloud :
• **Mode Simplifié (AGREGATED) :** Vous n'avez besoin d'aucun contrat opérateur. NanaSwitch encaisse via son compte maître et crédite instantanément votre wallet interne. Marge retenue : commission opérateur + 1.5%.
• **Mode Développeurs SaaS (BYOK) :** Vous injectez vos propres clés SasPay ou Sebpay. L'argent arrive directement sur vos comptes marchands partenaires. Commission de switch : **0%**, vous ne payez que **0,02 XOF par requête** débité de votre solde de crédits API SaaS.`
  },
  {
    q: "Pourquoi mon API renvoie 403_MONTHLY_VOLUME_LIMIT_REACHED ?",
    a: `NanaSwitch applique une gestion des risques automatisée basée sur votre statut KYC :
• **Compte Particulier :** Plafond strict de **1 000 000 XOF** par mois civil.
• **Compte Entreprise :** Plafond de **5 000 000 XOF** par mois civil (extensible sur validation Super Admin).
Dès que le cumul des transactions réussies du mois atteint ce montant, toute nouvelle initiation est bloquée avec le code **HTTP 403 Forbidden**.
👉 Pour débloquer votre plafond : soumettez votre RCCM et IFU dans l'onglet Profil KYC pour passer en statut Entreprise.`
  },
  {
    q: "Comment installer et configurer le plugin WooCommerce officiel ?",
    a: `Pour intégrer NanaSwitch dans votre boutique WooCommerce :
1. Téléchargez l'archive officielle \`nanaswitch-gateway.zip\` (compatible HPOS).
2. Rendez-vous dans **Extensions > Ajouter > Téléverser** sur votre backoffice WordPress.
3. Activez l'extension, puis ouvrez **WooCommerce > Réglages > Paiements > NanaSwitch Gateway**.
4. Renseignez votre **Public Key** (\`ns_live_pk_...\`), votre **Secret Key** (\`ns_live_sk_...\`) et votre **Secret Webhook** (\`ns_whsec_...\`).
5. Le endpoint webhook de votre boutique sera automatiquement configuré à l'adresse : \`https://votre-boutique.com/wp-json/nanaswitch/v1/webhook\`.`
  }
];

export function NanaDocPortalApp({ 
  onClose, 
  copyToClipboard, 
  initialPrompt = 'hub',
  isPublicPortal = true 
}: NanaDocPortalAppProps) {
  const [activeView, setActiveView] = useState<string>(initialPrompt);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabPrompt1, setActiveTabPrompt1] = useState<'simulator' | 'code' | 'specs'>('simulator');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  
  // Interactive Chat State for Prompt 1
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; code?: string }>>([
    {
      sender: 'assistant',
      text: "👋 Bonjour ! Je suis l'Assistant IA d'Intégration NanaSwitch Cloud (NANASORE TECHNOLOGIES). Je suis configuré via le skill `system:nanaswitch_integration_skill`. Comment puis-je vous aider dans votre intégration aujourd'hui ?"
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // The 8 Core Prompts / Chapters Matrix
  const promptsRegistry = useMemo(() => [
    {
      id: 'prompt1',
      badge: 'PROMPT 1 • ACTIF',
      badgeColor: 'bg-blue-600 text-white',
      icon: Bot,
      iconColor: 'text-blue-600',
      title: "Skill IA d'Intégration Autonome",
      subtitle: "system:nanaswitch_integration_skill",
      description: "Assistant IA intelligent spécialisé (type SasPay AI / Stripe Assistant). Guider pas à pas les développeurs de la génération des clés Zero-Trust jusqu'au déploiement sécurisé.",
      tags: ['Prompt Système Copiable', 'Chatbot Interactif', 'Zero-Trust', 'Multi-Langages']
    },
    {
      id: 'prompt2',
      badge: 'PROMPT 2',
      badgeColor: 'bg-emerald-600 text-white',
      icon: Key,
      iconColor: 'text-emerald-600',
      title: "Matrice des Clés & Authentification Zero-Trust",
      subtitle: "ns_live_pk_* & ns_live_sk_*",
      description: "Architecture de sécurité Zero-Trust : paires de clés publiques et privées, hachage bcrypt Firestore, règles de protection et headers HTTP requis.",
      tags: ['Auth Headers', 'Bcrypt Hashing', 'Firestore Vault', 'Protection Serveur']
    },
    {
      id: 'prompt3',
      badge: 'PROMPT 3',
      badgeColor: 'bg-amber-600 text-white',
      icon: Cpu,
      iconColor: 'text-amber-600',
      title: "Routage Dynamique & API Gateway Mobile Money",
      subtitle: "POST /v1/switch/route",
      description: "Endpoint universel de paiement unifié agrégeant Orange Money, Moov, Wave, SasPay et Sebpay avec repli automatique (failover) en cas d'indisponibilité.",
      tags: ['Orange Money', 'Moov Africa', 'Wave', 'Failover Dynamique']
    },
    {
      id: 'prompt4',
      badge: 'PROMPT 4',
      badgeColor: 'bg-purple-600 text-white',
      icon: ShieldCheck,
      iconColor: 'text-purple-600',
      title: "Signatures Webhook & Anti-Rejeu HMAC-SHA256",
      subtitle: "x-nanaswitch-signature & ns_whsec_*",
      description: "Protocole cryptographique de vérification des notifications entrantes. Fenêtre anti-rejeu 300s, timingSafeEqual et accusés de réception sécurisés.",
      tags: ['HMAC-SHA256', 'Anti-Rejeu 300s', 'TimingSafeEqual', 'Accusés HTTP 200']
    },
    {
      id: 'prompt5',
      badge: 'PROMPT 5',
      badgeColor: 'bg-indigo-600 text-white',
      icon: Layers,
      iconColor: 'text-indigo-600',
      title: "Modèle Hybride B2B : Agrégé vs SaaS BYOK",
      subtitle: "Marge +1.5% vs 0.02 XOF/requête",
      description: "Gestion du commutateur d'intégration dans l'espace Développeur, modèle de tarification à l'usage SaaS et coupe-circuit automatique HTTP 402.",
      tags: ['Master Merchant', 'BYOK Routeur', 'Crédits API', 'Coupe-Circuit 402']
    },
    {
      id: 'prompt6',
      badge: 'PROMPT 6',
      badgeColor: 'bg-rose-600 text-white',
      icon: Lock,
      iconColor: 'text-rose-600',
      title: "Plafonds Risque & Profils KYC (1M vs 5M XOF)",
      subtitle: "Limites Mensuelles & HTTP 403",
      description: "Contrôles de conformité stricts : Particulier (1 000 000 XOF/mois) vs Entreprise (5 000 000 XOF/mois), calcul du volume cumulé et code 403 Forbidden.",
      tags: ['Particulier 1M', 'Entreprise 5M', 'Rejet 403', 'Audit Mensuel']
    },
    {
      id: 'prompt7',
      badge: 'PROMPT 7',
      badgeColor: 'bg-teal-600 text-white',
      icon: ShoppingCart,
      iconColor: 'text-teal-600',
      title: "Plugin Officiel WooCommerce (.zip HPOS Ready)",
      subtitle: "nanaswitch-gateway.zip v1.0.0",
      description: "Extension WordPress packageable complète avec panneau d'administration des clés, compatibilité High-Performance Order Storage (HPOS) et webhook REST automatique.",
      tags: ['WordPress / Woo', 'HPOS Conforme', 'Archive .zip', 'Auto-Webhook']
    },
    {
      id: 'prompt8',
      badge: 'PROMPT 8',
      badgeColor: 'bg-slate-700 text-white',
      icon: AlertCircle,
      iconColor: 'text-slate-700',
      title: "Matrice des Erreurs HTTP & Dépannage",
      subtitle: "Résolution 400, 401, 402, 403, 500",
      description: "Guide exhaustif de résolution des erreurs, checklist de validation des payloads, codes d'erreur normalisés et recommandations de l'architecte.",
      tags: ['Diagnostic API', 'Checklist Sécurité', 'Codes HTTP', 'Support Développeur']
    }
  ], []);

  // Filter cards based on search query
  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) return promptsRegistry;
    const q = searchQuery.toLowerCase();
    return promptsRegistry.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [promptsRegistry, searchQuery]);

  const handleCopyFullSkill = () => {
    navigator.clipboard.writeText(SYSTEM_PROMPT_CONTENT);
    setCopiedPrompt(true);
    if (copyToClipboard) {
      copyToClipboard(SYSTEM_PROMPT_CONTENT, "Prompt Système IA copié !");
    }
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleSendQuestion = (questionText?: string) => {
    const textToSend = questionText || userInput;
    if (!textToSend.trim()) return;

    const newMessages = [...chatMessages, { sender: 'user' as const, text: textToSend }];
    setChatMessages(newMessages);
    setUserInput('');
    setIsAiTyping(true);

    setTimeout(() => {
      // Find matching canned answer or provide intelligent fallback
      const match = SIMULATED_PROMPTS.find(p => 
        textToSend.toLowerCase().includes(p.q.toLowerCase().slice(0, 15)) ||
        p.q.toLowerCase().split(' ').some(w => w.length > 4 && textToSend.toLowerCase().includes(w))
      );

      let reply = match 
        ? match.a 
        : `En tant qu'Assistant Spécialisé NanaSwitch Cloud (\`system:nanaswitch_integration_skill\`) :
Concernant votre demande "${textToSend}" :
• Assurez-vous d'utiliser vos clés sécurisées (\`ns_live_pk_...\` frontend, \`ns_live_sk_...\` backend).
• Pour une transaction standard, soumettez votre requête en POST vers \`https://nana-payment-api.onrender.com/v1/switch/route\`.
• Les notifications Webhooks doivent obligatoirement être vérifiées via l'en-tête \`x-nanaswitch-signature\` avec votre clé \`ns_whsec_...\`.
• Souhaitez-vous un exemple spécifique en Node.js, PHP, Python ou WordPress ?`;

      setChatMessages([...newMessages, { sender: 'assistant', text: reply }]);
      setIsAiTyping(false);
    }, 650);
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 text-slate-800 pb-16 animate-in fade-in duration-300">
      
      {/* Top Sticky App Navigation Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveView('hub')}
              className="flex items-center gap-2 group text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E40AF] to-[#2563EB] flex items-center justify-center text-white shadow-md shadow-blue-700/20 font-black text-base transition group-hover:scale-105">
                N
              </div>
              <div className="hidden sm:block">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#1E40AF]">Portail Développeur</span>
                <p className="text-sm font-extrabold text-slate-900 leading-none">NanaSwitch Cloud Docs</p>
              </div>
            </button>

            {activeView !== 'hub' && (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200 text-xs font-semibold text-slate-600">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button 
                  onClick={() => setActiveView('hub')}
                  className="hover:text-blue-600 transition"
                >
                  Accueil Hub
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-blue-700 font-extrabold uppercase tracking-wide">
                  {promptsRegistry.find(p => p.id === activeView)?.badge || activeView}
                </span>
              </div>
            )}
          </div>

          {/* Quick Search & Actions */}
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un prompt, webhook, HMAC..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (activeView !== 'hub') setActiveView('hub');
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 focus:bg-white text-xs rounded-xl border border-transparent focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            <a
              href="/downloads/nanaswitch-gateway.zip"
              download="nanaswitch-gateway.zip"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition border border-blue-200/60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Plugin WooCommerce (.zip)</span>
            </a>

            {/* Bouton Public Requis : Se connecter / S'inscrire vers la Console Cloud */}
            <a
              href="/nana-switch"
              className="px-4 py-2 bg-gradient-to-r from-[#1E40AF] to-[#2563EB] hover:from-[#1E3A8A] hover:to-[#1D4ED8] text-white rounded-xl text-xs font-black shadow-md shadow-blue-700/25 transition flex items-center gap-1.5 active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Se connecter / S'inscrire</span>
            </a>

            {!isPublicPortal && onClose && (
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: HOME HUB (INDEX OF ALL 8 PROMPTS IN APP MODEL) */}
      {activeView === 'hub' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
          
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E40AF] via-[#1E3A8A] to-slate-900 text-white p-8 md:p-12 shadow-xl shadow-blue-950/10">
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>Documentation Officielle & Prompts Systèmes • NANASORE TECHNOLOGIES</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Centre de Documentation & Développeur NanaSwitch Cloud
              </h1>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                Connectez vos plateformes e-commerce et applications à l'écosystème de paiement Mobile Money UEMOA. 
                Explorez l'architecture Zero-Trust, notre modèle hybride B2B et intégrez notre Assistant IA spécialisé.
              </p>

              {/* Key Features Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                  <span className="block text-2xl font-black text-white">8</span>
                  <span className="text-[11px] text-blue-200 font-semibold">Prompts d'Architecture</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                  <span className="block text-2xl font-black text-emerald-400">Zero-Trust</span>
                  <span className="text-[11px] text-blue-200 font-semibold">Authentification API</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                  <span className="block text-2xl font-black text-amber-300">300s</span>
                  <span className="text-[11px] text-blue-200 font-semibold">Anti-Rejeu HMAC</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                  <span className="block text-2xl font-black text-purple-300">0.02 XOF</span>
                  <span className="text-[11px] text-blue-200 font-semibold">Coût Requête SaaS</span>
                </div>
              </div>
            </div>

            {/* Background Accent Gradients */}
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-1/3 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Quick Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Explorez les 8 Prompts et Modules d'Intégration NanaSwitch Cloud</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Résultats : <strong>{filteredPrompts.length}</strong> modules</span>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 font-bold hover:underline ml-2"
                >
                  Effacer le filtre
                </button>
              )}
            </div>
          </div>

          {/* Hub Grid: 8 Quick Access Prompt Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredPrompts.map((p) => {
              const IconComponent = p.icon;
              const isPrompt1 = p.id === 'prompt1';

              return (
                <div 
                  key={p.id}
                  onClick={() => setActiveView(p.id)}
                  className={`group relative bg-white rounded-3xl p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 ${
                    isPrompt1 
                      ? 'border-blue-400/80 shadow-md shadow-blue-500/5 ring-2 ring-blue-500/20' 
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Card Bar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                        isPrompt1 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                        {p.title}
                      </h3>
                      <p className="text-[11px] font-mono font-bold text-slate-400 mt-0.5">
                        {p.subtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {p.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Action Link */}
                  <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                    <span>{isPrompt1 ? 'Ouvrir le Module & IA' : 'Accéder au Guide'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* DETAIL VIEW FOR SPECIFIC PROMPTS (APP MODEL MULTI-PAGES) */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar Navigation */}
            <aside className="space-y-2">
              <button
                onClick={() => setActiveView('hub')}
                className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-extrabold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Accueil du Hub de Documentation</span>
              </button>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1 block">
                  Les 8 Prompts & Modules
                </span>

                {promptsRegistry.map(p => {
                  const Icon = p.icon;
                  const isActive = activeView === p.id;

                  return (
                    <button
                      key={p.id}
                      onClick={() => setActiveView(p.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                        isActive 
                          ? 'bg-[#1E40AF] text-white shadow-md shadow-blue-700/25' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span className="truncate">{p.title}</span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {p.id.replace('prompt', 'P')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="lg:col-span-3 space-y-6">

              {/* ---------------- PROMPT 1: SKILL IA D'INTÉGRATION AUTONOME ---------------- */}
              {activeView === 'prompt1' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Prompt 1 Header Banner */}
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-200/80 shadow-md shadow-blue-500/5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          <Bot className="w-3.5 h-3.5" />
                          <span>PROMPT 1 • Assistant IA Spécialisé Antigravity</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
                          Skill IA d'Intégration Autonome
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm font-mono mt-1">
                          Identifiant : <span className="text-blue-600 font-bold">system:nanaswitch_integration_skill</span>
                        </p>
                      </div>

                      {/* Action Buttons: Copy System Prompt & Download */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          onClick={handleCopyFullSkill}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm ${
                            copiedPrompt 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-[#1E40AF] hover:bg-[#1E3A8A] text-white shadow-blue-600/20'
                          }`}
                        >
                          {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedPrompt ? 'Prompt Système Copié !' : 'Copier le Prompt Système'}</span>
                        </button>

                        <a
                          href="/downloads/nanaswitch-integration-skill.md"
                          download="nanaswitch-integration-skill.md"
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-2"
                        >
                          <Download className="w-4 h-4 text-slate-600" />
                          <span>Télécharger SKILL.md</span>
                        </a>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Ce Skill dote tout assistant IA (ChatGPT, Claude, Antigravity Agent, SasPay AI) de l'expertise intégrale de l'architecture NanaSwitch Cloud : modèle Zero-Trust, commutateur hybride (Agrégé vs BYOK), plafonds KYC (1M vs 5M XOF) et validation cryptographique HMAC-SHA256.
                    </p>

                    {/* Subtabs for Prompt 1 */}
                    <div className="flex border-b border-slate-200 pt-2 gap-4">
                      {[
                        { id: 'simulator', label: 'Simulateur de Chat IA (Test en Direct)', icon: Bot },
                        { id: 'code', label: 'Code Source du Prompt Système (SKILL.md)', icon: FileCode },
                        { id: 'specs', label: 'Spécifications Techniques', icon: Terminal }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setActiveTabPrompt1(t.id as any)}
                          className={`flex items-center gap-2 pb-3 text-xs font-extrabold border-b-2 transition ${
                            activeTabPrompt1 === t.id 
                              ? 'border-[#1E40AF] text-[#1E40AF]' 
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <t.icon className="w-4 h-4" />
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SUBTAB 1: LIVE INTERACTIVE CHAT SIMULATOR */}
                  {activeTabPrompt1 === 'simulator' && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                      
                      {/* Chat Header */}
                      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                            <Bot className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-extrabold text-white">NanaSwitch Integration Architect AI</h3>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">Agent actif • system:nanaswitch_integration_skill</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => setChatMessages([{
                            sender: 'assistant',
                            text: "👋 Bonjour ! Je suis l'Assistant IA d'Intégration NanaSwitch Cloud (NANASORE TECHNOLOGIES). Posez-moi vos questions techniques ou choisissez une question rapide ci-dessous."
                          }])}
                          className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Réinitialiser</span>
                        </button>
                      </div>

                      {/* Chat Messages Log */}
                      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 text-xs">
                        {chatMessages.map((msg, i) => (
                          <div 
                            key={i} 
                            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {msg.sender === 'assistant' && (
                              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1">
                                <Bot className="w-4 h-4" />
                              </div>
                            )}

                            <div className={`max-w-[85%] rounded-2xl p-4 leading-relaxed whitespace-pre-wrap ${
                              msg.sender === 'user'
                                ? 'bg-[#1E40AF] text-white shadow-sm'
                                : 'bg-white text-slate-800 border border-slate-200 shadow-xs'
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        ))}

                        {isAiTyping && (
                          <div className="flex gap-2 items-center text-slate-400 text-xs italic pl-10">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            <span>L'architecte IA analyse votre demande...</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Suggested Questions Bar */}
                      <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px]">
                        <span className="text-slate-400 font-bold shrink-0">Suggestions :</span>
                        {SIMULATED_PROMPTS.map((sp, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendQuestion(sp.q)}
                            className="shrink-0 px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg transition font-medium border border-slate-200/60"
                          >
                            {sp.q}
                          </button>
                        ))}
                      </div>

                      {/* Chat Input Bar */}
                      <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Posez une question à l'assistant IA d'intégration..."
                          value={userInput}
                          onChange={e => setUserInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSendQuestion()}
                          className="flex-1 bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none transition"
                        />
                        <button
                          onClick={() => handleSendQuestion()}
                          disabled={!userInput.trim() || isAiTyping}
                          className="px-4 py-2.5 bg-[#1E40AF] hover:bg-[#1E3A8A] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Envoyer</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 2: RAW SYSTEM PROMPT VIEWER */}
                  {activeTabPrompt1 === 'code' && (
                    <div className="bg-slate-900 rounded-3xl p-6 text-slate-100 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-mono font-bold text-slate-300">skills/nanaswitch-integration/SKILL.md</span>
                        </div>
                        <button
                          onClick={handleCopyFullSkill}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                        >
                          {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPrompt ? 'Copié' : 'Copier Tout'}</span>
                        </button>
                      </div>

                      <pre className="font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto max-h-[550px] p-2 select-all">
                        {SYSTEM_PROMPT_CONTENT}
                      </pre>
                    </div>
                  )}

                  {/* SUBTAB 3: ARCHITECTURE SPECS */}
                  {activeTabPrompt1 === 'specs' && (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 text-xs text-slate-700">
                      <h3 className="text-base font-extrabold text-slate-900">
                        Spécifications Directrices du Skill IA
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex items-center gap-2 text-blue-700 font-extrabold">
                            <ShieldCheck className="w-4 h-4" />
                            <span>1. Règle Zero-Trust Stricte</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">
                            L'IA interdit formellement d'exposer la clé secrète (<code className="text-blue-600 font-bold">ns_live_sk_*</code>) ou le secret Webhook (<code className="text-purple-600 font-bold">ns_whsec_*</code>) côté navigateur client (React, Vue, HTML). Seul le hash bcrypt est stocké dans Firestore.
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex items-center gap-2 text-emerald-700 font-extrabold">
                            <Layers className="w-4 h-4" />
                            <span>2. Moteur Hybride B2B</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">
                            L'IA oriente chaque développeur vers le bon mode : <strong>Agrégé</strong> (+1.5% marge, aucun contrat nécessaire) ou <strong>BYOK</strong> (0.02 XOF/req, clés personnelles SasPay/Sebpay).
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex items-center gap-2 text-amber-700 font-extrabold">
                            <Lock className="w-4 h-4" />
                            <span>3. Plafonds Risque KYC</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">
                            L'IA rappelle les seuils mensuels stricts : <strong>1 000 000 XOF</strong> pour les Particuliers et <strong>5 000 000 XOF</strong> pour les Entreprises avec coupe-circuit 403 Forbidden.
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex items-center gap-2 text-purple-700 font-extrabold">
                            <ShieldAlert className="w-4 h-4" />
                            <span>4. Anti-Rejeu HMAC-SHA256</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">
                            L'IA fournit des snippets certifiés avec comparaison timingSafeEqual et rejet des requêtes webhooks dont le timestamp dépasse 300 secondes.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ---------------- PROMPT 2: CLÉS ZERO-TRUST ---------------- */}
              {activeView === 'prompt2' && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">PROMPT 2 • SÉCURITÉ & AUTH</span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Matrice des Clés d'Authentification Zero-Trust</h2>
                    <p className="text-slate-500 text-xs mt-1">Gestion sécurisée des clés d'accès publiques et secrètes.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                          <th className="py-2.5 font-bold">Type</th>
                          <th className="py-2.5 font-bold">Préfixe / Format</th>
                          <th className="py-2.5 font-bold">Exposition</th>
                          <th className="py-2.5 font-bold">Stockage Firestore</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-3 font-bold text-slate-900">Public Key</td>
                          <td className="py-3 font-mono text-blue-600 font-bold">ns_live_pk_[32 hex]</td>
                          <td className="py-3 text-slate-600">Frontend / Plugins</td>
                          <td className="py-3 text-emerald-600 font-semibold">Clair (Identifiant)</td>
                        </tr>
                        <tr>
                          <td className="py-3 font-bold text-slate-900">Secret Key</td>
                          <td className="py-3 font-mono text-rose-600 font-bold">ns_live_sk_[32 hex]</td>
                          <td className="py-3 text-rose-600 font-bold">Serveur Uniquement</td>
                          <td className="py-3 text-purple-600 font-semibold">Haché (Bcrypt / SHA-256)</td>
                        </tr>
                        <tr>
                          <td className="py-3 font-bold text-slate-900">Webhook Secret</td>
                          <td className="py-3 font-mono text-purple-600 font-bold">ns_whsec_[64 hex]</td>
                          <td className="py-3 text-slate-600">Serveur Marchand</td>
                          <td className="py-3 text-blue-600 font-semibold">Vault Firestore Marchand</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm">Header HTTP obligatoire pour chaque requête backend :</h4>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto">
{`// Requête serveur avec la clé secrète
POST /v1/switch/route HTTP/1.1
Host: nana-payment-api.onrender.com
Content-Type: application/json
Authorization: Bearer ns_live_sk_89ab32c0f4...
x-nanaswitch-skey: ns_live_sk_89ab32c0f4...`}
                    </pre>
                  </div>
                </div>
              )}

              {/* ---------------- PROMPT 3: ROUTAGE DYNAMIQUE ---------------- */}
              {activeView === 'prompt3' && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">PROMPT 3 • CORE API GATEWAY</span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Routage Dynamique & API Gateway Mobile Money</h2>
                    <p className="text-slate-500 text-xs mt-1">Endpoint universel multi-opérateurs avec repli automatique (Failover).</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm">Exemple d'initiation d'un paiement universel :</h4>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto">
{`const res = await fetch('https://nana-payment-api.onrender.com/v1/switch/route', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ns_live_sk_YOUR_SECRET_KEY',
    'x-nanaswitch-skey': 'ns_live_sk_YOUR_SECRET_KEY'
  },
  body: JSON.stringify({
    amount: 15000,
    currency: 'XOF',
    country: 'BF',
    orderId: 'CMD-10492',
    customer: {
      name: 'Issa Ouédraogo',
      phone: '+22670112233'
    },
    returnUrl: 'https://maboutique.com/merci',
    callbackUrl: 'https://maboutique.com/api/webhook'
  })
});

const data = await res.json();
console.log('Lien de redirection client :', data.checkout_url);`}
                    </pre>
                  </div>
                </div>
              )}

              {/* ---------------- PROMPT 4: SIGNATURES WEBHOOK HMAC ---------------- */}
              {activeView === 'prompt4' && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-600">PROMPT 4 • SÉCURITÉ ANTI-REJEU</span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Vérification de Signature Webhook HMAC-SHA256</h2>
                    <p className="text-slate-500 text-xs mt-1">Protocole timing-safe avec tolérance temporelle de 300 secondes.</p>
                  </div>

                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto">
{`const crypto = require('crypto');

function verifyNanaSwitchWebhook(rawBody, signatureHeader, secretKey) {
  const parts = Object.fromEntries(signatureHeader.split(',').map(p => p.split('=')));
  const timestamp = parseInt(parts.t, 10);
  const signature = parts.v1;

  // Fenêtre anti-rejeu 5 minutes
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) {
    throw new Error('Timestamp expiré');
  }

  const expected = crypto
    .createHmac('sha256', secretKey)
    .update(\`\${timestamp}.\${rawBody}\`)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'));
}`}
                  </pre>
                </div>
              )}

              {/* ---------------- PROMPT 5: MODÈLE HYBRIDE B2B ---------------- */}
              {activeView === 'prompt5' && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">PROMPT 5 • BILLING & HYBRIDE</span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Modèle Hybride B2B : Agrégé vs SaaS BYOK</h2>
                    <p className="text-slate-500 text-xs mt-1">Choisissez entre le compte maître de régulation et l'injection de vos clés personnelles.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-2">
                      <span className="font-extrabold text-blue-900 text-sm">Mode Simplifié (AGREGATED)</span>
                      <p className="text-slate-600">Aucun contrat nécessaire. NanaSwitch encaisse via son compte maître de régulation. Marge retenue : +1.5% de frais de switch.</p>
                    </div>

                    <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/50 space-y-2">
                      <span className="font-extrabold text-purple-900 text-sm">Mode SaaS Développeur (BYOK)</span>
                      <p className="text-slate-600">Routage direct pass-through avec vos clés SasPay/Sebpay. 0% de commission de switch. Facturation SaaS à 0.02 XOF/requête.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- PROMPT 6: PLAFONDS RISQUE & KYC ---------------- */}
              {activeView === 'prompt6' && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">PROMPT 6 • RISQUE & CONFORMITÉ</span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Plafonds Risque & Profils KYC (1M vs 5M XOF)</h2>
                    <p className="text-slate-500 text-xs mt-1">Limites mensuelles strictes appliquées par le middleware de paiement.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                      <span className="font-black text-slate-900 text-sm">Particulier / Indépendant</span>
                      <p className="text-2xl font-black text-blue-600">1 000 000 XOF <span className="text-xs font-semibold text-slate-500">/ mois</span></p>
                      <p className="text-slate-500 text-[11px]">Pièces requises : CNIB (Recto & Verso) + Selfie vidéo/photo.</p>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                      <span className="font-black text-slate-900 text-sm">Compte Entreprise</span>
                      <p className="text-2xl font-black text-emerald-600">5 000 000 XOF <span className="text-xs font-semibold text-slate-500">/ mois</span></p>
                      <p className="text-slate-500 text-[11px]">Pièces requises : RCCM + IFU + CNIB & Selfie du gérant.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- PROMPT 7: WOOCOMMERCE PLUGIN ---------------- */}
              {activeView === 'prompt7' && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-teal-600">PROMPT 7 • EXTENSION CMS</span>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Plugin Officiel WooCommerce — NanaSwitch Gateway</h2>
                      <p className="text-slate-500 text-xs mt-1">Version 1.0.0 • High-Performance Order Storage (HPOS) Ready.</p>
                    </div>

                    <a 
                      href="/downloads/nanaswitch-gateway.zip" 
                      download="nanaswitch-gateway.zip"
                      className="px-4 py-2.5 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-extrabold rounded-xl shadow-md shadow-blue-700/20 transition flex items-center justify-center gap-2 shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>Télécharger l'archive .zip</span>
                    </a>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="font-extrabold text-slate-900 text-sm">Guide d'installation pas à pas :</h4>
                    <ol className="list-decimal list-inside space-y-2 text-slate-700 font-medium">
                      <li>Téléversez l'archive <code className="bg-slate-200 px-1 py-0.5 rounded">nanaswitch-gateway.zip</code> dans <strong>Extensions &gt; Ajouter &gt; Téléverser</strong> sur WordPress.</li>
                      <li>Activez l'extension puis rendez-vous dans <strong>WooCommerce &gt; Réglages &gt; Paiements &gt; NanaSwitch Gateway</strong>.</li>
                      <li>Sélectionnez votre mode (<code className="bg-slate-200 px-1 py-0.5 rounded">AGREGATED</code> ou <code className="bg-slate-200 px-1 py-0.5 rounded">BYOK</code>) et renseignez votre <strong>Public Key</strong>, <strong>Secret Key</strong> et <strong>Secret Webhook</strong>.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* ---------------- PROMPT 8: CODES D'ERREUR & DÉPANNAGE ---------------- */}
              {activeView === 'prompt8' && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">PROMPT 8 • DEBUGGING & SUPPORT</span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Matrice des Erreurs HTTP & Guide de Résolution</h2>
                    <p className="text-slate-500 text-xs mt-1">Codes de retour normalisés de l'API NanaSwitch Cloud.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { code: '400 Bad Request', msg: 'Paramètres manquants ou payload JSON invalide', fix: 'Vérifiez les champs amount, currency (XOF), orderId et customer.' },
                      { code: '401 Unauthorized', msg: 'Clé secrète absente ou invalide', fix: 'Vérifiez le header Authorization: Bearer ns_live_sk_... sans espaces.' },
                      { code: '402 Payment Required', msg: 'Solde de crédits API SaaS insuffisant (0.02 XOF)', fix: 'Rechargez votre solde de crédits API depuis l\'onglet Développeur.' },
                      { code: '403 Forbidden', msg: 'Plafond mensuel KYC atteint (1M / 5M XOF)', fix: 'Soumettez les pièces RCCM/IFU pour passer en profil Entreprise.' },
                      { code: '500 Server Error', msg: 'Erreur interne de passerelle partenaire', fix: 'Le switch retente automatiquement la transaction via la passerelle de secours.' }
                    ].map(err => (
                      <div key={err.code} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-slate-900 text-xs">{err.code}</span>
                          <span className="text-slate-500 text-[11px] font-medium">{err.msg}</span>
                        </div>
                        <p className="text-blue-700 font-semibold text-[11px]">👉 Résolution : {err.fix}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </main>
          </div>
        </div>
      )}

    </div>
  );
}
