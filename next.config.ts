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
};

export default nextConfig;
