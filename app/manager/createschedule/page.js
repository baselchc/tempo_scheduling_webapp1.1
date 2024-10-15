"use client";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import TimePicker from "react-time-picker";
import "react-datepicker/dist/react-datepicker.css";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import axios from "axios";

const apiUrl = "http://localhost:5000"; // Backend URL

export default function CreateSchedulePage() {
  // State for employee list and schedule form
  const [employees, setEmployees] = useState([]);
  const [managerId, setManagerId] = useState(""); // Manager ID as integer input
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [weekPeriod, setWeekPeriod] = useState(new Date());
  const [shiftStart, setShiftStart] = useState("09:00 AM");
  const [shiftEnd, setShiftEnd] = useState("05:00 PM");
  const [statusMessage, setStatusMessage] = useState("");

  // Fetch employee list on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/employees/get-employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  // Combine date and time into a proper timestamp
  const combineDateTime = (date, time) => {
    const [hours, minutesPart] = time.split(":");
    const minutes = minutesPart.split(" ")[0];
    const isPM = minutesPart.split(" ")[1] === "PM";
    const combined = new Date(date);
    let parsedHours = parseInt(hours, 10);
    if (isPM && parsedHours !== 12) parsedHours += 12;
    if (!isPM && parsedHours === 12) parsedHours = 0;
    combined.setHours(parsedHours);
    combined.setMinutes(minutes);
    combined.setSeconds(0);
    return combined.toISOString();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const shiftStartTimestamp = combineDateTime(weekPeriod, shiftStart);
    const shiftEndTimestamp = combineDateTime(weekPeriod, shiftEnd);

    const scheduleData = {
      manager_id: parseInt(managerId), // Convert Manager ID to integer
      employee_id: selectedEmployeeId,
      week_period: weekPeriod,
      shift_start: shiftStartTimestamp,
      shift_end: shiftEndTimestamp,

import { useState } from 'react';
import axios from 'axios';

const apiUrl = 'http://localhost:5000'; // Backend URL

export default function CreateSchedulePage() {
  const [managerId, setManagerId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [weekPeriod, setWeekPeriod] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Function to format the datetime-local value to the PostgreSQL TIMESTAMP format
  const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const scheduleData = {
      manager_id: managerId,
      employee_name: employeeName,
      week_period: weekPeriod,
      shift_start: formatDateTime(shiftStart),  // Format shift_start
      shift_end: formatDateTime(shiftEnd),      // Format shift_end

    };

    try {
      const response = await axios.post(`${apiUrl}/api/schedule/create-schedule`, scheduleData);
      if (response.status === 200) {

        setStatusMessage("Schedule created successfully!");
      }
    } catch (error) {
      setStatusMessage("Failed to create schedule");

        setStatusMessage('Schedule created successfully!');
      }
    } catch (error) {
      setStatusMessage('Failed to create schedule');

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

      <div className="container mx-auto mt-10">
        <h1 className="text-3xl font-bold mb-6 text-white">Create Schedule</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Manager ID Input */}
          <label className="block">
            <span className="text-white">Enter Manager ID</span>
            <input
              type="number"
              className="block w-full p-2 border rounded-lg"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              placeholder="Enter Manager ID"
              required
            />
          </label>

          {/* Employee Dropdown */}
          <label className="block">
            <span className="text-white">Select Employee</span>
            <select
              className="block w-full p-2 border rounded-lg"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              required
            >
              <option value="">Select an employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name} ({employee.email})
                </option>
              ))}
            </select>
          </label>

          {/* Date Picker for Week Period */}
          <label className="block">
            <span className="text-white">Shift Start Date</span>
            <DatePicker
              selected={weekPeriod}
              onChange={(date) => setWeekPeriod(date)}
              className="block w-full p-2 border rounded-lg"
              required
            />
          </label>

          {/* Time Picker for Shift Start */}
          <label className="block">
            <span className="text-white">Shift Start Time</span>
            <TimePicker
              onChange={setShiftStart}
              value={shiftStart}
              disableClock={true}
              className="block w-full p-2 border rounded-lg"
              clearIcon={null}
              required
              format="h:mm a" // 12-hour format
            />
          </label>

          {/* Time Picker for Shift End */}
          <label className="block">
            <span className="text-white">Shift End Time</span>
            <TimePicker
              onChange={setShiftEnd}
              value={shiftEnd}
              disableClock={true}
              className="block w-full p-2 border rounded-lg"
              clearIcon={null}
              required
              format="h:mm a" // 12-hour format
            />
          </label>

          {/* Submit Button */}
          <button className="w-full bg-blue-500 text-white p-2 rounded-lg" type="submit">
            Create Schedule
          </button>
        </form>

        <p className="mt-4 text-lg text-white">{statusMessage}</p>
      </div>

    <div>
      <h1>Create Schedule</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Manager ID"
          value={managerId}
          onChange={(e) => setManagerId(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Employee Name"
          value={employeeName}
          onChange={(e) => setEmployeeName(e.target.value)}
          required
        />
        <input
          type="date"
          placeholder="Week Period"
          value={weekPeriod}
          onChange={(e) => setWeekPeriod(e.target.value)}
          required
        />
        <input
          type="datetime-local"
          placeholder="Shift Start"
          value={shiftStart}
          onChange={(e) => setShiftStart(e.target.value)}
          required
        />
        <input
          type="datetime-local"
          placeholder="Shift End"
          value={shiftEnd}
          onChange={(e) => setShiftEnd(e.target.value)}
          required
        />
        <button type="submit">Create Schedule</button>
      </form>
      <p>{statusMessage}</p>

    </div>
  );
}
