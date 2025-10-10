"use client";
import React from "react";
import Navbar from "@/app/_Components/Navbar/Navbar";
import { ThemeProvider } from "next-themes";
import { Footer } from "@/components/ui/footer";
import { Toaster } from "sonner";
import CartContextProvider from "@/context/CartContext";
import WishLIstContextProvider from "@/context/WishLIstContext";
import { SessionProvider } from "next-auth/react";
export default function Provider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <CartContextProvider>
                <WishLIstContextProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                    >
                        <Navbar />
                        <Toaster position="bottom-right" theme="system" />
                        <div className="mt-24">{children}</div>
                        <Footer />
                    </ThemeProvider>
                </WishLIstContextProvider>
            </CartContextProvider>
        </SessionProvider>
    );
}
