import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import MatchTicker from "@/components/layout/MatchTicker";
import CompetitionThemeProvider from "@/components/layout/CompetitionThemeProvider";
import UclAmbientBackground from "@/components/ui/UclAmbientBackground";

// ─── Tipografía ───────────────────────────────────────────────────────────────
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// ─── Viewport para Móviles & Safe-Areas ───────────────────────────────────────
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#050811",
};

// ─── SEO / Metadata ───────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    template: "%s · xG Nexus",
    default: "xG Nexus — Inteligencia Táctica & Expected Goals",
  },
  description:
    "Plataforma de inteligencia táctica y telemetría avanzada de fútbol. Visualiza xG, modelos de tiro 3D, simulador estocástico de duelos y radar de rendimiento de LaLiga y UEFA Champions League.",
  keywords: ["xG Nexus", "xG", "fútbol", "telemetría", "LaLiga", "UEFA Champions League", "UCL", "estadísticas", "expected goals"],
};

// ─── Layout raíz ─────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans h-full`}
    >
      <body className="min-h-full flex flex-col bg-bg text-txt antialiased font-sans relative">
        <CompetitionThemeProvider>
          {/* Fondo ambiental inmersivo reactivo */}
          <UclAmbientBackground />

          {/* Navbar */}
          <Navbar />

          {/* Live Match Ticker */}
          <MatchTicker />

          {/* Contenido principal */}
          <main className="flex flex-col flex-1 relative z-10">
            {children}
          </main>
        </CompetitionThemeProvider>
      </body>
    </html>
  );
}
