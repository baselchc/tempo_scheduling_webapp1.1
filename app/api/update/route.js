import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request) {
  try {
    const { shiftId, action, reason, userId } = await request.json();

    if (!shiftId || !action || !userId) {
      return NextResponse.json({ error: 'shiftId, action, and userId are required' }, { status: 400 });
    }

    if (action === 'take') {
      // Move the shift from available_shifts to my_shifts
      const shiftRes = await pool.query(
        'DELETE FROM available_shifts WHERE id = $1 RETURNING id, shift_start, shift_end, created_at, manager_id',
        [shiftId]
      );

      if (shiftRes.rowCount === 0) {
        return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
      }

      const shift = shiftRes.rows[0];

      // Insert the shift into my_shifts for the Clerk user ID along with manager_id
      const insertRes = await pool.query(
        'INSERT INTO my_shifts (user_id, shift_start, shift_end, created_at, manager_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, shift.shift_start, shift.shift_end, shift.created_at, shift.manager_id]
      );

      return NextResponse.json(insertRes.rows[0]);

    } else if (action === 'drop') {
      // Select the shift that the user is trying to drop from my_shifts
      const shiftRes = await pool.query('SELECT * FROM my_shifts WHERE id = $1 AND user_id = $2', [shiftId, userId]);

      if (shiftRes.rowCount === 0) {
        return NextResponse.json({ error: 'Shift not found for this user' }, { status: 404 });
      }

      const shift = shiftRes.rows[0];

      // Move the shift back to available_shifts with manager_id
      await pool.query(
        'INSERT INTO available_shifts (manager_id, shift_start, shift_end, created_at, reason) VALUES ($1, $2, $3, $4, $5)',
        [shift.manager_id, shift.shift_start, shift.shift_end, shift.created_at, reason || null]
      );

      // Remove the shift from my_shifts
      await pool.query('DELETE FROM my_shifts WHERE id = $1 AND user_id = $2', [shiftId, userId]);

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (err) {
    console.error('Error updating shift:', err.message);
    return NextResponse.json({ error: `Error updating shift: ${err.message}` }, { status: 500 });
  }
}





{/*Code enhanced by AI (ChatGPT 4o) Prompts were: Create a consistent look of the page with the login page, 
  add the blurred background and adjust they layout to match the same feel of the login page, this page should handle the open shifts
  tab and allow a view of Available Shifts and Open Shifts.*/}