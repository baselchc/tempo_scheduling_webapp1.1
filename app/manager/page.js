"use client";
import { useUser, useAuth } from '@clerk/nextjs';
import { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import NavBar from './components/NavBar';
import { Notifications } from '@mui/icons-material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ManagerDashboard() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState("/images/default-avatar.png");
  const [userSchedules, setUserSchedules] = useState([]);
  const [weekStartDate, setWeekStartDate] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleMenu = useCallback(() => setMenuOpen(prev => !prev), []);
  const toggleNotifications = useCallback(() => setNotificationsOpen(prev => !prev), []);
  const toggleProfileMenu = useCallback(() => setProfileMenuOpen(prev => !prev), []);

  const processScheduleData = useCallback((scheduleData) => {
    const employeeSchedules = new Map();

    scheduleData.forEach(schedule => {
      if (!employeeSchedules.has(schedule.employee_id)) {
        employeeSchedules.set(schedule.employee_id, {
          userId: schedule.employee_id,
          userName: `${schedule.first_name} ${schedule.last_name}`,
          shifts: Array(7).fill("Off")
        });
      }

      const dayIndex = new Date(schedule.date).getDay();
      const currentSchedule = employeeSchedules.get(schedule.employee_id);
      currentSchedule.shifts[dayIndex] = `${schedule.shift_type} (${schedule.status})`;
    });

    return Array.from(employeeSchedules.values());
  }, []);

  const fetchWeeklySchedule = useCallback(async (startDate) => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch(
        `/api/schedule/weekly-schedule/${user?.id}?week_start=${format(startDate, 'yyyy-MM-dd')}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const data = await response.json();
      setUserSchedules(processScheduleData(data));
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, getToken, processScheduleData]);

  const fetchUserProfileImage = useCallback(async () => {
    if (!user) return;

    try {
      const token = await getToken();
      const response = await fetch("/api/users/profile", {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });

      const data = await response.json();
      setProfileImageUrl(
        response.ok && data.profileImageUrl
          ? `${data.profileImageUrl}?t=${new Date().getTime()}`
          : "/images/default-avatar.png"
      );
    } catch (error) {
      console.error("Error fetching profile image:", error);
    }
  }, [user, getToken]);

  const handlePreviousWeek = useCallback(() => {
    setWeekStartDate(prevDate => subDays(prevDate, 7));
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekStartDate(prevDate => addDays(prevDate, 7));
  }, []);

  const handleNotificationClick = async (notificationId) => {
    try {
      const token = await getToken();
      await fetch(`/api/notifications/mark-as-read/${notificationId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/manager/notifications");
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  useEffect(() => {
    fetchUserProfileImage();
  }, [fetchUserProfileImage]);

  useEffect(() => {
    if (user) {
      const startOfWeek = new Date(weekStartDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      fetchWeeklySchedule(startOfWeek);
    }
  }, [weekStartDate, user, fetchWeeklySchedule]);

  return (
    <div className="relative min-h-screen text-black">
      <Image
        src="/images/loginpagebackground.webp"
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl"
        priority
      />

      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      <div className="absolute top-4 right-8 flex items-center gap-4 z-50">
        <button 
          onClick={toggleNotifications} 
          className="relative"
          aria-label="Toggle notifications"
        >
          <Notifications className="text-white text-4xl cursor-pointer" />
          {notifications.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-4 flex items-center justify-center">
              {notifications.length}
            </span>
          )}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 z-50">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className="mb-2">
                    <p>{notification.message}</p>
                  </div>
                ))
              ) : (
                <p>No new notifications.</p>
              )}
            </div>
          )}
        </button>

        <button 
          onClick={toggleProfileMenu} 
          className="flex items-center gap-2"
          aria-label="Toggle profile menu"
        >
          <Image
            className="rounded-full"
            src={profileImageUrl}
            alt="Profile"
            width={40}
            height={40}
          />
          <span className="text-white font-semibold">
            {user?.emailAddresses[0].emailAddress}
          </span>
        </button>
      </div>

      <div className={`flex-grow p-8 transition-all z-10 ${menuOpen ? "ml-64" : "ml-20"}`}>
        <h1 className="text-4xl font-bold text-left text-white mb-8">
          Welcome to the Manager Dashboard
        </h1>
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-4">
            <button 
              onClick={handlePreviousWeek}
              className="hover:bg-white/20 p-2 rounded transition-colors"
              aria-label="Previous week"
            >
              {"←"}
            </button>
            {`Weekly Employee Schedule - ${format(weekStartDate, "MMMM")}`}
            <button 
              onClick={handleNextWeek}
              className="hover:bg-white/20 p-2 rounded transition-colors"
              aria-label="Next week"
            >
              {"→"}
            </button>
          </h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-center">
                <thead>
                  <tr>
                    <th className="text-left p-4">Employee</th>
                    {Array.from({ length: 7 }).map((_, index) => {
                      const day = addDays(weekStartDate, index - weekStartDate.getDay());
                      return (
                        <th key={index} className="p-4">
                          {format(day, "EEE do")}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {userSchedules.map((user) => (
                    <tr key={user.userId}>
                      <td className="text-left p-4 border-b">{user.userName}</td>
                      {user.shifts.map((shift, shiftIndex) => (
                        <td key={shiftIndex} className="p-4 border-b">
                          {shift}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
