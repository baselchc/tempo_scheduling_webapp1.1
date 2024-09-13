"use client";
import { useUser } from '@clerk/nextjs';
import Image from "next/image";

export default function ProfilePage() {
  const { user } = useUser();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Profile</h1>
      <div className="flex items-center gap-4">
        <Image
          className="rounded-full"
          src={user?.profileImageUrl || '/default-avatar.png'}
          alt="Profile image"
          width={100}
          height={100}
        />
        <div>
          <h2 className="text-xl font-bold">{user?.fullName || 'User'}</h2>
          <p className="text-lg">{user?.emailAddresses[0]?.emailAddress}</p>
          <p className="text-md text-gray-500">Role: {user?.organizationMemberships?.[0]?.role}</p>
        </div>
      </div>
    </div>
  );
}
