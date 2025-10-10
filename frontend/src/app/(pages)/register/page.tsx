import RegisterForm from "@/app/_Components/Register/Register";
import Link from "next/link";
import React from "react";

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <h1 className="text-6xl font-bold">Create an Account</h1>
                    <p className="text-muted-foreground">
                        Enter your details to get started.
                    </p>
                </div>
                <RegisterForm />
                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
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
