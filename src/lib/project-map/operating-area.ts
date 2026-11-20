import type { ProjectMapOperatingArea } from "@/lib/project-map/types";

function displayCountry(country: string) {
  const value = country.trim();
  if (!value) return "";
  const normalized = value.toLowerCase();
  if (
    normalized === "ไทย" ||
    normalized === "thailand" ||
    normalized === "th" ||
    normalized === "ประเทศไทย"
  ) {
    return "ประเทศไทย";
  }
  return value;
}

export function formatOperatingAreaLabel(area: ProjectMapOperatingArea) {
  const placeParts = [area.areaName, area.tambon, area.amphoe, area.province]
    .map((value) => value.trim())
    .filter(Boolean);
  if (placeParts.length) {
    return `พื้นที่ดำเนินโครงการ: ${placeParts.join(", ")}`;
  }

  const fallback = area.region.trim() || displayCountry(area.country);
  if (!fallback) return "";
  return `พื้นที่ดำเนินโครงการ: ${fallback}`;
}
