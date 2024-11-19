// app/manager/components/NavBar.js

import React, { useState } from 'react';
import Image from 'next/image';
import { Home, Schedule, Work, AccountCircle, AddCircle, List, Check, Message} from '@mui/icons-material'; // Import Material UI icons
import { useUser } from '@clerk/nextjs';

const NavBar = ({ menuOpen, toggleMenu }) => {
  const { user } = useUser();

  const navItems = [
    { name: "Home", href: "/", icon: <Home /> },
    { name: "Messages", href: "/manager/messages", icon: <Message /> },
    { name: "Schedule", href: "/manager/schedule", icon: <Schedule /> },
    { name: "Open Shifts", href: "/manager/openshifts", icon: <Work /> },
    { name: "Profile", href: "/manager/profile", icon: <AccountCircle /> },
  ];

  const managerNavItems = [
    { name: "Create Schedule", href: "/manager/createschedule", icon: <AddCircle /> },
    { name: "Employee List", href: "/manager/employeelist", icon: <List /> },
    { name: "Approve Shifts", href: "/manager/approveshifts", icon: <Check /> },
  ];

  return (
    <nav
      className={`bg-black/50 backdrop-blur-md flex flex-col h-full min-h-screen justify-between p-4 fixed top-0 left-0 z-40 transition-all duration-300 ease-in-out transform ${menuOpen ? 'w-64' : 'w-20'}`}
    >
      <div>
        {/* Logo */}
        <div className={`flex items-center justify-center mb-3 ${menuOpen ? '' : ''}`}>
          <Image
            className="dark:invert"
            src="/images/tempo-removebg-preview.png"
            alt="Tempo logo"
            width={menuOpen ? 150 : 60} // Bigger logo in both expanded and collapsed views
            height={menuOpen ? 50 : 50}
            priority
          />
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

          <li className="flex items-center justify-center">
            <hr className="border border-gray-600 my-2 w-full" />
          </li>

          {managerNavItems.map((item, index) => (
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
 {/*Code enhanced by AI (ChatGPT 4o) Prompts were: Create a consistent look of the navbar with the login page, 
  add icons to the labels from the material icons library and make the opener visible at all times, and the buttons clickable when
  expanded or not.*/}