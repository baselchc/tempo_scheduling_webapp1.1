"use client";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import TimePicker from "react-time-picker";
import "react-datepicker/dist/react-datepicker.css";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import axios from "axios";

const apiUrl = 'http://localhost:5000'; // Backend URL

export default function CreateSchedulePage() {
  const [employees, setEmployees] = useState([]);
  const [managerId, setManagerId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [weekPeriod, setWeekPeriod] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/employees/get-employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  useEffect(() => {
    if (shiftStart) {
      const [hours, minutesPart] = shiftStart.split(":");
      const minutes = minutesPart.split(" ")[0];
      const isPM = minutesPart.split(" ")[1] === "PM";
      let parsedHours = parseInt(hours, 10);
      if (isPM && parsedHours !== 12) parsedHours += 12;
      if (!isPM && parsedHours === 12) parsedHours = 0;
      const endHour = parsedHours + 1;
      const newEndTime = `${endHour > 12 ? endHour - 12 : endHour}:${minutes} ${endHour >= 12 ? "PM" : "AM"}`;
      setShiftEnd(newEndTime);
    }
  }, [shiftStart]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const scheduleData = {
      manager_id: parseInt(managerId),
      employee_id: selectedEmployeeId,
      week_period: weekPeriod,
      shift_start: combineDateTime(weekPeriod, shiftStart),
      shift_end: combineDateTime(weekPeriod, shiftEnd),
    };

    try {
      const response = await axios.post(`${apiUrl}/api/schedule/create-schedule`, scheduleData);
      if (response.status === 200) {
        setStatusMessage('Schedule created successfully!');
      }
    } catch (error) {
      setStatusMessage("Failed to create schedule");
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
        <h1 className="text-4xl font-bold mb-6 text-center text-black">Create Schedule</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white bg-opacity-90 p-8 rounded-lg shadow-lg backdrop-blur-md">
          {/* Manager ID Input */}
          <label className="block">
            <span className="text-lg font-semibold text-black">Enter Manager ID</span>
            <input
              type="number"
              className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              placeholder="Enter Manager ID"
              required
            />
          </label>

          {/* Employee Dropdown */}
          <label className="block">
            <span className="text-lg font-semibold text-black">Select Employee</span>
            <select
              className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
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
            <span className="text-lg font-semibold text-black">Shift Start Date</span>
            <DatePicker
              selected={weekPeriod}
              onChange={(date) => setWeekPeriod(date)}
              className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </label>

          {/* Time Picker for Shift Start */}
          <label className="block">
            <span className="text-lg font-semibold text-black">Shift Start Time</span>
            <TimePicker
              onChange={setShiftStart}
              value={shiftStart}
              disableClock={true}
              className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              clearIcon={null}
              required
              format="h:mm a"
            />
          </label>

          {/* Time Picker for Shift End */}
          <label className="block">
            <span className="text-lg font-semibold text-black">Shift End Time (Prefilled)</span>
            <TimePicker
              onChange={setShiftEnd}
              value={shiftEnd}
              disableClock={true}
              className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              clearIcon={null}
              required
              format="h:mm a"
            />
          </label>

          {/* Submit Button */}
          <button className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition duration-200">
            Create Schedule
          </button>
        </form>

        <p className="mt-4 text-lg text-center text-black">{statusMessage}</p>
      </div>
    </div>
  );
}
