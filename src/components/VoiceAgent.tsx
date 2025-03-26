'use client';

import Millis from '@millisai/web-sdk';
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Cloud, AlertCircle, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Define a proper type for the Millis client
type MillisClient = ReturnType<typeof Millis.createClient>;

interface VoiceAgentProps {
  language?: string;
}

// Define an interface for lead data
interface LeadData {
  name?: string;
  budget?: string;
  authority?: string;
  needs?: string;
  timeframe?: string;
  token?: string;
  fullName?: string;
  email?: string;
  language?: string;
  [key: string]: unknown; // Allow for any additional properties with unknown type
}

export default function VoiceAgent({ language = 'english' }: VoiceAgentProps) {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Array<{type: 'user' | 'agent', text: string}>>([]);
  const [currentAgentResponse, setCurrentAgentResponse] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const msClientRef = useRef<MillisClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingMessageRef = useRef<HTMLDivElement>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [connectionClosed, setConnectionClosed] = useState(false);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  
  // Get the token from URL
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  // User data from session storage if available
  const [userData, setUserData] = useState<{
    fullName?: string;
    email?: string;
    language?: string;
    token?: string;
  } | null>(null);
  
  // Get user data from sessionStorage
  useEffect(() => {
    if (token) {
      const storedUserData = sessionStorage.getItem(`user_data_${token}`);
      if (storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
        } catch (e) {
          console.error('Error parsing user data from session storage:', e);
        }
      }
      
      // Activate the token when the component mounts
      // This will start the token expiration countdown
      const activateTokenAsync = async () => {
        try {
          const response = await fetch(`/api/check-token?token=${token}&activate=true`);
          if (response.ok) {
            const data = await response.json();
            if (data.valid && data.expiresIn) {
              setTimeRemaining(data.expiresIn);
            }
          }
        } catch (error) {
          console.error('Error activating token:', error);
        }
      };
      
      activateTokenAsync();
    }
  }, [token]);
  
  // Using a safe empty string to avoid null errors, will be handled in checkToken function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenStatus = useQuery(api.tokens.checkToken as any, { token: token || "" });
  
  // Session time remaining
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  useEffect(() => {
    // If we have a token status from the query and it's valid
    if (token && tokenStatus && tokenStatus.valid === true) {
      // Only set timeRemaining from tokenStatus if:
      // 1. We don't already have a value, or
      // 2. The token has been activated (not notActivated)
      if (timeRemaining === null || !tokenStatus.notActivated) {
        setTimeRemaining(tokenStatus.expiresIn);
      }
      
      // Set up a timer to show countdown, but only if the token has been activated
      if (!tokenStatus.notActivated) {
        const timer = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev === null || prev <= 0) {
              clearInterval(timer);
              
              // When reaching exactly 0, handle session expiration
              if (prev === 0) {
                checkSessionExpiration();
              }
              
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(timer);
      }
    }
  }, [tokenStatus, token]);

  useEffect(() => {
    // Initialize the client only once
    if (!msClientRef.current) {
      const publicKey = process.env.NEXT_PUBLIC_MILLIS_PUBLIC_KEY || 'F0DzXOcj6UDsfULztsNQuS4HBXDJntNg';
      msClientRef.current = Millis.createClient({
        publicKey: publicKey,
        endPoint: 'wss://api-eu-west.millis.ai/millis'
      });
      
      setupEventListeners();
      
      // Start session timer
      setSessionStartTime(Date.now());
    }
    
    // Check for microphone permission first
    checkMicrophonePermission();

    return () => {
      if (msClientRef.current && isListening) {
        msClientRef.current.stop();
      }
    };
  }, [isListening, sessionStartTime]);

  // Add a separate effect for auto-starting after permissions are granted
  useEffect(() => {
    // Only auto-start the voice agent if:
    // 1. Permissions are granted
    // 2. Not already listening
    // 3. Connection isn't closed
    // 4. Session hasn't expired
    // 5. Client is initialized
    // 6. User has NOT manually paused the conversation
    if (permissionGranted && !isListening && !connectionClosed && 
        !(timeRemaining !== null && timeRemaining <= 0) && msClientRef.current &&
        !manuallyPaused) {
      // Add a small delay to ensure everything is properly initialized
      const timer = setTimeout(() => {
        startVoiceAgent();
      }, 800);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionGranted, isListening, connectionClosed, timeRemaining, manuallyPaused]);

  useEffect(() => {
    // For the first message, ensure layout is stable before scrolling
    if (messages.length === 1) {
      // Force a layout calculation by using RAF
      requestAnimationFrame(() => {
        // Use a small timeout to ensure DOM is fully updated
        setTimeout(() => {
          scrollToBottom();
        }, 50);
      });
    } else {
      scrollToBottom();
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Add a new effect to scroll when the current agent response updates
  useEffect(() => {
    if (currentAgentResponse) {
      // Use requestAnimationFrame to ensure layout is calculated before scrolling
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAgentResponse]);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);
  
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setConnectionError('Microphone access is required for the voice agent to work.');
      setPermissionGranted(false);
    }
  };

  const setupEventListeners = () => {
    if (!msClientRef.current) return;
    
    const msClient = msClientRef.current;

    msClient.on("onopen", () => {
      console.log("Connected to Millis AI server");
      setConnectionError(null);
    });

    msClient.on("onready", () => {
      console.log("Voice agent is ready");
      
      // Ensure layout is calculated correctly before adding the first message
      // by using setTimeout to add a slight delay
      setTimeout(() => {
        // Ensure scroll position is correct after adding message
        setTimeout(() => {
          scrollToBottom();
        }, 50);
      }, 100);
    });

    msClient.on("onaudio", () => {
      // The agent is speaking - this event is triggered when audio is playing
      setIsSpeaking(true);
    });

    msClient.on("onresponsetext", (text: string, payload: { is_final?: boolean, is_lead?: boolean, lead_data?: LeadData }) => {
      console.log("Response text:", text, payload);
      
      // When we get any text update, show the text immediately as it's being spoken
      // This way the text appears in real-time with the speech
      setCurrentAgentResponse(text);
      
      // Only when the response is final, add it to the messages array
      if (payload.is_final) {
        // The agent has finished speaking
        setIsSpeaking(false);
        
        // Add a slight delay to allow users to see the completed text before
        // it gets added to the message history
        setTimeout(() => {
          const agentMessage = { type: 'agent' as const, text };
          setMessages(prev => [...prev, agentMessage]);
          setCurrentAgentResponse(null);
          
          // If this is a lead response, process it
          if (payload.is_lead && payload.lead_data) {
            processLeadData(payload.lead_data);
          }
        }, 500);
      }
    });

    msClient.on("onspeechend", () => {
      console.log("Agent speech ended");
      setIsSpeaking(false);
    });

    msClient.on("ontranscript", (text: string, payload: { is_final?: boolean }) => {
      console.log("Transcript:", text, payload);
      if (payload.is_final && text) {
        const userMessage = { type: 'user' as const, text };
        setMessages(prev => [...prev, userMessage]);
      }
    });

    msClient.on("useraudioready", (data: { analyser: AnalyserNode; stream: MediaStream }) => {
      console.log("User audio is ready", data);
    });

    msClient.on("onsessionended", () => {
      console.log("Session ended");
      setIsListening(false);
    });

    msClient.on("onclose", (event: CloseEvent) => {
      console.log("Connection closed", event);
      setIsListening(false);
      setConnectionClosed(true);
      
      // Clear token validation to prevent reuse of the same token
      if (token) {
        sessionStorage.removeItem(`token_validated_${token}`);
      }
      
      // Reset connection state to allow starting a new one
      // Don't show any error, just let the user start a new connection
      setConnectionError(null);
      
      // Reset the conversation if it was an expected closure
      const expectedClosureCodes = [1000, 1001, 1005];
      if (expectedClosureCodes.includes(event.code)) {
        // For expected closures, allow restarting the conversation
        setConnectionClosed(false);
      }
    });

    msClient.on("onerror", (error: Event) => {
      console.error("Error occurred:", error);
      setIsListening(false);
      
      // Just reset the connection without showing an error
      setConnectionClosed(false);
      setConnectionError(null);
      
      // Clear token validation to prevent reuse of the same token
      if (token) {
        sessionStorage.removeItem(`token_validated_${token}`);
      }
    });
  };

  const scrollToBottom = () => {
    // Force layout recalculation before scrolling
    if (document.body) {
      // Force layout recalculation with a sync layout measurement
      void document.body.offsetHeight;
    }
    
    // Use RAF to ensure we're scrolling after layout is complete
    requestAnimationFrame(() => {
      // If there's a typing message, scroll to that
      if (currentAgentResponse && typingMessageRef.current) {
        typingMessageRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      } else if (messagesEndRef.current) {
        // Otherwise scroll to the end of messages
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    });
  };

  const startVoiceAgent = async () => {
    // Check for token expiration
    if (timeRemaining !== null && timeRemaining <= 0) {
      setConnectionError("Your session has expired. Please return to the language selection page.");
      setConnectionClosed(true);
      return;
    }
    
    if (!permissionGranted) {
      await checkMicrophonePermission();
      if (!permissionGranted) return;
    }
    
    if (!msClientRef.current) {
      setConnectionError("Client initialization failed. Please refresh the page.");
      return;
    }
    
    // Clear any previous connection errors
    setConnectionError(null);
    
    // Reset connection closed state to allow restarting
    setConnectionClosed(false);
    
    // Reset the manually paused state when user explicitly starts a new conversation
    setManuallyPaused(false);
    
    // Optional: Reset the conversation if restarting after a previous session
    if (messages.length > 0) {
      setMessages([]);
    }
    
    try {
      // Create a complete configuration using all environment variables
      const apiKey = process.env.NEXT_PUBLIC_MILLIS_API_KEY;
      
      // Select the appropriate agent ID based on the language
      const agentId = language === 'romanian' 
        ? process.env.NEXT_PUBLIC_MILLIS_ROMANIAN_AGENT_ID
        : process.env.NEXT_PUBLIC_MILLIS_ENGLISH_AGENT_ID || process.env.NEXT_PUBLIC_MILLIS_AGENT_ID;
      
      msClientRef.current.start({
        agent: {
          agent_id: agentId,
        },
        metadata: {
          apiKey: apiKey,
          useOpenAIProxy: process.env.NEXT_PUBLIC_USE_OPENAI_PROXY === 'true',
          language: language
        },
        include_metadata_in_prompt: true,
        prompt: "Please greet the user in their language and introduce yourself as Cloud Companion, then ask how you can help them."
      });
      
      setIsListening(true);
    } catch (err) {
      console.error("Error starting voice agent:", err);
      setConnectionError("Failed to start the voice agent. Please try again.");
    }
  };

  const stopVoiceAgent = () => {
    if (msClientRef.current) {
      msClientRef.current.stop();
    }
    setIsListening(false);
    // Mark that the user manually stopped the conversation
    setManuallyPaused(true);
    // Clear any connection error when the user deliberately stops the agent
    setConnectionError(null);
  };

  // Update the processLeadData function with proper type
  const processLeadData = async (leadData: LeadData) => {
    try {
      // Include user data if available
      if (userData && token) {
        leadData.fullName = userData.fullName;
        leadData.email = userData.email;
        leadData.language = userData.language || language;
        leadData.token = token;
      }
      
      // Send lead data to your backend
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });
      
      if (!response.ok) {
        console.error('Failed to submit lead data:', await response.text());
      } else {
        console.log('Lead data submitted successfully');
        // Clear user data from session storage after successful submission
        if (token) {
          sessionStorage.removeItem(`user_data_${token}`);
        }
      }
    } catch (error) {
      console.error('Error processing lead data:', error);
    }
  };

  // Function to check and handle session expiration
  const checkSessionExpiration = () => {
    if (timeRemaining !== null && timeRemaining <= 0) {
      // Stop the voice agent if it's running
      if (msClientRef.current && isListening) {
        msClientRef.current.stop();
        setIsListening(false);
      }
      
      // Set the connection as closed and show error message
      setConnectionClosed(true);
      setConnectionError("Your session has expired. Please return to the language selection page.");
      
      return true; // Session is expired
    }
    
    return false; // Session is still valid
  };

  // Call the check within useEffect to handle expiration as soon as it happens
  useEffect(() => {
    if (timeRemaining === 0) {
      checkSessionExpiration();
    }
  }, [timeRemaining]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-2 sm:p-4 max-w-full overflow-x-hidden">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-center sm:items-center justify-between space-y-2 sm:space-y-0 pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Cloud className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl text-center sm:text-left">Cloud Companion</CardTitle>
              {timeRemaining !== null && (
                <p className={cn(
                  "text-xs flex items-center mt-1 justify-center sm:justify-start",
                  timeRemaining <= 0 ? "text-destructive font-medium" : "text-muted-foreground"
                )}>
                  <Clock className={cn("h-3 w-3 mr-1", timeRemaining <= 0 && "text-destructive")} />
                  {timeRemaining <= 0 
                    ? "Session: EXPIRED" 
                    : `Session: ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="h-8 shadow-sm">
            </Button>
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center">
              {isListening && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-1"></div>}
              <span className="hidden sm:inline">{isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Not active'}</span>
              <span className="inline sm:hidden">{isListening ? 'Listening' : isSpeaking ? 'Speaking' : ''}</span>
            </div>
          </div>
        </CardHeader>

        {timeRemaining === 0 && (
          <div 
            className="mx-4 sm:mx-6 mb-3 p-4 bg-destructive text-destructive-foreground font-medium text-sm rounded-md flex items-center justify-center gap-2 cursor-pointer hover:bg-destructive/90 transition-colors"
            onClick={() => window.location.href = '/'}
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>Session Expired - Click here to return to the language selection page</p>
          </div>
        )}

        {connectionError && timeRemaining !== 0 && (
          <div className="mx-4 sm:mx-6 mb-3 p-4 bg-destructive/15 text-destructive text-sm rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>{connectionError}</p>
          </div>
        )}

        <CardContent className="px-2 sm:px-4">
          {/* Add relative positioning to the outer container to ensure proper layout flow */}
          <div 
            className="relative space-y-4 h-[400px] sm:h-[500px] overflow-y-auto p-3 sm:p-4 rounded-md bg-muted/50 no-scrollbar"
            style={{ display: 'flex', flexDirection: 'column' }}
          > 
            {/* Use position: relative and w-full to ensure consistent message alignment */}
            <div className="relative w-full flex flex-col space-y-4 flex-grow">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "p-3 rounded-lg max-w-[85%] sm:max-w-[80%] flex-shrink-0",
                    msg.type === 'user' 
                      ? "ml-auto bg-primary text-primary-foreground self-end" 
                      : "mr-auto bg-card border shadow-sm self-start"
                  )}
                  style={{ 
                    // Ensure initial positioning is correct
                    alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start' 
                  }}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              ))}
              
              {/* Show the current response being typed with consistent positioning */}
              {currentAgentResponse && (
                <div 
                  ref={typingMessageRef} 
                  className="p-3 rounded-lg bg-card border shadow-sm mr-auto max-w-[85%] sm:max-w-[80%] flex-shrink-0 self-start"
                  style={{ alignSelf: 'flex-start' }}
                >
                  <p className="text-sm">
                    {currentAgentResponse}
                    {isSpeaking && <span className="ml-1 animate-pulse">|</span>}
                  </p>
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-4 sm:px-6 py-4 border-t">
          <Button 
            onClick={isListening ? stopVoiceAgent : timeRemaining !== null && timeRemaining <= 0 ? () => window.location.href = '/' : startVoiceAgent}
            className="w-full" 
            variant={isListening ? "destructive" : (timeRemaining !== null && timeRemaining <= 0) ? "outline" : "default"}
            size="lg"
            disabled={false}
          >
            {isListening ? (
              <>
                <MicOff className="mr-2 h-4 w-4" /> Stop Listening
              </>
            ) : connectionClosed && (timeRemaining !== null && timeRemaining <= 0) ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" /> Session Expired
              </>
            ) : connectionClosed ? (
              <>
                <Mic className="mr-2 h-4 w-4" /> Restart Connection
              </>
            ) : timeRemaining !== null && timeRemaining <= 0 ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" /> Session Expired
              </>
            ) : messages.length > 0 ? (
              <>
                <Mic className="mr-2 h-4 w-4" /> Restart Conversation
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" /> Start Voice Agent
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 