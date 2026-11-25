"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ExternalLink,
  FileText,
  ListFilter,
  Search,
  Sparkles,
} from "lucide-react";
import type { EnrichedDokumenPdf } from "@/lib/catalog";

interface PustakaPdfExplorerProps {
  docs: EnrichedDokumenPdf[];
}

export function PustakaPdfExplorer({ docs }: PustakaPdfExplorerProps) {
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<
    "all" | "indexed" | "tanfidz" | "fatwa" | "tuntunan"
  >("all");

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((doc) => {
      if (filterMode === "indexed" && doc.masail_count < 2) return false;
      if (
        filterMode === "tanfidz" &&
        !/(tanfidz|brm|hpt|himpunan|munas|khgt|manhaj|fikih)/i.test(
          `${doc.judul} ${doc.sumber_label} ${doc.deskripsi || ""}`
        )
      ) {
        return false;
      }
      if (
        filterMode === "fatwa" &&
        !/(fatwa|kurban|pemilu|politik|haji|pinpri|nikah|kematian|takziah|kuliner)/i.test(
          `${doc.judul} ${doc.sumber_label}`
        )
      ) {
        return false;
      }
      if (
        filterMode === "tuntunan" &&
        !/(tuntunan|ramadhan|ramadan|hisab|khgt|kalender|gerhana|thaharah|jenazah|walimah|aqiqah|wudhu|tayamum)/i.test(
          `${doc.judul} ${doc.sumber_label}`
        )
      ) {
        return false;
      }
      if (q) {
        const sampleTitles = doc.sample_masail.map((s) => s.judul).join(" ");
        const hay =
          `${doc.judul} ${doc.sumber_label} ${doc.forum_nama} ${doc.deskripsi || ""} ${sampleTitles}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [docs, query, filterMode]);

  const indexedCount = useMemo(
    () => docs.filter((d) => d.masail_count >= 2).length,
    [docs]
  );

  return (
    <div className="space-y-6">
      {/* Search & Category Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari PDF Tanfidz Munas, HPT, BRM, KHGT, Fikih Zakat, Fikih Difabel, Tuntunan Ibadah, atau Fatwa..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0b4f8c] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: `Semua PDF (${docs.length})` },
              {
                id: "indexed",
                label: `Multi-Masalah Terindeks (${indexedCount})`,
              },
              { id: "tanfidz", label: "HPT, BRM & Tanfidz" },
              { id: "tuntunan", label: "Tuntunan & Hisab" },
              { id: "fatwa", label: "Fatwa Tematik" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setFilterMode(
                    tab.id as "all" | "indexed" | "tanfidz" | "fatwa" | "tuntunan"
                  )
                }
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filterMode === tab.id
                    ? "bg-[#0b4f8c] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500">
            Menampilkan <strong className="text-slate-900">{filteredDocs.length}</strong>{" "}
            dokumen online
          </span>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredDocs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Tidak ada dokumen PDF yang cocok dengan pencarian Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => (
            <article
              key={doc.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#0b4f8c]/40 hover:shadow-md"
            >
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f2fc] px-2.5 py-0.5 text-[11px] font-semibold text-[#0b4f8c]">
                    <FileText className="h-3 w-3" />
                    {doc.forum_singkatan}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    {doc.total_halaman && <span>{doc.total_halaman} hal.</span>}
                    {doc.tahun && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {doc.tahun}
                      </span>
                    )}
                  </div>
                </div>

                <Link href={`/pdf/${doc.id}`} className="block group">
                  <h3 className="font-serif-title text-base font-bold leading-snug text-slate-900 group-hover:text-[#0b4f8c]">
                    {doc.judul}
                  </h3>
                </Link>

                {doc.deskripsi && (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">
                    {doc.deskripsi}
                  </p>
                )}

                {/* Direct Jump Preview Chips */}
                {doc.sample_masail.length > 0 && (
                  <div className="mt-3.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <ListFilter className="h-3 w-3 text-[#c88d1d]" />
                        Lompat Langsung ke Bab/Masalah:
                      </span>
                      <span className="text-[#0b4f8c]">
                        {doc.masail_count} entri
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {doc.sample_masail.slice(0, 3).map((m) => (
                        <li key={m.id}>
                          <Link
                            href={`/pdf/${doc.id}?page=${m.halaman_mulai}&masail=${encodeURIComponent(m.id)}`}
                            className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[11px] text-slate-700 transition-colors hover:bg-white hover:text-[#0b4f8c]"
                          >
                            <span className="truncate">{m.judul}</span>
                            <span className="shrink-0 rounded bg-amber-100/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                              Hal. {m.halaman_mulai}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
                <span className="inline-flex items-center gap-1 truncate text-[11px] text-slate-500">
                  {doc.masail_count >= 2 ? (
                    <>
                      <Sparkles className="h-3 w-3 shrink-0 text-[#c88d1d]" />
                      Filter isi tersedia
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-3 w-3 shrink-0 text-[#0b4f8c]" />
                      {doc.sumber_label}
                    </>
                  )}
                </span>

                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={doc.url_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    title="Buka PDF asli di tab baru"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <Link
                    href={`/pdf/${doc.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#0b4f8c] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#073866]"
                  >
                    Buka PDF
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
