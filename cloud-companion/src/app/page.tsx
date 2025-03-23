'use client';

import VoiceAgent from '@/components/VoiceAgent';
import Link from 'next/link';

export default function Home() {
  // const tasks = useQuery(api.tasks.get);
  return (
    <div>
      <div className="flex justify-end p-4">
        <Link href="/dashboard" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
          View Leads Dashboard
        </Link>
      </div>
      <VoiceAgent />
      {/* <main className="flex min-h-screen flex-col items-center justify-between p-24">
        {tasks?.map(({ _id, text }) => <div key={_id}>{text}</div>)}
      </main> */}
    </div>
  );
}