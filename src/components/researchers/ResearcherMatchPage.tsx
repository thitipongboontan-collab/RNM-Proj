import Link from "next/link";
import type { FundingFitResult, ResearcherIntelligence } from "@/lib/ai/intelligence/types";
import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageTitle } from "@/components/ui/PageTitle";

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E8ECF4]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#4D5CAD] to-[#00CACC]"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-12 text-right text-sm font-bold text-brand-primary">{score}</span>
    </div>
  );
}

function IntelligenceCard({ researcher }: { researcher: ResearcherIntelligence }) {
  return (
    <section className="rounded-[16px] border border-[#E5E7EB] bg-[#FAFBFD] p-6">
      <h2 className="text-lg font-bold text-brand-dark">Research Intelligence Profile</h2>
      <p className="mt-1 text-sm text-[#778097]">{researcher.nameTh}</p>
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#778097]">Impact Score</p>
          <p className="mt-1 text-2xl font-bold text-brand-primary">{researcher.impactScore}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#778097]">Recency Score</p>
          <p className="mt-1 text-2xl font-bold text-brand-primary">{researcher.recencyScore}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#778097]">ผลงาน</p>
          <p className="mt-1 text-base font-semibold text-brand-dark">
            {researcher.publicationCount} รายการ
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#778097]">เครือข่าย</p>
          <p className="mt-1 text-base font-semibold text-brand-dark">
            {researcher.collaborationBreadth} องค์กร
          </p>
        </div>
      </div>
      {researcher.topTopics.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-brand-dark">หัวข้อหลัก</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {researcher.topTopics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-[#12B2C5] px-3 py-1 text-xs font-medium text-[#12B2C5]"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function FundingMatchCard({ item }: { item: FundingFitResult }) {
  return (
    <article className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-[0px_0px_5px_0px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#778097]">
            Fit Score
          </p>
          <p className="text-3xl font-bold text-brand-primary">{item.fitScore}</p>
        </div>
        <Link
          href={`/funding/${item.fundingId}`}
          className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          ดูทุน
        </Link>
      </div>
      <h3 className="mt-4 text-lg font-bold leading-snug text-brand-dark">{item.title}</h3>
      <p className="mt-1 text-sm text-brand-dark/80">{item.organization}</p>
      <div className="mt-3">
        <ScoreBar score={item.fitScore} />
      </div>
      <p className="mt-3 text-sm text-[#778097]">
        {item.openDate} · {item.closeDate}
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#4A5568]">
        {item.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </article>
  );
}

function TrendChart({
  points,
}: {
  points: { year: number; count: number }[];
}) {
  if (!points.length) {
    return <p className="text-sm text-[#778097]">ไม่มีข้อมูลแนวโน้มผลงาน</p>;
  }

  const max = Math.max(...points.map((point) => point.count), 1);

  return (
    <div className="flex items-end gap-2">
      {points.map((point) => (
        <div key={point.year} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-[#4D5CAD] to-[#00CACC]"
            style={{ height: `${Math.max(12, (point.count / max) * 96)}px` }}
            title={`${point.year}: ${point.count}`}
          />
          <span className="text-xs text-[#778097]">{point.year}</span>
        </div>
      ))}
    </div>
  );
}

export function ResearcherMatchPage({
  researcherId,
  researcherName,
  intelligence,
  fundings,
  publicationTrend,
}: {
  researcherId: string;
  researcherName: string;
  intelligence: ResearcherIntelligence;
  fundings: FundingFitResult[];
  publicationTrend: { year: number; count: number }[];
}) {
  return (
    <PageShell>
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "นักวิจัย", href: "/researchers" },
          { label: researcherName, href: `/researchers/${researcherId}` },
          { label: "Smart Match" },
        ]}
      />

      <main className="mx-auto flex w-[1320px] max-w-full flex-col gap-10 px-[60px] pb-20 pt-10">
        <div className="flex flex-col gap-3">
          <PageTitle>Smart Match</PageTitle>
          <p className="text-lg text-[#778097]">
            จับคู่แหล่งทุนที่เหมาะกับ {researcherName} ด้วย Research Intelligence
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
          <div className="flex flex-col gap-6">
            <IntelligenceCard researcher={intelligence} />
            <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-6">
              <h2 className="text-lg font-bold text-brand-dark">แนวโน้มผลงาน</h2>
              <div className="mt-5">
                <TrendChart points={publicationTrend} />
              </div>
            </section>
          </div>

          <section className="flex flex-col gap-5">
            <h2 className="text-xl font-bold text-brand-dark">
              แหล่งทุนที่แนะนำ ({fundings.length})
            </h2>
            {fundings.length === 0 ? (
              <p className="text-[#778097]">ยังไม่พบทุนที่จับคู่ได้</p>
            ) : (
              fundings.map((item) => <FundingMatchCard key={item.fundingId} item={item} />)
            )}
          </section>
        </div>
      </main>
    </PageShell>
  );
}
