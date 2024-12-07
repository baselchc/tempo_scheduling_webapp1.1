"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import { Notifications } from '@mui/icons-material';
import Image from 'next/image';
import { supabase } from '../../../backend/database/supabaseClient';

export default function CreateSchedulePage() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState('/images/default-avatar.png');
  const [notifications, setNotifications] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [reason, setReason] = useState('');
  const [weekPeriod, setWeekPeriod] = useState('');

  const toggleNotifications = () => setNotificationsOpen(!notificationsOpen);
  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);
  const toggleMenu = () => setMenuOpen(!menuOpen);

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

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', user.id)
        .single();

      if (userError || !userRecord) {
        console.error('Error fetching user record:', userError.message);
        return;
      }

      const userId = userRecord.id;

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:from_user_id (first_name, last_name)
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

  // Fetch employees for the dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, clerk_user_id, first_name, last_name'); // Include clerk_user_id

      if (error) {
        console.error('Error fetching employees:', error.message);
      } else {
        setEmployees(data || []);
      }
    };

    fetchEmployees();
  }, []);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEmployee || !shiftStart || !shiftEnd || !weekPeriod) {
      alert("Please fill in all required fields.");
      return;
    }

    // Find the selected employee's clerk_user_id
    const employee = employees.find((emp) => emp.clerk_user_id === selectedEmployee);
    if (!employee) {
      alert("Selected employee has an invalid ID.");
      return;
    }

    const { error } = await supabase
      .from('my_shifts')
      .insert({
        user_id: selectedEmployee, // Use clerk_user_id
        shift_start: shiftStart,
        shift_end: shiftEnd,
        reason: reason,
        week_period: weekPeriod,
        assigned_to: selectedEmployee, // Assign to the correct user
      });

    if (error) {
      console.error('Error creating schedule:', error.message);
      alert("An error occurred while creating the schedule.");
    } else {
      alert("Schedule created successfully!");
      setShiftStart('');
      setShiftEnd('');
      setReason('');
      setWeekPeriod('');
      setSelectedEmployee('');
    }
  };

  return (
    <div className="relative min-h-screen text-black flex">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl"
        style={{ backgroundImage: `url('/images/loginpagebackground.webp')` }}
      ></div>

      {/* Navbar */}
      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      <div className={`flex-grow transition-all ${menuOpen ? 'ml-64' : 'ml-20'} p-8`}>
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
                <li className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => signOut()}>
                  Log Out
                </li>
              </ul>
            </div>
          )}
        </div>

        <h1 className="text-4xl font-bold text-left text-white mb-8">Create Schedule</h1>
        
        {/* Create Schedule Form */}
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
              <input type="datetime-local" id="shiftStart" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500" required />
            </div>
            <div className="mb-4">
              <label htmlFor="shiftEnd" className="block text-gray-700 font-bold mb-2">Shift End</label>
              <input type="datetime-local" id="shiftEnd" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500" required />
            </div>
            <div className="mb-4">
              <label htmlFor="reason" className="block text-gray-700 font-bold mb-2">Reason</label>
              <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500" rows="3"></textarea>
            </div>
            <div className="mb-4">
              <label htmlFor="weekPeriod" className="block text-gray-700 font-bold mb-2">Week Period</label>
              <input type="date" id="weekPeriod" value={weekPeriod} onChange={(e) => setWeekPeriod(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500" required />
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-200">
              Create Schedule
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


// chatgpt prompt for enhancing :Create a React component with useState and useEffect for scheduling shifts. 
//Use axios to fetch employees (GET /api/employees/get-employees) and submit schedules (POST /api/schedule/create-schedule). 
//Include date/time pickers, auto-fill shift end, and display success/failure messages. Style with Tailwind CSS.