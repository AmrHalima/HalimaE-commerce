import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Award,
    Calendar,
    Heart,
    Instagram,
    Facebook,
    Twitter,
    Youtube,
    Mail,
    Sparkles,
    Users,
    TrendingUp,
} from "lucide-react";

// SEO Metadata
export const metadata: Metadata = {
    title: "About Halima — 30 Years of Design & Service Excellence",
    description:
        "Halima, founded in 1995, creates beloved women's fashion known for elegant designs and exceptional service. Learn our story, mission, and social channels.",
    keywords:
        "Halima, women's fashion, abaya, 30 years, design, craftsmanship, Halima story",
    openGraph: {
        title: "About Halima",
        description: "30 years of design excellence and market influence.",
        images: [
            {
                url: "/images/about/og-about.jpg",
                width: 1200,
                height: 630,
                alt: "Halima - 30 Years of Excellence",
            },
        ],
    },
};

// JSON-LD Structured Data
const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Halima",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://halima.com",
    logo:
        (process.env.NEXT_PUBLIC_BASE_URL || "https://halima.com") +
        "/images/logo.png",
    foundingDate: "1995",
    founders: [
        {
            "@type": "Person",
            name: "Halima Founder",
        },
    ],
    description:
        "Halima is a womenswear house founded in 1995. Over 30 years Halima is known for elegant design, high-quality craft, and service that influenced market trends.",
    sameAs: [
        "https://instagram.com/halima",
        "https://facebook.com/halima",
        "https://twitter.com/halima",
    ],
};

const milestones = [
    {
        year: "1995",
        title: "Founded",
        description:
            "Halima atelier opens; first bespoke collections launched.",
    },
    {
        year: "2005",
        title: "Retail Expansion",
        description: "Flagship store and e-commerce launch.",
    },
    {
        year: "2015",
        title: "Public Listing",
        description: "Company goes public; broad retail expansion.",
    },
    {
        year: "2020",
        title: "Global Recognition",
        description: "Regional awards for design and service excellence.",
    },
    {
        year: "2025",
        title: "30 Years",
        description: "Three decades of design, service, and market influence.",
    },
];

const values = [
    { icon: Sparkles, label: "Craftsmanship" },
    { icon: Heart, label: "Customer-first service" },
    { icon: Award, label: "Design integrity" },
    { icon: TrendingUp, label: "Sustainability" },
];

const awards = [
    "Design House of the Year — 2020",
    "Best Customer Experience — 2022",
    "Featured in Vogue Arabia, Harper's Bazaar",
];

const socialChannels = [
    {
        id: "instagram",
        name: "Instagram",
        url: "https://instagram.com/halima",
        icon: Instagram,
        showFollow: true,
    },
    {
        id: "facebook",
        name: "Facebook",
        url: "https://facebook.com/halima",
        icon: Facebook,
        showFollow: true,
    },
    {
        id: "x",
        name: "X / Twitter",
        url: "https://twitter.com/halima",
        icon: Twitter,
        showFollow: true,
    },
    {
        id: "youtube",
        name: "YouTube",
        url: "https://youtube.com/halima",
        icon: Youtube,
        showFollow: false,
    },
];

const faqs = [
    {
        question: "When was Halima founded?",
        answer: "Halima was founded in 1995 and celebrates 30 years of design and service in 2025.",
    },
    {
        question: "What makes Halima unique?",
        answer: "Design-first approach, rigorous quality control, and customer care that extends post-sale.",
    },
];

export default function AboutPage() {
    return (
        <>
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredData),
                }}
            />

            <div className="min-h-screen">
                {/* Hero Section */}
                <section className="relative h-[480px] w-full overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background">
                    <div className="absolute inset-0 bg-[url('/temp-images/product-1.png')] bg-cover bg-center opacity-10" />
                    <div className="container relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-4 text-center">
                        <Badge
                            variant="outline"
                            className="mb-4 border-primary/40 text-primary"
                        >
                            Our Story
                        </Badge>
                        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                            Halima — 30 Years of
                            <br />
                            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                Craft & Market Influence
                            </span>
                        </h1>
                        <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
                            Founded in 1995; admired for thoughtful design,
                            service, and measurable market impact.
                        </p>
                        <Link href="/products">
                            <Button size="lg" className="rounded-full">
                                Explore Our Collection
                            </Button>
                        </Link>
                    </div>
                </section>

                <div className="container mx-auto max-w-6xl px-4 py-16">
                    {/* Introduction */}
                    <section className="mb-20 text-center">
                        <p className="mx-auto max-w-3xl text-lg leading-relaxed text-foreground">
                            Halima began as a small atelier in 1995. For three
                            decades we have designed garments that blend
                            tradition with modern sensibility. Our dedication to
                            craft and customer service helped build trust with
                            customers and the market.
                        </p>
                    </section>

                    {/* Timeline */}
                    <section id="timeline" className="mb-20">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight">
                                Milestones
                            </h2>
                            <div className="mx-auto h-1 w-20 bg-primary" />
                        </div>

                        <div className="relative">
                            {/* Vertical line */}
                            <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-border md:block" />

                            <div className="space-y-12">
                                {milestones.map((milestone, index) => (
                                    <div
                                        key={milestone.year}
                                        className={`relative flex items-center gap-8 ${
                                            index % 2 === 0
                                                ? "md:flex-row"
                                                : "md:flex-row-reverse"
                                        }`}
                                    >
                                        {/* Content */}
                                        <Card
                                            className={`flex-1 ${
                                                index % 2 === 0
                                                    ? "md:text-right"
                                                    : ""
                                            }`}
                                        >
                                            <CardContent className="p-6">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                    <span className="text-sm font-semibold text-primary">
                                                        {milestone.year}
                                                    </span>
                                                </div>
                                                <h3 className="mb-2 text-xl font-bold">
                                                    {milestone.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {milestone.description}
                                                </p>
                                            </CardContent>
                                        </Card>

                                        {/* Center dot */}
                                        <div className="absolute left-1/2 hidden h-4 w-4 -translate-x-1/2 rounded-full border-4 border-primary bg-background md:block" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Mission & Values */}
                    <section id="mission" className="mb-20">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight">
                                Mission & Values
                            </h2>
                            <div className="mx-auto h-1 w-20 bg-primary" />
                        </div>

                        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                            <CardContent className="p-8 text-center">
                                <h3 className="mb-3 text-xl font-semibold">
                                    Our Mission
                                </h3>
                                <p className="text-lg text-muted-foreground">
                                    To craft timeless pieces with meticulous
                                    care and exceptional service.
                                </p>
                            </CardContent>
                        </Card>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {values.map(({ icon: Icon, label }) => (
                                <Card
                                    key={label}
                                    className="text-center transition-all hover:border-primary/40 hover:shadow-md"
                                >
                                    <CardContent className="flex flex-col items-center gap-3 p-6">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                            <Icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <span className="font-semibold">
                                            {label}
                                        </span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Market Impact */}
                    <section id="impact" className="mb-20">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight">
                                Market & Cultural Impact
                            </h2>
                            <div className="mx-auto h-1 w-20 bg-primary" />
                        </div>

                        <Card className="border-primary/20">
                            <CardContent className="p-8">
                                <p className="mb-6 text-lg leading-relaxed">
                                    Halima's consistent commitment to design and
                                    service has not only won customer loyalty —
                                    it has also been credited with influencing
                                    market trends and investor confidence during
                                    its growth and public listing phases. These
                                    influences are part of our brand legacy and
                                    financial history.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <TrendingUp className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                                        <span className="text-muted-foreground">
                                            Recognized by fashion press and
                                            market analysts for trend-setting
                                            designs.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <TrendingUp className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                                        <span className="text-muted-foreground">
                                            Contributed to sector visibility
                                            when we expanded into public
                                            markets.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <TrendingUp className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                                        <span className="text-muted-foreground">
                                            Built measurable long-term customer
                                            value through service and quality.
                                        </span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Awards & Press */}
                    <section id="social_proof" className="mb-20">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight">
                                Awards & Press
                            </h2>
                            <div className="mx-auto h-1 w-20 bg-primary" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {awards.map((award, index) => (
                                <Card key={index} className="border-primary/20">
                                    <CardContent className="flex items-start gap-3 p-6">
                                        <Award className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                                        <span className="text-sm leading-relaxed">
                                            {award}
                                        </span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Social Media */}
                    <section id="social_media" className="mb-20">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight">
                                Follow Us & Join the Conversation
                            </h2>
                            <div className="mx-auto h-1 w-20 bg-primary" />
                            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                                Follow Halima on social channels for new
                                arrivals, behind-the-scenes, and community
                                stories.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {socialChannels.map(
                                ({ id, name, url, icon: Icon, showFollow }) => (
                                    <Card
                                        key={id}
                                        className="transition-all hover:border-primary/40 hover:shadow-md"
                                    >
                                        <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                                                <Icon className="h-7 w-7 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="mb-2 font-semibold">
                                                    {name}
                                                </h3>
                                                {showFollow && (
                                                    <Link
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full"
                                                        >
                                                            Follow
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            )}
                        </div>
                    </section>

                    {/* Newsletter */}
                    <section id="newsletter" className="mb-20">
                        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                            <CardContent className="p-8 text-center">
                                <Mail className="mx-auto mb-4 h-12 w-12 text-primary" />
                                <h2 className="mb-3 text-2xl font-bold">
                                    Stay in Touch
                                </h2>
                                <p className="mb-6 text-muted-foreground">
                                    Sign up for new arrivals, limited releases,
                                    and stories from our ateliers.
                                </p>
                                <form className="mx-auto flex max-w-md gap-2">
                                    <Input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="flex-1"
                                        required
                                    />
                                    <Button type="submit">Subscribe</Button>
                                </form>
                            </CardContent>
                        </Card>
                    </section>

                    {/* FAQ */}
                    <section id="faq" className="mb-20">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight">
                                Frequently Asked Questions
                            </h2>
                            <div className="mx-auto h-1 w-20 bg-primary" />
                        </div>

                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <Card key={index}>
                                    <CardContent className="p-6">
                                        <h3 className="mb-2 font-semibold">
                                            {faq.question}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {faq.answer}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Contact CTA */}
                    <section
                        id="contact"
                        className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background p-8 text-center"
                    >
                        <Users className="mx-auto mb-4 h-12 w-12 text-primary" />
                        <h2 className="mb-3 text-2xl font-bold">
                            Contact & Careers
                        </h2>
                        <p className="mb-6 text-muted-foreground">
                            For press, investor relations, or careers contact us
                            via email or the contact form.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/contact?type=press">
                                <Button variant="outline">Press & IR</Button>
                            </Link>
                            <Link href="/careers">
                                <Button>Careers</Button>
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
