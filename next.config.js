/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['canvas']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        canvas: 'canvas',
        'utf-8-validate': 'utf-8-validate',
        'bufferutil': 'bufferutil'
      });
    }
    return config;
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  }
}

module.exports = nextConfig