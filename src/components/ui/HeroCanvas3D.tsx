"use client";

import React, { useEffect, useRef } from "react";
import { useCompetition } from "@/stores/filterStore";

export default function HeroCanvas3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { competition } = useCompetition();
  const isUcl = competition === "ucl";

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

    const normalize = (v: [number, number, number]): [number, number, number] => {
      const len = Math.hypot(v[0], v[1], v[2]) || 1;
      return [v[0] / len, v[1] / len, v[2] / len];
    };

    // ──────────────────────────────────────────────────────────────────────────
    // GEOMETRÍA 1: Balón geodésico clásico (LaLiga)
    // ──────────────────────────────────────────────────────────────────────────
    const phi = (1 + Math.sqrt(5)) / 2;
    const rawBaseVerts: [number, number, number][] = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
    ];
    const baseVerts: [number, number, number][] = rawBaseVerts.map(normalize);

    const laligaEdges: [number, number][] = [];
    for (let i = 0; i < baseVerts.length; i++) {
      for (let j = i + 1; j < baseVerts.length; j++) {
        const d = Math.hypot(
          baseVerts[i][0] - baseVerts[j][0],
          baseVerts[i][1] - baseVerts[j][1],
          baseVerts[i][2] - baseVerts[j][2]
        );
        if (d < 1.1) laligaEdges.push([i, j]);
      }
    }

    const laligaAllVerts: [number, number, number][] = [...baseVerts];
    const edgeMidMap = new Map<string, number>();
    laligaEdges.forEach(([i, j]) => {
      const mid = normalize([
        (baseVerts[i][0] + baseVerts[j][0]) / 2,
        (baseVerts[i][1] + baseVerts[j][1]) / 2,
        (baseVerts[i][2] + baseVerts[j][2]) / 2,
      ]);
      const idx = laligaAllVerts.length;
      laligaAllVerts.push(mid);
      edgeMidMap.set(`${Math.min(i, j)}-${Math.max(i, j)}`, idx);
    });

    const laligaFinalEdges: [number, number][] = [];
    const laligaEdgeSet = new Set<string>();
    const addLaligaEdge = (a: number, b: number) => {
      const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
      if (!laligaEdgeSet.has(key)) {
        laligaEdgeSet.add(key);
        laligaFinalEdges.push([a, b]);
      }
    };

    laligaEdges.forEach(([i, j]) => {
      const mid = edgeMidMap.get(`${Math.min(i, j)}-${Math.max(i, j)}`)!;
      addLaligaEdge(i, mid);
      addLaligaEdge(mid, j);
    });

    for (let i = 0; i < laligaAllVerts.length; i++) {
      for (let j = i + 1; j < laligaAllVerts.length; j++) {
        const d = Math.hypot(
          laligaAllVerts[i][0] - laligaAllVerts[j][0],
          laligaAllVerts[i][1] - laligaAllVerts[j][1],
          laligaAllVerts[i][2] - laligaAllVerts[j][2]
        );
        if (d > 0.55 && d < 0.65) addLaligaEdge(i, j);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GEOMETRÍA 2: Balón de 8 Estrellas UEFA Champions League (Starball 3D)
    // ──────────────────────────────────────────────────────────────────────────
    // 8 centros de estrellas distribuidos esféricamente (vértices normalizados de un cubo)
    const rawStarCenters: [number, number, number][] = [
      [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
      [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
    ];
    const starCenters: [number, number, number][] = rawStarCenters.map(normalize);

    // Para cada estrella, construir sus 10 vértices esféricos (5 puntas y 5 valles)
    interface UclStar {
      center: [number, number, number];
      points: [number, number, number][]; // 10 puntos en la superficie
    }

    const uclStars: UclStar[] = starCenters.map((c) => {
      // Base ortogonal tangente al vector centro
      const up: [number, number, number] = Math.abs(c[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const u = normalize([
        up[1] * c[2] - up[2] * c[1],
        up[2] * c[0] - up[0] * c[2],
        up[0] * c[1] - up[1] * c[0],
      ]);
      const v = normalize([
        c[1] * u[2] - c[2] * u[1],
        c[2] * u[0] - c[0] * u[2],
        c[0] * u[1] - c[1] * u[0],
      ]);

      const starPoints: [number, number, number][] = [];
      const outerR = 0.32;
      const innerR = 0.14;

      for (let k = 0; k < 10; k++) {
        const angle = (k * Math.PI) / 5;
        const rad = k % 2 === 0 ? outerR : innerR;
        const px = c[0] + (u[0] * Math.cos(angle) + v[0] * Math.sin(angle)) * rad;
        const py = c[1] + (u[1] * Math.cos(angle) + v[1] * Math.sin(angle)) * rad;
        const pz = c[2] + (u[2] * Math.cos(angle) + v[2] * Math.sin(angle)) * rad;
        starPoints.push(normalize([px, py, pz]));
      }

      return { center: c, points: starPoints };
    });

    // Conexiones de rayos estelares entre centros contiguos (12 aristas cúbicas)
    const starCenterEdges: [number, number][] = [];
    for (let i = 0; i < starCenters.length; i++) {
      for (let j = i + 1; j < starCenters.length; j++) {
        const d = Math.hypot(
          starCenters[i][0] - starCenters[j][0],
          starCenters[i][1] - starCenters[j][1],
          starCenters[i][2] - starCenters[j][2]
        );
        if (d < 1.25) {
          starCenterEdges.push([i, j]);
        }
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Anillo Orbital Luminoso en 3D (para modo Champions)
    // ──────────────────────────────────────────────────────────────────────────
    const RING_POINTS = 64;
    const ringRadius = 1.48;
    const tiltAngle = Math.PI * 0.18; // Inclinación orbital elegante
    const orbitalRingPoints: [number, number, number][] = [];
    for (let i = 0; i < RING_POINTS; i++) {
      const theta = (i / RING_POINTS) * Math.PI * 2;
      const x = ringRadius * Math.cos(theta);
      const y = ringRadius * Math.sin(theta) * Math.cos(tiltAngle);
      const z = ringRadius * Math.sin(theta) * Math.sin(tiltAngle);
      orbitalRingPoints.push([x, y, z]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Partículas de datos / Campo estelar
    // ──────────────────────────────────────────────────────────────────────────
    const NUM_PARTICLES = isUcl ? 54 : 36;
    const particles = Array.from({ length: NUM_PARTICLES }).map((_, idx) => {
      const theta = Math.random() * Math.PI * 2;
      const phiAngle = (Math.random() - 0.5) * Math.PI;
      const r = isUcl ? 1.2 + Math.random() * 0.75 : 1.25 + Math.random() * 0.45;
      return {
        x: r * Math.cos(phiAngle) * Math.cos(theta),
        y: r * Math.sin(phiAngle),
        z: r * Math.cos(phiAngle) * Math.sin(theta),
        speed: 0.002 + Math.random() * 0.004,
        radius: isUcl ? 1.2 + Math.random() * 2.2 : 1 + Math.random() * 1.8,
        color: isUcl
          ? idx % 4 === 0
            ? "#ffffff"
            : idx % 4 === 1
            ? "#38bdf8"
            : idx % 4 === 2
            ? "#818cf8"
            : "#fbbf24"
          : idx % 3 === 0
          ? "#10b981"
          : idx % 3 === 1
          ? "#38bdf8"
          : "#fbbf24",
      };
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Interacción con cursor / Parallax 3D
    // ──────────────────────────────────────────────────────────────────────────
    let targetRotX = 0.2;
    let targetRotY = 0;
    let curRotX = 0.2;
    let curRotY = 0;
    let baseSpin = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const xPercent = e.clientX / window.innerWidth - 0.5;
      const yPercent = e.clientY / window.innerHeight - 0.5;
      targetRotY = xPercent * 0.7;
      targetRotX = -yPercent * 0.5 + 0.2;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // ──────────────────────────────────────────────────────────────────────────
    // Bucle de renderizado
    // ──────────────────────────────────────────────────────────────────────────
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      curRotX += (targetRotX - curRotX) * 0.05;
      curRotY += (targetRotY - curRotY) * 0.05;
      baseSpin += isUcl ? 0.005 : 0.007;

      const rotY = curRotY + baseSpin;
      const rotX = curRotX;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const ballRadius = Math.min(width, height) * (isUcl ? 0.22 : 0.24);
      const cx = width * 0.55;
      const cy = height * 0.5;
      const fov = 480;

      const project = (x: number, y: number, z: number) => {
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
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

      // ── MODO 1: BALÓN DE ESTRELLAS DE LA CHAMPIONS LEAGUE ──
      if (isUcl) {
        // 1. Proyectar y dibujar anillo orbital luminoso
        const projRing = orbitalRingPoints.map((p) => project(p[0], p[1], p[2]));
        ctx.beginPath();
        for (let i = 0; i < projRing.length; i++) {
          const nextIdx = (i + 1) % projRing.length;
          const p1 = projRing[i];
          const p2 = projRing[nextIdx];
          if (p1.z > -0.8) {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          }
        }
        ctx.strokeStyle = "rgba(56, 189, 248, 0.22)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. Dibujar rayos de luz entre estrellas (haces de luz de Champions)
        starCenterEdges.forEach(([i, j]) => {
          const p1 = project(...starCenters[i]);
          const p2 = project(...starCenters[j]);
          const avgZ = (p1.z + p2.z) / 2;
          const alpha = Math.max(0.08, (avgZ + 1) / 2 * 0.7);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);

          if (avgZ > 0) {
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1.8 * p1.scale;
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 8 * p1.scale;
          } else {
            ctx.strokeStyle = `rgba(30, 58, 138, ${alpha * 0.5})`;
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        // 3. Dibujar las 8 estrellas de la Starball
        uclStars.forEach((star) => {
          const projCenter = project(...star.center);
          const projPoints = star.points.map((pt) => project(...pt));

          // Cara delantera
          if (projCenter.z > -0.45) {
            const alpha = Math.max(0.15, (projCenter.z + 0.45) / 1.45);

            ctx.beginPath();
            ctx.moveTo(projPoints[0].x, projPoints[0].y);
            for (let k = 1; k < projPoints.length; k++) {
              ctx.lineTo(projPoints[k].x, projPoints[k].y);
            }
            ctx.closePath();

            // Relleno estelar con gradiente de luz
            ctx.fillStyle = `rgba(240, 249, 255, ${alpha * 0.35})`;
            ctx.fill();

            // Bordes plateados y cian de la estrella
            ctx.strokeStyle = projCenter.z > 0.1
              ? `rgba(255, 255, 255, ${alpha * 0.95})`
              : `rgba(56, 189, 248, ${alpha * 0.6})`;
            ctx.lineWidth = 1.5 * projCenter.scale;
            if (projCenter.z > 0.1) {
              ctx.shadowColor = "#38bdf8";
              ctx.shadowBlur = 10 * projCenter.scale;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Nodo brillante en el centro de la estrella
            if (projCenter.z > 0.2) {
              ctx.beginPath();
              ctx.arc(projCenter.x, projCenter.y, 2.5 * projCenter.scale, 0, Math.PI * 2);
              ctx.fillStyle = "#ffffff";
              ctx.shadowColor = "#38bdf8";
              ctx.shadowBlur = 12 * projCenter.scale;
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          }
        });
      } else {
        // ── MODO 2: BALÓN GEODÉSICO ORIGINAL (LALIGA) ──
        const projectedVerts = laligaAllVerts.map((v) => project(v[0], v[1], v[2]));

        laligaFinalEdges.forEach(([i, j]) => {
          const p1 = projectedVerts[i];
          const p2 = projectedVerts[j];
          const avgZ = (p1.z + p2.z) / 2;
          const depthAlpha = Math.max(0.06, ((avgZ + 1) / 2) * 0.5);

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

        projectedVerts.forEach((p) => {
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
      }

      // ── PARTÍCULAS ORBITALES Y ESTELARES COMUNES (adaptadas a cada modo) ──
      particles.forEach((pt) => {
        const cosP = Math.cos(pt.speed);
        const sinP = Math.sin(pt.speed);
        const nextX = pt.x * cosP - pt.z * sinP;
        const nextZ = pt.x * sinP + pt.z * cosP;
        pt.x = nextX;
        pt.z = nextZ;

        const proj = project(pt.x, pt.y, pt.z);
        const alpha = Math.max(0.12, (proj.z + 1.2) / 2.4);

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, pt.radius * proj.scale, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = (isUcl ? 8 : 6) * proj.scale;
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
  }, [isUcl]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block pointer-events-none transition-all duration-500"
      style={{
        filter: isUcl
          ? "drop-shadow(0 0 32px rgba(56, 189, 248, 0.35))"
          : "drop-shadow(0 0 24px rgba(16, 185, 129, 0.25))",
      }}
    />
  );
}
