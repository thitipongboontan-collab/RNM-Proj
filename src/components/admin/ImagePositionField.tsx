"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import {
  formatImagePosition,
  IMAGE_POSITION_PRESETS,
  normalizeImagePosition,
  parseImagePosition,
} from "@/lib/image-position";

type ImagePositionFieldProps = {
  name?: string;
  defaultValue?: string;
  previewSrc?: string;
  previewAlt?: string;
  onPositionChange?: (value: string) => void;
};

export function ImagePositionField({
  name = "imagePosition",
  defaultValue = "50% 50%",
  previewSrc,
  previewAlt = "ตัวอย่างรูปหลัก",
  onPositionChange,
}: ImagePositionFieldProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => parseImagePosition(defaultValue));
  const [dragging, setDragging] = useState(false);
  const value = formatImagePosition(position.x, position.y);

  const applyPosition = useCallback(
    (next: { x: number; y: number }) => {
      setPosition(next);
      onPositionChange?.(formatImagePosition(next.x, next.y));
    },
    [onPositionChange],
  );

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const frame = frameRef.current;
      if (!frame) return;

      const rect = frame.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      applyPosition({ x, y });
    },
    [applyPosition],
  );

  return (
    <div className="mt-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-brand-dark">ตำแหน่งการแสดงรูปหลัก</span>
        <span className="text-xs text-brand-muted">
          X {Math.round(position.x)}% · Y {Math.round(position.y)}%
        </span>
      </div>

      <div
        ref={frameRef}
        className="relative isolate aspect-[16/10] w-full max-w-md cursor-crosshair overflow-hidden rounded-xl border border-[#D9DEE8] bg-[#EEF1F6] touch-none"
        onPointerDown={(event) => {
          event.preventDefault();
          frameRef.current?.setPointerCapture(event.pointerId);
          setDragging(true);
          updateFromPointer(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (!dragging) return;
          updateFromPointer(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          frameRef.current?.releasePointerCapture(event.pointerId);
          setDragging(false);
        }}
        onPointerCancel={() => setDragging(false)}
      >
        {previewSrc ? (
          <Image
            src={previewSrc}
            alt={previewAlt}
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            className="pointer-events-none object-cover"
            style={{ objectPosition: value }}
            unoptimized={previewSrc.startsWith("http") || previewSrc.startsWith("blob:")}
          />
        ) : (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#D9DEE8] to-[#C5CBD8]" />
        )}

        <div
          className="pointer-events-none absolute z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-primary shadow-md"
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
        />
        <div
          className="pointer-events-none absolute z-10 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80"
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-brand-muted">
        คลิกหรือลากจุดบนภาพเพื่อกำหนดตำแหน่งที่ต้องการให้แสดงเมื่อรูปถูกครอป
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {IMAGE_POSITION_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => applyPosition(parseImagePosition(preset.value))}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              normalizeImagePosition(value) === preset.value
                ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                : "border-[#D9DEE8] text-brand-muted hover:bg-[#F3F5FA]"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <input type="hidden" name={name} value={value} />
    </div>
  );
}
