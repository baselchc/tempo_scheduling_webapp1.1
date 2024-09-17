"use client";
import { useUser } from '@clerk/nextjs';

export default function SchedulePage() {
  const { user } = useUser();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Schedule for {user?.firstName || 'User'}</h1>
      <p className="text-xl">Here’s your upcoming schedule:</p>

      {/* Placeholder for schedule data */}
      <ul className="mt-4">
        <li className="mb-2">Monday: 9am - 5pm</li>
        <li className="mb-2">Tuesday: 10am - 6pm</li>
        <li className="mb-2">Wednesday: 9am - 5pm</li>
        <li className="mb-2">Thursday: 10am - 6pm</li>
        <li className="mb-2">Friday: 9am - 4pm</li>
      </ul>
    </div>
  );
}
