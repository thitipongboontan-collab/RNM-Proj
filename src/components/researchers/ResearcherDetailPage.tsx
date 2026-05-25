import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import {
  ContactRow,
  DetailSection,
  MetricsRow,
} from "@/components/researchers/ResearcherDetailParts";
import type { ResearcherItem } from "@/data/researchers";

export function ResearcherDetailPage({ item }: { item: ResearcherItem }) {

  return (
    <PageShell>
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "นักวิจัย", href: "/researchers" },
          { label: item.name },
        ]}
      />

      <main
        className="px-[65px] pb-20 pt-[47px]"
        style={{ padding: "47px 65px 80px" }}
      >
        <div
          className="flex items-start gap-5"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 20,
            width: 1311,
            maxWidth: "100%",
          }}
        >
          {/* คอลัมน์ซ้าย — รูป + ข้อมูลทั้งหมดเรียงใต้รูป */}
          <aside
            className="flex w-[506px] shrink-0 flex-col items-center"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: 506,
              flexShrink: 0,
            }}
          >
            <div
              className="h-[346px] w-[331px] shrink-0 bg-gradient-to-br from-[#D2D8EC] to-[#C1DFED]"
              style={{
                width: 331,
                height: 346,
                flexShrink: 0,
                background: "linear-gradient(135deg, #D2D8EC 0%, #C1DFED 100%)",
              }}
              role="img"
              aria-label={item.name}
            />

            <div
              className="mt-[18px] flex w-full flex-col items-center gap-2 text-center"
              style={{
                marginTop: 18,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                textAlign: "center",
                width: "100%",
              }}
            >
              <h1
                className="w-full text-[32px] font-bold leading-snug text-brand-primary"
                style={{
                  width: "100%",
                  fontSize: 32,
                  fontWeight: 700,
                  lineHeight: 1.375,
                  color: "#4D5CAD",
                  margin: 0,
                }}
              >
                {item.name}
              </h1>
              <p
                className="w-full text-2xl font-medium"
                style={{
                  width: "100%",
                  fontSize: 24,
                  fontWeight: 500,
                  color: "rgba(37, 50, 75, 0.8)",
                  margin: 0,
                }}
              >
                {item.department}
              </p>
            </div>

            <div className="mt-[15px]" style={{ marginTop: 15, width: "100%" }}>
              <ContactRow email={item.email} phone={item.phone} />
            </div>

            <div className="mt-[45px] w-full" style={{ marginTop: 45, width: "100%" }}>
              <MetricsRow
                scholarlyOutput={item.scholarlyOutput}
                citations={item.citations}
                hIndex={item.hIndex}
              />
            </div>
          </aside>

          {/* คอลัมน์ขวา — ประวัติ / ความเชี่ยวชาญ / ผลงาน */}
          <div
            className="flex w-[632px] flex-col gap-[71px]"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 71,
              width: 632,
              flex: 1,
            }}
          >
            {item.education && item.education.length > 0 && (
              <DetailSection title="ประวัติการศึกษา" items={item.education} />
            )}
            {item.expertise && item.expertise.length > 0 && (
              <DetailSection title="ความเชี่ยวชาญและความสนใจ" items={item.expertise} />
            )}
            {item.publications && item.publications.length > 0 && (
              <DetailSection title="ผลงาน" items={item.publications} />
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
