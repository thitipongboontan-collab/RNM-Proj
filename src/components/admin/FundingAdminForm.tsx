"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import {
  createFundingAction,
  deleteFundingAttachmentAction,
  deleteFundingDetailImageAction,
  updateFundingAction,
} from "@/app/admin/fundings/actions";
import { CoverImageField } from "@/components/admin/CoverImageField";
import {
  MultiFileUploadSection,
  type MultiFileUploadHandle,
} from "@/components/admin/MultiFileUploadField";
import { ThaiDateField } from "@/components/admin/ThaiDateField";
import { uploadFundingAttachmentsClient } from "@/lib/admin/funding-client-upload";
import { uploadFundingDetailImagesClient } from "@/lib/admin/funding-detail-image-client-upload";
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
  const attachmentsRef = useRef<MultiFileUploadHandle>(null);
  const detailImagesRef = useRef<MultiFileUploadHandle>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const attachmentFiles = attachmentsRef.current?.getFiles() ?? [];
    const detailImageFiles = detailImagesRef.current?.getFiles() ?? [];

    try {
      if (mode === "create") {
        const result = await createFundingAction({}, formData);
        if (result.error) {
          setStatusMessage({ type: "error", text: result.error });
          return;
        }

        if (result.fundingId) {
          if (attachmentFiles.length > 0) {
            await uploadFundingAttachmentsClient(result.fundingId, attachmentFiles, 0);
            attachmentsRef.current?.clearFiles();
          }
          if (detailImageFiles.length > 0) {
            await uploadFundingDetailImagesClient(result.fundingId, detailImageFiles, 0);
            detailImagesRef.current?.clearFiles();
          }
        }

        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
        return;
      }

      const result = await updateFundingAction(fundingId!, {}, formData);
      if (result.error) {
        setStatusMessage({ type: "error", text: result.error });
        return;
      }

      if (attachmentFiles.length > 0) {
        const startOrder =
          record?.attachments.reduce((max, item) => Math.max(max, item.fileOrder), 0) ?? 0;
        await uploadFundingAttachmentsClient(fundingId!, attachmentFiles, startOrder);
        attachmentsRef.current?.clearFiles();
      }

      if (detailImageFiles.length > 0) {
        const startOrder =
          record?.detailImages.reduce((max, item) => Math.max(max, item.imageOrder), 0) ?? 0;
        await uploadFundingDetailImagesClient(fundingId!, detailImageFiles, startOrder);
        detailImagesRef.current?.clearFiles();
      }

      setStatusMessage({
        type: "success",
        text: result.success ?? "บันทึกแหล่งทุนเรียบร้อยแล้ว",
      });
      router.refresh();
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : "ไม่สามารถบันทึกแหล่งทุนได้",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
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

      <CoverImageField
        label="รูปภาพปก (รูปหลัก)"
        description="ใช้แสดงในการ์ดรายการและด้านบนของหน้ารายละเอียด"
        existingImageSrc={record?.imagePath ? resolveFundingImageSrc(record.imagePath) : undefined}
        defaultImagePosition={record?.imagePosition ?? "50% 50%"}
        showRemoveCheckbox={Boolean(record?.imagePath)}
        imageAlt={record?.title ?? "รูปภาพปกทุน"}
      />

      {mode === "edit" && record?.detailImages.length ? (
        <div className="rounded-2xl border border-[#E5E7EF] bg-white p-5">
          <p className="text-sm font-medium text-brand-dark">รูปภาพย่อยในหน้ารายละเอียด (ปัจจุบัน)</p>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {record.detailImages.map((image) => (
              <li
                key={image.id}
                className="flex flex-col gap-2 rounded-xl border border-[#EEF1F6] p-2"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#FAFBFD]">
                  <Image
                    src={resolveFundingImageSrc(image.storagePath) ?? ""}
                    alt="รูปภาพย่อย"
                    fill
                    className="object-cover"
                    unoptimized={image.storagePath.startsWith("http")}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-[#FECDD3] px-3 py-1.5 text-xs font-medium text-[#BE123C]"
                  onClick={async () => {
                    if (!confirm("ลบรูปภาพนี้?")) return;
                    await deleteFundingDetailImageAction(record.fundingId, image.id);
                    router.refresh();
                  }}
                >
                  ลบรูป
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <MultiFileUploadSection
        ref={detailImagesRef}
        label="เพิ่มรูปภาพย่อยในหน้ารายละเอียด"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        description="รูปเหล่านี้จะแสดงในส่วนรายละเอียดเท่านั้น ไม่กระทบรูปปกหลัก"
      />

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
        ref={attachmentsRef}
        label="เพิ่มไฟล์แนบ (PDF/DOC)"
        accept=".pdf,.doc,.docx,application/pdf,application/msword"
        description="สามารถเลือกหลายไฟล์ในครั้งเดียว หรือกดเลือกไฟล์ซ้ำเพื่อเพิ่มอีก"
      />

      {statusMessage?.type === "error" ? (
        <p className="rounded-xl bg-[#FFF1F2] px-4 py-3 text-sm text-[#BE123C]">{statusMessage.text}</p>
      ) : null}
      {statusMessage?.type === "success" ? (
        <p className="rounded-xl bg-[#ECFDF5] px-4 py-3 text-sm text-[#047857]">{statusMessage.text}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "กำลังบันทึก..." : mode === "create" ? "เพิ่มแหล่งทุน" : "บันทึกการแก้ไข"}
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
