import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "মিল সিস্টেম — Meal System",
    short_name: "মিল সিস্টেম",
    description: "মেস ও হোস্টেলের মিল, বাজার আর টাকার হিসাব",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f1f5f1",
    theme_color: "#0e5a47",
    lang: "bn",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
