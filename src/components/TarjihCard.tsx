import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  FileText,
  Globe,
  Landmark,
} from "lucide-react";
import type { EnrichedTarjihItem, JenisProdukTarjih } from "@/types/catalog";

const PRODUK_META: Record<
  JenisProdukTarjih,
  { label: string; badgeClass: string }
> = {
  putusan: {
    label: "Putusan Tarjih",
    badgeClass: "bg-[#e7f2fc] text-[#0b4f8c] border-[#bfdbfe]",
  },
  fatwa: {
    label: "Fatwa Tarjih",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  fikih_tematik: {
    label: "Fikih Tematik",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
  },
  tuntunan: {
    label: "Tuntunan & Hisab",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
};

export function getProdukBadge(jenis: JenisProdukTarjih) {
  return PRODUK_META[jenis] || PRODUK_META.fatwa;
}

export function TarjihCard({ item }: { item: EnrichedTarjihItem }) {
  const produk = getProdukBadge(item.jenis_produk);
  const hasPdf = Boolean(item.pdf);
  const hasArtikel = Boolean(item.artikel);

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0b4f8c]/40 hover:shadow-md">
      <div>
        {/* Top meta row */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${produk.badgeClass}`}
          >
            {produk.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
            <BookOpen className="h-3 w-3 text-[#0b4f8c]" />
            {item.tabwib_nama}
          </span>
        </div>

        {/* Title */}
        <Link href={`/masalah/${item.slug}`} className="block">
          <h3 className="font-serif-title line-clamp-2 text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#0b4f8c]">
            {item.judul}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
          {item.ringkasan_singkat}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-4 border-t border-slate-100 pt-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
            <Landmark className="h-3.5 w-3.5 text-[#c88d1d]" />
            <span className="truncate max-w-[190px]">{item.forum_singkatan}</span>
          </span>
          {item.tahun && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {item.tahun}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {hasArtikel && (
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-800">
                <Globe className="h-3 w-3" />
                Baca Online
              </span>
            )}
            {hasPdf && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900">
                <FileText className="h-3 w-3" />
                PDF Hal. {item.pdf?.halaman_mulai || 1}
              </span>
            )}
          </div>

          <Link
            href={`/masalah/${item.slug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0b4f8c] transition-colors hover:text-[#073866]"
          >
            Buka
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
