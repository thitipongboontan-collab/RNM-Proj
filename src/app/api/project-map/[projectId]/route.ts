import { NextResponse } from "next/server";
import { getProjectMapDetail } from "@/lib/project-map/repository";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await context.params;
  const id = projectId?.trim();
  if (!id) {
    return NextResponse.json({ error: "กรุณาระบุ projectId" }, { status: 400 });
  }

  try {
    const detail = await getProjectMapDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "ไม่พบโครงการ" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "โหลดรายละเอียดโครงการไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
