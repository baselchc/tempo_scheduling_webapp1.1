"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
const apiUrl = 'http://localhost:5000'; // Backend URL
export default function EmployeeManagementPage() {
  // State for managing employee data and form inputs
  const [employees, setEmployees] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('employee');
  const [statusMessage, setStatusMessage] = useState('');
  // Fetch employee list on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);
  // Fetch employees from the backend
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/employees/get-employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };
  // Handle form submission for adding a new employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    const employeeData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      role: role,
    };

    try {
      const response = await axios.post(`${apiUrl}/api/employees/add-employee`, employeeData);
      if (response.status === 200) {
        setStatusMessage('Employee added successfully!');
        fetchEmployees(); // Refresh the employee list after adding a new employee
        // Reset form fields
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setRole('employee');
      }
    } catch (error) {
      setStatusMessage('Failed to add employee');
    }
  };
  return (
    <div className="container mx-auto mt-10">
      <h1 className="text-4xl font-bold mb-10 text-center">Employee Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Add Employee Form */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Add New Employee</h2>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <label className="block">
              <span className="text-gray-700">First Name</span>
              <input
                className="block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-gray-700">Last Name</span>
              <input
                className="block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-gray-700">Email</span>
              <input
                className="block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-gray-700">Phone</span>
              <input
                className="block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-gray-700">Role</span>
              <select
                className="block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600" type="submit">
              Add Employee
            </button>
          </form>
          <p className="mt-4 text-lg text-center text-green-600">{statusMessage}</p>
        </div>

        {/* Employee List */}
        <div className="bg-white shadow-lg rounded-lg p-6">
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
  );
}