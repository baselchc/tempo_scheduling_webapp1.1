// backend/services/autoScheduler.js

const { google } = require('googleapis');
const { pool } = require('../database/db');

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
    
    // Ensure we're at the start of the month
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

  selectBestEmployee(availableEmployees, employeeHours, currentShifts) {
    return availableEmployees.sort((a, b) => {
      // Primary sort by hours worked (less hours = higher priority)
      const hoursDiff = (employeeHours[a.id] || 0) - (employeeHours[b.id] || 0);
      
      // Secondary sort by consecutive days (fewer consecutive days = higher priority)
      const aConsecutiveDays = this.getConsecutiveDays(a.id, currentShifts);
      const bConsecutiveDays = this.getConsecutiveDays(b.id, currentShifts);
      
      // If hours difference is significant (more than one shift), prioritize by hours
      if (Math.abs(hoursDiff) > this.SHIFT_HOURS) {
        return hoursDiff;
      }
      
      // Otherwise, consider consecutive days
      return aConsecutiveDays - bConsecutiveDays;
    })[0];
  }

  getConsecutiveDays(employeeId, shifts) {
    let consecutiveDays = 0;
    const today = new Date();
    
    // Look at the last 5 days
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
      shift_type: 'manager',  // New shift type for managers
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

  async generateSchedule() {
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
  
      // Clear existing schedule for the month
      await client.query(
        'DELETE FROM schedules WHERE date >= $1 AND date <= $2',
        [this.monthStart.toISOString(), this.monthEnd.toISOString()]
      );
  
      // Get managers
      const { rows: managers } = await client.query(
        'SELECT id, first_name, last_name, email FROM users WHERE role = $1',
        ['manager']
      );
  
      if (managers.length === 0) {
        throw new Error('No manager found in the system');
      }
  
      // Get employees with availability using fixed date comparison
      const { rows: employeesWithAvailability } = await client.query(`
        SELECT 
          u.id, 
          u.first_name, 
          u.last_name, 
          u.email,
          u.role,
          COALESCE(a.monday_morning, false) as monday_morning, 
          COALESCE(a.monday_afternoon, false) as monday_afternoon,
          COALESCE(a.tuesday_morning, false) as tuesday_morning, 
          COALESCE(a.tuesday_afternoon, false) as tuesday_afternoon,
          COALESCE(a.wednesday_morning, false) as wednesday_morning, 
          COALESCE(a.wednesday_afternoon, false) as wednesday_afternoon,
          COALESCE(a.thursday_morning, false) as thursday_morning, 
          COALESCE(a.thursday_afternoon, false) as thursday_afternoon,
          COALESCE(a.friday_morning, false) as friday_morning, 
          COALESCE(a.friday_afternoon, false) as friday_afternoon
        FROM users u
        LEFT JOIN LATERAL (
          SELECT * FROM availability 
          WHERE user_id = u.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) a ON true
        WHERE u.role = 'employee'
      `);
  
      if (employeesWithAvailability.length === 0) {
        throw new Error('No employees found to generate schedule');
      }
  
      const schedule = [];
      let currentDate = new Date(this.monthStart);
      const employeeHours = {};
      let managerIndex = 0;

      // Initialize employee hours
      employeesWithAvailability.forEach(emp => {
        employeeHours[emp.id] = 0;
      });
  
      console.log('Found employees with availability:', 
        employeesWithAvailability.map(emp => ({
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          role: emp.role,
          hasAvailability: Object.keys(emp)
            .filter(key => key.includes('morning') || key.includes('afternoon'))
            .some(key => emp[key])
        }))
      );
  
      while (currentDate <= this.monthEnd) {
        const dayName = this.getDayName(currentDate.getDay()).toLowerCase();
        
        // Skip weekends
        if (dayName !== 'saturday' && dayName !== 'sunday') {
          // First, schedule a manager for the day
          const selectedManager = managers[managerIndex];
          const managerShift = await this.createManagerShift(
            currentDate,
            selectedManager,
            selectedManager.id
          );
          schedule.push(managerShift);
          
          // Rotate to next manager
          managerIndex = (managerIndex + 1) % managers.length;

          // Then schedule regular employees
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
                selectedManager.id // Use the day's manager as manager_id
              );
  
              schedule.push(shift);
              employeeHours[selectedEmployee.id] = (employeeHours[selectedEmployee.id] || 0) + this.SHIFT_HOURS;
              availableEmployees = availableEmployees.filter(emp => emp.id !== selectedEmployee.id);
            }
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
  
      // Insert all shifts into database
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
        summary: this.generateScheduleSummary(schedule, employeeHours),
        employeeHours
      };
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      console.error('Schedule generation failed:', error);
      throw error;
    } finally {
      if (client) client.release();
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
        employeeId: parseInt(empId),
        hoursScheduled: hours,
        shiftsScheduled: schedule.filter(s => s.employee_id === parseInt(empId)).length
      })),
      daysScheduled: new Set(schedule.map(s => s.date)).size,
      unfilledShifts: schedule.filter(s => !s.employee_id).length,
      averageHoursPerEmployee: Object.values(employeeHours).reduce((a, b) => a + b, 0) / 
                             Object.keys(employeeHours).length
    };
  }
}

module.exports = { AutoScheduler };