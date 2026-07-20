import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth avatars
      },
    ],
    formats: ['image/webp'],
    deviceSizes: [640, 768, 1024, 1280],
    imageSizes: [64, 128, 256, 384],
  },

  // PWA headers
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
    ];
  },

  // Performance
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
