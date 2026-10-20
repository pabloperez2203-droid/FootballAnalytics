"use client";

import React, { useEffect } from "react";
import { useCompetition } from "@/stores/filterStore";

export default function CompetitionThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { competition } = useCompetition();

  useEffect(() => {
    // Aplicar atributo a nivel html y body para estilos CSS globales
    document.documentElement.setAttribute("data-competition", competition);
    document.body.setAttribute("data-competition", competition);
  }, [competition]);

  return (
    <div
      id="competition-root"
      data-competition={competition}
      className="contents"
    >
      {children}
    </div>
  );
}
