"use client";

import { useState } from 'react';

export default function EmployeeSchedule() {
  const [scheduleData] = useState([
    { date: "2024-09-20", shift: "9 AM - 5 PM", status: "Confirmed" },
    { date: "2024-09-21", shift: "10 AM - 6 PM", status: "Pending" },
    { date: "2024-09-22", shift: "11 AM - 7 PM", status: "Confirmed" },
  ]);

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <h1 className="text-3xl font-bold text-center mb-6">Employee Schedule</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-blue-500 text-white">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Date</th>
              <th className="px-6 py-3 text-left font-medium">Shift</th>
              <th className="px-6 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {scheduleData.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="px-6 py-4">{item.date}</td>
                <td className="px-6 py-4">{item.shift}</td>
                <td className={`px-6 py-4 ${
                  item.status === "Confirmed" ? "text-green-500" : "text-yellow-500"
                }`}>
                  {item.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
