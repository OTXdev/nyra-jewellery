/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://nyra-backend-a0qr.onrender.com/api/:path*",
      },
    ]
  },
}

export default nextConfig
