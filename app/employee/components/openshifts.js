"use client";
import { useUser } from '@clerk/nextjs';

export default function OpenShiftsPage() {
  const { user } = useUser();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Available Shifts for {user?.firstName || 'User'}</h1>
      <p className="text-xl">Here are the open shifts you can pick up:</p>

      {/* Placeholder for open shifts data */}
      <ul className="mt-4">
        <li className="mb-2">Saturday: 10am - 4pm</li>
        <li className="mb-2">Sunday: 12pm - 6pm</li>
      </ul>
    </div>
  );
}
