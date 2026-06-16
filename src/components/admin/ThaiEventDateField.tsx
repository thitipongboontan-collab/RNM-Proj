"use client";

import { useId, useRef, useState } from "react";
import {
  formatIsoToThaiAbbreviatedDate,
  formatThaiEventDateRange,
  parseThaiEventDateText,
} from "@/lib/thai-date";

type ThaiEventDateFieldProps = {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
};

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3V5M17 3V5M4 9H20M5 7H19C19.5523 7 20 7.44772 20 8V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V8C4 7.44772 4.44772 7 5 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DatePickerRow({
  label,
  isoValue,
  onChange,
  placeholder,
}: {
  label: string;
  isoValue: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const inputId = useId();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const thaiValue = isoValue ? formatIsoToThaiAbbreviatedDate(isoValue) : "";

  function openPicker() {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
    input.click();
  }

  return (
    <div>
      <span className="mb-2 block text-xs font-medium text-brand-muted">{label}</span>
      <input
        id={inputId}
        ref={dateInputRef}
        type="date"
        value={isoValue}
        onChange={(event) => onChange(event.target.value)}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
      />
      <div className="flex items-stretch gap-2">
        <div
          className={`min-w-0 flex-1 rounded-xl border border-[#D9DEE8] px-4 py-3 text-sm ${
            thaiValue ? "text-brand-dark" : "text-brand-muted"
          }`}
        >
          {thaiValue || placeholder}
        </div>
        <button
          type="button"
          onClick={openPicker}
          aria-label={`เลือก${label}`}
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[#D9DEE8] bg-white px-3 py-3 text-brand-primary transition hover:bg-[#F3F5FA]"
        >
          <CalendarIcon />
        </button>
      </div>
    </div>
  );
}

export function ThaiEventDateField({
  label,
  name,
  defaultValue = "",
  required = false,
}: ThaiEventDateFieldProps) {
  const parsed = parseThaiEventDateText(defaultValue);
  const [startIso, setStartIso] = useState(parsed.startIso);
  const [endIso, setEndIso] = useState(parsed.endIso ?? "");
  const [useRange, setUseRange] = useState(Boolean(parsed.endIso));
  const storedValue = formatThaiEventDateRange(startIso, useRange && endIso ? endIso : undefined);

  return (
    <div className="block">
      <span className="mb-2 block text-sm font-medium text-brand-dark">{label}</span>
      <input type="hidden" name={name} value={storedValue} required={required} />

      <div className="space-y-4 rounded-2xl border border-[#E5E7EF] bg-[#FAFBFD] p-4">
        <DatePickerRow
          label="วันเริ่มกิจกรรม"
          isoValue={startIso}
          onChange={setStartIso}
          placeholder="ยังไม่ได้เลือกวันที่"
        />

        <label className="flex items-center gap-2 text-sm text-brand-dark">
          <input
            type="checkbox"
            checked={useRange}
            onChange={(event) => {
              setUseRange(event.target.checked);
              if (!event.target.checked) setEndIso("");
            }}
            className="rounded border-[#D9DEE8]"
          />
          ระบุช่วงวันที่ (หลายวัน)
        </label>

        {useRange ? (
          <DatePickerRow
            label="วันสิ้นสุดกิจกรรม"
            isoValue={endIso}
            onChange={setEndIso}
            placeholder="ยังไม่ได้เลือกวันสิ้นสุด"
          />
        ) : null}

        {storedValue ? (
          <p className="text-xs text-brand-muted">
            จะแสดงเป็น: <span className="font-medium text-brand-dark">{storedValue}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
