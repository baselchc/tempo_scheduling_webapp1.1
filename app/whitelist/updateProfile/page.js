// app/whitelist/updateProfile/page.js

"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs"; // Import the useUser hook

export default function UpdateProfilePage() {
  const { user } = useUser(); // Get the user object from Clerk
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Populate the state with user data from Clerk
  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
        phone: "", // You can modify this to get the phone if it's stored elsewhere
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic to handle the profile update (e.g., send data to API)
    console.log("Profile updated:", profile);
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
      <div className="bg-black/15 backdrop-blur-md rounded-xl border-2 border-white p-8 flex flex-col items-center justify-center shadow-md w-full max-w-[800px] h-auto">
        <div className="text-lg sm:text-xl font-[family-name:var(--font-geist-mono)] mt-2 font-bold">
          Information
        </div>

        {/* Profile input form */}
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 mt-8 w-full max-w-[400px]">
          <input
            type="text"
            name="firstName"
            value={profile.firstName}
            onChange={handleChange}
            placeholder="First Name"
            className="w-full p-2 rounded-md border-2 border-white bg-transparent text-black placeholder-white focus:outline-none focus:ring-2 focus:ring-white"
            required
          />
          <input
            type="text"
            name="lastName"
            value={profile.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            className="w-full p-2 rounded-md border-2 border-white bg-transparent text-black placeholder-white focus:outline-none focus:ring-2 focus:ring-white"
            required
          />
          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full p-2 rounded-md border-2 border-white bg-transparent text-black placeholder-white focus:outline-none focus:ring-2 focus:ring-white"
            required
          />
          <input
            type="tel"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            className="w-full p-2 rounded-md border-2 border-white bg-transparent text-black placeholder-white focus:outline-none focus:ring-2 focus:ring-white"
            required
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
