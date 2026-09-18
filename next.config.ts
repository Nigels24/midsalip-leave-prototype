import type { NextConfig } from "next";

// Static export: `npm run build` produces an `out/` folder that can be opened on any
// web server or GitHub Pages. For GitHub Pages under /<repo>, build with
//   NEXT_PUBLIC_BASE_PATH=/<repo> npm run build
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
