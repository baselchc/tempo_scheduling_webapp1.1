import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const userId = searchParams.get('userId'); // This is the Clerk user ID

  console.log('Received type:', type);
  console.log('Received userId:', userId);

  try {
    if (type === 'available') {
      // Fetch available shifts where assigned_to is NULL
      const availableShiftsRes = await pool.query('SELECT * FROM available_shifts WHERE assigned_to IS NULL');
      console.log('Available shifts fetched:', availableShiftsRes.rows);
      return NextResponse.json(availableShiftsRes.rows);
    } else if (type === 'my') {
      if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
      }

      // Fetch shifts assigned to the current user (based on Clerk user ID)
      console.log(`Fetching my shifts for user: ${userId}`);
      const myShiftsRes = await pool.query('SELECT * FROM my_shifts WHERE user_id = $1', [userId]);
      console.log('My shifts fetched:', myShiftsRes.rows);
      return NextResponse.json(myShiftsRes.rows);
    } else {
      return NextResponse.json({ error: 'Invalid query type' }, { status: 400 });
    }
  } catch (err) {
    console.error('Error fetching shifts:', err);
    return NextResponse.json({ error: 'Error fetching shifts' }, { status: 500 });
  }
}




{/*Code enhanced by AI (ChatGPT 4o) Prompts were: Create a consistent look of the page with the login page, 
  add the blurred background and adjust they layout to match the same feel of the login page, this page should handle the open shifts
  tab and allow a view of Available Shifts and Open Shifts.*/}