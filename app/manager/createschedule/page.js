"use client";  // Required for Next.js 13+

import React, { useState } from 'react';
import axios from 'axios';

export default function CreateSchedulePage() {
  const [weekPeriod, setWeekPeriod] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const scheduleData = {
      manager_id: 1,  // Hardcoded manager_id, replace with dynamic value as needed
      week_period: weekPeriod,
      shift_start: shiftStart,
      shift_end: shiftEnd,
    };

    try {
      const response = await axios.post('http://localhost:5000/api/schedule/create-schedule', scheduleData);
      setMessage('Schedule created successfully!');
    } catch (error) {
      setMessage('Failed to create schedule');
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <h1>Create Schedule</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Week Period:</label>
          <input
            type="date"
            value={weekPeriod}
            onChange={(e) => setWeekPeriod(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Shift Start:</label>
          <input
            type="datetime-local"
            value={shiftStart}
            onChange={(e) => setShiftStart(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Shift End:</label>
          <input
            type="datetime-local"
            value={shiftEnd}
            onChange={(e) => setShiftEnd(e.target.value)}
            required
          />
        </div>
        <button type="submit">Create Schedule</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
