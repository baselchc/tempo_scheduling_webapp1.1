"use client";
import { useUser, useAuth } from '@clerk/nextjs';
import { useState, useEffect, useCallback } from 'react';
import NavBar from '../components/NavBar';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://tempo-scheduling-webapp1-1.vercel.app'
  : process.env.NEXT_PUBLIC_NGROK_URL || process.env.NEXT_PUBLIC_API_URL;

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
      if (!token || !user) {
        throw new Error('Authentication required');
      }
  
      const response = await fetch(`${apiUrl}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
  
      const data = await response.json();
      
      if (response.ok && data) {
        // Update state only if we have valid data
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setEmail(data.email || user.primaryEmailAddress?.emailAddress || '');
        setPhone(data.phone || '');
        setUsername(data.username || user.username || '');
        setProfileImagePreview(data.profileImageUrl || user.profileImageUrl);
      } else if (response.status === 404) {
        // Handle new user creation
        const createResponse = await fetch(`${apiUrl}/api/users/create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clerk_user_id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            username: user.username,
            first_name: user.firstName,
            last_name: user.lastName,
          })
        });
  
        if (createResponse.ok) {
          const newUserData = await createResponse.json();
          // Set initial data from the newly created user
          setFirstName(newUserData.firstName || user.firstName || '');
          setLastName(newUserData.lastName || user.lastName || '');
          setEmail(newUserData.email || user.primaryEmailAddress?.emailAddress || '');
          setUsername(newUserData.username || user.username || '');
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, user]);
  

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
      
      // Create and revoke object URL to prevent memory leaks
      if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview);
      }
      
      const previewUrl = URL.createObjectURL(file);
      setProfileImagePreview(previewUrl);
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
  
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }
  
      const response = await fetch(`${apiUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update profile' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
  
      const responseData = await response.json();
      
      if (responseData.profileImageUrl) {
        setProfileImagePreview(responseData.profileImageUrl);
      }
      
      setProfileImage(null); // Clear the selected file
      alert('Profile updated successfully');
      
      // Refresh the profile data
      await fetchUserProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="relative min-h-screen text-black">
      <Image
          src="/images/loginpagebackground.webp" // Ensure this path is correct
          alt="Background"
          layout="fill" // Use fill layout to cover the parent div
          objectFit="cover" // Cover the entire area
          className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl" // Add blur class here
      />

      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      <div className="absolute top-4 right-8 flex items-center gap-4 z-50">
        <button onClick={toggleNotifications} className="relative"></button>

        <button onClick={toggleProfileMenu} className="flex items-center gap-2">
  <div className="w-10 h-10 relative overflow-hidden rounded-full">
  <Image
  className="object-cover"
  src={profileImagePreview || user?.profileImageUrl || '/images/default-avatar.png'}
  alt="Profile image"
  fill
  style={{ objectFit: 'cover' }}
  sizes="(max-width: 768px) 100vw,
         (max-width: 1200px) 50vw,
         33vw"
/>


  </div>
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
  <div className="space-y-4">
    <div className="mb-4">
      <label className="block mb-2 text-white">Profile Image:</label>
      <div className="flex items-start space-x-4">
        <div className="w-32 h-32 relative overflow-hidden rounded-full bg-gray-200">
          <Image
            src={profileImagePreview || user?.profileImageUrl || '/images/default-avatar.png'}
            alt="Profile Preview"
            layout="fill"
            objectFit="cover"
          />
        </div>
        <div className="flex-grow">
          <input
            type="file"
            accept="image/*"
            onChange={handleProfileImageChange}
            className="text-sm text-white
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-black
              hover:file:bg-blue-100"
          />
          <p className="mt-2 text-sm text-gray-300">
            Max file size: 5MB. Supported formats: JPEG, PNG, GIF.
          </p>
        </div>
      </div>
    </div>
    <div>
      <label className="block mb-1 text-white">First Name:</label>
      <input className="bg-transparent border-b-2 border-white w-full px-2 py-1 text-white" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
    </div>
    <div>
      <label className="block mb-1 text-white">Last Name:</label>
      <input className="bg-transparent border-b-2 border-white w-full px-2 py-1 text-white" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
    </div>
    <div>
      <label className="block mb-1 text-white">Email:</label>
      <input className="bg-transparent border-b-2 border-white w-full px-2 py-1 text-white" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    </div>
    <div>
      <label className="block mb-1 text-white">Phone:</label>
      <input className="bg-transparent border-b-2 border-white w-full px-2 py-1 text-white" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
    </div>
    <div>
      <label className="block mb-1 text-white">Username:</label>
      <input className="bg-transparent border-b-2 border-white w-full px-2 py-1 text-white" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
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

/* 
Used Claude AI to assit with creation of the page, "List the steps to Allow users to view and edit their profile information"
Which allowed for referencing and learning while creating this page
*/