import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow connections from other devices on local network for dev
  // Allow connections from other devices on local network for dev
  allowedDevOrigins: ['192.168.1.47', 'localhost', '127.0.0.1'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' }
    ],
  },
  /* config options here */
};

export default nextConfig;
