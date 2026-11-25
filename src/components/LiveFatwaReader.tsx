"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  Globe,
  Moon,
  RefreshCw,
  Sun,
  Type,
} from "lucide-react";
import type { EnrichedTarjihItem, ReaderArticleResponse } from "@/types/catalog";

export function LiveFatwaReader({ item }: { item: EnrichedTarjihItem }) {
  const [data, setData] = useState<ReaderArticleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontScale, setFontScale] = useState<number>(100);
  const [darkMode, setDarkMode] = useState(false);

  const loadArticle = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reader?id=${encodeURIComponent(item.id)}`);
      const json: ReaderArticleResponse = await res.json();
      setData(json);
    } catch {
      setData({
        ok: false,
        source_mode: "fallback",
        item_id: item.id,
        title: item.judul,
        source_name: item.artikel?.nama_sumber || "Situs Resmi Majelis Tarjih",
        source_url: item.artikel?.url || "",
        fetched_at: new Date().toISOString(),
        error_reason:
          "Tidak dapat menghubungi server reader. Pastikan koneksi internet aktif.",
      });
    } finally {
      setLoading(false);
    }
  }, [item.id, item.judul, item.artikel?.nama_sumber, item.artikel?.url]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-colors ${
        darkMode ? "reader-dark" : ""
      }`}
    >
      {/* Toolbar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 ${
          darkMode
            ? "border-slate-800 bg-[#13202e]"
            : "border-slate-200 bg-slate-50/80"
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          <Globe className="h-3.5 w-3.5 text-[#0b4f8c]" />
          <span className={darkMode ? "text-slate-300" : "text-slate-600"}>
            Diambil langsung secara online dari{" "}
            <strong className={darkMode ? "text-white" : "text-slate-900"}>
              {item.artikel?.nama_sumber || "Portal Majelis Tarjih"}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div
            className={`inline-flex items-center rounded-lg border px-1 py-0.5 ${
              darkMode
                ? "border-slate-700 bg-slate-800"
                : "border-slate-200 bg-white"
            }`}
          >
            <Type className="mx-1.5 h-3.5 w-3.5 text-slate-400" />
            <button
              type="button"
              onClick={() => setFontScale((s) => Math.max(85, s - 10))}
              className="rounded px-2 py-0.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Perkecil huruf"
            >
              A-
            </button>
            <span className="px-1 text-[11px] tabular-nums text-slate-500">
              {fontScale}%
            </span>
            <button
              type="button"
              onClick={() => setFontScale((s) => Math.min(140, s + 10))}
              className="rounded px-2 py-0.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Perbesar huruf"
            >
              A+
            </button>
          </div>

          <button
            type="button"
            onClick={() => setDarkMode((d) => !d)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              darkMode
                ? "border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
            title="Mode baca terang / malam"
          >
            {darkMode ? (
              <>
                <Sun className="h-3.5 w-3.5" />
                Terang
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5" />
                Malam
              </>
            )}
          </button>

          {item.artikel?.url && (
            <a
              href={item.artikel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b4f8c] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#073866]"
            >
              Sumber Asli
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-6 sm:px-8 sm:py-8">
        {loading ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <RefreshCw className="h-4 w-4 animate-spin text-[#0b4f8c]" />
              Memuat naskah fatwa langsung dari {item.artikel?.nama_sumber}...
            </div>
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100" />
            <div className="h-24 w-full animate-pulse rounded-xl bg-sky-50" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
          </div>
        ) : data?.ok && data.content_html ? (
          <div>
            {(data.published_date || data.author) && (
              <div
                className={`mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-b pb-4 text-xs ${
                  darkMode
                    ? "border-slate-800 text-slate-400"
                    : "border-slate-100 text-slate-500"
                }`}
              >
                {data.author && <span>Tim Penyusun: {data.author}</span>}
                {data.published_date && (
                  <span>Terbit: {data.published_date}</span>
                )}
              </div>
            )}

            <div
              className="fatwa-reader-content"
              style={{ fontSize: `${fontScale}%` }}
              dangerouslySetInnerHTML={{ __html: data.content_html }}
            />

            <div
              className={`mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-xs ${
                darkMode
                  ? "border-slate-800 bg-[#13202e] text-slate-300"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <div>
                Teks di atas ditampilkan secara langsung (live online) tanpa
                menyimpan arsip permanen di perangkat Anda.
              </div>
              {data.source_url && (
                <a
                  href={data.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-[#0b4f8c] hover:underline"
                >
                  Buka di {data.source_name}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-amber-600" />
            <h3 className="mt-3 text-base font-bold text-slate-900">
              Pratinjau Teks Tidak Tersedia Saat Ini
            </h3>
            <p className="mx-auto mt-1.5 max-w-lg text-sm text-slate-600">
              {data?.error_reason ||
                "Halaman sumber tidak dapat diambil secara otomatis."}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={loadArticle}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Coba Muat Ulang
              </button>
              {item.artikel?.url && (
                <a
                  href={item.artikel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b4f8c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#073866]"
                >
                  Baca di Situs Sumber Asli
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
