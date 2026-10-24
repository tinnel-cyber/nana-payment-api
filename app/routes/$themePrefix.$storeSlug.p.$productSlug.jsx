/**
 * @file $themePrefix.$storeSlug.p.$productSlug.jsx
 * @description Route Remix officielle nsore.shop/:themePrefix/:storeSlug/p/:productSlug
 */

import React, { useEffect } from "react";
import { useParams } from "@remix-run/react";
import { resolveThemeFromPrefix, THEME_PREFIX_REGEX } from "../../../src/utils/themeRoutePrefix";

export function meta({ params }) {
  const storeSlug = params?.storeSlug || "Boutique";
  const productSlug = params?.productSlug || "Produit";

  return [
    { title: `${productSlug} — ${storeSlug} | nsore.shop` },
    { name: "description", content: `Commandez ${productSlug} sur la vitrine officielle de ${storeSlug}.` },
  ];
}

export async function loader({ params }) {
  const { themePrefix, storeSlug, productSlug } = params;
  const isValidPrefix = THEME_PREFIX_REGEX.test(themePrefix || "");
  const resolved = resolveThemeFromPrefix(themePrefix || "");

  return {
    themePrefix,
    storeSlug,
    productSlug,
    isValidPrefix,
    themeId: resolved?.themeId || "theme-default",
  };
}

export default function ThemeProductRoute() {
  const { themePrefix, storeSlug, productSlug } = useParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [themePrefix, storeSlug, productSlug]);

  return null;
}
