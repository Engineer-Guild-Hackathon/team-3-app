/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ESLint は独立ジョブ（npm run lint）で実施するため、build中は無視
  eslint: {
    ignoreDuringBuilds: true,
  },
};
export default nextConfig;
