// backend/routes/employeeRoutes.js

// TODO: Add role validation for all routes

const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');

// Get all employees and managers
router.get('/get-employees', ClerkExpressWithAuth(), async (req, res) => {
  const client = await pool.connect();
  try {
    // Get requesting user's role
    const { rows: userRows } = await client.query(
      'SELECT role FROM users WHERE clerk_user_id = $1',
      [req.auth.userId]
    );

    if (!userRows.length || userRows[0].role !== 'manager') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { rows } = await client.query(`
      SELECT id, clerk_user_id, first_name, last_name, email, role, phone, created_at
      FROM users
      WHERE role IN ('employee', 'manager')
      ORDER BY role DESC, last_name, first_name
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  } finally {
    client.release();
  }
});

// Add new employee
router.post('/add-employee', ClerkExpressWithAuth(), async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if requesting user is a manager
    const { rows: userRows } = await client.query(
      'SELECT role FROM users WHERE clerk_user_id = $1',
      [req.auth.userId]
    );

    if (!userRows.length || userRows[0].role !== 'manager') {
      throw new Error('Unauthorized');
    }

    // Check if email already exists
    const { rows: existingUser } = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.length > 0) {
      throw new Error('Email already exists');
    }

    const result = await client.query(
      `INSERT INTO users (
        clerk_user_id,
        first_name,
        last_name,
        email,
        phone,
        role,
        is_whitelisted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, first_name, last_name, email, role`,
      [
        `temp_${Date.now()}`, // Temporary clerk_user_id
        firstName,
        lastName,
        email,
        phone,
        'employee',
        true // Auto-whitelist employees added by managers
      ]
    );

    // Create notification for new employee
    await client.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES ($1, $2, 'welcome')`,
      [result.rows[0].id, `Welcome ${firstName} ${lastName} to the team!`]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding employee:', error);
    res.status(error.message === 'Unauthorized' ? 403 : 500)
       .json({ error: error.message || 'Failed to add employee' });
  } finally {
    client.release();
  }
});

// Update employee
router.put('/update-employee/:id', ClerkExpressWithAuth(), async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone, role } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if requesting user is a manager
    const { rows: userRows } = await client.query(
      'SELECT role FROM users WHERE clerk_user_id = $1',
      [req.auth.userId]
    );

    if (!userRows.length || userRows[0].role !== 'manager') {
      throw new Error('Unauthorized');
    }

    const result = await client.query(
      `UPDATE users 
       SET first_name = $1,
           last_name = $2,
           email = $3,
           phone = $4,
           role = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, first_name, last_name, email, role`,
      [firstName, lastName, email, phone, role, id]
    );

    if (result.rows.length === 0) {
      throw new Error('Employee not found');
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating employee:', error);
    res.status(error.message === 'Unauthorized' ? 403 :
               error.message === 'Employee not found' ? 404 : 500)
       .json({ error: error.message || 'Failed to update employee' });
  } finally {
    client.release();
  }
});

module.exports = router;