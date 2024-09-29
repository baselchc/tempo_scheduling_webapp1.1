// lib/googleCalendar.js
import { google } from 'googleapis';

const calendar = google.calendar('v3');

export const getAuth = () => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_API_KEY } = process.env;

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/auth/callback'
  );

  // Set the API key
  oauth2Client.setCredentials({ api_key: GOOGLE_API_KEY });

  return oauth2Client;
};

export const listEvents = async () => {
  const auth = getAuth();
  const response = await calendar.events.list({
    auth,
    calendarId: 'primary', // Use 'primary' to get the primary calendar
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return response.data.items;
};
