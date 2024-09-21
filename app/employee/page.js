"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import Image from "next/image";
import NavBar from './NavBar'; // Import the NavBar component
import styles from './EmployeePage.module.css'; // Import the CSS module

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
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeader}>
                <th className={styles.tableCell}>Date</th>
                <th className={styles.tableCell}>Shift</th>
                <th className={styles.tableCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {scheduleData.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className={styles.tableCell}>{item.date}</td>
                  <td className={styles.tableCell}>{item.shift}</td>
                  <td className={styles.tableCell}>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
