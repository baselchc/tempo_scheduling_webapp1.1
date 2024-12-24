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

    // Get year and month from input
    const year = this.monthStart.getFullYear();
    const month = this.monthStart.getMonth();

    // Set to first day of month at midnight UTC
    this.monthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

    // Set to last day of month at end of day UTC
    // Using the same year and month + 1, day 0 gives us the last day of the current month
    this.monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    console.log('AutoScheduler initialized with:', {
      monthStart: this.monthStart.toISOString(),
      monthEnd: this.monthEnd.toISOString(),
      year: this.monthStart.getUTCFullYear(),
      month: this.monthStart.getUTCMonth() + 1,
      lastDayOfMonth: this.monthEnd.getUTCDate()
    });

    this.EMPLOYEES_PER_SHIFT = 2;
    this.MANAGERS_PER_DAY = 1;
    this.MAX_WEEKLY_HOURS = 40;
    this.SHIFT_HOURS = 4;
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

  getWeek(date) {
    const newDate = new Date(date.getTime());
    newDate.setUTCHours(0, 0, 0, 0);
    newDate.setUTCDate(newDate.getUTCDate() + 4 - (newDate.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(newDate.getUTCFullYear(), 0, 1));
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

  selectEmployeesForShift(availableEmployees, count) {
    const sortedEmployees = [...availableEmployees].sort((a, b) => 
      (a.assignedShifts || 0) - (b.assignedShifts || 0)
    );
    return sortedEmployees.slice(0, count);
  }

  async deleteExistingSchedules() {
    const startDate = this.monthStart.toISOString().split('T')[0];
    const endDate = this.monthEnd.toISOString().split('T')[0];

    console.log('Attempting to delete schedules for month:', {
      startDate,
      endDate,
      year: this.monthStart.getUTCFullYear(),
      month: this.monthStart.getUTCMonth() + 1
    });

    try {
      const { data: existingSchedules, error: fetchError } = await supabase
        .from('schedules')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (fetchError) {
        console.error('Error fetching existing schedules:', fetchError);
        throw fetchError;
      }

      console.log(`Found ${existingSchedules?.length || 0} existing schedules for ${this.monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })}`);

      if (existingSchedules && existingSchedules.length > 0) {
        const { error: deleteError } = await supabase
          .from('schedules')
          .delete()
          .gte('date', startDate)
          .lte('date', endDate);

        if (deleteError) {
          console.error('Error during delete operation:', deleteError);
          throw deleteError;
        }

        console.log(`Successfully deleted ${existingSchedules.length} schedules`);
      } else {
        console.log('No existing schedules found for the specified month');
      }

      return true;
    } catch (error) {
      console.error('Failed to delete existing schedules:', error);
      throw error;
    }
  }

  async generateSchedule() {
    console.time('Schedule Generation');
    try {
      console.log(`Generating schedule for ${this.monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
      
      await this.deleteExistingSchedules();

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
      const employees = employeesResult.data.map(employee => ({
        ...employee,
        availability: employee.availability.reduce((acc, day) => ({ ...acc, ...day }), {}),
        assignedShifts: 0
      }));

      console.timeEnd('Fetch Managers and Employees');

      if (!managers?.length) throw new Error('No managers found in the system');
      if (!employees?.length) throw new Error('No employees found in the system');

      const schedule = [];
      let currentDate = new Date(this.monthStart);
      let managerIndex = 0;

      while (currentDate <= this.monthEnd) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayName = this.getDayName(currentDate.getUTCDay()).toLowerCase();

        if (dayName !== 'saturday' && dayName !== 'sunday') {
          // Assign manager
          const manager = managers[managerIndex % managers.length];
          schedule.push({
            date: dateStr,
            shift_type: 'manager',
            employee_id: manager.id
          });

          // Morning shift
          const morningKey = `${dayName}_morning`;
          const availableMorningEmployees = employees.filter(employee => {
            const isAvailable = employee.availability[morningKey];
            const hasCapacity = this.hasCapacity(currentDate, employee.id, schedule);
            return isAvailable && hasCapacity;
          });

          const morningEmployees = this.selectEmployeesForShift(
            availableMorningEmployees, 
            this.EMPLOYEES_PER_SHIFT
          );

          morningEmployees.forEach(employee => {
            schedule.push({
              date: dateStr,
              shift_type: 'morning',
              employee_id: employee.id
            });
            employee.assignedShifts++;
          });

          // Afternoon shift
          const afternoonKey = `${dayName}_afternoon`;
          const availableAfternoonEmployees = employees.filter(employee => {
            const isAvailable = employee.availability[afternoonKey];
            const hasCapacity = this.hasCapacity(currentDate, employee.id, schedule);
            return isAvailable && hasCapacity;
          });

          const afternoonEmployees = this.selectEmployeesForShift(
            availableAfternoonEmployees,
            this.EMPLOYEES_PER_SHIFT
          );

          afternoonEmployees.forEach(employee => {
            schedule.push({
              date: dateStr,
              shift_type: 'afternoon',
              employee_id: employee.id
            });
            employee.assignedShifts++;
          });

          managerIndex++;
        }

        // Increment the date properly using UTC
        currentDate = new Date(Date.UTC(
          currentDate.getUTCFullYear(),
          currentDate.getUTCMonth(),
          currentDate.getUTCDate() + 1
        ));
      }

      if (schedule.length > 0) {
        console.log(`Inserting ${schedule.length} schedules for ${this.monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
        const { error: insertError } = await supabase
          .from('schedules')
          .insert(schedule);
          
        if (insertError) {
          console.error('Error inserting shifts into the database:', insertError);
          throw insertError;
        }
      }

      console.timeEnd('Schedule Generation');
      return schedule;
    } catch (error) {
      console.error('Error during schedule generation:', error.message);
      throw error;
    }
  }
}

module.exports = { AutoScheduler };