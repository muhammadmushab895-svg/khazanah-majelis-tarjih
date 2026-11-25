"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface PdfCanvasRendererProps {
  docId: string;
  originalUrl: string;
  pageNum: number;
  onPageChange: (page: number) => void;
  onTotalPagesLoaded?: (total: number) => void;
  onFallbackRequested?: () => void;
  expanded?: boolean;
}

type PdfDocumentLike = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<{
    getViewport: (opts: { scale: number }) => { width: number; height: number };
    render: (opts: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
      canvas?: HTMLCanvasElement;
    }) => { promise: Promise<void>; cancel: () => void };
  }>;
  destroy: () => Promise<void>;
};

const RANGE_CHUNK_SIZE = 262144; // 256 KB per chunk (fast & always well under serverless limits)
const DIRECT_FETCH_THRESHOLD = 2_000_000; // <= 2 MB: single direct fetch for instant open

export function PdfCanvasRenderer({
  docId,
  originalUrl,
  pageNum,
  onPageChange,
  onTotalPagesLoaded,
  onFallbackRequested,
  expanded = false,
}: PdfCanvasRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<PdfDocumentLike | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  const [docLoading, setDocLoading] = useState(true);
  const [pageRendering, setPageRendering] = useState(false);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoomFactor, setZoomFactor] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadInfo, setLoadInfo] = useState<string>("Menghubungkan ke server PDF...");
  const [reloadNonce, setReloadNonce] = useState(0);

  // Load PDF document via PDF.js (smart direct load for <=2MB, 256KB Range transport for large PDFs!)
  useEffect(() => {
    let cancelled = false;
    let activeDoc: PdfDocumentLike | null = null;
    const abortControllers = new Set<AbortController>();

    async function loadDocument() {
      setDocLoading(true);
      setErrorMsg(null);
      setLoadInfo("Memeriksa dokumen PDF online...");

      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        // Step 1: Fetch lightweight metadata (length & range support)
        const metaCtrl = new AbortController();
        abortControllers.add(metaCtrl);
        const metaRes = await fetch(
          `/api/pdf-proxy?doc=${encodeURIComponent(docId)}&meta=1`,
          { signal: metaCtrl.signal }
        );
        abortControllers.delete(metaCtrl);

        if (!metaRes.ok) {
          throw new Error(
            `Dokumen belum dapat dijangkau dari sumber (HTTP ${metaRes.status}).`
          );
        }
        const meta = (await metaRes.json()) as {
          ok: boolean;
          length: number;
          acceptRanges: boolean;
          error?: string;
        };
        if (!meta.ok) {
          throw new Error(meta.error || "Gagal memuat metadata PDF.");
        }

        if (cancelled) return;

        const pdfjsVer = pdfjs.version || "6.5.438";
        const cMapUrl = `https://unpkg.com/pdfjs-dist@${pdfjsVer}/cmaps/`;
        const standardFontDataUrl = `https://unpkg.com/pdfjs-dist@${pdfjsVer}/standard_fonts/`;
        const wasmUrl = "/pdf-wasm/";

        let loadingTask;

        if (meta.length > 0 && meta.length <= DIRECT_FETCH_THRESHOLD) {
          // Fast path for smaller PDFs (<= 2 MB): single direct ArrayBuffer fetch
          setLoadInfo(
            `Memuat dokumen (${Math.max(1, Math.round(meta.length / 1024))} KB)...`
          );
          const dataCtrl = new AbortController();
          abortControllers.add(dataCtrl);
          const dataRes = await fetch(
            `/api/pdf-proxy?doc=${encodeURIComponent(docId)}`,
            { signal: dataCtrl.signal }
          );
          abortControllers.delete(dataCtrl);
          if (!dataRes.ok) {
            throw new Error(`Gagal memuat berkas PDF (HTTP ${dataRes.status}).`);
          }
          const buf = new Uint8Array(await dataRes.arrayBuffer());
          if (cancelled) return;
          loadingTask = pdfjs.getDocument({
            data: buf,
            cMapUrl,
            cMapPacked: true,
            standardFontDataUrl,
            wasmUrl,
          });
        } else if (meta.length > 0 && meta.acceptRanges) {
          // Smart HTTP 206 Range-chunked streaming with dedup, max-2 concurrency, 512 KB cap & retry
          const mb = (meta.length / (1024 * 1024)).toFixed(1);
          setLoadInfo(`Streaming cerdas dokumen ${mb} MB (hemat kuota)...`);

          const MAX_SUB_CHUNK = RANGE_CHUNK_SIZE; // Exact 256 KB chunk alignment for zero overlap/duplicates
          const MAX_CONCURRENT = 3;
          const queue: (() => Promise<void>)[] = [];
          const requestedChunks = new Set<number>();
          let activeCount = 0;

          const pumpQueue = () => {
            while (!cancelled && activeCount < MAX_CONCURRENT && queue.length > 0) {
              const job = queue.shift();
              if (!job) break;
              activeCount++;
              job().finally(() => {
                activeCount--;
                pumpQueue();
              });
            }
          };

          const enqueue = (job: () => Promise<void>) => {
            queue.push(job);
            pumpQueue();
          };

          class ProxyRangeTransport extends pdfjs.PDFDataRangeTransport {
            constructor(length: number) {
              super(length, null);
            }

            requestDataRange(begin: number, end: number) {
              const safeEnd = Math.min(end, meta.length);
              // Split multi-chunk requests on exact RANGE_CHUNK_SIZE boundaries and deduplicate by chunk index
              for (let pos = begin; pos < safeEnd; pos += MAX_SUB_CHUNK) {
                const subStart = pos;
                const subEnd = Math.min(pos + MAX_SUB_CHUNK, safeEnd);
                const chunkIdx = Math.floor(subStart / RANGE_CHUNK_SIZE);
                if (requestedChunks.has(chunkIdx)) continue;
                requestedChunks.add(chunkIdx);

                enqueue(async () => {
                  if (cancelled) return;
                  for (let attempt = 0; attempt < 3; attempt++) {
                    if (cancelled) return;
                    const ctrl = new AbortController();
                    abortControllers.add(ctrl);
                    const timer = setTimeout(() => ctrl.abort(), 14000);
                    try {
                      const res = await fetch(
                        `/api/pdf-proxy?doc=${encodeURIComponent(docId)}`,
                        {
                          headers: {
                            Range: `bytes=${subStart}-${subEnd - 1}`,
                          },
                          signal: ctrl.signal,
                        }
                      );
                      if (!res.ok && res.status !== 206) {
                        throw new Error(`Range HTTP ${res.status}`);
                      }
                      const chunk = new Uint8Array(await res.arrayBuffer());
                      clearTimeout(timer);
                      abortControllers.delete(ctrl);
                      if (!cancelled) {
                        this.onDataRange(subStart, chunk);
                      }
                      return;
                    } catch {
                      clearTimeout(timer);
                      abortControllers.delete(ctrl);
                      if (attempt === 2) {
                        requestedChunks.delete(chunkIdx);
                        if (!cancelled) this.abort();
                      }
                    }
                  }
                });
              }
            }
          }

          const transport = new ProxyRangeTransport(meta.length);
          loadingTask = pdfjs.getDocument({
            range: transport,
            rangeChunkSize: RANGE_CHUNK_SIZE,
            disableAutoFetch: true,
            disableStream: true,
            cMapUrl,
            cMapPacked: true,
            standardFontDataUrl,
            wasmUrl,
          });
        } else {
          // Fallback full fetch when upstream doesn't advertise Range
          setLoadInfo("Mengalirkan dokumen PDF...");
          const dataCtrl = new AbortController();
          abortControllers.add(dataCtrl);
          const dataRes = await fetch(
            `/api/pdf-proxy?doc=${encodeURIComponent(docId)}`,
            { signal: dataCtrl.signal }
          );
          abortControllers.delete(dataCtrl);
          if (!dataRes.ok) {
            throw new Error(`Gagal memuat PDF (HTTP ${dataRes.status}).`);
          }
          const buf = new Uint8Array(await dataRes.arrayBuffer());
          if (cancelled) return;
          loadingTask = pdfjs.getDocument({
            data: buf,
            cMapUrl,
            cMapPacked: true,
            standardFontDataUrl,
            wasmUrl,
          });
        }

        const pdf = (await loadingTask.promise) as unknown as PdfDocumentLike;
        if (cancelled) {
          await pdf.destroy();
          return;
        }
        activeDoc = pdf;
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        onTotalPagesLoaded?.(pdf.numPages);
        setDocLoading(false);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Gagal memuat dokumen PDF dari sumber online.";
        setErrorMsg(msg);
        setDocLoading(false);
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
      for (const c of abortControllers) {
        try {
          c.abort();
        } catch {
          // ignore
        }
      }
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
      if (activeDoc) {
        activeDoc.destroy().catch(() => {});
      }
      pdfDocRef.current = null;
    };
  }, [docId, reloadNonce, onTotalPagesLoaded]);

  // Render active page onto crisp HiDPI canvas
  const renderCurrentPage = useCallback(async () => {
    const pdf = pdfDocRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!pdf || !canvas || !container) return;

    const safePage = Math.min(Math.max(1, pageNum), pdf.numPages);
    setPageRendering(true);

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // ignore
      }
    }

    try {
      const page = await pdf.getPage(safePage);
      const baseViewport = page.getViewport({ scale: 1 });
      const availableWidth = Math.max(300, container.clientWidth - 32);
      const fitScale = Math.min(2.2, availableWidth / baseViewport.width);
      const cssScale = fitScale * zoomFactor;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const cssViewport = page.getViewport({ scale: cssScale });
      const renderViewport = page.getViewport({ scale: cssScale * dpr });

      canvas.width = Math.floor(renderViewport.width);
      canvas.height = Math.floor(renderViewport.height);
      canvas.style.width = `${Math.floor(cssViewport.width)}px`;
      canvas.style.height = `${Math.floor(cssViewport.height)}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const task = page.render({
        canvasContext: ctx,
        viewport: renderViewport,
        canvas,
      });
      renderTaskRef.current = task;
      await task.promise;

      container.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (
        err instanceof Error &&
        (err.name === "RenderingCancelledException" ||
          /cancelled/i.test(err.message))
      ) {
        return;
      }
    } finally {
      setPageRendering(false);
    }
  }, [pageNum, zoomFactor]);

  useEffect(() => {
    if (!docLoading && !errorMsg && totalPages > 0) {
      renderCurrentPage();
    }
  }, [docLoading, errorMsg, totalPages, renderCurrentPage]);

  // Re-fit width on resize
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!docLoading && !errorMsg && totalPages > 0) {
          renderCurrentPage();
        }
      }, 220);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (timer) clearTimeout(timer);
    };
  }, [docLoading, errorMsg, totalPages, renderCurrentPage]);

  const safePage = totalPages > 0 ? Math.min(Math.max(1, pageNum), totalPages) : pageNum;

  return (
    <div className="flex flex-col bg-slate-200/75">
      {/* Compact In-App PDF Navigation & Zoom Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={docLoading || safePage <= 1}
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold tabular-nums text-slate-800">
            Hal. {safePage}
            {totalPages > 0 ? ` / ${totalPages}` : ""}
          </span>

          <button
            type="button"
            disabled={docLoading || (totalPages > 0 && safePage >= totalPages)}
            onClick={() =>
              onPageChange(
                totalPages > 0 ? Math.min(totalPages, safePage + 1) : safePage + 1
              )
            }
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {pageRendering && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0b4f8c]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Merender...
            </span>
          )}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() =>
                setZoomFactor((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))
              }
              className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100"
              aria-label="Perkecil zoom PDF"
              title="Perkecil"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomFactor(1)}
              className="rounded px-2 py-1 text-[11px] font-semibold tabular-nums text-slate-700 hover:bg-slate-100"
              title="Sesuaikan lebar layar"
            >
              {Math.round(zoomFactor * 100)}%
            </button>
            <button
              type="button"
              onClick={() =>
                setZoomFactor((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))))
              }
              className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100"
              aria-label="Perbesar zoom PDF"
              title="Perbesar"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Page Canvas Stage */}
      <div
        ref={containerRef}
        className={`relative flex justify-center overflow-auto p-4 ${
          expanded ? "h-[82vh] min-h-[680px]" : "h-[74vh] min-h-[580px]"
        }`}
      >
        {docLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 self-center rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-xs">
            <Loader2 className="h-8 w-8 animate-spin text-[#0b4f8c]" />
            <div>
              <p className="text-sm font-bold text-slate-900">
                Menampilkan Dokumen PDF di Dalam Aplikasi
              </p>
              <p className="mt-1 text-xs text-slate-500">{loadInfo}</p>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="flex max-w-md flex-col items-center justify-center gap-3 self-center rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-xs">
            <AlertCircle className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-slate-900">
                Dokumen PDF Gagal Dimuat Langsung
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {errorMsg}
              </p>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setReloadNonce((n) => n + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b4f8c] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#073866]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Coba Muat Ulang
              </button>
              {onFallbackRequested && (
                <button
                  type="button"
                  onClick={onFallbackRequested}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Coba Google Viewer
                </button>
              )}
              <a
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                PDF Asli
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="relative my-auto">
            <canvas
              ref={canvasRef}
              className="mx-auto block rounded-lg bg-white shadow-md ring-1 ring-slate-300/70"
            />
          </div>
        )}
      </div>
    </div>
  );
}
