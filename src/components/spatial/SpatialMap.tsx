"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { divIcon, type LeafletEvent } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
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
  onSelectOrganization: (organizationName?: string) => void;
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

function SideOrganizationPopup({
  organization,
  latitude,
  longitude,
  onClose,
}: {
  organization: SpatialOrganization;
  latitude: number;
  longitude: number;
  onClose: () => void;
}) {
  const map = useMap();
  const [position, setPosition] = useState(() =>
    map.latLngToContainerPoint([latitude, longitude]),
  );

  const updatePosition = useCallback(() => {
    setPosition(map.latLngToContainerPoint([latitude, longitude]));
  }, [latitude, longitude, map]);

  useEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useMapEvents({
    move: updatePosition,
    zoom: updatePosition,
    moveend: updatePosition,
    zoomend: updatePosition,
    viewreset: updatePosition,
  });

  return createPortal(
    <div
      className="spatial-side-popup"
      style={{ left: position.x, top: position.y }}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="spatial-side-popup-close"
        aria-label="Close popup"
        onClick={onClose}
      >
        ×
      </button>
      <div className="min-w-[240px] max-w-[300px]">
        <p className="text-base font-semibold leading-tight text-brand-dark">
          {organization.name}
        </p>
        <p className="text-xs leading-tight text-[#778097]">
          {organization.province}, {organization.country}
        </p>
        <div className="mt-4">
          <p className="text-xs font-semibold leading-tight text-brand-dark">
            ความร่วมมือทั้งหมด({organization.collaborationCount})
          </p>
          <p className="mb-0.5 text-xs font-semibold leading-tight text-brand-dark">
            รายชื่อนักวิจัย({organization.researchers.length})
          </p>
          <div className="max-h-[92px] overflow-y-auto pr-1">
            <ul className="space-y-0.5">
              {organization.researchers.map((researcher) => (
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
    </div>,
    map.getContainer(),
  );
}

function SideAggregatePopup({
  aggregate,
  latitude,
  longitude,
  onClose,
}: {
  aggregate: SpatialAggregate;
  latitude: number;
  longitude: number;
  onClose: () => void;
}) {
  const map = useMap();
  const [position, setPosition] = useState(() =>
    map.latLngToContainerPoint([latitude, longitude]),
  );

  const updatePosition = useCallback(() => {
    setPosition(map.latLngToContainerPoint([latitude, longitude]));
  }, [latitude, longitude, map]);

  useEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useMapEvents({
    move: updatePosition,
    zoom: updatePosition,
    moveend: updatePosition,
    zoomend: updatePosition,
    viewreset: updatePosition,
  });

  return createPortal(
    <div
      className="spatial-side-popup"
      style={{ left: position.x, top: position.y }}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="spatial-side-popup-close"
        aria-label="Close popup"
        onClick={onClose}
      >
        ×
      </button>
      <div className="min-w-[220px] max-w-[300px]">
        <p className="text-base font-semibold leading-tight text-brand-dark">
          {aggregate.label}
        </p>
        <div className="mt-4">
          <p className="text-xs font-semibold leading-tight text-brand-dark">
            ความร่วมมือทั้งหมด({aggregate.count})
          </p>
          <p className="mb-0.5 text-xs font-semibold leading-tight text-brand-dark">
            หน่วยงานความร่วมมือ({aggregate.organizations.length})
          </p>
          <div className="max-h-[92px] overflow-y-auto pr-1">
            <ul className="space-y-0.5">
              {aggregate.organizations.map((organization) => (
                <li
                  key={organization}
                  className="rounded-md border border-[#E3EAF2] bg-white px-2 py-1 text-xs font-semibold leading-snug text-brand-dark"
                >
                  {organization}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>,
    map.getContainer(),
  );
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
  const [selectedAggregateKey, setSelectedAggregateKey] = useState<string>();
  const spreadPositions = spreadOverlappingOrganizations(organizations);
  const points =
    zoom >= 7
      ? buildOrganizationPoints(organizations, spreadPositions)
      : zoom >= 5
        ? buildAggregatePoints(provinceAggregates)
        : zoom >= 3
          ? buildAggregatePoints(regionAggregates)
          : buildAggregatePoints(countryAggregates);
  const selectedPoint = points.find(
    (point) => point.type === "organization" && point.label === selectedOrganization,
  );
  const selectedAggregatePoint = points.find(
    (point) => point.type === "aggregate" && point.key === selectedAggregateKey,
  );

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
                  setSelectedAggregateKey(undefined);
                  onSelectOrganization(point.organization.name);
                  return;
                }
                onSelectOrganization(undefined);
                setSelectedAggregateKey(point.key);
              },
            }}
          />
        );
      })}
      {selectedPoint?.type === "organization" && (
        <SideOrganizationPopup
          organization={selectedPoint.organization}
          latitude={selectedPoint.latitude}
          longitude={selectedPoint.longitude}
          onClose={() => onSelectOrganization(undefined)}
        />
      )}
      {selectedAggregatePoint?.type === "aggregate" && (
        <SideAggregatePopup
          aggregate={selectedAggregatePoint.aggregate}
          latitude={selectedAggregatePoint.latitude}
          longitude={selectedAggregatePoint.longitude}
          onClose={() => setSelectedAggregateKey(undefined)}
        />
      )}
    </MapContainer>
  );
}
