import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ExternalLink,
  FileText,
  Landmark,
  MapPin,
} from "lucide-react";
import { getAllForums } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Munas Tarjih, HPT & Sumber Resmi Muhammadiyah",
  description:
    "Daftar forum Musyawarah Nasional Tarjih Muhammadiyah, Himpunan Putusan Tarjih (HPT), Divisi Fatwa, serta portal rujukan resmi Majelis Tarjih dan Tajdid PP Muhammadiyah.",
};

const TINGKAT_LABEL: Record<string, string> = {
  pp_muhammadiyah: "PP Muhammadiyah",
  munas_tarjih: "Musyawarah Nasional Tarjih",
  mtt_fatwa: "Majelis Tarjih & Tajdid",
  pwm_tarjih: "Tarjih Wilayah",
  suara_muhammadiyah: "Suara Muhammadiyah",
};

export default function ForumPage() {
  const forums = getAllForums();

  return (
    <div>
      <section className="pattern-surya border-b border-[#062b4f] text-white">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f2c96b]/40 bg-white/10 px-3 py-1 text-xs font-semibold text-[#fce3a2]">
            <Landmark className="h-3.5 w-3.5 text-[#f2c96b]" />
            Sumber Otoritatif Majelis Tarjih &amp; Tajdid
          </div>
          <h1 className="font-serif-title mt-3 text-2xl font-bold sm:text-3xl">
            Musyawarah Nasional Tarjih, HPT &amp; Divisi Fatwa
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sky-100/90">
            Seluruh indeks pembahasan dan dokumen PDF pada aplikasi ini merujuk
            langsung kepada forum-forum resmi Pimpinan Pusat Muhammadiyah serta
            portal tarjih.or.id dan fatwatarjih.or.id.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {forums.map((forum) => (
            <article
              key={forum.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-md"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-[#e7f2fc] px-3 py-0.5 text-[11px] font-bold text-[#0b4f8c]">
                    {TINGKAT_LABEL[forum.tingkat] || "Majelis Tarjih"}
                  </span>
                  {forum.tahun && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {forum.tahun}
                    </span>
                  )}
                </div>

                <h2 className="font-serif-title mt-3 text-lg font-bold text-slate-900">
                  {forum.nama}
                </h2>

                {forum.deskripsi && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {forum.deskripsi}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                  {forum.lokasi && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#c88d1d]" />
                      {forum.lokasi}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                    <BookOpen className="h-3.5 w-3.5 text-[#0b4f8c]" />
                    {forum.masail_count} pembahasan
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                    <FileText className="h-3.5 w-3.5 text-amber-700" />
                    {forum.pdf_count} dokumen PDF
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                {forum.situs_sumber ? (
                  <a
                    href={forum.situs_sumber}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#0b4f8c] hover:underline"
                  >
                    Portal Resmi
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span />
                )}

                <Link
                  href={`/?forum=${encodeURIComponent(forum.id)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b4f8c] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#073866]"
                >
                  Lihat Pembahasan
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
