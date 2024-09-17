"use client";
import { useUser, useAuth } from '@clerk/nextjs';
import Image from "next/image";

export default function Homepage() {
  const { signOut } = useAuth();
  const {user} = useUser();

  return (  
      <div className="relative">
      <div className="absolute top-1 left-1">
        <Image
          className="dark:invert"
          src="/images/tempo-removebg-preview.png"
          alt="Tempo logo"
          width={120}
          height={40}
          priority
        />
      </div>

      <div className="absolute top-4 right-4 text-right">
        {user && (() => {
          const userName = user.emailAddresses[0].emailAddress.split('@')[0];
          const capitalizedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);

          return (
            <>
              <div className="text-2xl font-bold">
                Welcome to Tempo, {capitalizedUserName}!
              </div>

              <div className="text-xl font-semibold mt-4">Schedule</div>
              <div className="text-xl font-semibold mt-2">Open Shifts</div>
            </>
          );
        })()}
      </div>

      <div className="flex items-center gap-4 fixed bottom-8 left-8">
        <Image
          className="rounded-full"
          src={user?.profileImageUrl || '/default-avatar.png'}
          alt="Profile image"
          width={50}
          height={50}
        />
        <div>
          <div className="font-bold">{user?.emailAddresses[0].emailAddress}</div>
          <div className="text-sm text-gray-500">
            ({user?.organizationMemberships?.[0]?.role === 'org:admin' ? 'Administrator' : 'Member'})
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="ml-4 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-12 w-40 px-5"
        >
          Sign Out →
        </button>
      </div>
    </div>
  );
}