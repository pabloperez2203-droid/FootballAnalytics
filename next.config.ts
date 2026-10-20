import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 95],
  },
  // Permitir explícitamente acceso desde móvil y red local para HMR y recursos dev
  allowedDevOrigins: [
    "192.168.1.162",
    "192.168.1.162:3000",
    "192.168.1.*",
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
  ],
};

export default nextConfig;
