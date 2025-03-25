'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LanguageSelection() {
  const router = useRouter();

  const selectLanguage = (language: string) => {
    // Navigate to the VoiceAgent page with the language parameter
    router.push(`/voice-agent?language=${language}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Select Your Language / Selectați Limba
        </h1>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          {/* English option */}
          <button
            onClick={() => selectLanguage('english')}
            className="w-full md:w-64 h-64 flex flex-col items-center justify-center bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-xl p-6 transition-all hover:scale-105 hover:shadow-lg cursor-pointer"
          >
            <div className="w-40 h-24 relative mb-4 overflow-hidden rounded-md border border-gray-200 cursor-pointer">
              <Image
                src="/images/flags/uk-flag.svg" 
                alt="UK Flag"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <span className="text-2xl font-semibold text-gray-800">English</span>
          </button>

          {/* Romanian option */}
          <button
            onClick={() => selectLanguage('romanian')}
            className="w-full md:w-64 h-64 flex flex-col items-center justify-center bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-xl p-6 transition-all hover:scale-105 hover:shadow-lg cursor-pointer"
          >
            <div className="w-40 h-24 relative mb-4 overflow-hidden rounded-md border border-gray-200 cursor-pointer">
              <Image
                src="/images/flags/romanian-flag.svg" 
                alt="Romanian Flag"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <span className="text-2xl font-semibold text-gray-800">Română</span>
          </button>
        </div>
      </div>
    </div>
  );
} 