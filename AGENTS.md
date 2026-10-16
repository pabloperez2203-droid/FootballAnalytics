<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas de UI en Movimiento y Gamificación Deportiva (Sports Motion UI)

1. **Valores Numéricos Inmediatos**: Mostrar números y métricas de forma directa y limpia (sin animaciones de conteo que aumenten los números poco a poco).
2. **Barras con Transición Spring**: Todas las barras y medidores comparativos deben aplicar `transition-all duration-700 cubic-bezier(0.22, 1, 0.36, 1)`.
3. **Efectos Hover con Brillo Holográfico**: Usar la clase `.interactive-card` en tarjetas y KPIs para dotarlas de barrido diagonal de luz y halo glow en hover.
4. **Micro-interacciones y Reproducción Dinámica**: Proveer elementos de simulación temporal e interactividad continua (Live Match Ticker en loop continuo, Play/Pause de cronología en mapas de tiros).
5. **Animaciones y Efectos 3D Ligeros (Canvas/CSS)**: Priorizar siempre implementaciones nativas con Canvas 2D/3D matemático o transformaciones CSS aceleradas por hardware, evitando dependencias pesadas (como Three.js o Fiber) para mantener tiempos de carga instantáneos y 60 FPS fluidos.
