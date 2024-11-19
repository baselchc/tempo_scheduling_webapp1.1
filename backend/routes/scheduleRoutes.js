// backend/routes/scheduleRoutes.js

const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const { AutoScheduler } = require('../services/autoScheduler');

// Create a new schedule manually
router.post('/create-schedule', ClerkExpressWithAuth(), async (req, res) => {
  try {
    // Check if user is a manager
    const { rows: userRows } = await pool.query(
      'SELECT role FROM users WHERE clerk_user_id = $1',
      [req.auth.userId]
    );

    if (!userRows.length || userRows[0].role !== 'manager') {
      return res.status(403).json({ error: 'Only managers can create schedules' });
    }

    const { manager_id, employee_id, date, shift_type } = req.body;
    
    if (!manager_id || !employee_id || !date || !shift_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['morning', 'afternoon'].includes(shift_type)) {
      return res.status(400).json({ error: 'Invalid shift type' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Verify manager and employee exist
      const userCheck = await client.query(
        'SELECT id, role FROM users WHERE id IN ($1, $2)',
        [manager_id, employee_id]
      );

      if (userCheck.rows.length !== 2) {
        throw new Error('Invalid manager or employee ID');
      }

      // Check for schedule conflicts
      const conflictCheck = await client.query(
        `SELECT id FROM schedules 
         WHERE employee_id = $1 
         AND date = $2 
         AND shift_type = $3`,
        [employee_id, date, shift_type]
      );

      if (conflictCheck.rows.length > 0) {
        throw new Error('Schedule conflict exists');
      }

      // Create schedule
      const result = await client.query(
        `INSERT INTO schedules (manager_id, employee_id, date, shift_type, status)
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [manager_id, employee_id, date, shift_type, 'scheduled']
      );

      // Create notification for employee
      await client.query(
        `INSERT INTO notifications (user_id, message, type)
         VALUES ($1, $2, 'schedule_created')`,
        [employee_id, `New ${shift_type} shift scheduled for ${date}`]
      );

      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(error.message.includes('conflict') ? 409 : 500)
       .json({ error: error.message || 'Server Error' });
  }
});

// Auto-generate schedule
router.post('/generate-schedule', ClerkExpressWithAuth(), async (req, res) => {
  const { monthStart } = req.body;

  console.log('Schedule generation request:', {
    monthStart,
    parsedDate: new Date(monthStart)
  });

  try {
    // Check if user is a manager
    const { rows } = await pool.query(
      'SELECT role FROM users WHERE clerk_user_id = $1',
      [req.auth.userId]
    );

    if (!rows.length || rows[0].role !== 'manager') {
      return res.status(403).json({ error: 'Only managers can generate schedules' });
    }

    // Create scheduler instance
    const scheduler = new AutoScheduler(monthStart);
   
    // Add debug logging
    console.log('Starting schedule generation for month:', monthStart);
   
    // Generate schedule
    const result = await scheduler.generateSchedule();
   
    console.log('Schedule generated successfully:', {
      totalShifts: result.schedule.length,
      employeeCount: Object.keys(result.employeeHours || {}).length,
      firstShift: result.schedule[0],
      lastShift: result.schedule[result.schedule.length - 1]
    });
   
    res.json({
      message: 'Schedule generated successfully',
      schedule: result.schedule,
      summary: result.summary,
      employeeHours: result.employeeHours
    });
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({
      error: 'Failed to generate schedule',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get employee schedule
router.get('/employee-schedule/:employeeId', ClerkExpressWithAuth(), async (req, res) => {
  try {
    // First, get the user's database ID
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [req.params.employeeId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employeeDbId = userCheck.rows[0].id;

    const result = await pool.query(
      `SELECT s.id, s.date, s.shift_type, s.status,
              u.first_name as manager_first_name,
              u.last_name as manager_last_name
       FROM schedules s
       JOIN users u ON s.manager_id = u.id
       WHERE s.employee_id = $1
       ORDER BY s.date DESC, s.shift_type`,
      [employeeDbId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Update schedule status
router.put('/update-status/:scheduleId', ClerkExpressWithAuth(), async (req, res) => {
  const { status } = req.body;
  const scheduleId = req.params.scheduleId;

  if (!['scheduled', 'confirmed', 'dropped', 'extra'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get schedule and employee info
    const scheduleCheck = await client.query(
      `SELECT s.*, u.first_name, u.last_name, u.clerk_user_id
       FROM schedules s
       JOIN users u ON s.employee_id = u.id
       WHERE s.id = $1`,
      [scheduleId]
    );

    if (scheduleCheck.rows.length === 0) {
      throw new Error('Schedule not found');
    }

    // Check if the user is authorized to update this schedule
    const schedule = scheduleCheck.rows[0];
    if (schedule.clerk_user_id !== req.auth.userId) {
      const { rows: userRows } = await client.query(
        'SELECT role FROM users WHERE clerk_user_id = $1',
        [req.auth.userId]
      );

      if (!userRows.length || userRows[0].role !== 'manager') {
        throw new Error('Unauthorized to update this schedule');
      }
    }

    // Update schedule status
    const result = await client.query(
      `UPDATE schedules 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, scheduleId]
    );

    // Create notification
    await client.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES ($1, $2, 'schedule_status_change')`,
      [
        schedule.manager_id,
        `${schedule.first_name} ${schedule.last_name} has ${status} their ${schedule.shift_type} shift on ${schedule.date}`
      ]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating schedule status:', error);
    res.status(
      error.message.includes('not found') ? 404 :
      error.message.includes('Unauthorized') ? 403 : 500
    ).json({ error: error.message || 'Server Error' });
  } finally {
    client.release();
  }
});

// Get weekly schedule
router.get('/weekly-schedule/:employeeId', ClerkExpressWithAuth(), async (req, res) => {
  const { week_start } = req.query;
  const employeeId = req.params.employeeId;

  if (!week_start) {
    return res.status(400).json({ error: 'Week start date is required' });
  }

  try {
    // Get user's database ID
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [employeeId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employeeDbId = userCheck.rows[0].id;

    const result = await pool.query(
      `SELECT s.id, s.date, s.shift_type, s.status,
              u.first_name as manager_first_name,
              u.last_name as manager_last_name
       FROM schedules s
       JOIN users u ON s.manager_id = u.id
       WHERE s.employee_id = $1
       AND s.date >= $2
       AND s.date < $2::date + INTERVAL '7 days'
       ORDER BY s.date, s.shift_type`,
      [employeeDbId, week_start]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

router.get('/monthly-schedule', ClerkExpressWithAuth(), async (req, res) => {
  const { month } = req.query;
  
  try {
    const date = new Date(month);
    // Get first day of the month at 00:00:00
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    firstDay.setHours(0, 0, 0, 0);
    
    // Get last day of the month at 23:59:59
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    lastDay.setHours(23, 59, 59, 999);

    console.log('Monthly schedule query params:', {
      month,
      firstDay: firstDay.toISOString(),
      lastDay: lastDay.toISOString(),
      year: date.getFullYear()
    });

    const result = await pool.query(
      `SELECT s.*, 
              u.first_name, 
              u.last_name, 
              u.email,
              u.id as employee_id
       FROM schedules s
       JOIN users u ON s.employee_id = u.id
       WHERE s.date >= $1 AND s.date <= $2
       ORDER BY s.date, s.shift_type`,
      [firstDay.toISOString(), lastDay.toISOString()]
    );

    // Transform dates to be timezone-consistent
    const schedules = result.rows.map(schedule => ({
      ...schedule,
      date: new Date(schedule.date).toISOString().split('T')[0]
    }));

    res.json(schedules);
  } catch (error) {
    console.error('Error in monthly schedule:', error);
    res.status(500).json({ 
      error: 'Server Error',
      details: error.message
    });
  }
});
module.exports = router;

// Used claude ai to assist in making code "Give me basic steps for creating an express.js router for managing employee schedules"