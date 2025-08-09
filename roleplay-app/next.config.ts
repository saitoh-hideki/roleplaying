import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // LintのErrorで本番ビルドを止めない（型チェックは別途tscで担保）
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
