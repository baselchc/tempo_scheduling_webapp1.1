"use client"; // Mark this component as a Client Component

import { useUser, useAuth } from '@clerk/nextjs'; // Importing user authentication hooks
import { useState } from 'react'; // Importing useState for state management
import NavBar from '../components/NavBar'; // Importing the NavBar component
import Image from 'next/image'; // Importing Next.js Image component

export default function EmployeeListPage() {
    const { user } = useUser(); // Get user information
    const { signOut } = useAuth(); // For signing out
    const [menuOpen, setMenuOpen] = useState(false); // State for side menu
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [openEmployee, setOpenEmployee] = useState(null);

    const toggleMenu = () => {
    setMenuOpen(!menuOpen); // Toggle sidebar
    };

    const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    };

    const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
    };

    const toggleEmployee = (id) => {
    setOpenEmployee(openEmployee === id ? null : id); // Toggle employee dropdown
    };

    const employees = [
    { firstName: "Darrel", lastName: "Nguyen", email:"darrel@gmail.com", phone:"000-000-0000 ", availability: "Available"}
    ];

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

        {/* Main content space */}
        <div className={`flex-grow p-8 transition-all z-10 ${menuOpen ? 'ml-64' : 'ml-20'}`}>
        <h1 className="text-4xl font-bold text-center text-white mb-8">Employee List</h1>

        {/* Top Right: User Info & Notifications */}
        <div className="absolute top-4 right-8 flex items-center gap-4 z-50">

            {/* Notifications Bell */}
            <button onClick={toggleNotifications} className="relative">
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

        {/* Employee */}
        <ul className="space-y-4">
            {employees.map((employee) => (
                <li key={employee.id} className="border p-4 rounded-lg bg-black/20 backdrop-blur-lg">
                <div
                    className="flex justify-between items-center cursor-pointer text-white"
                    onClick={() => toggleEmployee(employee.id)} // Toggle dropdown on click
                >
                    <span className="font-semibold">{employee.firstName} {employee.lastName}</span>
                    <span className="text-gray-600">{openEmployee === employee.id ? '-' : '+'}</span> {/* Dropdown icon */}
                </div>

                {/* Dropdown content */}
                {openEmployee === employee.id && (
                <div className="mt-2 p-2 border-t border-gray-300 text-white">
                    <p><strong>First Name:</strong> {employee.firstName}</p>
                    <p><strong>Last Name:</strong> {employee.lastName}</p>
                    <p><strong>Email:</strong> {employee.email}</p>
                    <p><strong>Phone:</strong> {employee.phone}</p>
                    <p><strong>Availability:</strong> {employee.availability}</p>
                </div>
                )}
                </li>
            ))}
        </ul>


        </div>
        </div>


    );
}
