"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import NavBar from '../components/NavBar'; // Import the NavBar component
import { Notifications } from '@mui/icons-material'; // Import Material UI icons for notifications
import Image from 'next/image'; // Correct Image import
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import EmployeeCalendar from '../components/Calendar'; // Import the Calendar component

export default function SchedulePage() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const router = useRouter(); // Initialize the router

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);  // Toggle sidebar
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  return (
    <div className="relative min-h-screen text-black">
      {/* Blurred background image */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl"
        style={{
          backgroundImage: `url('/images/loginpagebackground.webp')`,
        }}
      ></div>

      {/* Navigation Bar */}
      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      {/* Top Right: User Info & Notifications */}
      <div className="absolute top-4 right-8 flex items-center gap-4 z-50">
        {/* Notifications Bell */}
        <button onClick={toggleNotifications} className="relative">
          <Notifications className="text-white text-4xl cursor-pointer" />
          {/* Notification Popup */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 z-50">
              <p>No new notifications.</p>
            </div>
          )}
        </button>

        {/* User Profile Dropdown */}
        <button onClick={toggleProfileMenu} className="flex items-center gap-2">
          <Image
            className="rounded-full"
            src={user?.profileImageUrl || '/images/default-avatar.png'} // Use local default avatar image
            alt="Profile image"
            width={40}
            height={40}
          />
          <span className="text-white font-semibold">{user?.emailAddresses[0].emailAddress}</span>
        </button>
        {profileMenuOpen && (
          <div className="absolute top-16 right-0 bg-white shadow-lg rounded-lg p-4 w-48 z-50">
            <ul>
              {/* Edit Profile Option - Navigate to /employee/profile */}
              <li
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push('/employee/profile')}
              >
                Edit Profile
              </li>
              <li
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => signOut()}
              >
                Log Out
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Main content space */}
      <div className="flex-grow p-8 ml-0 md:ml-64 transition-all z-10">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Your Schedule
        </h1>

        {/* Calendar Component */}
        <div className="mt-8 bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white">
          <EmployeeCalendar />
        </div>
      </div>
    </div>
  );
}

 {/* Code enhanced by AI (ChatGPT 4o) Prompt was: Create a schedule page.js that shows the exact 
  same calendar that is on the employee page.js and keep the same exact layout, functionality and looks */}