import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    outputFileTracingIncludes: {
      '/app/**': ['./emailTemplates/**'],
    },
};

export default nextConfig;
