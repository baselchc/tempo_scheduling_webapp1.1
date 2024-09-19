"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import Image from "next/image";

export default function EmployeePage() {
  const { signOut } = useAuth();
  const { user } = useUser();

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Schedule", href: "/schedule" },
    { name: "Open Shifts", href: "/openshifts" },
    { name: "Profile", href: "/profile" },
  ];

  return (
    <div className="relative flex">
      {/* Vertical Navbar */}
      <nav className="bg-blue-500 h-screen w-1/4 flex flex-col justify-between p-4">
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

          <div className="flex items-center gap-4 fixed bottom-8 left">
          <Image
            className="rounded-full"
            src={user?.profileImageUrl || '/default-avatar.png'}
            alt="Profile image"
            width={50}
            height={50}
          />
          <div>
            <div className="font-bold">{user?.emailAddresses[0].emailAddress}</div>
            <div className="text-sm text-white">
              ({user?.organizationMemberships?.[0]?.role === 'org:admin' ? 'Administrator' : 'Member'})
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="ml-1 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-12 w-40 px-5 "
          >
            Sign Out →
          </button>
          </div>
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
              </>
            );
          })}
      </div>

        {/* Shifts for the Next 7 Days */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Shift Info Here</h2>
        </div>

        
      </div>
    </div>
  );
}
