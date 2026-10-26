=== NanaSwitch Gateway for WooCommerce ===
Contributors: nanasore, konkobo
Tags: payment, woocommerce, mobile-money, orange-money, moov-money, wave, mtn, ligdicash, uemoa, burkina-faso, cote-divoire, senegal, benin
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Passerelle de paiement intelligente et multi-opérateurs (Orange Money, Moov Africa, Wave, MTN, LigdiCash) NanaSwitch Cloud pour WooCommerce.

== Description ==

NanaSwitch Gateway pour WooCommerce permet à votre boutique e-commerce d'encaisser des paiements Mobile Money et Cartes Bancaires dans toute la zone UEMOA (Burkina Faso, Côte d'Ivoire, Sénégal, Bénin) avec un système d'aiguillage intelligent et de bascule automatique en cas d'indisponibilité d'un réseau télécom.

= Fonctionnalités Principales =

* **Multi-Opérateurs Unifié :** Acceptez Orange Money, Moov Africa, Wave, MTN Mobile Money et LigdiCash via une seule intégration.
* **Smart Failover :** Bascule automatique instantanée en cas de panne opérateur ou de rejet d'OTP.
* **Sécurité Zero-Trust & Webhooks HMAC-SHA256 :** Validation cryptographique de chaque notification entrante avec fenêtre anti-rejeu de 5 minutes.
* **Deux Modes d'Intégration :**
  - **Mode Simplifié (Agrégé) :** Encaissement via le compte maître NanaSwitch avec +1.5% de marge platforme.
  - **Mode BYOK (SaaS / API Router) :** Utilisation directe de vos propres comptes SasPay/Sebpay sans commission avec facturation à 0,02 XOF par transaction.
* **Compatibilité HPOS (High-Performance Order Storage) :** Pleinement compatible avec les tables de commandes personnalisées de WooCommerce 8 et 9+.

== Installation ==

1. Téléversez l'archive `.zip` via le menu **Extensions > Ajouter une extension > Téléverser une extension** dans votre administration WordPress.
2. Activez l'extension.
3. Rendez-vous dans **WooCommerce > Réglages > Paiements > NanaSwitch**.
4. Renseignez votre Clé Publique (`ns_live_pk_...`), votre Clé Secrète (`ns_live_sk_...`) et votre Secret Webhook (`ns_whsec_...`).
5. Copiez l'URL de Webhook indiquée et collez-la dans votre console NanaSwitch Cloud.

== Changelog ==

= 1.0.0 =
* Version initiale certifiée avec support HPOS, Webhook HMAC-SHA256 et routage intelligent UEMOA.
