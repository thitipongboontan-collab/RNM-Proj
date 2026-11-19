"use client";

import * as React from "react";

const THREE_SRC = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js";
const VANTA_SRC = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js";

type VantaEffect = { destroy: () => void };

type VantaWindow = Window & {
  THREE?: unknown;
  VANTA?: { BIRDS: (options: Record<string, unknown>) => VantaEffect };
};

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-hero-bg="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.dataset.heroBg = src;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export function HeroVantaBirds({ className }: { className?: string }) {
  const hostRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let effect: VantaEffect | null = null;

    const start = async () => {
      await loadScript(THREE_SRC);
      await loadScript(VANTA_SRC);
      if (cancelled || !hostRef.current) return;

      const vanta = (window as VantaWindow).VANTA;
      if (!vanta?.BIRDS) return;

      effect = vanta.BIRDS({
        el: hostRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        backgroundColor: 0xffffff,
        color1: 0x6700ff,
        colorMode: "lerpGradient",
        birdSize: 1.1,
        speedLimit: 3.0,
        separation: 61.0,
        cohesion: 67.0,
        quantity: 3.0,
      });

      if (cancelled) {
        effect.destroy();
        effect = null;
      }
    };

    void start();

    return () => {
      cancelled = true;
      effect?.destroy();
      effect = null;
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={["absolute inset-0 h-full w-full", className].filter(Boolean).join(" ")}
    />
  );
}
