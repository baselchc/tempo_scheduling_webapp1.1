"use client";

import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useUser, useAuth } from "@clerk/nextjs";
import { Calendar, Users } from 'lucide-react';
import { supabase } from '../../../backend/database/supabaseClient';

const ModernScheduleCalendar = forwardRef(({ onMonthChange }, ref) => {
  const { user } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const timeSlots = {
    morning: {
      label: "Morning",
      time: "9:00 AM - 1:00 PM",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    afternoon: {
      label: "Afternoon",
      time: "1:00 PM - 5:00 PM",
      color: "bg-orange-100 text-orange-800 border-orange-200",
    },
    manager: {
      label: "Manager",
      time: "9:00 AM - 5:00 PM",
      color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    },
  };

  const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!user || isLoadingRef.current || !mountedRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const monthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ).toISOString();

      const { data: employeesData, error: employeesError } = await supabase
        .from("users")
        .select("id, first_name, last_name, role");

      if (employeesError) throw employeesError;

      const { data: scheduleData, error: scheduleError } = await supabase
        .from("schedules")
        .select("id, date, shift_type, employee_id")
        .gte("date", monthStart)
        .lte("date", new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString());

      if (scheduleError) throw scheduleError;

      if (mountedRef.current) {
        setEmployees(employeesData || []);
        setSchedule(
          (scheduleData || []).map((s) => ({
            ...s,
            date: new Date(s.date).toISOString().split("T")[0],
            employee: employeesData.find((e) => e.id === s.employee_id),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error.message || error);
      setError(error.message || "Failed to fetch calendar data");
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [user, currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useImperativeHandle(ref, () => ({
    refreshData: fetchData,
  }));

  const getMonthDays = (date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const days = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const renderScheduledShift = (shift, employee) => {
    if (!shift || !employee) return null;
    const timeSlot = timeSlots[shift.shift_type];
    return (
      <div
        className={`${timeSlot.color} px-2 py-1 rounded-md border text-xs mb-1 flex flex-col shadow-sm`}
      >
        <span className="font-medium">{timeSlot.label}</span>
        <span className="truncate">
          {employee?.first_name} {employee?.last_name}
        </span>
        <span className="text-[10px] opacity-75">{timeSlot.time}</span>
      </div>
    );
  };

  const renderCalendarDay = (day) => {
    const dayString = day.toISOString().split("T")[0];
    const daySchedule = schedule.filter((s) => s.date === dayString);

    const isToday = dayString === new Date().toISOString().split("T")[0];
    const isSelected = selectedDay && dayString === selectedDay.toISOString().split("T")[0];
    const isCurrentMonth = day.getMonth() === currentDate.getMonth();

    return (
      <div
        key={dayString}
        onClick={() => setSelectedDay(day)}
        className={`min-h-28 p-2 border rounded-lg cursor-pointer transition-all ${
          isCurrentMonth ? "bg-white" : "bg-gray-50"
        } ${isSelected ? "ring-2 ring-blue-500" : ""} ${
          isToday ? "border-blue-500" : "border-gray-200"
        } hover:shadow-md`}
      >
        <div className={`font-medium mb-1 text-sm ${isToday ? "text-blue-600" : ""}`}>
          {day.getDate()}
        </div>
        <div className="space-y-1">
          {daySchedule.map((shift, idx) => {
            const employee = employees.find((e) => e.id === shift.employee_id);
            return <div key={`${shift.shift_type}-${idx}`}>{renderScheduledShift(shift, employee)}</div>;
          })}
        </div>
      </div>
    );
  };

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={handlePreviousMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            ←
          </button>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(currentDate)}
          </h2>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            →
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>{employees.length} Employees</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="p-2 text-center font-semibold text-gray-600">
            {day}
          </div>
        ))}
        {getMonthDays(currentDate).map((day) => renderCalendarDay(day))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm justify-center">
        {Object.entries(timeSlots).map(([key, slot]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${slot.color.split(" ")[0]}`} />
            <span>{slot.label} ({slot.time})</span>
          </div>
        ))}
      </div>
    </div>
  );
});

ModernScheduleCalendar.displayName = "ModernScheduleCalendar";

export default ModernScheduleCalendar;
