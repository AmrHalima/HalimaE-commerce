import LoginForm from "@/app/_Components/Login/Login";
import React from "react";

export default function page() {
    return (
        <div className="container mx-auto flex flex-col justify-center items-center h-screen -mt-24">
            <LoginForm />
        </div>
    );
}
