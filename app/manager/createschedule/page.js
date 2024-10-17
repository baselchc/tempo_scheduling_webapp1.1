"use client"; // Mark this as a Client Component

import { useState, useEffect } from 'react'; // Import useState and useEffect hooks
import axios from 'axios';

const apiUrl = 'http://localhost:5000'; // Backend URL

export default function CreateSchedulePage() {
  // State for form data and employee list
  const [employees, setEmployees] = useState([]);
  const [managerId, setManagerId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [weekPeriod, setWeekPeriod] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch employee list
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/employees/get-employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  // Function to format date and time for PostgreSQL
  const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  // Handle form submission to create a schedule
  const handleSubmit = async (e) => {
    e.preventDefault();
    const scheduleData = {
      manager_id: managerId,
      employee_id: employeeId,
      week_period: weekPeriod,
      shift_start: formatDateTime(shiftStart),
      shift_end: formatDateTime(shiftEnd),
    };

    try {
      const response = await axios.post(`${apiUrl}/api/schedule/create-schedule`, scheduleData);
      if (response.status === 200) {
        setStatusMessage('Schedule created successfully!');
      }
    } catch (error) {
      setStatusMessage('Failed to create schedule');
    }
  };

  return (
    <div className="container mx-auto mt-10">
      <h1 className="text-4xl font-bold mb-10 text-center">Create Schedule</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">Manager ID</label>
          <input
            type="text"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Select Employee</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="">Select an employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700">Week Period</label>
          <input
            type="date"
            value={weekPeriod}
            onChange={(e) => setWeekPeriod(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Shift Start</label>
          <input
            type="datetime-local"
            value={shiftStart}
            onChange={(e) => setShiftStart(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Shift End</label>
          <input
            type="datetime-local"
            value={shiftEnd}
            onChange={(e) => setShiftEnd(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-lg">
          Create Schedule
        </button>
      </form>
      <p className="mt-4 text-green-500">{statusMessage}</p>
    </div>
  );
}
