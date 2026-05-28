/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    'enlisted-buddhist-gave.ngrok-free.dev',
  ],

  turbopack: {
    root: __dirname,
  },

  // Pexels CDN already returns optimized + width-sized images via query
  // params (`w`, `auto=compress`). We feed those URLs to next/image with
  // `unoptimized` per-instance so we skip the redundant Next optimizer
  // but keep its layout/sizing semantics. Remote patterns are listed for
  // any future migration that does want the Next optimizer.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com', pathname: '/**' },
      { protocol: 'https', hostname: 'videos.pexels.com', pathname: '/**' },
    ],
  },
}

module.exports = nextConfig
