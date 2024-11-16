/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*'
      }
    ]
  },
  images: {
    domains: ['img.clerk.com', 'images.clerk.dev', 'lh3.googleusercontent.com'],
  }
};

export default nextConfig;