/**
 * @file admin.hub-builder.jsx
 * @description Route Remix officielle /admin/hub-builder
 * Constructeur Dynamique Super-Admin pour le Central Hub
 */

import React from "react";
import { HubBuilderPage } from "@/pages/admin/HubBuilder";

export function meta() {
  return [
    { title: "Constructeur Central Hub — Super-Admin | Nanasore" },
    { name: "description", content: "Constructeur dynamique des cartes et rangées pour le Central Hub." },
  ];
}

export default function AdminHubBuilderRoute() {
  return <HubBuilderPage />;
}
