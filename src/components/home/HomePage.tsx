import Image from "next/image";
import { AiResearchAssistant } from "@/components/home/AiResearchAssistant";
import { HeroVortex } from "@/components/home/HeroVortex";
import { ResearchNewsSection } from "@/components/home/ResearchNewsSection";
import type { ResearchNewsItem } from "@/data/research-news";

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
    title: "Academic Collaboration Map",
    description:
      "แสดงเครือข่ายความร่วมมือทางวิชาการ เพื่อวิเคราะห์การเชื่อมโยงของนักวิจัยทั้งในประเทศและต่างประเทศ",
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

const HERO_SHORTCUTS = [
  {
    title: "ค้นหาแหล่งทุน",
    subtitle: "Funding Opportunities",
    icon: "funding" as const,
  },
  {
    title: "จับคู่ความร่วมมือ",
    subtitle: "Research Matching",
    icon: "matching" as const,
  },
  {
    title: "เครือข่ายนักวิจัย",
    subtitle: "Research Network",
    icon: "network" as const,
  },
  {
    title: "ผลงานวิจัย",
    subtitle: "Research Outputs",
    icon: "outputs" as const,
  },
] as const;

function HeroShortcutIcon({ type }: { type: (typeof HERO_SHORTCUTS)[number]["icon"] }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: "0 0 28 28",
    fill: "none",
    "aria-hidden": true as const,
  };

  if (type === "funding") {
    return (
      <svg {...common}>
        <ellipse cx="14" cy="8" rx="7" ry="3" stroke="#4D5CAD" strokeWidth="1.6" />
        <path d="M7 8v6c0 1.7 3.1 3 7 3s7-1.3 7-3V8" stroke="#4D5CAD" strokeWidth="1.6" />
        <path d="M7 14v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" stroke="#4D5CAD" strokeWidth="1.6" />
      </svg>
    );
  }

  if (type === "matching") {
    return (
      <svg {...common}>
        <circle cx="10" cy="11" r="3" stroke="#4D5CAD" strokeWidth="1.6" />
        <circle cx="18.5" cy="11" r="3" stroke="#4D5CAD" strokeWidth="1.6" />
        <path d="M5.5 20c.6-2.4 2.4-3.6 4.5-3.6s3.9 1.2 4.5 3.6" stroke="#4D5CAD" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M15 16.6c1.3-.5 2.5-.6 3.6-.2 1.8.6 2.9 2 3.4 3.6" stroke="#4D5CAD" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "network") {
    return (
      <svg {...common}>
        <circle cx="8" cy="15" r="2.2" stroke="#4D5CAD" strokeWidth="1.6" />
        <circle cx="14" cy="8" r="2.2" stroke="#4D5CAD" strokeWidth="1.6" />
        <circle cx="20" cy="16" r="2.2" stroke="#4D5CAD" strokeWidth="1.6" />
        <path d="M10 14.2L12.4 9.6M15.6 9.4L18.2 14.4M10.1 16.2H17.8" stroke="#4D5CAD" strokeWidth="1.6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M6 20V16M12 20V10M18 20V13M22 20H5" stroke="#4D5CAD" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
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

export function HomePage({ newsItems }: { newsItems: ResearchNewsItem[] }) {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-white">
        <div className="relative mx-auto flex min-h-svh w-full max-w-[1316px] flex-col px-4 pb-8 pt-[92px] sm:px-6 sm:pt-[108px] lg:px-8 lg:pt-[120px]">
          <div className="grid flex-1 items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,520px)] lg:gap-6">
            <div className="flex flex-col items-start">
              <h1 className="font-sans text-[clamp(2.15rem,3.1vw,3.45rem)] font-bold leading-[1.08] tracking-[-0.02em] text-[#1C2454] lg:whitespace-nowrap">
                Research Nexus Matching
              </h1>
              <p className="mt-3 bg-[linear-gradient(90deg,#2F6BFF_0%,#5B5CFF_42%,#7A45E8_100%)] bg-clip-text font-sans text-[clamp(1.45rem,2.35vw,2.45rem)] font-bold leading-tight text-transparent lg:whitespace-nowrap">
                Funding • Matching • Networking
              </p>
              <div className="mt-6 flex gap-4">
                <span className="mt-1 w-[3px] shrink-0 self-stretch rounded-full bg-[#5B67C7]" />
                <p className="m-0 max-w-[520px] font-sans text-sm font-medium leading-relaxed text-[#5C6780] sm:text-base">
                  แพลตฟอร์มที่เชื่อมโยงแหล่งทุน นักวิจัย และเครือข่ายความร่วมมือทางวิชาการ
                  เพื่อร่วมพัฒนาข้อเสนอโครงการ แลกเปลี่ยนความเชี่ยวชาญ
                  และขับเคลื่อนงานวิจัยเพื่อสังคมอย่างยั่งยืน
                </p>
              </div>
              <div className="mt-7">
                <AiResearchAssistant />
              </div>
              <ul className="mt-10 grid w-full grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
                {HERO_SHORTCUTS.map((item) => (
                  <li key={item.title} className="flex flex-col items-center text-center">
                    <HeroShortcutIcon type={item.icon} />
                    <p className="mt-2 font-sans text-sm font-semibold text-[#31405C]">{item.title}</p>
                    <p className="font-sans text-[11px] text-[#8A94A8]">{item.subtitle}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div aria-hidden className="relative h-[320px] lg:h-auto lg:min-h-[520px]">
              <div className="pointer-events-none absolute inset-x-0 -top-6 bottom-0 lg:inset-y-[-3rem] lg:left-0 lg:right-[-1.5rem]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(22,18,72,0.96)_0%,rgba(28,36,84,0.78)_40%,rgba(255,255,255,0)_72%)]" />
                <HeroVortex className="absolute inset-0 h-full w-full" />
              </div>
            </div>
          </div>
          <a
            href="#about-platform"
            className="mt-8 flex flex-col items-center gap-1 font-sans text-sm text-[#8A94A8] transition hover:text-brand-primary"
          >
            Scroll down
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M3 6L8 11L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </section>

      <main id="about-platform" className="mx-auto flex w-full max-w-[1316px] flex-col items-start justify-center gap-12 px-4 pb-[72px] pt-16 sm:px-6 sm:pt-20 lg:flex-row lg:gap-[114px] lg:px-8">
        <section className="w-full shrink-0 lg:w-[509px]">
          <SectionLabel>เกี่ยวกับแพลตฟอร์ม</SectionLabel>
          <div className="mt-8 flex flex-col gap-5 sm:mt-10">
            <h2 className="font-sans w-full max-w-[469px] text-2xl font-bold leading-tight text-brand-dark sm:text-[36px]">
              ระบบสนับสนุนความร่วมมือทางวิชาการและงานวิจัยอัจฉริยะ
            </h2>
            <div className="font-sans space-y-4 text-base font-normal leading-relaxed text-brand-muted sm:text-xl sm:leading-normal">
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

        <section className="w-full shrink-0 lg:w-[631px]">
          <SectionLabel>ฟังก์ชัน</SectionLabel>
          <div className="mt-8 flex flex-col gap-[30px] sm:mt-10">
            <div className="flex flex-col gap-2.5">
              <h2 className="font-sans text-2xl font-bold leading-tight text-brand-dark sm:text-[36px]">
                ฟังก์ชันการใช้งาน
              </h2>
              <p className="font-sans text-base font-medium leading-relaxed text-brand-muted sm:text-lg sm:leading-normal">
                ฟังก์ชันอัจฉริยะของระบบที่ช่วยยกระดับการทำงานวิจัย
                พร้อมเชื่อมโยงนักวิจัย แหล่งทุน และโอกาสทางวิชาการไว้ในที่เดียว
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-[17px] sm:grid-cols-2 sm:gap-x-[27px]">
              {FEATURE_CARDS.map((card) => (
                <article
                  key={card.title}
                  className="group flex min-h-[190px] w-full flex-col justify-center gap-[7px] rounded-[10px] bg-brand-primary px-6 py-4 shadow-[0px_6px_18px_rgba(77,92,173,0.12)] transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-[linear-gradient(105deg,#16314A_0%,#0A7378_58%,#00B8AE_100%)] hover:shadow-[0px_16px_34px_rgba(0,119,128,0.24)] sm:h-[209px]"
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

      <ResearchNewsSection items={newsItems} />
    </>
  );
}
