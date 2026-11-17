"use client";

import { useEffect, useRef, useState } from "react";
import {
  BASEMAP_OPTIONS,
  getBasemapOption,
  type BasemapId,
} from "@/components/spatial/map-basemaps";

type BasemapLayerControlProps = {
  basemapId: BasemapId;
  onBasemapChange: (id: BasemapId) => void;
};

function LayersIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="spatial-basemap-trigger-icon"
    >
      <path
        d="M12 3.5L4.5 7.25L12 11L19.5 7.25L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M5 11.25L12 15L19 11.25"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 15.25L12 19L19 15.25"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BasemapToggleRow({
  checked,
  label,
  onSelect,
}: {
  checked: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button type="button" className="spatial-basemap-option" onClick={onSelect}>
      <span
        className={`spatial-basemap-toggle${checked ? " is-on" : ""}`}
        aria-hidden
      >
        <span className="spatial-basemap-toggle-knob" />
      </span>
      <span className="spatial-basemap-option-label">{label}</span>
    </button>
  );
}

function BasemapControlPanel({
  basemapId,
  onBasemapChange,
  onClose,
}: {
  basemapId: BasemapId;
  onBasemapChange: (id: BasemapId) => void;
  onClose: () => void;
}) {
  const activeBasemap = getBasemapOption(basemapId);

  return (
    <div className="spatial-basemap-popup" role="dialog" aria-label="เลือก Basemap">
      <div className="spatial-basemap-popup-header">
        <p className="spatial-basemap-popup-title">{activeBasemap.label}</p>
        <button
          type="button"
          className="spatial-basemap-popup-close"
          aria-label="ปิด"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="spatial-basemap-popup-options">
        {BASEMAP_OPTIONS.map((option) => (
          <BasemapToggleRow
            key={option.id}
            checked={basemapId === option.id}
            label={option.label}
            onSelect={() => onBasemapChange(option.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function BasemapLayerControl({
  basemapId,
  onBasemapChange,
}: BasemapLayerControlProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="spatial-basemap-control">
      <button
        type="button"
        className={`spatial-basemap-trigger${open ? " is-active" : ""}`}
        aria-label="เลือก Basemap"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <LayersIcon />
      </button>
      {open ? (
        <BasemapControlPanel
          basemapId={basemapId}
          onBasemapChange={onBasemapChange}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
