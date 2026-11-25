import type { Metadata } from "next";
import { FileText, Sparkles } from "lucide-react";
import { getAllDokumenPdf } from "@/lib/catalog";
import { PustakaPdfExplorer } from "@/components/PustakaPdfExplorer";

export const metadata: Metadata = {
  title: "Pustaka PDF Keputusan Munas Tarjih, HPT & Fatwa",
  description:
    "Koleksi lengkap PDF resmi Majelis Tarjih dan Tajdid PP Muhammadiyah (HPT, BRM Tanfidz Munas Tarjih, KHGT, Fikih Tematik, E-Book Tuntunan, dan Fatwa) yang dialirkan langsung secara online dengan filter masalah per-PDF.",
};

export default function PustakaPdfPage() {
  const docs = getAllDokumenPdf();
  const totalIndexedMasail = docs.reduce((acc, d) => acc + d.masail_count, 0);

  return (
    <div>
      <section className="pattern-surya border-b border-[#062b4f] text-white">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f2c96b]/40 bg-white/10 px-3 py-1 text-xs font-semibold text-[#fce3a2]">
            <Sparkles className="h-3.5 w-3.5 text-[#f2c96b]" />
            Streaming PDF Online • Filter Masalah &amp; Lompat Halaman Akurat
          </div>
          <h1 className="font-serif-title mt-3 text-2xl font-bold sm:text-3xl">
            Pustaka PDF Resmi Majelis Tarjih Muhammadiyah
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sky-100/90">
            Menghimpun <strong>{docs.length} dokumen PDF resmi</strong> (HPT,
            Berita Resmi Muhammadiyah / Tanfidz Munas Tarjih XXVII–XXXII,
            Pedoman KHGT, Fikih Zakat, Fikih Difabel, E-Book Tuntunan Ibadah,
            dan Fatwa) dengan <strong>{totalIndexedMasail} titik lompat bab/masalah</strong>{" "}
            terverifikasi — langsung dibuka tanpa mengunduh arsip besar ke
            perangkat.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/70 px-4 py-3 text-xs text-sky-900">
          <FileText className="h-4 w-4 shrink-0 text-[#0b4f8c]" />
          <span>
            Klik <strong>Buka PDF</strong> atau langsung klik salah satu item{" "}
            <strong>Hal. X</strong> pada kartu untuk membuka PDF tepat di
            halaman bab/masalah yang dimaksud beserta panel filter masalah di
            sampingnya.
          </span>
        </div>

        <PustakaPdfExplorer docs={docs} />
      </section>
    </div>
  );
}
