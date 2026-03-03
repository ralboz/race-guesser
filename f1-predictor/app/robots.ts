import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/race/", "/leader-board/", "/groups/"],
      },
    ],
    sitemap: "https://gridguesser.com/sitemap.xml",
  };
}
