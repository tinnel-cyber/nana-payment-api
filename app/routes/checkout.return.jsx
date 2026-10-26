/**
 * @file checkout.return.jsx
 * @description Route Remix pour le retour après Sebpay Hosted Checkout Session (/checkout/return)
 */

import React from 'react';
import CheckoutReturnView from '../../src/components/payment/CheckoutReturnView';

export function meta() {
  return [
    { title: "Vérification du Paiement - NaNa Store" },
    { property: "og:title", content: "Vérification du Paiement - NaNa Store" },
    { property: "og:description", content: "Confirmation de votre commande suite à votre paiement sécurisé Sebpay" }
  ];
}

export default function CheckoutReturnRoute() {
  return <CheckoutReturnView />;
}
