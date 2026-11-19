"use client";

import { useEffect, useRef } from "react";

type SpherePoint = {
  x: number;
  y: number;
  z: number;
  phase: number;
};

type ProjectedDot = {
  x: number;
  y: number;
  z: number;
  radius: number;
  alpha: number;
};

function createSphere(count: number): SpherePoint[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const last = Math.max(count - 1, 1);
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - (index / last) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * index;
    return {
      x: Math.cos(theta) * ring,
      y,
      z: Math.sin(theta) * ring,
      phase: theta,
    };
  });
}

function particleCount(width: number, reduced: boolean) {
  if (reduced) return 720;
  if (width < 640) return 500;
  if (width < 1024) return 900;
  return 1600;
}

function strokeShell(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  time: number,
  lobes: number,
  wobble: number,
  squash: number,
) {
  ctx.beginPath();
  const steps = 200;
  for (let index = 0; index <= steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2;
    const scale =
      1 +
      wobble * Math.sin(angle * lobes + time) +
      wobble * 0.45 * Math.sin(angle * (lobes - 3) - time * 0.65);
    const x = cx + Math.cos(angle) * radius * scale;
    const y = cy + Math.sin(angle) * radius * squash * scale;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawOrb(
  ctx: CanvasRenderingContext2D,
  size: number,
  points: SpherePoint[],
  time: number,
  dots: ProjectedDot[],
) {
  const cx = size * 0.5;
  const cy = size * 0.5;
  const radius = size * 0.33;
  const driftX = Math.sin(time * 0.32) * size * 0.012;
  const driftY = Math.cos(time * 0.26) * size * 0.01;

  ctx.clearRect(0, 0, size, size);

  const halo = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius * 1.7);
  halo.addColorStop(0, "rgba(220, 235, 255, 0.2)");
  halo.addColorStop(0.55, "rgba(105, 200, 255, 0.16)");
  halo.addColorStop(1, "rgba(105, 200, 255, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.7, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(
    cx - radius * 0.12 + driftX,
    cy - radius * 0.14 + driftY,
    radius * 0.04,
    cx + driftX * 0.3,
    cy,
    radius * 0.95,
  );
  core.addColorStop(0, "rgba(255, 213, 232, 0.96)");
  core.addColorStop(0.26, "rgba(169, 166, 255, 0.74)");
  core.addColorStop(0.52, "rgba(105, 200, 255, 0.8)");
  core.addColorStop(0.74, "rgba(55, 154, 255, 0.62)");
  core.addColorStop(0.9, "rgba(65, 105, 225, 0.28)");
  core.addColorStop(1, "rgba(220, 235, 255, 0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.98, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = Math.max(7, size * 0.018);
  strokeShell(ctx, cx, cy, radius * 1.28, time * 0.55, 6, 0.028, 0.98);

  ctx.strokeStyle = "rgba(255,255,255,0.88)";
  ctx.lineWidth = Math.max(1.25, size * 0.0035);
  strokeShell(ctx, cx, cy, radius * 1.16, time * 0.7, 7, 0.04, 0.97);

  const rot = time * 0.22;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  dots.length = 0;

  for (const point of points) {
    const deform =
      1 +
      0.05 * Math.sin(point.y * 5.2 + time * 0.8) * Math.cos(point.phase * 0.45 + time * 0.38);
    const x = point.x * deform;
    const y = point.y * deform;
    const z = point.z * deform;
    const xr = x * cos + z * sin;
    const zr = -x * sin + z * cos;
    const perspective = 0.8 + zr * 0.36;
    const depth = (zr + 1) / 2;
    dots.push({
      x: cx + xr * radius * perspective,
      y: cy + y * radius * perspective,
      z: zr,
      radius: (0.45 + depth * 1.15) * (size / 520),
      alpha: 0.2 + depth * 0.78,
    });
  }

  dots.sort((a, b) => a.z - b.z);
  for (const dot of dots) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${dot.alpha})`;
    ctx.arc(dot.x, dot.y, Math.max(0.35, dot.radius), 0, Math.PI * 2);
    ctx.fill();
  }
}

export function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute inset-0 bg-[linear-gradient(115deg,#F4F1FF_0%,#E8F0FC_46%,#D5E7FB_100%)]" />
      <div className="absolute -left-24 top-0 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(206,198,255,0.5),transparent_70%)]" />
      <div className="absolute -right-10 top-1/2 h-[680px] w-[680px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(150,204,255,0.55),transparent_68%)]" />
    </div>
  );
}

export function HeroOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let points = createSphere(particleCount(window.innerWidth, reduced));
    const dots: ProjectedDot[] = [];
    let frame = 0;
    let onScreen = true;
    let pageVisible = document.visibilityState !== "hidden";
    let size = 0;

    function resize() {
      if (!canvas) return;
      const nextSize = Math.max(1, Math.round(parent?.clientWidth ?? 520));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = nextSize;
      canvas.width = Math.round(nextSize * dpr);
      canvas.height = Math.round(nextSize * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = createSphere(particleCount(window.innerWidth, reduced));
      paint(reduced ? 800 : performance.now());
    }

    function paint(now: number) {
      if (size <= 0) return;
      drawOrb(ctx, size, points, reduced ? 0.8 : now * 0.001, dots);
    }

    function loop(now: number) {
      if (!onScreen || !pageVisible) return;
      paint(now);
      if (!reduced) frame = window.requestAnimationFrame(loop);
    }

    function start() {
      window.cancelAnimationFrame(frame);
      if (!onScreen || !pageVisible) return;
      frame = window.requestAnimationFrame(loop);
    }

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else window.cancelAnimationFrame(frame);
    });

    function onVisibility() {
      pageVisible = document.visibilityState !== "hidden";
      if (pageVisible) start();
      else window.cancelAnimationFrame(frame);
    }

    resize();
    observer.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize);
    start();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      className="pointer-events-none relative mx-auto aspect-square w-full max-w-[320px] sm:max-w-[420px] lg:max-w-[520px]"
      aria-hidden
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

export function HeroWave() {
  return (
    <>
      <style>{`
        @keyframes rnm-hero-wave-a {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(-2.2%, 7px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes rnm-hero-wave-b {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(2.8%, -8px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .rnm-hero-wave-a { animation: rnm-hero-wave-a 16s ease-in-out infinite; }
        .rnm-hero-wave-b { animation: rnm-hero-wave-b 22s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .rnm-hero-wave-a,
          .rnm-hero-wave-b { animation: none; }
        }
      `}</style>
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[200px] w-full overflow-visible sm:h-[250px]"
        viewBox="0 0 1440 250"
        preserveAspectRatio="none"
        aria-hidden
      >
        <g className="rnm-hero-wave-a">
          <path
            d="M0 150 C 180 90 340 190 560 146 C 790 100 920 40 1160 86 C 1300 114 1380 78 1440 58 L1440 250 L0 250 Z"
            fill="rgba(255,255,255,0.38)"
          />
          <path
            d="M0 176 C 240 128 420 214 680 168 C 940 122 1080 72 1320 116 C 1380 128 1410 108 1440 96"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="2"
          />
        </g>
        <g className="rnm-hero-wave-b">
          <path
            d="M0 206 C 260 168 480 236 760 198 C 1040 160 1180 126 1440 154"
            fill="none"
            stroke="rgba(255,255,255,0.65)"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </>
  );
}
