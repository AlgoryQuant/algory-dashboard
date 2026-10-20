import type { NextConfig } from "next";

// The dev server listens on every interface. Next 16 only trusts `localhost`
// for the HMR socket that carries the React debug channel. Any other browser
// origin is rejected, hydrateRoot never runs, and clicks never attach.
// Patterns are matched per host label (see allowedDevOrigins). RFC1918 covers
// the Network address `next dev` prints when this machine's LAN IP changes.
const privateLanDevOrigins = [
  "127.0.0.1",
  "192.168.68.114",
  "192.168.*.*",
  "10.*.*.*",
  ...Array.from({ length: 16 }, (_, octet) => `172.${16 + octet}.*.*`),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: privateLanDevOrigins,
  // Hide the Next.js / Turbopack on-screen badge during `next dev`
  // (parents viewing a shared local URL should not see it). Production
  // builds never show this indicator.
  devIndicators: false,
  // Disables Clerk keyless mode (the "Configure your application" floating
  // panel). Prefer real Production keys on Vercel for the parent plan link.
  env: {
    NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: "true",
  },
};

export default nextConfig;
