import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { globalNotFound: true },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "firebasestorage.googleapis.com" }],
  },
  // AZ əsas dildir: "/" və "/events" kimi ünvanlar daxildə "/az/..." marşrutuna yönəlir.
  // "/en/..." ingiliscə versiyadır. "/admin", "/api", statik fayllar toxunulmur (afterFiles).
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        { source: "/", destination: "/az" },
        { source: "/:path((?!en(?:/|$)|az(?:/|$)|api/|admin(?:/|$)|_next/).*)", destination: "/az/:path" },
      ],
      fallback: [],
    };
  },
  async redirects() {
    return [
      { source: "/az", destination: "/", permanent: true },
      { source: "/az/:path*", destination: "/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
