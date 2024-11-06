"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import { supabase } from '/backend/database/supabaseClient';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://tempo-scheduling-webapp1-1.vercel.app'
  : process.env.NEXT_PUBLIC_NGROK_URL || process.env.NEXT_PUBLIC_API_URL;

export default function WhitelistPage() {
  const { user } = useUser();
  const router = useRouter(); // Initialize the router

  useEffect(() => {
    const checkWhitelistStatus = async () => {
      if (user && user.emailAddresses) {
        try {
          // Query the Supabase database to check if the user is whitelisted
          const { data, error } = await supabase
            .from("users")
            .select("role, is_whitelisted")
            .eq("email", user.emailAddresses)
            .single(); // Use .single() to get a single record

          if (error) throw error;

          // Redirect if the user is whitelisted
          if (data && data.is_whitelisted) {
            // Redirect based on user role
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

    // Call the async function within useEffect
    checkWhitelistStatus();
  }, [user, router]); // Run this effect when `user` or `router` changes

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
