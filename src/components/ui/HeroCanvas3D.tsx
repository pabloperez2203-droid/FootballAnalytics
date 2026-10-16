"use client";

import React, { useEffect, useRef } from "react";

export default function HeroCanvas3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    // Redimensionar respetando DPI para máxima nitidez en pantallas retina
    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // ─── Generación de la esfera geodésica / Balón de fútbol ───────────────
    // 12 vértices del icosaedro regular
    const phi = (1 + Math.sqrt(5)) / 2;
    const baseVerts: [number, number, number][] = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
    ];

    // Normalizar a radio unitario
    const normalize = (v: [number, number, number]): [number, number, number] => {
      const len = Math.hypot(v[0], v[1], v[2]);
      return [v[0] / len, v[1] / len, v[2] / len];
    };

    const normBase = baseVerts.map(normalize);

    // Encontrar las 30 aristas base (distancia entre vértices conectados ~ 1.05 en esfera unitaria)
    const baseEdges: [number, number][] = [];
    for (let i = 0; i < normBase.length; i++) {
      for (let j = i + 1; j < normBase.length; j++) {
        const d = Math.hypot(
          normBase[i][0] - normBase[j][0],
          normBase[i][1] - normBase[j][1],
          normBase[i][2] - normBase[j][2]
        );
        if (d < 1.1) {
          baseEdges.push([i, j]);
        }
      }
    }

    // Subdivisión: puntos medios de cada arista proyectados a la esfera
    const allVertices: [number, number, number][] = [...normBase];
    const edgeMidpointMap = new Map<string, number>();

    baseEdges.forEach(([i, j]) => {
      const mid: [number, number, number] = [
        (normBase[i][0] + normBase[j][0]) / 2,
        (normBase[i][1] + normBase[j][1]) / 2,
        (normBase[i][2] + normBase[j][2]) / 2,
      ];
      const normMid = normalize(mid);
      const newIdx = allVertices.length;
      allVertices.push(normMid);
      edgeMidpointMap.set(`${Math.min(i, j)}-${Math.max(i, j)}`, newIdx);
    });

    // Construir la red de conexiones (aristas geodésicas del balón)
    const edges: [number, number][] = [];
    const edgeSet = new Set<string>();

    const addEdge = (a: number, b: number) => {
      const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([a, b]);
      }
    };

    // Conectar aristas subdivididas
    baseEdges.forEach(([i, j]) => {
      const midIdx = edgeMidpointMap.get(`${Math.min(i, j)}-${Math.max(i, j)}`)!;
      addEdge(i, midIdx);
      addEdge(midIdx, j);
    });

    // Conectar puntos medios contiguos para crear la malla de hexágonos y pentágonos
    for (let i = 0; i < allVertices.length; i++) {
      for (let j = i + 1; j < allVertices.length; j++) {
        const d = Math.hypot(
          allVertices[i][0] - allVertices[j][0],
          allVertices[i][1] - allVertices[j][1],
          allVertices[i][2] - allVertices[j][2]
        );
        if (d > 0.55 && d < 0.65) {
          addEdge(i, j);
        }
      }
    }

    // ─── Partículas de datos que orbitan el balón ──────────────────────────
    const NUM_PARTICLES = 36;
    const particles = Array.from({ length: NUM_PARTICLES }).map((_, idx) => {
      const theta = Math.random() * Math.PI * 2;
      const phiAngle = (Math.random() - 0.5) * Math.PI;
      const r = 1.25 + Math.random() * 0.45; // Orbitando fuera del radio del balón
      return {
        x: r * Math.cos(phiAngle) * Math.cos(theta),
        y: r * Math.sin(phiAngle),
        z: r * Math.cos(phiAngle) * Math.sin(theta),
        speed: 0.003 + Math.random() * 0.005,
        radius: 1 + Math.random() * 1.8,
        color: idx % 3 === 0 ? "#10b981" : idx % 3 === 1 ? "#38bdf8" : "#fbbf24",
      };
    });

    // ─── Interacción con el cursor (Parallax 3D) ────────────────────────────
    let targetRotX = 0.2;
    let targetRotY = 0;
    let curRotX = 0.2;
    let curRotY = 0;
    let baseSpin = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const xPercent = (e.clientX / window.innerWidth) - 0.5;
      const yPercent = (e.clientY / window.innerHeight) - 0.5;
      targetRotY = xPercent * 0.7;
      targetRotX = -yPercent * 0.5 + 0.2;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // ─── Bucle de animación (Render 3D con perspectiva) ────────────────────
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Suavizado (LERP) hacia la rotación del cursor
      curRotX += (targetRotX - curRotX) * 0.05;
      curRotY += (targetRotY - curRotY) * 0.05;
      baseSpin += 0.007;

      const rotY = curRotY + baseSpin;
      const rotX = curRotX;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Radio dinámico adaptado al tamaño de pantalla
      const ballRadius = Math.min(width, height) * 0.32;
      const cx = width * 0.5;
      const cy = height * 0.5;
      const fov = 450;

      // Proyectar un punto 3D -> 2D con perspectiva
      const project = (x: number, y: number, z: number) => {
        // Rotación en Y
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;

        // Rotación en X
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const scale = fov / (fov + z2 * ballRadius);
        return {
          x: cx + x1 * ballRadius * scale,
          y: cy + y2 * ballRadius * scale,
          z: z2,
          scale,
        };
      };

      // 1. Proyectar todos los vértices del balón
      const projectedVerts = allVertices.map(v => project(v[0], v[1], v[2]));

      // 2. Dibujar aristas de la estructura del balón
      edges.forEach(([i, j]) => {
        const p1 = projectedVerts[i];
        const p2 = projectedVerts[j];

        const avgZ = (p1.z + p2.z) / 2;
        // Efecto de profundidad: caras frontales brillantes, traseras atenuadas
        const depthAlpha = Math.max(0.06, (avgZ + 1) / 2 * 0.5);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (avgZ > 0.1) {
          ctx.strokeStyle = `rgba(16, 185, 129, ${depthAlpha * 0.9})`;
          ctx.lineWidth = 1.2 * p1.scale;
        } else {
          ctx.strokeStyle = `rgba(56, 189, 248, ${depthAlpha * 0.4})`;
          ctx.lineWidth = 0.8;
        }
        ctx.stroke();
      });

      // 3. Dibujar nodos luminosos en los vértices principales
      projectedVerts.forEach(p => {
        if (p.z > -0.2) {
          const alpha = (p.z + 0.2) / 1.2;
          const nodeRadius = 2.2 * p.scale;

          ctx.beginPath();
          ctx.arc(p.x, p.y, nodeRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(16, 185, 129, ${alpha * 0.9})`;
          ctx.shadowColor = "#10b981";
          ctx.shadowBlur = 8 * p.scale;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 4. Dibujar partículas orbitales de datos flotantes
      particles.forEach(pt => {
        // Rotación orbital constante
        const cosP = Math.cos(pt.speed);
        const sinP = Math.sin(pt.speed);
        const nextX = pt.x * cosP - pt.z * sinP;
        const nextZ = pt.x * sinP + pt.z * cosP;
        pt.x = nextX;
        pt.z = nextZ;

        const proj = project(pt.x, pt.y, pt.z);
        const alpha = Math.max(0.15, (proj.z + 1.2) / 2.4);

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, pt.radius * proj.scale, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 6 * proj.scale;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block pointer-events-none"
      style={{ filter: "drop-shadow(0 0 24px rgba(16, 185, 129, 0.25))" }}
    />
  );
}
