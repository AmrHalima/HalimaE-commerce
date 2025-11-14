"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    ThemeToggleButton,
    useThemeTransition,
} from "@/components/ui/shadcn-io/theme-toggle-button";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/use-auth";

export default function Page({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const handleThemeToggle = () => {
        startTransition(() => {
            setTheme(resolvedTheme === "dark" ? "light" : "dark");
        });
    };
    const { resolvedTheme, setTheme } = useTheme();
    const { startTransition } = useThemeTransition();
    const { user, role } = useAuth();

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/management/login" });
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4 w-full">
                        <SidebarTrigger className="-ml-1" />
                        <ThemeToggleButton
                            theme={resolvedTheme === "dark" ? "dark" : "light"}
                            onClick={handleThemeToggle}
                            variant="circle"
                            start="top-left"
                            className="h-8 w-8 rounded-full border-border border-[1px]"
                        />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        {user && (
                            <>
                                <span className="text-sm text-muted-foreground flex-1">
                                    {user.email}{" "}
                                    <span className="text-xs">({role})</span>
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSignOut}
                                    className="gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </Button>
                            </>
                        )}
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
