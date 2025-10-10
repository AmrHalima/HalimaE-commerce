import Image from "next/image";

export default function NotFound() {
    return (
        <div className="w-full h-screen flex flex-col justify-center items-center -mt-24">
            <Image
                className=""
                src={"/404.svg"}
                alt="404 Not Found"
                width={480}
                height={320}
                priority
            />
            <h2 className="text-4xl font-bold text-center mt-4 ">
                Page Not Found
            </h2>
            <p className="text-center mt-2 text-lg">
                The page you are looking for does not exist.
            </p>
        </div>
    );
}
