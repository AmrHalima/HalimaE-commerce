"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";

interface FooterProps {
    logo?: {
        url: string;
        src: string;
        alt: string;
        title: string;
    };
    sections?: Array<{
        title: string;
        links: Array<{ name: string; href: string }>;
    }>;
    description?: string;
    socialLinks?: Array<{
        icon: React.ReactNode;
        href: string;
        label: string;
    }>;
    copyright?: string;
    legalLinks?: Array<{
        name: string;
        href: string;
    }>;
}

const defaultSections = [
    {
        title: "Shop",
        links: [
            { name: "All Products", href: "#" },
            { name: "Categories", href: "#" },
            { name: "New Arrivals", href: "#" },
            { name: "Best Sellers", href: "#" },
        ],
    },
    {
        title: "Company",
        links: [
            { name: "About Us", href: "#" },
            { name: "Our Story", href: "#" },
            { name: "Blog", href: "#" },
            { name: "Careers", href: "#" },
        ],
    },
    {
        title: "Support",
        links: [
            { name: "Contact", href: "#" },
            { name: "FAQs", href: "#" },
            { name: "Shipping & Returns", href: "#" },
            { name: "Privacy Policy", href: "#" },
        ],
    },
];

const defaultLegalLinks = [
    { name: "Terms & Conditions", href: "#" },
    { name: "Privacy Policy", href: "#" },
];

const Footer = ({
    logo = {
        url: "/",
        src: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg", // fallback
        alt: "Halima Logo",
        title: "Halima",
    },
    sections = defaultSections,
    description = "Halima is your trusted e-commerce brand bringing you quality products and seamless shopping experience.",
   // socialLinks = [],
    copyright = "© 2024 Halima. All rights reserved.",
    legalLinks = defaultLegalLinks,
}: FooterProps) => {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <footer className="py-32 bg-muted/30">
            <div className="container mx-auto px-5 md:px-6">
                <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-left">
                    <div className="flex w-full flex-col justify-between gap-6 lg:items-start">
                        {/* Logo */}
                        <div className="flex items-center gap-2 lg:justify-start">
                            {!mounted ? (
                                <div className="h-[110px] w-[380px]" />
                            ) : (
                                <Link href={logo.url}>
                                    <Image
                                        quality={30}
                                        src={
                                            resolvedTheme === "dark"
                                                ? "/logoDark.svg"
                                                : "/logo.svg"
                                        }
                                        alt={logo.alt}
                                        width={380}
                                        height={190}
                                    />
                                </Link>
                            )}
                        </div>
                        <p className="text-muted-foreground max-w-[70%] text-sm">
                            {description}
                        </p>
                    </div>

                    {/* Sections */}
                    <div className="grid w-full gap-6 md:grid-cols-3 lg:gap-20">
                        {sections.map((section, idx) => (
                            <div key={idx}>
                                <h3 className="mb-4 font-bold">
                                    {section.title}
                                </h3>
                                <ul className="text-muted-foreground space-y-3 text-sm">
                                    {section.links.map((link, linkIdx) => (
                                        <li
                                            key={linkIdx}
                                            className="hover:text-primary font-medium"
                                        >
                                            <a href={link.href}>{link.name}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer bottom */}
                <div className="text-muted-foreground mt-8 flex flex-col justify-between gap-4 border-t py-8 text-xs font-medium md:flex-row md:items-center md:text-left">
                    <p className="order-2 lg:order-1">{copyright}</p>
                    <ul className="order-1 flex flex-col gap-2 md:order-2 md:flex-row">
                        {legalLinks.map((link, idx) => (
                            <li key={idx} className="hover:text-primary">
                                <a href={link.href}>{link.name}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </footer>
    );
};

export { Footer };
