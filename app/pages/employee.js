import { useEffect, useState } from 'react';

const EmployeePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events'); // Call the events API
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        setEvents(data); // Store the fetched events
      } catch (err) {
        setError(err.message); // Capture any error that occurs
      } finally {
        setLoading(false); // Set loading to false once done
      }
    };

    fetchEvents();
  }, []);

  if (loading) return <div>Loading events...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Employee Calendar Events</h1>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            {event.summary} - {new Date(event.start.dateTime || event.start.date).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EmployeePage;
