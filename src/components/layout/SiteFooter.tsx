
export function SiteFooter() {
  return (
    <footer className="w-full">
      <div className="bg-footer-main bg-[linear-gradient(90deg,#354185_0%,#006691_100%)]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-6 px-4 py-8 text-center sm:px-8 md:flex-row md:items-center md:justify-between md:gap-8 md:py-10 md:text-left lg:px-[88px]">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cmu-logo-32e09e.png"
              alt="CMU"
              width={136}
              height={136}
              className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24 lg:h-[136px] lg:w-[136px]"
            />
            <div className="max-w-[319px] text-white">
              <p className="font-sans text-lg font-medium leading-tight sm:text-xl">
                Research Nexus Matching
              </p>
              <p className="font-sans mt-1 text-sm font-normal leading-snug">
                ระบบสนับสนุนความร่วมมือทางวิชาการและงานวิจัยอัจฉริยะ
              </p>
            </div>
          </div>

          <address className="font-sans max-w-[482px] not-italic text-sm font-normal leading-5 text-white">
            <p>
              งานบริหารงานวิจัยและวิเทศสัมพันธ์ คณะสังคมศาสตร์
              มหาวิทยาลัยเชียงใหม่
            </p>
            <p className="mt-3">
              239 ถ.ห้วยแก้ว ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200 หมายเลขโทรศัพท์ :
              053-943-528
            </p>
            <p className="mt-3 break-words">
              เว็บไซต์ :{" "}
              <a
                href="https://rais.soc.cmu.ac.th/"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                https://rais.soc.cmu.ac.th/
              </a>
            </p>
          </address>
        </div>
      </div>
      <div className="flex min-h-[64px] items-center justify-center border-t border-black/10 bg-brand-footer px-4 py-4 text-center sm:min-h-[72px]">
        <p className="font-inter text-xs leading-relaxed text-white/[0.65] sm:text-sm">
          © 2026 Research Nexus Matching | All Rights Reserved
        </p>
      </div>
    </footer>
  );
}
