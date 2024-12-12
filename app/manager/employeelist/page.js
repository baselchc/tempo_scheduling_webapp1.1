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

  const [expandedEmployee, setExpandedEmployee] = useState(null);
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


  const toggleEmployeeDetails = (employeeId) => {
    setExpandedEmployee(expandedEmployee === employeeId ? null : employeeId);
  };

  const employeeDetails = (employeeId) => {
    return (
      availability[employeeId] && (
        <ul>
          <li>
            <strong>Email: </strong>
            <span className="text-black">{employees.find(emp => emp.id === employeeId)?.email || 'N/A'}</span>
          </li>
          <li>
            <strong>Phone: </strong>
            <span className="text-black">{employees.find(emp => emp.id === employeeId)?.phone || 'N/A'}</span>
          </li>
          <li>
            <strong>Role: </strong>
            <span className="text-black">{employees.find(emp => emp.id === employeeId)?.role || 'N/A'}</span>
          </li>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
            <li key={day}>
              <strong>{day}: </strong>
              <span className={availability[employeeId][`${day.toLowerCase()}_morning`] ? 'text-green-400' : 'text-red-400'}>
                Morning: {availability[employeeId][`${day.toLowerCase()}_morning`] ? 'Yes' : 'No'}
              </span>,{' '}
              <span className={availability[employeeId][`${day.toLowerCase()}_afternoon`] ? 'text-green-400' : 'text-red-400'}>
                Afternoon: {availability[employeeId][`${day.toLowerCase()}_afternoon`] ? 'Yes' : 'No'}
              </span>
            </li>
          ))}
          
        </ul>
      )
    );
  };
  

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
                className="block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 bg-white/10 text-black"
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

        <div className="bg-black/20 backdrop-blur-lg shadow-lg rounded-lg p-6 border-2 border-white ml-20 mt-8">
            <h2 className="text-2xl font-bold mb-4 text-center text-white">Employee List</h2>
            {employees.map((employee) => (
              <div key={employee.id} className="mb-4">
                <div
                  onClick={() => toggleEmployeeDetails(employee.id)}
                  className="flex items-center justify-between cursor-pointer bg-gray-400 hover:bg-gray-500 rounded-lg p-4"
                >
                  <div className="flex items-center">
                    <Image
                      src={profileImageUrl}
                      alt={`${employee.first_name} ${employee.last_name}`}
                      width={50}
                      height={50}
                      className="rounded-full"
                    />
                    <div className="ml-4">
                      <p className="text-white text-lg font-semibold">
                        {employee.first_name} {employee.last_name}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-white text-lg">{employee.role}</p>
                  </div>
                </div>

                {expandedEmployee === employee.id && (
                  <div className="bg-white rounded-lg p-4 mt-2">
                    {employeeDetails(employee.id)}
                  </div>
                )}
              </div>
            ))}
          </div>
      </div>
    </div>
  );
}