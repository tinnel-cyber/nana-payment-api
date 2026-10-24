/**
 * @file $themePrefix.$storeSlug.f.$funnelSlug.jsx
 * @description Route Remix officielle nsore.shop/:themePrefix/:storeSlug/f/:funnelSlug
 */

import React, { useEffect } from "react";
import { useParams } from "@remix-run/react";
import { resolveThemeFromPrefix, THEME_PREFIX_REGEX } from "../../../src/utils/themeRoutePrefix";

export function meta({ params }) {
  const storeSlug = params?.storeSlug || "Boutique";
  const funnelSlug = params?.funnelSlug || "Offre Spéciale";

  return [
    { title: `${funnelSlug} — Offre Flash | ${storeSlug}` },
    { name: "description", content: `Découvrez l'offre exclusive ${funnelSlug} sur ${storeSlug}.` },
  ];
}

export async function loader({ params }) {
  const { themePrefix, storeSlug, funnelSlug } = params;
  const isValidPrefix = THEME_PREFIX_REGEX.test(themePrefix || "");
  const resolved = resolveThemeFromPrefix(themePrefix || "");

  return {
    themePrefix,
    storeSlug,
    funnelSlug,
    isValidPrefix,
    themeId: resolved?.themeId || "theme-default",
  };
}

export default function ThemeFunnelRoute() {
  const { themePrefix, storeSlug, funnelSlug } = useParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [themePrefix, storeSlug, funnelSlug]);

  return null;
}
