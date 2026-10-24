/**
 * @file salles-vip._index.jsx
 * @description Route Remix /salles-vip qui liste les Salles VIP
 */

import React from "react";
import SallesVipDiscoveryScreen from "../../src/components/vip/SallesVipDiscoveryScreen";

export function meta() {
  return [
    { title: "Salles VIP E-learning | Nanasore" },
    { name: "description", content: "Masterclasses d'experts et salons d'e-learning multi-salles." },
  ];
}

export default function SallesVipIndexRoute() {
  return (
    <div className="min-h-screen bg-[#060B18]">
      <SallesVipDiscoveryScreen
        onSelectRoom={(roomId) => {
          if (typeof window !== "undefined") {
            window.location.href = `/salles-vip/${roomId}`;
          }
        }}
        onBackToHome={() => {
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }}
      />
    </div>
  );
}
