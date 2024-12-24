// app / manager / components / SchedulerCalendar.js

import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { useUser, useAuth } from "@clerk/nextjs";
import { Calendar, Users, X, Plus } from 'lucide-react';
import { supabase } from '../../../backend/database/supabaseClient';

const ModernScheduleCalendar = forwardRef(({ onMonthChange, onShiftRemove }, ref) => {
  const { user } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [addingNewShift, setAddingNewShift] = useState(false);
  const [selectedShiftType, setSelectedShiftType] = useState('');

  const timeSlots = useMemo(() => ({
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
  }), []);

  const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const sortShifts = useCallback((shifts) => {
    const shiftOrder = {
      'manager': 1,
      'morning': 2,
      'afternoon': 3
    };
  
    return shifts.sort((a, b) => {
      // First sort by date if dates are different
      if (a.date !== b.date) {
        return new Date(a.date) - new Date(b.date);
      }
      
      // Then sort by shift type using the predefined order
      const shiftTypeComparison = shiftOrder[a.shift_type] - shiftOrder[b.shift_type];
      
      // If shift types are different, use that order
      if (shiftTypeComparison !== 0) {
        return shiftTypeComparison;
      }
      
      // If shift types are the same, sort by employee last name
      const employeeA = employees.find(e => e.id === a.employee_id);
      const employeeB = employees.find(e => e.id === b.employee_id);
      
      // If we can't find employee info, put them at the end
      if (!employeeA || !employeeB) {
        return !employeeA ? 1 : -1;
      }
      
      return employeeA.last_name.localeCompare(employeeB.last_name);
    });
  }, [employees]);

  const fetchData = useCallback(async () => {
    if (!user || isLoadingRef.current || !mountedRef.current) return;
  
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
  
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const startDate = new Date(firstDay);
      startDate.setDate(firstDay.getDate() - firstDay.getDay());
  
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const endDate = new Date(lastDay);
      endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  
      const { data: employeesData, error: employeesError } = await supabase
        .from("users")
        .select("id, first_name, last_name, role, clerk_user_id");
  
      if (employeesError) throw employeesError;
  
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("schedules")
        .select("id, date, shift_type, employee_id")
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString());
  
      if (scheduleError) throw scheduleError;
  
      if (mountedRef.current) {
        setEmployees(employeesData || []);
        // Create the schedule data and then sort it
        const mappedSchedule = (scheduleData || []).map((s) => {
          const employee = employeesData.find((e) => e.id === s.employee_id);
          if (!employee) {
            console.warn(`No employee found for ID: ${s.employee_id}`);
          }
          return {
            ...s,
            date: new Date(s.date).toISOString().split("T")[0],
            employee
          };
        });
        // Apply the sorting function before setting the schedule
        setSchedule(sortShifts(mappedSchedule));
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      setError(error.message || "Failed to fetch calendar data");
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [user, currentDate, sortShifts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    console.log('Initial employees state:', employees);
  }, [employees]);

  useEffect(() => {
    if (onMonthChange) {
      onMonthChange(currentDate);
    }
  }, [currentDate, onMonthChange]);

  useImperativeHandle(ref, () => ({
    refreshData: fetchData,
  }));

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

  const renderScheduledShift = useCallback((shift, employee) => {
    if (!shift?.shift_type || !employee?.id) {
      console.warn('Invalid shift or employee data:', { shift, employee });
      return null;
    }
  
    const timeSlot = timeSlots[shift.shift_type];
    if (!timeSlot) {
      console.warn('Unknown shift type:', shift.shift_type);
      return null;
    }
  
    return (
      <div className="relative group">
        <div
          className={`${timeSlot.color} px-2 py-1 rounded-md border text-xs mb-1 flex flex-col shadow-sm`}
        >
          <span className="font-medium">{timeSlot.label}</span>
          <span className="truncate">
            {employee?.first_name} {employee?.last_name}
          </span>
          <span className="text-[10px] opacity-75">{timeSlot.time}</span>
         
          {/* Only show remove button on hover */}
          <div className="absolute right-1 top-1 hidden group-hover:flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent day selection
                if (window.confirm('Are you sure you want to remove this shift?')) {
                  onShiftRemove?.(shift.id);
                }
              }}
              className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-sm"
              title="Remove shift"
            >
              <span className="text-xs">×</span>
            </button>
          </div>
        </div>
      </div>
    );
  }, [onShiftRemove, timeSlots]); // Also added timeSlots to dependencies

  const renderCalendarDay = useCallback((day) => {
    const dayString = day.toISOString().split("T")[0];
    
    // Filter shifts for this day and sort them
    const daySchedule = sortShifts(
      schedule.filter((s) => s.date === dayString)
    );
  
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
            return (
              <div key={`${shift.shift_type}-${idx}`}>
                {renderScheduledShift(shift, employee)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [schedule, employees, selectedDay, currentDate, onShiftRemove, sortShifts, renderScheduledShift]);

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      console.log('Navigating to previous month:', newDate.toISOString());
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      console.log('Navigating to next month:', newDate.toISOString());
      return newDate;
    });
  };

  const handleAddNewShift = async () => {
    console.log('Starting handleAddNewShift with:', {
      selectedEmployee,
      selectedShiftType,
      selectedDay: selectedDay?.toISOString(),
    });

    if (!selectedEmployee || !selectedShiftType || !selectedDay) {
      alert('Please select both an employee and shift type');
      return;
    }
  
    try {
      const dateStr = selectedDay.toISOString().split('T')[0];
      
      // Check ALL rules before allowing a new shift:
      
      // 1. Check if employee already has ANY shift that day
      const employeeExistingShift = schedule.find(s => 
        Number(s.employee_id) === Number(selectedEmployee) && 
        s.date === dateStr
      );
  
      if (employeeExistingShift) {
        alert('This employee already has a shift scheduled for this day');
        return;
      }
  
      // 2. For morning/afternoon shifts, check if same type already has 2 employees
      if (selectedShiftType !== 'manager') {
        const shiftsOfThisType = schedule.filter(s => 
          s.date === dateStr && 
          s.shift_type === selectedShiftType
        );
  
        if (shiftsOfThisType.length >= 2) {
          alert(`This ${selectedShiftType} shift already has the maximum of 2 employees`);
          return;
        }
      }
  
      // 3. For manager shifts, check if there's already a manager assigned
      if (selectedShiftType === 'manager') {
        const existingManagerShift = schedule.find(s => 
          s.date === dateStr && 
          s.shift_type === 'manager'
        );
  
        if (existingManagerShift) {
          alert('A manager is already assigned to this day');
          return;
        }
      }
  
      // 4. Check role compatibility
      const employee = employees.find(e => String(e.id) === String(selectedEmployee));
      if (!employee) {
        alert('Selected employee not found');
        return;
      }
  
      const isManager = employee.role === 'manager';
      if ((isManager && selectedShiftType !== 'manager') || 
          (!isManager && selectedShiftType === 'manager')) {
        alert('Invalid shift type for this employee role');
        return;
      }
  
      // 5. Check if employee is already assigned to the same shift type that day
      const duplicateShift = schedule.find(s => 
        s.date === dateStr && 
        s.shift_type === selectedShiftType && 
        s.employee_id === selectedEmployee
      );
  
      if (duplicateShift) {
        alert('This employee is already assigned to this shift type today');
        return;
      }
  
      // If all checks pass, insert the new shift
      const existingShifts = schedule.filter(s => s.date === dateStr);
      console.log('Existing shifts for this day:', existingShifts);
    
      
      console.log('Employee existing shift check:', {
        found: !!employeeExistingShift,
        shift: employeeExistingShift
      });


      const { error } = await supabase
        .from('schedules')
        .insert({
          employee_id: selectedEmployee,
          date: dateStr,
          shift_type: selectedShiftType,
        });
  
      if (error) throw error;
  
      setAddingNewShift(false);
      setSelectedEmployee('');
      setSelectedShiftType('');
      
      if (ref.current?.refreshData) {
        await ref.current.refreshData();
      }
    } catch (error) {
      console.error('Error adding new shift:', error);
      alert('Failed to add new shift: ' + error.message);
    }
  };

  const renderSidebar = useCallback(() => {
    if (!selectedDay) return null;
     
    const selectedDateStr = selectedDay.toISOString().split('T')[0];
    const daySchedule = schedule.filter(s => s.date === selectedDateStr);
    
    return (
      <div className="fixed right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-sm shadow-lg border-l border-gray-200 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-lg font-semibold">
            {selectedDay.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </h3>
          <button 
            onClick={() => setSelectedDay(null)}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          {Object.entries(timeSlots).map(([slotType, slot]) => {
            const shifts = daySchedule.filter(s => s.shift_type === slotType);
            const isManagerShift = slotType === 'manager';
            
            return (
              <div key={slotType} className={`${slot.color} p-3 rounded-lg border relative`}>
                <div className="font-medium">{slot.label}</div>
                <div className="text-xs opacity-75">{slot.time}</div>
                
                {isManagerShift ? (
                  // Manager shift - single slot
                  <>
                    {shifts.length > 0 ? (
                      shifts.map(shift => {
                        const employee = employees.find(e => e.id === shift.employee_id);
                        return employee && (
                          <div key={shift.id} className="mt-2">
                            <div className="text-sm font-medium">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <button
                              onClick={() => onShiftRemove?.(shift.id)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <button
                        onClick={() => {
                          setAddingNewShift(true);
                          setSelectedShiftType(slotType);
                        }}
                        className="mt-2 flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800"
                      >
                        <Plus className="w-4 h-4" />
                        Add Manager
                      </button>
                    )}
                  </>
                ) : (
                  // Morning/Afternoon shifts - 2 slots
                  <div className="space-y-2 mt-2">
                    {Array(2).fill(null).map((_, index) => {
                      const shift = shifts[index];
                      const employee = shift ? employees.find(e => e.id === shift.employee_id) : null;
                      
                      return (
                        <div key={index} className="relative min-h-[28px] p-1 bg-white/50 rounded">
                          {employee ? (
                            <div className="text-sm font-medium flex justify-between items-center">
                              <span>{employee.first_name} {employee.last_name}</span>
                              <button
                                onClick={() => onShiftRemove?.(shift.id)}
                                className="p-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-400 italic">Empty Slot</span>
                              <button
                                onClick={() => {
                                  setAddingNewShift(true);
                                  setSelectedShiftType(slotType);
                                }}
                                className="p-1 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                              >
                                <Plus className="w-4 h-4" />
                                Add
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
  
          {/* Add New Shift Form */}
          {addingNewShift && (
            <div className="mt-4 p-4 bg-white rounded-lg border shadow-sm">
              <h4 className="font-medium mb-3">Add Employee to {timeSlots[selectedShiftType]?.label} Shift</h4>
              <div className="space-y-3">
<select
  value={selectedEmployee}
  onChange={(e) => {
    console.log('Selected employee:', e.target.value);
    setSelectedEmployee(e.target.value);
  }}
  className="w-full p-2 border rounded-lg text-sm"
>
  <option value="">Select Employee</option>
  {employees
    .filter(emp => 
      (selectedShiftType === 'manager' ? emp.role === 'manager' : emp.role === 'employee')
    )
    .map((emp) => {
      console.log('Mapping employee option:', {
        id: emp.id,
        userId: emp.user_id,
        name: `${emp.first_name} ${emp.last_name}`
      });
      return (
        <option key={emp.id} value={emp.id}>
          {emp.first_name} {emp.last_name}
        </option>
      );
    })}
</select>
  
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNewShift}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg text-sm font-medium"
                  >
                    Add to Shift
                  </button>
                  <button
                    onClick={() => {
                      setAddingNewShift(false);
                      setSelectedEmployee('');
                      setSelectedShiftType('');
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, [selectedDay, schedule, employees, addingNewShift, selectedShiftType, selectedEmployee, onShiftRemove, timeSlots]);

  return (
    <div className="p-6 bg-white/40 backdrop-blur-sm rounded-xl shadow-lg">
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
      {renderSidebar()}
    </div>
  );
});

ModernScheduleCalendar.displayName = "ModernScheduleCalendar";

export default ModernScheduleCalendar;