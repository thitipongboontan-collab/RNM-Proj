"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type MultiFileUploadHandle = {
  getFiles: () => File[];
  clearFiles: () => void;
};

type MultiFileUploadSectionProps = {
  label: string;
  accept: string;
  description?: string;
};

export const MultiFileUploadSection = forwardRef<MultiFileUploadHandle, MultiFileUploadSectionProps>(
  function MultiFileUploadSection({ label, accept, description }, ref) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);

    useImperativeHandle(ref, () => ({
      getFiles: () => files,
      clearFiles: () => setFiles([]),
    }));

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
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
        <p className="mt-1 text-xs text-brand-muted">
          ไฟล์แนบจะอัปโหลดตรงไป Supabase Storage (รองรับไฟล์ขนาดใหญ่)
        </p>

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
  },
);
