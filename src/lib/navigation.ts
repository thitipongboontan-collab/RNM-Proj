export const NAV_ITEMS = [
  { label: "หน้าหลัก", href: "/" },
  { label: "แหล่งทุน", href: "/funding" },
  { label: "นักวิจัย", href: "/researchers" },
  { label: "เชิงพื้นที่", href: "/spatial" },
  { label: "ผลงาน", href: "/works" },
] as const;

export const FIGMA_PAGES = {
  home: "4:797",
  funding: "156:525",
  fundingDetail: "156:1488",
  researchers: "35:1138",
  researcherDetail: "70:3219",
  works: "under-development",
  spatial: "145:649",
} as const;
