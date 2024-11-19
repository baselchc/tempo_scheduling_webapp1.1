const { google } = require('googleapis');
const { pool } = require('../database/db');

class AutoScheduler {
  constructor(monthStart) {
    this.monthStart = new Date(monthStart);
    this.monthEnd = new Date(this.monthStart.getFullYear(), this.monthStart.getMonth() + 1, 0);
    this.calendar = null;

    // Only try to set up calendar if credentials exist
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        this.calendar = google.calendar({
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
        this.calendar = null;
      }
    }
  }

  async createShift(date, shiftType, employee, managerId) {
    const shift = {
      date: date.toISOString().split('T')[0],
      shift_type: shiftType,
      employee_id: employee.id,
      manager_id: managerId,
      status: 'scheduled'
    };

    // Only try to create calendar event if calendar was initialized successfully
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
        // Log but don't throw the error
        console.log('Calendar event creation skipped:', error.message);
      }
    }

    return shift;
  }

  async generateSchedule() {
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
  
      // First clear existing schedules for the month
      await client.query(
        'DELETE FROM schedules WHERE date >= $1 AND date <= $2',
        [this.monthStart.toISOString(), this.monthEnd.toISOString()]
      );
  
      // Get the manager ID
      const { rows: managers } = await pool.query(
        'SELECT id FROM users WHERE role = $1 LIMIT 1',
        ['manager']
      );
  
      if (managers.length === 0) {
        throw new Error('No manager found in the system');
      }
  
      const managerId = managers[0].id;
  
      // Get all employees
      const { rows: employees } = await pool.query(
        'SELECT id, first_name, last_name FROM users WHERE role = $1',
        ['employee']
      );
  
      console.log('Found employees:', employees.length);
  
      if (employees.length === 0) {
        throw new Error('No employees found to generate schedule');
      }
  
      const schedule = [];
      let currentDate = new Date(this.monthStart);
  
      // Generate schedule
      while (currentDate <= this.monthEnd) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Skip weekends
          // Morning shift
          schedule.push({
            date: currentDate.toISOString().split('T')[0],
            shift_type: 'morning',
            employee_id: employees[Math.floor(Math.random() * employees.length)].id,
            manager_id: managerId,
            status: 'scheduled'
          });
  
          // Afternoon shift
          schedule.push({
            date: currentDate.toISOString().split('T')[0],
            shift_type: 'afternoon',
            employee_id: employees[Math.floor(Math.random() * employees.length)].id,
            manager_id: managerId,
            status: 'scheduled'
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
  
      // Insert the new schedules
      for (const shift of schedule) {
        await client.query(
          `INSERT INTO schedules (date, shift_type, employee_id, manager_id, status)
           VALUES ($1, $2, $3, $4, $5)`,
          [shift.date, shift.shift_type, shift.employee_id, shift.manager_id, shift.status]
        );
      }
  
      await client.query('COMMIT');
  
      return {
        schedule,
        summary: {
          totalShifts: schedule.length,
          startDate: this.monthStart,
          endDate: this.monthEnd,
        },
        employeeHours: employees.reduce((acc, emp) => {
          acc[emp.id] = schedule.filter(s => s.employee_id === emp.id).length * 4;
          return acc;
        }, {})
      };
  
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      console.error('Schedule generation failed:', error);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  // Other helper methods remain the same
  isEmployeeAvailable(employee, day, shift) {
    const availabilityKey = `${day}_${shift}`;
    return employee[availabilityKey] !== false;
  }

  hasCapacity(currentHours) {
    const MAX_WEEKLY_HOURS = 40;
    return currentHours < MAX_WEEKLY_HOURS;
  }

  selectBestEmployee(availableEmployees, employeeHours) {
    return availableEmployees.sort((a, b) => 
      employeeHours[a.id] - employeeHours[b.id]
    )[0];
  }

  getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }

  generateScheduleSummary(schedule, employeeHours) {
    return {
      totalShifts: schedule.length,
      employeeWorkload: Object.entries(employeeHours).map(([empId, hours]) => ({
        employeeId: parseInt(empId),
        hoursScheduled: hours,
        shiftsScheduled: schedule.filter(s => s.employee_id === parseInt(empId)).length
      })),
      daysScheduled: new Set(schedule.map(s => s.date)).size,
      unfilledShifts: schedule.filter(s => !s.employee_id).length
    };
  }
}

module.exports = { AutoScheduler };