"use client";
import { useUser, useAuth } from '@clerk/nextjs';
import { useState, useEffect, useCallback } from 'react';
import NavBar from '../components/NavBar';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Define the API URL for making backend requests
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function EmployeeProfile() {
  // Clerk hooks to get the current user and authentication information
  const { user, isLoaded } = useUser();
  const { getToken, signOut } = useAuth();

  // Local state variables to manage various component states and data
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editable fields for profile information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');

  // Default availability state
  const [availability, setAvailability] = useState({
    Monday: 'Available',
    Tuesday: 'Available',
    Wednesday: 'Available',
    Thursday: 'Available',
    Friday: 'Available',
    Saturday: 'Not Available',
    Sunday: 'Not Available',
  });

  const router = useRouter();

  // Function to fetch and populate user profile data when component loads
  const fetchUserProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${apiUrl}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setUsername(data.username || '');
      setAvailability(data.availability || {});
      setIsLoading(false);
    } catch (err) {
      setError(`Failed to load profile: ${err.message}`);
      setIsLoading(false);
    }
  }, [getToken]);

  // Fetch user profile once authentication state and user data are loaded
  useEffect(() => {
    if (isLoaded && getToken) {
      fetchUserProfile();
    }
  }, [isLoaded, getToken, fetchUserProfile]);

  // Toggle functions for various UI states
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleNotifications = () => setNotificationsOpen(!notificationsOpen);
  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  // Handler to update local availability state for a specific day
  const handleAvailabilityChange = (day, value) => {
    setAvailability(prev => ({ ...prev, [day]: value }));
  };

  // Function to submit the updated profile information and availability to the backend
  const handleProfileSubmit = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await fetch(`${apiUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          firstName, 
          lastName, 
          email, 
          phone, 
          username, 
          availability 
        }),
      });

      if (!response.ok) {
        const rawResponse = await response.text();
        throw new Error(`Failed to update profile: ${response.status} ${rawResponse}`);
      }
      
      setIsLoading(false);
    } catch (err) {
      setError(`Failed to update profile: ${err.message}`);
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;

  return (
    <div className="relative min-h-screen text-black">
      {/* Blurred background image */}
      <div className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl" style={{ backgroundImage: `url('/images/loginpagebackground.webp')` }}></div>

      {/* Navigation Bar */}
      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      {/* Top Right: User Info & Notifications */}
      <div className="absolute top-4 right-8 flex items-center gap-4 z-50">
        <button onClick={toggleNotifications} className="relative"></button>

        {/* User Profile Dropdown */}
        <button onClick={toggleProfileMenu} className="flex items-center gap-2">
          <Image className="rounded-full" src={user?.profileImageUrl || '/images/default-avatar.png'} alt="Profile image" width={40} height={40} />
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
      <div className={`flex-grow p-8 transition-all z-10 ${menuOpen ? 'ml-64' : 'ml-20'}`}>
        <h1 className="text-4xl font-bold text-center text-white mb-8">Profile Information</h1>

        {/* Profile Information Section */}
        <div className="mt-8 bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white">
          <h2 className="text-2xl font-semibold mb-4 text-white">Personal Information</h2>
          <div className="text-white space-y-4">
            {/* Editable profile fields */}
            <div>
              <label className="block mb-1">First Name:</label>
              <input className="bg-transparent border-b-2 border-white w-full px-2 py-1" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="block mb-1">Last Name:</label>
              <input className="bg-transparent border-b-2 border-white w-full px-2 py-1" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div>
              <label className="block mb-1">Email:</label>
              <input className="bg-transparent border-b-2 border-white w-full px-2 py-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block mb-1">Phone:</label>
              <input className="bg-transparent border-b-2 border-white w-full px-2 py-1" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block mb-1">Username:</label>
              <input className="bg-transparent border-b-2 border-white w-full px-2 py-1" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition duration-300 ease-in-out" onClick={handleProfileSubmit} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Profile'}
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
              {Object.entries(availability).map(([day, status]) => (
                <tr key={day}>

                  <td className="p-4 text-white">{day}:</td>
                  <td className="p-4">



                    <select
                      className="w-full p-2 rounded-lg bg-black/50 text-white"
                      value={status}
                      onChange={(e) => handleAvailabilityChange(day, e.target.value)}
                    >

                      <option value="Available">Available</option>
                      <option value="Not Available">Not Available</option>
                      <option value="Partially Available">Partially Available</option>

                      <option className="bg-black/20" value="Available">Available</option>
                      <option className="bg-black/20" value="Not Available">Not Available</option>

                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition duration-300 ease-in-out" onClick={handleProfileSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>
    </div>
  );
}

{/*Code enhanced by AI (ChatGPT 4o) Prompts were: Fix the personal information and availability so that it will have place holders for information for the useUser import and  for the availability make is so for now it will be set to available and not abailable
  also have a update it to save the availability and save profile*/}