import tabwibRaw from "@/data/tabwib.json";
import forumsRaw from "@/data/forums.json";
import dokumenPdfRaw from "@/data/dokumen-pdf.json";
import tarjih01 from "@/data/tarjih/01-iman-manhaj.json";
import tarjih02 from "@/data/tarjih/02-ibadah.json";
import tarjih03 from "@/data/tarjih/03-muamalah.json";
import tarjih04 from "@/data/tarjih/04-usrah.json";
import tarjih05 from "@/data/tarjih/05-hisab-falak.json";
import tarjih06 from "@/data/tarjih/06-kebangsaan-ekologi.json";
import tarjih07 from "@/data/tarjih/07-kontemporer.json";
import type {
  DokumenPdfItem,
  EnrichedTarjihItem,
  ForumItem,
  JenisProdukTarjih,
  TabwibItem,
  TabwibNode,
  TarjihItem,
  TipeAkses,
} from "@/types/catalog";

const tabwibList = tabwibRaw as TabwibItem[];
const forumsList = forumsRaw as ForumItem[];
const dokumenPdfList = dokumenPdfRaw as DokumenPdfItem[];
const rawTarjihItems: TarjihItem[] = [
  ...(tarjih01 as TarjihItem[]),
  ...(tarjih02 as TarjihItem[]),
  ...(tarjih03 as TarjihItem[]),
  ...(tarjih04 as TarjihItem[]),
  ...(tarjih05 as TarjihItem[]),
  ...(tarjih06 as TarjihItem[]),
  ...(tarjih07 as TarjihItem[]),
];

// O(1) lookup maps built once at module initialization
const tabwibMap = new Map<string, TabwibItem>(tabwibList.map((t) => [t.id, t]));
const forumMap = new Map<string, ForumItem>(forumsList.map((f) => [f.id, f]));
const pdfMap = new Map<string, DokumenPdfItem>(dokumenPdfList.map((d) => [d.id, d]));

function normalizeQuery(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f'`’‘"]/g, "")
    .replace(/\bshalat\b|\bsolat\b/g, "salat")
    .replace(/\bqurban\b/g, "kurban")
    .replace(/\baqiqah\b/g, "akikah")
    .replace(/\bfiqih\b|\bfiqh\b/g, "fikih")
    .replace(/\baqidah\b/g, "akidah")
    .replace(/\bramadhan\b/g, "ramadan")
    .replace(/\bsyawwal\b/g, "syawal")
    .replace(/\bdzulhijjah\b|\bdzulhijah\b/g, "zulhijah")
    .replace(/\bwudhu\b/g, "wudu")
    .replace(/\btayammum\b/g, "tayamum")
    .replace(/\bhaidh\b/g, "haid")
    .replace(/\bdzikir\b/g, "zikir")
    .replace(/\btakziyah\b/g, "takziah")
    .replace(/\bkhulu\b/g, "khuluk")
    .replace(/\bqadla\b|\bqadha\b/g, "qada")
    .replace(/\bshubuh\b/g, "subuh")
    .replace(/\bjum'?at\b/g, "jumat")
    .replace(/\bidul\s+fitri\b/g, "idulfitri")
    .replace(/\bidul\s+adha\b/g, "iduladha")
    .replace(/[^a-z0-9\u0600-\u06ff\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function enrichItem(item: TarjihItem): EnrichedTarjihItem {
  const tab = tabwibMap.get(item.tabwib_id);
  const kitabId = tab?.parent_id || item.tabwib_id.split(".")[0];
  const kitab = tabwibMap.get(kitabId);
  const forum = forumMap.get(item.forum_id);
  const pdfDoc = item.pdf ? pdfMap.get(item.pdf.dokumen_pdf_id) : undefined;

  return {
    ...item,
    tabwib_nama: tab?.nama_id || "Umum",
    tabwib_nama_ar: tab?.nama_ar || "",
    tabwib_kitab_id: kitab?.id || kitabId,
    tabwib_kitab_nama: kitab?.nama_id || "Khazanah Tarjih",
    forum_nama: forum?.nama || "Majelis Tarjih & Tajdid PP Muhammadiyah",
    forum_singkatan: forum?.singkatan || "MTT PPM",
    forum_tingkat: forum?.tingkat || "mtt_fatwa",
    pdf_dokumen: pdfDoc,
  };
}

interface IndexedTarjih {
  item: EnrichedTarjihItem;
  searchText: string;
  titleNorm: string;
}

const enrichedList: EnrichedTarjihItem[] = rawTarjihItems.map(enrichItem);
const indexedList: IndexedTarjih[] = enrichedList.map((item) => {
  const titleNorm = normalizeQuery(item.judul);
  const searchText = normalizeQuery(
    [
      item.judul,
      item.ringkasan_singkat,
      item.tabwib_nama,
      item.tabwib_kitab_nama,
      item.forum_nama,
      item.forum_singkatan,
      item.tags.join(" "),
      item.pdf_dokumen?.judul || "",
    ].join(" ")
  );
  return { item, searchText, titleNorm };
});

const itemById = new Map<string, EnrichedTarjihItem>(enrichedList.map((i) => [i.id, i]));
const itemBySlug = new Map<string, EnrichedTarjihItem>(enrichedList.map((i) => [i.slug, i]));

const itemsByPdfId = new Map<string, EnrichedTarjihItem[]>();
for (const item of enrichedList) {
  const docId = item.pdf?.dokumen_pdf_id;
  if (!docId) continue;
  const arr = itemsByPdfId.get(docId) || [];
  arr.push(item);
  itemsByPdfId.set(docId, arr);
}
for (const [docId, arr] of itemsByPdfId.entries()) {
  arr.sort((a, b) => {
    const pa = a.pdf?.halaman_mulai ?? 9999;
    const pb = b.pdf?.halaman_mulai ?? 9999;
    if (pa !== pb) return pa - pb;
    return a.judul.localeCompare(b.judul, "id");
  });
  itemsByPdfId.set(docId, arr);
}

// Precompute Tabwib counts (direct bab + parent kitab)
const tabwibCounts = new Map<string, number>();
for (const item of enrichedList) {
  const ids = new Set<string>([item.tabwib_id, item.tabwib_kitab_id]);
  if (item.tabwib_sekunder) {
    for (const sec of item.tabwib_sekunder) {
      ids.add(sec);
      const secParent = tabwibMap.get(sec)?.parent_id;
      if (secParent) ids.add(secParent);
    }
  }
  for (const id of ids) {
    tabwibCounts.set(id, (tabwibCounts.get(id) || 0) + 1);
  }
}

export function getAllTabwib(): TabwibItem[] {
  return tabwibList;
}

export function getTabwibById(id: string): TabwibItem | undefined {
  return tabwibMap.get(id);
}

export function getTabwibTree(): TabwibNode[] {
  const kitabs = tabwibList.filter((t) => t.level === 1);
  return kitabs.map((k) => {
    const children: TabwibNode[] = tabwibList
      .filter((c) => c.parent_id === k.id)
      .map((c) => ({
        ...c,
        count: tabwibCounts.get(c.id) || 0,
        children: [],
      }));
    return {
      ...k,
      count: tabwibCounts.get(k.id) || 0,
      children,
    };
  });
}

export function getAllForums(): (ForumItem & { masail_count: number; pdf_count: number })[] {
  const masailByForum = new Map<string, number>();
  const pdfByForum = new Map<string, number>();
  for (const item of enrichedList) {
    masailByForum.set(item.forum_id, (masailByForum.get(item.forum_id) || 0) + 1);
  }
  for (const pdf of dokumenPdfList) {
    pdfByForum.set(pdf.forum_id, (pdfByForum.get(pdf.forum_id) || 0) + 1);
  }
  return forumsList.map((f) => ({
    ...f,
    masail_count: masailByForum.get(f.id) || 0,
    pdf_count: pdfByForum.get(f.id) || 0,
  }));
}

export function getForumById(id: string): ForumItem | undefined {
  return forumMap.get(id);
}

export interface EnrichedDokumenPdf extends DokumenPdfItem {
  forum_nama: string;
  forum_singkatan: string;
  masail_count: number;
  sample_masail: {
    id: string;
    slug: string;
    judul: string;
    halaman_mulai: number;
    tabwib_nama: string;
    jenis_produk: JenisProdukTarjih;
  }[];
}

export function getAllDokumenPdf(): EnrichedDokumenPdf[] {
  return dokumenPdfList.map((doc) => {
    const forum = forumMap.get(doc.forum_id);
    const linked = itemsByPdfId.get(doc.id) || [];
    return {
      ...doc,
      forum_nama: forum?.nama || "Majelis Tarjih & Tajdid PP Muhammadiyah",
      forum_singkatan: forum?.singkatan || "MTT PPM",
      masail_count: linked.length,
      sample_masail: linked.slice(0, 4).map((m) => ({
        id: m.id,
        slug: m.slug,
        judul: m.judul,
        halaman_mulai: m.pdf?.halaman_mulai || 1,
        tabwib_nama: m.tabwib_nama,
        jenis_produk: m.jenis_produk,
      })),
    };
  });
}

export function getDokumenPdfById(id: string): DokumenPdfItem | undefined {
  return pdfMap.get(id);
}

export function getItemsByPdfDocId(docId: string): EnrichedTarjihItem[] {
  return itemsByPdfId.get(docId) || [];
}

export function getItemById(id: string): EnrichedTarjihItem | undefined {
  return itemById.get(id);
}

export function getItemBySlug(slug: string): EnrichedTarjihItem | undefined {
  return itemBySlug.get(slug);
}

export function getRelatedItems(item: EnrichedTarjihItem, limit = 6): EnrichedTarjihItem[] {
  const sameBab = enrichedList.filter(
    (x) => x.id !== item.id && x.tabwib_id === item.tabwib_id
  );
  if (sameBab.length >= limit) return sameBab.slice(0, limit);
  const sameKitab = enrichedList.filter(
    (x) =>
      x.id !== item.id &&
      x.tabwib_id !== item.tabwib_id &&
      x.tabwib_kitab_id === item.tabwib_kitab_id
  );
  return [...sameBab, ...sameKitab].slice(0, limit);
}

export interface QueryTarjihParams {
  tabwib?: string;
  forum?: string;
  jenis?: JenisProdukTarjih | "";
  tipe?: TipeAkses | "";
  q?: string;
  page?: number;
  limit?: number;
}

export interface QueryTarjihResult {
  items: EnrichedTarjihItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function queryTarjih(params: QueryTarjihParams): QueryTarjihResult {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(60, Math.max(1, params.limit || 18));
  const qNorm = params.q ? normalizeQuery(params.q) : "";
  const tokens = qNorm ? qNorm.split(" ").filter(Boolean) : [];

  const matched: { item: EnrichedTarjihItem; score: number }[] = [];

  for (const row of indexedList) {
    const { item, searchText, titleNorm } = row;

    if (params.tabwib) {
      const target = params.tabwib;
      const matchesPrimary =
        item.tabwib_id === target || item.tabwib_kitab_id === target;
      const matchesSecondary =
        item.tabwib_sekunder?.some(
          (s) => s === target || s.startsWith(`${target}.`)
        ) || false;
      if (!matchesPrimary && !matchesSecondary) continue;
    }

    if (params.forum && item.forum_id !== params.forum) continue;
    if (params.jenis && item.jenis_produk !== params.jenis) continue;

    if (params.tipe === "pdf") {
      if (!item.pdf) continue;
    } else if (params.tipe === "artikel") {
      if (!item.artikel) continue;
    } else if (params.tipe === "keduanya") {
      if (!item.pdf || !item.artikel) continue;
    }

    let score = 0;
    if (tokens.length > 0) {
      let ok = true;
      for (const tok of tokens) {
        if (!searchText.includes(tok)) {
          ok = false;
          break;
        }
        if (titleNorm.includes(tok)) score += 10;
        else score += 2;
      }
      if (!ok) continue;
      if (titleNorm.includes(qNorm)) score += 25;
    } else {
      // Prioritize flagship Putusan / Fikih Tematik with PDF & recent years
      if (item.jenis_produk === "putusan") score += 4;
      if (item.jenis_produk === "fikih_tematik") score += 3;
      if (item.pdf && item.artikel) score += 2;
      score += ((item.tahun || 2015) - 1990) * 0.05;
    }

    matched.push({ item, score });
  }

  matched.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.item.tahun || 0) - (a.item.tahun || 0);
  });

  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const items = matched.slice(start, start + limit).map((m) => m.item);

  return {
    items,
    total,
    page: safePage,
    limit,
    totalPages,
  };
}

export function getCatalogStats() {
  const totalKitab = tabwibList.filter((t) => t.level === 1).length;
  const totalBab = tabwibList.filter((t) => t.level === 2).length;
  const totalArtikel = enrichedList.filter((i) => Boolean(i.artikel)).length;
  const totalWithPdf = enrichedList.filter((i) => Boolean(i.pdf)).length;
  const totalPutusan = enrichedList.filter(
    (i) => i.jenis_produk === "putusan" || i.jenis_produk === "fikih_tematik"
  ).length;
  const totalFatwa = enrichedList.filter((i) => i.jenis_produk === "fatwa").length;

  return {
    total_masail: enrichedList.length,
    total_kitab: totalKitab,
    total_bab: totalBab,
    total_pdf: dokumenPdfList.length,
    total_forum: forumsList.length,
    total_artikel: totalArtikel,
    total_with_pdf: totalWithPdf,
    total_putusan: totalPutusan,
    total_fatwa: totalFatwa,
  };
}
