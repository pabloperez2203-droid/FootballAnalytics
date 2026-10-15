import React from "react";

interface KpiCardProps {
  title: string;
  value: string | React.ReactNode;
  subtitle?: string;
  delta?: string | React.ReactNode;
  deltaType?: "pos" | "neg" | "neu";
  className?: string;
  style?: React.CSSProperties;
  valueClassName?: string;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  delta,
  deltaType = "neu",
  className = "",
  style = {},
  valueClassName = "",
}: KpiCardProps) {
  return (
    <article
      className={`glass-card rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 ${className}`}
      style={style}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="lbl font-semibold">{title}</span>
        {delta && (
          <span
            className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-semibold border ${
              deltaType === "pos"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                : deltaType === "neg"
                ? "bg-orange-500/10 text-orange-400 border-orange-500/25"
                : "bg-white/5 text-slate-400 border-white/10"
            }`}
          >
            {deltaType === "pos" ? "▲" : deltaType === "neg" ? "▼" : ""} {delta}
          </span>
        )}
      </div>
      <div className="mt-5">
        <div className={`text-3xl md:text-5xl font-mono font-bold tracking-tight tabular-nums ${valueClassName}`}>
          {value}
        </div>
        {subtitle && (
          <div className="text-sm mt-2 font-normal text-slate-400">
            {subtitle}
          </div>
        )}
      </div>
    </article>
  );
}
