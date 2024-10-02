"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import { Notifications } from '@mui/icons-material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format, differenceInHours, parse, startOfWeek, endOfWeek } from 'date-fns';

export default function SchedulePage() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [scheduleData] = useState([
    { date: "2024-10-02", shift: "9 AM - 5 PM", status: "Confirmed" },
    { date: "2024-10-03", shift: "10 AM - 6 PM", status: "Confirmed" },
    { date: "2024-10-04", shift: "11 AM - 7 PM", status: "Dropped" },
    { date: "2024-10-05", shift: "12 PM - 8 PM", status: "Confirmed" },
    { date: "2024-10-06", shift: "1 PM - 9 PM", status: "Confirmed" },
    { date: "2024-10-07", shift: "9 AM - 5 PM", status: "Confirmed" },
    { date: "2024-10-08", shift: "8 AM - 4 PM", status: "Extra Shift" },
    { date: "2024-10-09", shift: "9 AM - 5 PM", status: "Confirmed" },
    { date: "2024-10-10", shift: "10 AM - 6 PM", status: "Confirmed" },
    { date: "2024-10-11", shift: "11 AM - 7 PM", status: "Dropped" },
    { date: "2024-10-12", shift: "12 PM - 8 PM", status: "Confirmed" },
  ]);

  const router = useRouter();

  // Set the selected date to today if it is null
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
  }, [selectedDate]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleNotifications = () => setNotificationsOpen(!notificationsOpen);
  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  // Filter schedule based on selected date
  const filteredSchedule = scheduleData.filter((item) =>
    selectedDate
      ? format(new Date(item.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      : true
  );

  const calculateShiftHours = (shift) => {
    const [start, end] = shift.split(' - ');
    const startDate = parse(start, 'h a', new Date());
    const endDate = parse(end, 'h a', new Date());
    return differenceInHours(endDate, startDate);
  };

  const totalHoursWorked = scheduleData
    .filter(item => item.status === "Confirmed")
    .reduce((total, item) => total + calculateShiftHours(item.shift), 0);

  // Reset date to today
  const resetDate = () => {
    setSelectedDate(new Date());
  };

  // Get the start and end of the week for the selected date
  const startDateOfWeek = startOfWeek(selectedDate);
  const endDateOfWeek = endOfWeek(selectedDate);

  // Weekly Schedule filter
  const weeklySchedule = scheduleData.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= startDateOfWeek && itemDate <= endDateOfWeek;
  });

  return (
    <div className="relative min-h-screen text-black font-arial">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl"
        style={{
          backgroundImage: `url('/images/loginpagebackground.webp')`,
        }}
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
            src={user?.profileImageUrl || '/images/default-avatar.png'}
            alt="Profile image"
            width={40}
            height={40}
          />
          <span className="text-white font-semibold">{user?.emailAddresses[0].emailAddress}</span>
        </button>
        {profileMenuOpen && (
          <div className="absolute top-16 right-0 bg-white shadow-lg rounded-lg p-4 w-48 z-50">
            <ul>
              <li
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push('/employee/profile')}
              >
                Edit Profile
              </li>
              <li
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => signOut()}
              >
                Log Out
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex-grow p-20 ml-0 md:ml-64 transition-all z-10">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Your Schedule
        </h1>

        <div className="flex justify-center mb-4">
          <input
            type="date"
            value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
            onChange={(e) =>
              setSelectedDate(e.target.value ? new Date(e.target.value) : null)
            }
            className="border p-2 rounded"
          />
          <button
            onClick={resetDate}
            className="ml-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Today
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <button
            onClick={() => setSelectedDate(new Date())}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            View Weekly Schedule
          </button>
        </div>

        <div className="mt-8 bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-blue-500 text-white">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Date</th>
                <th className="px-6 py-3 text-left font-medium">Shift</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedule.length > 0 ? (
                filteredSchedule.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-6 py-4">{item.date}</td>
                    <td className="px-6 py-4">{item.shift}</td>
                    <td
                      className={`px-6 py-4 ${
                        item.status === "Confirmed"
                          ? "text-green-500"
                          : item.status === "Dropped"
                          ? "text-red-500"
                          : "text-yellow-500"
                      }`}
                    >
                      {item.status}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center p-4">
                    No schedule available for this day.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-4 text-white font-bold">
            Total hours worked this week: {totalHoursWorked} hours
          </div>
        </div>

        {/* Display Weekly Schedule */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Weekly Schedule</h2>
          <div className="bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white">
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Date</th>
                  <th className="px-6 py-3 text-left font-medium">Shift</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {weeklySchedule.length > 0 ? (
                  weeklySchedule.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-6 py-4">{item.date}</td>
                      <td className="px-6 py-4">{item.shift}</td>
                      <td
                        className={`px-6 py-4 ${
                          item.status === "Confirmed"
                            ? "text-green-500"
                            : item.status === "Dropped"
                            ? "text-red-500"
                            : "text-yellow-500"
                        }`}
                      >
                        {item.status}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center p-4">
                      No schedule available for this week.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
