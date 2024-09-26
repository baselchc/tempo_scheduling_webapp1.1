"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import NavBar from './NavBar'; // Import the NavBar component

export default function EmployeePage() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);  // Toggle sidebar
  };

  const scheduleData = [
    { date: "2024-09-20", shift: "9 AM - 5 PM", status: "Confirmed" },
    { date: "2024-09-21", shift: "10 AM - 6 PM", status: "Pending" },
    { date: "2024-09-22", shift: "11 AM - 7 PM", status: "Confirmed" },
  ];

  return (
    <div className="relative flex bg-gray-200 min-h-screen">
      {/* Hamburger Menu for mobile */}
      <button
        className="text-white text-2xl p-4 md:hidden z-50 fixed top-4 left-4"
        onClick={toggleMenu}
      >
        &#9776; {/* Hamburger icon */}
      </button>

      {/* Navigation Bar */}
      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      {/* Main content space */}
      <div className="flex-grow p-8">
        <h1 className="text-4xl font-bold text-center text-gray-800">
          Welcome to the Employee Dashboard
        </h1>

        {/* Schedule Table */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Your Schedule</h2>
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-300">
                <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                <th className="text-left p-4 font-semibold text-gray-700">Shift</th>
                <th className="text-left p-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {scheduleData.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-4 text-gray-600">{item.date}</td>
                  <td className="p-4 text-gray-600">{item.shift}</td>
                  <td className={`p-4 font-semibold ${
                    item.status === "Confirmed" ? "text-green-600" : "text-yellow-600"
                  }`}>
                    {item.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
