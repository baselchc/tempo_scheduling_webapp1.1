import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useUser, useAuth } from "@clerk/nextjs";
import { Calendar, Users } from 'lucide-react';
import axios from 'axios';

const ModernScheduleCalendar = forwardRef(({ onMonthChange }, ref) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const timeSlots = {
    morning: { 
      label: "Morning", 
      time: "9:00 AM - 1:00 PM",
      color: "bg-blue-100 text-blue-800 border-blue-200"
    },
    afternoon: { 
      label: "Afternoon", 
      time: "1:00 PM - 5:00 PM",
      color: "bg-orange-100 text-orange-800 border-orange-200"
    },
    manager: {
      label: "Manager",
      time: "9:00 AM - 5:00 PM",
      color: "bg-indigo-100 text-indigo-800 border-indigo-200"
    }
  };

  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
      
      const token = await getToken();
      
      const monthStr = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ).toISOString();
  
      console.log('Fetching schedule for month:', monthStr);
  
      const [employeesResponse, scheduleResponse] = await Promise.all([
        axios.get(`${apiUrl}/api/employees/get-employees`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${apiUrl}/api/schedule/monthly-schedule`, {
          params: { month: monthStr },
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
  
      if (mountedRef.current) {
        const employees = employeesResponse.data || [];
        console.log('Employees fetched:', employees.map(e => ({
          id: e.id,
          name: `${e.first_name} ${e.last_name}`,
          role: e.role
        })));
  
        const rawSchedule = scheduleResponse.data || [];
        console.log('Raw schedule data:', rawSchedule.map(s => ({
          date: s.date,
          type: s.shift_type,
          employeeId: s.employee_id
        })));
  
        // Count shifts by type
        const shiftCounts = rawSchedule.reduce((acc, s) => {
          acc[s.shift_type] = (acc[s.shift_type] || 0) + 1;
          return acc;
        }, {});
        console.log('Shift counts by type:', shiftCounts);
  
        const formattedSchedule = rawSchedule.map(s => ({
          ...s,
          date: new Date(s.date).toISOString().split('T')[0],
          employee: employees.find(e => e.id === s.employee_id)
        }));
  
        setEmployees(employees);
        setSchedule(formattedSchedule);
  
        // Log a sample day's schedule
        const sampleDate = new Date(monthStr);
        const sampleDateStr = sampleDate.toISOString().split('T')[0];
        const sampleDaySchedule = formattedSchedule.filter(s => s.date === sampleDateStr);
        console.log('Sample day schedule:', {
          date: sampleDateStr,
          shifts: sampleDaySchedule.map(s => ({
            type: s.shift_type,
            employee: `${s.employee?.first_name} ${s.employee?.last_name}`,
            employeeId: s.employee_id
          }))
        });
      }
    } catch (error) {
      console.error('Calendar fetch error:', error);
      setError(error.response?.data?.error || 'Failed to fetch calendar data');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [user, currentDate, getToken, apiUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useImperativeHandle(ref, () => ({
    refreshData: fetchData
  }));

  useEffect(() => {
    if (onMonthChange) {
      onMonthChange(currentDate);
    }
  }, [currentDate, onMonthChange]);

  const renderScheduledShift = useCallback((shift, employee) => {
    if (!shift || !employee) return null;
  
    // Check shift type instead of employee role
    if (shift.shift_type === 'manager') {
      const timeSlot = timeSlots.manager;
      return (
        <div className={`${timeSlot.color} px-2 py-1 rounded-md border text-xs mb-1 flex flex-col shadow-sm`}>
          <span className="font-medium">{timeSlot.label}</span>
          <span className="truncate">
            {employee?.first_name} {employee?.last_name}
          </span>
          <span className="text-[10px] opacity-75">
            {timeSlot.time}
          </span>
        </div>
      );
    }
    
    const timeSlot = timeSlots[shift.shift_type];
    return (
      <div className={`${timeSlot.color} px-2 py-1 rounded-md border text-xs mb-1 flex flex-col shadow-sm`}>
        <span className="font-medium">{timeSlot.label}</span>
        <span className="truncate">
          {employee?.first_name} {employee?.last_name}
        </span>
        <span className="text-[10px] opacity-75">
          {timeSlot.time}
        </span>
      </div>
    );
  }, []);

  const renderCalendarDay = useCallback((day) => {
    const dayString = day.toISOString().split('T')[0];
    // Sort the daySchedule so morning comes before afternoon
    const daySchedule = schedule
      .filter(s => s.date === dayString)
      .sort((a, b) => {
        const order = { manager: 0, morning: 1, afternoon: 2 };
        return (order[a.shift_type] || 999) - (order[b.shift_type] || 999); 
      });


      if (daySchedule.length > 0) {
        console.log('Calendar Day:', dayString, {
          foundShifts: daySchedule.length,
          shifts: daySchedule.map(s => ({
            type: s.shift_type,
            employeeId: s.employee_id,
            employee: employees.find(e => e.id === s.employee_id)?.first_name
          }))
        });
      }
    
    const isToday = dayString === new Date().toISOString().split('T')[0];
    const isSelected = selectedDay && dayString === selectedDay.toISOString().split('T')[0];
    const isCurrentMonth = day.getMonth() === currentDate.getMonth();

    return (
      <div
        key={dayString}
        onClick={() => setSelectedDay(day)}
        className={`
          min-h-28 p-2 border rounded-lg cursor-pointer transition-all
          ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
          ${isToday ? 'border-blue-500' : 'border-gray-200'}
          hover:shadow-md
        `}
      >
        <div className={`font-medium mb-1 text-sm ${isToday ? 'text-blue-600' : ''}`}>
          {day.getDate()}
        </div>

        <div className="space-y-1">
          {daySchedule.map((shift, idx) => {
            const employee = employees.find(e => e.id === shift.employee_id);
            return (
              <div key={`${shift.shift_type}-${idx}`}>
                {renderScheduledShift(shift, employee)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [schedule, selectedDay, currentDate, employees, renderScheduledShift]);

  const renderSidebar = useCallback(() => {
    if (!selectedDay) return null;
    
    const selectedDateStr = selectedDay.toISOString().split('T')[0];
    const daySchedule = schedule.filter(s => s.date === selectedDateStr);
    
    console.log('Sidebar:', selectedDateStr, {
      allShifts: schedule.length,
      foundShifts: daySchedule.length,
      shifts: daySchedule.map(s => ({
        type: s.shift_type,
        employeeId: s.employee_id,
        employee: employees.find(e => e.id === s.employee_id)?.first_name
      }))
    });

    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          }).format(selectedDay)}
        </h3>
        <div className="space-y-4">
          {Object.entries(timeSlots).map(([slotType, slot]) => {
            const shiftsForType = daySchedule.filter(s => s.shift_type === slotType);
            
            return (
              <div key={slotType} className={`p-3 rounded-lg ${slot.color}`}>
                <div className="font-medium">{slot.label}</div>
                <div className="text-sm">{slot.time}</div>
                <div className="mt-2">
                  {shiftsForType.length > 0 ? (
                    shiftsForType.map((shift, idx) => {
                      const employee = employees.find(e => e.id === shift.employee_id);
                      return (
                        <div key={idx} className="font-medium">
                          {employee?.first_name} {employee?.last_name}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-gray-500 italic">
                      No one scheduled
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [selectedDay, schedule, employees, timeSlots]);

  const getMonthDays = useCallback((date) => {
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
  }, []);

  const handlePreviousMonth = useCallback(() => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(prevMonth);
    // Trigger data refresh for the new month
    fetchData();
  }, [currentDate, fetchData]);

  const handleNextMonth = useCallback(() => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(nextMonth);
    // Trigger data refresh for the new month
    fetchData();
  }, [currentDate, fetchData]);

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            ←
          </button>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            {new Intl.DateTimeFormat('en-US', {
              month: 'long',
              year: 'numeric'
            }).format(currentDate)}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
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

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="p-2 text-center font-semibold text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getMonthDays(currentDate).map(day => renderCalendarDay(day))}
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm justify-center">
              {Object.entries(timeSlots).map(([key, slot]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${slot.color.split(' ')[0]}`} />
                  <span>{slot.label} ({slot.time})</span>
                 </div>
               ))}
             </div>
           </div>

          <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg">
            {renderSidebar()}
          </div>
        </div>
      )}
    </div>
  );
});

ModernScheduleCalendar.displayName = 'ModernScheduleCalendar';

export default ModernScheduleCalendar;
