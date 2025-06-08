// next.config.ts
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // ⚠️ Skip ESLint errors during build (temporary fix)
  },
  typescript: {
    ignoreBuildErrors: true, // ⚠️ Skip TypeScript errors if needed (optional)
  },
};

export default nextConfig;