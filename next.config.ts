import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // forbidden() answers 403 only when this is on.
    authInterrupts: true,
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
