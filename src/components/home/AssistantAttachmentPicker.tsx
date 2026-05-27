"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  parseAssistantAttachment,
  attachmentKindLabel,
  type PendingAttachment,
} from "@/lib/assistant-attachments";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,.txt,.csv,.md,.json,.sql,.pdf,.doc,.docx,text/plain,text/csv,text/markdown,application/json,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type AssistantAttachmentPickerProps = {
  disabled?: boolean;
  attachments: PendingAttachment[];
  onChange: (attachments: PendingAttachment[]) => void;
  onError: (message: string) => void;
};

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M9 4V14M4 9H14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M10.5 4.5 5.8 9.2a2.2 2.2 0 0 0 3.1 3.1l5.4-5.4a3.1 3.1 0 0 0-4.4-4.4L4.5 7.8a4.4 4.4 0 1 0 6.2 6.2l5.7-5.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AssistantAttachmentPicker({
  disabled,
  attachments,
  onChange,
  onError,
}: AssistantAttachmentPickerProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (!menuOpen || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 8, left: rect.left });
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setMenuOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList?.length) return;

    const next = [...attachments];
    const maxTotal = 3;

    for (const file of Array.from(fileList)) {
      if (next.length >= maxTotal) {
        onError("You can attach up to 3 files per message");
        break;
      }

      try {
        const parsed = await parseAssistantAttachment(file);
        next.push(parsed);
      } catch (error) {
        onError(error instanceof Error ? error.message : "ไม่สามารถแนบไฟล์ได้");
      }
    }

    onChange(next);
    setMenuOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(event) => void handleFilesSelected(event.target.files)}
      />

      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-label="Add photos and files"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#5D5D5D] transition hover:bg-[#F4F4F4] disabled:opacity-50"
      >
        <PlusIcon />
      </button>

      {menuOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: menuPosition.top, left: menuPosition.left }}
            className="fixed z-[10001] min-w-[240px] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white py-1.5 shadow-[0px_8px_28px_rgba(0,0,0,0.12)]"
          >
            <button
              type="button"
              disabled={disabled || attachments.length >= 3}
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] text-[#0D0D0D] transition hover:bg-[#F7F7F8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-[#5D5D5D]">
                <PaperclipIcon />
              </span>
              Add photos &amp; files
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

export function AssistantPendingAttachments({
  attachments,
  onRemove,
}: {
  attachments: PendingAttachment[];
  onRemove: (id: string) => void;
}) {
  if (!attachments.length) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-2 px-1">
      {attachments.map((item) => (
        <div
          key={item.id}
          className="flex max-w-full items-center gap-2 rounded-full border border-[#E0E6F0] bg-[#F7F9FC] py-1 pl-1 pr-2"
        >
          {item.kind === "image" && item.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.previewUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-brand-primary">
              {attachmentKindLabel(item.name, item.kind)}
            </span>
          )}
          <span className="max-w-[160px] truncate text-xs text-brand-dark">{item.name}</span>
          <button
            type="button"
            aria-label={`ลบ ${item.name}`}
            onClick={() => onRemove(item.id)}
            className="flex h-5 w-5 items-center justify-center rounded-full text-[#9F9F9F] hover:bg-white hover:text-brand-dark"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function AssistantAttachmentPreview({
  attachments,
}: {
  attachments: { name: string; previewUrl?: string; kind: "image" | "text" | "document" }[];
}) {
  if (!attachments.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((item) => (
        <div
          key={item.name}
          className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#FAFBFD] px-2 py-1.5"
        >
          {item.kind === "image" && item.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.previewUrl} alt="" className="h-8 w-8 rounded object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded bg-white text-[10px] font-semibold text-brand-primary">
              {attachmentKindLabel(item.name, item.kind)}
            </span>
          )}
          <span className="max-w-[180px] truncate text-xs text-[#778097]">{item.name}</span>
        </div>
      ))}
    </div>
  );
}
