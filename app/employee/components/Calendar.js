// app/employee/components/Calendar.js

"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase-browser'
import { useUser } from '@clerk/nextjs';

const EmployeeCalendar = () => {
  const [scheduleData, setScheduleData] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!user) return;

      // Calculate start and end dates for the upcoming week
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 6);
      
      // Fetch shifts from the my_shifts table for the current user within this date range
      const { data, error } = await supabase
        .from('my_shifts')
        .select('*')
        .eq('user_id', user.id)
        .gte('shift_start', today.toISOString())
        .lte('shift_end', endOfWeek.toISOString())
        .order('shift_start', { ascending: true });

      if (error) {
        console.error("Error fetching schedule data:", error.message);
        return;
      }

      // Process fetched data to organize it by days of the week
      const schedule = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        return {
          date: date.toDateString(),
          shifts: data
            .filter(shift => {
              const shiftDate = new Date(shift.shift_start);
              return (
                shiftDate.getFullYear() === date.getFullYear() &&
                shiftDate.getMonth() === date.getMonth() &&
                shiftDate.getDate() === date.getDate()
              );
            })
            .map(shift => ({
              start: new Date(shift.shift_start).getHours(),
              end: new Date(shift.shift_end).getHours(),
            })),
        };
      });

      setScheduleData(schedule);
    };

    fetchScheduleData();
  }, [user]);

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
                const shiftsForDay = item.shifts || [];
                const currentShift = shiftsForDay.find(shift => hour >= shift.start && hour < shift.end);

                const cellClass = currentShift ? "bg-blue-300" : "bg-gray-200";                
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
          font-family: 'Arial', sans-serif;
        }
        th, td {
          text-align: center;
          border: none;
        }
        tr {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
};

export default EmployeeCalendar;

 
// code written with help of Chatgpt4 and prompt was "create a EmployeeCalendar that displays an employee's weekly schedule in a visual table format. The component should dynamically generate the schedule for the current week starting from today. Each day should display shifts with start and end times. The times should range from 8 AM to 10 PM daily."