"use client";

import React from "react";
import { useCompetition } from "@/stores/filterStore";
import { UclStarball } from "./CompetitionBranding";

/**
 * Fondo ambiental inmersivo ultra-optimizado para el modo UEFA Champions League ("Champions Starlight Night")
 * - Usa degradados radiales nativos en lugar de costosos filtros blur() para 0ms de coste GPU.
 * - Sin mix-blend-mode en capas grandes para evitar invalidar el buffer de composición del navegador.
 * - Hardware accelerated con transform: translateZ(0) y will-change: transform.
 * - Envuelto en React.memo para no re-renderizar durante las navegaciones de página.
 */
function UclAmbientBackgroundComponent() {
  const { competition } = useCompetition();

  if (competition !== "ucl") return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{ contain: "strict", transform: "translateZ(0)" }}
    >
      {/* 1. Haces de luz superiores de estadio UEFA (gradientes radiales puros sin blur costoso) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[450px] opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.16) 0%, rgba(30, 58, 138, 0.08) 50%, transparent 80%)",
        }}
      />
      <div
        className="absolute -top-24 left-10 w-[450px] h-[450px] opacity-50"
        style={{
          background: "radial-gradient(circle, rgba(14, 165, 233, 0.14) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -top-24 right-10 w-[550px] h-[550px] opacity-50"
        style={{
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.14) 0%, transparent 70%)",
        }}
      />

      {/* 2. Patrón de microestrellas estático y ligero */}
      <div className="absolute inset-0 ucl-starlight-pattern opacity-35" />

      {/* 3. Marca de agua Starball en esquina superior derecha (aislada en GPU, sin mix-blend) */}
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] opacity-[0.035]"
        style={{ willChange: "transform", transform: "translateZ(0)" }}
      >
        <UclStarball className="w-full h-full" animate glow={false} />
      </div>

      {/* 4. Marca de agua Starball en esquina inferior izquierda */}
      <div
        className="absolute -bottom-40 -left-40 w-[560px] h-[560px] opacity-[0.025]"
        style={{ willChange: "transform", transform: "translateZ(0)" }}
      >
        <div style={{ animation: "spinSlow 45s linear infinite reverse" }}>
          <UclStarball className="w-full h-full" glow={false} />
        </div>
      </div>

      {/* 5. Haz de horizonte inferior en azul medianoche */}
      <div
        className="absolute bottom-0 inset-x-0 h-40"
        style={{
          background: "linear-gradient(to top, rgba(2, 4, 10, 0.8) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

const UclAmbientBackground = React.memo(UclAmbientBackgroundComponent);
export default UclAmbientBackground;
