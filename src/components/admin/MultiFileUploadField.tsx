"use client";

import { useEffect, useRef, useState } from "react";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function syncFileInput(input: HTMLInputElement | null, files: File[]) {
  if (!input) return;
  const dataTransfer = new DataTransfer();
  for (const file of files) {
    dataTransfer.items.add(file);
  }
  input.files = dataTransfer.files;
}

type MultiFileUploadSectionProps = {
  label: string;
  name?: string;
  accept: string;
  description?: string;
};

export function MultiFileUploadSection({
  label,
  name = "attachments",
  accept,
  description,
}: MultiFileUploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    syncFileInput(inputRef.current, files);
  }, [files]);

  function addFiles(selected: FileList | null) {
    if (!selected?.length) return;
    setFiles((current) => {
      const merged = [...current];
      for (const file of Array.from(selected)) {
        const duplicate = merged.some(
          (item) => item.name === file.name && item.size === file.size,
        );
        if (!duplicate) merged.push(file);
      }
      return merged;
    });
  }

  return (
    <div className="rounded-2xl border border-[#E5E7EF] bg-[#FAFBFD] p-5">
      <p className="text-sm font-medium text-brand-dark">{label}</p>
      {description ? <p className="mt-1 text-xs text-brand-muted">{description}</p> : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          เลือกไฟล์
        </button>
        <span className="text-xs text-brand-muted">เลือกได้หลายไฟล์พร้อมกัน</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {files.length ? (
        <ul className="mt-4 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#EEF1F6] bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-brand-dark">{file.name}</p>
                <p className="text-xs text-brand-muted">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))
                }
                className="shrink-0 rounded-lg border border-[#FECDD3] px-3 py-1.5 text-xs font-medium text-[#BE123C]"
              >
                นำออก
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-brand-muted">ยังไม่ได้เลือกไฟล์</p>
      )}
    </div>
  );
}
