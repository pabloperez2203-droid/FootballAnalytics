import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

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
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans h-full`}
    >
      <body className="min-h-full flex flex-col bg-bg text-txt antialiased font-sans">
        {/* Navbar */}
        <Navbar />

        {/* Contenido principal */}
        <main className="flex flex-col flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
