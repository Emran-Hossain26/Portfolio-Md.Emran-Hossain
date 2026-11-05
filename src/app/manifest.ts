import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — Portfolio`,
    short_name: site.name,
    description:
      "IT infrastructure, cybersecurity and full-stack development portfolio",
    start_url: "/",
    display: "standalone",
    background_color: "#0C1524",
    theme_color: "#2F6BFF",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}