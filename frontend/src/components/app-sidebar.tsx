"use client";

import * as React from "react";
import {
    LayoutDashboardIcon,
    PackageIcon,
    UsersIcon,
    FolderIcon,
    ShoppingCartIcon,
    SettingsIcon,
    HelpCircleIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
    navMain: [
        {
            title: "Dashboard",
            url: "/management/dashboard",
            icon: LayoutDashboardIcon,
        },
        {
            title: "Products",
            url: "/management/products",
            icon: PackageIcon,
        },
        {
            title: "Categories",
            url: "/management/categories",
            icon: FolderIcon,
        },
        {
            title: "Orders",
            url: "/management/allorders",
            icon: ShoppingCartIcon,
        },
        {
            title: "Customers",
            url: "/management/customers",
            icon: UsersIcon,
        },
        {
            title: "Users",
            url: "/management/users",
            icon: UsersIcon,
        },
    ],
    navSecondary: [
        {
            title: "Settings",
            url: "/management/settings",
            icon: SettingsIcon,
        },
        {
            title: "Help",
            url: "/management/help",
            icon: HelpCircleIcon,
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5"
                        >
                            <a href="/management/dashboard">
                                <span className="text-base font-semibold">
                                    Halima E-commerce
                                </span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
