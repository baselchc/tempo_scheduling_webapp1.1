"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import { Notifications } from '@mui/icons-material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import EmployeeCalendar from './components/Calendar';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://tempo-scheduling-webapp1-1.vercel.app'
  : process.env.NEXT_PUBLIC_NGROK_URL || process.env.NEXT_PUBLIC_API_URL;

export default function EmployeePage() {
  const { signOut, getToken } = useAuth(); // Add getToken here
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState('/images/default-avatar.png');

  const router = useRouter();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleNotifications = () => setNotificationsOpen(!notificationsOpen);
  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  // Fetch user profile image directly from the backend, similar to the profile page
  useEffect(() => {
    const fetchUserProfileImage = async () => {
      try {
        const token = await getToken(); // Use getToken from useAuth
        const response = await fetch(`${apiUrl}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        console.log('Fetched profile data:', data); // Log profile data to check if image URL is correct
  
        if (response.ok && data.profileImageUrl) {
          const uniqueImageUrl = `${data.profileImageUrl}?t=${new Date().getTime()}`;
          setProfileImageUrl(uniqueImageUrl);
        } else {
          setProfileImageUrl('/images/default-avatar.png'); // Fallback if no URL is present
        }
      } catch (error) {
        console.error('Error fetching profile image:', error);
      }
    };
  
    if (user) {
      fetchUserProfileImage();
    }
  }, [user, getToken]);
  

  return (
    <div className="relative min-h-screen text-black">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl"
        style={{ backgroundImage: `url('/images/loginpagebackground.webp')` }}
      ></div>

      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      <div className="absolute top-4 right-8 flex items-center gap-4 z-50">
        <button onClick={toggleNotifications} className="relative">
          <Notifications className="text-white text-4xl cursor-pointer" />
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 z-50">
              <p>No new notifications.</p>
            </div>
          )}
        </button>

        <button onClick={toggleProfileMenu} className="flex items-center gap-2">
          <Image
            className="rounded-full"
            src={profileImageUrl}
            alt="Profile image"
            width={40}
            height={40}
            onError={() => setProfileImageUrl('/images/default-avatar.png')}
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

      <div className={`flex-grow p-8 transition-all z-10 ${menuOpen ? 'ml-64' : 'ml-20'}`}>
        <h1 className="text-4xl font-bold text-left text-white mb-8">Welcome to the Employee Dashboard</h1>
        <div className="mt-6 text-center">
          {user ? (
            <>
              <h3 className="text-xl font-bold">Hello, {user.firstName} {user.lastName}!</h3>
              <p className="text-sm text-gray-500">{user.publicMetadata?.role || ""}.</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Loading user information...</p>
          )}
        </div>

        <EmployeeCalendar />
      </div>
    </div>
  );
}


 {/*Code enhanced by AI (ChatGPT 4o) Prompts were: Create a consistent look of the page with the login page, 
  add the blurred background and adjust they layout to match the same feel of the login page.*/}