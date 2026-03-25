/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  // Allow Electron to use the Next.js app
  webpack: (config) => {
    config.target = 'electron-preload';
    return config;
  },
}

export default nextConfig
