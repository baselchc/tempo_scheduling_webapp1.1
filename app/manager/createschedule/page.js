"use client";
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
        setStatusMessage('Schedule created successfully!');
      }
    } catch (error) {
      setStatusMessage('Failed to create schedule');
    }
  };

  return (
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
