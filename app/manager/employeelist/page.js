"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from "../../../backend/database/supabaseClient";

const apiUrl = "http://localhost:5000"; // Backend URL

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("employee");
  const [statusMessage, setStatusMessage] = useState("");

  // Fetch employee list when component mounts
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, phone, role");

      if (error) throw error;
      setEmployees(data);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();

    try {
      // Step 1: Create a user in Clerk using the Clerk API
      const clerkResponse = await fetch("https://api.clerk.dev/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CLERK_API_KEY}`, // Replace with your Clerk API key from .env.local
        },
        body: JSON.stringify({
          email_addresses: [{ email_address: email }],
          first_name: firstName,
          last_name: lastName,
        }),
      });

      const clerkData = await clerkResponse.json();

      if (!clerkResponse.ok) {
        throw new Error(clerkData.message || "Failed to create Clerk user");
      }

      // Step 2: Insert the user into the Supabase 'users' table with Clerk's user ID
      const employeeData = {
        clerk_user_id: clerkData.id, // Clerk's unique identifier for this user
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        role: role,
      };

      const { error } = await supabase.from("users").insert(employeeData);
      if (error) throw error;

      // Reset form fields and status message
      setStatusMessage("Employee added successfully!");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setRole("employee");

      // Refresh employee list
      fetchEmployees();
    } catch (error) {
      console.error("Failed to add employee:", error);
      setStatusMessage("Failed to add employee");
    }
  };

  return (
    <div className="relative min-h-screen text-black">
      {/* Blurred background image */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-md brightness-75"
        style={{
          backgroundImage: `url('/images/loginpagebackground.webp')`,
        }}
      ></div>

      <div className="container mx-auto mt-10 px-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-black">Employee Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Add Employee Form */}
          <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 backdrop-blur-md">
            <h2 className="text-2xl font-bold mb-4 text-center">Add New Employee</h2>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <input
                className="block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500"
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                className="block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500"
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              <input
                className="block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500"
                type="text"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <select
                className="block w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
              <button className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600" type="submit">
                Add Employee
              </button>
            </form>
            <p className="mt-4 text-lg text-green-600 text-center">{statusMessage}</p>
          </div>

          {/* Employee List */}
          <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 backdrop-blur-md">
            <h2 className="text-2xl font-bold mb-4 text-center">Employee List</h2>
            {employees.length > 0 ? (
              <ul className="space-y-4">
                {employees.map((employee) => (
                  <li key={employee.id} className="border p-4 rounded-lg bg-gray-50">
                    <p><strong>Name:</strong> {employee.first_name} {employee.last_name}</p>
                    <p><strong>Email:</strong> {employee.email}</p>
                    <p><strong>Phone:</strong> {employee.phone}</p>
                    <p><strong>Role:</strong> {employee.role}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center">No employees found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// Chatgpt prompt for enhancing :Generate a React component with useState and useEffect to manage an employee list. Fetch employees from a backend (GET /api/employees/get-employees) using axios, display them, and provide a form to add new employees (POST /api/employees/add-employee). Style it with Tailwind CSS.