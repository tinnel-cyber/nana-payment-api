/**
 * @file $themePrefix.$storeSlug.jsx
 * @description Route Remix officielle nsore.shop/:themePrefix/:storeSlug
 * - Thèmes présents : 2 premières lettres (se, dp, et, ms, eo, ep, lp...)
 * - Blank Themes : chiffres romains (i, ii, v, x...)
 */

import React, { useEffect } from "react";
import { useParams } from "@remix-run/react";
import { resolveThemeFromPrefix, THEME_PREFIX_REGEX } from "../../src/utils/themeRoutePrefix";

export function meta({ params }) {
  const storeSlug = params?.storeSlug || "Boutique";
  const themePrefix = params?.themePrefix || "se";
  const resolved = resolveThemeFromPrefix(themePrefix);
  const themeLabel = resolved?.isBlank 
    ? `Architect Blank Theme (${themePrefix.toUpperCase()})` 
    : (resolved?.themeId || "Vitrine Officielle");

  return [
    { title: `${storeSlug} — Vitrine Officielle | nsore.shop` },
    { name: "description", content: `Visitez la vitrine officielle de ${storeSlug} propulsée par Nanasore (${themeLabel}).` },
  ];
}

export async function loader({ params }) {
  const { themePrefix, storeSlug } = params;
  const isValidPrefix = THEME_PREFIX_REGEX.test(themePrefix || "");
  const resolved = resolveThemeFromPrefix(themePrefix || "");

  return {
    themePrefix,
    storeSlug,
    isValidPrefix,
    themeId: resolved?.themeId || "theme-default",
    isBlank: Boolean(resolved?.isBlank),
  };
}

export default function ThemeStoreRoute() {
  const { themePrefix, storeSlug } = useParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [themePrefix, storeSlug]);

  return null;
}
