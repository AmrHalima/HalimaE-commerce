"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Loader2 } from "lucide-react";

// Schema remains the same
const formSchema = z.object({
    email: z
        .string()
        .email("Invalid email address")
        .nonempty("Email is required")
        .trim(),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .nonempty("Password is required"),
});

export default function LoginForm() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    const callbackUrl = searchParams.get("from");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        await signIn("customer-credentials", {
            email: values.email,
            password: values.password,
            redirect: true,
            callbackUrl: callbackUrl ?? "/",
        });
        // If signIn fails with an error, it will redirect back with an error param.
        // We set loading to false in case the redirect doesn't happen for other reasons.
        setIsLoading(false);
    }

    return (
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">
                    Welcome Back
                </CardTitle>
                <CardDescription>
                    Sign in to access your account and continue shopping.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="you@example.com"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Password</FormLabel>
                                        <Link
                                            href="/forgot-password"
                                            className="text-sm font-medium text-primary hover:underline"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="••••••••"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword
                                                    )
                                                }
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                                                disabled={isLoading}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {error === "CredentialsSignin" && (
                            <Badge
                                variant={"destructive"}
                                className="w-full p-2 text-center"
                            >
                                Invalid email or password. Please try again.
                            </Badge>
                        )}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {isLoading ? "Signing In..." : "Sign In"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex justify-center text-sm">
                <p className="text-muted-foreground">
                    Don&apos;t have an account?&nbsp;
                    <Link
                        href="/register"
                        className="font-semibold text-primary hover:underline"
                    >
                        Sign up
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
