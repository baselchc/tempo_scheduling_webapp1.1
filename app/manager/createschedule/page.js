"use client";
import { useUser, useAuth } from '@clerk/nextjs';
import { useState, useEffect, useCallback, useRef } from 'react';
import NavBar from '../components/NavBar';
import Image from 'next/image';
import ModernScheduleCalendar from '../components/SchedulerCalendar';

export default function CreateSchedulePage() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const [profileImageUrl, setProfileImageUrl] = useState('/images/default-avatar.png');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleMonthChange = useCallback((date) => {
    setCurrentMonth(date);
  }, []);

  const fetchUserProfileImage = useCallback(async () => {
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
  }, [getToken]);

  useEffect(() => {
    if (user) fetchUserProfileImage();
  }, [user, fetchUserProfileImage]);

  const handleAutoGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      
      const firstDayOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      );

      console.log('Generating schedule for month:', firstDayOfMonth.toISOString());
  
      const response = await fetch('/api/schedule/generate-schedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          monthStart: firstDayOfMonth.toISOString()
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate schedule');
      }
  
      const result = await response.json();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (calendarRef.current?.refreshData) {
        await calendarRef.current.refreshData();
      }
  
      alert('Schedule generated successfully!');
    } catch (err) {
      console.error('Error generating schedule:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, currentMonth]);

  return (
    <div className="relative min-h-screen text-black flex">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl"
        style={{ backgroundImage: `url('/images/loginpagebackground.webp')` }}
      />

      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      <div className={`flex-grow transition-all ${menuOpen ? 'ml-64' : 'ml-20'} p-8`}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Create Schedule</h1>
          
          <button
            onClick={handleAutoGenerate}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                <span>Generating Schedule...</span>
              </>
            ) : (
              <>
                <span>Generate Monthly Schedule</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div className="mt-6">
          <ModernScheduleCalendar 
            ref={calendarRef}
            onMonthChange={handleMonthChange} 
          />
        </div>
      </div>
    </div>
  );
}