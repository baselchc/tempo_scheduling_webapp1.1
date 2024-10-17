import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request) {
  try {
    const { shiftId, action, reason, userId } = await request.json();

    if (action === 'take') {
      // Move the shift from public.schedules to schedules (assign it to the user)
      const shiftRes = await pool.query(
        `DELETE FROM public.schedules 
         WHERE id = $1 
         RETURNING id, shift_start, shift_end, created_at`,
        [shiftId]
      );
      const shift = shiftRes.rows[0];

      // Insert the shift into schedules table with the user's info
      const res = await pool.query(
        `INSERT INTO schedules (user_id, shift_start, shift_end, created_at, reason) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [userId, shift.shift_start, shift.shift_end, shift.created_at, reason]
      );
      return NextResponse.json(res.rows[0]);
    } else if (action === 'drop') {
      // Get the shift from the schedules table
      const shiftRes = await pool.query(
        `SELECT * FROM schedules WHERE id = $1`,
        [shiftId]
      );
      const shift = shiftRes.rows[0];

      // Move the shift back to public.schedules
      await pool.query(
        `INSERT INTO public.schedules (shift_start, shift_end, created_at, reason) 
         VALUES ($1, $2, $3, $4)`,
        [shift.shift_start, shift.shift_end, shift.created_at, reason]
      );

      // Delete the shift from schedules
      await pool.query(
        `DELETE FROM schedules 
         WHERE id = $1`,
        [shiftId]
      );

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err) {
    console.error('Error updating shift:', err);
    return NextResponse.json({ error: 'Error updating shift' }, { status: 500 });
  }
}
{/*Code enhanced by AI (ChatGPT 4o) Prompts were: Create a consistent look of the page with the login page, 
  add the blurred background and adjust they layout to match the same feel of the login page, this page should handle the open shifts
  tab and allow a view of Available Shifts and Open Shifts.*/}