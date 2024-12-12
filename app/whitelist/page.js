"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../../backend/database/supabaseClient"; // Adjusted import to use supabaseClient.js

export default function WhitelistPage() {
  const { user } = useUser();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const checkWhitelistStatus = async () => {
      if (user && user.emailAddresses?.length > 0) {
        try {
          const email = user.emailAddresses[0].emailAddress; // Get primary email
          const { data, error } = await supabase
            .from("users")
            .select("role, is_whitelisted")
            .eq("email", email)
            .single();

          if (error) throw error;

          if (data && data.is_whitelisted) {
            if (data.role === "manager") {
              router.push("/manager");
            } else if (data.role === "employee") {
              router.push("/employee");
            } else {
              alert("Your role is not recognized.");
            }
          } else {
            setError("Your account is not whitelisted. Please contact management.");
          }
        } catch (err) {
          console.error("Error checking user role and whitelist status:", err.message);
          setError("An error occurred. Please try again.");
        }
      }
    };

    checkWhitelistStatus();
  }, [user, router]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase
        .from("whitelist_code")
        .select("code")
        .eq("code", code)
        .single();

      if (error || !data) {
        setError("Invalid whitelist code.");
        return;
      }

      const email = user.emailAddresses[0].emailAddress;

      // Update user whitelist status
      const { error: updateError } = await supabase
        .from("users")
        .update({ is_whitelisted: true })
        .eq("email", email);

      if (updateError) {
        setError("Failed to whitelist your account. Please try again.");
        console.error("Error updating whitelist status:", updateError);
        return;
      }

      router.push("/employee");
    } catch (err) {
      console.error("Error verifying whitelist code:", err.message);
      setError("An unexpected error occurred. Please try again.");
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

      {/* Blurred container */}
      <div className="bg-black/15 backdrop-blur-md rounded-xl border-2 border-white p-8 flex flex-col items-center justify-center shadow-md w-full max-w-[800px] h-[600px]">
        <Image
          className="mx-auto"
          src="/images/tempo-removebg-preview.png"
          alt="Tempo logo"
          width={180}
          height={40}
          priority
        />

        {error && (
          <div className="text-red-500 text-lg sm:text-xl font-bold mt-4">
            {error}
          </div>
        )}

        <div className="text-lg sm:text-xl font-bold mt-4 text-white">
          {error
            ? "This email does not seem to be part of this organization. Please contact management or provide an authorization code."
            : "Verifying your account..."}
        </div>

        {/* Code input form */}
        <form
          onSubmit={handleFormSubmit}
          className="flex flex-col items-center gap-4 mt-8 w-full max-w-[400px]"
        >
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