"use client";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function PageWithExitMask({
    children,
}: {
    children: React.ReactNode;
}) {
    const [visible, setVisible] = useState(true);
    const { theme } = useTheme();

    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 6000);
        return () => {
            clearTimeout(timer);
        };
    }, []);

    return (
        <>
            <AnimatePresence>
                {visible && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-background"
                        initial={{ clipPath: "circle(150% at 50% 50%)" }}
                        exit={{ clipPath: "circle(0% at 50% 50%)" }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                    >
                        <div className="flex items-center justify-center h-screen text-4xl">
                            <Image
                                className=""
                                src={
                                    theme === "dark"
                                        ? "/logoDark.svg"
                                        : "/logo.svg"
                                }
                                alt="Halima logo"
                                width={890}
                                height={415}
                                priority
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {children}
        </>
    );
}
