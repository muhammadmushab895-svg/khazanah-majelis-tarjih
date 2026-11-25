import { NextRequest, NextResponse } from "next/server";
import { getDokumenPdfById } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const docId = req.nextUrl.searchParams.get("doc")?.trim();
  if (!docId) {
    return NextResponse.json(
      { error: "Parameter doc wajib diisi." },
      { status: 400 }
    );
  }

  const pdfDoc = getDokumenPdfById(docId);
  if (!pdfDoc) {
    return NextResponse.json(
      { error: "Dokumen PDF tidak ditemukan di katalog." },
      { status: 404 }
    );
  }

  const upstreamHeaders = new Headers({
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  });

  const rangeHeader = req.headers.get("range");
  if (rangeHeader) {
    upstreamHeaders.set("Range", rangeHeader);
  }

  try {
    let upstream: Response | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);
      try {
        upstream = await fetch(pdfDoc.url_pdf, {
          headers: upstreamHeaders,
          redirect: "follow",
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (upstream.ok || upstream.status === 206 || upstream.status < 500) {
          break;
        }
      } catch (err) {
        clearTimeout(timer);
        lastErr = err;
      }
    }

    if (!upstream) {
      throw lastErr || new Error("Upstream unreachable");
    }

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: `Sumber PDF merespons status ${upstream.status}.` },
        { status: 502 }
      );
    }

    const resHeaders = new Headers();
    resHeaders.set(
      "Content-Type",
      upstream.headers.get("content-type") || "application/pdf"
    );
    resHeaders.set(
      "Content-Disposition",
      `inline; filename="${pdfDoc.id}.pdf"`
    );
    resHeaders.set(
      "Accept-Ranges",
      upstream.headers.get("accept-ranges") || "bytes"
    );
    resHeaders.set("Cache-Control", "public, max-age=3600, s-maxage=86400");

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) resHeaders.set("Content-Length", contentLength);

    const contentRange = upstream.headers.get("content-range");
    if (contentRange) resHeaders.set("Content-Range", contentRange);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal mengalirkan dokumen PDF dari sumber online." },
      { status: 502 }
    );
  }
}
