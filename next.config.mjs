/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['dnleokdzqrvlvivmibrr.supabase.co'], // Replace with your Supabase storage domain
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
