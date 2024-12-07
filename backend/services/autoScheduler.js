const { google } = require('googleapis');
const { supabase } = require('../database/supabaseClient'); // Adjust the path to your supabaseClient.js

class AutoScheduler {
  constructor(monthStart) {
    if (!(monthStart instanceof Date)) {
      this.monthStart = new Date(monthStart);
      console.log('Parsed monthStart:', this.monthStart);
      if (isNaN(this.monthStart.getTime())) {
        throw new Error('Invalid date provided to AutoScheduler');
      }
    } else {
      this.monthStart = monthStart;
    }

    this.monthStart = new Date(
      this.monthStart.getFullYear(),
      this.monthStart.getMonth(),
      1
    );

    this.monthEnd = new Date(
      this.monthStart.getFullYear(),
      this.monthStart.getMonth() + 1,
      0
    );

    console.log('AutoScheduler initialized with:', {
      monthStart: this.monthStart.toISOString(),
      monthEnd: this.monthEnd.toISOString()
    });

    // Constants for scheduling logic
    this.MAX_WEEKLY_HOURS = 40;
    this.EMPLOYEES_PER_SHIFT = 2;
    this.SHIFT_HOURS = 4;
    this.MANAGER_HOURS = 8;

    this.calendar = this.initializeCalendar();
  }

  initializeCalendar() {
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        return google.calendar({
          version: 'v3',
          auth: new google.auth.GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
            },
            scopes: ['https://www.googleapis.com/auth/calendar']
          })
        });
      } catch (error) {
        console.log('Google Calendar initialization skipped:', error.message);
        return null;
      }
    }
    return null;
  }

  async createShift(date, shiftType, employee, managerId) {
    const shift = {
      date: date.toISOString().split('T')[0],
      shift_type: shiftType,
      employee_id: employee.id,
      manager_id: managerId,
      status: 'scheduled'
    };

    if (this.calendar) {
      try {
        const event = {
          summary: `${employee.first_name} ${employee.last_name} - ${shiftType} Shift`,
          description: `Employee ID: ${employee.id}`,
          start: {
            dateTime: `${shift.date}T${shiftType === 'morning' ? '09:00:00' : '13:00:00'}`,
            timeZone: 'America/Edmonton',
          },
          end: {
            dateTime: `${shift.date}T${shiftType === 'morning' ? '13:00:00' : '17:00:00'}`,
            timeZone: 'America/Edmonton',
          },
          attendees: [{ email: employee.email }],
          status: 'confirmed',
        };

        await this.calendar.events.insert({
          calendarId: 'primary',
          resource: event,
          sendNotifications: true,
        });
      } catch (error) {
        console.log('Calendar event creation skipped:', error.message);
      }
    }

    return shift;
  }

  async hasCapacity(date, employeeId, schedule) {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weeklyHours = schedule
      .filter(shift =>
        shift.employee_id === employeeId &&
        new Date(shift.date) >= weekStart &&
        new Date(shift.date) <= weekEnd
      )
      .length * this.SHIFT_HOURS;

    return (weeklyHours + this.SHIFT_HOURS) <= this.MAX_WEEKLY_HOURS;
  }

  async generateSchedule() {
    try {
      // Clear existing schedule for the month
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .gte('date', this.monthStart.toISOString())
        .lte('date', this.monthEnd.toISOString());

      if (deleteError) throw deleteError;

      // Get managers
      const { data: managers, error: managersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('role', 'manager');

      if (managersError) throw managersError;
      if (!managers.length) {
        throw new Error('No manager found in the system');
      }

      // Get employees with availability
      const { data: employees, error: employeesError } = await supabase
        .from('users')
        .select(`
          id,
          first_name,
          last_name,
          email,
          role,
          availability (
            monday_morning,
            monday_afternoon,
            tuesday_morning,
            tuesday_afternoon,
            wednesday_morning,
            wednesday_afternoon,
            thursday_morning,
            thursday_afternoon,
            friday_morning,
            friday_afternoon
          )
        `)
        .eq('role', 'employee');

      if (employeesError) throw employeesError;
      if (!employees.length) {
        throw new Error('No employees found to generate schedule');
      }

      const employeesWithAvailability = employees.map(emp => ({
        ...emp,
        ...emp.availability?.[0]
      }));

      const schedule = [];
      let currentDate = new Date(this.monthStart);
      const employeeHours = {};
      let managerIndex = 0;

      employeesWithAvailability.forEach(emp => {
        employeeHours[emp.id] = 0;
      });

      while (currentDate <= this.monthEnd) {
        const dayName = this.getDayName(currentDate.getDay()).toLowerCase();

        if (dayName !== 'saturday' && dayName !== 'sunday') {
          const selectedManager = managers[managerIndex];
          const managerShift = await this.createManagerShift(
            currentDate,
            selectedManager,
            selectedManager.id
          );
          schedule.push(managerShift);

          managerIndex = (managerIndex + 1) % managers.length;

          for (const shiftType of ['morning', 'afternoon']) {
            const availabilityKey = `${dayName}_${shiftType}`;
            let availableEmployees = employeesWithAvailability.filter(employee => {
              const isAvailable = employee[availabilityKey];
              const hasCapacity = this.hasCapacity(currentDate, employee.id, schedule);
              return isAvailable && hasCapacity;
            });

            for (let i = 0; i < this.EMPLOYEES_PER_SHIFT && availableEmployees.length > 0; i++) {
              const selectedEmployee = this.selectBestEmployee(
                availableEmployees,
                employeeHours,
                schedule
              );

              const shift = await this.createShift(
                currentDate,
                shiftType,
                selectedEmployee,
                selectedManager.id
              );

              schedule.push(shift);
              employeeHours[selectedEmployee.id] = (employeeHours[selectedEmployee.id] || 0) + this.SHIFT_HOURS;
              availableEmployees = availableEmployees.filter(emp => emp.id !== selectedEmployee.id);
            }
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Batch insert all shifts
      const { error: insertError } = await supabase
        .from('schedules')
        .insert(schedule);

      if (insertError) throw insertError;

      return {
        schedule,
        summary: this.generateScheduleSummary(schedule, employeeHours),
        employeeHours
      };
    } catch (error) {
      console.error('Schedule generation failed:', error);
      throw error;
    }
  }

  getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }

  generateScheduleSummary(schedule, employeeHours) {
    return {
      totalShifts: schedule.length,
      employeeWorkload: Object.entries(employeeHours).map(([empId, hours]) => ({
        employeeId: empId,
        hoursScheduled: hours,
        shiftsScheduled: schedule.filter(s => s.employee_id === empId).length
      })),
      daysScheduled: new Set(schedule.map(s => s.date)).size,
      unfilledShifts: schedule.filter(s => !s.employee_id).length,
      averageHoursPerEmployee: Object.values(employeeHours).reduce((a, b) => a + b, 0) /
                             Object.keys(employeeHours).length
    };
  }

  selectBestEmployee(availableEmployees, employeeHours, currentShifts) {
    return availableEmployees.sort((a, b) => {
      const hoursDiff = (employeeHours[a.id] || 0) - (employeeHours[b.id] || 0);
      const aConsecutiveDays = this.getConsecutiveDays(a.id, currentShifts);
      const bConsecutiveDays = this.getConsecutiveDays(b.id, currentShifts);

      if (Math.abs(hoursDiff) > this.SHIFT_HOURS) {
        return hoursDiff;
      }

      return aConsecutiveDays - bConsecutiveDays;
    })[0];
  }

  getConsecutiveDays(employeeId, shifts) {
    let consecutiveDays = 0;
    const today = new Date();

    for (let i = 1; i <= 5; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);

      const hasShift = shifts.some(shift =>
        shift.employee_id === employeeId &&
        new Date(shift.date).toDateString() === checkDate.toDateString()
      );

      if (hasShift) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  }

  async createManagerShift(date, manager, managerId) {
    const shift = {
      date: date.toISOString().split('T')[0],
      shift_type: 'manager',
      employee_id: manager.id,
      manager_id: managerId,
      status: 'scheduled'
    };

    if (this.calendar) {
      try {
        const event = {
          summary: `${manager.first_name} ${manager.last_name} - Manager Shift`,
          description: `Manager ID: ${manager.id}`,
          start: {
            dateTime: `${shift.date}T09:00:00`,
            timeZone: 'America/Edmonton',
          },
          end: {
            dateTime: `${shift.date}T17:00:00`,
            timeZone: 'America/Edmonton',
          },
          attendees: [{ email: manager.email }],
          status: 'confirmed',
        };

        await this.calendar.events.insert({
          calendarId: 'primary',
          resource: event,
          sendNotifications: true,
        });
      } catch (error) {
        console.log('Calendar event creation skipped:', error.message);
      }
    }

    return shift;
  }
}

module.exports = { AutoScheduler };
