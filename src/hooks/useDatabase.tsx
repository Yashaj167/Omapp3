import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { databaseService } from '../services/databaseService';

interface DatabaseContextType {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<boolean>;
  reconnect: () => Promise<boolean>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialize = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const connected = await databaseService.initialize();
      setIsConnected(connected);
      
      if (!connected) {
        setError('Failed to connect to database. Please check your MySQL configuration in Settings.');
      }
      
      return connected;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
      setError(errorMessage);
      setIsConnected(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const reconnect = async (): Promise<boolean> => {
    return initialize();
  };

  useEffect(() => {
    initialize();
  }, []);

  const value = {
    isConnected,
    isLoading,
    error,
    initialize,
    reconnect,
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}