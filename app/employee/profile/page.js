"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import NavBar from '../components/NavBar'; // Import the NavBar component
import Image from 'next/image'; // Import Next.js Image
import { useRouter } from 'next/navigation'; // Import useRouter for navigation

export default function EmployeeProfile() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Editable fields for profile information
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.emailAddresses[0]?.emailAddress || '');
  const [phone, setPhone] = useState(user?.phoneNumbers?.[0]?.phoneNumber || 'N/A');

  // Editable availability
  const [availability, setAvailability] = useState({
    Monday: 'Available',
    Tuesday: 'Available',
    Wednesday: 'Available',
    Thursday: 'Available',
    Friday: 'Available',
    Saturday: 'Not Available',
    Sunday: 'Not Available',
  });

  const router = useRouter(); // Initialize router

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);  // Toggle sidebar
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  // Handle availability change
  const handleAvailabilityChange = (day, value) => {
    setAvailability(prevAvailability => ({
      ...prevAvailability,
      [day]: value,
    }));
  };

  // Handle profile submission (save changes)
  const handleProfileSubmit = () => {
    // Logic for saving profile updates (e.g., API call or state update)
    console.log("Profile updated:", { firstName, lastName, email, phone, availability });
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
            src={user?.profileImageUrl || '/images/default-avatar.png'}
            alt="Profile image"
            width={40}
            height={40}
          />
          <span className="text-white font-semibold">{user?.emailAddresses[0].emailAddress}</span>
        </button>
        {profileMenuOpen && (
          <div className="absolute top-16 right-0 bg-white shadow-lg rounded-lg p-4 w-48 z-50">
            <ul>
              <li className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => router.push('/employee/profile')}>
                Edit Profile
              </li>
              <li className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => signOut()}>
                Log Out
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Main content space */}
      <div className="flex-grow p-8 ml-0 md:ml-64 transition-all z-10">
        <h1 className="text-4xl font-bold text-center text-white mb-8">Profile Information</h1>

        {/* Profile Information Section */}
        <div className="mt-8 bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white">
          <h2 className="text-2xl font-semibold mb-4 text-white">Personal Information</h2>
          <div className="text-white">
            <p>
              <strong>First Name:</strong>
              <input
                className="bg-transparent border-b-2 border-white w-full"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </p>
            <p>
              <strong>Last Name:</strong>
              <input
                className="bg-transparent border-b-2 border-white w-full"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </p>
            <p>
              <strong>Email:</strong>
              <input
                className="bg-transparent border-b-2 border-white w-full"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </p>
            <p>
              <strong>Phone:</strong>
              <input
                className="bg-transparent border-b-2 border-white w-full"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </p>
            <button
              className="mt-4 bg-blue-400 text-white p-2 rounded-lg"
              onClick={handleProfileSubmit}
            >
              Save Profile
            </button>
          </div>
        </div>

        {/* Availability Section */}
        <div className="mt-8 bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white">
          <h2 className="text-2xl font-semibold mb-4 text-white">Availability</h2>
          <table className="min-w-full bg-transparent">
            <thead>
              <tr className="bg-black/20">
                <th className="text-left p-4 font-semibold text-white">Day of the week:</th>
                <th className="text-left p-4 font-semibold text-white">Availability:</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(availability).map((day) => (
                <tr key={day}>
                  <td className="p-4 text-white">{day}</td>
                  <td className="p-4 text-white">
                    <select
                      className="bg-transparent border-b-2 border-white w-full"
                      value={availability[day]}
                      onChange={(e) => handleAvailabilityChange(day, e.target.value)}
                    >
                      <option className="bg-black/20" value="Available">Available</option>
                      <option className="bg-black/20" value="Not Available">Not Available</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className="mt-4 bg-blue-400 text-white p-2 rounded-lg"
            onClick={handleProfileSubmit}
          >
            Save Availability
          </button>
        </div>
      </div>
    </div>
  );
}
