import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tenderos.onrender.com";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
