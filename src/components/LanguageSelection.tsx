'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Languages } from 'lucide-react';

export default function LanguageSelection() {
  const router = useRouter();

  const selectLanguage = (language: string) => {
    // Navigate to the VoiceAgent page with the language parameter
    router.push(`/voice-agent?language=${language}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 md:p-8">
      <Card className="w-full max-w-2xl shadow-xl border-border/40">
        <CardHeader className="text-center pb-3 border-b">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <Globe className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Cloud Companion</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">Select Your Language / Selectați Limba</p>
        </CardHeader>
        
        <CardContent className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {/* English option */}
            <LanguageCard 
              language="english"
              label="English"
              flagSrc="/images/flags/us-flag.svg"
              onSelect={selectLanguage}
            />

            {/* Romanian option */}
            <LanguageCard 
              language="romanian"
              label="Română"
              flagSrc="/images/flags/romanian-flag.svg"
              onSelect={selectLanguage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface LanguageCardProps {
  language: string;
  label: string;
  flagSrc: string;
  onSelect: (language: string) => void;
}

function LanguageCard({ language, label, flagSrc, onSelect }: LanguageCardProps) {
  return (
    <div 
      className="relative group h-full cursor-pointer"
      onClick={() => onSelect(language)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl"></div>
      <Card className="h-full overflow-hidden border-border/30 transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-md hover:cursor-pointer">
        <CardContent className="p-6 flex flex-col items-center">
          <div className="w-full h-24 relative mb-6 flex items-center justify-center">
            <div className="relative w-40 h-24 overflow-hidden rounded-md shadow-sm border border-border/40 flex items-center justify-center">
              <Image
                src={flagSrc}
                alt={`${label} Flag`}
                fill
                style={{ objectFit: 'cover' }}
                priority
                className="drop-shadow-sm"
                onError={(e) => {
                  // If the image fails to load, display a fallback
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="text-center w-full">${label}</div>`;
                  }
                }}
              />
            </div>
          </div>
          
          <h3 className="text-xl font-medium text-foreground group-hover:text-primary transition-colors duration-300">{label}</h3>
          
          <Button 
            variant="outline" 
            size="sm"
            className="mt-4 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(language);
            }}
          >
            <Languages className="h-4 w-4 mr-2" />
            Select
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 