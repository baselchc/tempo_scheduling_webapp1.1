// components/ScheduleCalendar.js
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import the calendar styles
import { format } from 'date-fns'; // Optional: for formatting date

const ScheduleCalendar = () => {
  const [date, setDate] = useState(new Date()); // State to manage selected date

  const handleDateChange = (newDate) => {
    setDate(newDate); // Update selected date
    // Fetch schedule for the selected date here if needed
    console.log('Selected date:', format(newDate, 'MMMM d, yyyy'));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-2">Schedule</h2>
      <Calendar
        onChange={handleDateChange}
        value={date}
        className="border-2 border-green-600 rounded-lg shadow-lg" // Optional: Custom styles
      />
      {/* Display the selected date or schedule information here */}
      <div className="mt-4">
        <h3 className="text-lg">Selected Date: {format(date, 'MMMM d, yyyy')}</h3>
        {/* Add more details or schedule info here */}
      </div>
    </div>
  );
};

export default ScheduleCalendar;
