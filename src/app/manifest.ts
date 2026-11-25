import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Khazanah Majelis Tarjih Muhammadiyah",
    short_name: "Majelis Tarjih",
    description:
      "PWA full online yang ringan dengan tabwib HPT rapi untuk mengakses langsung Putusan Tarjih, Fatwa Tarjih, dan PDF Fikih Tematik Majelis Tarjih dan Tajdid Muhammadiyah.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7f9fc",
    theme_color: "#0b4f8c",
    lang: "id",
    categories: ["education", "books", "reference"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
