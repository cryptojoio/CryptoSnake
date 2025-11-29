/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 忽略 TypeScript 报错，强行构建
    ignoreBuildErrors: true,
  },
  eslint: {
    // 忽略 ESLint 检查
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
