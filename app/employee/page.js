"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import { Notifications } from '@mui/icons-material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import EmployeeCalendar from './components/Calendar';
import { supabase } from '../../backend/database/supabaseClient';

export default function EmployeePage() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState('/images/default-avatar.png');
  const [notifications, setNotifications] = useState([]);

  const router = useRouter();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleNotifications = () => setNotificationsOpen(!notificationsOpen);
  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  // Fetch user profile image
  useEffect(() => {
    const fetchUserProfileImage = async () => {
      try {
        const token = await getToken();
        const response = await fetch('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        const data = await response.json();
        setProfileImageUrl(response.ok && data.profileImageUrl
          ? `${data.profileImageUrl}?t=${new Date().getTime()}`
          : '/images/default-avatar.png');
      } catch (error) {
        console.error('Error fetching profile image:', error);
      }
    };

    if (user) fetchUserProfileImage();
  }, [user, getToken]);

  // Fetch notifications from Supabase
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      // Step 1: Get the integer user ID from the users table
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', user.id)
        .single();

      if (userError || !userRecord) {
        console.error('Error fetching user record:', userError.message);
        return;
      }

      const userId = userRecord.id; // integer ID

      // Step 2: Fetch notifications with the sender's name associated with `from_user_id`
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:from_user_id (first_name, last_name)  -- Explicitly fetch sender info from from_user_id relationship
        `)
        .or(`to_user_id.eq.${userId},broadcast.eq.true`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error.message);
      } else {
        setNotifications(data || []);
      }
    };

    fetchNotifications();
  }, [user]);

  // Clear all notifications
  const clearNotifications = async () => {
    if (!user) return;

    // Step 1: Get the integer user ID from the users table
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', user.id)
      .single();

    if (userError || !userRecord) {
      console.error('Error fetching user record:', userError.message);
      return;
    }

    const userId = userRecord.id; // integer ID

    // Step 2: Clear notifications
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .match({ to_user_id: userId });

    if (error) {
      console.error('Error clearing notifications:', error.message);
    } else {
      setNotifications([]);
    }
  };

  return (
    <div className="relative min-h-screen text-black">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl"
        style={{ backgroundImage: `url('/images/loginpagebackground.webp')` }}
      ></div>

      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      <div className="absolute top-4 right-8 flex items-center gap-4 z-50">
        <button onClick={(e) => { e.stopPropagation(); toggleNotifications(); }} className="relative">
          <Notifications className="text-white text-4xl cursor-pointer" />
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 z-50" onClick={(e) => e.stopPropagation()}>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className="mb-2">
                      <p>{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        From: {notification.sender ? `${notification.sender.first_name} ${notification.sender.last_name}` : 'Unknown'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No new notifications.</p>
                )}
              </div>
              {notifications.length > 0 && (
                <p className="text-gray-400 text-center mt-2 cursor-pointer" onClick={clearNotifications}>
                  Clear notifications
                </p>
              )}
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