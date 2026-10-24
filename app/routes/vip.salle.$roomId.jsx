/**
 * @file vip.salle.$roomId.jsx
 * @description Route Remix dynamique /vip/salle/$roomId
 * Intègre les deux onglets ('Leçons Vidéo' et 'Direct') et le Chat en direct temps réel WebSocket.
 */

import React from "react";
import { useParams } from "@remix-run/react";
import SalleVipRoomView from "../../src/components/vip/SalleVipRoomView";

export function meta({ params }) {
  return [
    { title: `Salle VIP ${params.roomId || ""} | Nanasore E-learning` },
    { name: "description", content: "Masterclass en direct avec leçons vidéo et chat temps réel." },
  ];
}

export default function IndividualVipRoomRoute() {
  const params = useParams();
  const roomId = params.roomId || "telecom-fintech-masterclass";

  return (
    <div className="min-h-screen bg-[#060B18]">
      <SalleVipRoomView
        roomId={roomId}
        onBackToDiscovery={() => {
          if (typeof window !== "undefined") {
            window.location.href = "/vip";
          }
        }}
      />
    </div>
  );
}
