export const IMAGE_POSITION_PRESETS = [
  { value: "50% 50%", label: "กึ่งกลาง" },
  { value: "50% 0%", label: "ด้านบน" },
  { value: "50% 100%", label: "ด้านล่าง" },
  { value: "0% 50%", label: "ด้านซ้าย" },
  { value: "100% 50%", label: "ด้านขวา" },
] as const;

const LEGACY_PRESET_MAP: Record<string, string> = {
  center: "50% 50%",
  top: "50% 0%",
  bottom: "50% 100%",
  left: "0% 50%",
  right: "100% 50%",
};

const POSITION_PATTERN = /^(\d{1,3})%\s+(\d{1,3})%$/;

export function parseImagePosition(value: string | null | undefined): { x: number; y: number } {
  const css = normalizeImagePosition(value);
  const match = css.match(POSITION_PATTERN);
  if (!match) return { x: 50, y: 50 };
  return {
    x: Math.min(100, Math.max(0, Number(match[1]))),
    y: Math.min(100, Math.max(0, Number(match[2]))),
  };
}

export function formatImagePosition(x: number, y: number): string {
  const safeX = Math.min(100, Math.max(0, Math.round(x)));
  const safeY = Math.min(100, Math.max(0, Math.round(y)));
  return `${safeX}% ${safeY}%`;
}

export function normalizeImagePosition(value: string | null | undefined): string {
  if (!value?.trim()) return "50% 50%";

  const trimmed = value.trim();
  if (LEGACY_PRESET_MAP[trimmed]) {
    return LEGACY_PRESET_MAP[trimmed];
  }

  const match = trimmed.match(POSITION_PATTERN);
  if (match) {
    return formatImagePosition(Number(match[1]), Number(match[2]));
  }

  return "50% 50%";
}

export function resolveImagePositionCss(value: string | null | undefined): string {
  return normalizeImagePosition(value);
}
