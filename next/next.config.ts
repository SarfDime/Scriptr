import bundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'

// Initialize bundle analyzer with type safety
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

// Define base Next.js configuration with TypeScript types
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflarestorage.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'files.scriptr.uk',
        port: '',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [480, 768, 810, 960, 1024, 1200, 1680],
    imageSizes: [16, 32, 48, 64, 96, 128],
    qualities: [65, 85, 91],
  },
  reactCompiler: true,
} satisfies NextConfig

const bundleAnalyzerConfig = withBundleAnalyzer(nextConfig)

export default bundleAnalyzerConfig
