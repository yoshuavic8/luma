/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Matikan strict mode untuk mengurangi warning
  swcMinify: true,
  images: {
    domains: ['localhost'], // Tambahkan domain yang diizinkan untuk gambar
  },
  eslint: {
    ignoreDuringBuilds: true, // Abaikan error ESLint saat build
  },
  typescript: {
    ignoreBuildErrors: true, // Abaikan error TypeScript saat build
  },
  experimental: {
    // Fitur eksperimental yang berguna
    serverActions: true,
    serverComponentsExternalPackages: [],
  },
}

export default nextConfig
