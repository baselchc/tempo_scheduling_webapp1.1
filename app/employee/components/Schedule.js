export default function Schedule() {
    // Example schedule for 7 days
    const weekSchedule = [
      { day: 'Mon', time: '1 PM - 9 PM' },
      { day: 'Tue', time: '9 AM - 5 PM' },
      { day: 'Wed', time: '1 PM - 9 PM' },
      { day: 'Thu', time: '9 AM - 5 PM' },
      { day: 'Fri', time: '1 PM - 9 PM' },
      { day: 'Sat', time: 'Off' },
      { day: 'Sun', time: '9 AM - 5 PM' },
    ];
  
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Schedule</h2>
  
        {/* Grid to display the schedule */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          {weekSchedule.map((shift, index) => (
            <div key={index} className="bg-blue-100 p-4 rounded-lg text-center">
              <div className="text-lg font-bold">{shift.day}</div>
              <div className="text-md">{shift.time}</div>
            </div>
          ))}
        </div>
  
        <h3 className="text-lg font-semibold mt-6">Open Shifts</h3>
        <div className="mt-2 bg-blue-50 p-4 rounded-lg text-center text-gray-500">
          No open shifts available.
        </div>
      </div>
    );
  }
  