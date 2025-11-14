"use client";

/**
 * Scroll to Top Component
 * Automatically scrolls to top when component mounts
 * Used for product details page navigation
 */

import { useEffect } from "react";

export function ScrollToTop() {
    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo({
            top: 0,
            behavior: "instant", // Instant scroll, no animation
        });
    }, []);

    return null; // This component doesn't render anything
}
