const { google } = require('googleapis');
const { useState } = require('react');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const calendar = google.calendar({
  version: 'v3',
  auth: new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    SCOPES
  )
});

async function createShift(employeeId, shiftData) {
  try {
    const event = {
      summary: `${shiftData.employeeName} - ${shiftData.shift_type} Shift`,
      description: `Employee ID: ${employeeId}`,
      start: {
        dateTime: shiftData.shift_type === 'morning' ? '09:00:00' : '13:00:00',
        timeZone: 'America/Edmonton', //Mountain Time Zone
      },
      end: {
        dateTime: shiftData.shift_type === 'morning' ? '13:00:00' : '17:00:00',
        timeZone: 'America/Edmonton', //Mountain Time Zone
      },
      attendees: [{ email: shiftData.employeeEmail }],
      status: 'confirmed',
    };

    const result = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendNotifications: true,
    });

    return result.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

module.exports = { createShift };

// Used claude ai to assist in making code, "whats a good way to make a function that creates google calendar events"