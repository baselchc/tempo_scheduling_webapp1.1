const express = require('express');
const router = express.Router();
const { supabase } = require('../database/supabaseClient'); // Import Supabase client

// Route to create a new schedule
router.post('/create-schedule', async (req, res) => {
  const { manager_id, employee_name, week_period, shift_start, shift_end } = req.body;

  try {
    // Insert the new schedule into Supabase
    const { data, error } = await supabase
      .from('schedules')
      .insert([
        {
          manager_id,
          employee_name,
          week_period,
          shift_start,
          shift_end
        }
      ])
      .single(); // Ensures a single object is returned

    if (error) {
      console.error('Error creating schedule in Supabase:', error);
      return res.status(500).json({ error: 'Failed to create schedule' });
    }

    res.json(data); // Return the created schedule
  } catch (error) {
    console.error('Unexpected error creating schedule:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

//chatgpt used