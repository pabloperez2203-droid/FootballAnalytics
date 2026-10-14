import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

// ─── Tipografía ───────────────────────────────────────────────────────────────
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

// ─── SEO / Metadata ───────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    template: "%s · xG Lab",
    default: "xG Lab — Analítica Avanzada de Fútbol",
  },
  description:
    "Plataforma de analítica avanzada de fútbol. Visualiza xG, eficiencia ofensiva, radar de rendimiento y tendencias de LaLiga en tiempo real.",
  keywords: ["xG", "fútbol", "analítica", "LaLiga", "estadísticas", "expected goals"],
};

// ─── Layout raíz ─────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-bg text-txt antialiased">
        {/* Navbar fija — altura 52px, definida en .navbar de globals.css */}
        <Navbar />

        {/* Contenido principal — padding-top compensa la navbar fija */}
        <main className="flex flex-col flex-1 pt-[52px]">
          {children}
        </main>
      </body>
    </html>
  );
}
