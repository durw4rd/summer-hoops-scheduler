"use client";

import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';
import { ReactNode, useEffect, useState } from 'react';

// Generate a unique session ID for this browser session
const generateSessionId = () => {
  // Use localStorage to persist session ID across page reloads
  const storedSessionId = localStorage.getItem('ld_session_id');
  if (storedSessionId) {
    return storedSessionId;
  }
  
  // Generate new session ID if none exists
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('ld_session_id', sessionId);
  return sessionId;
};

interface LaunchDarklyProviderProps {
  children: ReactNode;
}

function LaunchDarklyProviderContent({ children }: LaunchDarklyProviderProps) {
  const [LDProvider, setLDProvider] = useState<React.ComponentType<{ children: ReactNode }> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeLD = async () => {
      try {
        const sessionId = generateSessionId();
        
        // Initialize with basic context - the hook will update it dynamically
        const context = {
          kind: "multi",
          session: {
            key: sessionId,
          },
          user: {
            key: 'anonymous',
            name: 'Anonymous User',
          }
        };

        console.log('Initializing LaunchDarkly with basic context');

        const provider = await asyncWithLDProvider({
          clientSideID: process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID!,
          context,
          options: {
            application: {
                id: 'summer-hoops-app',
                version: '1.16.0',
            },
            // Optional: Add any additional configuration here
          },
          reactOptions: {},
          deferInitialization: false,
          timeout: 3
        });

        setLDProvider(() => provider);
      } catch (error) {
        console.error('Failed to initialize LaunchDarkly:', error);
        // Fallback: create a simple provider that just renders children
        setLDProvider(() => ({ children }: { children: ReactNode }) => <>{children}</>);
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize only once when component mounts
    initializeLD();
  }, []); // Remove session and status dependencies

  if (isLoading || !LDProvider) {
    return <div>Loading...</div>;
  }

  return <LDProvider>{children}</LDProvider>;
}

export default function LaunchDarklyProvider({ children }: LaunchDarklyProviderProps) {
  return <LaunchDarklyProviderContent>{children}</LaunchDarklyProviderContent>;
} 