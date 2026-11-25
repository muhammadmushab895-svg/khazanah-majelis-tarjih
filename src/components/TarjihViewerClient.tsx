"use client";

import { useState } from "react";
import { FileText, Globe } from "lucide-react";
import type { EnrichedTarjihItem } from "@/types/catalog";
import { LiveFatwaReader } from "./LiveFatwaReader";
import { OnlinePdfViewer } from "./OnlinePdfViewer";

interface TarjihViewerClientProps {
  item: EnrichedTarjihItem;
  pdfMasail?: EnrichedTarjihItem[];
}

export function TarjihViewerClient({
  item,
  pdfMasail = [],
}: TarjihViewerClientProps) {
  const hasArtikel = Boolean(item.artikel?.url);
  const hasPdf = Boolean(item.pdf && item.pdf_dokumen);

  const [tab, setTab] = useState<"artikel" | "pdf">(
    hasArtikel ? "artikel" : "pdf"
  );

  if (!hasArtikel && !hasPdf) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        Tautan online untuk pembahasan ini belum tersedia.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasArtikel && hasPdf && (
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setTab("artikel")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === "artikel"
                ? "bg-[#0b4f8c] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Globe className="h-4 w-4" />
            Baca Fatwa Online
          </button>
          <button
            type="button"
            onClick={() => setTab("pdf")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === "pdf"
                ? "bg-[#0b4f8c] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileText className="h-4 w-4" />
            Lihat PDF (Hal. {item.pdf?.halaman_mulai || 1})
          </button>
        </div>
      )}

      {tab === "artikel" && hasArtikel && <LiveFatwaReader item={item} />}
      {tab === "pdf" && hasPdf && item.pdf_dokumen && (
        <OnlinePdfViewer
          doc={item.pdf_dokumen}
          initialPage={item.pdf?.halaman_mulai || 1}
          highlightTitle={item.judul}
          indexedMasail={pdfMasail}
          activeMasailId={item.id}
        />
      )}
    </div>
  );
}
