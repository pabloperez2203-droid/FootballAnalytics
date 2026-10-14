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
    <article className={`card kpi flex flex-col justify-between ${className}`} style={style}>
      <div className="flex items-center justify-between">
        <span className="lbl">{title}</span>
        {delta && (
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={
              deltaType === "pos"
                ? { background: "rgba(16,185,129,.12)", color: "var(--em)" }
                : deltaType === "neg"
                ? { background: "rgba(249,115,22,.12)", color: "var(--or)" }
                : {}
            }
          >
            {deltaType === "pos" ? "▲" : deltaType === "neg" ? "▼" : ""} {delta}
          </span>
        )}
      </div>
      <div className="mt-5">
        <div className={`text-3xl md:text-5xl font-semibold tracking-tight ${valueClassName}`}>
          {value}
        </div>
        {subtitle && (
          <div className="text-sm mt-2" style={{ color: "var(--mut)" }}>
            {subtitle}
          </div>
        )}
      </div>
    </article>
  );
}
