import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bhawani Hardware",
    short_name: "Bhawani",
    description: "Hardware catalogue and business management",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f2e9",
    theme_color: "#173b2f",
    orientation: "portrait-primary",
    categories: ["business", "shopping"],
    icons: [
      {
        src: "/icons/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
