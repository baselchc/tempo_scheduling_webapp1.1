"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import NavBar from './components/NavBar'; // Import the NavBar component
import { AccountCircle, Notifications } from '@mui/icons-material'; // Icons for user and notifications
import Image from 'next/image'; // Correct Image import
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import EmployeeCalendar from './components/Calendar'; // Import the Calendar component

export default function EmployeePage() {
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
      <Image
          src="/images/loginpagebackground.webp" // Ensure this path is correct
          alt="Background"
          layout="fill" // Use fill layout to cover the parent div
          objectFit="cover" // Cover the entire area
          className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl" // Add blur class here
      />

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
                onClick={() => router.push('/employee/profile')} // Navigate to the profile page
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
      <div className={`flex-grow p-8 transition-all z-10 ${menuOpen ? 'ml-64' : 'ml-20'}`}>
        <h1 className="text-4xl font-bold text-left text-white mb-8">
          Welcome to the Employee Dashboard
        </h1>
        {/* User Information */}
        <div className="mt-6 text-center">
        {user ? (
          <>
            <h3 className="text-xl font-bold">Hello, {user.firstName} {user.lastName}!</h3>
            <p className="text-sm text-gray-500"> {user.publicMetadata?.role || ""}.</p>
          </>
        ) : (
          <p className="text-sm text-gray-500">Loading user information...</p>
        )}
      </div>

        {/* Calendar Component */}
        <EmployeeCalendar />
        
      </div>
    </div>
  );
}
 {/*Code enhanced by AI (ChatGPT 4o) Prompts were: Create a consistent look of the page with the login page, 
  add the blurred background and adjust they layout to match the same feel of the login page.*/}