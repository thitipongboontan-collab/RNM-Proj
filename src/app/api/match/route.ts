import { NextResponse } from "next/server";
import { getResearcherMatchResult } from "@/lib/match-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const researcherId = searchParams.get("researcherId")?.trim().toUpperCase();

  if (!researcherId) {
    return NextResponse.json({ error: "กรุณาระบุ researcherId" }, { status: 400 });
  }

  const result = await getResearcherMatchResult(researcherId);
  if (!result) {
    return NextResponse.json({ error: "ไม่พบนักวิจัย" }, { status: 404 });
  }

  return NextResponse.json(result);
}
