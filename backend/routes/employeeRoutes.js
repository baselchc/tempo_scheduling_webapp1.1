// routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../database/db'); // Database connection

// Route to add a new employee to the employee_list table
router.post('/add-employee', async (req, res) => {
    const { first_name, last_name, email, phone, role } = req.body;

    if (!first_name || !last_name || !email || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await db.query(
            'INSERT INTO employee_list (first_name, last_name, email, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [first_name, last_name, email, phone, role]
        );
        res.status(200).json({ message: 'Employee added successfully', employee: result.rows[0] });
    } catch (error) {
        console.error('Error adding employee:', error);
        res.status(500).json({ error: 'Failed to add employee' });
    }
});

// Route to fetch all employees from the employee_list table
router.get('/get-employees', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM employee_list ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

module.exports = router;
