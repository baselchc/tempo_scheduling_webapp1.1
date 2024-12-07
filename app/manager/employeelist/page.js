"use client";
import { useState, useEffect } from "react";
import { useUser, useAuth, SignOutButton } from "@clerk/nextjs";
import NavBar from "../components/NavBar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../../../backend/database/supabaseClient"; // Adjust the path if needed

export default function EmployeeListPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  // State management
  const [employees, setEmployees] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("employee");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  // UI state
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState("/images/default-avatar.png");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsFetching(true);
      setError(null);

      const { data: employeesData, error: fetchError } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, phone, role");

      if (fetchError) throw fetchError;

      setEmployees(employeesData || []);
    } catch (error) {
      console.error("Failed to fetch employees:", error.message || error);
      setError("Failed to fetch employees.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setStatusMessage("");

    try {
      const { error: insertError } = await supabase.from("users").insert([
        {
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          role,
        },
      ]);

      if (insertError) throw insertError;

      setStatusMessage("Employee added successfully!");

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setRole("employee");

      // Refresh employee list
      await fetchEmployees();
    } catch (error) {
      console.error("Failed to add employee:", error.message || error);
      setError("Failed to add employee.");
      setStatusMessage("Failed to add employee.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  return (
    <div className="relative min-h-screen text-black">
      {/* Background */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-md brightness-75"
        style={{
          backgroundImage: `url('/images/loginpagebackground.webp')`,
        }}
      />

      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      {/* Profile Menu */}
      <div className="absolute top-4 right-8 flex items-center gap-4 z-50">
        <button onClick={toggleProfileMenu} className="flex items-center gap-2">
          <Image
            className="rounded-full"
            src={profileImageUrl}
            alt="Profile"
            width={40}
            height={40}
          />
          <span className="text-white font-semibold">
            {user?.emailAddresses[0]?.emailAddress}
          </span>
        </button>

        {profileMenuOpen && (
          <div className="absolute top-16 right-0 bg-white shadow-lg rounded-lg p-4 w-48 z-50">
            <ul>
              <li
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push("/manager/profile")}
              >
                Edit Profile
              </li>
              <li className="p-2 hover:bg-gray-100 cursor-pointer">
                <SignOutButton />
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className={`container mx-auto mt-10 px-4 ${menuOpen ? "ml-64" : "ml-20"}`}>
        <h1 className="text-4xl font-bold mb-8 text-center text-white">Employee Management</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Add Employee Form */}
          <div className="bg-black/20 backdrop-blur-lg shadow-lg rounded-lg p-6 border-2 border-white">
            <h2 className="text-2xl font-bold mb-4 text-center text-white">Add New Employee</h2>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <input
                className="block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 bg-white/10 text-white placeholder-gray-300"
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isLoading}
              />
              <input
                className="block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 bg-white/10 text-white placeholder-gray-300"
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isLoading}
              />
              <input
                className="block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 bg-white/10 text-white placeholder-gray-300"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <input
                className="block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 bg-white/10 text-white placeholder-gray-300"
                type="text"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading}
              />
              <select
                className="block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 bg-white/10 text-white"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                disabled={isLoading}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
              <button
                className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                    <span>Adding...</span>
                  </>
                ) : (
                  "Add Employee"
                )}
              </button>
            </form>
            {statusMessage && (
              <p
                className={`mt-4 text-lg text-center ${
                  statusMessage.includes("success") ? "text-green-400" : "text-red-400"
                }`}
              >
                {statusMessage}
              </p>
            )}
          </div>

          {/* Employee List */}
          <div className="bg-black/20 backdrop-blur-lg shadow-lg rounded-lg p-6 border-2 border-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-center text-white">Employee List</h2>
              <button
                onClick={fetchEmployees}
                disabled={isFetching}
                className="text-white hover:text-blue-200 transition-colors"
              >
                {isFetching ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {isFetching ? (
              <div className="text-center text-white flex items-center justify-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                <span>Loading employees...</span>
              </div>
            ) : employees.length > 0 ? (
              <ul className="space-y-4">
                {employees.map((employee) => (
                  <li key={employee.id} className="border border-white/20 p-4 rounded-lg bg-white/10">
                    <p className="text-white">
                      <strong>Name:</strong> {employee.first_name} {employee.last_name}
                    </p>
                    <p className="text-white">
                      <strong>Email:</strong> {employee.email}
                    </p>
                    <p className="text-white">
                      <strong>Phone:</strong> {employee.phone || "N/A"}
                    </p>
                    <p className="text-white">
                      <strong>Role:</strong> {employee.role}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-white">No employees found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
