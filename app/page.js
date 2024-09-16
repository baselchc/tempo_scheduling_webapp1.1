"use client";

import { SignUpButton, SignedIn, SignedOut, useAuth, useUser } from '@clerk/nextjs';
import Image from "next/image";
import {useRouter} from "next/navigation";
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
    <div className="min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">

      

      <SignedOut>
        <main className="flex flex-col gap-4 justify-center items-center text-center min-h-screen" style={{ transform: 'translateY(-10%)' }}>
          <Image
            className="dark:invert mx-auto"
            src="/images/tempo-removebg-preview.png"
            alt="Tempo logo"
            width={180}
            height={40}
            priority
          />

          <div className="text-lg sm:text-xl font-[family-name:var(--font-geist-mono)] mt-2">
            The best scheduling platform on planet Earth.
          </div>

          <div className="flex flex-row gap-4 items-center justify-center mt-8">
            <SignUpButton>
              <button 
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-lg sm:text-base h-12 w-40 px-5"
              priority>
                Get Started →
              </button>
            </SignUpButton>
          </div>

          <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center mt-8">
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
              Learn about us
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

{/* Code enhanced by AI (GPT 4o), Prompts were: "Integrate the clerk platform to this next.js project, here is the layout.js and page.js, make the layout for a signed in different for a signed out, and add the word member and administrator to the username and add this username to the bottom left of the signed in page.*/}
