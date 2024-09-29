// app/employee/page.js
"use client";
import React from 'react';
import EmployeeLayout from './layout'; // Ensure this is the correct path
import { useUser, useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import EmployeeCalendar from './components/Calendar'; // Import the calendar component

export default function EmployeePage() {
  const { signOut } = useAuth();
  const { user } = useUser(); // Fetch user data
  const [menuOpen, setMenuOpen] = useState(false);

  console.log('User:', user); // Debug: log user information

  return (
    <EmployeeLayout>
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
        Welcome to the Employee Dashboard
      </h1>

      {/* Calendar Component */}
      <EmployeeCalendar />

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
