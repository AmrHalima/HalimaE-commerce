import type { Metadata } from "next";
import Provider from "../_Components/Provider/Provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
    title: "Halima Store",
    description:
        "E-commerce store built with Next.js 15, TypeScript, and Tailwind CSS",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning={true}>
            <body suppressHydrationWarning={true}>
                <Provider>{children}</Provider>
                <SpeedInsights />
                <Analytics />
            </body>
        </html>
    );
}
