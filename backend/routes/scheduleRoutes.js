const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');  // PostgreSQL connection

// Route to create a new schedule
router.post('/create-schedule', async (req, res) => {
  const { manager_id, employee_id, week_period, shift_start, shift_end } = req.body;

  try {
    // Fetch employee details from the employee_list table
    const employeeQuery = 'SELECT email, first_name, last_name, phone, role FROM employee_list WHERE id = $1';
    const employeeResult = await pool.query(employeeQuery, [employee_id]);

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { email, first_name, last_name, phone, role } = employeeResult.rows[0];

    // Insert the new schedule into the schedules table with the fetched employee details
    const result = await pool.query(
      `INSERT INTO schedules (manager_id, employee_id, email, first_name, last_name, phone, role, week_period, shift_start, shift_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [manager_id, employee_id, email, first_name, last_name, phone, role, week_period, shift_start, shift_end]
    );

    res.json(result.rows[0]);  // Return the created schedule
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
