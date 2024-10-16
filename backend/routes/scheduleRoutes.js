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
{/*Can you write an Express route that allows me to create a new schedule and store it in a PostgreSQL database? The schedule should include details like manager_id, employee_name, week_period, shift_start, and shift_end. The route should take these fields from the request body, insert them into the schedules table using a parameterized query, and return the newly created schedule.*/}
