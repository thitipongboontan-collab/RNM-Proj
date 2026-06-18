"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo } from "react";
import {
  createFundingAction,
  deleteFundingAttachmentAction,
  updateFundingAction,
  type FundingActionState,
} from "@/app/admin/fundings/actions";
import { MultiFileUploadSection } from "@/components/admin/MultiFileUploadField";
import { ThaiDateField } from "@/components/admin/ThaiDateField";
import type { AdminFundingRecord } from "@/lib/admin/funding-types";
import { resolveFundingDocumentUrl, resolveFundingImageSrc } from "@/lib/funding-assets";

type FundingAdminFormProps = {
  mode: "create" | "edit";
  record?: AdminFundingRecord;
  defaults?: {
    fundingCode: string;
    displayOrder: number;
  };
};

const initialState: FundingActionState = {};

function Field({
  label,
  name,
  defaultValue = "",
  required = false,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-brand-dark">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-xl border border-[#D9DEE8] px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-primary"
      />
    </label>
  );
}

export function FundingAdminForm({ mode, record, defaults }: FundingAdminFormProps) {
  const router = useRouter();
  const fundingId = record?.fundingId;
  const action = useMemo(
    () =>
      mode === "create"
        ? createFundingAction
        : updateFundingAction.bind(null, fundingId!),
    [mode, fundingId],
  );
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
      return;
    }
    if (state.success) {
      router.refresh();
    }
  }, [state.redirectTo, state.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="รหัสอ้างอิง (Funding Code)" name="fundingCode" defaultValue={record?.fundingCode ?? defaults?.fundingCode} required />
        {mode === "create" ? (
          <div>
            <input type="hidden" name="displayOrder" value="1" />
            <span className="mb-2 block text-sm font-medium text-brand-dark">ลำดับการแสดง</span>
            <div className="rounded-xl border border-[#D9DEE8] bg-[#FAFBFD] px-4 py-3 text-sm text-brand-dark">
              1
            </div>
            <p className="mt-2 text-xs text-brand-muted">
              ทุนใหม่จะแสดงเป็นอันดับ 1 ทุนเดิมจะเลื่อนถอยหลังอัตโนมัติ
            </p>
          </div>
        ) : (
          <Field
            label="ลำดับการแสดง"
            name="displayOrder"
            type="number"
            defaultValue={String(record?.displayOrder ?? 0)}
            required
          />
        )}
      </div>

      <Field label="ชื่อทุน (สั้น)" name="title" defaultValue={record?.title} required />
      <Field label="ชื่อทุน (เต็ม)" name="fullTitle" defaultValue={record?.fullTitle} />
      <Field label="หน่วยงาน" name="organization" defaultValue={record?.organization} required />
      <Field label="สถานะ" name="statusLabel" defaultValue={record?.statusLabel ?? "ทุนวิจัยที่เปิดรับ"} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ThaiDateField label="วันที่ประกาศทุน" name="publishedDate" defaultValue={record?.publishedDate} required />
        <ThaiDateField label="วันเปิดรับ" name="openDate" defaultValue={record?.openDate} required />
        <ThaiDateField label="วันปิดรับ" name="closeDate" defaultValue={record?.closeDate} required />
      </div>

      <Field label="ลิงก์ต้นทาง" name="sourceUrl" defaultValue={record?.sourceUrl} />

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-brand-dark">รายละเอียดทุน</span>
        <textarea
          name="details"
          defaultValue={record?.details}
          required
          rows={12}
          className="w-full rounded-xl border border-[#D9DEE8] px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-primary"
        />
      </label>

      <div className="rounded-2xl border border-[#E5E7EF] bg-[#FAFBFD] p-5">
        <p className="text-sm font-medium text-brand-dark">รูปภาพปก</p>
        {record?.imagePath ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative h-28 w-44 overflow-hidden rounded-xl bg-white">
              <Image
                src={resolveFundingImageSrc(record.imagePath) ?? ""}
                alt={record.title}
                fill
                className="object-cover"
                unoptimized={record.imagePath.startsWith("http")}
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

      {mode === "edit" && record?.attachments.length ? (
        <div className="rounded-2xl border border-[#E5E7EF] bg-white p-5">
          <p className="text-sm font-medium text-brand-dark">ไฟล์แนบปัจจุบัน</p>
          <ul className="mt-3 space-y-2">
            {record.attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex flex-col gap-2 rounded-xl border border-[#EEF1F6] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-brand-dark">{attachment.fileName}</p>
                  <a
                    href={resolveFundingDocumentUrl(attachment.storagePath)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-primary hover:underline"
                  >
                    เปิดไฟล์
                  </a>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-[#FECDD3] px-3 py-1.5 text-xs font-medium text-[#BE123C]"
                  onClick={async () => {
                    if (!confirm(`ลบไฟล์ ${attachment.fileName}?`)) return;
                    await deleteFundingAttachmentAction(record.fundingId, attachment.id);
                    router.refresh();
                  }}
                >
                  ลบไฟล์
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <MultiFileUploadSection
        label="เพิ่มไฟล์แนบ (PDF/DOC)"
        accept=".pdf,.doc,.docx,application/pdf,application/msword"
        description="สามารถเลือกหลายไฟล์ในครั้งเดียว หรือกดเลือกไฟล์ซ้ำเพื่อเพิ่มอีก"
      />

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
          {pending ? "กำลังบันทึก..." : mode === "create" ? "เพิ่มแหล่งทุน" : "บันทึกการแก้ไข"}
        </button>
        <Link
          href="/admin/fundings"
          className="rounded-xl border border-[#D9DEE8] px-5 py-3 text-sm font-medium text-brand-dark transition hover:bg-[#F3F5FA]"
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}

export default FundingAdminForm;
