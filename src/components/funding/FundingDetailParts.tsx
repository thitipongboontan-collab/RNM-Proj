import type { FundingAttachment } from "@/data/funding";

function OrgIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 21V7l8-4 8 4v14H4Z"
        stroke="#5F5F60"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 21v-6h6v6" stroke="#5F5F60" strokeWidth="1.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="#5F5F60" strokeWidth="1.5" />
      <path d="M3 10h18M8 2v4M16 2v4" stroke="#5F5F60" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 4v16M10 14l6 6 6-6M6 26h20"
        stroke="#25324B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="35" height="35" viewBox="0 0 35 35" fill="none" aria-hidden>
      <path d="M8 2h12l8 8v22a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" fill="#1565C0" />
      <path d="M20 2v8h8" fill="#1976D2" />
      <path d="M10 18h14M10 23h14M10 28h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <path d="M8 2h14l10 10v24a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" fill="#E53935" />
      <path d="M22 2v10h10" fill="#EF5350" />
      <text x="8" y="32" fill="white" fontSize="8" fontWeight="bold">
        PDF
      </text>
    </svg>
  );
}

export function MetaItem({
  icon,
  text,
}: {
  icon: "org" | "date";
  text: string;
}) {
  return (
    <span
      className="flex items-center gap-2.5 text-lg leading-[165%] tracking-[0.002em] text-[#5F5F60]"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        fontSize: 18,
        lineHeight: 1.65,
        color: "#5F5F60",
      }}
    >
      {icon === "org" ? <OrgIcon /> : <CalendarIcon />}
      {text}
    </span>
  );
}

export function AttachmentCard({ file }: { file: FundingAttachment }) {
  return (
    <a
      href={file.downloadUrl}
      target="_blank"
      rel="noreferrer"
      download
      className="flex w-[200px] flex-col gap-5 rounded-[10px] bg-white px-6 py-[30px] shadow-[0px_0px_8px_2px_rgba(0,0,0,0.1)] transition hover:shadow-[0px_0px_12px_4px_rgba(0,0,0,0.12)]"
      title={file.fileName}
    >
      <div className="flex min-w-0 flex-col items-center gap-3">
        {file.type === "doc" ? <DocIcon /> : <PdfIcon />}
        <p
          className="m-0 w-full truncate text-center text-base leading-snug tracking-[0.002em] text-[#0063D5]"
          title={file.fileName}
        >
          {file.fileName}
        </p>
      </div>
    </a>
  );
}

export { DownloadIcon };
