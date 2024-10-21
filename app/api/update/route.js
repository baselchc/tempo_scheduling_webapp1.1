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
        'DELETE FROM available_shifts WHERE id = $1 RETURNING id, shift_start, shift_end, created_at',
        [shiftId]
      );

      if (shiftRes.rowCount === 0) {
        return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
      }

      const shift = shiftRes.rows[0];

      // Insert the shift into my_shifts for the Clerk user ID
      const insertRes = await pool.query(
        'INSERT INTO my_shifts (user_id, shift_start, shift_end, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, shift.shift_start, shift.shift_end, shift.created_at]
      );

      return NextResponse.json(insertRes.rows[0]);

    } else if (action === 'drop') {
      // Move the shift from my_shifts back to available_shifts
      const shiftRes = await pool.query('SELECT * FROM my_shifts WHERE id = $1', [shiftId]);

      if (shiftRes.rowCount === 0) {
        return NextResponse.json({ error: 'Shift not found in my_shifts' }, { status: 404 });
      }

      const shift = shiftRes.rows[0];

      await pool.query(
        'INSERT INTO available_shifts (shift_start, shift_end, created_at, reason) VALUES ($1, $2, $3, $4)',
        [shift.shift_start, shift.shift_end, shift.created_at, reason || null]
      );

      await pool.query('DELETE FROM my_shifts WHERE id = $1', [shiftId]);

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (err) {
    console.error('Error updating shift:', err);
    return NextResponse.json({ error: `Error updating shift: ${err.message}` }, { status: 500 });
  }
}



{/*Code enhanced by AI (ChatGPT 4o) Prompts were: Create a consistent look of the page with the login page, 
  add the blurred background and adjust they layout to match the same feel of the login page, this page should handle the open shifts
  tab and allow a view of Available Shifts and Open Shifts.*/}