"use client";
import { useState, useEffect } from "react";
import { useUser, useAuth, SignOutButton } from "@clerk/nextjs";
import NavBar from "../components/NavBar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../../../backend/database/supabaseClient";

export default function EmployeeListPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [employees, setEmployees] = useState([]);
  const [availability, setAvailability] = useState({});
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

  const [whitelistCode, setWhitelistCode] = useState(); // Manage whitelist code
  const [whitelistError, setWhitelistError] = useState(null);

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

      const { data: availabilityData, error: availabilityError } = await supabase
        .from("availability")
        .select("*");

      if (availabilityError) throw availabilityError;

      const availabilityMap = availabilityData.reduce((acc, av) => {
        acc[av.user_id] = {
          monday_morning: av.monday_morning,
          monday_afternoon: av.monday_afternoon,
          tuesday_morning: av.tuesday_morning,
          tuesday_afternoon: av.tuesday_afternoon,
          wednesday_morning: av.wednesday_morning,
          wednesday_afternoon: av.wednesday_afternoon,
          thursday_morning: av.thursday_morning,
          thursday_afternoon: av.thursday_afternoon,
          friday_morning: av.friday_morning,
          friday_afternoon: av.friday_afternoon,
          saturday_morning: av.saturday_morning,
          saturday_afternoon: av.saturday_afternoon,
          sunday_morning: av.sunday_morning,
          sunday_afternoon: av.sunday_afternoon
        };
        return acc;
      }, {});

      setAvailability(availabilityMap);
      setEmployees(employeesData || []);
    } catch (error) {
      console.error("Failed to fetch data:", error.message || error);
      setError("Failed to fetch data.");
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

      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setRole("employee");

      await fetchEmployees();
    } catch (error) {
      console.error("Failed to add employee:", error.message || error);
      setError("Failed to add employee.");
      setStatusMessage("Failed to add employee.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhitelistCodeUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setWhitelistError(null);

    try {
      const { error } = await supabase
        .from("whitelist_code")
        .update({ code: whitelistCode })
        .eq("id", 1);

      if (error) throw error;

      setWhitelistError("Whitelist code updated successfully!");
    } catch (error) {
      console.error("Failed to update whitelist code:", error.message || error);
      setWhitelistError("Failed to update whitelist code.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <div className="flex min-h-screen text-black">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-md brightness-75"
        style={{ backgroundImage: `url('/images/loginpagebackground.webp')` }}
      />

      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      <div className={`container mx-auto mt-10 px-4 transition-all duration-300 ${menuOpen ? "ml-64" : "ml-20"}`}>
        <h1 className="text-4xl font-bold mb-8 text-center text-white ml-20">Employee Management</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 ml-20">
          
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

          {/* Update Whitelist Code */}
          <div className="bg-black/20 backdrop-blur-lg shadow-lg rounded-lg p-6 border-2 border-white">
            <h2 className="text-2xl font-bold mb-4 text-center text-white">Update Whitelist Code</h2>
            <form onSubmit={handleWhitelistCodeUpdate} className="space-y-4">
              <input
                className="block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 bg-white/10 text-white placeholder-gray-300"
                type="number"
                placeholder="Whitelist Code"
                value={whitelistCode}
                onChange={(e) => setWhitelistCode(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                    <span>Updating...</span>
                  </>
                ) : (
                  "Update Code"
                )}
              </button>
            </form>
            {whitelistError && (
              <p
                className={`mt-4 text-lg text-center ${
                  whitelistError.includes("success") ? "text-green-400" : "text-red-400"
                }`}
              >
                {whitelistError}
              </p>
            )}
          </div>
        </div>

         {/* Employee List with Availability */}
         <div className="bg-black/20 backdrop-blur-lg shadow-lg rounded-lg p-6 border-2 border-white mt-5 ml-20">
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
                    <p className="text-white">
                      <strong>Availability: </strong> 
                      {availability[employee.id] && (
                        <ul>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <li key={day}>
                              <strong>{day}: </strong>
                              <span className={availability[employee.id][`${day.toLowerCase()}_morning`] ? 'text-green-400' : 'text-red-400'}>
                                Morning: {availability[employee.id][`${day.toLowerCase()}_morning`] ? 'Yes' : 'No'}
                              </span>,{' '} 
                              <span className={availability[employee.id][`${day.toLowerCase()}_afternoon`] ? 'text-green-400' : 'text-red-400'}>
                                Afternoon: {availability[employee.id][`${day.toLowerCase()}_afternoon`] ? 'Yes' : 'No'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
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
  );
}
