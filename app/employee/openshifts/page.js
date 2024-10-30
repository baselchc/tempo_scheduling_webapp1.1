"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import NavBar from "../components/NavBar";
import { Notifications } from "@mui/icons-material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from '../../../backend/database/supabaseClient';

export default function OpenShiftsPage() {
  const { signOut } = useAuth();
  const { user } = useUser(); // This user object includes clerk_user_id
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [openShifts, setOpenShifts] = useState([]);
  const [myShifts, setMyShifts] = useState([]);
  const router = useRouter();

  // Centralized function to fetch shifts and update the state
 // Updated fetchShifts function
const fetchShifts = useCallback(async () => {
  if (!user) return;

  try {
    // Fetch available shifts from Supabase
    const { data: availableShifts, error: availableError } = await supabase
      .from('available_shifts')
      .select('*');
    
    if (availableError) throw availableError;
    setOpenShifts(availableShifts);

    // Fetch user's shifts using Clerk's userId from Supabase
    const { data: myShifts, error: myShiftsError } = await supabase
      .from('my_shifts')
      .select('*')
      .eq('user_id', user.id);
    
    if (myShiftsError) throw myShiftsError;
    setMyShifts(myShifts);
  } catch (error) {
    console.error('Error fetching shifts:', error);
  }
}, [user]);

  // Initial load or when the user changes
  useEffect(() => {
    if (user) {
      fetchShifts();
    }
  }, [user, fetchShifts]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleNotifications = () => setNotificationsOpen(!notificationsOpen);
  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  const takeShift = async (shiftId) => {
    const shift = openShifts.find((s) => s.id === shiftId);
    if (!shift) return;
  
    console.log("Shift data to insert:", { ...shift, user_id: user.id });
  
    try {
      // Move shift from available_shifts to my_shifts in Supabase
      const { error: insertError } = await supabase
        .from('my_shifts')
        .insert({ ...shift, user_id: user.id });
  
      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw insertError;
      }
  
      // Remove shift from available_shifts
      const { error: deleteError } = await supabase
        .from('available_shifts')
        .delete()
        .eq('id', shift.id);
  
      if (deleteError) {
        console.error("Supabase delete error:", deleteError);
        throw deleteError;
      }
  
      alert(`You have taken the shift on ${new Date(shift.shift_start).toLocaleDateString('en-US')}, ${new Date(shift.shift_start).toLocaleTimeString('en-US')}.`);
      fetchShifts(); // Fetch updated shifts after taking a shift
    } catch (error) {
      console.error("Error taking shift:", error);
    }
  };

  const dropShift = async (shiftId) => {
    const shift = myShifts.find((s) => s.id === shiftId);
    if (!shift) return;
  
    try {
      // Move shift back to available_shifts
      const { error: insertError } = await supabase
        .from('available_shifts')
        .insert({ ...shift, reason: shift.reason || 'No reason provided' });
  
      if (insertError) throw insertError;
  
      // Remove shift from schedules
      const { error: deleteError } = await supabase
        .from('my_shifts')
        .delete()
        .eq('id', shift.id);
  
      if (deleteError) throw deleteError;
  
      alert(`You have dropped the shift on ${new Date(shift.shift_start).toLocaleDateString('en-US')}, ${new Date(shift.shift_start).toLocaleTimeString('en-US')}.`);
      fetchShifts(); // Fetch updated shifts after dropping a shift
    } catch (error) {
      console.error("Error dropping shift:", error);
    }
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
        <h1 className="text-4xl font-bold text-center text-white mb-8">Open Shifts</h1>

        {/* Open Shifts Section */}
        <div className="mt-8 bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white">
          <h2 className="text-2xl font-semibold mb-4 text-white">Available Shifts</h2>
          <table className="min-w-full bg-transparent">
            <thead>
              <tr className="bg-white/20">
                <th className="text-left p-4 font-semibold text-white">Day</th>
                <th className="text-left p-4 font-semibold text-white">Time</th>
                <th className="text-left p-4 font-semibold text-white">Reason</th>
                <th className="text-left p-4 font-semibold text-white">Action</th>
              </tr>
            </thead>
            <tbody>
              {openShifts.length > 0 ? (
                openShifts.map((shift) => (
                  <tr key={shift.id} className="border-b border-white/20">
                    <td className="p-4 text-white">{new Date(shift.shift_start).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                    <td className="p-4 text-white">
                      {new Date(shift.shift_start).toLocaleTimeString('en-US')} - {new Date(shift.shift_end).toLocaleTimeString('en-US')}
                    </td>
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
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-4 text-white text-center">No available shifts</td>
                </tr>
              )}
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
              {myShifts.length > 0 ? (
                myShifts.map((shift) => (
                  <tr key={shift.id} className="border-b border-white/20">
                    <td className="p-4 text-white">{new Date(shift.shift_start).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                    <td className="p-4 text-white">
                      {new Date(shift.shift_start).toLocaleTimeString('en-US')} - {new Date(shift.shift_end).toLocaleTimeString('en-US')}
                    </td>
                    <td className="p-4 text-white">
                      <input
                        type="text"
                        className="bg-transparent border-b-2 border-white w-full placeholder-white"
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
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-4 text-white text-center">No shifts assigned</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

 {/*Code enhanced by AI (ChatGPT 4o) Prompts were: Create a consistent look of the page with the login page, 
  add the blurred background and adjust they layout to match the same feel of the login page, this page should handle the open shifts
  tab and allow a view of Available Shifts and Open Shifts.*/}