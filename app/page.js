"use client"; 

import { SignUpButton, SignedIn, SignedOut, useAuth } from '@clerk/nextjs'; 
import Image from "next/image";

export default function Home() {
  const { signOut } = useAuth(); 

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-4 row-start-2 items-center text-center">
        <Image
          className="dark:invert mx-auto"
          src="/tempo-removebg-preview.png"
          alt="Tempo logo"
          width={180}
          height={40}
          priority
        />

        <div className="text-lg sm:text-xl font-[family-name:var(--font-geist-mono)] mt-2">
          The best scheduling platform on planet Earth.
        </div>

         {/* Snippet created by AI (GPT 4o), Prompt is: "integrate the clerk platform to this next.js project, here is the layout.js and page.js" : */}

        <SignedOut>
          <div className="flex flex-row gap-4 items-center justify-center mt-8">
            <SignUpButton>
              <button className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-lg sm:text-base h-12 w-40 px-5">
                Get Started →
              </button>
            </SignUpButton>
          </div>
        </SignedOut>

          {/* Snippet created by AI (GPT 4o), Prompt is: "integrate the clerk platform to this next.js project, here is the layout.js and page.js" : */}
        
        <SignedIn>
          <div className="flex items-center justify-center mt-8">
            <button
              onClick={() => signOut()} 
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-12 w-40 px-5"
            >
              Sign Out →
            </button>
          </div>
        </SignedIn>
      </main>

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
            src="https://nextjs.org/icons/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to tempo.com →
        </a>
      </footer>
    </div>
  );
}
