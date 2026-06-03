export type BasemapId = "carto-light" | "carto-dark" | "osm";

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
    id: "carto-light",
    label: "Carto Positron (light)",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  },
  {
    id: "carto-dark",
    label: "Carto Positron (dark)",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
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

export const DEFAULT_BASEMAP_ID: BasemapId = "carto-light";

export function getBasemapOption(id: BasemapId): BasemapOption {
  return BASEMAP_OPTIONS.find((option) => option.id === id) ?? BASEMAP_OPTIONS[0];
}
