import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, ExternalLink, FileText } from "lucide-react";
import {
  getDokumenPdfById,
  getForumById,
  getItemsByPdfDocId,
} from "@/lib/catalog";
import { OnlinePdfViewer } from "@/components/OnlinePdfViewer";

interface PdfPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; masail?: string }>;
}

export async function generateMetadata({
  params,
}: PdfPageProps): Promise<Metadata> {
  const { id } = await params;
  const doc = getDokumenPdfById(id);
  if (!doc) return { title: "Dokumen PDF Tidak Ditemukan" };
  return {
    title: doc.judul,
    description:
      doc.deskripsi || `Baca online dokumen PDF resmi ${doc.judul}.`,
  };
}

export default async function PdfDetailPage({
  params,
  searchParams,
}: PdfPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const doc = getDokumenPdfById(id);
  if (!doc) notFound();

  const forum = getForumById(doc.forum_id);
  const indexedMasail = getItemsByPdfDocId(doc.id);

  const requestedPage = Number(sp.page || "1");
  const initialPage =
    !Number.isNaN(requestedPage) && requestedPage >= 1
      ? requestedPage
      : indexedMasail[0]?.pdf?.halaman_mulai || 1;

  const activeMasail = sp.masail
    ? indexedMasail.find((m) => m.id === sp.masail)
    : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/pustaka-pdf"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0b4f8c] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Pustaka PDF
        </Link>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          {forum && (
            <span className="rounded-full bg-[#e7f2fc] px-2.5 py-0.5 font-semibold text-[#0b4f8c]">
              {forum.singkatan}
            </span>
          )}
          {doc.tahun && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {doc.tahun}
            </span>
          )}
          {doc.total_halaman && (
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {doc.total_halaman} hal.
            </span>
          )}
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif-title text-xl font-bold text-slate-900 sm:text-2xl">
              {doc.judul}
            </h1>
            {doc.deskripsi && (
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {doc.deskripsi}
              </p>
            )}
          </div>
          <a
            href={doc.url_halaman_sumber}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sumber: {doc.sumber_label}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <OnlinePdfViewer
        doc={doc}
        initialPage={initialPage}
        highlightTitle={activeMasail?.judul}
        indexedMasail={indexedMasail}
        activeMasailId={activeMasail?.id}
      />
    </div>
  );
}
