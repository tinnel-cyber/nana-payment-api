/**
 * @file salles-vip.$id.jsx
 * @description Route Remix dynamique /salles-vip/$id
 */

import React from "react";
import { useParams } from "@remix-run/react";
import SalleVipRoomView from "../../src/components/vip/SalleVipRoomView";

export function meta({ params }) {
  return [
    { title: `Salle VIP ${params.id || ""} | Nanasore E-learning` },
    { name: "description", content: "Masterclass en direct avec leçons vidéo et chat temps réel." },
  ];
}

export default function DynamicSalleVipRoute() {
  const params = useParams();
  const roomId = params.id || "telecom-fintech-masterclass";

  return (
    <div className="min-h-screen bg-[#060B18]">
      <SalleVipRoomView
        roomId={roomId}
        onBackToDiscovery={() => {
          if (typeof window !== "undefined") {
            window.location.href = "/salles-vip";
          }
        }}
      />
    </div>
  );
}
