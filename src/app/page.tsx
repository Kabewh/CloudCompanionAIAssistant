'use client';

import LanguageSelection from '@/components/LanguageSelection';
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
      <LanguageSelection />
    </div>
  );
}