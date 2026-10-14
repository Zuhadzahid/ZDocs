import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page in this app depends on the signed-in user (cookie), so the
  // request-time rendering model is the right fit. Cache Components would add
  // Suspense/`use cache` ceremony without a payoff for a per-user editor.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
