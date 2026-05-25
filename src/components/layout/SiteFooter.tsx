
export function SiteFooter() {
  return (
    <footer className="w-[1440px]" style={{ width: 1440, maxWidth: "100%" }}>
      <div
        className="relative h-[211px] bg-footer-main"
        style={{
          position: "relative",
          height: 211,
          background: "linear-gradient(90deg, #354185 0%, #006691 100%)",
        }}
      >
        <div
          className="absolute left-[88px] top-[39px] h-[136px] w-[136px]"
          style={{ position: "absolute", left: 88, top: 39, width: 136, height: 136 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cmu-logo-32e09e.png"
            alt="CMU"
            width={136}
            height={136}
            style={{ width: 136, height: 136, objectFit: "fill" }}
          />
        </div>
        <div
          className="absolute left-[260px] top-[81px] w-[319px] text-white"
          style={{ position: "absolute", left: 260, top: 81, width: 319, color: "#fff" }}
        >
          <p className="text-xl font-medium leading-tight" style={{ fontSize: 20, margin: 0 }}>
            Research Nexus Matching
          </p>
          <p className="mt-1 text-sm font-normal leading-snug" style={{ fontSize: 14, marginTop: 4 }}>
            ระบบสนับสนุนความร่วมมือทางวิชาการและงานวิจัยอัจฉริยะ
          </p>
        </div>
        <address
          className="absolute left-[891px] top-14 w-[482px] not-italic text-sm leading-5 text-white"
          style={{
            position: "absolute",
            left: 891,
            top: 56,
            width: 482,
            fontStyle: "normal",
            fontSize: 14,
            lineHeight: "20px",
            color: "#fff",
          }}
        >
          <p style={{ margin: 0 }}>
            งานบริหารงานวิจัยและวิเทศสัมพันธ์ คณะสังคมศาสตร์
            มหาวิทยาลัยเชียงใหม่
          </p>
          <p style={{ margin: "12px 0 0" }}>
            239 ถ.ห้วยแก้ว ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200 หมายเลขโทรศัพท์ :
            053-943-528
          </p>
          <p style={{ margin: "12px 0 0" }}>
            เว็บไซต์ :{" "}
            <a
              href="https://rais.soc.cmu.ac.th/"
              className="underline"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#fff" }}
            >
              https://rais.soc.cmu.ac.th/
            </a>
          </p>
        </address>
      </div>
      <div
        className="flex h-[72px] items-center justify-center border-t border-black/10 bg-brand-footer"
        style={{
          display: "flex",
          height: 72,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#252F65",
          borderTop: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <p className="font-inter text-sm text-white/[0.65]" style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: 0 }}>
          © 2026 Research Nexus Matching | All Rights Reserved
        </p>
      </div>
    </footer>
  );
}
