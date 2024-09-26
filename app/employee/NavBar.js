import React from 'react';
import Image from 'next/image';
import { useClerk, useUser } from '@clerk/nextjs';

const NavBar = ({ menuOpen }) => {
  const { signOut } = useClerk();
  const { user } = useUser();

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Schedule", href: "/employee/schedule" },
    { name: "Open Shifts", href: "/employee/openshifts" },
    { name: "Profile", href: "/employee/profile" },
  ];

  // Handle the case when user data is still loading
  if (!user) return <p>Loading...</p>;

  return (
    <nav
      className={`bg-blue-500 h-screen w-64 flex flex-col justify-between p-4 fixed top-0 left-0 z-40 
        transition-transform duration-300 ease-in-out 
        ${menuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:w-1/4 md:h-auto`}
    >
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

      {/* Profile and Sign Out */}
      <div className="flex items-center gap-4 fixed bottom-8 left-4 md:static md:bottom-auto md:left-auto md:ml-4">
        <Image
          className="rounded-full"
          src={user?.profileImageUrl || '/default-avatar.png'} 
          alt="Profile image"
          width={50}
          height={50}
        />
        <div>
          <div className="font-bold text-white">
            {user?.emailAddresses[0]?.emailAddress || 'Unknown'}
          </div>
          <div className="text-sm text-white">
            ({user?.organizationMemberships?.[0]?.role === 'org:admin' ? 'Administrator' : 'Member'})
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="ml-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-all duration-200"
        >
          Sign Out →
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
