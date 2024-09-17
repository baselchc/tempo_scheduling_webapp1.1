import { useState } from "react";
import { MenuIcon, XIcon } from "@heroicons/react/outline"; // For icons (install with npm install @heroicons/react)

export default function VerticalNav() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNav = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      {/* Navbar Button (Hamburger Menu for small screens) */}
      <button
        onClick={toggleNav}
        className="fixed top-4 left-4 z-20 bg-blue-500 text-white p-2 rounded-full md:hidden"
      >
        {isOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="mt-10 space-y-4">
          <a href="#" className="block text-lg px-4 py-2 hover:bg-gray-700">
            Dashboard
          </a>
          <a href="#" className="block text-lg px-4 py-2 hover:bg-gray-700">
            Profile
          </a>
          <a href="#" className="block text-lg px-4 py-2 hover:bg-gray-700">
            Settings
          </a>
          <a href="#" className="block text-lg px-4 py-2 hover:bg-gray-700">
            Logout
          </a>
        </div>
      </div>

      {/* Overlay for small screen when nav is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-10 md:hidden"
          onClick={toggleNav}
        />
      )}
    </div>
  );
}
