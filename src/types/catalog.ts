export type JenisProdukTarjih = "putusan" | "fatwa" | "fikih_tematik" | "tuntunan";

export type SumberTingkat =
  | "pp_muhammadiyah"
  | "munas_tarjih"
  | "mtt_fatwa"
  | "pwm_tarjih"
  | "suara_muhammadiyah";

export type TipeAkses = "pdf" | "artikel" | "keduanya";

export interface TabwibItem {
  id: string;
  parent_id: string | null;
  level: 1 | 2 | 3;
  kode: string;
  nama_id: string;
  nama_ar: string;
  slug: string;
  deskripsi?: string;
}

export interface TabwibNode extends TabwibItem {
  count: number;
  children: TabwibNode[];
}

export interface ForumItem {
  id: string;
  nama: string;
  singkatan: string;
  tingkat: SumberTingkat;
  tahun: number | null;
  lokasi?: string;
  penyelenggara: string;
  situs_sumber?: string;
  deskripsi?: string;
}

export type PdfHostType = "archive_org" | "direct_pdf" | "gdrive";

export interface DokumenPdfItem {
  id: string;
  forum_id: string;
  judul: string;
  judul_ar?: string;
  url_pdf: string;
  url_halaman_sumber: string;
  tipe_host: PdfHostType;
  archive_identifier?: string;
  total_halaman?: number;
  sumber_label: string;
  tahun?: number;
  deskripsi?: string;
}

export interface MasailPdfRef {
  dokumen_pdf_id: string;
  halaman_mulai: number;
  halaman_selesai?: number;
}

export interface MasailArtikelRef {
  url: string;
  nama_sumber: string;
  tanggal_terbit?: string;
}

export interface TarjihItem {
  id: string;
  slug: string;
  judul: string;
  tabwib_id: string;
  tabwib_sekunder?: string[];
  forum_id: string;
  tahun?: number;
  jenis_produk: JenisProdukTarjih;
  ringkasan_singkat: string;
  tags: string[];
  tipe_akses: TipeAkses;
  pdf?: MasailPdfRef;
  artikel?: MasailArtikelRef;
}

export interface EnrichedTarjihItem extends TarjihItem {
  tabwib_nama: string;
  tabwib_nama_ar: string;
  tabwib_kitab_id: string;
  tabwib_kitab_nama: string;
  forum_nama: string;
  forum_singkatan: string;
  forum_tingkat: SumberTingkat;
  pdf_dokumen?: DokumenPdfItem;
}

export interface ReaderArticleResponse {
  ok: boolean;
  source_mode: "live_reader" | "fallback";
  item_id: string;
  title: string;
  source_name: string;
  source_url: string;
  published_date?: string;
  author?: string;
  content_html?: string;
  fetched_at: string;
  error_reason?: string;
}
