import {
  completeFundingDetailImageUploadAction,
  prepareFundingDetailImageUploadAction,
} from "@/app/admin/fundings/actions";

export async function uploadFundingDetailImagesClient(
  fundingId: string,
  files: File[],
  startOrder: number,
): Promise<void> {
  for (const [index, file] of files.entries()) {
    const imageOrder = startOrder + index + 1;
    const prepared = await prepareFundingDetailImageUploadAction(
      fundingId,
      file.name,
      imageOrder,
    );

    const uploadResponse = await fetch(prepared.signedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`อัปโหลดรูป "${file.name}" ไม่สำเร็จ (${uploadResponse.status})`);
    }

    await completeFundingDetailImageUploadAction(fundingId, {
      storagePath: prepared.storagePath,
      imageOrder: prepared.imageOrder,
    });
  }
}
