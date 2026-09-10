import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const locale = req.nextUrl.searchParams.get("locale") ?? "zh-CN";
  return NextResponse.json(search(q, locale), {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
  });
}
