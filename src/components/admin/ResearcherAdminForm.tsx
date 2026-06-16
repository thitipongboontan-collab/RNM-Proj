"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo } from "react";
import {
  createResearcherAction,
  updateResearcherAction,
  type ResearcherActionState,
} from "@/app/admin/researchers/actions";
import { ResearcherDepartmentField } from "@/components/admin/ResearcherDepartmentField";
import type { AdminResearcherRecord } from "@/lib/admin/researcher-types";
import { resolveResearcherImageUrl } from "@/lib/researcher-image-url";

type ResearcherAdminFormProps = {
  mode: "create" | "edit";
  record?: AdminResearcherRecord;
  previewImageSrc?: string;
};

const initialState: ResearcherActionState = {};

function Field({
  label,
  name,
  defaultValue = "",
  required = false,
  type = "text",
  placeholder,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-brand-dark">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        step={step}
        className="w-full rounded-xl border border-[#D9DEE8] px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-primary"
      />
    </label>
  );
}

function TextAreaField({
  label,
  name,
  defaultValue = "",
  rows = 4,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-brand-dark">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="w-full rounded-xl border border-[#D9DEE8] px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-primary"
      />
      {hint ? <p className="mt-2 text-xs text-brand-muted">{hint}</p> : null}
    </label>
  );
}

export function ResearcherAdminForm({ mode, record, previewImageSrc }: ResearcherAdminFormProps) {
  const router = useRouter();
  const researcherId = record?.researcherId;
  const action = useMemo(
    () =>
      mode === "create"
        ? createResearcherAction
        : updateResearcherAction.bind(null, researcherId!),
    [mode, researcherId],
  );
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  const imageSrc =
    previewImageSrc ??
    (record ? resolveResearcherImageUrl(record.researcherId, record.imagePath) : undefined);

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && record ? (
        <div>
          <span className="mb-2 block text-sm font-medium text-brand-dark">รหัสนักวิจัย</span>
          <div className="rounded-xl border border-[#D9DEE8] bg-[#FAFBFD] px-4 py-3 text-sm text-brand-dark">
            {record.researcherId}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ชื่อภาษาไทย" name="nameTh" defaultValue={record?.nameTh} required />
        <Field label="ชื่อภาษาอังกฤษ" name="nameEn" defaultValue={record?.nameEn} />
      </div>

      <ResearcherDepartmentField defaultDepartment={record?.department} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="อีเมล" name="email" type="email" defaultValue={record?.email} />
        <Field label="เบอร์โทร" name="phone" defaultValue={record?.phone} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Scholarly Output"
          name="scholarlyOutput"
          type="number"
          defaultValue={String(record?.scholarlyOutput ?? 0)}
        />
        <Field
          label="Citations"
          name="citations"
          type="number"
          defaultValue={String(record?.citations ?? 0)}
        />
        <Field
          label="h-index"
          name="hIndex"
          type="number"
          defaultValue={String(record?.hIndex ?? 0)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="ปีตีพิมพ์ล่าสุด"
          name="mostRecentPublicationYear"
          type="number"
          defaultValue={
            record?.mostRecentPublicationYear != null
              ? String(record.mostRecentPublicationYear)
              : ""
          }
        />
        <Field
          label="Citations/Publication"
          name="citationsPerPublication"
          type="number"
          step="0.01"
          defaultValue={
            record?.citationsPerPublication != null
              ? String(record.citationsPerPublication)
              : ""
          }
        />
        <Field
          label="Field-Weighted Citation Impact"
          name="fieldWeightedCitationImpact"
          type="number"
          step="0.01"
          defaultValue={
            record?.fieldWeightedCitationImpact != null
              ? String(record.fieldWeightedCitationImpact)
              : ""
          }
        />
      </div>

      <TextAreaField
        label="วุฒิการศึกษา"
        name="educationText"
        defaultValue={record?.education.join("\n") ?? ""}
        rows={4}
        hint="หนึ่งบรรทัดต่อหนึ่งวุฒิ"
      />

      <TextAreaField
        label="ความเชี่ยวชาญ"
        name="expertiseText"
        defaultValue={record?.expertise.join("\n") ?? ""}
        rows={4}
        hint="หนึ่งบรรทัดต่อหนึ่งรายการ"
      />

      <TextAreaField
        label="คำสำคัญ (ภาษาอังกฤษ)"
        name="keywordsEnText"
        defaultValue={record?.keywordsEn.join("\n") ?? ""}
        rows={3}
        hint="หนึ่งบรรทัดต่อหนึ่งคำสำคัญ"
      />

      <TextAreaField
        label="คำสำคัญ (ภาษาไทย)"
        name="keywordsThText"
        defaultValue={record?.keywordsTh.join("\n") ?? ""}
        rows={3}
        hint="หนึ่งบรรทัดต่อหนึ่งคำสำคัญ"
      />

      <TextAreaField
        label="หน่วยงานที่ร่วมวิจัย"
        name="collaborationsText"
        defaultValue={record?.collaborations.join("\n") ?? ""}
        rows={3}
        hint="หนึ่งบรรทัดต่อหนึ่งหน่วยงาน"
      />

      <div className="rounded-2xl border border-[#E5E7EF] bg-[#FAFBFD] p-5">
        <p className="text-sm font-medium text-brand-dark">รูปโปรไฟล์</p>
        {imageSrc ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-full bg-white">
              <Image
                src={imageSrc}
                alt={record?.nameTh ?? "รูปโปรไฟล์"}
                fill
                className="object-cover"
                unoptimized={record?.imagePath?.startsWith("http") ?? false}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-brand-muted">
              <input type="checkbox" name="removeImage" className="rounded border-[#D9DEE8]" />
              ลบรูปปัจจุบัน
            </label>
          </div>
        ) : null}
        <input
          type="file"
          name="image"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="mt-3 block w-full text-sm text-brand-muted file:mr-4 file:rounded-lg file:border-0 file:bg-brand-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        />
      </div>

      {state.error ? (
        <p className="rounded-xl bg-[#FFF1F2] px-4 py-3 text-sm text-[#BE123C]">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-[#ECFDF5] px-4 py-3 text-sm text-[#047857]">{state.success}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก..." : mode === "create" ? "เพิ่มนักวิจัย" : "บันทึกการแก้ไข"}
        </button>
        <Link
          href="/admin/researchers"
          className="rounded-xl border border-[#D9DEE8] px-5 py-3 text-sm font-medium text-brand-dark transition hover:bg-[#F3F5FA]"
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}

export default ResearcherAdminForm;
