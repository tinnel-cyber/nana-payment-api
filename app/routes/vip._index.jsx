/**
 * @file vip._index.jsx
 * @description Route Remix /vip qui liste les Salles VIP (récupérées depuis Firebase Firestore collection 'rooms')
 */

import React, { useState, useEffect } from "react";
import SallesVipDiscoveryScreen from "../../src/components/vip/SallesVipDiscoveryScreen";

export function meta() {
  return [
    { title: "Salles VIP E-learning | Nanasore" },
    { name: "description", content: "Masterclasses d'experts et salons d'e-learning multi-salles." },
  ];
}

export default function VipRoomsRoute() {
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      if (pathname.startsWith("/vip/salle/")) {
        const parts = pathname.split("/vip/salle/");
        if (parts[1]) setSelectedRoomId(parts[1].split("/")[0].split("?")[0]);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#060B18]">
      <SallesVipDiscoveryScreen
        onSelectRoom={(roomId) => {
          if (typeof window !== "undefined") {
            window.location.href = `/vip/salle/${roomId}`;
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
