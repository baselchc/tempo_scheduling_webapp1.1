"use client";
import { useUser, useAuth } from '@clerk/nextjs';
import { useState, useEffect, useCallback, useRef } from 'react';
import NavBar from '../components/NavBar';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AvailabilitySection from '../components/AvailabilitySection';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function EmployeeProfile() {
  const { user, isLoaded } = useUser();
  const { getToken, signOut } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const mountedRef = useRef(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [availability, setAvailability] = useState({});
  const [clerkUserId, setClerkUserId] = useState(null);

  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  const router = useRouter();

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = await getToken();

      // Ensure Clerk User ID is retrieved from the `user` object
      if (user?.id) {
        setClerkUserId(user.id); // Pass this to AvailabilitySection
        console.log("Fetched Clerk User ID:", user.id);
      } else {
        console.error("Clerk User ID is missing.");
      }

      const [profileResponse, availabilityResponse] = await Promise.all([
        fetch(`${apiUrl}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/users/availability`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await profileResponse.json();
      setFirstName(profileData.firstName || '');
      setLastName(profileData.lastName || '');
      setEmail(profileData.email || '');
      setPhone(profileData.phone || '');
      setUsername(profileData.username || '');
      if (profileData.profileImageUrl) {
        setProfileImagePreview(profileData.profileImageUrl);
      }

      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json();
        setAvailability(availabilityData.availability || {});
      }
    } catch (error) {
      setError(error.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, user?.id]);

  useEffect(() => {
    mountedRef.current = true;
    if (isLoaded) {
      fetchUserProfile();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [isLoaded, fetchUserProfile]);

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
      setSuccessMessage(null);

      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('username', username);
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      const token = await getToken();
      const response = await fetch(`${apiUrl}/api/users/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccessMessage('Profile updated successfully!');
      fetchUserProfile();
    } catch (error) {
      setError(`Error updating profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="relative min-h-screen text-black">
      <Image
        src="/images/loginpagebackground.webp"
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl"
      />

      <NavBar menuOpen={menuOpen} toggleMenu={() => setMenuOpen(!menuOpen)} />

      <div className={`flex-grow p-8 transition-all z-10 ${menuOpen ? 'ml-64' : 'ml-20'}`}>
        <h1 className="text-4xl font-bold text-center text-white mb-8">Profile Information</h1>

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        <div className="mt-8 bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white">
          <h2 className="text-2xl font-semibold mb-4 text-white">Personal Information</h2>
          <div className="space-y-4">
            {/* Profile Form Inputs */}
            {/* Profile Image */}
            <div>
              <label className="block mb-1 text-white">Profile Image:</label>
              <div className="flex items-start space-x-4">
                <div className="w-32 h-32 relative overflow-hidden rounded-full bg-gray-200">
                  <Image
                    src={profileImagePreview || '/images/default-avatar.png'}
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
                    className="text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-black hover:file:bg-blue-100"
                  />
                  <p className="mt-2 text-sm text-gray-300">
                    Max file size: 5MB. Supported formats: JPEG, PNG, GIF.
                  </p>
                </div>
              </div>
            </div>

            {/* Other Personal Info */}
            <div>
              <label className="block mb-1 text-white">First Name:</label>
              <input
                className="bg-transparent border-b-2 border-white w-full px-2 py-1 text-white"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            {/* Last Name */}
            <div>
              <label className="block mb-1 text-white">Last Name:</label>
              <input
                className="bg-transparent border-b-2 border-white w-full px-2 py-1 text-white"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            {/* Email */}
            <div>
              <label className="block mb-1 text-white">Email:</label>
              <input
                className="bg-transparent border-b-2 border-white w-full px-2 py-1 text-white"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {/* Phone */}
            <div>
              <label className="block mb-1 text-white">Phone:</label>
              <input
                className="bg-transparent border-b-2 border-white w-full px-2 py-1 text-white"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            {/* Username */}
            <div>
              <label className="block mb-1 text-white">Username:</label>
              <input
                className="bg-transparent border-b-2 border-white w-full px-2 py-1 text-white"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Pass Clerk User ID to AvailabilitySection */}
        <AvailabilitySection initialAvailability={availability} clerkUserId={clerkUserId} />

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
