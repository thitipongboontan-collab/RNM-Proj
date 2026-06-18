import {
  completeFundingAttachmentUploadAction,
  prepareFundingAttachmentUploadAction,
} from "@/app/admin/fundings/actions";

export async function uploadFundingAttachmentsClient(
  fundingId: string,
  files: File[],
  startOrder: number,
): Promise<void> {
  for (const [index, file] of files.entries()) {
    const fileOrder = startOrder + index + 1;
    const prepared = await prepareFundingAttachmentUploadAction(
      fundingId,
      file.name,
      fileOrder,
    );

    const uploadResponse = await fetch(prepared.signedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`อัปโหลดไฟล์ "${file.name}" ไม่สำเร็จ (${uploadResponse.status})`);
    }

    await completeFundingAttachmentUploadAction(fundingId, {
      storagePath: prepared.storagePath,
      fileName: prepared.fileName,
      fileType: prepared.fileType,
      fileOrder: prepared.fileOrder,
    });
  }
}
