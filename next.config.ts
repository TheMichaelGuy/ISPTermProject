import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  /** @type {import('next').NextConfig} */

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
};



export default nextConfig;
