import React from "react";

interface KpiCardProps {
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  delta?: string | React.ReactNode;
  deltaType?: "pos" | "neg" | "neu";
  className?: string;
  style?: React.CSSProperties;
  valueClassName?: string;
  imageUrl?: string;
  crestUrl?: string;
  children?: React.ReactNode;
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
  imageUrl,
  crestUrl,
  children,
}: KpiCardProps) {
  return (
    <article
      className={`glass-card interactive-card rounded-2xl p-4 sm:p-6 flex flex-col justify-between ${className}`}
      style={style}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="lbl font-semibold">{title}</span>
        {delta && (
          <span
            className={`text-xs font-mono px-2 sm:px-2.5 py-0.5 rounded-full font-semibold border ${
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

      <div className="mt-3.5 sm:mt-5 flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className={`text-2xl sm:text-3xl md:text-5xl font-mono font-bold tracking-tight tabular-nums ${valueClassName}`}>
              {value}
            </div>
            {subtitle && (
              <div className="text-xs sm:text-sm mt-1 sm:mt-2 font-normal text-slate-400 truncate">
                {subtitle}
              </div>
            )}
          </div>

          {imageUrl && (
            <div className="relative shrink-0">
              <img
                src={imageUrl}
                alt="Player avatar"
                className="w-14 h-14 rounded-full object-cover border-2 border-white/15 shadow-lg bg-slate-800"
              />
              {crestUrl && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-white/20 p-0.5 shadow-md flex items-center justify-center">
                  <img
                    src={crestUrl}
                    alt="Team crest"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    </article>
  );
}
