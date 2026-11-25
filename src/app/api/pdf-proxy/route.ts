import { NextRequest, NextResponse } from "next/server";
import { getDokumenPdfById } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface MetaCacheEntry {
  length: number;
  acceptRanges: boolean;
  contentType: string;
  expiresAt: number;
}

const META_TTL_MS = 30 * 60 * 1000;
const metaCache = new Map<string, MetaCacheEntry>();

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  timeoutMs = 22000
): Promise<Response> {
  let lastErr: unknown = null;
  let lastRes: Response | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timer);
      lastRes = res;
      if (res.ok || res.status === 206 || res.status < 500) {
        return res;
      }
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
    }
  }
  if (lastRes) return lastRes;
  throw lastErr || new Error("Upstream PDF unreachable");
}

async function resolvePdfMeta(
  docId: string,
  urlPdf: string
): Promise<MetaCacheEntry> {
  const cached = metaCache.get(docId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached;
  }

  // Probe with tiny 1-byte Range request to discover exact total length & range support
  const probe = await fetchWithRetry(
    urlPdf,
    {
      method: "GET",
      headers: {
        "User-Agent": BROWSER_UA,
        Range: "bytes=0-0",
      },
    },
    18000
  );

  let length = 0;
  let acceptRanges = false;
  const contentType = probe.headers.get("content-type") || "application/pdf";

  if (probe.status === 206) {
    acceptRanges = true;
    const cr = probe.headers.get("content-range") || "";
    const match = cr.match(/\/(\d+)$/);
    if (match) {
      length = Number(match[1]);
    }
    try {
      await probe.body?.cancel();
    } catch {
      // ignore cancel errors
    }
  } else if (probe.ok) {
    const cl = probe.headers.get("content-length");
    if (cl) length = Number(cl);
    acceptRanges =
      (probe.headers.get("accept-ranges") || "").toLowerCase() === "bytes";
    try {
      await probe.body?.cancel();
    } catch {
      // ignore cancel errors
    }
  } else {
    throw new Error(`HTTP ${probe.status}`);
  }

  const entry: MetaCacheEntry = {
    length,
    acceptRanges,
    contentType,
    expiresAt: Date.now() + META_TTL_MS,
  };
  if (metaCache.size > 100) {
    const first = metaCache.keys().next().value;
    if (first) metaCache.delete(first);
  }
  metaCache.set(docId, entry);
  return entry;
}

export async function HEAD(req: NextRequest) {
  const docId = req.nextUrl.searchParams.get("doc")?.trim();
  if (!docId) {
    return new NextResponse(null, { status: 400 });
  }
  const pdfDoc = getDokumenPdfById(docId);
  if (!pdfDoc) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const meta = await resolvePdfMeta(docId, pdfDoc.url_pdf);
    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Accept-Ranges": meta.acceptRanges ? "bytes" : "none",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    });
    if (meta.length > 0) {
      headers.set("Content-Length", String(meta.length));
      headers.set("X-PDF-Length", String(meta.length));
    }
    return new NextResponse(null, { status: 200, headers });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}

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

  // Fast metadata endpoint for PDF.js PDFDataRangeTransport
  if (req.nextUrl.searchParams.get("meta") === "1") {
    try {
      const meta = await resolvePdfMeta(docId, pdfDoc.url_pdf);
      return NextResponse.json(
        {
          ok: true,
          doc: docId,
          length: meta.length,
          acceptRanges: meta.acceptRanges,
        },
        {
          headers: {
            "Cache-Control":
              "public, max-age=1800, s-maxage=86400, stale-while-revalidate=86400",
          },
        }
      );
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error:
            err instanceof Error
              ? `Sumber PDF tidak merespons (${err.message}).`
              : "Gagal membaca metadata dokumen PDF.",
        },
        { status: 502 }
      );
    }
  }

  const upstreamHeaders = new Headers({
    "User-Agent": BROWSER_UA,
  });

  const rangeHeader = req.headers.get("range");
  if (rangeHeader) {
    upstreamHeaders.set("Range", rangeHeader);
  }

  try {
    // For bounded Range chunk requests (used by PDF.js), buffer cleanly with full body timeout + retry
    if (rangeHeader) {
      let chunkBuf: ArrayBuffer | null = null;
      let chunkStatus = 206;
      let chunkCR: string | null = null;
      let lastBodyErr: unknown = null;

      for (let attempt = 0; attempt < 2; attempt++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 16000);
        try {
          const r = await fetch(pdfDoc.url_pdf, {
            headers: upstreamHeaders,
            redirect: "follow",
            signal: ctrl.signal,
          });
          if (!r.ok && r.status !== 206) {
            clearTimeout(timer);
            if (r.status < 500) {
              return NextResponse.json(
                { error: `Sumber PDF merespons status ${r.status}.` },
                { status: 502 }
              );
            }
            continue;
          }
          const ab = await r.arrayBuffer();
          clearTimeout(timer);
          chunkBuf = ab;
          chunkStatus = r.status;
          chunkCR = r.headers.get("content-range");
          break;
        } catch (err) {
          clearTimeout(timer);
          lastBodyErr = err;
        }
      }

      if (!chunkBuf) {
        throw lastBodyErr || new Error("Range chunk timed out");
      }

      const rangeResHeaders = new Headers({
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${pdfDoc.id}.pdf"`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkBuf.byteLength),
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      });
      if (chunkCR) rangeResHeaders.set("Content-Range", chunkCR);

      return new NextResponse(chunkBuf, {
        status: chunkStatus,
        headers: rangeResHeaders,
      });
    }

    const upstream = await fetchWithRetry(
      pdfDoc.url_pdf,
      { headers: upstreamHeaders },
      24000
    );

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

    const contentRange = upstream.headers.get("content-range");
    if (contentRange) resHeaders.set("Content-Range", contentRange);

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) resHeaders.set("Content-Length", contentLength);

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
