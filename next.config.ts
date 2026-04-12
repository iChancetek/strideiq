import type { NextConfig } from "next";

import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Disable in dev to allow Turbopack
  register: true,
});

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  /* config options here */
  // Silence Turbopack/Webpack conflict errors if they persist
  // @ts-ignore
  turbopack: {},
};

export default isDev ? nextConfig : withPWA(nextConfig);
