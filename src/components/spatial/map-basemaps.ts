export type BasemapId = "esri-light" | "esri-dark" | "osm";

export type BasemapOption = {
  id: BasemapId;
  label: string;
  url: string;
  attribution: string;
  subdomains?: string;
  maxZoom?: number;
};

export const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: "esri-light",
    label: "Esri Light Gray",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    maxZoom: 16,
  },
  {
    id: "esri-dark",
    label: "Esri Dark Gray",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    maxZoom: 16,
  },
  {
    id: "osm",
    label: "OpenStreetMap Standard",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
];

export const DEFAULT_BASEMAP_ID: BasemapId = "esri-light";

export function getBasemapOption(id: BasemapId): BasemapOption {
  return BASEMAP_OPTIONS.find((option) => option.id === id) ?? BASEMAP_OPTIONS[0];
}
