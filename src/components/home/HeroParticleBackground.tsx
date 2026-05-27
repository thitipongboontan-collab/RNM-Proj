"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import type { Engine, ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

const PARTICLE_COLORS = ["#3D4FA0", "#5A4FCF", "#7B68EE", "#4D5CAD", "#0099BB"];

async function initParticlesEngine(engine: Engine) {
  await loadSlim(engine);
}

type ParticleDensity = {
  count: number;
};

function getParticleDensity(): ParticleDensity {
  if (typeof window === "undefined") {
    return { count: 90 };
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const width = window.innerWidth;

  if (reducedMotion) {
    return { count: 35 };
  }

  if (width < 640) {
    return { count: 55 };
  }

  if (width < 1024) {
    return { count: 75 };
  }

  return { count: 95 };
}

function buildOptions(density: ParticleDensity): ISourceOptions {
  return {
    fullScreen: { enable: false },
    background: { color: { value: "transparent" } },
    fpsLimit: 60,
    detectRetina: true,
    smooth: true,
    interactivity: {
      detectsOn: "window",
      events: {
        onClick: { enable: false },
        onHover: {
          enable: true,
          mode: "grab",
        },
        resize: { enable: true },
      },
      modes: {
        grab: {
          distance: 160,
          links: {
            opacity: 0.65,
            color: "#5A4FCF",
          },
        },
      },
    },
    particles: {
      number: {
        value: density.count,
        density: { enable: false },
      },
      color: { value: PARTICLE_COLORS },
      shape: { type: "circle" },
      opacity: {
        value: { min: 0.55, max: 0.95 },
        animation: {
          enable: true,
          speed: 0.5,
          sync: false,
        },
      },
      size: {
        value: { min: 3, max: 6 },
        animation: {
          enable: true,
          speed: 1.2,
          sync: false,
        },
      },
      links: {
        enable: true,
        distance: 150,
        color: "#5A4FCF",
        opacity: 0.4,
        width: 1.5,
      },
      move: {
        enable: true,
        speed: { min: 0.3, max: 0.7 },
        direction: "none",
        random: true,
        straight: false,
        outModes: { default: "out" },
      },
    },
  };
}

function HeroParticlesCanvas({ className }: { className?: string }) {
  const [density, setDensity] = useState<ParticleDensity>(() => getParticleDensity());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    function syncDensity() {
      setDensity(getParticleDensity());
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionQuery.addEventListener("change", syncDensity);
    window.addEventListener("resize", syncDensity);

    return () => {
      motionQuery.removeEventListener("change", syncDensity);
      window.removeEventListener("resize", syncDensity);
    };
  }, []);

  const options = useMemo(() => buildOptions(density), [density]);

  if (!mounted) {
    return <div className={className} aria-hidden />;
  }

  return (
    <Particles
      id="hero-particles"
      className={className}
      options={options}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

export function HeroParticleBackground({ className }: { className?: string }) {
  return (
    <ParticlesProvider init={initParticlesEngine}>
      <HeroParticlesCanvas className={className} />
    </ParticlesProvider>
  );
}
