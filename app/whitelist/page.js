// app/whitelist/page.js

"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import { supabase } from '../../lib/supabase-browser'

export default function WhitelistPage() {
  const { user } = useUser();
  const router = useRouter(); // Initialize the router

  useEffect(() => {
    const checkWhitelistStatus = async () => {
      if (user && user.emailAddresses) {
        try {
        
          const { data, error } = await supabase
            .from("users")
            .select("role, is_whitelisted")
            .eq("email", user.emailAddresses)
            .single(); 

          if (error) throw error;

          if (data && data.is_whitelisted) {
            if (data.role === 'manager') {
              router.push('/manager');
            } else if (data.role === 'employee') {
              router.push('/employee');
            } else {
              alert('Your role is not recognized.');
            }
          } else {
            alert('Your account is not whitelisted. Please contact management.');
          }
        } catch (err) {
          console.error('Error checking user role and whitelist status:', err.message);
          alert('An error occurred. Please try again.');
        }
      }
    };


    checkWhitelistStatus();
  }, [user, router]);

  return (
    <main className="flex flex-col gap-4 justify-center items-center text-center min-h-screen">
      {/* Blurred background image */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-lg"
        style={{
          backgroundImage: `url('/images/loginpagebackground.webp')`,
        }}
      ></div>
        
      {/* Blurred container with adjustable size*/}
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
          This email does not seem to be part of this organization. Please contact management or provide an authorization code.
        </div>

        {/* Code input form */}
        <form onSubmit={null} className="flex flex-col items-center gap-4 mt-8 w-full max-w-[400px]">
          <input
            type="text"
            value={null}
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

//ChatGPT can you help me fix this query to work