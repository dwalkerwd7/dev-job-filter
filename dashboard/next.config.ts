import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    basePath: process.env.BASE_PATH || "",
    assetPrefix: (process.env.BASE_PATH || "") + "/dashboard"
};

export default nextConfig;
