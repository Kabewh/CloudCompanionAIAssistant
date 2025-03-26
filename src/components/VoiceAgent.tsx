'use client';

import Millis from '@millisai/web-sdk';
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Cloud, BarChart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Define a proper type for the Millis client
type MillisClient = ReturnType<typeof Millis.createClient>;

interface VoiceAgentProps {
  language?: string;
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

  useEffect(() => {
    // Initialize the client only once
    if (!msClientRef.current) {
      const publicKey = process.env.NEXT_PUBLIC_MILLIS_PUBLIC_KEY || 'F0DzXOcj6UDsfULztsNQuS4HBXDJntNg';
      msClientRef.current = Millis.createClient({
        publicKey: publicKey,
        endPoint: 'wss://api-eu-west.millis.ai/millis'
      });
      
      setupEventListeners();
    }
    checkMicrophonePermission();

    return () => {
      if (msClientRef.current && isListening) {
        msClientRef.current.stop();
      }
    };
  }, [isListening]);

  useEffect(() => {
    scrollToBottom();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Add a new effect to scroll when the current agent response updates
  useEffect(() => {
    if (currentAgentResponse) {
      scrollToBottom();
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
    });

    msClient.on("onaudio", () => {
      // The agent is speaking - this event is triggered when audio is playing
      setIsSpeaking(true);
    });

    msClient.on("onresponsetext", (text: string, payload: { is_final?: boolean }) => {
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
      
      // Only show errors for unexpected closures
      // 1000: Normal closure
      // 1001: Going away (page close/reload)
      // 1005: No status code present
      // 1006: Abnormal closure (handled differently in browsers)
      // 1011: Server terminating connection
      // 1005 and 1006 are generated by browsers, not sent over the wire
      const expectedClosureCodes = [1000, 1001, 1005];
      if (!expectedClosureCodes.includes(event.code)) {
        setConnectionError(`Connection closed unexpectedly (code: ${event.code}). Reason: ${event.reason || 'Unknown'}`);
      } else {
        // Clear any existing connection error for expected closures
        setConnectionError(null);
      }
    });

    msClient.on("onerror", (error: Event) => {
      console.error("Error occurred:", error);
      setIsListening(false);
      setConnectionError("An error occurred with the voice connection. Please try again.");
    });
  };

  const scrollToBottom = () => {
    // Use setTimeout to ensure this happens after the DOM has been updated
    setTimeout(() => {
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
    }, 10);
  };

  const startVoiceAgent = async () => {
    if (!permissionGranted) {
      await checkMicrophonePermission();
      if (!permissionGranted) return;
    }
    
    if (!msClientRef.current) {
      setConnectionError("Client initialization failed. Please refresh the page.");
      return;
    }
    
    setConnectionError(null);
    
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
        include_metadata_in_prompt: true
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
    // Clear any connection error when the user deliberately stops the agent
    setConnectionError(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Cloud className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">Cloud Companion</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="h-8 shadow-sm">
              <Link href="/dashboard">
                <BarChart className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">View Leads</span>
                <span className="inline sm:hidden">Leads</span>
              </Link>
            </Button>
            <div className="text-sm text-muted-foreground flex items-center ml-1">
              {isListening && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-1"></div>}
              <span className="hidden sm:inline">{isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Not active'}</span>
            </div>
          </div>
        </CardHeader>

        {connectionError && (
          <div className="mx-6 mb-3 p-3 bg-destructive/15 text-destructive text-sm rounded-md">
            {connectionError}
          </div>
        )}

        <CardContent>
          <div className="space-y-4 h-[400px] overflow-y-auto p-4 rounded-md bg-muted/50">
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Start the voice agent and begin your conversation
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "p-3 rounded-lg max-w-[80%]",
                  msg.type === 'user' 
                    ? "ml-auto bg-primary text-primary-foreground" 
                    : "mr-auto bg-card border shadow-sm"
                )}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            ))}
            
            {/* Show the current response being typed */}
            {currentAgentResponse && (
              <div 
                ref={typingMessageRef} 
                className="p-3 rounded-lg bg-card border shadow-sm mr-auto max-w-[80%]"
              >
                <p className="text-sm">
                  {currentAgentResponse}
                  {isSpeaking && <span className="ml-1 animate-pulse">|</span>}
                </p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        <CardFooter className="px-6 py-4 border-t">
          <Button 
            onClick={isListening ? stopVoiceAgent : startVoiceAgent}
            className="w-full" 
            variant={isListening ? "destructive" : "default"}
            size="lg"
          >
            {isListening ? (
              <>
                <MicOff className="mr-2 h-4 w-4" /> Stop Listening
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