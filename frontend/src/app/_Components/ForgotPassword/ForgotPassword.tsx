"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";

// Schemas for each step
const emailSchema = z.object({
    email: z
        .string()
        .email("Invalid email address.")
        .nonempty("Email is required."),
});

const resetPasswordSchema = z
    .object({
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters."),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type Step = "email" | "verify" | "reset";

export default function ForgotPasswordForm() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("email");
    const [isLoading, setIsLoading] = useState(false);
    const [apiMessage, setApiMessage] = useState<{
        type: "error" | "success";
        text: string;
    } | null>(null);
    const [userEmail, setUserEmail] = useState("");

    const emailForm = useForm<z.infer<typeof emailSchema>>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: "" },
    });

    const passwordForm = useForm<z.infer<typeof resetPasswordSchema>>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { newPassword: "", confirmPassword: "" },
    });

    // Step 1: Request reset code
    async function onEmailSubmit(values: z.infer<typeof emailSchema>) {
        setIsLoading(true);
        setApiMessage(null);
        try {
            const res = await fetch(
                "https://ecommerce.routemisr.com/api/v1/auth/forgotPasswords",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: values.email }),
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setApiMessage({ type: "success", text: data.message });
            setUserEmail(values.email);
            setStep("verify");
        } catch (error) {
            if (error instanceof Error) {
                setApiMessage({ type: "error", text: error.message });
            }
        } finally {
            setIsLoading(false);
        }
    }

    // Step 2: Verify reset code
    async function onVerifyCode(code: string) {
        setIsLoading(true);
        setApiMessage(null);
        try {
            const res = await fetch(
                "https://ecommerce.routemisr.com/api/v1/auth/verifyResetCode",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ resetCode: code }),
                }
            );
            const data = await res.json();
            if (data.status !== "Success")
                throw new Error("Invalid or expired code.");

            setApiMessage({
                type: "success",
                text: "Code verified successfully!",
            });
            setStep("reset");
        } catch (error) {
            if (error instanceof Error) {
                setApiMessage({ type: "error", text: error.message });
            }
        } finally {
            setIsLoading(false);
        }
    }

    // Step 3: Reset the password
    async function onPasswordSubmit(
        values: z.infer<typeof resetPasswordSchema>
    ) {
        setIsLoading(true);
        setApiMessage(null);
        try {
            const res = await fetch(
                "https://ecommerce.routemisr.com/api/v1/auth/resetPassword",
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: userEmail,
                        newPassword: values.newPassword,
                    }),
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.message || "Failed to reset password."
                );
            }

            // On success, the API returns a new token. We'll redirect to login.
            toast.success("Password has been reset successfully!");
            router.push("/login");
        } catch (error) {
            if (error instanceof Error) {
                setApiMessage({ type: "error", text: error.message });
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-md shadow-lg">
            {step === "email" && (
                <>
                    <CardHeader>
                        <CardTitle>Forgot Your Password?</CardTitle>
                        <CardDescription>
                            Enter your email and we&apos;ll send you a reset
                            code.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...emailForm}>
                            <form
                                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={emailForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="you@example.com"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Send Reset Code
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </>
            )}

            {step === "verify" && (
                <>
                    <CardHeader>
                        <CardTitle>Check Your Email</CardTitle>
                        <CardDescription>
                            We&apos;ve sent a 6-digit code to{" "}
                            <strong>{userEmail}</strong>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <InputOTP
                            maxLength={6}
                            onComplete={onVerifyCode}
                            disabled={isLoading}
                        >
                            <InputOTPGroup>
                                {[...Array(6)].map((_, index) => (
                                    <InputOTPSlot key={index} index={index} />
                                ))}
                            </InputOTPGroup>
                        </InputOTP>
                        {isLoading && (
                            <Loader2 className="mt-4 h-6 w-6 animate-spin" />
                        )}
                    </CardContent>
                </>
            )}

            {step === "reset" && (
                <>
                    <CardHeader>
                        <CardTitle>Set a New Password</CardTitle>
                        <CardDescription>
                            Your new password must be at least 8 characters
                            long.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form
                                onSubmit={passwordForm.handleSubmit(
                                    onPasswordSubmit
                                )}
                                className="space-y-4"
                            >
                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Confirm New Password
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Reset Password
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </>
            )}

            {apiMessage && (
                <div
                    className={`p-4 text-center text-sm ${
                        apiMessage.type === "error"
                            ? "text-destructive"
                            : "text-green-600"
                    }`}
                >
                    {apiMessage.text}
                </div>
            )}
        </Card>
    );
}
