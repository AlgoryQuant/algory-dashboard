import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server binds to 0.0.0.0, so the browser origin is 127.0.0.1.
  // Next 16 blocks that HMR socket by default, and the React debug channel
  // never arrives — hydrateRoot then never runs.
  allowedDevOrigins: ['127.0.0.1'],
};

export default nextConfig;
