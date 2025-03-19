'use client';

import Millis from '@millisai/web-sdk';
import { useState, useEffect, useRef } from 'react';

// Define a proper type for the Millis client
type MillisClient = ReturnType<typeof Millis.createClient>;

export default function VoiceAgent() {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Array<{type: 'user' | 'agent', text: string}>>([]);
  const msClientRef = useRef<MillisClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    });

    msClient.on("onresponsetext", (text: string, payload: { is_final?: boolean }) => {
      console.log("Response text:", text, payload);
      if (payload.is_final) {
        setMessages(prev => [...prev, { type: 'agent', text }]);
      }
    });

    msClient.on("ontranscript", (text: string, payload: { is_final?: boolean }) => {
      console.log("Transcript:", text, payload);
      setTranscript(text);
      if (payload.is_final && text) {
        setMessages(prev => [...prev, { type: 'user', text }]);
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
      
      if (event.code !== 1000) {
        setConnectionError(`Connection closed unexpectedly (code: ${event.code}). Reason: ${event.reason || 'Unknown'}`);
      }
    });

    msClient.on("onerror", (error: Event) => {
      console.error("Error occurred:", error);
      setIsListening(false);
      setConnectionError("An error occurred with the voice connection. Please try again.");
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      
      msClientRef.current.start({
        agent: {
          agent_id: process.env.NEXT_PUBLIC_MILLIS_AGENT_ID,
        },
        metadata: {
          apiKey: apiKey,
          useOpenAIProxy: process.env.NEXT_PUBLIC_USE_OPENAI_PROXY === 'true'
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      setMessages(prev => [...prev, { type: 'user', text: inputText }]);
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Cloud Companion</h1>
          <div className="flex items-center">
            {isListening && <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>}
            <span className="text-sm text-gray-500">{isListening ? 'Listening...' : 'Not active'}</span>
          </div>
        </div>

        {connectionError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {connectionError}
          </div>
        )}

        <div className="space-y-4 mb-6 h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
          {messages.map((msg, idx) => (
            <div key={idx} className={`p-3 rounded-lg ${msg.type === 'user' ? 'bg-blue-100 ml-auto max-w-[80%]' : 'bg-gray-200 mr-auto max-w-[80%]'}`}>
              <p className="text-gray-800">{msg.text}</p>
            </div>
          ))}
          {transcript && isListening && (
            <div className="p-3 rounded-lg bg-blue-50 ml-auto max-w-[80%] opacity-70">
              <p className="text-gray-600 italic">{transcript}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex flex-col gap-4 items-center justify-center">
          <button
            onClick={isListening ? stopVoiceAgent : startVoiceAgent}
            className={`w-full py-3 rounded-lg ${isListening 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'} 
              text-white font-medium transition-colors`}
          >
            {isListening ? 'Stop Listening' : 'Start Voice Agent'}
          </button>
          
          <form onSubmit={handleSubmit} className="w-full flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={!inputText.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 