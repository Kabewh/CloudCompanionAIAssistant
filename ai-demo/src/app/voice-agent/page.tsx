'use client';

import { useSearchParams } from 'next/navigation';
import VoiceAgent from '@/components/VoiceAgent';

export default function VoiceAgentPage() {
  const searchParams = useSearchParams();
  const language = searchParams.get('language') || 'english';
  
  return (
    <div>
      <VoiceAgent language={language} />
    </div>
  );
} 