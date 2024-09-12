import Image from "next/image";

export default function Profile({ user, signOut }) {
  return (
    <div className="fixed bottom-8 left-8 flex items-center gap-4">
      <Image
        className="rounded-full"
        src={user?.profileImageUrl || '/default-avatar.png'}
        alt="Profile image"
        width={50}
        height={50}
      />
      <div>
        <div className="font-bold text-gray-900">{user?.emailAddresses[0].emailAddress}</div>
        <div className="text-sm text-gray-500">
          ({user?.organizationMemberships?.[0]?.role === 'org:admin' ? 'Administrator' : 'Member'})
        </div>
      </div>
      <button
        onClick={signOut}
        className="ml-4 bg-blue-500 text-white rounded-full hover:bg-blue-400 transition-colors h-12 w-40 flex items-center justify-center"
      >
        Sign Out →
      </button>
    </div>
  );
}
