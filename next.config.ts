/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ESLint は独立ジョブ（npm run lint）で実施するため、build中は無視
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 外部アバター画像の表示許可（Google ログイン画像など）
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com',
      'lh5.googleusercontent.com',
      'lh6.googleusercontent.com',
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh4.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh5.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh6.googleusercontent.com', pathname: '/**' },
    ],
  },
};
export default nextConfig;
