"use client";

import dynamic from "next/dynamic";

const Vortex = dynamic(
  () => import("@/components/ui/vortex").then((mod) => mod.Vortex),
  { ssr: false },
);

export function HeroVortex({ className }: { className?: string }) {
  return (
    <Vortex
      className={className}
      count={2800}
      speed={1.15}
      arms={3}
      theme="light"
      orbit
      lazy={false}
    />
  );
}
