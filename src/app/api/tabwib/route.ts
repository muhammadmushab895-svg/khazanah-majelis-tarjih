import { NextResponse } from "next/server";
import { getCatalogStats, getTabwibTree } from "@/lib/catalog";

export async function GET() {
  return NextResponse.json(
    {
      tree: getTabwibTree(),
      stats: getCatalogStats(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
