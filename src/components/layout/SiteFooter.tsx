import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="w-full">
      <div className="bg-footer-main bg-[linear-gradient(90deg,#354185_0%,#006691_100%)]">
        <div className="mx-auto grid w-full max-w-[1440px] gap-5 px-4 py-4 sm:px-8 sm:py-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-10 lg:px-[88px]">
          <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cmu-logo-32e09e.png"
              alt="CMU"
              width={56}
              height={56}
              className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
            />
            <div className="min-w-0 text-white">
              <p className="font-sans text-base font-semibold leading-tight tracking-[0.01em] sm:whitespace-nowrap sm:text-[16px]">
                Research Nexus Matching
              </p>
              <p className="font-sans mt-1 text-[12.5px] font-normal leading-snug text-white/92 sm:text-[13px]">
                ระบบสนับสนุนความร่วมมือทางวิชาการและงานวิจัยอัจฉริยะ
              </p>
            </div>
          </div>

          <address className="font-sans not-italic text-[12.5px] font-normal leading-relaxed text-white sm:text-[13px]">
            <p>งานบริหารงานวิจัยและวิเทศสัมพันธ์ คณะสังคมศาสตร์ มหาวิทยาลัยเชียงใหม่</p>
            <p className="mt-1">
              239 ถ.ห้วยแก้ว ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200
              <span className="hidden sm:inline"> · </span>
              <span className="mt-1 block whitespace-nowrap sm:mt-0 sm:inline">
                โทร. 053-943-528
              </span>
            </p>
            <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              <span>
                เว็บไซต์ :{" "}
                <a
                  href="https://rais.soc.cmu.ac.th/"
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  rais.soc.cmu.ac.th
                </a>
              </span>
              <Link href="/admin/login" className="underline">
                สำหรับ Admin
              </Link>
            </p>
          </address>
        </div>
      </div>
      <div className="flex items-center justify-center border-t border-black/10 bg-brand-footer px-4 py-3 text-center">
        <p className="font-inter text-xs leading-none text-white/[0.65] sm:text-sm">
          © 2026 Research Nexus Matching | All Rights Reserved
        </p>
      </div>
    </footer>
  );
}
