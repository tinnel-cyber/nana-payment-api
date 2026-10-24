/**
 * @file dashboard._index.jsx
 * @description Route Remix officielle /dashboard (Hub Central - Quartier Général)
 */

import React, { useEffect } from "react";

export function meta() {
  return [
    { title: "Tableau de Bord Central | Nanasore OS" },
    { name: "description", content: "Quartier Général, gestion des modules, boutiques et indicateurs financiers." },
  ];
}

export default function DashboardIndexRoute() {
  useEffect(() => {
    // Si exécuté dans l'environnement SPA unifié, assure le rendu du Hub Central
    if (typeof window !== "undefined") {
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, []);

  return null;
}
