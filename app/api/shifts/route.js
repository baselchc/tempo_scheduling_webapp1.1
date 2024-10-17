import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    // Fetch available shifts from public.schedules
    const availableShiftsRes = await pool.query('SELECT * FROM public.schedules WHERE assigned_to IS NULL');
    const availableShifts = availableShiftsRes.rows;

    // Fetch my shifts from schedules
    const myShiftsRes = await pool.query('SELECT * FROM schedules WHERE assigned_to IS NOT NULL');
    const myShifts = myShiftsRes.rows;

    // Combine the data into an object
    return NextResponse.json({
      availableShifts,
      myShifts,
    });
  } catch (err) {
    console.error('Error fetching shifts:', err);
    return NextResponse.json({ error: 'Error fetching shifts' }, { status: 500 });
  }
}
{/*Code enhanced by AI (ChatGPT 4o) Prompts were: Create a consistent look of the page with the login page, 
  add the blurred background and adjust they layout to match the same feel of the login page, this page should handle the open shifts
  tab and allow a view of Available Shifts and Open Shifts.*/}