"use client";

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { useThemeTransition } from "@/components/ui/shadcn-io/theme-toggle-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    LogOut,
    Menu,
    Settings,
    ShoppingBag,
    ShoppingCart,
    User,
    User2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CartContext } from "@/context/CartContext";
import { useSession, signOut } from "next-auth/react";
import { WishListContext } from "@/context/WishLIstContext";

export default function Navbar() {
    const session = useSession();
    const wishlistContext = useContext(WishListContext);
    const { resolvedTheme, setTheme } = useTheme();
    const { startTransition } = useThemeTransition();
    const [mounted, setMounted] = useState(false);
    const { cart, loading } = useContext(CartContext);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleThemeToggle = () => {
        startTransition(() => {
            setTheme(resolvedTheme === "dark" ? "light" : "dark");
        });
    };

    const basePaths = [
        { name: "Products", href: "/products" },
        { name: "Categories", href: "/categories" },
        { name: "About", href: "/about" },
    ];

    // add orders only if authenticated
    const paths =
        session.status === "authenticated"
            ? [...basePaths, { name: "Orders", href: "/allorders" }]
            : basePaths;

    return (
        <nav className="w-full fixed top-0 z-50 bg-card border-b">
            <div className="container mx-auto flex justify-between items-center md:p-2.5 p-2">
                {/* Logo */}
                {!mounted ? (
                    <div className="h-[64px] w-[137px]"></div>
                ) : (
                    <Link href="/">
                        <Image
                            quality={30}
                            src={
                                resolvedTheme === "dark"
                                    ? "/logoDark.svg"
                                    : "/logo.svg"
                            }
                            alt="Halima logo"
                            width={137}
                            height={64}
                            priority
                        />
                    </Link>
                )}

                {/* Desktop Navigation */}
                <div className="hidden md:flex flex-1 justify-center">
                    <NavigationMenu>
                        <NavigationMenuList>
                            {paths.map(({ name, href }) => (
                                <NavigationMenuItem key={name}>
                                    <NavigationMenuLink
                                        asChild
                                        className="lg:p-2 lg:mx-2 lg:flex-row flex flex-col items-center"
                                    >
                                        <Link href={href}>{name}</Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    {!mounted ? (
                        <div className="h-8 w-8"></div>
                    ) : (
                        <ThemeToggleButton
                            theme={resolvedTheme === "dark" ? "dark" : "light"}
                            onClick={handleThemeToggle}
                            variant="circle"
                            start="top-right"
                            className="h-8 w-8 rounded-full border-border border-[1px]"
                        />
                    )}

                    {/* Authenticated user */}
                    {session.status === "authenticated" && (
                        <>
                            {/* Avatar Popover */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative h-8 w-8 rounded-full border-border border-[1px]"
                                    >
                                        <Avatar className="h-8 w-8 flex items-center justify-center">
                                            <span className="text-sm font-medium">
                                                {session.data?.user.name
                                                    ?.split(" ")
                                                    .map((w) =>
                                                        w[0].toLocaleUpperCase()
                                                    )
                                                    .join("") || (
                                                    <AvatarFallback>
                                                        <User2 />
                                                    </AvatarFallback>
                                                )}
                                            </span>
                                        </Avatar>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-56 bg-background"
                                    align="end"
                                >
                                    <div className="flex items-center space-x-2 p-2">
                                        <div className="space-y-1">
                                            <h5 className="text-sm font-semibold">
                                                {session.data?.user.name}
                                            </h5>
                                            <p className="text-xs text-muted-foreground">
                                                {session.data?.user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="grid gap-1">
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start"
                                            size="sm"
                                        >
                                            <User className="mr-2 h-4 w-4" />
                                            Profile
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start"
                                            size="sm"
                                        >
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </Button>
                                        <hr className="my-1" />
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start"
                                            size="sm"
                                            onClick={() =>
                                                signOut({ callbackUrl: "/" })
                                            }
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Log out
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            {/* Cart */}
                            <Link href={"/cart"} aria-label="Cart">
                                <div className="relative p-1.5 cursor-pointer">
                                    {!loading &&
                                        cart &&
                                        cart.totalItems > 0 && (
                                            <Badge className="absolute top-0 end-0 h-4 min-w-3 rounded-full p-1 text-xs font-semibold translate-x-1/2 text-muted">
                                                {cart.totalItems}
                                            </Badge>
                                        )}
                                    <ShoppingCart />
                                </div>
                            </Link>

                            {/* Wishlist */}
                            <Link href={"/wishlist"} aria-label="wishlist">
                                <div className="relative p-1.5 cursor-pointer">
                                    {!loading &&
                                        wishlistContext.wishList &&
                                        wishlistContext.wishList.count > 0 && (
                                            <Badge className="absolute top-0 end-0 h-4 min-w-3 rounded-full p-1 text-xs font-semibold translate-x-1/2 text-muted">
                                                {wishlistContext.wishList.count}
                                            </Badge>
                                        )}
                                    <ShoppingBag />
                                </div>
                            </Link>
                        </>
                    )}

                    {/* Unauthenticated */}
                    {session.status === "unauthenticated" && (
                        <>
                            <Link href={"/login"}>
                                <Button variant="outline">Login</Button>
                            </Link>
                            <Link href={"/register"}>
                                <Button>Sign Up</Button>
                            </Link>
                        </>
                    )}

                    {/* Hamburger for mobile */}
                    <button
                        className="md:hidden ml-2 p-2 rounded focus:outline-none focus:ring"
                        onClick={(e) => {
                            e.preventDefault();
                            setMobileOpen((v) => !v);
                        }}
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        aria-controls="mobile-navigation"
                        aria-expanded={mobileOpen}
                        aria-haspopup="true"
                        type="button"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileOpen && (
                <div
                    id="mobile-navigation"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Mobile navigation"
                    className="md:hidden fixed inset-0 z-50 bg-background/90 backdrop-blur-sm"
                >
                    <div className="flex flex-col items-center justify-center h-full gap-6">
                        {paths.map(({ name, href }) => (
                            <Link
                                key={name}
                                href={href}
                                className="text-lg font-medium px-4 py-2 rounded hover:bg-accent transition"
                                aria-label={name}
                                onClick={() => setMobileOpen(false)}
                            >
                                {name}
                            </Link>
                        ))}
                        {session.status === "authenticated" ? (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setMobileOpen(false);
                                    signOut({ callbackUrl: "/" });
                                }}
                            >
                                Logout
                            </Button>
                        ) : (
                            <>
                                <Link
                                    href={"/login"}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <Button variant="outline">Login</Button>
                                </Link>
                                <Link
                                    href={"/register"}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <Button>Sign Up</Button>
                                </Link>
                            </>
                        )}
                        <button
                            className="mt-8 px-4 py-2 rounded bg-muted-foreground text-forground"
                            onClick={() => setMobileOpen(false)}
                            aria-label="Close menu"
                            type="button"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
