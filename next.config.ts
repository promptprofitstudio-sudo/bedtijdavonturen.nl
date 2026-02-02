import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  // FORCE firebase-admin to be bundled (not externalized with hashes)
  // transpilePackages forces bundling, serverExternalPackages externalizes
  transpilePackages: ['firebase-admin'],
};

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWA(nextConfig);
