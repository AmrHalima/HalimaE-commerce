"use client";

import { Button } from "@/components/ui/button";

interface WhatsAppButtonProps {
    phoneNumber?: string;
    message?: string;
    variant?: "floating" | "inline"; // floating for desktop, inline for mobile CTA group
    className?: string;
}

export const Whatsapp = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
        <path
            fill="currentColor"
            d="M16.6 14c-.2-.1-1.5-.7-1.7-.8c-.2-.1-.4-.1-.6.1c-.2.2-.6.8-.8 1c-.1.2-.3.2-.5.1c-.7-.3-1.4-.7-2-1.2c-.5-.5-1-1.1-1.4-1.7c-.1-.2 0-.4.1-.5c.1-.1.2-.3.4-.4c.1-.1.2-.3.2-.4c.1-.1.1-.3 0-.4c-.1-.1-.6-1.3-.8-1.8c-.1-.7-.3-.7-.5-.7h-.5c-.2 0-.5.2-.6.3c-.6.6-.9 1.3-.9 2.1c.1.9.4 1.8 1 2.6c1.1 1.6 2.5 2.9 4.2 3.7c.5.2.9.4 1.4.5c.5.2 1 .2 1.6.1c.7-.1 1.3-.6 1.7-1.2c.2-.4.2-.8.1-1.2l-.4-.2m2.5-9.1C15.2 1 8.9 1 5 4.9c-3.2 3.2-3.8 8.1-1.6 12L2 22l5.3-1.4c1.5.8 3.1 1.2 4.7 1.2c5.5 0 9.9-4.4 9.9-9.9c.1-2.6-1-5.1-2.8-7m-2.7 14c-1.3.8-2.8 1.3-4.4 1.3c-1.5 0-2.9-.4-4.2-1.1l-.3-.2l-3.1.8l.8-3l-.2-.3c-2.4-4-1.2-9 2.7-11.5S16.6 3.7 19 7.5c2.4 3.9 1.3 9-2.6 11.4"
        ></path>
    </svg>
);

export default function WhatsAppButton({
    phoneNumber = "201275580766",
    message = "Hello! I'm interested in Halima products.",
    variant = "floating",
    className = "",
}: WhatsAppButtonProps) {
    const handleWhatsAppClick = () => {
        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.location.href = whatsappURL;
    };

    if (variant === "inline") {
        // Inline variant for mobile CTA group
        return (
            <Button
                onClick={handleWhatsAppClick}
                className={`h-11 w-12 rounded-full bg-[#25D366] p-0 hover:bg-[#128C7E] ${className}`}
                aria-label="Contact us on WhatsApp"
                title="Chat with us on WhatsApp"
            >
                <Whatsapp
                    style={{ width: "32px", height: "32px" }}
                    className="text-white"
                />
            </Button>
        );
    }

    // Floating variant for desktop
    return (
        <Button
            onClick={handleWhatsAppClick}
            className={`fixed bottom-6 right-6 z-40 hidden h-14 w-14 rounded-full bg-[#25D366] p-0 shadow-lg transition-all hover:scale-110 hover:bg-[#128C7E] hover:shadow-xl sm:flex ${className}`}
            aria-label="Contact us on WhatsApp"
            title="Chat with us on WhatsApp"
        >
            <Whatsapp
                style={{ width: "40px", height: "40px" }}
                className="text-white"
            />
        </Button>
    );
}
