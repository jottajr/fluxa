import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fluxa",
    short_name: "Fluxa",
    description: "Gestão financeira pessoal",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#7c6cf0",
    icons: [
      {
        src: "/fluxa-icon.png",
        sizes: "960x960",
        type: "image/png",
      },
    ],
  };
}
