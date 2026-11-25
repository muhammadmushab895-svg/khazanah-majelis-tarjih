"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookMarked,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Layers,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type {
  EnrichedTarjihItem,
  JenisProdukTarjih,
  TabwibNode,
  TipeAkses,
} from "@/types/catalog";
import { TarjihCard } from "./TarjihCard";

interface TabwibExplorerProps {
  tree: TabwibNode[];
  initialItems: EnrichedTarjihItem[];
  initialTotal: number;
  initialTotalPages: number;
  initialTabwib?: string;
  initialForum?: string;
  initialQuery?: string;
}

const PRODUK_FILTERS: { value: "" | JenisProdukTarjih; label: string }[] = [
  { value: "", label: "Semua Produk" },
  { value: "putusan", label: "Putusan Tarjih" },
  { value: "fatwa", label: "Fatwa Tarjih" },
  { value: "fikih_tematik", label: "Fikih Tematik" },
  { value: "tuntunan", label: "Tuntunan & Hisab" },
];

const TIPE_FILTERS: { value: "" | TipeAkses; label: string }[] = [
  { value: "", label: "Semua Format" },
  { value: "artikel", label: "Tulisan Online" },
  { value: "pdf", label: "Dokumen PDF" },
];

export function TabwibExplorer({
  tree,
  initialItems,
  initialTotal,
  initialTotalPages,
  initialTabwib = "",
  initialForum = "",
  initialQuery = "",
}: TabwibExplorerProps) {
  const [selectedTabwib, setSelectedTabwib] = useState(initialTabwib);
  const [selectedForum, setSelectedForum] = useState(initialForum);
  const [selectedJenis, setSelectedJenis] = useState<"" | JenisProdukTarjih>(
    ""
  );
  const [selectedTipe, setSelectedTipe] = useState<"" | TipeAkses>("");
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<EnrichedTarjihItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  const [expandedKitab, setExpandedKitab] = useState<Record<string, boolean>>(
    () => {
      const init: Record<string, boolean> = {};
      if (initialTabwib) {
        init[initialTabwib.split(".")[0]] = true;
      } else if (tree[0]) {
        init[tree[0].id] = true;
        if (tree[1]) init[tree[1].id] = true;
      }
      return init;
    }
  );
  const [mobileTreeOpen, setMobileTreeOpen] = useState(false);

  const fetchItems = useCallback(
    async (opts: {
      tabwib: string;
      forum: string;
      jenis: "" | JenisProdukTarjih;
      tipe: "" | TipeAkses;
      q: string;
      pageNum: number;
    }) => {
      setLoading(true);
      try {
        const sp = new URLSearchParams();
        if (opts.tabwib) sp.set("tabwib", opts.tabwib);
        if (opts.forum) sp.set("forum", opts.forum);
        if (opts.jenis) sp.set("jenis", opts.jenis);
        if (opts.tipe) sp.set("tipe", opts.tipe);
        if (opts.q) sp.set("q", opts.q);
        sp.set("page", String(opts.pageNum));
        sp.set("limit", "18");

        const res = await fetch(`/api/tarjih?${sp.toString()}`);
        if (!res.ok) return;
        const json = await res.json();
        setItems(json.items || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced live search when typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (queryInput !== activeQuery) {
        setActiveQuery(queryInput);
        setPage(1);
        fetchItems({
          tabwib: selectedTabwib,
          forum: selectedForum,
          jenis: selectedJenis,
          tipe: selectedTipe,
          q: queryInput,
          pageNum: 1,
        });
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [
    queryInput,
    activeQuery,
    selectedTabwib,
    selectedForum,
    selectedJenis,
    selectedTipe,
    fetchItems,
  ]);

  const handleSelectTabwib = (id: string) => {
    const next = selectedTabwib === id ? "" : id;
    setSelectedTabwib(next);
    setPage(1);
    if (next) {
      const rootId = next.split(".")[0];
      setExpandedKitab((prev) => ({ ...prev, [rootId]: true }));
    }
    setMobileTreeOpen(false);
    fetchItems({
      tabwib: next,
      forum: selectedForum,
      jenis: selectedJenis,
      tipe: selectedTipe,
      q: activeQuery,
      pageNum: 1,
    });
  };

  const handleSelectJenis = (jenis: "" | JenisProdukTarjih) => {
    setSelectedJenis(jenis);
    setPage(1);
    fetchItems({
      tabwib: selectedTabwib,
      forum: selectedForum,
      jenis,
      tipe: selectedTipe,
      q: activeQuery,
      pageNum: 1,
    });
  };

  const handleSelectTipe = (tipe: "" | TipeAkses) => {
    setSelectedTipe(tipe);
    setPage(1);
    fetchItems({
      tabwib: selectedTabwib,
      forum: selectedForum,
      jenis: selectedJenis,
      tipe,
      q: activeQuery,
      pageNum: 1,
    });
  };

  const handleReset = () => {
    setSelectedTabwib("");
    setSelectedForum("");
    setSelectedJenis("");
    setSelectedTipe("");
    setQueryInput("");
    setActiveQuery("");
    setPage(1);
    fetchItems({
      tabwib: "",
      forum: "",
      jenis: "",
      tipe: "",
      q: "",
      pageNum: 1,
    });
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    fetchItems({
      tabwib: selectedTabwib,
      forum: selectedForum,
      jenis: selectedJenis,
      tipe: selectedTipe,
      q: activeQuery,
      pageNum: nextPage,
    });
    const el = document.getElementById("katalog-tarjih");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeNode = (() => {
    for (const k of tree) {
      if (k.id === selectedTabwib) return k;
      for (const b of k.children) {
        if (b.id === selectedTabwib) return b;
      }
    }
    return null;
  })();

  const hasFilters = Boolean(
    selectedTabwib ||
      selectedForum ||
      selectedJenis ||
      selectedTipe ||
      activeQuery
  );

  return (
    <section
      id="katalog-tarjih"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Quick Kitab Chips Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleSelectTabwib("")}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            !selectedTabwib
              ? "border-[#0b4f8c] bg-[#0b4f8c] text-white shadow-xs"
              : "border-slate-200 bg-white text-slate-700 hover:border-[#0b4f8c]/40 hover:bg-[#e7f2fc]/50"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Semua Kitab
        </button>
        {tree.map((kitab) => {
          const isActive =
            selectedTabwib === kitab.id ||
            selectedTabwib.startsWith(`${kitab.id}.`);
          return (
            <button
              key={kitab.id}
              type="button"
              onClick={() => handleSelectTabwib(kitab.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "border-[#0b4f8c] bg-[#0b4f8c] text-white shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#0b4f8c]/40 hover:bg-[#e7f2fc]/50"
              }`}
            >
              <span>{kitab.nama_id.replace(/^Kitab\s+/i, "")}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {kitab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Sidebar: HPT Tabwib Tree */}
        <aside className="lg:col-span-3">
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setMobileTreeOpen((v) => !v)}
              className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3.5 text-left lg:cursor-default"
            >
              <div className="flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-[#0b4f8c]" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Tabwib HPT &amp; Fikih
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {tree.length} Kitab Utama
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform lg:hidden ${
                  mobileTreeOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`${
                mobileTreeOpen ? "block" : "hidden"
              } max-h-[70vh] overflow-y-auto p-2.5 lg:block`}
            >
              {tree.map((kitab) => {
                const isKitabActive = selectedTabwib === kitab.id;
                const isExpanded = Boolean(expandedKitab[kitab.id]);
                return (
                  <div key={kitab.id} className="mb-1">
                    <div
                      className={`flex items-center justify-between rounded-xl px-2.5 py-2 transition-colors ${
                        isKitabActive
                          ? "bg-[#0b4f8c] text-white"
                          : "hover:bg-slate-100"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectTabwib(kitab.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                            isKitabActive
                              ? "bg-white/20 text-white"
                              : "bg-[#e7f2fc] text-[#0b4f8c]"
                          }`}
                        >
                          {kitab.kode}
                        </span>
                        <span className="truncate text-xs font-bold">
                          {kitab.nama_id}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedKitab((prev) => ({
                            ...prev,
                            [kitab.id]: !prev[kitab.id],
                          }))
                        }
                        className={`ml-1 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                          isKitabActive
                            ? "text-white/90 hover:bg-white/10"
                            : "text-slate-500 hover:bg-slate-200/70"
                        }`}
                        aria-label={`Buka bab ${kitab.nama_id}`}
                      >
                        <span>{kitab.count}</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-1 ml-3 space-y-0.5 border-l border-slate-200 pl-2.5">
                        {kitab.children.map((bab) => {
                          const active = selectedTabwib === bab.id;
                          return (
                            <button
                              key={bab.id}
                              type="button"
                              onClick={() => handleSelectTabwib(bab.id)}
                              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                                active
                                  ? "bg-[#e7f2fc] font-bold text-[#0b4f8c]"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                            >
                              <span className="truncate">{bab.nama_id}</span>
                              <span
                                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                  active
                                    ? "bg-[#0b4f8c] text-white"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {bab.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content Column */}
        <div className="space-y-5 lg:col-span-9">
          {/* Search & Filter Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Cari fatwa, putusan Munas, KHGT, zakat, kurban, waktu subuh, wakaf, keluarga sakinah..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0b4f8c] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              {/* Jenis Produk */}
              <div className="flex flex-wrap items-center gap-1.5">
                <SlidersHorizontal className="mr-0.5 h-3.5 w-3.5 text-slate-400" />
                {PRODUK_FILTERS.map((f) => (
                  <button
                    key={f.value || "all"}
                    type="button"
                    onClick={() => handleSelectJenis(f.value)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      selectedJenis === f.value
                        ? "bg-[#0b4f8c] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Format Akses */}
              <div className="flex items-center gap-1.5">
                {TIPE_FILTERS.map((t) => (
                  <button
                    key={t.value || "all-fmt"}
                    type="button"
                    onClick={() => handleSelectTipe(t.value)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                      selectedTipe === t.value
                        ? "border-[#c88d1d] bg-[#fdf5e3] text-amber-900"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t.value === "artikel" && <Globe className="h-3 w-3" />}
                    {t.value === "pdf" && <FileText className="h-3 w-3" />}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Filter Summary */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  Menampilkan{" "}
                  <strong className="text-slate-900">{total}</strong> pembahasan
                  Tarjih
                </span>
                {activeNode && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f2fc] px-2.5 py-0.5 font-semibold text-[#0b4f8c]">
                    {activeNode.nama_id}
                    {activeNode.nama_ar && (
                      <span className="font-arabic text-sm font-normal">
                        ({activeNode.nama_ar})
                      </span>
                    )}
                  </span>
                )}
              </div>

              {hasFilters && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 font-semibold text-[#0b4f8c] hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="mt-3 h-5 w-5/6 rounded bg-slate-200" />
                  <div className="mt-2 h-4 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-base font-bold text-slate-900">
                Belum ditemukan pembahasan yang cocok
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Coba gunakan kata kunci yang lebih singkat atau reset filter
                Tabwib.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0b4f8c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#073866]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Tampilkan Semua
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {items.map((item) => (
                <TarjihCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs">
              <span className="text-slate-600">
                Halaman <strong className="text-slate-900">{page}</strong> dari{" "}
                <strong className="text-slate-900">{totalPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => handlePageChange(page - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => handlePageChange(page + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Berikutnya
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
