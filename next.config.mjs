import withPWAInit from '@ducanh2912/next-pwa';

const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  transpilePackages: ['firebase-admin'],
};

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    // Never let the service worker cache /wizard HTML — prevents stale unstyled pages after deploys.
    runtimeCaching: [
      {
        urlPattern: /^\/wizard/,
        handler: 'NetworkOnly',
      },
    ],
  },
});

export default withPWA(nextConfig);
