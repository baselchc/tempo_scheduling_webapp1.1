"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import NavBar from './components/NavBar'; // Import the NavBar component
import { Notifications } from '@mui/icons-material'; // Icons for user and notifications
import Image from 'next/image'; // Correct Image import
import { useRouter } from 'next/navigation'; // Import useRouter for navigation

export default function EmployeePage() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [code, setCode] = useState(''); // State for local stored code
  const [storedCode, setStoredCode] = useState(localStorage.getItem('storedCode') || '1111'); // Initialize with local storage value

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

  // Handle the code change
  const handleCodeChange = () => {
    localStorage.setItem('storedCode', code); // Update local storage
    setStoredCode(code); // Update local stored code state
    setCode(''); // Clear input after saving
  };

  return (
    <div className="relative min-h-screen text-black">
      {/* Blurred background image */}
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
          Welcome to the Manager Dashboard
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

        {/* Change Local Storage Code Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Change New Employee Code</h2>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter new code"
            className="p-2 rounded-md border-2 border-white bg-transparent text-black placeholder-white focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            onClick={handleCodeChange}
            className="ml-4 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-300 transition-colors"
          >
            Change Code
          </button>
          <p className="mt-2 text-white">Current Code: {storedCode}</p>
        </div>
      </div>
    </div>
  );
}

 {/*Code enhanced by AI (ChatGPT 4o) Prompts were: Create a consistent look of the page with the login page, 
  add the blurred background and adjust they layout to match the same feel of the login page, this page should handle the open shifts
  tab and allow a view of Available Shifts and Open Shifts.*/}