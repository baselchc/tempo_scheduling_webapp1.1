"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import { Notifications } from '@mui/icons-material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format, differenceInHours, parse, startOfWeek, endOfWeek } from 'date-fns';
import Papa from 'papaparse'; // For CSV export
import jsPDF from 'jspdf'; // For PDF export
import html2canvas from 'html2canvas'; // For PDF export

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://tempo-scheduling-webapp1-1.vercel.app'
  : process.env.NEXT_PUBLIC_NGROK_URL || process.env.NEXT_PUBLIC_API_URL;

export default function SchedulePage() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || '/images/default-avatar.png');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showWeeklySchedule, setShowWeeklySchedule] = useState(false);
  const { getToken } = useAuth();
  const [scheduleData] = useState([
    { date: "2024-10-02", shift: "9 AM - 5 PM", status: "Confirmed" },
    { date: "2024-10-03", shift: "10 AM - 6 PM", status: "Confirmed" },
    { date: "2024-10-04", shift: "11 AM - 7 PM", status: "Dropped" },
    { date: "2024-10-05", shift: "12 PM - 8 PM", status: "Confirmed" },
    { date: "2024-10-06", shift: "1 PM - 9 PM", status: "Confirmed" },
    { date: "2024-10-07", shift: "9 AM - 5 PM", status: "Confirmed" },
    { date: "2024-10-08", shift: "8 AM - 4 PM", status: "Extra Shift" },
  ]);

  const router = useRouter();

  // Fetch the profile image URL from the API
  const fetchUserProfileImage = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${apiUrl}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
  
      if (response.ok && data.profileImageUrl) {
        const uniqueImageUrl = `${data.profileImageUrl}?t=${new Date().getTime()}`;
        setProfileImageUrl(uniqueImageUrl);
      }
    } catch (error) {
      console.error("Error fetching profile image:", error);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchUserProfileImage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleNotifications = () => setNotificationsOpen(!notificationsOpen);
  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  const startDateOfWeek = startOfWeek(selectedDate);
  const endDateOfWeek = endOfWeek(selectedDate);

  const weeklySchedule = scheduleData.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= startDateOfWeek && itemDate <= endDateOfWeek;
  });

  const filteredSchedule = showWeeklySchedule ? weeklySchedule : scheduleData.filter((item) =>
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

  const totalScheduledHours = weeklySchedule.reduce((total, item) => total + calculateShiftHours(item.shift), 0);
  const remainingHours = totalScheduledHours - totalHoursWorked;
  const totalEarnings = totalHoursWorked * 17; // Assuming $17 per hour

  const resetDate = () => {
    setSelectedDate(new Date());
    setShowWeeklySchedule(false); // Reset to show daily schedule
  };

  // CSV Export Function
  const exportToCSV = () => {
    const csv = Papa.unparse(weeklySchedule);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'schedule.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export Function
  const exportToPDF = () => {
    const pdf = new jsPDF('portrait', 'pt', 'a4');
    const table = document.getElementById('schedule-table');
    html2canvas(table).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 20, 20);
      pdf.save('schedule.pdf');
    });
  };

  const viewWeeklySchedule = () => setShowWeeklySchedule(true);

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
            src={profileImageUrl}
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

      <div className={`flex-grow p-8 transition-all z-10 ${menuOpen ? 'ml-64' : 'ml-20'}`}>
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
            onClick={viewWeeklySchedule}
            className="bg-green-500 text-white px-6 py-3 font-bold text-lg rounded"
          >
            View Weekly Schedule
          </button>
        </div>

        <div className="mt-8 bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white">
          <table id="schedule-table" className="min-w-full bg-transparent">
            <thead className="bg-white bg-opacity-20 text-white">
              <tr>
                <th className="px-6 py-3 text-left font-medium" style={{ fontSize: '1.5rem' }}>Date</th>
                <th className="px-6 py-3 text-left font-medium" style={{ fontSize: '1.5rem' }}>Shift</th>
                <th className="px-6 py-3 text-left font-medium" style={{ fontSize: '1.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedule.length > 0 ? (
                filteredSchedule.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-6 py-4 text-white">{item.date}</td>
                    <td className="px-6 py-4 text-white">{item.shift}</td>
                    <td className="px-6 py-4 text-white">{item.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-white">
                    No shifts found for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-4 text-white p-10 rounded-lg border-2 border-white-500 bg-white/10">
            <p className="text-lg" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Total Hours Worked: {totalHoursWorked}</p>
            <p className="text-lg" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Total Scheduled Hours: {totalScheduledHours}</p>
            <p className="text-lg" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Remaining Hours: {remainingHours}</p>
            <p className="text-lg" style={{ fontSize: '1.25rem' }}>Total Earnings: ${totalEarnings}</p>
          </div>

          <div className="mt-4 flex justify-between">
            <button
              onClick={exportToCSV}
              className="bg-yellow-500 text-white px-4 py-2 rounded"
            >
              Export to CSV
            </button>
            <button
              onClick={exportToPDF}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Export to PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

//code enhanced with help of chatgpt4 and prompt was Develop a Next.js schedule management page that includes user authentication, profile actions, notifications, and a feature to toggle between daily and weekly views. Ensure the component can export data in both CSV and PDF formats and incorporates dynamic interactions for an enhanced user experience."