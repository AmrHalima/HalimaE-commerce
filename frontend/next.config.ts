import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    typedRoutes: true,
    images: {
        qualities: [30, 50, 75, 100],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "ecommerce.routemisr.com",
                pathname: "/Route-Academy-*/**",
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "10mb", // Increase limit for image uploads
        },
    },
};

export default nextConfig;
