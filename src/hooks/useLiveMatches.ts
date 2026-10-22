"use client";

import useSWR from "swr";
import { LiveMatchData, LiveResponse } from "@/app/api/live-matches/route";

const fetcher = async (url: string): Promise<LiveResponse> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  return res.json();
};

export function useLiveMatches(competition: "laliga" | "ucl" | "all" = "all") {
  const endpoint =
    competition && competition !== "all"
      ? `/api/live-matches?comp=${competition}`
      : `/api/live-matches`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<LiveResponse>(
    endpoint,
    fetcher,
    {
      // Si hay partidos en juego (LIVE o HT), polling automático cada 30s.
      // Si no hay partidos en juego, relajar a 5 minutos (300.000 ms).
      refreshInterval: (latestData) => {
        if (latestData?.has_live) {
          return 30000; // 30s
        }
        return 300000; // 5 minutos
      },
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
    }
  );

  const matches: LiveMatchData[] = data?.matches || [];
  const liveMatches = matches.filter((m) => m.status === "LIVE" || m.status === "HT");
  const hasLive = data?.has_live ?? liveMatches.length > 0;

  return {
    matches,
    liveMatches,
    hasLive,
    lastUpdated: data?.last_updated || null,
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(),
  };
}
