"use client";

import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

const WORK_HOURS = Array.from({ length: 9 }, (_, i) => i + 9); // 9 AM to 5 PM
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function AvailabilitySection({ onAvailabilityChange, initialAvailability = {} }) {
  const [availability, setAvailability] = useState({});
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    // Initialize availability state with default values
    const defaultAvailability = {};
    DAYS.forEach(day => {
      defaultAvailability[day] = {
        isAvailable: false,
        startTime: "09:00",
        endTime: "17:00"
      };
    });
    setAvailability({ ...defaultAvailability, ...initialAvailability });
  }, [initialAvailability]);

  const handleAvailabilityChange = (day, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const validateTimes = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return start < end;
  };

  const handleSubmit = async () => {
    // Validate times for all available days
    let isValid = true;
    Object.entries(availability).forEach(([day, slots]) => {
      if (slots.isAvailable && !validateTimes(slots.startTime, slots.endTime)) {
        isValid = false;
        setSubmitStatus({
          type: "error",
          message: `Invalid time range for ${day}`
        });
      }
    });

    if (!isValid) return;

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
              <label className="flex items-center space-x-2 min-w-[150px]">
                <input
                  type="checkbox"
                  checked={availability[day]?.isAvailable}
                  onChange={(e) => handleAvailabilityChange(day, "isAvailable", e.target.checked)}
                  className="form-checkbox text-blue-500"
                />
                <span className="text-white font-medium">{day}</span>
              </label>
              
              {availability[day]?.isAvailable && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-white">From</span>
                    <select
                      value={availability[day]?.startTime}
                      onChange={(e) => handleAvailabilityChange(day, "startTime", e.target.value)}
                      className="bg-transparent border border-white rounded px-2 py-1 text-white"
                    >
                      {WORK_HOURS.map(hour => (
                        <option key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                          {`${hour}:00`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white">To</span>
                    <select
                      value={availability[day]?.endTime}
                      onChange={(e) => handleAvailabilityChange(day, "endTime", e.target.value)}
                      className="bg-transparent border border-white rounded px-2 py-1 text-white"
                    >
                      {WORK_HOURS.map(hour => (
                        <option key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                          {`${hour}:00`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
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