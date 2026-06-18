"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ImagePositionField } from "@/components/admin/ImagePositionField";
import { resolveImagePositionCss } from "@/lib/image-position";

type CoverImageFieldProps = {
  label: string;
  description: string;
  existingImageSrc?: string;
  defaultImagePosition?: string;
  removeImageName?: string;
  showRemoveCheckbox?: boolean;
  imageAlt?: string;
};

export function CoverImageField({
  label,
  description,
  existingImageSrc,
  defaultImagePosition = "50% 50%",
  removeImageName = "removeImage",
  showRemoveCheckbox = false,
  imageAlt = "รูปหลัก",
}: CoverImageFieldProps) {
  const [previewSrc, setPreviewSrc] = useState(existingImageSrc);
  const [imagePosition, setImagePosition] = useState(defaultImagePosition);

  useEffect(() => {
    setPreviewSrc(existingImageSrc);
  }, [existingImageSrc]);

  useEffect(() => {
    setImagePosition(defaultImagePosition);
  }, [defaultImagePosition]);

  return (
    <div className="rounded-2xl border border-[#E5E7EF] bg-[#FAFBFD] p-5">
      <p className="text-sm font-medium text-brand-dark">{label}</p>
      <p className="mt-1 text-xs text-brand-muted">{description}</p>

      {previewSrc ? (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative h-28 w-44 overflow-hidden rounded-xl bg-white">
            <Image
              src={previewSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              style={{ objectPosition: resolveImagePositionCss(imagePosition) }}
              unoptimized={
                previewSrc.startsWith("http") || previewSrc.startsWith("blob:")
              }
            />
          </div>
          {showRemoveCheckbox ? (
            <label className="flex items-center gap-2 text-sm text-brand-muted">
              <input type="checkbox" name={removeImageName} className="rounded border-[#D9DEE8]" />
              ลบรูปปัจจุบัน
            </label>
          ) : null}
        </div>
      ) : null}

      <input
        type="file"
        name="image"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="mt-3 block w-full text-sm text-brand-muted file:mr-4 file:rounded-lg file:border-0 file:bg-brand-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setPreviewSrc(URL.createObjectURL(file));
        }}
      />

      <ImagePositionField
        defaultValue={defaultImagePosition}
        previewSrc={previewSrc}
        previewAlt={imageAlt}
        onPositionChange={setImagePosition}
      />
    </div>
  );
}
