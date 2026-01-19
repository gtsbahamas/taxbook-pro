/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip ESLint during builds - run lint separately in CI
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Keep TypeScript type checking during builds
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
