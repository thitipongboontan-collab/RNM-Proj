import type { GeoJsonValue, GeometryType, VerificationStatus } from "@/lib/project-map/types";

export function isValidLatitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

export function parseCoordinate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isFiniteNumberArray(value: unknown, depth: number): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;
  if (depth === 0) {
    return (
      value.length >= 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number" &&
      Number.isFinite(value[0]) &&
      Number.isFinite(value[1]) &&
      isValidLongitude(value[0]) &&
      isValidLatitude(value[1])
    );
  }
  return value.every((item) => isFiniteNumberArray(item, depth - 1));
}

function isValidPolygonCoordinates(coordinates: unknown): boolean {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return false;
  return coordinates.every((ring) => {
    if (!Array.isArray(ring) || ring.length < 4) return false;
    if (!isFiniteNumberArray(ring, 1)) return false;
    const first = ring[0] as number[];
    const last = ring[ring.length - 1] as number[];
    return first[0] === last[0] && first[1] === last[1];
  });
}

export function isValidGeoJsonGeometry(value: unknown): value is GeoJsonValue {
  if (!value || typeof value !== "object") return false;
  const geometry = value as GeoJsonValue;
  if (geometry.type === "Point") return isFiniteNumberArray(geometry.coordinates, 0);
  if (geometry.type === "Polygon") return isValidPolygonCoordinates(geometry.coordinates);
  if (geometry.type === "MultiPolygon") {
    return (
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.length > 0 &&
      geometry.coordinates.every((polygon) => isValidPolygonCoordinates(polygon))
    );
  }
  if (geometry.type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
    return geometry.geometries.every((item) => isValidGeoJsonGeometry(item));
  }
  return false;
}

export function mapVerificationStatus(rawStatus: string | null | undefined): VerificationStatus {
  const text = (rawStatus ?? "").trim();
  if (!text) return "pending";
  if (text.includes("ยืนยัน")) return "verified";
  if (text.includes("ค้นหาไม่สำเร็จ")) return "failed";
  if (text.includes("หลายพื้นที่")) return "multi_area";
  if (text.includes("พื้นที่กว้าง") || text.includes("ไม่ระบุจุด")) return "wide_area";
  if (text.toLowerCase().includes("pending")) return "pending";
  return "pending";
}

export function resolveGeometryType(input: {
  verificationStatus: VerificationStatus;
  latitude: number | null;
  longitude: number | null;
  geojson: unknown;
}): GeometryType | null {
  if (input.geojson && isValidGeoJsonGeometry(input.geojson)) {
    if (input.geojson.type === "Point") return "Point";
    if (input.geojson.type === "Polygon") return "Polygon";
    if (input.geojson.type === "MultiPolygon") return "MultiPolygon";
  }

  if (
    input.verificationStatus === "verified" &&
    isValidLatitude(input.latitude) &&
    isValidLongitude(input.longitude)
  ) {
    return "Point";
  }

  return null;
}

export function canMapGeometry(input: {
  verificationStatus: VerificationStatus;
  latitude: number | null;
  longitude: number | null;
  geojson: unknown;
}): boolean {
  return resolveGeometryType(input) !== null;
}

export function splitAreaTokens(value: string | null | undefined): string[] {
  if (!value) return [];
  return [...new Set(
    value
      .split(/[,/;|]+/)
      .map((part) => part.trim())
      .filter(Boolean),
  )];
}

export function matchesAreaToken(
  fieldValue: string | null | undefined,
  selected: string | undefined,
): boolean {
  if (!selected || selected === "all") return true;
  const tokens = splitAreaTokens(fieldValue);
  if (!tokens.length) return false;
  return tokens.includes(selected);
}

export type AreaScope = "domestic" | "international" | "unclear";

const THAI_PROVINCES = [
  "กรุงเทพ", "กรุงเทพฯ", "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร",
  "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย",
  "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช",
  "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์",
  "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "อยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร",
  "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน",
  "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย",
  "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว",
  "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย",
  "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี",
];

const THAI_PLACE_HINTS = [
  "ประเทศไทย", "ในประเทศไทย", "ในไทย", "ของไทย", "ต่อไทย", "สู่ไทย", "สู่ประเทศไทย",
  "thailand", "ล้านนา", "ภาคเหนือ", "ภาคตะวันออกเฉียงเหนือ", "ภาคกลาง", "ภาคใต้",
  "ภาคตะวันออก", "ภาคตะวันตก", "ปริมณฑล", "ลุ่มน้ำปิง", "คลองแม่ข่า", "แม่แจ่ม",
  "มหาวิทยาลัยเชียงใหม่",
];

const FOREIGN_PLACE_HINTS = [
  "ลาว", "สปป.ลาว", "สปป. ลาว", "laos",
  "พม่า", "เมียนมา", "เมียนมาร์", "myanmar",
  "กัมพูชา", "cambodia",
  "เวียดนาม", "vietnam",
  "มาเลเซีย", "malaysia",
  "สิงคโปร์", "singapore",
  "อินโดนีเซีย", "indonesia",
  "ฟิลิปปินส์", "philippines",
  "ไต้หวัน", "taiwan",
  "ญี่ปุ่น", "japan",
  "เกาหลี", "korea",
  "อินเดีย", "india",
  "นากาแลนด์", "nagaland",
  "โคฮิมา", "kohima",
  "มันดาเลย์", "mandalay",
  "สหราชอาณาจักร", "united kingdom",
];

function isThaiCountryToken(token: string): boolean {
  const normalized = token.toLowerCase().replace(/\s+/g, "");
  return (
    normalized === "ไทย" ||
    normalized === "ประเทศไทย" ||
    normalized === "thailand" ||
    normalized.includes("thai")
  );
}

function hasAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle.toLowerCase()));
}

export function classifyAreaScope(input: {
  country?: string | null;
  province?: string | null;
  amphoe?: string | null;
  tambon?: string | null;
  areaName?: string | null;
  region?: string | null;
  titleTh?: string | null;
  titleEn?: string | null;
}): { domestic: boolean; international: boolean } {
  const countryTokens = splitAreaTokens(input.country ?? "");
  const provinceText = (input.province ?? "").toLowerCase();
  const blob = [
    input.country,
    input.province,
    input.amphoe,
    input.tambon,
    input.areaName,
    input.region,
    input.titleTh,
    input.titleEn,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let domestic = countryTokens.some(isThaiCountryToken);
  let international = countryTokens.some((token) => !isThaiCountryToken(token));

  if (!domestic && THAI_PROVINCES.some((province) => provinceText.includes(province.toLowerCase()))) {
    domestic = true;
  }
  if (!domestic && ((input.amphoe ?? "").trim() || (input.tambon ?? "").trim())) {
    domestic = true;
  }
  if (!domestic && (hasAny(blob, THAI_PLACE_HINTS) || THAI_PROVINCES.some((province) => blob.includes(province.toLowerCase())))) {
    domestic = true;
  }
  if (!international && hasAny(blob, FOREIGN_PLACE_HINTS)) {
    international = true;
  }

  return { domestic, international };
}

export function isDomesticLocation(
  country: string | null | undefined,
  province: string | null | undefined,
): boolean {
  return classifyAreaScope({ country, province }).domestic;
}
