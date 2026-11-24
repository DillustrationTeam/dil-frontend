import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },

  /**
   * Proxy API qua chính Next để dev chạy được ở MỌI cách truy cập
   * (localhost, LAN, VS Code port-forward, devtunnel, Cloudflare tunnel):
   *  - Trình duyệt gọi cùng origin (`/api/v1/...`) → không cần CORS, không bị chặn http→https.
   *  - Chỉ cần forward cổng 3000, không phải forward thêm 5075.
   *  - Ảnh demo backend trả URL tuyệt đối `/demo-uploads/...` cũng được proxy theo.
   * Đổi backend bằng biến API_PROXY_TARGET (mặc định http://localhost:5075).
   */
  async rewrites() {
    const target = process.env.API_PROXY_TARGET || 'http://localhost:5075';
    return [
      { source: '/api/v1/:path*', destination: `${target}/api/v1/:path*` },
      { source: '/demo-uploads/:path*', destination: `${target}/demo-uploads/:path*` },
      { source: '/uploads/:path*', destination: `${target}/uploads/:path*` },
    ];
  },

  async redirects() {
    return [
      {
        source: '/creator/rate-card',
        destination: '/creator/services',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
