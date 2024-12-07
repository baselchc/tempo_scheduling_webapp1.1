// app/employee/components/AvailabilitySection.js

"use client";

import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

const SHIFTS = {
  MORNING: "morning", // 9 AM - 1 PM
  AFTERNOON: "afternoon" // 1 PM - 5 PM
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function AvailabilitySection({ onAvailabilityChange, initialAvailability = {} }) {
  const [availability, setAvailability] = useState({});
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    const defaultAvailability = {};
    DAYS.forEach(day => {
      defaultAvailability[day] = {
        morning: false,
        afternoon: false
      };
    });
    setAvailability({ ...defaultAvailability, ...initialAvailability });
  }, [initialAvailability]);

  const handleShiftChange = (day, shift) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [shift]: !prev[day][shift]
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      if (onAvailabilityChange) {
        await onAvailabilityChange(availability);
      }
      setSubmitStatus({
        type: "success",
        message: "Availability updated successfully"
      });
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "Failed to update availability"
      });
    }
  };

  return (
    <div className="mt-8 bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white">
      <div className="mb-6">
        <div className="text-2xl font-semibold text-white flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Weekly Availability
        </div>
      </div>

      <div className="space-y-6">
        {submitStatus.message && (
          <div className={`p-4 rounded-lg border border-white ${
            submitStatus.type === "error" ? "bg-red-500/20" : "bg-green-500/20"
          }`}>
            <p className="text-white">{submitStatus.message}</p>
          </div>
        )}
        
        <div className="grid gap-4">
          {DAYS.map(day => (
            <div key={day} className="flex items-center space-x-4 p-4 rounded-lg bg-white/10">
              <span className="text-white font-medium min-w-[100px]">{day}</span>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={availability[day]?.morning || false}
                    onChange={() => handleShiftChange(day, SHIFTS.MORNING)}
                    className="form-checkbox text-blue-500"
                  />
                  <span className="text-white">Morning (9 AM - 1 PM)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={availability[day]?.afternoon || false}
                    onChange={() => handleShiftChange(day, SHIFTS.AFTERNOON)}
                    className="form-checkbox text-blue-500"
                  />
                  <span className="text-white">Afternoon (1 PM - 5 PM)</span>
                </label>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition duration-300 ease-in-out text-lg font-semibold"
          >
            Submit Availability
          </button>
        </div>
      </div>
    </div>
  );
}

// Used claude ai to assit with creating this page "what's an efficient way for employees to submit their availability"
