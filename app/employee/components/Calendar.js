"use client";
import React, { useState, useEffect } from 'react';

const EmployeeCalendar = () => {
  const [scheduleData, setScheduleData] = useState([]);

  useEffect(() => {
    const today = new Date();
    const upcomingSchedule = [];

    // Define shifts for the week with start and end times
    const shiftsForWeek = [
      // Day 0: Today
      [
        { start: 9, end: 17 }, // Shift from 9 AM to 5 PM
        { start: 10, end: 18 }, // Shift from 10 AM to 6 PM
      ],
      // Day 1
      [
        { start: 10, end: 18 }, // Shift from 10 AM to 6 PM
      ],
      // Day 2
      [
        { start: 9, end: 17 }, // Shift from 9 AM to 5 PM
        { start: 11, end: 19 }, // Shift from 11 AM to 7 PM
      ],
      // Day 3
      [
        { start: 12, end: 20 }, // Shift from 12 PM to 8 PM
      ],
      // Day 4
      [
        { start: 13, end: 21 }, // Shift from 1 PM to 9 PM
        { start: 14, end: 22 }, // Shift from 2 PM to 10 PM
      ],
      // Day 5
      [
        { start: 9, end: 17 }, // Shift from 9 AM to 5 PM
      ],
      // Day 6
      [
        { start: 8, end: 16 }, // Shift from 8 AM to 4 PM
      ],
    ];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      upcomingSchedule.push({
        date: date.toDateString(),
        shifts: shiftsForWeek[i], // Assign the shifts for the corresponding day
      });
    }

    setScheduleData(upcomingSchedule);
  }, []);

  // Define the hourly range
  const hoursRange = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

  // Function to format time in AM/PM format
  const formatTime = (hour) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour}${ampm}`;
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">Upcoming Schedule (Next 7 Days)</h2>
      
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 font-medium border-b border-black"></th>
            {scheduleData.map((item, index) => (
              <th key={index} className="p-2 font-medium border-b border-black">
                {new Date(item.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hoursRange.map((hour, index) => (
            <tr key={index}>
              <td className="p-2 font-medium border-b border-black">{formatTime(hour)}</td>
              {scheduleData.map((item, dayIndex) => {
                // Find shifts for the current hour
                const shiftsForDay = item.shifts || [];
                const currentShift = shiftsForDay.find(shift => hour >= shift.start && hour < shift.end);

                // Determine cell background color based on whether there is a shift
                const cellClass = currentShift ? "bg-blue-300" : "bg-gray-200"; // Shift present or not
                
                // Check if the current hour is the first hour of a shift
                const displayShiftTime = currentShift && hour === currentShift.start;

                return (
                  <td key={item.date} className={`${cellClass} p-2 border-b border-black`}>
                    {displayShiftTime ? `${currentShift.start}:00 - ${currentShift.end}:00` : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        table {
          font-family: 'Arial', sans-serif; /* Change to a different font */
        }
        th, td {
          text-align: center; /* Center align text */
          border: none; /* Remove all borders */
        }
        tr {
          border-bottom: none; /* Remove bottom border from rows */
        }
      `}</style>
    </div>
  );
};

export default EmployeeCalendar;

// code written with help of Chatgpt4 and prompt was "create a EmployeeCalendar that displays an employee's weekly schedule in a visual table format. The component should dynamically generate the schedule for the current week starting from today. Each day should display shifts with start and end times. The times should range from 8 AM to 10 PM daily."