'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Mail, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserDataFormProps {
  language: string;
  token: string;
}

export default function UserDataForm({ language, token }: UserDataFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  });
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      fullName: '',
      email: '',
    };

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = language === 'english' ? 'Full name is required' : 'Numele complet este obligatoriu';
      isValid = false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = language === 'english' ? 'Email is required' : 'Email-ul este obligatoriu';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = language === 'english' ? 'Please enter a valid email' : 'Vă rugăm să introduceți un email valid';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Store user data in session storage instead of creating a lead right away
      // This data will be used by the voice agent if it needs to create a lead
      const userData = {
        fullName: formData.fullName,
        email: formData.email,
        language,
        token,
        timestamp: Date.now()
      };
      
      // Save to session storage so it persists only for this session
      sessionStorage.setItem(`user_data_${token}`, JSON.stringify(userData));
      
      // Artificial delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Navigate to the voice agent page
      router.push(`/voice-agent?language=${language}&token=${token}`);
    } catch (error) {
      console.error("Error storing user information:", error);
      alert(language === 'english' 
        ? 'Failed to save your information. Please try again.' 
        : 'Nu s-au putut salva informațiile. Vă rugăm să încercați din nou.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 md:p-8">
      <Card className="w-full max-w-md shadow-xl border-border/40">
        <CardHeader className="text-center pb-3 border-b">
          <CardTitle className="text-2xl">
            {language === 'english' ? 'Your Information' : 'Informațiile Dumneavoastră'}
          </CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            {language === 'english' 
              ? 'Please provide your details to continue' 
              : 'Vă rugăm să furnizați detaliile pentru a continua'}
          </p>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder={language === 'english' ? 'Full Name' : 'Nume Complet'}
                  className={cn(
                    "w-full pl-10 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50",
                    errors.fullName ? "border-destructive" : "border-input"
                  )}
                />
              </div>
              {errors.fullName && (
                <p className="text-destructive text-xs">{errors.fullName}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={language === 'english' ? 'Email Address' : 'Adresă de Email'}
                  className={cn(
                    "w-full pl-10 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50",
                    errors.email ? "border-destructive" : "border-input"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email}</p>
              )}
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-end pt-2">
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'english' ? 'Processing...' : 'Se procesează...'}
              </>
            ) : (
              <>
                {language === 'english' ? 'Continue' : 'Continuă'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 