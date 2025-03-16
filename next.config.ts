import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    outputFileTracingIncludes: {
      '/app/**': ['./lib/send-emails/emailTemplates/**'],
    },
};

export default nextConfig;
