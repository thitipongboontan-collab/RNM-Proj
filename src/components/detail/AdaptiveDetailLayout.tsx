"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";

type ImageOrientation = "portrait" | "landscape";

type AdaptiveDetailLayoutProps = {
  imageSrc?: string;
  imageAlt: string;
  fallbackBackground?: string;
  extraImages?: string[];
  details: ReactNode;
  downloads?: ReactNode;
  footer?: ReactNode;
};

function CoverImage({
  src,
  alt,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1280}
      height={720}
      sizes={sizes}
      priority={priority}
      className="h-auto w-full"
      unoptimized={src.startsWith("http")}
    />
  );
}

function ExtraImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#EEF1F6]">
      <CoverImage src={src} alt={alt} sizes="100vw" />
    </div>
  );
}

export function AdaptiveDetailLayout({
  imageSrc,
  imageAlt,
  fallbackBackground,
  extraImages = [],
  details,
  downloads,
  footer,
}: AdaptiveDetailLayoutProps) {
  const [orientation, setOrientation] = useState<ImageOrientation | null>(null);

  useEffect(() => {
    if (!imageSrc) {
      setOrientation("portrait");
      return;
    }

    let cancelled = false;
    const probe = new window.Image();
    probe.onload = () => {
      if (cancelled) return;
      setOrientation(
        probe.naturalWidth >= probe.naturalHeight ? "landscape" : "portrait",
      );
    };
    probe.onerror = () => {
      if (!cancelled) setOrientation("landscape");
    };
    probe.src = imageSrc;

    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  const isPortrait = orientation === "portrait";
  const imageSizes = isPortrait ? "(min-width: 1024px) 50vw, 100vw" : "100vw";

  const coverImage = (
    <div
      className="overflow-hidden rounded-2xl bg-[#EEF1F6]"
      role="img"
      aria-label={imageAlt}
    >
      {imageSrc ? (
        <CoverImage src={imageSrc} alt={imageAlt} sizes={imageSizes} priority />
      ) : (
        <div
          className={`w-full ${isPortrait ? "aspect-[3/4]" : "aspect-[16/9]"}`}
          style={{ background: fallbackBackground }}
          aria-hidden
        />
      )}
    </div>
  );

  const detailsBlock = (
    <div className="flex flex-col gap-10">
      {details}
      {downloads}
    </div>
  );

  return (
    <div className="flex flex-col gap-10">
      {orientation === null ? (
        <div className="flex flex-col gap-[30px]">
          {coverImage}
          {extraImages.map((src) => (
            <ExtraImage key={src} src={src} alt={imageAlt} />
          ))}
          {detailsBlock}
        </div>
      ) : isPortrait ? (
        <div className="grid grid-cols-1 items-start gap-[30px] lg:grid-cols-2 lg:gap-[40px]">
          <div className="flex flex-col gap-5">
            {coverImage}
            {extraImages.map((src) => (
              <ExtraImage key={src} src={src} alt={imageAlt} />
            ))}
          </div>
          {detailsBlock}
        </div>
      ) : (
        <div className="flex flex-col gap-[30px]">
          {coverImage}
          {extraImages.map((src) => (
            <ExtraImage key={src} src={src} alt={imageAlt} />
          ))}
          {detailsBlock}
        </div>
      )}

      {footer}
    </div>
  );
}
