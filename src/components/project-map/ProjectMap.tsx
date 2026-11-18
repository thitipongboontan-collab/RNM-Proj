"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { divIcon } from "leaflet";
import {
  GeoJSON,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { BasemapLayerControl } from "@/components/spatial/BasemapLayerControl";
import {
  DEFAULT_BASEMAP_ID,
  getBasemapOption,
  type BasemapId,
} from "@/components/spatial/map-basemaps";
import type { ProjectMapFeature } from "@/lib/project-map/types";

type ProjectMapProps = {
  features: ProjectMapFeature[];
  selectedProjectId?: string;
  focusNonce?: number;
  onSelectProject: (projectId?: string) => void;
};

type AggregatePoint = {
  key: string;
  label: string;
  count: number;
  latitude: number;
  longitude: number;
  projectIds: string[];
};

function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  useMapEvents({
    zoomend(event) {
      onZoomChange(event.target.getZoom());
    },
  });
  return null;
}

function FitFeatures({
  features,
  selectedProjectId,
}: {
  features: ProjectMapFeature[];
  selectedProjectId?: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedProjectId) return;

    const points = features
      .map((feature) => {
        if (
          feature.geometryType === "Point" &&
          feature.latitude != null &&
          feature.longitude != null
        ) {
          return [feature.latitude, feature.longitude] as [number, number];
        }
        return null;
      })
      .filter(Boolean) as [number, number][];

    if (!points.length) {
      map.setView([16.8, 100.6], 6);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 9);
      return;
    }
    map.fitBounds(points, { padding: [40, 40], maxZoom: 10 });
  }, [features, map, selectedProjectId]);

  return null;
}

function FocusSelectedProject({
  features,
  selectedProjectId,
  spreadPositions,
  focusNonce = 0,
}: {
  features: ProjectMapFeature[];
  selectedProjectId?: string;
  spreadPositions: Map<string, { latitude: number; longitude: number }>;
  focusNonce?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedProjectId) return;

    const points = features
      .filter((feature) => feature.projectId === selectedProjectId)
      .map((feature) => {
        const spread = spreadPositions.get(feature.featureId);
        if (spread) {
          return [spread.latitude, spread.longitude] as [number, number];
        }
        if (feature.latitude != null && feature.longitude != null) {
          return [feature.latitude, feature.longitude] as [number, number];
        }
        return null;
      })
      .filter(Boolean) as [number, number][];

    if (points.length === 1) {
      map.flyTo(points[0], Math.max(map.getZoom(), 9), { duration: 0.8 });
      return;
    }
    if (points.length > 1) {
      map.flyToBounds(points, { padding: [72, 72], maxZoom: 10, duration: 0.8 });
    }
  }, [features, focusNonce, map, selectedProjectId, spreadPositions]);

  return null;
}

function markerSize(count: number, selected: boolean) {
  if (selected) return 54;
  return Math.min(58, Math.max(34, 30 + Math.sqrt(count) * 4));
}

function markerIcon(count: number, selected: boolean) {
  const size = markerSize(count, selected);
  const fontSize = size >= 50 ? 17 : size >= 42 ? 15 : 13;

  return divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div class="spatial-gradient-marker${selected ? " spatial-gradient-marker-selected" : ""}" style="width:${size}px;height:${size}px;font-size:${fontSize}px">${count}</div>`,
  });
}

function spreadOverlappingPoints(
  features: ProjectMapFeature[],
): Map<string, { latitude: number; longitude: number }> {
  const grouped = new Map<string, ProjectMapFeature[]>();
  for (const feature of features) {
    if (feature.latitude == null || feature.longitude == null) continue;
    const key = `${feature.latitude.toFixed(4)}:${feature.longitude.toFixed(4)}`;
    grouped.set(key, [...(grouped.get(key) ?? []), feature]);
  }

  const positions = new Map<string, { latitude: number; longitude: number }>();
  for (const group of grouped.values()) {
    if (group.length === 1) {
      positions.set(group[0].featureId, {
        latitude: group[0].latitude!,
        longitude: group[0].longitude!,
      });
      continue;
    }
    const radius = Math.min(0.16, 0.03 + group.length * 0.004);
    group.forEach((feature, index) => {
      const angle = (Math.PI * 2 * index) / group.length;
      positions.set(feature.featureId, {
        latitude: feature.latitude! + Math.sin(angle) * radius,
        longitude: feature.longitude! + Math.cos(angle) * radius,
      });
    });
  }
  return positions;
}

function buildProvinceAggregates(features: ProjectMapFeature[]): AggregatePoint[] {
  const grouped = new Map<string, ProjectMapFeature[]>();
  for (const feature of features) {
    if (feature.latitude == null || feature.longitude == null) continue;
    const label = feature.province || "ไม่ระบุจังหวัด";
    grouped.set(label, [...(grouped.get(label) ?? []), feature]);
  }

  return [...grouped.entries()].map(([label, items]) => {
    const latitude =
      items.reduce((sum, item) => sum + (item.latitude ?? 0), 0) / items.length;
    const longitude =
      items.reduce((sum, item) => sum + (item.longitude ?? 0), 0) / items.length;
    return {
      key: `province:${label}`,
      label,
      count: items.length,
      latitude,
      longitude,
      projectIds: [...new Set(items.map((item) => item.projectId))],
    };
  });
}

function MapLayers({
  pointFeatures,
  polygonFeatures,
  aggregates,
  spreadPositions,
  showPoints,
  selectedProjectId,
  onSelectProject,
}: {
  pointFeatures: ProjectMapFeature[];
  polygonFeatures: ProjectMapFeature[];
  aggregates: AggregatePoint[];
  spreadPositions: Map<string, { latitude: number; longitude: number }>;
  showPoints: boolean;
  selectedProjectId?: string;
  onSelectProject: (projectId?: string) => void;
}) {
  const map = useMap();

  return (
    <>
      {showPoints
        ? pointFeatures.map((feature) => {
            const position = spreadPositions.get(feature.featureId) ?? {
              latitude: feature.latitude!,
              longitude: feature.longitude!,
            };
            return (
              <Marker
                key={feature.featureId}
                position={[position.latitude, position.longitude]}
                icon={markerIcon(1, feature.projectId === selectedProjectId)}
                eventHandlers={{
                  click: () => onSelectProject(feature.projectId),
                }}
              />
            );
          })
        : aggregates.map((aggregate) => {
            const uniqueIds = [...new Set(aggregate.projectIds)];
            return (
              <Marker
                key={aggregate.key}
                position={[aggregate.latitude, aggregate.longitude]}
                icon={markerIcon(
                  aggregate.count,
                  uniqueIds.includes(selectedProjectId ?? ""),
                )}
                eventHandlers={{
                  click: () => {
                    if (uniqueIds.length === 1) {
                      onSelectProject(uniqueIds[0]);
                      return;
                    }
                    map.flyTo([aggregate.latitude, aggregate.longitude], 8, {
                      duration: 0.8,
                    });
                  },
                }}
              />
            );
          })}

      {polygonFeatures.map((feature) => (
        <GeoJSON
          key={`${feature.featureId}:poly`}
          data={feature.geojson as never}
          pathOptions={{
            color: feature.projectId === selectedProjectId ? "#0B6E6E" : "#3B82C4",
            weight: feature.projectId === selectedProjectId ? 3 : 2,
            fillOpacity: 0.2,
          }}
          eventHandlers={{
            click: () => onSelectProject(feature.projectId),
          }}
        />
      ))}
    </>
  );
}

export function ProjectMap({
  features,
  selectedProjectId,
  focusNonce = 0,
  onSelectProject,
}: ProjectMapProps) {
  const [zoom, setZoom] = useState(6);
  const [basemapId, setBasemapId] = useState<BasemapId>(DEFAULT_BASEMAP_ID);
  const basemap = getBasemapOption(basemapId);

  const pointFeatures = useMemo(
    () =>
      features.filter(
        (feature) =>
          feature.geometryType === "Point" &&
          feature.latitude != null &&
          feature.longitude != null,
      ),
    [features],
  );
  const polygonFeatures = useMemo(
    () =>
      features.filter(
        (feature) =>
          (feature.geometryType === "Polygon" ||
            feature.geometryType === "MultiPolygon") &&
          feature.geojson,
      ),
    [features],
  );
  const aggregates = useMemo(
    () => buildProvinceAggregates(pointFeatures),
    [pointFeatures],
  );
  const spreadPositions = useMemo(
    () => spreadOverlappingPoints(pointFeatures),
    [pointFeatures],
  );
  const showPoints = zoom >= 7;

  return (
    <div className="spatial-map-shell relative h-full min-h-[620px] w-full">
      <MapContainer
        center={[16.8, 100.6]}
        zoom={6}
        minZoom={2}
        maxZoom={12}
        scrollWheelZoom
        className="h-full w-full rounded-[28px]"
      >
        <TileLayer
          key={basemap.id}
          attribution={basemap.attribution}
          url={basemap.url}
          {...(basemap.subdomains ? { subdomains: basemap.subdomains } : {})}
          {...(basemap.maxZoom ? { maxZoom: basemap.maxZoom } : {})}
          {...(basemap.tileSize ? { tileSize: basemap.tileSize } : {})}
        />
        <ZoomTracker onZoomChange={setZoom} />
        <FitFeatures features={features} selectedProjectId={selectedProjectId} />
        <FocusSelectedProject
          features={features}
          selectedProjectId={selectedProjectId}
          spreadPositions={spreadPositions}
          focusNonce={focusNonce}
        />
        <MapLayers
          pointFeatures={pointFeatures}
          polygonFeatures={polygonFeatures}
          aggregates={aggregates}
          spreadPositions={spreadPositions}
          showPoints={showPoints}
          selectedProjectId={selectedProjectId}
          onSelectProject={onSelectProject}
        />
      </MapContainer>

      <div className="spatial-basemap-overlay-host">
        <BasemapLayerControl basemapId={basemapId} onBasemapChange={setBasemapId} />
      </div>
    </div>
  );
}
