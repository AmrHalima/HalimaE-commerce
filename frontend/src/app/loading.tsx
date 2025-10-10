import Image from "next/image";
import React from "react";

export default function Loading() {
    return (
        <div className="flex justify-center items-center h-screen -mt-24">
            <Image
                src={"dark" === "dark" ? "./loading.svg" : "./loadingDark.svg"}
                width={100}
                height={100}
                alt="loading"
                priority
            ></Image>
        </div>
    );
}
