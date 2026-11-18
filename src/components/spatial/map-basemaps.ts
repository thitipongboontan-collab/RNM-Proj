export type BasemapId = "maptiler-omt" | "osm" | "esri-streets" | "esri-light" | "esri-dark";

export type BasemapOption = {
  id: BasemapId;
  label: string;
  url: string;
  attribution: string;
  subdomains?: string;
  maxZoom?: number;
  tileSize?: number;
};

function getMapTilerKey(): string {
  return (process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "").trim();
}

function buildBasemapOptions(): BasemapOption[] {
  const mapTilerKey = getMapTilerKey();
  const options: BasemapOption[] = [];

  if (mapTilerKey) {
    options.push({
      id: "maptiler-omt",
      label: "MapTiler Streets (OMT)",
      // 256px raster tiles for Leaflet; Streets v2 is OpenMapTiles-based with English-oriented labels.
      url: `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${encodeURIComponent(mapTilerKey)}`,
      attribution:
        '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">&copy; OpenStreetMap contributors</a>',
      maxZoom: 22,
      tileSize: 256,
    });
  }

  options.push(
    {
      id: "osm",
      label: "OpenStreetMap",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: "abc",
      maxZoom: 19,
    },
    {
      id: "esri-streets",
      label: "Esri Streets (English)",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap",
      maxZoom: 16,
    },
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
  );

  return options;
}

export const BASEMAP_OPTIONS: BasemapOption[] = buildBasemapOptions();

export const DEFAULT_BASEMAP_ID: BasemapId = getMapTilerKey() ? "maptiler-omt" : "osm";

export function getBasemapOption(id: BasemapId): BasemapOption {
  return BASEMAP_OPTIONS.find((option) => option.id === id) ?? BASEMAP_OPTIONS[0];
}
