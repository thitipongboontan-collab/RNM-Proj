export const SITE_PAGE_KEYS = {
  home: "home",
  funding: "funding",
  researchers: "researchers",
  spatial: "spatial",
  geographic: "geographic",
  projectMap: "project-map",
  works: "works",
} as const;

export type SitePageKey = (typeof SITE_PAGE_KEYS)[keyof typeof SITE_PAGE_KEYS];

export const SITE_PAGE_LABELS: Record<SitePageKey, string> = {
  home: "หน้าแรก",
  funding: "แหล่งทุน",
  researchers: "นักวิจัย",
  spatial: "เครือข่าย",
  geographic: "เชิงพื้นที่",
  "project-map": "พื้นที่วิจัย",
  works: "ผลงาน",
};
