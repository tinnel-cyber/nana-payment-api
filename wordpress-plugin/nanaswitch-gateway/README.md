# 🚀 NanaSwitch Gateway for WooCommerce

Extension WooCommerce officielle développée par **NANASORE TECHNOLOGIES** pour l'intégration de la passerelle intelligente **NanaSwitch Cloud**.

---

## 🌟 Fonctionnalités

- **Aiguillage Multi-Opérateurs :** Orange Money (BF, CI, SN), Moov Africa (BF, CI, BJ), Wave (BF, CI, SN), MTN (CI, BJ) et LigdiCash (Hosted Checkout / Wallets).
- **Mode Hybride :**
  - **Mode Simplifié (`AGREGATED`) :** Collecte via le compte maître NanaSwitch avec commission de +1.5%.
  - **Mode BYOK (`BYOK`) :** Vos propres clés d'API partenaires SasPay & Sebpay avec débit de 0,02 XOF par requête.
- **Sécurité Maximale :**
  - Requêtes API Zero-Trust avec en-têtes `x-nanaswitch-skey` et `Authorization: Bearer`.
  - Notifications Webhooks protégées par signature cryptographique **HMAC-SHA256** (`x-nanaswitch-signature`) et horodatage anti-rejeu de 5 minutes.
- **Compatibilité WooCommerce HPOS :** Conforme aux dernières architectures WooCommerce (Custom Order Tables).

---

## 📦 Installation Facile (.zip)

1. Téléchargez le fichier **`nanaswitch-gateway.zip`**.
2. Dans WordPress, rendez-vous dans : **Extensions > Ajouter > Téléverser une extension**.
3. Choisissez le fichier `.zip` et cliquez sur **Installer maintenant**, puis **Activer**.
4. Allez dans **WooCommerce > Réglages > Paiements > NanaSwitch Gateway** pour saisir vos clés d'API.

---

## ⚙️ Configuration Requise

- WordPress 5.8 ou supérieur
- WooCommerce 6.0 ou supérieur (testé jusqu'à 9.2+)
- PHP 7.4 ou supérieur (compatible PHP 8.0, 8.1, 8.2, 8.3)
- Extension PHP OpenSSL / cURL active
