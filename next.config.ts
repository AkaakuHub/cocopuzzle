import type { NextConfig } from "next";
// const isProd = process.env.NODE_ENV === "production";
const nextConfig: NextConfig = {
	reactStrictMode: true,
	images: {
		unoptimized: true,
	},
	trailingSlash: true,
	output: "export",
	distDir: "out",
	// basePath: isProd ? "/cocopuzzle" : "",
	// assetPrefix: isProd ? "/cocopuzzle" : "",
	// publicRuntimeConfig: {
	// 	basePath: isProd ? "/cocopuzzle" : "",
	// }
};

export default nextConfig;