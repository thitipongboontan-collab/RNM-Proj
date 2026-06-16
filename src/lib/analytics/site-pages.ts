export const SITE_PAGE_KEYS = {
  home: "home",
  funding: "funding",
  researchers: "researchers",
  spatial: "spatial",
  works: "works",
} as const;

export type SitePageKey = (typeof SITE_PAGE_KEYS)[keyof typeof SITE_PAGE_KEYS];

export const SITE_PAGE_LABELS: Record<SitePageKey, string> = {
  home: "หน้าแรก",
  funding: "แหล่งทุน",
  researchers: "นักวิจัย",
  spatial: "แผนที่ความร่วมมือ",
  works: "ผลงาน",
};
