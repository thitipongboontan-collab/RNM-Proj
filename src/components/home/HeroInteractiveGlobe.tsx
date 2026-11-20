"use client";

import * as React from "react";

type Marker = { lat: number; lng: number; label: string };
type Connection = { from: number; to: number };
type Vec3 = { x: number; y: number; z: number };

const DOT_COUNT = 1200;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const MARKERS: Marker[] = [
  { lat: 18.79, lng: 98.98, label: "Chiang Mai" },
  { lat: 13.76, lng: 100.5, label: "Bangkok" },
  { lat: 35.68, lng: 139.69, label: "Tokyo" },
  { lat: 1.35, lng: 103.82, label: "Singapore" },
  { lat: 37.57, lng: 126.98, label: "Seoul" },
  { lat: 51.51, lng: -0.13, label: "London" },
  { lat: 42.36, lng: -71.06, label: "Boston" },
  { lat: -33.87, lng: 151.21, label: "Sydney" },
];

const CONNECTIONS: Connection[] = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 0, to: 3 },
  { from: 1, to: 4 },
  { from: 2, to: 4 },
  { from: 3, to: 7 },
  { from: 5, to: 6 },
  { from: 6, to: 0 },
  { from: 5, to: 2 },
];

function latLngToVec(lat: number, lng: number): Vec3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.cos(phi),
    z: Math.sin(phi) * Math.sin(theta),
  };
}

function rotate(p: Vec3, yaw: number, pitch: number): Vec3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = p.x * cy + p.z * sy;
  const z1 = -p.x * sy + p.z * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return {
    x: x1,
    y: p.y * cp - z1 * sp,
    z: p.y * sp + z1 * cp,
  };
}

function fibonacciDots(count: number): Vec3[] {
  const dots: Vec3[] = [];
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * i;
    dots.push({
      x: Math.cos(theta) * radius,
      y,
      z: Math.sin(theta) * radius,
    });
  }
  return dots;
}

function arcPoints(a: Vec3, b: Vec3, steps = 28): Vec3[] {
  const points: Vec3[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const z = a.z + (b.z - a.z) * t;
    const lift = 1 + 0.18 * Math.sin(Math.PI * t);
    const len = Math.hypot(x, y, z) || 1;
    points.push({ x: (x / len) * lift, y: (y / len) * lift, z: (z / len) * lift });
  }
  return points;
}

const DOTS = fibonacciDots(DOT_COUNT);
const MARKER_VECS = MARKERS.map((m) => latLngToVec(m.lat, m.lng));
const ARC_PATHS = CONNECTIONS.map((c) => arcPoints(MARKER_VECS[c.from], MARKER_VECS[c.to]));

export function HeroInteractiveGlobe({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = {
      yaw: 0.9,
      pitch: 0.28,
      dragging: false,
      lastX: 0,
      lastY: 0,
      lastDragAt: 0,
      raf: 0,
      start: performance.now(),
    };

    const host = canvas.parentElement ?? canvas;
    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(rect.width, 1);
      const cssH = Math.max(rect.height, 1);
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const project = (p: Vec3, radius: number, cx: number, cy: number) => {
      const depth = (p.z + 1.35) / 2.35;
      return {
        x: cx + p.x * radius,
        y: cy - p.y * radius,
        z: p.z,
        depth,
      };
    };

    const draw = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);
      if (width < 8 || height < 8) return;

      const idle = !state.dragging && now - state.lastDragAt > 1200;
      if (idle) state.yaw += 0.004;

      const cx = width * 0.52;
      const cy = height * 0.5;
      const radius = Math.min(width, height) * 0.42;

      const rotatedDots = DOTS.map((p) => rotate(p, state.yaw, state.pitch));
      const rotatedMarkers = MARKER_VECS.map((p) => rotate(p, state.yaw, state.pitch));

      for (const p of rotatedDots) {
        if (p.z < -0.15) continue;
        const q = project(p, radius, cx, cy);
        const alpha = 0.12 + q.depth * 0.55;
        const size = 0.7 + q.depth * 1.35;
        ctx.fillStyle = `rgba(77, 92, 173, ${alpha})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(22, 93, 160, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.02, 0, Math.PI * 2);
      ctx.stroke();

      const t = (now - state.start) / 1000;
      ARC_PATHS.forEach((path, arcIndex) => {
        const rotated = path.map((p) => rotate(p, state.yaw, state.pitch));
        ctx.beginPath();
        let started = false;
        rotated.forEach((p) => {
          if (p.z < -0.05) {
            started = false;
            return;
          }
          const q = project(p, radius, cx, cy);
          if (!started) {
            ctx.moveTo(q.x, q.y);
            started = true;
          } else {
            ctx.lineTo(q.x, q.y);
          }
        });
        ctx.strokeStyle = "rgba(103, 0, 255, 0.28)";
        ctx.lineWidth = 1.4;
        ctx.stroke();

        const head = (t * 0.22 + arcIndex * 0.17) % 1;
        const idx = Math.min(rotated.length - 1, Math.floor(head * (rotated.length - 1)));
        const particle = rotated[idx];
        if (particle.z > -0.05) {
          const q = project(particle, radius, cx, cy);
          const glow = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 7);
          glow.addColorStop(0, "rgba(103, 0, 255, 0.95)");
          glow.addColorStop(1, "rgba(47, 107, 255, 0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(q.x, q.y, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const pulse = 1.4 + Math.sin(t * 3) * 0.55;
      rotatedMarkers.forEach((p, i) => {
        if (p.z < 0.02) return;
        const q = project(p, radius, cx, cy);
        ctx.strokeStyle = "rgba(47, 107, 255, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 5 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#5B5CFF";
        ctx.beginPath();
        ctx.arc(q.x, q.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#31405C";
        ctx.font = "600 11px Inter, 'Noto Sans Thai UI', sans-serif";
        ctx.fillText(MARKERS[i].label, q.x + 8, q.y - 6);
      });
    };

    const loop = (now: number) => {
      draw(now);
      state.raf = window.requestAnimationFrame(loop);
    };

    const onPointerDown = (event: PointerEvent) => {
      state.dragging = true;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!state.dragging) return;
      const dx = event.clientX - state.lastX;
      const dy = event.clientY - state.lastY;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.yaw += dx * 0.008;
      state.pitch = Math.max(-0.9, Math.min(0.9, state.pitch + dy * 0.008));
    };
    const onPointerUp = (event: PointerEvent) => {
      state.dragging = false;
      state.lastDragAt = performance.now();
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    state.raf = window.requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      window.cancelAnimationFrame(state.raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={["h-full w-full cursor-grab touch-none active:cursor-grabbing", className]
        .filter(Boolean)
        .join(" ")}
      aria-label="Interactive research network globe"
    />
  );
}
