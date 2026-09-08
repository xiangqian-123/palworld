/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 根路径重定向到默认语言（原先由 app/page.tsx 承担，
  // 现在根布局下沉到 [locale] 后改用配置层重定向）。
  async redirects() {
    return [{ source: "/", destination: "/zh-CN", permanent: false }];
  },
};

export default nextConfig;
