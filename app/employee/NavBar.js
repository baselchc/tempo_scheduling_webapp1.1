import React from 'react';
import Image from 'next/image';
import { useUser, useAuth } from '@clerk/nextjs';

const NavBar = ({ menuOpen }) => {
  const { user } = useUser();
  const { signOut } = useAuth();


  const navItems = [
    { name: "Home", href: "/" },
    { name: "Schedule", href: "/employee/schedule" },
    { name: "Open Shifts", href: "/employee/openshifts" },
    { name: "Profile", href: "/employee/profile" },
  ];

  return (
    <nav
      className={`bg-blue-500 flex flex-col h-full min-h-screen justify-between p-4 fixed top-0 left-0 z-40 transition-transform duration-300 ease-in-out transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:w-64`}
    >
      <div>
        {/* Logo */}
        <Image
          className="dark:invert mb-6"
          src="/images/tempo-removebg-preview.png"
          alt="Tempo logo"
          width={120}
          height={40}
          priority
        />

        {/* Navigation Links */}
        <ul className="space-y-4">
          {navItems.map((item, index) => (
            <li key={index} className="text-white hover:bg-blue-600 p-2 rounded">
              <a href={item.href}>{item.name}</a>
            </li>
          ))}
        </ul>
      </div>

      {/* Profile and Sign Out */}
      <div className="mt-auto flex items-center gap-4">
        <Image
          className="rounded-full"
          src={user?.profileImageUrl || '/default-avatar.png'}
          alt="Profile image"
          width={50}
          height={50}
        />
        <div>
          <div className="font-bold text-white">
            {user?.emailAddresses[0].emailAddress}
          </div>
          <div className="text-sm text-white">
            ({user?.organizationMemberships?.[0]?.role === 'org:admin' ? 'Administrator' : 'Member'})
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="ml-auto mt-4 rounded-full border border-transparent bg-red-500 text-white hover:bg-red-800 transition-colors p-2 w-80 h-16"
        >
          Sign Out →
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
