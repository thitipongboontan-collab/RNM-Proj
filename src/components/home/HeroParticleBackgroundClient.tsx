"use client";

import dynamic from "next/dynamic";

const HeroParticleBackground = dynamic(
  () =>
    import("@/components/home/HeroParticleBackground").then((mod) => ({
      default: mod.HeroParticleBackground,
    })),
  { ssr: false },
);

export function HeroParticleBackgroundClient({
  className,
}: {
  className?: string;
}) {
  return <HeroParticleBackground className={className} />;
}
