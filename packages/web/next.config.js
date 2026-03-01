/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 启用 Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // 输出独立应用（用于 Docker 部署）
  output: 'standalone',
  // 配置 transpilePackages
  transpilePackages: ['@equipment/shared', '@equipment/ui'],
  // 禁用 ESLint 在构建时（可选）
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 禁用 TypeScript 类型检查在构建时（可选）
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
