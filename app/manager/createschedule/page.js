// app/manager/createschedule/page.js

"use client";
import { useUser, useAuth } from '@clerk/nextjs';
import { useState, useEffect, useCallback, useRef } from 'react';
import NavBar from '../components/NavBar';
import ModernScheduleCalendar from '../components/SchedulerCalendar';
import { supabase } from '../../../backend/database/supabaseClient';

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

  const fetchUserProfileImage = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
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

  const handleRemoveFromShift = async (shiftId) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', shiftId);

      if (error) throw error;
      
      if (calendarRef.current?.refreshData) {
        await calendarRef.current.refreshData();
      }
      alert('Employee removed from shift successfully');
    } catch (error) {
      console.error('Error removing employee from shift:', error);
      alert('Failed to remove employee from shift');
    }
  };

  const handleAutoGenerate = useCallback(async () => {
    console.log('Starting auto-generate process...');
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      setError('Request timed out. Please try again.');
      console.error('Request timed out.');
    }, 60000);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available.');
      }

      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const response = await fetch('/api/schedule/generate-schedule', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ monthStart: firstDayOfMonth.toISOString() }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `Failed to generate schedule. Status: ${response.status}`);
      }

      const result = await response.json();

      if (calendarRef.current?.refreshData) {
        await calendarRef.current.refreshData();
      }

      alert('Schedule generated successfully!');
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('Request aborted due to timeout.');
      } else {
        console.error('Error during schedule generation:', err.message);
      }
      setError(err.message);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [getToken, currentMonth]);
  
  const handleMonthChange = (newMonth) => setCurrentMonth(newMonth);

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
              <span>Generate Monthly Schedule</span>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Error: {error}</p>
            <p>Please check console logs for more details.</p>
          </div>
        )}

        <div className="mt-6">
          <ModernScheduleCalendar
            ref={calendarRef}
            onMonthChange={handleMonthChange}
            onShiftRemove={handleRemoveFromShift}
          />
        </div>
      </div>
    </div>
  );
}