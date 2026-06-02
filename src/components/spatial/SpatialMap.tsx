"use client";

import { useEffect, useState } from "react";
import { divIcon, type LeafletEvent } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type {
  SpatialAggregate,
  SpatialOrganization,
} from "@/lib/spatial-repository";

type MapPoint =
  | {
      type: "organization";
      key: string;
      label: string;
      latitude: number;
      longitude: number;
      count: number;
      organization: SpatialOrganization;
    }
  | {
      type: "aggregate";
      key: string;
      label: string;
      latitude: number;
      longitude: number;
      count: number;
      aggregate: SpatialAggregate;
    };

type SpatialMapProps = {
  organizations: SpatialOrganization[];
  provinceAggregates: SpatialAggregate[];
  regionAggregates: SpatialAggregate[];
  countryAggregates: SpatialAggregate[];
  selectedOrganization?: string;
  focusedOrganizationName?: string;
  focusedCountry?: string;
  onSelectOrganization: (organizationName: string) => void;
};

function useZoomLevel(onZoomChange: (zoom: number) => void) {
  useMapEvents({
    zoomend(event: LeafletEvent) {
      onZoomChange(event.target.getZoom());
    },
  });
  return null;
}

function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  useZoomLevel(onZoomChange);
  return null;
}

function spreadOverlappingOrganizations(
  organizations: SpatialOrganization[],
): Map<string, { latitude: number; longitude: number }> {
  const grouped = new Map<string, SpatialOrganization[]>();
  for (const organization of organizations) {
    const key = `${organization.latitude.toFixed(4)}:${organization.longitude.toFixed(4)}`;
    grouped.set(key, [...(grouped.get(key) ?? []), organization]);
  }

  const positions = new Map<string, { latitude: number; longitude: number }>();
  for (const group of grouped.values()) {
    if (group.length === 1) {
      positions.set(group[0].name, {
        latitude: group[0].latitude,
        longitude: group[0].longitude,
      });
      continue;
    }

    const radius = Math.min(0.18, 0.045 + group.length * 0.006);
    group.forEach((organization, index) => {
      const angle = (Math.PI * 2 * index) / group.length;
      positions.set(organization.name, {
        latitude: organization.latitude + Math.sin(angle) * radius,
        longitude: organization.longitude + Math.cos(angle) * radius,
      });
    });
  }

  return positions;
}

function MapFocusController({
  organizations,
  spreadPositions,
  countryAggregates,
  focusedOrganizationName,
  focusedCountry,
}: {
  organizations: SpatialOrganization[];
  spreadPositions: Map<string, { latitude: number; longitude: number }>;
  countryAggregates: SpatialAggregate[];
  focusedOrganizationName?: string;
  focusedCountry?: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (focusedOrganizationName) {
      const organization = organizations.find((item) => item.name === focusedOrganizationName);
      if (organization) {
        const position = spreadPositions.get(organization.name) ?? organization;
        map.flyTo([position.latitude, position.longitude], 9, { duration: 0.8 });
      }
      return;
    }

    if (focusedCountry) {
      const aggregate = countryAggregates.find((item) => item.label === focusedCountry);
      if (aggregate) {
        map.flyTo(
          [aggregate.latitude, aggregate.longitude],
          focusedCountry === "Thailand" ? 6 : 4,
          { duration: 0.8 },
        );
      }
    }
  }, [countryAggregates, focusedCountry, focusedOrganizationName, map, organizations, spreadPositions]);

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

function buildOrganizationPoints(
  organizations: SpatialOrganization[],
  spreadPositions: Map<string, { latitude: number; longitude: number }>,
): MapPoint[] {
  return organizations
    .filter((item) => item.locationLevel !== "unknown")
    .map((organization) => {
      const position = spreadPositions.get(organization.name) ?? organization;
      return {
        type: "organization",
        key: `organization:${organization.name}`,
        label: organization.name,
        latitude: position.latitude,
        longitude: position.longitude,
        count: organization.collaborationCount,
        organization,
      };
    });
}

function buildAggregatePoints(aggregates: SpatialAggregate[]): MapPoint[] {
  return aggregates.map((aggregate) => ({
    type: "aggregate",
    key: aggregate.key,
    label: aggregate.label,
    latitude: aggregate.latitude,
    longitude: aggregate.longitude,
    count: aggregate.count,
    aggregate,
  }));
}

export function SpatialMap({
  organizations,
  provinceAggregates,
  regionAggregates,
  countryAggregates,
  selectedOrganization,
  focusedOrganizationName,
  focusedCountry,
  onSelectOrganization,
}: SpatialMapProps) {
  const [zoom, setZoom] = useState(5);
  const spreadPositions = spreadOverlappingOrganizations(organizations);
  const points =
    zoom >= 7
      ? buildOrganizationPoints(organizations, spreadPositions)
      : zoom >= 5
        ? buildAggregatePoints(provinceAggregates)
        : zoom >= 3
          ? buildAggregatePoints(regionAggregates)
          : buildAggregatePoints(countryAggregates);

  return (
    <MapContainer
      center={[16.8, 100.6]}
      zoom={6}
      minZoom={2}
      maxZoom={12}
      scrollWheelZoom
      className="h-full min-h-[620px] w-full rounded-[28px]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomTracker onZoomChange={setZoom} />
      <MapFocusController
        organizations={organizations}
        spreadPositions={spreadPositions}
        countryAggregates={countryAggregates}
        focusedOrganizationName={focusedOrganizationName}
        focusedCountry={focusedCountry}
      />
      {points.map((point) => {
        const selected = point.type === "organization" && point.label === selectedOrganization;
        return (
          <Marker
            key={point.key}
            position={[point.latitude, point.longitude]}
            icon={markerIcon(point.count, selected)}
            eventHandlers={{
              click: () => {
                if (point.type === "organization") {
                  onSelectOrganization(point.organization.name);
                }
              },
            }}
          >
            <Popup>
              {point.type === "organization" ? (
                <div className="min-w-[240px] max-w-[300px]">
                  <p className="text-base font-semibold leading-snug text-brand-dark">
                    {point.organization.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#778097]">
                    {point.organization.province}, {point.organization.country}
                  </p>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <p className="text-xs font-medium text-[#778097]">ความร่วมมือทั้งหมด</p>
                    <p className="text-xl font-bold leading-none text-brand-primary">
                      {point.organization.collaborationCount}
                    </p>
                  </div>
                  <div className="mt-1.5">
                    <p className="mb-1 text-xs font-semibold text-brand-dark">
                      รายชื่อนักวิจัย ({point.organization.researchers.length})
                    </p>
                    <div className="max-h-[92px] overflow-y-auto pr-1">
                      <ul className="space-y-0.5">
                        {point.organization.researchers.map((researcher) => (
                          <li
                            key={researcher.id}
                            className="rounded-md border border-[#E3EAF2] bg-white px-2 py-1"
                          >
                            <p className="text-xs font-semibold leading-snug text-brand-dark">
                              {researcher.name}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-snug text-[#778097]">
                              {researcher.department}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-w-[220px]">
                  <p className="font-semibold text-brand-dark">{point.aggregate.label}</p>
                  <p className="mt-1 text-sm text-brand-primary">
                    {point.aggregate.count} ความร่วมมือ
                  </p>
                  <p className="mt-2 text-sm text-[#778097]">
                    {point.aggregate.organizations.slice(0, 4).join(", ")}
                    {point.aggregate.organizations.length > 4 ? "..." : ""}
                  </p>
                </div>
              )}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
