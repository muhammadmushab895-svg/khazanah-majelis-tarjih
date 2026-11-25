import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  FileText,
  Landmark,
  Tag,
} from "lucide-react";
import {
  getItemBySlug,
  getItemsByPdfDocId,
  getRelatedItems,
} from "@/lib/catalog";
import { getProdukBadge, TarjihCard } from "@/components/TarjihCard";
import { TarjihViewerClient } from "@/components/TarjihViewerClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getItemBySlug(slug);
  if (!item) return { title: "Pembahasan Tidak Ditemukan" };
  return {
    title: item.judul,
    description: item.ringkasan_singkat,
  };
}

export default async function MasalahDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = getItemBySlug(slug);
  if (!item) notFound();

  const produk = getProdukBadge(item.jenis_produk);
  const related = getRelatedItems(item, 4);
  const pdfMasail = item.pdf?.dokumen_pdf_id
    ? getItemsByPdfDocId(item.pdf.dokumen_pdf_id)
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-medium text-[#0b4f8c] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Beranda
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <Link
          href={`/?tabwib=${encodeURIComponent(item.tabwib_kitab_id)}`}
          className="hover:text-[#0b4f8c] hover:underline"
        >
          {item.tabwib_kitab_nama}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <Link
          href={`/?tabwib=${encodeURIComponent(item.tabwib_id)}`}
          className="font-medium text-slate-700 hover:text-[#0b4f8c] hover:underline"
        >
          {item.tabwib_nama}
        </Link>
      </nav>

      {/* Header Metadata Card */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${produk.badgeClass}`}
          >
            {produk.label}
          </span>
          <Link
            href={`/?tabwib=${encodeURIComponent(item.tabwib_id)}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-700 hover:bg-[#e7f2fc] hover:text-[#0b4f8c]"
          >
            <BookOpen className="h-3.5 w-3.5 text-[#0b4f8c]" />
            {item.tabwib_nama}
            {item.tabwib_nama_ar && (
              <span className="font-arabic text-sm">
                ({item.tabwib_nama_ar})
              </span>
            )}
          </Link>
        </div>

        <h1 className="font-serif-title mt-3 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
          {item.judul}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          {item.ringkasan_singkat}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
            <Landmark className="h-4 w-4 text-[#c88d1d]" />
            {item.forum_nama}
          </span>
          {item.tahun && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              Tahun {item.tahun}
            </span>
          )}
          {item.pdf && item.pdf_dokumen && (
            <Link
              href={`/pdf/${item.pdf_dokumen.id}?page=${item.pdf.halaman_mulai}&masail=${encodeURIComponent(item.id)}`}
              className="inline-flex items-center gap-1.5 font-semibold text-[#0b4f8c] hover:underline"
            >
              <FileText className="h-4 w-4" />
              Buka PDF Penuh (Hal. {item.pdf.halaman_mulai})
            </Link>
          )}
        </div>

        {item.tags.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            {item.tags.slice(0, 8).map((tag) => (
              <Link
                key={tag}
                href={`/?q=${encodeURIComponent(tag)}`}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-[#e7f2fc] hover:text-[#0b4f8c]"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Live Online Reader / Online PDF Viewer */}
      <TarjihViewerClient item={item} pdfMasail={pdfMasail} />

      {/* Related Pembahasan */}
      {related.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif-title text-xl font-bold text-slate-900">
              Pembahasan Terkait dalam {item.tabwib_nama}
            </h2>
            <Link
              href={`/?tabwib=${encodeURIComponent(item.tabwib_id)}`}
              className="text-xs font-semibold text-[#0b4f8c] hover:underline"
            >
              Lihat semua →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {related.map((rel) => (
              <TarjihCard key={rel.id} item={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
