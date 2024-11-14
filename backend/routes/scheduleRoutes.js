const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');

// Create a new schedule
router.post('/create-schedule', ClerkExpressWithAuth(), async (req, res) => {
  const { manager_id, employee_id, date, shift_type } = req.body;
  
  // Validate required fields
  if (!manager_id || !employee_id || !date || !shift_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate shift type
  if (!['morning', 'afternoon'].includes(shift_type)) {
    return res.status(400).json({ error: 'Invalid shift type' });
  }

  try {
    // Start transaction
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
        `INSERT INTO schedules (manager_id, employee_id, date, shift_type)
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [manager_id, employee_id, date, shift_type]
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

// Get employee schedule
router.get('/employee-schedule/:employeeId', ClerkExpressWithAuth(), async (req, res) => {
  try {
    // Verify employee exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [req.params.employeeId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const result = await pool.query(
      `SELECT s.id, s.date, s.shift_type, s.status, 
              u.first_name as manager_first_name, 
              u.last_name as manager_last_name
       FROM schedules s
       JOIN users u ON s.manager_id = u.id
       WHERE s.employee_id = $1
       ORDER BY s.date DESC, s.shift_type`,
      [req.params.employeeId]
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

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current schedule info
      const scheduleCheck = await client.query(
        `SELECT s.*, u.first_name, u.last_name 
         FROM schedules s
         JOIN users u ON s.employee_id = u.id
         WHERE s.id = $1`,
        [scheduleId]
      );

      if (scheduleCheck.rows.length === 0) {
        throw new Error('Schedule not found');
      }

      // Update status
      const result = await client.query(
        `UPDATE schedules 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [status, scheduleId]
      );

      // Notify manager of status change
      const schedule = scheduleCheck.rows[0];
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
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating schedule status:', error);
    res.status(error.message.includes('not found') ? 404 : 500)
       .json({ error: error.message || 'Server Error' });
  }
});

// Get weekly schedule for employee
router.get('/weekly-schedule/:employeeId', ClerkExpressWithAuth(), async (req, res) => {
  const { week_start } = req.query;
  const employeeId = req.params.employeeId;

  if (!week_start) {
    return res.status(400).json({ error: 'Week start date is required' });
  }

  try {
    // Verify employee exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [employeeId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

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
      [employeeId, week_start]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;