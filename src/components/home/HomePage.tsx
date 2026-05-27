import Image from "next/image";
import { PageShell } from "@/components/layout/PageShell";
import { AiResearchAssistant } from "@/components/home/AiResearchAssistant";

const FEATURE_CARDS = [
  {
    title: "Targeted Funding",
    description:
      "คัดกรองและแนะนำแหล่งทุนวิจัยที่ตรงกับ ความเชี่ยวชาญและศักยภาพ เพื่อเพิ่มโอกาส ได้รับทุนอย่างมีประสิทธิภาพ",
    icon: "targeted-funding" as const,
  },
  {
    title: "Researcher Profile ",
    description:
      "ฐานข้อมูลนักวิจัยที่รวบรวมความเชี่ยวชาญและผลงาน เพื่อค้นหาและสร้างเครือข่าย ความร่วมมือทางวิชาการ",
    icon: "search-user" as const,
  },
  {
    title: "Smart Matchmaking",
    description:
      "ระบบเชื่อมโยงนักวิจัยกับแหล่งทุน และเครือข่าย เพื่อสนับสนุนการพัฒนา ข้อเสนอโครงการวิจัย",
    icon: "link" as const,
  },
  {
    title: "AI-Powered Suggestion",
    description:
      "ใช้ AI วิเคราะห์โปรไฟล์และความเชี่ยวชาญ ของนักวิจัย เพื่อแนะนำแหล่งทุน\nและผู้ร่วมวิจัย ที่เหมาะสมอย่างแม่นยำ",
    icon: "generative" as const,
  },
] as const;

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-5">
      <span className="h-9 w-[5px] shrink-0 bg-brand-primary" />
      <span className="font-sans text-base font-medium leading-none tracking-[0.0208em] text-brand-primary">
        {children}
      </span>
    </div>
  );
}

function FeatureIcon({
  type,
}: {
  type: (typeof FEATURE_CARDS)[number]["icon"];
}) {
  if (type === "targeted-funding") {
    return (
      <Image
        src="/images/targeted-funding.svg"
        alt=""
        width={60}
        height={60}
        className="h-[60px] w-[60px] shrink-0 object-contain"
      />
    );
  }

  const src =
    type === "search-user"
      ? "/images/search-user.png"
      : type === "link"
        ? "/images/link.png"
        : "/images/generative.png";

  return (
    <div className="relative h-[60px] w-[60px] shrink-0">
      <div className="absolute inset-0 rounded-full bg-white/50" />
      <div className="absolute inset-[15px]">
        <Image src={src} alt="" width={30} height={30} className="object-contain" />
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <PageShell>
      <div className="relative">
        <div
          className="absolute left-0 right-0 top-0 h-[628px] bg-hero-page"
          aria-hidden
        />

        <section className="relative z-10 mx-auto flex w-[1061px] flex-col items-center gap-[68px] pt-[58px]">
          <div className="flex w-full flex-col items-center gap-[30px]">
            <div className="flex w-full flex-col items-center gap-[63px]">
              <div className="flex h-[51px] w-[365px] shrink-0 items-center justify-center rounded-[50px] bg-hero-pill px-5">
                <p className="font-sans whitespace-nowrap text-base font-medium tracking-[0.0313em] text-brand-primary">
                  Intelligent for Research Colaboration
                </p>
              </div>

              <h1 className="font-sans flex items-center justify-center gap-[10px] whitespace-nowrap pb-1 text-[64px] font-bold leading-[1.15] tracking-[0.0078em]">
                <span className="text-gradient-funding">Funding</span>
                <span className="text-brand-dark">•</span>
                <span className="inline-block pb-0.5 text-gradient-matching">Matching</span>
                <span className="text-brand-dark">•</span>
                <span className="text-brand-dark">Networking</span>
              </h1>
            </div>

            <p className="font-sans m-0 w-[792px] text-center text-2xl font-medium leading-[1.35] tracking-[0.0208em] text-brand-muted">
              แพลตฟอร์มที่เชื่อมโยงแหล่งทุน นักวิจัย และเครือข่ายความร่วมมือทางวิชาการ
              <br />
              เพื่อร่วมพัฒนาข้อเสนอโครงการ แลกเปลี่ยนความเชี่ยวชาญ
              <br />
              และขับเคลื่อนงานวิจัยเพื่อสังคมอย่างยั่งยืน
            </p>
          </div>

          <AiResearchAssistant />
        </section>
      </div>

      <main className="flex items-start justify-center gap-[114px] px-0 pb-[72px] pt-[140px]">
        <section className="w-[509px] shrink-0">
          <SectionLabel>เกี่ยวกับแพลตฟอร์ม</SectionLabel>
          <div className="mt-10 flex flex-col gap-5">
            <h2 className="font-sans w-[469px] text-[36px] font-bold leading-tight text-brand-dark">
              ระบบสนับสนุนความร่วมมือทางวิชาการและงานวิจัยอัจฉริยะ
            </h2>
            <div className="font-sans space-y-4 text-xl font-normal leading-normal text-brand-muted">
              <p>
                <strong className="font-bold text-brand-dark">
                  Research Nexus Matching Platform
                </strong>{" "}
                คือแพลตฟอร์มที่พัฒนาขึ้น เพื่อเชื่อมโยงนักวิจัย แหล่งทุน
                และเครือข่ายความร่วมมือทางวิชาการ เพื่อสนับสนุนให้นักวิจัย
                สามารถเข้าถึงโอกาสด้านทุนวิจัยพร้อมหาแหล่งทุนที่สอดคล้อง
                กับความเชี่ยวชาญและความสนใจของนักวิจัยได้อย่างเหมาะสม
              </p>
              <p>
                แพลตฟอร์มนี้ยังส่งเสริมการสร้างเครือข่ายความร่วมมือระหว่าง
                นักวิจัยจากหลากหลายสาขาวิชา เพื่อเติมเต็มองค์ความรู้ และศักยภาพ
                ที่แตกต่างกันสู่การพัฒนาข้อเสนอโครงการวิจัย ที่มีความสมบูรณ์
                ครอบคลุม และตอบโจทย์ความท้าทายของสังคม ได้อย่างรอบด้าน
              </p>
            </div>
          </div>
        </section>

        <section className="w-[631px] shrink-0">
          <SectionLabel>ฟังก์ชัน</SectionLabel>
          <div className="mt-10 flex flex-col gap-[30px]">
            <div className="flex flex-col gap-2.5">
              <h2 className="font-sans text-[36px] font-bold leading-tight text-brand-dark">
                ฟังก์ชันการใช้งาน
              </h2>
              <p className="font-sans text-lg font-medium leading-normal text-brand-muted">
                ฟังก์ชันอัจฉริยะของระบบที่ช่วยยกระดับการทำงานวิจัย
                พร้อมเชื่อมโยงนักวิจัย แหล่งทุน และโอกาสทางวิชาการไว้ในที่เดียว
              </p>
            </div>
            <div className="flex flex-wrap gap-x-[27px] gap-y-[17px]">
              {FEATURE_CARDS.map((card) => (
                <article
                  key={card.title}
                  className="flex h-[209px] w-[302px] flex-col justify-center gap-[7px] rounded-[10px] bg-brand-primary px-6 py-4"
                >
                  <FeatureIcon type={card.icon} />
                  <h3 className="font-sans text-lg font-semibold tracking-[0.0278em] text-white">
                    {card.title}
                  </h3>
                  <p className="font-sans whitespace-pre-line text-sm font-normal leading-snug tracking-[0.0357em] text-white">
                    {card.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
