"use client";
import { useUser, useAuth } from '@clerk/nextjs';
import { useState, useEffect, useCallback } from 'react';
import NavBar from '../components/NavBar';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function EmployeeProfile() {
  const { user, isLoaded } = useUser();
  const { getToken, signOut } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');

  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // const [availability, setAvailability] = useState({});

  const router = useRouter();

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
      // setAvailability(data.availability || {});
      setProfileImagePreview(data.profileImageUrl || null);
      setIsLoading(false);
    } catch (err) {
      setError(`Failed to load profile: ${err.message}`);
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && getToken) {
      fetchUserProfile();
    }
  }, [isLoaded, getToken, fetchUserProfile]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleNotifications = () => setNotificationsOpen(!notificationsOpen);
  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError("File size exceeds 5MB limit");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError("File must be an image");
        return;
      }
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('username', username);
      // formData.append('availability', JSON.stringify(availability));
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      const response = await fetch(`${apiUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      
      setIsLoading(false);
      alert('Profile updated successfully');
      fetchUserProfile();
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="relative min-h-screen text-black">
      <div className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl" style={{ backgroundImage: `url('/images/loginpagebackground.webp')` }}></div>

      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      <div className="absolute top-4 right-8 flex items-center gap-4 z-50">
        <button onClick={toggleNotifications} className="relative"></button>

        <button onClick={toggleProfileMenu} className="flex items-center gap-2">
          <Image className="rounded-full" src={profileImagePreview || user?.profileImageUrl || '/images/default-avatar.png'} alt="Profile image" width={40} height={40} />
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
        <h1 className="text-4xl font-bold text-center text-white mb-8">Profile Information</h1>

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        <div className="mt-8 bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white">
          <h2 className="text-2xl font-semibold mb-4 text-white">Personal Information</h2>
          <div className="text-white space-y-4">
            <div className="mb-4">
              <label className="block mb-2">Profile Image:</label>
              <div className="flex items-center space-x-4">
                <Image 
                  src={profileImagePreview || user?.profileImageUrl || '/images/default-avatar.png'} 
                  alt="Profile Preview" 
                  width={100} 
                  height={100} 
                  className="rounded-full"
                />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleProfileImageChange}
                  className="text-sm text-grey-500
                    file:mr-5 file:py-2 file:px-6
                    file:rounded-full file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-black-700
                    hover:file:cursor-pointer hover:file:bg-amber-50
                    hover:file:text-blue-700"
                />
              </div>
            </div>
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
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition duration-300 ease-in-out text-lg font-semibold" 
            onClick={handleProfileSubmit} 
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}