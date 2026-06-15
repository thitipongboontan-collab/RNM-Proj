"use client";

import { useMemo, useState } from "react";
import { NEWS_CATEGORY_PRESETS } from "@/data/research-news";

type NewsCategoryFieldProps = {
  defaultCategory?: string;
};

export function NewsCategoryField({ defaultCategory = "" }: NewsCategoryFieldProps) {
  const initialPreset = useMemo(() => {
    if (!defaultCategory) return "";
    if ((NEWS_CATEGORY_PRESETS as readonly string[]).includes(defaultCategory)) {
      return defaultCategory;
    }
    return "__custom__";
  }, [defaultCategory]);

  const [preset, setPreset] = useState(initialPreset);
  const [customCategory, setCustomCategory] = useState(
    initialPreset === "__custom__" ? defaultCategory : "",
  );

  return (
    <div className="block space-y-3">
      <span className="mb-2 block text-sm font-medium text-brand-dark">หมวดหมู่</span>
      <select
        name="categoryPreset"
        value={preset}
        onChange={(event) => setPreset(event.target.value)}
        className="w-full rounded-xl border border-[#D9DEE8] px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-primary"
      >
        <option value="">-- เลือกหมวดหมู่ --</option>
        {NEWS_CATEGORY_PRESETS.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
        <option value="__custom__">เพิ่มหมวดหมู่เอง</option>
      </select>

      {preset === "__custom__" ? (
        <input
          name="customCategory"
          value={customCategory}
          onChange={(event) => setCustomCategory(event.target.value)}
          placeholder="ระบุหมวดหมู่เอง"
          className="w-full rounded-xl border border-[#D9DEE8] px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-primary"
        />
      ) : (
        <input type="hidden" name="customCategory" value="" />
      )}

      <p className="text-xs text-brand-muted">
        เลือกจากรายการ หรือเลือก &quot;เพิ่มหมวดหมู่เอง&quot; เพื่อกรอกหมวดหมู่ใหม่
      </p>
    </div>
  );
}
