/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/aws-endpoint',
        destination: 'https://7ee6gxhkc3.execute-api.us-east-1.amazonaws.com/def/latest?device_id=unknown',
      },
    ];
  },
}

export default nextConfig
