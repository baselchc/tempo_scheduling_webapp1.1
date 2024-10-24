const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');  // PostgreSQL connection

// Route to create a new schedule
router.post('/create-schedule', async (req, res) => {
  const { manager_id, employee_name, week_period, shift_start, shift_end } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO schedules (manager_id, employee_name, week_period, shift_start, shift_end)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [manager_id, employee_name, week_period, shift_start, shift_end]
    );
    res.json(result.rows[0]);  // Return the created schedule
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
//chatgpt used