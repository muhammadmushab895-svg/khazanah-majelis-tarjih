import * as cheerio from "cheerio";
import type { EnrichedTarjihItem, ReaderArticleResponse } from "@/types/catalog";

const ALLOWED_HOSTS = new Set([
  "fatwatarjih.or.id",
  "www.fatwatarjih.or.id",
  "tarjih.or.id",
  "www.tarjih.or.id",
  "muhammadiyah.or.id",
  "www.muhammadiyah.or.id",
]);

const ALLOWED_TAGS = new Set([
  "p",
  "h2",
  "h3",
  "h4",
  "h5",
  "ul",
  "ol",
  "li",
  "blockquote",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "br",
  "hr",
  "a",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "sup",
  "sub",
  "span",
  "div",
]);

interface CacheEntry {
  expiresAt: number;
  data: ReaderArticleResponse;
}

const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_SIZE = 40;
const articleCache = new Map<string, CacheEntry>();

function setCache(key: string, data: ReaderArticleResponse) {
  if (articleCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = articleCache.keys().next().value;
    if (oldestKey) articleCache.delete(oldestKey);
  }
  articleCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  });
}

function getCache(key: string): ReaderArticleResponse | null {
  const entry = articleCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    articleCache.delete(key);
    return null;
  }
  return entry.data;
}

function isArabicHeavy(text: string): boolean {
  const cleaned = text.replace(/[\s0-9.,:;!?()[\]{}"'«»\-–—/\\]/g, "");
  if (cleaned.length < 10) return false;
  const arabicChars = (cleaned.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  if (arabicChars < 12) return false;
  return arabicChars / cleaned.length >= 0.45;
}

function sanitizeAndFormatHtml(rawHtml: string, baseUrl: string): string {
  const $ = cheerio.load(`<div id="__root">${rawHtml}</div>`);
  const root = $("#__root");

  // Remove unwanted elements & WordPress noise
  root
    .find(
      "script, style, noscript, iframe, form, input, button, svg, nav, aside, footer, header, " +
        ".sharedaddy, .jp-relatedposts, .yarpp-related, .addtoany_share_save_container, " +
        ".heateor_sss_sharing_container, .essb_links, .post-share, .share-buttons, " +
        ".related-posts, .post-navigation, .nav-links, .comments-area, .wp-block-buttons, " +
        ".ez-toc-container, #ez-toc-container, .toc_widget, .crp_related, .saboxplugin-wrap, " +
        ".post-tags, .tags-links, .entry-tags, .td-post-source-tags, .post-meta-tags, .tagcloud, " +
        ".code-block, .ads, .advertisement, figure.wp-block-embed"
    )
    .remove();

  // Remove trailing tag blocks & Cloudflare email-protection artifacts
  root.find("a[href*='/cdn-cgi/l/email-protection']").each((_, el) => {
    $(el).replaceWith("redaksi@tarjih.or.id");
  });
  root.find("div").each((_, el) => {
    const txt = $(el).text().replace(/\s+/g, " ").trim();
    if (/^tags?\s+#/i.test(txt) && txt.length < 350) {
      $(el).remove();
    }
  });

  // Remove promotional or share boilerplate paragraphs
  root.find("p, div").each((_, el) => {
    const txt = $(el).text().replace(/\s+/g, " ").trim();
    if (
      /^(baca juga|lihat juga|download|unduh pdf|bagikan|share this|ikuti kami|sumber:|tag:)/i.test(txt) &&
      txt.length < 160 &&
      $(el).find("p").length === 0
    ) {
      if (!/majelis tarjih|fatwa|putusan|suara muhammadiyah/i.test(txt)) {
        $(el).remove();
      }
    }
  });

  // Unwrap images & figures cleanly (text-focused lightweight reader)
  root.find("img, picture, source, video, audio").remove();

  // Sanitize tags and attributes
  root.find("*").each((_, el) => {
    if (el.type !== "tag") return;
    const tag = el.name.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      if (tag === "h1") {
        el.name = "h2";
      } else if (tag === "section" || tag === "article" || tag === "main" || tag === "figure" || tag === "figcaption") {
        el.name = "div";
      } else {
        $(el).replaceWith($(el).contents());
        return;
      }
    }

    const attribs = el.attribs || {};
    const keepHref = tag === "a" ? attribs.href : undefined;
    const keepColspan = tag === "td" || tag === "th" ? attribs.colspan : undefined;
    const keepRowspan = tag === "td" || tag === "th" ? attribs.rowspan : undefined;

    for (const attr of Object.keys(attribs)) {
      $(el).removeAttr(attr);
    }

    if (keepHref) {
      try {
        const resolved = new URL(keepHref, baseUrl);
        if (resolved.protocol === "http:" || resolved.protocol === "https:") {
          $(el).attr("href", resolved.toString());
          $(el).attr("target", "_blank");
          $(el).attr("rel", "noopener noreferrer");
        }
      } catch {
        // drop invalid href
      }
    }
    if (keepColspan && /^\d+$/.test(keepColspan)) $(el).attr("colspan", keepColspan);
    if (keepRowspan && /^\d+$/.test(keepRowspan)) $(el).attr("rowspan", keepRowspan);
  });

  // Auto-detect Arabic dalil blocks (Ayat Al-Qur'an, Hadis, Qawaid Fiqhiyyah)
  root.find("p, blockquote, div, li").each((_, el) => {
    const $el = $(el);
    if ($el.find("p, blockquote, ul, ol, table").length > 0) return;
    const text = $el.text().replace(/\s+/g, " ").trim();
    if (!text) {
      if (el.name === "p" || el.name === "div") $el.remove();
      return;
    }
    if (isArabicHeavy(text)) {
      $el.attr("dir", "rtl");
      $el.attr("class", "arabic-dalil");
    }
  });

  // Remove empty containers
  root.find("div, span, blockquote").each((_, el) => {
    const $el = $(el);
    if (!$el.text().trim() && $el.find("br, hr").length === 0) {
      $el.remove();
    }
  });

  return root.html()?.trim() || "";
}

export async function fetchLiveTarjihArticle(
  item: EnrichedTarjihItem
): Promise<ReaderArticleResponse> {
  const nowIso = new Date().toISOString();
  const artikel = item.artikel;

  if (!artikel?.url) {
    return {
      ok: false,
      source_mode: "fallback",
      item_id: item.id,
      title: item.judul,
      source_name: item.forum_nama,
      source_url: item.pdf_dokumen?.url_halaman_sumber || "",
      fetched_at: nowIso,
      error_reason: "Pembahasan ini tersedia dalam bentuk Dokumen PDF Online.",
    };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(artikel.url);
  } catch {
    return {
      ok: false,
      source_mode: "fallback",
      item_id: item.id,
      title: item.judul,
      source_name: artikel.nama_sumber,
      source_url: artikel.url,
      fetched_at: nowIso,
      error_reason: "URL sumber tidak valid.",
    };
  }

  if (!ALLOWED_HOSTS.has(parsedUrl.hostname.toLowerCase())) {
    return {
      ok: false,
      source_mode: "fallback",
      item_id: item.id,
      title: item.judul,
      source_name: artikel.nama_sumber,
      source_url: artikel.url,
      fetched_at: nowIso,
      error_reason: "Domain sumber tidak termasuk daftar situs resmi Majelis Tarjih.",
    };
  }

  const cached = getCache(item.id);
  if (cached) return cached;

  let res: Response | null = null;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      res = await fetch(artikel.url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,ar;q=0.7",
        },
      });
      clearTimeout(timeout);
      if (res.ok || res.status < 500) break;
    } catch (err) {
      clearTimeout(timeout);
      lastErr = err;
    }
  }

  try {
    if (!res) throw lastErr || new Error("Fetch failed");

    if (!res.ok) {
      return {
        ok: false,
        source_mode: "fallback",
        item_id: item.id,
        title: item.judul,
        source_name: artikel.nama_sumber,
        source_url: artikel.url,
        published_date: artikel.tanggal_terbit,
        fetched_at: nowIso,
        error_reason: `Situs sumber merespons status HTTP ${res.status}. Silakan buka tautan asli.`,
      };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const extractedTitle =
      $("h1.entry-title").first().text().trim() ||
      $("article h1").first().text().trim() ||
      $("h1").first().text().trim() ||
      item.judul;

    const publishedDate =
      $('meta[property="article:published_time"]').attr("content")?.slice(0, 10) ||
      $("time.entry-date").attr("datetime")?.slice(0, 10) ||
      $("time").first().attr("datetime")?.slice(0, 10) ||
      artikel.tanggal_terbit;

    const author =
      $('meta[name="author"]').attr("content")?.trim() ||
      $(".author-name, .entry-author-name, .byline a").first().text().trim() ||
      "Majelis Tarjih dan Tajdid PP Muhammadiyah";

    const selectors = [
      "article .entry-content",
      ".entry-content",
      ".post-content",
      ".td-post-content",
      ".single-content",
      "article .content",
      "article",
    ];

    let rawContent = "";
    for (const sel of selectors) {
      const node = $(sel).first();
      if (node.length) {
        const textLen = node.text().replace(/\s+/g, " ").trim().length;
        if (textLen >= 180) {
          rawContent = node.html() || "";
          break;
        }
      }
    }

    if (!rawContent) {
      return {
        ok: false,
        source_mode: "fallback",
        item_id: item.id,
        title: extractedTitle,
        source_name: artikel.nama_sumber,
        source_url: artikel.url,
        published_date: publishedDate,
        author,
        fetched_at: nowIso,
        error_reason: "Konten teks fatwa tidak terdeteksi secara otomatis. Anda tetap dapat membaca di situs sumber asli.",
      };
    }

    const cleanHtml = sanitizeAndFormatHtml(rawContent, artikel.url);
    if (!cleanHtml || cleanHtml.length < 100) {
      return {
        ok: false,
        source_mode: "fallback",
        item_id: item.id,
        title: extractedTitle,
        source_name: artikel.nama_sumber,
        source_url: artikel.url,
        published_date: publishedDate,
        author,
        fetched_at: nowIso,
        error_reason: "Isi halaman sangat singkat atau berupa lampiran PDF di situs asal.",
      };
    }

    const response: ReaderArticleResponse = {
      ok: true,
      source_mode: "live_reader",
      item_id: item.id,
      title: extractedTitle,
      source_name: artikel.nama_sumber,
      source_url: artikel.url,
      published_date: publishedDate,
      author,
      content_html: cleanHtml,
      fetched_at: nowIso,
    };

    setCache(item.id, response);
    return response;
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      source_mode: "fallback",
      item_id: item.id,
      title: item.judul,
      source_name: artikel.nama_sumber,
      source_url: artikel.url,
      published_date: artikel.tanggal_terbit,
      fetched_at: nowIso,
      error_reason: isAbort
        ? "Koneksi ke situs resmi Majelis Tarjih melewati batas waktu. Silakan coba muat ulang atau buka sumber asli."
        : "Gagal mengambil konten langsung dari situs sumber.",
    };
  }
}
