import { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { gmailApi, GmailMessage as ApiGmailMessage } from '../services/gmailApi';

interface GmailMessage extends ApiGmailMessage {}

interface GmailContextType {
  messages: GmailMessage[];
  loading: boolean;
  isConnected: boolean;
  unreadCount: number;
  currentUser: any;
  error: string | null;
  connectGmail: () => Promise<void>;
  disconnectGmail: () => void;
  fetchMessages: () => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markAsUnread: (messageId: string) => Promise<void>;
  starMessage: (messageId: string) => Promise<void>;
  unstarMessage: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  sendReply: (messageId: string, content: string) => Promise<void>;
}

const GmailContext = createContext<GmailContextType | undefined>(undefined);

// Mock Gmail messages for demonstration when not connected
const mockMessages: GmailMessage[] = [
  {
    id: 'msg1',
    threadId: 'thread1',
    subject: 'Document Registration Query',
    from: 'customer@example.com',
    to: 'admin@omservices.com',
    date: new Date(2024, 11, 20, 10, 30),
    body: 'Hello, I wanted to inquire about the status of my document registration. My document number is AGR/2024/001. Could you please provide an update?',
    isRead: false,
    isStarred: false,
    labels: ['INBOX', 'IMPORTANT'],
  },
  {
    id: 'msg2',
    threadId: 'thread2',
    subject: 'Payment Confirmation Required',
    from: 'builder@example.com',
    to: 'admin@omservices.com',
    date: new Date(2024, 11, 19, 14, 15),
    body: 'Hi, I need confirmation of payment for challan CHALLAN/2024/002. The payment was made yesterday via online transfer. Please confirm receipt.',
    isRead: true,
    isStarred: true,
    labels: ['INBOX'],
  },
  {
    id: 'msg3',
    threadId: 'thread3',
    subject: 'Urgent: Document Collection Delay',
    from: 'urgent.customer@example.com',
    to: 'admin@omservices.com',
    date: new Date(2024, 11, 18, 16, 45),
    body: 'There has been a delay in document collection due to unavailability. Can we reschedule for tomorrow? This is quite urgent as we have a deadline to meet.',
    isRead: false,
    isStarred: false,
    labels: ['INBOX', 'URGENT'],
  },
];

export function useGmail() {
  const context = useContext(GmailContext);
  if (context === undefined) {
    throw new Error('useGmail must be used within a GmailProvider');
  }
  return context;
}

export function GmailProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  useEffect(() => {
    // Check if user is already signed in on component mount
    checkSignInStatus();
  }, []);

  const checkSignInStatus = async () => {
    try {
      setError(null);
      
      // Check if Gmail is enabled in settings
      const savedConfig = localStorage.getItem('apiConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (!config.gmail?.enabled) {
          setMessages(mockMessages);
          return;
        }
      }
      
      const signedIn = await gmailApi.isSignedIn();
      setIsConnected(signedIn);
      
      if (signedIn) {
        const user = await gmailApi.getCurrentUser();
        setCurrentUser(user);
        await fetchMessages();
      } else {
        // Use mock messages when not connected
        setMessages(mockMessages);
      }
    } catch (error) {
      console.error('Error checking sign-in status:', error);
      setIsConnected(false);
      setMessages(mockMessages);
    }
  };

  const connectGmail = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await gmailApi.signIn();
      
      if (success) {
        const user = await gmailApi.getCurrentUser();
        setCurrentUser(user);
        setIsConnected(true);
        await fetchMessages();
      } else {
        throw new Error('Failed to sign in to Gmail');
      }
    } catch (error) {
      console.error('Error connecting to Gmail:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Gmail';
      setError(errorMessage);
      
      // Show user-friendly error message
      if (errorMessage.includes('credentials not configured')) {
        setError('Gmail API not configured. Please go to Settings → Gmail API to configure your credentials.');
      } else if (errorMessage.includes('popup')) {
        setError('Please allow popups for this site and try again.');
      } else {
        setError('Failed to connect to Gmail. Please check your internet connection and try again.');
      }
      
      // Fallback to mock messages
      setMessages(mockMessages);
    } finally {
      setLoading(false);
    }
  };

  const disconnectGmail = async (): Promise<void> => {
    try {
      await gmailApi.signOut();
      setIsConnected(false);
      setCurrentUser(null);
      setMessages(mockMessages); // Fallback to mock messages
      setError(null);
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
    }
  };

  const fetchMessages = async (): Promise<void> => {
    if (!isConnected) {
      setMessages(mockMessages);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedMessages = await gmailApi.getMessages(50);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to fetch messages. Using demo data.');
      // Fallback to mock messages if API fails
      setMessages(mockMessages);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string): Promise<void> => {
    try {
      if (isConnected) {
        await gmailApi.markAsRead(messageId);
      }
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
      // Still update UI even if API call fails
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    }
  };

  const markAsUnread = async (messageId: string): Promise<void> => {
    try {
      if (isConnected) {
        await gmailApi.markAsUnread(messageId);
      }
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: false } : msg
        )
      );
    } catch (error) {
      console.error('Error marking as unread:', error);
      // Still update UI even if API call fails
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: false } : msg
        )
      );
    }
  };

  const starMessage = async (messageId: string): Promise<void> => {
    try {
      if (isConnected) {
        await gmailApi.starMessage(messageId);
      }
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, isStarred: true } : msg
        )
      );
    } catch (error) {
      console.error('Error starring message:', error);
      // Still update UI even if API call fails
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, isStarred: true } : msg
        )
      );
    }
  };

  const unstarMessage = async (messageId: string): Promise<void> => {
    try {
      if (isConnected) {
        await gmailApi.unstarMessage(messageId);
      }
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, isStarred: false } : msg
        )
      );
    } catch (error) {
      console.error('Error unstarring message:', error);
      // Still update UI even if API call fails
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, isStarred: false } : msg
        )
      );
    }
  };

  const deleteMessage = async (messageId: string): Promise<void> => {
    try {
      if (isConnected) {
        await gmailApi.deleteMessage(messageId);
      }
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  };

  const sendReply = async (messageId: string, content: string): Promise<void> => {
    try {
      if (!isConnected) {
        throw new Error('Not connected to Gmail');
      }
      
      await gmailApi.sendReply(messageId, content);
      // Optionally refresh messages to show the sent reply
      await fetchMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      throw error;
    }
  };

  const value = {
    messages,
    loading,
    isConnected,
    unreadCount,
    currentUser,
    error,
    connectGmail,
    disconnectGmail,
    fetchMessages,
    markAsRead,
    markAsUnread,
    starMessage,
    unstarMessage,
    deleteMessage,
    sendReply,
  };

  return <GmailContext.Provider value={value}>{children}</GmailContext.Provider>;
}