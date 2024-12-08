//backend/routes/scheduleRoutes.js

import { Router } from 'express';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import { supabase } from '../database/supabaseClient.js';
import autoScheduler from '../services/autoScheduler.js';


const router = Router();
const { AutoScheduler } = autoScheduler;

// Create a new schedule manually
router.post('/create-schedule', ClerkExpressWithAuth(), async (req, res) => {
  try {
    // Check if user is a manager
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_user_id', req.auth.userId)
      .single();

    if (userError || !userData || userData.role !== 'manager') {
      return res.status(403).json({ error: 'Only managers can create schedules' });
    }

    const { manager_id, employee_id, date, shift_type } = req.body;
    
    if (!manager_id || !employee_id || !date || !shift_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['morning', 'afternoon'].includes(shift_type)) {
      return res.status(400).json({ error: 'Invalid shift type' });
    }

    // Verify manager and employee exist
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, role')
      .in('id', [manager_id, employee_id]);

    if (usersError || users.length !== 2) {
      throw new Error('Invalid manager or employee ID');
    }

    // Check for schedule conflicts
    const { data: conflicts } = await supabase
      .from('schedules')
      .select('id')
      .eq('employee_id', employee_id)
      .eq('date', date)
      .eq('shift_type', shift_type);

    if (conflicts && conflicts.length > 0) {
      throw new Error('Schedule conflict exists');
    }

    // Create schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .insert({
        manager_id,
        employee_id,
        date,
        shift_type,
        status: 'scheduled'
      })
      .select()
      .single();

    if (scheduleError) throw scheduleError;

    // Create notification for employee
    await supabase
      .from('notifications')
      .insert({
        user_id: employee_id,
        message: `New ${shift_type} shift scheduled for ${date}`,
        type: 'schedule_created'
      });

    res.json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(error.message.includes('conflict') ? 409 : 500)
       .json({ error: error.message || 'Server Error' });
  }
});

// Get employee schedule
router.get('/employee-schedule/:employeeId', ClerkExpressWithAuth(), async (req, res) => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', req.params.employeeId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select(`
        id,
        date,
        shift_type,
        status,
        manager:manager_id (
          first_name,
          last_name
        )
      `)
      .eq('employee_id', user.id)
      .order('date', { ascending: false })
      .order('shift_type', { ascending: true });

    if (schedulesError) throw schedulesError;

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

router.post('/generate-schedule', ClerkExpressWithAuth(), async (req, res) => {
  try {
    const { monthStart } = req.body;

    // Check if user is a manager
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, id')
      .eq('clerk_user_id', req.auth.userId)
      .single();

    if (userError || !userData || userData.role !== 'manager') {
      return res.status(403).json({ error: 'Only managers can generate schedules' });
    }

    // Create AutoScheduler instance
    const scheduler = new AutoScheduler(monthStart);
    
    // Generate the schedule
    const result = await scheduler.generateSchedule();

    res.json(result);
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ 
      error: 'Failed to generate schedule',
      details: error.message 
    });
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
    // Get schedule and employee info
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select(`
        *,
        employee:employee_id (
          first_name,
          last_name,
          clerk_user_id
        )
      `)
      .eq('id', scheduleId)
      .single();

    if (scheduleError || !schedule) {
      throw new Error('Schedule not found');
    }

    // Check authorization
    if (schedule.employee.clerk_user_id !== req.auth.userId) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('clerk_user_id', req.auth.userId)
        .single();

      if (!userData || userData.role !== 'manager') {
        throw new Error('Unauthorized to update this schedule');
      }
    }

    // Update schedule status
    const { data: updatedSchedule, error: updateError } = await supabase
      .from('schedules')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', scheduleId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: schedule.manager_id,
        message: `${schedule.employee.first_name} ${schedule.employee.last_name} has ${status} their ${schedule.shift_type} shift on ${schedule.date}`,
        type: 'schedule_status_change'
      });

    res.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating schedule status:', error);
    res.status(
      error.message.includes('not found') ? 404 :
      error.message.includes('Unauthorized') ? 403 : 500
    ).json({ error: error.message || 'Server Error' });
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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', employeeId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const weekEnd = new Date(week_start);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select(`
        id,
        date,
        shift_type,
        status,
        manager:manager_id (
          first_name,
          last_name
        )
      `)
      .eq('employee_id', user.id)
      .gte('date', week_start)
      .lt('date', weekEnd.toISOString())
      .order('date')
      .order('shift_type');

    if (schedulesError) throw schedulesError;

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get monthly schedule
router.get('/monthly-schedule', ClerkExpressWithAuth(), async (req, res) => {
  const { month } = req.query;
  
  try {
    const date = new Date(month);
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const { data: schedules, error } = await supabase
      .from('schedules')
      .select(`
        *,
        employee:employee_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .gte('date', firstDay.toISOString())
      .lte('date', lastDay.toISOString())
      .order('date', { ascending: true });

    if (error) throw error;

    // Transform dates to be timezone-consistent
    const formattedSchedules = schedules.map(schedule => ({
      ...schedule,
      date: new Date(schedule.date).toISOString().split('T')[0]
    }));

    res.json(formattedSchedules);
  } catch (error) {
    console.error('Error in monthly schedule:', error);
    res.status(500).json({ 
      error: 'Server Error',
      details: error.message
    });
  }
});

export default router;