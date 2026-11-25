import Link from "next/link";
import {
  BookOpen,
  FileText,
  Globe,
  Landmark,
  Sparkles,
} from "lucide-react";
import {
  getCatalogStats,
  getTabwibTree,
  queryTarjih,
} from "@/lib/catalog";
import { TabwibExplorer } from "@/components/TabwibExplorer";

interface HomePageProps {
  searchParams: Promise<{
    tabwib?: string;
    forum?: string;
    q?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const sp = await searchParams;
  const tree = getTabwibTree();
  const stats = getCatalogStats();

  const initial = queryTarjih({
    tabwib: sp.tabwib,
    forum: sp.forum,
    q: sp.q,
    page: 1,
    limit: 18,
  });

  return (
    <div>
      {/* Radiant Surya Sapphire Hero */}
      <section className="pattern-surya relative overflow-hidden border-b border-[#062b4f] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f2c96b]/40 bg-white/10 px-3.5 py-1 text-xs font-semibold text-[#fce3a2] backdrop-blur-xs">
                <Sparkles className="h-3.5 w-3.5 text-[#f2c96b]" />
                PWA Full Online • Majelis Tarjih &amp; Tajdid Muhammadiyah
              </div>

              <h1 className="font-serif-title text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
                Khazanah Keputusan &amp; Fatwa Majelis Tarjih Muhammadiyah
              </h1>

              <p className="mt-3.5 max-w-2xl text-sm leading-relaxed text-sky-100/90 sm:text-base">
                Jelajahi <strong>Himpunan Putusan Tarjih (HPT)</strong>,{" "}
                <strong>Tanfidz Munas Tarjih</strong>,{" "}
                <strong>Fikih Tematik</strong>, <strong>Pedoman KHGT</strong>,
                dan ratusan <strong>Fatwa Tarjih</strong> dalam susunan{" "}
                <em>Tabwib</em> yang rapi — dibaca langsung secara online tanpa
                membebani memori perangkat.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="#katalog-tarjih"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f2c96b] px-5 py-2.5 text-sm font-bold text-[#072b4e] shadow-sm transition-colors hover:bg-[#f7d88a]"
                >
                  <BookOpen className="h-4 w-4" />
                  Jelajahi Tabwib HPT
                </a>
                <Link
                  href="/pustaka-pdf"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/20"
                >
                  <FileText className="h-4 w-4 text-[#f2c96b]" />
                  Pustaka PDF ({stats.total_pdf})
                </Link>
                <Link
                  href="/forum"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-sky-100 transition-colors hover:bg-white/10"
                >
                  <Landmark className="h-4 w-4" />
                  Munas &amp; Sumber
                </Link>
              </div>
            </div>

            {/* Compact Stats Grid */}
            <div className="grid grid-cols-2 gap-3 lg:col-span-4">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-xs font-medium text-sky-100/80">
                  <Globe className="h-4 w-4 text-[#f2c96b]" />
                  Indeks Pembahasan
                </div>
                <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-white">
                  {stats.total_masail}
                </p>
                <p className="mt-0.5 text-[11px] text-sky-100/75">
                  Putusan, Fatwa &amp; Tuntunan
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-xs font-medium text-sky-100/80">
                  <FileText className="h-4 w-4 text-[#f2c96b]" />
                  Dokumen PDF Resmi
                </div>
                <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-white">
                  {stats.total_pdf}
                </p>
                <p className="mt-0.5 text-[11px] text-sky-100/75">
                  Stream Online + Filter Isi
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-xs font-medium text-sky-100/80">
                  <BookOpen className="h-4 w-4 text-[#f2c96b]" />
                  Struktur Tabwib
                </div>
                <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-white">
                  {stats.total_kitab} Kitab
                </p>
                <p className="mt-0.5 text-[11px] text-sky-100/75">
                  {stats.total_bab} Bab HPT &amp; Tematik
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-xs font-medium text-sky-100/80">
                  <Landmark className="h-4 w-4 text-[#f2c96b]" />
                  Forum &amp; Divisi
                </div>
                <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-white">
                  {stats.total_forum}
                </p>
                <p className="mt-0.5 text-[11px] text-sky-100/75">
                  Munas XXVII–XXXII &amp; MTT
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabwib & Search Explorer */}
      <TabwibExplorer
        tree={tree}
        initialItems={initial.items}
        initialTotal={initial.total}
        initialTotalPages={initial.totalPages}
        initialTabwib={sp.tabwib || ""}
        initialForum={sp.forum || ""}
        initialQuery={sp.q || ""}
      />
    </div>
  );
}
