'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import VoiceAgent from '@/components/VoiceAgent';

function VoiceAgentClient() {
  const searchParams = useSearchParams();
  const language = searchParams.get('language') || 'english';
  
  return <VoiceAgent language={language} />;
}

export default function VoiceAgentPage() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <VoiceAgentClient />
      </Suspense>
    </div>
  );
} 