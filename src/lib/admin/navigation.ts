export const ADMIN_NAV_ITEMS = [
  { label: "ภาพรวม", href: "/admin" },
  { label: "แหล่งทุน", href: "/admin/fundings" },
  { label: "ข่าวสาร", href: "/admin/news" },
  { label: "นักวิจัย", href: "/admin/researchers", disabled: true },
] as const;
