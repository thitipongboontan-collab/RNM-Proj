function EmailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <rect x="1" y="3" width="13" height="9" rx="1.5" stroke="#5F5F60" strokeWidth="1.2" />
      <path d="M1 4.5 7.5 8.5 14 4.5" stroke="#5F5F60" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path
        d="M4.5 1.5h2l1 3-1.5 1a6.5 6.5 0 0 0 3 3L10 7l3 1v2a1 1 0 0 1-1 1A10 10 0 0 1 2.5 3.5a1 1 0 0 1 1-2Z"
        stroke="#5F5F60"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ContactRow({ email, phone }: { email?: string; phone?: string }) {
  if (!email && !phone) return null;

  return (
    <div
      className="flex flex-row flex-wrap items-center justify-center gap-2.5"
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
      }}
    >
      {email && (
        <span
          className="inline-flex items-center gap-1 text-sm text-[#5F5F60]"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, color: "#5F5F60" }}
        >
          <EmailIcon />
          {email}
        </span>
      )}
      {phone && (
        <span
          className="inline-flex items-center gap-1 text-sm text-[#5F5F60]"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, color: "#5F5F60" }}
        >
          <PhoneIcon />
          {phone}
        </span>
      )}
    </div>
  );
}

export function MetricsRow({
  scholarlyOutput,
  citations,
  hIndex,
}: {
  scholarlyOutput: number;
  citations: number;
  hIndex: number;
}) {
  return (
    <div
      className="flex w-full items-center justify-center gap-8"
      style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 32 }}
    >
      <Metric label="Scholarly Output" value={scholarlyOutput} />
      <Divider />
      <Metric label="Citations" value={citations} />
      <Divider />
      <Metric label="h-index" value={hIndex} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="flex flex-col items-center gap-1"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
    >
      <span
        className="text-[13px] text-[#9F9F9F]"
        style={{ fontSize: 13, color: "#9F9F9F", lineHeight: 1.4, textAlign: "center" }}
      >
        {label}
      </span>
      <span
        className="text-xl font-bold text-brand-dark"
        style={{ fontSize: 20, fontWeight: 700, color: "#25324B", lineHeight: 1.35 }}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div
      className="h-10 w-px shrink-0 bg-[#D9D9D9]"
      style={{ width: 1, height: 40, flexShrink: 0, backgroundColor: "#D9D9D9" }}
    />
  );
}

export function DetailSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section style={{ width: "100%" }}>
      <div
        className="flex flex-col gap-[13px]"
        style={{ display: "flex", flexDirection: "column", gap: 13 }}
      >
        <h2
          className="text-base font-semibold leading-6 text-brand-primary"
          style={{ fontSize: 16, fontWeight: 600, lineHeight: "24px", color: "#4D5CAD", margin: 0 }}
        >
          {title}
        </h2>
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            fontSize: 20,
            lineHeight: "24px",
            color: "#25324B",
          }}
        >
          {items.map((item, index) => (
            <li key={`${title}-${index}`} style={{ marginBottom: 10 }}>
              {"  - "}
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
