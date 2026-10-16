---
name: sports-motion-ui
description: Reglas y estándares de diseño interactivo, motion UI y gamificación para visualización deportiva en Next.js y Tailwind CSS
---

# Sports Motion UI & Gamificación

Estándar de animación fluida y micro-interacciones para dashboards y analítica deportiva avanzada (xG, fútbol y estadísticas).

## Principios Obligatorios

1. **Legibilidad Numérica Inmediata**:
   - Todo KPI, marcador, métrica porcentual y diferencial se muestra de forma directa y clara, sin animaciones de conteo gradual que entorpezcan la lectura de los datos.

2. **Transiciones Spring en Barras y Gráficos**:
   - Todas las barras horizontales, barras de progreso y tug-of-war deben usar `transition-all duration-700 cubic-bezier(0.22, 1, 0.36, 1)`.

3. **Efectos Hover con Brillo Holográfico (`.interactive-card`)**:
   - Las tarjetas de KPIs y cartas interactivas deben incluir el efecto de barrido diagonal de luz blanca sutil (`hover:before:translate-x-full`) y elevación con halo `glow`.

4. **Micro-interacciones y Simulación Deportiva**:
   - Mapas y timelines interactivos deben contar con controles de reproducción temporal (ej. *Play / Simular cronología*) para explorar el desarrollo de un partido minuto a minuto.
   - Destellos visuales sutiles en momentos clave (como goles o grandes ocasiones).

5. **Gráficos y Visuales 3D Ligeros (Canvas Nativo)**:
   - Para elementos ambientales inmersivos (ej. balones 3D, partículas orbitales o campos tridimensionales), priorizar Canvas HTML5 nativo con proyecciones matemáticas y aceleración por GPU sobre librerías pesadas (Three.js/Fiber), garantizando cero impacto en bundle size y 60 FPS.
