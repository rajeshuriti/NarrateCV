/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep packages with native binaries or Node.js-only code out of the
    // webpack bundle — they're required only in API routes, not the browser.
    serverComponentsExternalPackages: [
      'pdf-parse',
      '@remotion/renderer',
      '@remotion/bundler',
      '@remotion/cli',
      '@rspack/core',
      '@rspack/binding',
      'esbuild',
    ],
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent Node.js built-ins from being bundled for the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;
