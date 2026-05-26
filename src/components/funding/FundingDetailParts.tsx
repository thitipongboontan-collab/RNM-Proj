import Link from "next/link";
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
      className="flex w-[200px] flex-col gap-5 rounded-[10px] bg-white px-10 py-[30px] shadow-[0px_0px_8px_2px_rgba(0,0,0,0.1)] transition hover:shadow-[0px_0px_12px_4px_rgba(0,0,0,0.12)]"
      style={{
        display: "flex",
        width: 200,
        flexDirection: "column",
        gap: 20,
        borderRadius: 10,
        backgroundColor: "#ffffff",
        padding: "30px 40px",
        boxShadow: "0px 0px 8px 2px rgba(0,0,0,0.1)",
        textDecoration: "none",
      }}
    >
      <div
        className="flex flex-col items-center gap-3"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
      >
        {file.type === "doc" ? <DocIcon /> : <PdfIcon />}
        <p
          className="text-xl leading-[165%] tracking-[0.002em] text-[#0063D5]"
          style={{ fontSize: 20, lineHeight: 1.65, color: "#0063D5", margin: 0 }}
        >
          {file.fileName}
        </p>
      </div>
    </a>
  );
}

export function DetailPagination({
  prevId,
  nextId,
}: {
  prevId?: string;
  nextId?: string;
}) {
  return (
    <div
      className="flex justify-center pt-2 text-base leading-[165%]"
      style={{
        display: "flex",
        justifyContent: "center",
        paddingTop: 8,
        fontSize: 16,
        lineHeight: 1.65,
      }}
    >
      {prevId ? (
        <Link href={`/funding/${prevId}`} className="text-black/20 hover:text-brand-primary">
          &lt; ก่อนหน้า
        </Link>
      ) : (
        <span className="text-black/20">&lt; ก่อนหน้า</span>
      )}
      <span className="mx-8" />
      {nextId ? (
        <Link href={`/funding/${nextId}`} className="text-[#0063D5] hover:underline">
          หน้าถัดไป &gt;
        </Link>
      ) : (
        <span className="text-[#0063D5]">หน้าถัดไป &gt;</span>
      )}
    </div>
  );
}

export { DownloadIcon };
