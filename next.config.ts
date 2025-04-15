import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["firebasestorage.googleapis.com"],
  },
  experimental: {
    serverActions: {
      // Pindahkan allowedOrigins ke dalam serverActions
      allowedOrigins: [
        "http://192.168.18.216:3000",
        "http://192.168.18.216",
        "http://localhost:3000",
        "http://localhost",
      ],
    },
  },
  // Tambahkan konfigurasi untuk mengizinkan origin dev
  // Ini akan mengatasi peringatan cross-origin request
  // Format yang benar untuk allowedDevOrigins
  experimental: {
    allowedDevOrigins: [
      "http://192.168.18.216:3000",
      "http://192.168.18.216",
      "http://localhost:3000",
      "http://localhost",
    ],
  },
  async headers() {
    return [
      {
        // Tambahkan header CORS untuk semua rute
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // Atau tentukan domain spesifik
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
