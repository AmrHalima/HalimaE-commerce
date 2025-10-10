import ForgotPasswordForm from "@/app/_Components/ForgotPassword/ForgotPassword";
import Link from "next/link";
import React from "react";

export default function ForgotPassword() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 -mt-24">
            <div className="w-full max-w-md">
                <ForgotPasswordForm />
                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Remember your password?{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-primary hover:underline"
                    >
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
