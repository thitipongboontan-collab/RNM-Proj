import Link from "next/link";

export type AssistantCitation = {
  id: string;
  type: "researcher" | "funding";
  label: string;
  href: string;
};

export function AssistantCitations({ items }: { items: AssistantCitation[] }) {
  if (!items.length) return null;

  return (
    <div className="mt-3 rounded-xl border border-[#E8ECF4] bg-white px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#778097]">
        แหล่งข้อมูลที่ใช้
      </p>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <Link
              href={item.href}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#D8DEEC] bg-[#F7F9FC] px-3 py-1 text-xs font-medium text-brand-primary transition hover:bg-[#EEF1F7]"
            >
              <span className="rounded bg-brand-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                {item.type === "researcher" ? "RS" : "FD"}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
