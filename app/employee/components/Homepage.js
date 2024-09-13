"use client";
import { useUser, useAuth } from '@clerk/nextjs';
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Homepage() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [location, setLocation] = useState({ lat: null, lon: null });

  // Fetch user's location using Geolocation API
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      });
    }
  }, []);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Schedule", href: "/schedule" },
    { name: "Open Shifts", href: "/openshifts" },
    { name: "Profile", href: "/profile" },
  ];

  return (
    <div className="relative flex">
      {/* Vertical Navbar */}
      <nav className="bg-blue-500 h-screen w-1/5 flex flex-col justify-between p-4">
        <div>
          <Image
            className="dark:invert mb-6"
            src="/images/tempo-removebg-preview.png"
            alt="Tempo logo"
            width={120}
            height={40}
            priority
          />
          <ul className="space-y-4">
            {navItems.map((item, index) => (
              <li key={index} className="text-white hover:bg-blue-600 p-2 rounded">
                <a href={item.href}>{item.name}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-white mt-auto">
          <div>Location:</div>
          {location.lat && location.lon ? (
            <div>
              <p>Latitude: {location.lat.toFixed(2)}</p>
              <p>Longitude: {location.lon.toFixed(2)}</p>
            </div>
          ) : (
            <p>Fetching location...</p>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="w-4/5 p-8">
        <div className="text-right">
          {user && (() => {
            const userName = user.emailAddresses[0].emailAddress.split('@')[0];
            const capitalizedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);
            return (
              <>
                <div className="text-2xl font-bold">
                  Welcome to Tempo, {capitalizedUserName}!
                </div>
                <div className="text-xl font-semibold mt-4">Schedule</div>
                <div className="text-xl font-semibold mt-2">Open Shifts</div>
              </>
            );
          })()}
        </div>

        <div className="flex items-center gap-4 fixed bottom-8 right-8">
          <Image
            className="rounded-full"
            src={user?.profileImageUrl || '/default-avatar.png'}
            alt="Profile image"
            width={50}
            height={50}
          />
          <div>
            <div className="font-bold">{user?.emailAddresses[0].emailAddress}</div>
            <div className="text-sm text-gray-500">
              ({user?.organizationMemberships?.[0]?.role === 'org:admin' ? 'Administrator' : 'Member'})
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="ml-4 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-12 w-40 px-5"
          >
            Sign Out →
          </button>
        </div>
      </div>
    </div>
  );
}
