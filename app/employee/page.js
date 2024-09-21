"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import Image from "next/image";

export default function EmployeePage() {
  const { signOut } = useAuth();
  const { user } = useUser();

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Schedule", href: "/employee/schedule" },
    { name: "Open Shifts", href: "/employee/openshifts" },
    { name: "Profile", href: "/employee/profile" },
  ];

  return (
    // Main Page Layout
    <div className="relative flex bg-gray-400">
      {/* Navigation Bar */}
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
              {/* Maybe add just the name by itself or with email underneath it */}
              <div className="font-bold">
                {user?.emailAddresses[0].emailAddress}
              </div> 
              <div className="text-sm text-white">
                ({user?.organizationMemberships?.[0]?.role === 'org:admin' ? 'Administrator' : 'Member'})
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="ml-1 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center dark:hover:bg-gray-400 hover:border-transparent text-sm sm:text-base h-12 w-30 px-5 "
            >
              Sign Out →
            </button>
          </div>
        </div>
      </nav>

    </div>
  );
}
