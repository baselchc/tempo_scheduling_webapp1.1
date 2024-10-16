const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');

router.post('/create-schedule', async (req, res) => {
<<<<<<< HEAD
  const { employee_id, manager_id, week_period, shift_start, shift_end } = req.body;

  try {
    // Fetch employee details from the employee_list table
    const employeeQuery = 'SELECT email, role, first_name, last_name, phone FROM employee_list WHERE id = $1';
    const employeeResult = await pool.query(employeeQuery, [employee_id]);
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const { email, role, first_name, last_name, phone } = employeeResult.rows[0];
    // Insert the new schedule into the schedules table, including employee details
    const scheduleQuery = `
      INSERT INTO schedules 
      (employee_id, manager_id, email, role, first_name, last_name, phone, week_period, shift_start, shift_end)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const scheduleResult = await pool.query(scheduleQuery, [
      employee_id, manager_id, email, role, first_name, last_name, phone, week_period, shift_start, shift_end
    ]);
    res.json(scheduleResult.rows[0]);
=======
  const { manager_id, week_period, shift_start, shift_end } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO schedules (manager_id, week_period, shift_start, shift_end)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [manager_id, week_period, shift_start, shift_end]
    );
    res.json(result.rows[0]);
>>>>>>> parent of a6f751b (working input create schedule)
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

module.exports = router;