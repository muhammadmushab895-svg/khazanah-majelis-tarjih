import type { Metadata, Viewport } from "next";
import { Amiri, Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { PwaRegister } from "@/components/PwaRegister";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Khazanah Majelis Tarjih Muhammadiyah — Putusan, HPT & Fatwa Online",
    template: "%s | Khazanah Majelis Tarjih Muhammadiyah",
  },
  description:
    "PWA full online yang ringan dengan tabwib HPT rapi untuk membaca langsung Fatwa Tarjih, Putusan Munas Tarjih, Fikih Tematik, KHGT, dan Pustaka PDF resmi Majelis Tarjih dan Tajdid PP Muhammadiyah.",
  applicationName: "Khazanah Majelis Tarjih Muhammadiyah",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Majelis Tarjih",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b4f8c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${newsreader.variable} ${amiri.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-[#f7f9fc] text-[#142230]">
        <PwaRegister />
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="mt-14 border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <p className="font-bold text-slate-800">
                Khazanah Majelis Tarjih Muhammadiyah
              </p>
              <p className="mt-1">
                Aplikasi indeks &amp; pembaca online ringan (PWA). Naskah fatwa
                dan dokumen PDF dialirkan langsung dari situs resmi Majelis
                Tarjih &amp; Tajdid PP Muhammadiyah (tarjih.or.id,
                fatwatarjih.or.id) dan arsip terbuka.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3 text-slate-600">
              <a
                href="https://tarjih.or.id"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-[#0b4f8c] hover:underline"
              >
                tarjih.or.id
              </a>
              <span className="text-slate-300">•</span>
              <a
                href="https://fatwatarjih.or.id"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-[#0b4f8c] hover:underline"
              >
                fatwatarjih.or.id
              </a>
              <span className="text-slate-300">•</span>
              <a
                href="https://muhammadiyah.or.id"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-[#0b4f8c] hover:underline"
              >
                muhammadiyah.or.id
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
