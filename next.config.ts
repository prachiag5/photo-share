import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // List every domain you'll serve images FROM
    remotePatterns: [
      {
        protocol: "https",
        hostname: "your-storage-bucket.supabase.co", // or S3, Cloudinary, etc.
      },
      {
        protocol: "https",
        hostname: "picsum.photos", // for local dev with placeholder images
      },
    ],
  },
  experimental: {
    // Enables the new React compiler for automatic memo optimization
    // (Next.js 15+ / React 19)
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
