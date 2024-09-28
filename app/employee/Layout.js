// app/employee/Layout.js
// app/employee/Layout.js
"use client";
import React from 'react';
import NavBar from '../employee/components/NavBar'; // Adjusted path to go up one more level
import TopNavBar from '../employee/components/TopNavBar'; // Adjusted path

const EmployeeLayout = ({ children }) => {
  return (
    <div className="relative flex bg-gray-200 min-h-screen">
      <NavBar /> {/* Navigation Bar stays constant */}
      <div className="flex-grow p-8 ml-0 md:ml-64 transition-all">
        <TopNavBar /> {/* Include the Top Navigation Bar here */}
        {children} {/* This is where the page content will be rendered */}
      </div>
    </div>
  );
};

export default EmployeeLayout;
