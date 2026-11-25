import { NextRequest, NextResponse } from "next/server";
import { getItemById } from "@/lib/catalog";
import { fetchLiveTarjihArticle } from "@/lib/reader";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, error_reason: "Parameter id wajib diisi." },
      { status: 400 }
    );
  }

  const item = getItemById(id);
  if (!item) {
    return NextResponse.json(
      { ok: false, error_reason: "Pembahasan tidak ditemukan di katalog." },
      { status: 404 }
    );
  }

  const data = await fetchLiveTarjihArticle(item);

  return NextResponse.json(data, {
    status: 200,
    headers: {
      "Cache-Control": data.ok
        ? "public, s-maxage=1800, stale-while-revalidate=3600"
        : "no-store",
    },
  });
}
