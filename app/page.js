"use client";

import { SignUpButton, SignedOut, useAuth } from '@clerk/nextjs';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/employee");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="relative min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)] text-black">
      {/* Blurred background image */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-lg"
        style={{
          backgroundImage: `url('/images/loginpagebackground.webp')`,
        }}
      ></div>

      <SignedOut>
        <main className="flex flex-col gap-4 justify-center items-center text-center min-h-screen" style={{ transform: 'translateY(-10%)' }}>
          
          {/* Blurred container with adjustable size */}
          <div className="bg-black/15 backdrop-blur-md rounded-xl border-2 border-white p-8 flex flex-col items-center justify-center shadow-md w-full max-w-[800px] h-[500px]">
            <Image
              className="mx-auto"
              src="/images/tempo-removebg-preview.png"
              alt="Tempo logo"
              width={180}
              height={40}
              priority
            />

            <div className="text-lg sm:text-xl font-[family-name:var(--font-geist-mono)] mt-2 font-bold">
              The best scheduling platform on planet Earth.
            </div>

            <div className="flex flex-row gap-4 items-center justify-center mt-[50px]">
              <SignUpButton>
                <button 
                className="rounded-full border border-black transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-lg sm:text-base h-12 w-40 px-5 font-bold"
                priority>
                  Get Started →
                </button>
              </SignUpButton>
            </div>
          </div>

          {/* Footer buttons with adjustable margin */}
          <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center mt-20 font-semibold">
            <a
              className="flex items-center gap-2 hover:underline hover:underline-offset-4"
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                aria-hidden
                src="https://nextjs.org/icons/file.svg"
                alt="File icon"
                width={16}
                height={16}
              />
              About us
            </a>
            <a
              className="flex items-center gap-2 hover:underline hover:underline-offset-4"
              href="https://nicepage.com/website-mockup/preview/our-partners-83938?device=desktop"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                aria-hidden
                src="https://nextjs.org/icons/window.svg"
                alt="Window icon"
                width={16}
                height={16}
              />
              Our partners
            </a>
            <a
              className="flex items-center gap-2 hover:underline hover:underline-offset-4"
              href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                aria-hidden
                src="/images/default-avatar.png"
                alt="Globe icon"
                width={16}
                height={16}
              />
              Go to tempo.com →
            </a>
          </footer>
        </main>
      </SignedOut>
    </div>
  );
}

 {/*Code enhanced by AI (ChatGPT 4o) Prompts were: Create a blurred container that has squared edges that surrounds the "Get Started" button
   and the page logo, plus add an image to the background of the page that is on the public directory with the logo, it is called loginpagebackground.webp*/}