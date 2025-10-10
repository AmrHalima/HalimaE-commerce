import PageWithExitMask from "@/app/_Components/intro/page";
import React from "react";
import { HeroGeometric } from "@/components/ui/shadcn-io/shape-landing-hero";

export default function Home() {
    return (
        <PageWithExitMask>
            <div className="min-h-screen">
                <HeroGeometric
                    badge={null}
                    title1="Find Your"
                    title2="Perfect Product"
                    description="Discover a world of quality and variety at unbeatable prices. Shop now and elevate your lifestyle with our exclusive collection!"
                />
            </div>
        </PageWithExitMask>
    );
}
