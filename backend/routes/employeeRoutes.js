const express = require('express');
const router = express.Router();
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const { supabase } = require('../../backend/database/supabaseClient'); // Import your Supabase client

// Get all employees and managers
router.get('/get-employees', ClerkExpressWithAuth(), async (req, res) => {
  try {
    // Check if user is a manager
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_user_id', req.auth.userId)
      .single();

    if (userError || !userData || userData.role !== 'manager') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get all employees and managers
    const { data: employees, error: employeesError } = await supabase
      .from('users')
      .select('id, clerk_user_id, first_name, last_name, email, role, phone, created_at')
      .in('role', ['employee', 'manager'])
      .order('role', { ascending: false })
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (employeesError) throw employeesError;

    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ 
      error: 'Failed to fetch employees',
      details: error.message 
    });
  }
});

// Add new employee
router.post('/add-employee', ClerkExpressWithAuth(), async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;

  try {
    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user is a manager
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_user_id', req.auth.userId)
      .single();

    if (userError || !userData || userData.role !== 'manager') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Insert new employee
    const { data: newEmployee, error: insertError } = await supabase
      .from('users')
      .insert({
        clerk_user_id: `temp_${Date.now()}`,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        role: 'employee',
        is_whitelisted: true
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Create welcome notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        to_user_id: newEmployee.id,
        message: `Welcome ${firstName} ${lastName} to the team!`,
        type: 'welcome',
        broadcast: true
      });

    if (notificationError) {
      console.error('Error creating welcome notification:', notificationError);
    }

    res.json(newEmployee);
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ 
      error: 'Failed to add employee',
      details: error.message 
    });
  }
});

// Update employee
router.put('/update-employee/:id', ClerkExpressWithAuth(), async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone, role } = req.body;

  try {
    // Check if user is a manager
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_user_id', req.auth.userId)
      .single();

    if (userError || !userData || userData.role !== 'manager') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Validate role
    if (role && !['employee', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if email already exists for a different user
    if (email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Update employee
    const { data: updatedEmployee, error: updateError } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    if (!updatedEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(
      error.message.includes('not found') ? 404 :
      error.message.includes('Unauthorized') ? 403 : 500
    ).json({ 
      error: 'Failed to update employee',
      details: error.message 
    });
  }
});

module.exports = router;
