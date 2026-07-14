import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@epg/design-tokens"],
  output: "standalone",
};

export default nextConfig;
