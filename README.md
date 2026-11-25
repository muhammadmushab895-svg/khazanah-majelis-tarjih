# Khazanah Majelis Tarjih Muhammadiyah (PWA Full Online)

Aplikasi web progresif (PWA) mandiri dan ringan berbasis **Next.js 15 App Router** untuk menelusuri **Himpunan Putusan Tarjih (HPT)**, **Tanfidz Munas Tarjih Muhammadiyah**, **Fikih Tematik**, **Pedoman Hisab & KHGT**, serta **Fatwa Tarjih** dalam susunan *Tabwib* yang sistematis.

## Karakteristik Utama
- **100% Mandiri & Full Online**: Hanya menyimpan indeks katalog JSON ringan; seluruh teks fatwa dan dokumen PDF dialirkan langsung secara online dari sumber resmi (`tarjih.or.id`, `fatwatarjih.or.id`, dan arsip terbuka).
- **Tanpa Panel Admin**: Fokus penuh pada kecepatan pencarian, kenyamanan baca, dan kemudahan navigasi jamaah & peneliti.
- **Tabwib HPT Muhammadiyah**: 7 Kitab Utama dan 30 Bab (Aqidah & Manhaj Tarjih, Ibadah, Muamalah, Keluarga Sakinah, Hisab-Falak & KHGT, Fikih Kebangsaan-Ekologi, serta Fikih Kontemporer-Medis-Digital).
- **Live Fatwa Reader**: Membaca naskah fatwa langsung di dalam aplikasi dengan deteksi otomatis kotak dalil Arab (`RTL`, font *Amiri*), pengatur ukuran huruf, dan mode baca malam.
- **Pustaka PDF Online & Filter Masalah per-PDF**: Streaming HTTP Range (`/api/pdf-proxy`) dilengkapi panel filter masalah di dalam setiap PDF dengan nomor halaman hasil audit isi dokumen.

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000 di browser.
