"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import Image from "next/image";
import Profile from './components/Profile'; // Import Profile component
import Schedule from './components/Schedule'; // Import Schedule component

export default function EmployeePage() {
  const { signOut } = useAuth();
  const { user } = useUser();

  return (
    <div className="relative min-h-screen bg-gray-100 p-6">
      {/* Logo Section */}
      <div className="absolute top-3 left-3">
        <Image
          className="dark:invert"
          src="/images/tempo-removebg-preview.png"
          alt="Tempo logo"
          width={120}
          height={40}
          priority
        />
      </div>

      {/* Welcome Message */}
      <div className="mt-20 text-left"> {/* Adjusted margin to position below logo */}
        {user && (() => {
          const userName = user.emailAddresses[0].emailAddress.split('@')[0];
          const capitalizedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);

          return (
            <h1 className="text-2xl font-bold text-blue-500">
              Welcome to Tempo, {capitalizedUserName}!
            </h1>
          );
        })()}
      </div>

      {/* Schedule Section */}
      <div className="mt-12">
        <Schedule /> {/* Schedule component handles the grid itself */}
      </div>

      {/* Profile Section */}
      <Profile user={user} signOut={signOut} />
    </div>
  );
}
