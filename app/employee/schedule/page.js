"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import { useState, useEffect, useCallback } from 'react';
import NavBar from '../components/NavBar';
import { Notifications } from '@mui/icons-material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SHIFTS = {
  MORNING: {
    id: "morning",
    label: "Morning",
    startTime: "09:00",
    endTime: "13:00",
    duration: 4
  },
  AFTERNOON: {
    id: "afternoon",
    label: "Afternoon",
    startTime: "13:00",
    endTime: "17:00",
    duration: 4
  }
};

export default function SchedulePage() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  // State management
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showWeeklySchedule, setShowWeeklySchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch schedule data
  const fetchSchedule = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/schedule/employee-schedule/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch schedule');
      const data = await response.json();
      setScheduleData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // View toggles
  const toggleMenu = () => setMenuOpen(prev => !prev);
  const toggleNotifications = () => setNotificationsOpen(prev => !prev);
  const toggleProfileMenu = () => setProfileMenuOpen(prev => !prev);
  const toggleViewMode = () => setShowWeeklySchedule(prev => !prev);

  // Refresh functionality
  const refreshSchedule = async () => {
    setIsRefreshing(true);
    await fetchSchedule();
    setIsRefreshing(false);
  };

  // Reset date to today
  const resetDate = () => {
    setSelectedDate(new Date());
    setShowWeeklySchedule(false);
  };

  // Filter schedule based on view type
  const filteredSchedule = showWeeklySchedule
    ? scheduleData.filter(item => {
        const itemDate = parseISO(item.date);
        const weekStart = startOfWeek(selectedDate);
        const weekEnd = endOfWeek(selectedDate);
        return itemDate >= weekStart && itemDate <= weekEnd;
      })
    : scheduleData.filter(item => 
        format(parseISO(item.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      );

  // Calculate hours and earnings
  const calculateHours = (shift) => {
    return SHIFTS[shift.toUpperCase()]?.duration || 0;
  };

  const totalHoursWorked = scheduleData
    .filter(item => item.status === "Confirmed")
    .reduce((total, item) => total + calculateHours(item.shift), 0);

  const totalScheduledHours = scheduleData
    .reduce((total, item) => total + calculateHours(item.shift), 0);

  const remainingHours = totalScheduledHours - totalHoursWorked;
  const totalEarnings = totalHoursWorked * 17;

  // Export functions
  const exportToCSV = async () => {
    try {
      setIsExporting(true);
      const exportData = filteredSchedule.map(item => ({
        Date: format(parseISO(item.date), 'MMM dd, yyyy'),
        Shift: SHIFTS[item.shift.toUpperCase()].label,
        Status: item.status,
        Hours: calculateHours(item.shift)
      }));

      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `schedule-${format(selectedDate, 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      setError('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      const table = document.getElementById('schedule-table');
      if (!table) throw new Error('Schedule table not found');
      
      const canvas = await html2canvas(table);
      const pdf = new jsPDF('portrait', 'pt', 'a4');
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 20, 20);
      pdf.save(`schedule-${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      setError('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Loading state
  if (isLoading && !isRefreshing) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  // Error state
  if (error && !isRefreshing) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-white bg-red-500/20 p-4 rounded-lg">
          Error loading schedule: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-black font-arial">
      {/* Background */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl"
        style={{
          backgroundImage: `url('/images/loginpagebackground.webp')`,
        }}
      ></div>

      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      {/* Top Navigation */}
      <div className="absolute top-4 right-8 flex items-center gap-4 z-50">
        <button onClick={toggleNotifications} className="relative">
          <Notifications className="text-white text-4xl cursor-pointer hover:opacity-80 transition-opacity" />
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 z-50">
              <p>No new notifications.</p>
            </div>
          )}
        </button>

        <button onClick={toggleProfileMenu} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
                className="p-2 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => router.push('/employee/profile')}
              >
                Edit Profile
              </li>
              <li
                className="p-2 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => signOut()}
              >
                Log Out
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`flex-grow p-8 transition-all z-10 ${menuOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-white mb-8">
            Your Schedule
          </h1>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                className="border p-2 rounded hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={resetDate}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleViewMode}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded transition-colors"
              >
                {showWeeklySchedule ? 'View Daily Schedule' : 'View Weekly Schedule'}
              </button>
              <button
                onClick={refreshSchedule}
                disabled={isRefreshing}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
              >
                {isRefreshing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                    Refreshing...
                  </>
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="mt-8 bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white overflow-x-auto relative">
            {isRefreshing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="animate-spin h-8 w-8 border-2 border-white rounded-full border-t-transparent" />
              </div>
            )}

            <table id="schedule-table" className="min-w-full bg-transparent">
              <thead className="bg-white bg-opacity-20 text-white">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-lg">Date</th>
                  <th className="px-6 py-3 text-left font-medium text-lg">Shift</th>
                  <th className="px-6 py-3 text-left font-medium text-lg">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredSchedule.length > 0 ? (
                  filteredSchedule.map((item, index) => (
                    <tr key={index} className="border-b border-white/20 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white">
                        {format(parseISO(item.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-white">
                        {SHIFTS[item.shift.toUpperCase()].label}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          item.status === 'Confirmed' ? 'bg-green-500/20 text-green-100' :
                          item.status === 'Dropped' ? 'bg-red-500/20 text-red-100' :
                          'bg-yellow-500/20 text-yellow-100'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-8 text-white">
                      No shifts found for this {showWeeklySchedule ? 'week' : 'date'}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Statistics */}
            <div className="mt-6 text-white p-6 rounded-lg border-2 border-white/30 bg-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="flex justify-between">
                    <span>Total Hours Worked:</span>
                    <span className="font-medium">{totalHoursWorked} hours</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Total Scheduled Hours:</span>
                    <span className="font-medium">{totalScheduledHours} hours</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="flex justify-between">
                    <span>Remaining Hours:</span>
                    <span className="font-medium">{remainingHours} hours</span>
                  </p>
                  <p className="flex justify-between font-bold text-lg">
                    <span>Total Earnings:</span>
                    <span>${totalEarnings.toFixed(2)}</span>
                  </p>
                </div>
              </div>
            </div>
            {/* Export Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
              <button
                onClick={exportToCSV}
                disabled={isExporting || filteredSchedule.length === 0}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
              {isExporting ? (
              <>
               <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
              <span>Exporting CSV...</span>
                </>
                  ) : (
                    'Export to CSV'
                  )}
              </button>

            <button
               onClick={exportToPDF}
               disabled={isExporting || filteredSchedule.length === 0}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
             {isExporting ? (
             <>
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
              <span>Exporting PDF...</span>
            </>
             ) : (
               'Export to PDF'
             )}
            </button>

              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
//code enhanced with help of chatgpt4 and prompt was Develop a Next.js schedule management page that includes user authentication, profile actions, notifications, and a feature to toggle between daily and weekly views. Ensure the component can export data in both CSV and PDF formats and incorporates dynamic interactions for an enhanced user experience."