"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo } from "react";
import {
  createNewsAction,
  updateNewsAction,
  type NewsActionState,
} from "@/app/admin/news/actions";
import { NewsCategoryField } from "@/components/admin/NewsCategoryField";
import { ThaiEventDateField } from "@/components/admin/ThaiEventDateField";
import type { AdminNewsRecord } from "@/lib/admin/news-types";
import { resolveNewsAttachmentUrl, resolveNewsImageSrc } from "@/lib/news-assets";

type NewsAdminFormProps = {
  mode: "create" | "edit";
  record?: AdminNewsRecord;
};

const initialState: NewsActionState = {};

function Field({
  label,
  name,
  defaultValue = "",
  required = false,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
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
        className="w-full rounded-xl border border-[#D9DEE8] px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-primary"
      />
    </label>
  );
}

export function NewsAdminForm({ mode, record }: NewsAdminFormProps) {
  const router = useRouter();
  const newsId = record?.newsId;
  const action = useMemo(
    () => (mode === "create" ? createNewsAction : updateNewsAction.bind(null, newsId!)),
    [mode, newsId],
  );
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      <Field label="ชื่อข่าว" name="title" defaultValue={record?.title} required />

      <NewsCategoryField defaultCategory={record?.category} />

      <ThaiEventDateField
        label="วันที่จัดกิจกรรม"
        name="publishedDate"
        defaultValue={record?.publishedDate}
        required
      />

      {mode === "create" ? (
        <div>
          <input type="hidden" name="displayOrder" value="1" />
          <span className="mb-2 block text-sm font-medium text-brand-dark">ลำดับการแสดง</span>
          <div className="rounded-xl border border-[#D9DEE8] bg-[#FAFBFD] px-4 py-3 text-sm text-brand-dark">
            1
          </div>
          <p className="mt-2 text-xs text-brand-muted">
            ข่าวใหม่จะแสดงเป็นอันดับ 1 ข่าวเดิมจะเลื่อนถอยหลังอัตโนมัติ
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

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-brand-dark">รายละเอียดข่าว</span>
        <textarea
          name="details"
          defaultValue={record?.details}
          required
          rows={10}
          className="w-full rounded-xl border border-[#D9DEE8] px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-primary"
        />
      </label>

      <Field
        label="ลิงก์เพิ่มเติม (ไม่บังคับ)"
        name="externalUrl"
        type="url"
        defaultValue={record?.externalUrl}
        placeholder="https://example.com/news"
      />

      <div className="rounded-2xl border border-[#E5E7EF] bg-[#FAFBFD] p-5">
        <p className="text-sm font-medium text-brand-dark">รูปภาพข่าว</p>
        {record?.imagePath ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative h-28 w-44 overflow-hidden rounded-xl bg-white">
              <Image
                src={resolveNewsImageSrc(record.imagePath) ?? ""}
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

      <div className="rounded-2xl border border-[#E5E7EF] bg-[#FAFBFD] p-5">
        <p className="text-sm font-medium text-brand-dark">ไฟล์เพิ่มเติม (ไม่บังคับ)</p>
        {record?.attachmentStoragePath ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-brand-dark">{record.attachmentFileName}</p>
              <a
                href={resolveNewsAttachmentUrl(record.attachmentStoragePath) ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-primary hover:underline"
              >
                เปิดไฟล์
              </a>
            </div>
            <label className="flex items-center gap-2 text-sm text-brand-muted">
              <input type="checkbox" name="removeAttachment" className="rounded border-[#D9DEE8]" />
              ลบไฟล์ปัจจุบัน
            </label>
          </div>
        ) : null}
        <input
          type="file"
          name="attachment"
          accept=".pdf,.doc,.docx,application/pdf,application/msword"
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
          {pending ? "กำลังบันทึก..." : mode === "create" ? "เพิ่มข่าวสาร" : "บันทึกการแก้ไข"}
        </button>
        <Link
          href="/admin/news"
          className="rounded-xl border border-[#D9DEE8] px-5 py-3 text-sm font-medium text-brand-dark transition hover:bg-[#F3F5FA]"
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}

export default NewsAdminForm;
