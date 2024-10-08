"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import NavBar from '../components/NavBar'; // Import the NavBar component
import { Notifications } from '@mui/icons-material'; // Import Material UI icons for notifications
import Image from 'next/image'; // Correct Image import
import { useRouter } from 'next/navigation'; // Import useRouter for navigation

export default function OpenShiftsPage() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  // State for open shifts and my shifts
  const [openShifts, setOpenShifts] = useState([
    { day: "Monday", time: "9 AM - 1 PM", reason: "John Doe - Going to the doctor", id: 1 },
    { day: "Tuesday", time: "2 PM - 6 PM", reason: "Jane Doe - Going to a wedding", id: 2 },
    { day: "Wednesday", time: "8 AM - 12 PM", reason: "Unassigned shift", id: 3 },
    { day: "Thursday", time: "3 PM - 8 PM", reason: "John Doe - Family emergency", id: 4 },
  ]);

  const [myShifts, setMyShifts] = useState([
    { day: "Friday", time: "9 AM - 5 PM", reason: "", id: 5 },
    { day: "Saturday", time: "10 AM - 6 PM", reason: "", id: 6 },
  ]);

  const router = useRouter(); // Initialize the router

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);  // Toggle sidebar
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  // Handle taking a shift
  // Handle taking a shift
const takeShift = (shiftId) => {
  const shift = openShifts.find((s) => s.id === shiftId);
  
  alert(`You have taken the shift on ${shift.day}, ${shift.time}.`);
  
  // Remove the shift from open shifts
  setOpenShifts((prevShifts) => prevShifts.filter((s) => s.id !== shiftId));
  
  // Add the shift to my shifts
  setMyShifts((prevShifts) => [
    ...prevShifts,
    { ...shift, reason: shift.reason || "Taken shift" }
  ]);
};


  // Handle dropping or swapping a shift
  const dropShift = (shiftId) => {
    const shift = myShifts.find((s) => s.id === shiftId);
    const reason = shift.reason.trim() === "" ? "Dropped Shift" : shift.reason;
    
    alert(`You have dropped the shift on ${shift.day}, ${shift.time}. Reason: ${reason}`);
    
    // Move the shift to open shifts with the reason or default message
    setOpenShifts((prevShifts) => [
      ...prevShifts,
      { ...shift, reason: `${user?.firstName} ${user?.lastName} - ${reason}` }
    ]);
    
    // Remove the shift from my shifts
    setMyShifts((prevShifts) => prevShifts.filter((s) => s.id !== shiftId));
  };

  return (
    <div className="relative min-h-screen text-black"> 
      {/* Blurred background image */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl"
        style={{
          backgroundImage: `url('/images/loginpagebackground.webp')`,
        }}
      ></div>

      {/* Navigation Bar */}
      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      {/* Top Right: User Info & Notifications */}
      <div className="absolute top-4 right-8 flex items-center gap-4 z-50">
        {/* Notifications Bell */}
        <button onClick={toggleNotifications} className="relative">
          <Notifications className="text-white text-4xl cursor-pointer" />
          {/* Notification Popup */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 z-50">
              <p>No new notifications.</p>
            </div>
          )}
        </button>

        {/* User Profile Dropdown */}
        <button onClick={toggleProfileMenu} className="flex items-center gap-2">
          <Image
            className="rounded-full"
            src={user?.profileImageUrl || '/images/default-avatar.png'} // Use local default avatar image
            alt="Profile image"
            width={40}
            height={40}
          />
          <span className="text-white font-semibold">{user?.emailAddresses[0].emailAddress}</span>
        </button>
        {profileMenuOpen && (
          <div className="absolute top-16 right-0 bg-white shadow-lg rounded-lg p-4 w-48 z-50">
            <ul>
              <li className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => router.push('/employee/profile')}>
                Edit Profile
              </li>
              <li className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => signOut()}>
                Log Out
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Main content space */}
      <div className={`flex-grow p-8 transition-all z-10 ${menuOpen ? 'ml-64' : 'ml-20'}`}>
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Open Shifts
        </h1>

        {/* Open Shifts Section */}
        <div className="mt-8 bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white">
          <h2 className="text-2xl font-semibold mb-4 text-white">Available Shifts</h2>
          <table className="min-w-full bg-transparent">
            <thead>
              <tr className="bg-white bg-opacity-20 text-white">
                <th className="text-left p-4 font-semibold text-white">Day</th>
                <th className="text-left p-4 font-semibold text-white">Time</th>
                <th className="text-left p-4 font-semibold text-white">Reason</th>
                <th className="text-left p-4 font-semibold text-white">Action</th>
              </tr>
            </thead>
            <tbody>
              {openShifts.map((shift) => (
                <tr key={shift.id} className="border-b border-white/20">
                  <td className="p-4 text-white">{shift.day}</td>
                  <td className="p-4 text-white">{shift.time}</td>
                  <td className="p-4 text-white">{shift.reason}</td>
                  <td className="p-4 text-white">
                    <button
                      className="bg-blue-400 text-white p-2 rounded-lg"
                      onClick={() => takeShift(shift.id)}
                    >
                      Take this shift
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* My Shifts Section */}
        <div className="mt-8 bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white">
          <h2 className="text-2xl font-semibold mb-4 text-white">My Shifts</h2>
          <table className="min-w-full bg-transparent">
            <thead>
              <tr className="bg-white/20">
                <th className="text-left p-4 font-semibold text-white">Day</th>
                <th className="text-left p-4 font-semibold text-white">Time</th>
                <th className="text-left p-4 font-semibold text-white">Reason</th>
                <th className="text-left p-4 font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myShifts.map((shift) => (
                <tr key={shift.id} className="border-b border-white/20">
                  <td className="p-4 text-white">{shift.day}</td>
                  <td className="p-4 text-white">{shift.time}</td>
                  <td className="p-4 text-white">
                    <input
                      type="text"
                      className="bg-transparent border-b-6 border-white w-[265px] placeholder-white"
                      placeholder="Enter reason (optional)"
                      value={shift.reason}
                      onChange={(e) =>
                        setMyShifts((prevShifts) =>
                          prevShifts.map((s) =>
                            s.id === shift.id ? { ...s, reason: e.target.value } : s
                          )
                        )
                      }
                    />
                  </td>
                  <td className="p-4 text-white">
                    <button
                      className="w-[110px] bg-red-500 text-white p-2 rounded-lg mr-2"
                      onClick={() => dropShift(shift.id)}
                    >
                      Drop Shift
                    </button>
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

{/*Code enhanced by AI (GPT 4o), prompt was: Create a "open shifts" page that is consistent with the looks of the website, add to this page an option to grab shifts with 
  the information of the day of the week and the hour start and end, that are either not assigned to a specific employee or that some employee cannot do because they are 
  "Going to a wedding" or "Going to the doctor" add mock names for the employees like John or Jane Doe and add a button to these open shifts that allows the user to 
  "Take this shift" and "Drop Shifts"*/}