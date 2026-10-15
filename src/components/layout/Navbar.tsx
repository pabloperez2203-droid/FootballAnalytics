"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PageContainer from "./PageContainer";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Command Center",
      icon: (
        <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    },
    {
      href: "/matches",
      label: "Match Intel",
      icon: (
        <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      )
    },
    {
      href: "/teams",
      label: "Equipos",
      icon: (
        <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        </svg>
      )
    },
    {
      href: "/players",
      label: "Players",
      icon: (
        <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      )
    },
    {
      href: "/motor-xg",
      label: "Motor xG",
      icon: (
        <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
          <path d="M16 7h6v6" />
        </svg>
      )
    }
  ];

  return (
    <header className="backdrop-blur-md bg-slate-950/80 sticky top-0 z-50 border-b border-white/10 transition-colors">
      <PageContainer className="h-16 flex items-center gap-4 lg:gap-8">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <span
            className="w-9 h-9 rounded-xl grid place-items-center transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-500/50 shadow-lg shadow-emerald-500/10"
            style={{
              background: "rgba(16,185,129,.12)",
              border: "1px solid rgba(16,185,129,.35)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 20L20 4M4 20h16M4 20V4" />
            </svg>
          </span>
          <span>
            <span className="block font-bold tracking-tight text-lg leading-none text-white group-hover:text-emerald-400 transition-colors">xG Lab</span>
            <span className="lbl hidden lg:block mt-1 font-mono text-[10px] text-slate-400" style={{ letterSpacing: ".1em" }}>
              Eficiencia ofensiva
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className={isActive ? "text-emerald-400" : "text-slate-400"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-2.5">
          <button
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all text-slate-300 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"></span>
            <span>LaLiga EA Sports</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7d878d" strokeWidth="2.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <span
            className="hidden sm:inline-block px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 bg-white/[0.03] border border-white/5"
          >
            2026-27
          </span>
          <div
            className="w-9 h-9 rounded-xl grid place-items-center text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 shadow-sm"
          >
            xG
          </div>
        </div>
      </PageContainer>

      {/* Mobile Navigation */}
      <nav aria-label="Principal móvil" className="md:hidden px-4 pb-2.5 overflow-x-auto border-t border-white/5 pt-2">
        <ul className="flex items-center gap-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className={isActive ? "text-emerald-400" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
