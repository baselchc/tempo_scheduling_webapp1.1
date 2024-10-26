"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation"; // Import useRouter for navigation

export default function WhitelistPage() {
  const [code, setCode] = useState("");
  const [correctCode, setCorrectCode] = useState(""); // State to hold the correct code from localStorage
  const router = useRouter(); // Initialize the router

  useEffect(() => {
    // Retrieve the stored code from localStorage when the component mounts
    const storedCode = localStorage.getItem("storedCode") || "1111"; // Fallback to "1111" if not set
    setCorrectCode(storedCode); // Update the state with the stored code
  }, []); // Run only once on mount

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if the entered code matches the correct code
    if (code === correctCode) {
      router.push("/employee"); // Redirect to the /employee page
    } else {
      alert("Invalid code. Please try again."); // Show an alert for an invalid code
    }
  };

  return (
    <main className="flex flex-col gap-4 justify-center items-center text-center min-h-screen">
      {/* Blurred background image */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-lg"
        style={{
          backgroundImage: `url('/images/loginpagebackground.webp')`,
        }}
      ></div>
        
      {/* Blurred container with adjustable size */}
      <div className="bg-black/15 backdrop-blur-md rounded-xl border-2 border-white p-8 flex flex-col items-center justify-center shadow-md w-full max-w-[800px] h-[600px]">
        <Image
          className="mx-auto"
          src="/images/tempo-removebg-preview.png"
          alt="Tempo logo"
          width={180}
          height={40}
          priority
        />
        
        <div className="text-lg sm:text-xl font-[family-name:var(--font-geist-mono)] mt-2 font-bold">
          This email is not part of this organization. Please contact management or provide an Authorization code.
        </div>

        {/* Code input form */}
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 mt-8 w-full max-w-[400px]">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter whitelist code"
            className="w-full p-2 rounded-md border-2 border-white bg-transparent text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-white text-black rounded-md hover:bg-gray-300 transition-colors"
          >
            Submit
          </button>
        </form>
      </div>
    </main>
  );
}
