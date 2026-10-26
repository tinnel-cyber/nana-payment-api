# 📚 NanaSwitch Cloud — Site de Documentation Autonome (`docs-site`)

Ce dossier contient le **site autonome de documentation publique** pour **NanaSwitch Cloud** (Entité : **NANASORE TECHNOLOGIES**).

---

## 🎯 Directives d'Architecture & Sécurité

1. **100% Public & Libre d'Accès :**
   - Aucune authentification requise, aucun token, aucun compte nécessaire pour consulter l'intégralité de la documentation et copier les prompts ou les SDKs.
2. **Découplé du Dashboard Marchand :**
   - Ne contient aucun code sensible ni aucune clé d'administration.
   - Propose un bouton unique d'action **"Se connecter / S'inscrire"** redirigeant vers la Console Cloud NanaSwitch (`/nana-switch`).
3. **8 Sections Validées :**
   - **Section 1 :** Skill IA d'Intégration Autonome (`system:nanaswitch_integration_skill`) avec bouton de copie et téléchargement de `SKILL.md`.
   - **Section 2 :** Matrice des Clés Zero-Trust (`ns_live_pk_*`, `ns_live_sk_*`) et sécurisation serveur.
   - **Section 3 :** Routage Dynamique & API Gateway Mobile Money (`POST /v1/switch/route`).
   - **Section 4 :** Signatures Webhook HMAC-SHA256 & Anti-Rejeu (300 secondes).
   - **Section 5 :** Modèle Hybride B2B (Mode Agrégé +1.5% marge vs Mode BYOK 0.02 XOF/req avec coupe-circuit 402).
   - **Section 6 :** Plafonds Risque & Profils KYC (1 000 000 XOF Particulier vs 5 000 000 XOF Entreprise).
   - **Section 7 :** Plugin Officiel WooCommerce (`nanaswitch-gateway.zip`, compatible HPOS).
   - **Section 8 :** Matrice des Codes d'Erreur HTTP (400, 401, 402, 403, 500) et Guide de Résolution.

---

## 🚀 Déploiement Autonome

Ce site statique ultra-performant peut être hébergé sur :
- **Sous-domaine dédié :** `https://docs.nanaswitch.com`
- **Cloudflare Pages / Vercel / Netlify / GitHub Pages**
- **Nginx / Apache statique**

### Commandes Locales :
```bash
cd docs-site
npx vite
# ou ouvrir directement index.html dans un navigateur
```
