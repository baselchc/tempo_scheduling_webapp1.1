import React from 'react';
import Image from 'next/image';
import { Home, Schedule, Work, AccountCircle } from '@mui/icons-material';
import { useUser } from '@clerk/nextjs';

const NavBar = ({ menuOpen, toggleMenu }) => {
  const { user } = useUser();

  const navItems = [
    { name: "Home", href: "/", icon: <Home /> },
    { name: "Schedule", href: "/employee/schedule", icon: <Schedule /> },
    { name: "Open Shifts", href: "/employee/openshifts", icon: <Work /> },
    { name: "Profile", href: "/employee/profile", icon: <AccountCircle /> },
  ];

  return (
    <nav
      className={`bg-black/50 backdrop-blur-md flex flex-col h-full min-h-screen justify-between p-4 fixed top-0 left-0 z-40 transition-all duration-300 ease-in-out transform ${menuOpen ? 'w-64' : 'w-20'}`}
    >
      <div>
        {/* Logo */}
        <div className="flex justify-center items-center mb-3">
          <div className="w-200 h-200"> {/* Set fixed size for container */}
            <Image
              className="dark:invert"
              src="/images/tempo-removebg-preview.png"
              alt="Tempo logo"
              width={110} // Set fixed width
              height={110} // Set fixed height
              priority
            />
          </div>
        </div>

        {/* Navigation Links */}
        <ul className="space-y-4">
          {navItems.map((item, index) => (
            <li key={index} className="flex items-center gap-2 text-white hover:bg-blue-600 p-2 rounded cursor-pointer">
              <a href={item.href} className="flex items-center gap-2">
                {item.icon}
                {menuOpen && <span>{item.name}</span>} {/* Show name only if menu is open */}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Hamburger Menu Button (Moved to the bottom of the navbar) */}
      <button
        className="text-white text-3xl p-4 z-50 cursor-pointer self-center mt-auto"
        onClick={toggleMenu}
      >
        {menuOpen ? '✕' : '☰'} {/* This is the close (✕) and open (☰) icon */}
      </button>
    </nav>
  );
};

export default NavBar;
