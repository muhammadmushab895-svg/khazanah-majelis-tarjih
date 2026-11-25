"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Filter,
  ListFilter,
  Maximize2,
  Minimize2,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type {
  DokumenPdfItem,
  EnrichedTarjihItem,
  JenisProdukTarjih,
} from "@/types/catalog";

interface OnlinePdfViewerProps {
  doc: DokumenPdfItem;
  initialPage?: number;
  highlightTitle?: string;
  indexedMasail?: EnrichedTarjihItem[];
  activeMasailId?: string;
}

const JENIS_SHORT: Record<JenisProdukTarjih, string> = {
  putusan: "Putusan",
  fatwa: "Fatwa",
  fikih_tematik: "Fikih Tematik",
  tuntunan: "Tuntunan",
};

export function OnlinePdfViewer({
  doc,
  initialPage = 1,
  highlightTitle,
  indexedMasail = [],
  activeMasailId,
}: OnlinePdfViewerProps) {
  const [pageNum, setPageNum] = useState<number>(Math.max(1, initialPage));
  const [pageInput, setPageInput] = useState<string>(
    String(Math.max(1, initialPage))
  );
  const [activeId, setActiveId] = useState<string | undefined>(activeMasailId);
  const [activeLabel, setActiveLabel] = useState<string | undefined>(
    highlightTitle
  );
  const [expanded, setExpanded] = useState(false);

  // Viewer mode: archive_org supports lightweight bookreader stream + direct PDF proxy;
  // direct_pdf uses native HTTP Range PDF streaming + Google Docs fallback for mobile browsers.
  const [viewerMode, setViewerMode] = useState<
    "archive_stream" | "pdf_native" | "gdocs"
  >(doc.tipe_host === "archive_org" ? "archive_stream" : "pdf_native");

  // Per-PDF Masalah Filter state
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedBab, setSelectedBab] = useState<string>("all");
  const [selectedJenis, setSelectedJenis] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const hasIndex = indexedMasail.length > 0;

  // Compact list of distinct Bab Tabwib inside this PDF
  const babOptions = useMemo(() => {
    const map = new Map<string, { id: string; nama: string; count: number }>();
    for (const m of indexedMasail) {
      const existing = map.get(m.tabwib_id);
      if (existing) existing.count += 1;
      else map.set(m.tabwib_id, { id: m.tabwib_id, nama: m.tabwib_nama, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [indexedMasail]);

  // Distinct Jenis Produk inside this PDF (only show pills if >1)
  const jenisOptions = useMemo(() => {
    const map = new Map<JenisProdukTarjih, number>();
    for (const m of indexedMasail) {
      map.set(m.jenis_produk, (map.get(m.jenis_produk) || 0) + 1);
    }
    return Array.from(map.entries());
  }, [indexedMasail]);

  const filteredMasail = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return indexedMasail.filter((m) => {
      if (selectedBab !== "all" && m.tabwib_id !== selectedBab) return false;
      if (selectedJenis !== "all" && m.jenis_produk !== selectedJenis)
        return false;
      if (q) {
        const hay =
          `${m.judul} ${m.ringkasan_singkat} ${m.tabwib_nama} ${m.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [indexedMasail, filterQuery, selectedBab, selectedJenis]);

  const jumpToPage = (targetPage: number, item?: EnrichedTarjihItem) => {
    const safe = Math.max(1, targetPage);
    setPageNum(safe);
    setPageInput(String(safe));
    if (item) {
      setActiveId(item.id);
      setActiveLabel(item.judul);
    }
  };

  const handleManualJump = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      jumpToPage(parsed);
    }
  };

  const iframeSrc = useMemo(() => {
    if (viewerMode === "archive_stream" && doc.archive_identifier) {
      const zeroIdx = Math.max(0, pageNum - 1);
      return `https://archive.org/embed/${encodeURIComponent(
        doc.archive_identifier
      )}#page/n${zeroIdx}/mode/1up`;
    }
    if (viewerMode === "gdocs") {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
        doc.url_pdf
      )}`;
    }
    return `/api/pdf-proxy?doc=${encodeURIComponent(
      doc.id
    )}#page=${pageNum}&view=FitH`;
  }, [viewerMode, doc.archive_identifier, doc.id, doc.url_pdf, pageNum]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      {/* Top Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/90 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0b4f8c] text-white">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {doc.judul}
            </p>
            <p className="truncate text-[11px] text-slate-500">
              {doc.sumber_label}
              {doc.total_halaman ? ` • ${doc.total_halaman} halaman` : ""}
              {activeLabel ? ` • Fokus: ${activeLabel}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Viewer Mode Switcher */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
            {doc.tipe_host === "archive_org" ? (
              <>
                <button
                  type="button"
                  onClick={() => setViewerMode("archive_stream")}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    viewerMode === "archive_stream"
                      ? "bg-[#0b4f8c] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Stream Ringan
                </button>
                <button
                  type="button"
                  onClick={() => setViewerMode("pdf_native")}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    viewerMode === "pdf_native"
                      ? "bg-[#0b4f8c] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  PDF Langsung
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setViewerMode("pdf_native")}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    viewerMode === "pdf_native"
                      ? "bg-[#0b4f8c] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  PDF Streaming
                </button>
                <button
                  type="button"
                  onClick={() => setViewerMode("gdocs")}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    viewerMode === "gdocs"
                      ? "bg-[#0b4f8c] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Gunakan penampil alternatif jika perangkat mobile tidak menampilkan PDF bawaan"
                >
                  Mode Mobile
                </button>
              </>
            )}
          </div>

          {/* Manual page jump */}
          {viewerMode !== "gdocs" && (
            <form
              onSubmit={handleManualJump}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
            >
              <span className="text-slate-500">Hal.</span>
              <input
                type="number"
                min={1}
                max={doc.total_halaman || 9999}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                className="w-12 bg-transparent text-center font-semibold text-slate-900 focus:outline-none"
                aria-label="Nomor halaman PDF"
              />
              <button
                type="submit"
                className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-[#0b4f8c] hover:bg-[#e7f2fc]"
              >
                Lompat
              </button>
            </form>
          )}

          {hasIndex && (
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                sidebarOpen
                  ? "border-[#0b4f8c]/30 bg-[#e7f2fc] text-[#0b4f8c]"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              Daftar Isi ({indexedMasail.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            title={expanded ? "Kecilkan tampilan" : "Perlebar tampilan"}
          >
            {expanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>

          <a
            href={doc.url_pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-[#0b4f8c] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#073866]"
          >
            PDF Asli
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Main Split Area: Per-PDF Masalah Filter Sidebar + Online PDF Iframe */}
      <div
        className={`grid grid-cols-1 ${
          hasIndex && sidebarOpen ? "lg:grid-cols-12" : ""
        }`}
      >
        {hasIndex && sidebarOpen && (
          <aside className="flex flex-col border-b border-slate-200 bg-slate-50/60 lg:col-span-4 lg:border-r lg:border-b-0">
            <div className="border-b border-slate-200 bg-white p-3.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Sparkles className="h-3.5 w-3.5 text-[#c88d1d]" />
                  Filter Masalah dalam PDF Ini
                </div>
                <span className="rounded-full bg-[#e7f2fc] px-2 py-0.5 text-[11px] font-semibold text-[#0b4f8c]">
                  {filteredMasail.length}/{indexedMasail.length}
                </span>
              </div>

              {/* Search within PDF */}
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Cari bab atau masalah di PDF ini..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-7 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0b4f8c] focus:bg-white focus:outline-none"
                />
                {filterQuery && (
                  <button
                    type="button"
                    onClick={() => setFilterQuery("")}
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Hapus pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Jenis Produk pills (only if multiple types exist in this PDF) */}
              {jenisOptions.length > 1 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedJenis("all")}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                      selectedJenis === "all"
                        ? "bg-[#0b4f8c] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Semua
                  </button>
                  {jenisOptions.map(([jenis, count]) => (
                    <button
                      key={jenis}
                      type="button"
                      onClick={() => setSelectedJenis(jenis)}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                        selectedJenis === jenis
                          ? "bg-[#0b4f8c] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {JENIS_SHORT[jenis]} ({count})
                    </button>
                  ))}
                </div>
              )}

              {/* Compact Bab Tabwib dropdown (only if >1 Bab) */}
              {babOptions.length > 1 && (
                <div className="mt-2.5 flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <select
                    value={selectedBab}
                    onChange={(e) => setSelectedBab(e.target.value)}
                    aria-label="Filter berdasarkan Bab Tabwib"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-[#0b4f8c] focus:outline-none"
                  >
                    <option value="all">
                      Semua Bab ({indexedMasail.length} pembahasan)
                    </option>
                    {babOptions.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nama} ({b.count})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Indexed Masalah List (strictly sorted by PDF page) */}
            <div
              className={`divide-y divide-slate-200/70 overflow-y-auto ${
                expanded ? "max-h-[780px]" : "max-h-[580px]"
              }`}
            >
              {filteredMasail.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Tidak ada pembahasan yang cocok dengan filter di PDF ini.
                </div>
              ) : (
                filteredMasail.map((m) => {
                  const targetPage = m.pdf?.halaman_mulai || 1;
                  const isActive =
                    activeId === m.id ||
                    (!activeId && pageNum === targetPage && m.id === filteredMasail[0]?.id);
                  return (
                    <div
                      key={m.id}
                      className={`p-3 transition-colors ${
                        isActive
                          ? "border-l-4 border-l-[#0b4f8c] bg-[#e7f2fc]/60"
                          : "hover:bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => jumpToPage(targetPage, m)}
                        className="w-full text-left focus:outline-none"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-xs font-bold leading-snug ${
                              isActive ? "text-[#0b4f8c]" : "text-slate-800"
                            }`}
                          >
                            {m.judul}
                          </span>
                          <span
                            className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                              isActive
                                ? "bg-[#0b4f8c] text-white"
                                : "bg-amber-100/80 text-amber-900"
                            }`}
                          >
                            Hal. {targetPage}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1 truncate">
                            <BookOpen className="h-3 w-3 shrink-0 text-[#c88d1d]" />
                            <span className="truncate">{m.tabwib_nama}</span>
                          </span>
                          <Link
                            href={`/masalah/${m.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 font-medium text-[#0b4f8c] hover:underline"
                          >
                            Detail
                          </Link>
                        </div>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* PDF Iframe Pane */}
        <div
          className={`relative bg-slate-900/5 ${
            hasIndex && sidebarOpen ? "lg:col-span-8" : "col-span-1"
          }`}
        >
          <iframe
            key={`${viewerMode}-${pageNum}`}
            src={iframeSrc}
            title={`Pratinjau Online: ${doc.judul}`}
            className={`w-full border-0 bg-slate-100 ${
              expanded ? "h-[82vh] min-h-[680px]" : "h-[74vh] min-h-[580px]"
            }`}
            allow="fullscreen"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
            <span>
              Halaman aktif: <strong className="text-slate-800">{pageNum}</strong>
              {doc.total_halaman ? ` dari ${doc.total_halaman}` : ""} • Streaming
              langsung tanpa menyimpan file di perangkat.
            </span>
            <a
              href={doc.url_halaman_sumber}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-[#0b4f8c] hover:underline"
            >
              Halaman Sumber Resmi
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
