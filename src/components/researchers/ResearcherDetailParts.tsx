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
    <div className="flex w-full flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-[10px]">
      {email && (
        <span className="inline-flex max-w-full items-center gap-1 break-all text-sm text-[#5F5F60]">
          <EmailIcon />
          {email}
        </span>
      )}
      {phone && (
        <span className="inline-flex items-center gap-1 text-sm text-[#5F5F60]">
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
    <div className="flex w-full flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8">
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
    <div className="flex min-w-[72px] flex-col items-center gap-1 sm:min-w-0">
      <span className="text-center text-xs leading-snug text-[#9F9F9F] sm:text-[13px]">
        {label}
      </span>
      <span className="text-lg font-bold text-brand-dark sm:text-xl">
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="hidden h-10 w-px shrink-0 bg-[#D9D9D9] sm:block" aria-hidden />;
}

function SectionAccent() {
  return <div className="hidden w-px shrink-0 self-stretch bg-[#D9D9D9] sm:block" aria-hidden />;
}

export function DetailSection({
  title,
  items,
  bulletStyle = "dash",
  variant = "default",
}: {
  title: string;
  items: string[];
  bulletStyle?: "dash" | "disc";
  variant?: "default" | "card";
}) {
  if (!items.length) return null;

  const listClassName =
    bulletStyle === "disc"
      ? variant === "card"
        ? "m-0 list-disc space-y-2 pl-5 text-sm leading-[22px] text-brand-dark marker:text-brand-dark sm:text-base"
        : "m-0 list-disc space-y-2 pl-5 text-base leading-6 text-brand-dark marker:text-brand-dark sm:space-y-2.5 sm:text-lg lg:text-xl"
      : variant === "card"
        ? "m-0 list-none space-y-2 p-0 text-sm leading-[22px] text-brand-dark sm:text-base"
        : "m-0 list-none p-0 text-base leading-6 text-brand-dark sm:text-lg lg:text-xl";

  const listContent =
    bulletStyle === "disc" ? (
      <ul className={listClassName}>
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="pl-1">
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <ul className={listClassName}>
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className={variant === "card" ? "" : "mb-2 last:mb-0 sm:mb-[10px]"}>
            {variant === "card" ? item : <>{"  - "}{item}</>}
          </li>
        ))}
      </ul>
    );

  if (variant === "card") {
    return (
      <section className="w-full rounded-[16px] border border-[#E5E7EB] bg-[#FAFBFD] px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="mb-3 m-0 text-base font-semibold leading-6 text-brand-primary">{title}</h2>
        {listContent}
      </section>
    );
  }

  return (
    <section className="flex w-full items-stretch gap-4 sm:gap-[27px]">
      <SectionAccent />
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-[13px]">
        <h2 className="m-0 text-base font-semibold leading-6 text-brand-primary">{title}</h2>
        {listContent}
      </div>
    </section>
  );
}
