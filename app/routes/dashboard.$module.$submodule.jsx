/**
 * @file dashboard.$module.$submodule.jsx
 * @description Route Remix officielle /dashboard/:module/:submodule
 * Prend en charge les sous-modules dédiés et l'identifiant/slug de boutique du tenant.
 */

import React, { useEffect } from "react";
import { useParams } from "@remix-run/react";

export function meta({ params }) {
  const mod = params?.module || "module";
  const sub = params?.submodule || "espace";
  return [
    { title: `${sub} (${mod}) — Dashboard | Nanasore OS` },
    { name: "description", content: `Sous-module ${sub} du module ${mod} sur le Tableau de bord Nanasore.` },
  ];
}

export async function loader({ params }) {
  return {
    module: params.module || "",
    submodule: params.submodule || "",
  };
}

export default function DashboardSubmoduleRoute() {
  const { module, submodule } = useParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [module, submodule]);

  return null;
}
