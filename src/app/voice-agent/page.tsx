'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import VoiceAgent from '@/components/VoiceAgent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function VoiceAgentClient() {
  const searchParams = useSearchParams();
  const language = searchParams.get('language') || 'english';
  const token = searchParams.get('token');
  
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setTimeRemaining] = useState<number | null>(null);
  
  // Check token status and update timer
  useEffect(() => {
    if (token && tokenValidated) {
      // Periodically check the token status and update the timer
      const checkTokenStatus = async () => {
        try {
          const response = await fetch(`/api/check-token?token=${token}`);
          if (response.ok) {
            const data = await response.json();
            if (data.valid && data.expiresIn) {
              setTimeRemaining(data.expiresIn);
            }
          }
        } catch (err) {
          console.error("Error checking token status:", err);
        }
      };
      
      // Check initially
      checkTokenStatus();
      
      // Set up timer to update countdown
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Check token status every 30 seconds
      const statusInterval = setInterval(checkTokenStatus, 30000);
      
      return () => {
        clearInterval(timer);
        clearInterval(statusInterval);
      };
    }
  }, [token, tokenValidated]);
  
  // Handle token validation
  useEffect(() => {
    // Only try to validate the token once on initial load
    if (!token) {
      setError(`No access token provided. Please return to the language selection page.`);
      return;
    }
    
    // Get from sessionStorage to prevent validation on refreshes
    const validated = sessionStorage.getItem(`token_validated_${token}`);
    
    if (validated === 'true') {
      // We've already validated this token in this session
      setTokenValidated(true);
      return;
    }
    
    if (!validationAttempted && !tokenValidated && !error) {
      setValidationAttempted(true);
      
      const validateTokenAsync = async () => {
        try {
          // Check if the token is valid using our API route
          const response = await fetch(`/api/check-token?token=${token}`);
          if (!response.ok) {
            throw new Error("Failed to check token");
          }
          
          const checkResult = await response.json();
          
          if (checkResult && checkResult.valid) {
            // If the token is valid, mark it as validated locally
            setTokenValidated(true);
            sessionStorage.setItem(`token_validated_${token}`, 'true');
            
            if (checkResult.expiresIn) {
              setTimeRemaining(checkResult.expiresIn);
            }
          } else {
            // Token is not valid
            setError(checkResult?.reason || "Invalid token");
          }
        } catch (err) {
          console.error('Token validation error:', err);
          
          // Fall back to local storage check for already used tokens
          if (sessionStorage.getItem(`token_used_by_us_${token}`) === 'true') {
            setTokenValidated(true);
            sessionStorage.setItem(`token_validated_${token}`, 'true');
            return;
          }
          
          // Handle error message for all other cases
          setError(err instanceof Error ? err.message : "Invalid or expired token");
        }
      };
      
      validateTokenAsync();
    }
  }, [token, tokenValidated, validationAttempted, error]);
  
  // Show an error message if the token is invalid
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              Access Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">{error}</p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Language Selection
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show loading while validating
  if (!tokenValidated && validationAttempted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-xl">Validating Access...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center my-6">
              <div className="h-8 w-8 border-t-2 border-primary rounded-full animate-spin"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If the token is valid, show the voice agent with a countdown
  return (
    <div>
      <VoiceAgent language={language} />
    </div>
  );
}

export default function VoiceAgentPage() {
  return (
    <div>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-xl">Loading Voice Agent...</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex justify-center my-6">
                <div className="h-8 w-8 border-t-2 border-primary rounded-full animate-spin"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      }>
        <VoiceAgentClient />
      </Suspense>
    </div>
  );
} 