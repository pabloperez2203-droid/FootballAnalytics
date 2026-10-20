"use client";

import React from "react";
import { useCompetition } from "@/stores/filterStore";

/**
 * Emblema "Starball" de la UEFA Champions League
 * Balón esférico icónico formado por 8 estrellas de 5 puntas conectadas
 */
export function UclStarball({
  className = "w-6 h-6",
  glow = true,
  animate = false,
}: {
  className?: string;
  glow?: boolean;
  animate?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} ${animate ? "animate-spin-slow" : ""} select-none shrink-0`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={glow && !animate ? { filter: "drop-shadow(0 0 8px rgba(56, 189, 248, 0.45))" } : undefined}
    >
      <defs>
        <radialGradient id="uclBallBg" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="45%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
        <radialGradient id="uclStarGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </radialGradient>
        <linearGradient id="uclRimGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Esfera base con sombreado 3D profundo */}
      <circle cx="50" cy="50" r="47" fill="url(#uclBallBg)" stroke="url(#uclRimGlow)" strokeWidth="1.5" />

      {/* Estrella central 1 */}
      <polygon
        points="50,22 53.5,31 63,31 55,37 58,46 50,40.5 42,46 45,37 37,31 46.5,31"
        fill="url(#uclStarGlow)"
        opacity="0.95"
      />

      {/* Estrella 2 (Noreste) */}
      <polygon
        points="68,14 70.5,21 78,21.5 72,26 74,33 68,29 62,33 64,26 58,21.5 65.5,21"
        fill="url(#uclStarGlow)"
        opacity="0.9"
        transform="rotate(15 68 24)"
      />

      {/* Estrella 3 (Este) */}
      <polygon
        points="78,42 80,48 87,49 81.5,53 83.5,60 78,56 72.5,60 74.5,53 69,49 76,48"
        fill="url(#uclStarGlow)"
        opacity="0.88"
        transform="rotate(40 78 51)"
      />

      {/* Estrella 4 (Sureste) */}
      <polygon
        points="67,69 69,76 76,77 70.5,81 72,88 67,84 62,88 63.5,81 58,77 65,76"
        fill="url(#uclStarGlow)"
        opacity="0.92"
        transform="rotate(75 67 78)"
      />

      {/* Estrella 5 (Sur) */}
      <polygon
        points="46,74 48.5,81 56,81.5 50,86 52,93 46,89 40,93 42,86 36,81.5 43.5,81"
        fill="url(#uclStarGlow)"
        opacity="0.85"
        transform="rotate(110 46 83)"
      />

      {/* Estrella 6 (Suroeste) */}
      <polygon
        points="24,66 26.5,73 34,73.5 28,78 30,85 24,81 18,85 20,78 14,73.5 21.5,73"
        fill="url(#uclStarGlow)"
        opacity="0.9"
        transform="rotate(145 24 75)"
      />

      {/* Estrella 7 (Oeste) */}
      <polygon
        points="19,38 21,45 28,45.5 22.5,50 24.5,57 19,53 13.5,57 15.5,50 10,45.5 17,45"
        fill="url(#uclStarGlow)"
        opacity="0.88"
        transform="rotate(180 19 47)"
      />

      {/* Estrella 8 (Noroeste) */}
      <polygon
        points="30,17 32.5,24 40,24.5 34,29 36,36 30,32 24,36 26,29 20,24.5 27.5,24"
        fill="url(#uclStarGlow)"
        opacity="0.9"
        transform="rotate(215 30 26)"
      />

      {/* Líneas de costura de las estrellas (seams de luz de la Starball) */}
      <circle cx="50" cy="50" r="47" stroke="rgba(125, 211, 252, 0.3)" strokeWidth="0.8" fill="none" />
      <path
        d="M50 22 L68 14 M63 31 L78 42 M58 46 L67 69 M50 40.5 L46 74 M42 46 L24 66 M37 31 L19 38 M45 37 L30 17"
        stroke="rgba(224, 242, 254, 0.45)"
        strokeWidth="0.8"
        strokeDasharray="1.5 1"
      />
      {/* Reflejo de luz estelar superior */}
      <ellipse cx="38" cy="24" rx="20" ry="10" fill="white" opacity="0.12" transform="rotate(-20 38 24)" />
    </svg>
  );
}

/**
 * Trofeo oficial de la UEFA Champions League: La Orejona (European Champion Clubs' Cup)
 */
export function UclTrophy({
  className = "w-6 h-6",
  glow = true,
}: {
  className?: string;
  glow?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 120"
      className={`${className} select-none shrink-0`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={glow ? { filter: "drop-shadow(0 0 10px rgba(251, 191, 36, 0.35))" } : undefined}
    >
      <defs>
        {/* Gradiente plateado cromado pulido */}
        <linearGradient id="silverTrophy" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="25%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="75%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="goldRibbon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <radialGradient id="trophyAura" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Aura posterior */}
      <circle cx="50" cy="55" r="40" fill="url(#trophyAura)" />

      {/* Asas gigantes ("Las Orejas") */}
      {/* Asa izquierda */}
      <path
        d="M34 26 C12 26 8 50 18 68 C24 77 34 80 37 77 C40 74 36 68 31 66 C22 62 18 48 26 34 C30 28 34 28 36 28 Z"
        fill="url(#silverTrophy)"
        stroke="#475569"
        strokeWidth="0.8"
      />
      {/* Asa derecha */}
      <path
        d="M66 26 C88 26 92 50 82 68 C76 77 66 80 63 77 C60 74 64 68 69 66 C78 62 82 48 74 34 C70 28 66 28 64 28 Z"
        fill="url(#silverTrophy)"
        stroke="#475569"
        strokeWidth="0.8"
      />

      {/* Cuerpo principal de la copa */}
      <path
        d="M32 24 C32 24 33 68 38 82 C42 92 58 92 62 82 C67 68 68 24 68 24 Z"
        fill="url(#silverTrophy)"
        stroke="#475569"
        strokeWidth="1"
      />

      {/* Cuello y pedestal */}
      <rect x="46" y="88" width="8" height="12" fill="url(#silverTrophy)" stroke="#475569" strokeWidth="0.8" />
      <polygon points="41,100 59,100 63,109 37,109" fill="url(#silverTrophy)" stroke="#334155" strokeWidth="0.8" />
      <rect x="33" y="109" width="34" height="6" rx="1.5" fill="#1e293b" stroke="url(#silverTrophy)" strokeWidth="0.8" />

      {/* Boca y borde superior de la copa */}
      <ellipse cx="50" cy="24" rx="18" ry="4" fill="url(#silverTrophy)" stroke="#334155" strokeWidth="1" />
      <ellipse cx="50" cy="24" rx="15" ry="2.5" fill="#334155" />

      {/* Detalle grabado frontal: Estrella central UCL y corona */}
      <polygon points="50,44 51.5,49 56,49 52,52 53.5,57 50,54 46.5,57 48,52 44,49 48.5,49" fill="#0284c7" />
      <path d="M42 62 Q50 67 58 62" stroke="#0284c7" strokeWidth="1.2" fill="none" />
      <rect x="44" y="70" width="12" height="2" fill="url(#goldRibbon)" rx="0.5" />
    </svg>
  );
}

/**
 * Logotipo moderno de LaLiga EA Sports
 */
export function LaLigaLogo({
  className = "w-6 h-6",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} select-none shrink-0`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="laligaRed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff5752" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      {/* Fondo hexagonal redondeado moderno */}
      <rect x="6" y="6" width="88" height="88" rx="22" fill="#0f172a" stroke="rgba(244, 63, 94, 0.3)" strokeWidth="1.5" />
      {/* La doble 'L' estilizada de LaLiga */}
      <path
        d="M28 26 L42 26 L42 62 L66 62 L66 74 L28 74 Z"
        fill="url(#laligaRed)"
      />
      <path
        d="M48 26 L62 26 L62 50 L74 50 L74 62 L48 62 Z"
        fill="#ffffff"
        opacity="0.95"
      />
    </svg>
  );
}

/**
 * Badge o Sello Oficial Decorativo para las cabeceras de sección
 * Cambia según la competición activa (`ucl` vs `laliga`)
 */
function CompetitionSealComponent({
  variant = "badge",
  className = "",
}: {
  variant?: "badge" | "watermark" | "compact";
  className?: string;
}) {
  const { competition } = useCompetition();
  const isUcl = competition === "ucl";

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold tracking-wider uppercase border transition-all ${
          isUcl
            ? "bg-[#070e28]/80 text-cyan-300 border-cyan-400/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
            : "bg-slate-900/80 text-emerald-300 border-emerald-400/25 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
        } ${className}`}
      >
        {isUcl ? (
          <UclStarball className="w-4 h-4" glow={false} animate />
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
        )}
        <span>{isUcl ? "UCL · LEAGUE PHASE" : "LALIGA EA SPORTS"}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden flex items-center gap-3.5 px-4 py-2.5 rounded-2xl border transition-all duration-300 backdrop-blur-xl ${
        isUcl
          ? "bg-gradient-to-r from-[#070e2b]/90 via-[#0b1b4f]/70 to-[#050b1f]/90 border-cyan-400/30 shadow-[0_4px_24px_-4px_rgba(56,189,248,0.25)] hover:border-cyan-400/50"
          : "bg-gradient-to-r from-slate-900/90 via-emerald-950/40 to-slate-900/90 border-emerald-500/25 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.15)] hover:border-emerald-500/40"
      } ${className}`}
    >
      {/* Resplandor ambiental de fondo */}
      <div
        className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl pointer-events-none ${
          isUcl ? "bg-cyan-500/15" : "bg-emerald-500/15"
        }`}
      />

      {/* Icono de la competición */}
      <div className="relative shrink-0 flex items-center justify-center">
        {isUcl ? (
          <div className="relative">
            <UclStarball className="w-7 h-7 sm:w-8 sm:h-8" glow={false} animate />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
          </div>
        ) : (
          <LaLigaLogo className="w-7 h-7 sm:w-8 sm:h-8" />
        )}
      </div>

      {/* Textos descriptivos de certificación oficial */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-mono font-bold tracking-widest uppercase ${
              isUcl ? "text-cyan-400" : "text-emerald-400"
            }`}
          >
            {isUcl ? "OFFICIAL UEFA DATA FEED" : "OFFICIAL LALIGA FEED"}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span className="text-[10px] font-mono text-slate-400">2026-27</span>
        </div>
        <span className="text-xs sm:text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
          {isUcl ? (
            <>
              <span>UEFA CHAMPIONS LEAGUE</span>
              <span className="hidden sm:inline px-1.5 py-0.2 text-[9px] font-mono font-semibold rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                36 TEAMS
              </span>
            </>
          ) : (
            <>
              <span>LALIGA EA SPORTS</span>
              <span className="hidden sm:inline px-1.5 py-0.2 text-[9px] font-mono font-semibold rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                20 CLUBS
              </span>
            </>
          )}
        </span>
        <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
          {isUcl ? "League Phase · Expected Goals Intel" : "Primera División · Radar xG & Táctica"}
        </span>
      </div>
    </div>
  );
}

export const CompetitionSeal = React.memo(CompetitionSealComponent);

