"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-leaflet";
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

function stopLeafletPropagation(element: HTMLElement) {
  const stop = (event: Event) => {
    event.stopPropagation();
  };

  element.addEventListener("click", stop);
  element.addEventListener("dblclick", stop);
  element.addEventListener("mousedown", stop);
  element.addEventListener("touchstart", stop);

  return () => {
    element.removeEventListener("click", stop);
    element.removeEventListener("dblclick", stop);
    element.removeEventListener("mousedown", stop);
    element.removeEventListener("touchstart", stop);
  };
}

function BasemapControlContent({
  basemapId,
  onBasemapChange,
}: BasemapLayerControlProps) {
  const map = useMap();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleMapClick() {
      setOpen(false);
    }

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, open]);

  return (
    <div className="leaflet-bar leaflet-control spatial-basemap-control">
      <button
        type="button"
        className={`spatial-basemap-trigger${open ? " is-active" : ""}`}
        aria-label="เลือก Basemap"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <LayersIcon />
      </button>
      {open && (
        <div onClick={(event) => event.stopPropagation()}>
          <BasemapControlPanel
            basemapId={basemapId}
            onBasemapChange={onBasemapChange}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

export function BasemapLayerControl({
  basemapId,
  onBasemapChange,
}: BasemapLayerControlProps) {
  const map = useMap();
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = document.createElement("div");
    element.className = "spatial-basemap-control-host";
    const cleanupPropagation = stopLeafletPropagation(element);

    const corner = map.getContainer().querySelector(".leaflet-top.leaflet-left");
    if (corner) {
      corner.appendChild(element);
    }

    setHost(element);

    return () => {
      cleanupPropagation();
      element.remove();
      setHost(null);
    };
  }, [map]);

  if (!host) return null;

  return createPortal(
    <BasemapControlContent basemapId={basemapId} onBasemapChange={onBasemapChange} />,
    host,
  );
}
