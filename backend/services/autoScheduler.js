const { google } = require('googleapis');
const { supabase } = require('../database/supabaseClient');

class AutoScheduler {
  constructor(monthStart) {
    if (!(monthStart instanceof Date)) {
      this.monthStart = new Date(monthStart);
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
      monthEnd: this.monthEnd.toISOString(),
    });

    this.MAX_WEEKLY_HOURS = 40;
    this.EMPLOYEES_PER_SHIFT = 2;
    this.SHIFT_HOURS = 4;
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
              private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/calendar'],
          }),
        });
      } catch (error) {
        console.log('Google Calendar initialization failed:', error.message);
        return null;
      }
    }
    return null;
  }

  getDayName(dayIndex) {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[dayIndex];
  }

  // Utility to calculate ISO week of the year
  getWeek(date) {
    const newDate = new Date(date.getTime());
    newDate.setHours(0, 0, 0, 0);
    newDate.setDate(newDate.getDate() + 4 - (newDate.getDay() || 7));
    const yearStart = new Date(newDate.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((newDate - yearStart) / 86400000 + 1) / 7);
    return weekNumber;
  }

  hasCapacity(date, employeeId, schedule) {
    const currentWeek = this.getWeek(date);
    const weeklyHours = schedule.filter((shift) => {
      const shiftDate = new Date(shift.date);
      return (
        shift.employee_id === employeeId && this.getWeek(shiftDate) === currentWeek
      );
    }).length * this.SHIFT_HOURS;

    return weeklyHours + this.SHIFT_HOURS <= this.MAX_WEEKLY_HOURS;
  }

  async generateSchedule() {
    console.time('Schedule Generation');
    try {
      console.time('Clear Existing Schedule');
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .gte('date', this.monthStart.toISOString())
        .lte('date', this.monthEnd.toISOString());
      if (deleteError) throw deleteError;
      console.timeEnd('Clear Existing Schedule');

      console.time('Fetch Managers and Employees');
      const [managersResult, employeesResult] = await Promise.all([
        supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .eq('role', 'manager'),
        supabase
          .from('users')
          .select(`
            id,
            first_name,
            last_name,
            email,
            availability:availability(*)
          `)
          .eq('role', 'employee'),
      ]);

      const managers = managersResult.data;
      const employees = employeesResult.data.map((employee) => {
        const availability = employee.availability.reduce((acc, day) => {
          return { ...acc, ...day };
        }, {});
        return { ...employee, availability };
      });
      console.timeEnd('Fetch Managers and Employees');

      if (!managers || managers.length === 0) {
        console.error('No managers found in the system.');
        throw new Error('No managers found in the system');
      }

      if (!employees || employees.length === 0) {
        console.error('No employees found in the system.');
        console.error('Employees Query Result:', JSON.stringify(employeesResult, null, 2));
        throw new Error('No employees found in the system');
      }

      console.log('Fetched managers:', JSON.stringify(managers, null, 2));
      console.log('Fetched employees:', JSON.stringify(employees, null, 2));

      const schedule = [];
      const employeeHours = {};
      let currentDate = new Date(this.monthStart);

      while (currentDate <= this.monthEnd) {
        const dayName = this.getDayName(currentDate.getDay()).toLowerCase();

        if (dayName !== 'saturday' && dayName !== 'sunday') {
          for (const shiftType of ['morning', 'afternoon']) {
            const availabilityKey = `${dayName}_${shiftType}`;
            const availableEmployees = employees.filter((employee) => {
              if (!employee.availability || Object.keys(employee.availability).length === 0) {
                console.warn(
                  `Employee ${employee.first_name} ${employee.last_name} (ID: ${employee.id}) has no availability data.`
                );
                return false;
              }

              const isAvailable = employee.availability[availabilityKey];
              const hasCapacity = this.hasCapacity(
                currentDate,
                employee.id,
                schedule
              );

              if (!isAvailable) {
                console.warn(
                  `Employee ${employee.first_name} ${employee.last_name} (ID: ${employee.id}) is not available for ${availabilityKey}.`
                );
              }

              return isAvailable && hasCapacity;
            });

            if (availableEmployees.length === 0) {
              console.warn(
                `No employees available for ${shiftType} shift on ${currentDate.toISOString()}`
              );
              continue;
            }

            availableEmployees.forEach((employee) => {
              schedule.push({
                date: currentDate.toISOString().split('T')[0],
                shift_type: shiftType,
                employee_id: employee.id,
              });
              employeeHours[employee.id] =
                (employeeHours[employee.id] || 0) + this.SHIFT_HOURS;
            });
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.time('Insert Shifts');
      const { error: insertError } = await supabase
        .from('schedules')
        .insert(schedule);
      if (insertError) {
        console.error('Error inserting shifts into the database:', insertError);
        throw insertError;
      }
      console.timeEnd('Insert Shifts');

      console.timeEnd('Schedule Generation');
      return schedule;
    } catch (error) {
      console.error('Error during schedule generation:', error.message);
      throw error;
    }
  }
}

module.exports = { AutoScheduler };
