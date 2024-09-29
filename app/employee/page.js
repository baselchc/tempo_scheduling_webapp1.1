"use client";
import React from 'react';
import EmployeeLayout from './Layout'; // Ensure this is the correct path
import { useUser, useAuth } from '@clerk/nextjs';
import { useState } from 'react';

export default function EmployeePage() {
  const { signOut } = useAuth();
  const { user } = useUser(); // Fetch user data
  const [menuOpen, setMenuOpen] = useState(false);

  const scheduleData = [
    { date: "2024-09-20", shift: "9 AM - 5 PM", status: "Confirmed" },
    { date: "2024-09-21", shift: "10 AM - 6 PM", status: "Pending" },
    { date: "2024-09-22", shift: "11 AM - 7 PM", status: "Confirmed" },
  ];

  console.log('User:', user); // Debug: log user information
  console.log('Schedule Data:', scheduleData); // Debug: log schedule data

  return (
    <EmployeeLayout>
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
        Welcome to the Employee Dashboard
      </h1>

      {/* Schedule Table */}
      <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Your Schedule</h2>
        <table className="min-w-full bg-white">
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
                <td className={`p-4 font-semibold ${item.status === "Confirmed" ? "text-green-600" : "text-yellow-600"}`}>
                  {item.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Information */}
      <div className="mt-6 text-center">
        {user ? (
          <>
            <h3 className="text-xl font-bold">Hello, {user.firstName} {user.lastName}!</h3>
            <p className="text-sm text-gray-500">You are signed in as a {user.publicMetadata?.role || "Member"}.</p>
          </>
        ) : (
          <p className="text-sm text-gray-500">Loading user information...</p>
        )}
      </div>
    </EmployeeLayout>
  );
}
