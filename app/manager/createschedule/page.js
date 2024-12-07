"use client";
import { useUser, useAuth } from '@clerk/nextjs';
import { useState, useEffect, useCallback, useRef } from 'react';
import NavBar from '../components/NavBar';
import Image from 'next/image';
import ModernScheduleCalendar from '../components/SchedulerCalendar';
import { supabase } from '../../../backend/database/supabaseClient'; // Correct import path

export default function CreateSchedulePage() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const [profileImageUrl, setProfileImageUrl] = useState('/images/default-avatar.png');
  const [menuOpen, setMenuOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [reason, setReason] = useState('');
  const [weekPeriod, setWeekPeriod] = useState('');
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

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, clerk_user_id, first_name, last_name');

        if (error) throw error;

        setEmployees(data || []);
      } catch (error) {
        console.error('Error fetching employees:', error.message);
      }
    };

    fetchEmployees();
  }, []);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEmployee || !shiftStart || !shiftEnd || !weekPeriod) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const { error } = await supabase
        .from('my_shifts')
        .insert({
          user_id: selectedEmployee,
          shift_start: shiftStart,
          shift_end: shiftEnd,
          reason: reason,
          week_period: weekPeriod,
        });

      if (error) throw error;

      alert('Schedule created successfully!');
      setShiftStart('');
      setShiftEnd('');
      setReason('');
      setWeekPeriod('');
      setSelectedEmployee('');
    } catch (error) {
      console.error('Error creating schedule:', error.message);
      alert('An error occurred while creating the schedule.');
    }
  };

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

      const response = await fetch('/api/schedule/generate-schedule', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monthStart: firstDayOfMonth.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate schedule');
      }

      const result = await response.json();

      if (calendarRef.current?.refreshData) {
        await calendarRef.current.refreshData();
      }

      alert('Schedule generated successfully!');
    } catch (err) {
      console.error('Error generating schedule:', err.message);
      setError(err.message);
    } finally {
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
            {error}
          </div>
        )}

        <div className="mt-6 bg-white rounded-lg shadow-lg p-6 text-black">
          <form onSubmit={handleScheduleSubmit}>
            <div className="mb-4">
              <label htmlFor="employee" className="block text-gray-700 font-bold mb-2">Select Employee</label>
              <select
                id="employee"
                value={selectedEmployee || ''}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Select Employee --</option>
                {employees.map((employee) => (
                  <option key={employee.clerk_user_id} value={employee.clerk_user_id}>
                    {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="shiftStart" className="block text-gray-700 font-bold mb-2">Shift Start</label>
              <input
                type="datetime-local"
                id="shiftStart"
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="shiftEnd" className="block text-gray-700 font-bold mb-2">Shift End</label>
              <input
                type="datetime-local"
                id="shiftEnd"
                value={shiftEnd}
                onChange={(e) => setShiftEnd(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="reason" className="block text-gray-700 font-bold mb-2">Reason</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                rows="3"
              ></textarea>
            </div>
            <div className="mb-4">
              <label htmlFor="weekPeriod" className="block text-gray-700 font-bold mb-2">Week Period</label>
              <input
                type="date"
                id="weekPeriod"
                value={weekPeriod}
                onChange={(e) => setWeekPeriod(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-200">
              Create Schedule
            </button>
          </form>
          <div className="mt-6">
            <ModernScheduleCalendar
              ref={calendarRef}
              onMonthChange={handleMonthChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
