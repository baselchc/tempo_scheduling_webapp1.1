const db = require('../database/db');

class AutoScheduler {
  constructor(weekStart) {
    this.weekStart = weekStart;
    this.shifts = {
      morning: { start: '09:00', end: '13:00' },
      afternoon: { start: '13:00', end: '17:00' }
    };
  }

  async generateSchedule() {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Get all employees and their availability
      const employees = await this.getEmployeeAvailability(client);

      // 2. Get required shifts for each day
      const requiredShifts = await this.getRequiredShifts(client);

      // 3. Generate schedule
      const schedule = [];
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

      for (const day of days) {
        const daySchedule = await this.scheduleDayShifts(
          client,
          day,
          employees,
          requiredShifts[day]
        );
        schedule.push(...daySchedule);
      }

      // 4. Save schedule to database
      await this.saveSchedule(client, schedule);

      await client.query('COMMIT');
      return schedule;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getEmployeeAvailability(client) {
    const { rows } = await client.query(`
      SELECT 
        u.id, 
        u.first_name, 
        u.last_name,
        u.email,
        a.*
      FROM users u
      LEFT JOIN availability a ON u.id = a.user_id
      WHERE u.role = 'employee'
      AND a.week_start = $1
    `, [this.weekStart]);

    return rows;
  }

  async getRequiredShifts(client) {
    // This could be configured in a settings table
    return {
      monday: { morning: 2, afternoon: 2 },
      tuesday: { morning: 2, afternoon: 2 },
      wednesday: { morning: 2, afternoon: 2 },
      thursday: { morning: 2, afternoon: 2 },
      friday: { morning: 2, afternoon: 2 }
    };
  }

  async scheduleDayShifts(client, day, employees, required) {
    const schedule = [];
    const shifts = ['morning', 'afternoon'];

    for (const shift of shifts) {
      const availableEmployees = employees.filter(emp => 
        emp[`${day}_${shift}`] === true
      );

      // Sort by factors like:
      // - Number of hours already scheduled
      // - Employee preferences
      // - Skill level
      availableEmployees.sort((a, b) => 
        this.calculateEmployeeScore(a) - this.calculateEmployeeScore(b)
      );

      // Assign required number of employees
      for (let i = 0; i < required[shift] && i < availableEmployees.length; i++) {
        const employee = availableEmployees[i];
        schedule.push({
          employee_id: employee.id,
          date: this.getDateForDay(day),
          shift_type: shift,
          status: 'scheduled'
        });
      }
    }

    return schedule;
  }

  calculateEmployeeScore(employee) {
    // Implement scoring logic based on:
    // - Hours worked this week
    // - Employee preferences
    // - Employee skills
    // - Previous shift patterns
    return 0; // Placeholder
  }

  async saveSchedule(client, schedule) {
    for (const shift of schedule) {
      await client.query(`
        INSERT INTO schedules (
          employee_id, date, shift_type, status
        ) VALUES ($1, $2, $3, $4)
      `, [
        shift.employee_id,
        shift.date,
        shift.shift_type,
        shift.status
      ]);
    }
  }

  getDateForDay(day) {
    const dayOffset = {
      monday: 0,
      tuesday: 1,
      wednesday: 2,
      thursday: 3,
      friday: 4
    };

    const date = new Date(this.weekStart);
    date.setDate(date.getDate() + dayOffset[day]);
    return date;
  }
}

module.exports = AutoScheduler;