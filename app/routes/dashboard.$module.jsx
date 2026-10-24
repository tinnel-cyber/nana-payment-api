/**
 * @file dashboard.$module.jsx
 * @description Route Remix officielle /dashboard/:module
 * Permet d'adresser directement chaque module de façon prévisible et cohérente.
 */

import React, { useEffect } from "react";
import { useParams } from "@remix-run/react";

export function meta({ params }) {
  const mod = params?.module || "module";
  const formattedTitle = mod.charAt(0).toUpperCase() + mod.slice(1);
  return [
    { title: `${formattedTitle} — Dashboard | Nanasore OS` },
    { name: "description", content: `Module officiel ${mod} sur le Tableau de bord Nanasore.` },
  ];
}

export async function loader({ params }) {
  return {
    module: params.module || "",
  };
}

export default function DashboardModuleRoute() {
  const { module } = useParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [module]);

  return null;
}
