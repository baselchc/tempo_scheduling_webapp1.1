import { listEvents } from '../../lib/googleCalendar';

export default async function handler(req, res) {
  try {
    const events = await listEvents();
    res.status(200).json(events); // Send the events as a JSON response
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' }); // Handle errors
  }
}
