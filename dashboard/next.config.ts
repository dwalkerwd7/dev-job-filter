import type { NextConfig } from "next";
import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";

const nextConfig: NextConfig = {
  /* config options here */
};

export default varlockNextConfigPlugin()(nextConfig);
