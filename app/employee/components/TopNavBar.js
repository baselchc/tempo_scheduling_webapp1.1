// components/TopNavBar.js
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faUserCircle } from '@fortawesome/free-solid-svg-icons';

const TopNavBar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State to manage dropdown visibility

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev); // Toggle dropdown visibility
  };

  const handleSignOut = () => {
    // Handle sign-out logic here (e.g., clear user session)
    console.log('Signing out...');
    setIsDropdownOpen(false); // Close dropdown after signing out
  };

  return (
    <div className="bg-green-800 p-4 text-white flex justify-between items-center">
      <h2 className="text-md">Top Navigation</h2>
      <div className="flex space-x-4">
        {/* Announcement Bell Icon */}
        <FontAwesomeIcon icon={faBell} className="cursor-pointer hover:text-gray-400" title="Announcements" />
        
        {/* Profile Logo Icon */}
        <div className="relative">
          <FontAwesomeIcon
            icon={faUserCircle}
            className="cursor-pointer hover:text-gray-400"
            title="Profile"
            onClick={toggleDropdown} // Toggle dropdown on click
          />
          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-700 text-white rounded shadow-lg z-10">
              <div className="py-2 px-4 hover:bg-gray-600 cursor-pointer" onClick={handleSignOut}>
                Sign Out
              </div>
              {/* Add more options here if needed */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNavBar;
