import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, UserRole, Permission } from '../types';
import { useUsers } from './useUsers';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (module: string, action: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@omservices.com',
    name: 'Main Admin',
    role: 'main_admin',
    permissions: [
      { id: '1', module: 'documents', action: 'create', granted: true },
      { id: '2', module: 'documents', action: 'read', granted: true },
      { id: '3', module: 'documents', action: 'update', granted: true },
      { id: '4', module: 'documents', action: 'delete', granted: true },
      { id: '5', module: 'payments', action: 'create', granted: true },
      { id: '6', module: 'payments', action: 'read', granted: true },
      { id: '7', module: 'payments', action: 'update', granted: true },
      { id: '8', module: 'users', action: 'create', granted: true },
      { id: '9', module: 'users', action: 'read', granted: true },
      { id: '10', module: 'users', action: 'update', granted: true },
      { id: '11', module: 'salary', action: 'read', granted: true },
      { id: '12', module: 'salary', action: 'manage', granted: true },
    ],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  {
    id: '2',
    email: 'challan@omservices.com',
    name: 'Challan Staff',
    role: 'challan_staff',
    permissions: [
      { id: '11', module: 'documents', action: 'read', granted: true },
      { id: '12', module: 'challans', action: 'create', granted: true },
      { id: '13', module: 'challans', action: 'update', granted: true },
      { id: '14', module: 'payments', action: 'read', granted: true },
    ],
    isActive: true,
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date(),
  },
];

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>(mockUsers);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('om-services-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Update allUsers when new users are created
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUsers = localStorage.getItem('om-services-users');
      if (storedUsers) {
        try {
          const users = JSON.parse(storedUsers);
          setAllUsers([...mockUsers, ...users]);
        } catch (error) {
          console.error('Error parsing stored users:', error);
        }
      }
    };

    // Load users on mount
    handleStorageChange();

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab updates
    window.addEventListener('usersUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('usersUpdated', handleStorageChange);
    };
  }, []);
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Mock authentication - in real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = allUsers.find(u => u.email === email && u.isActive);
    if (foundUser && password === 'password123') {
      setUser(foundUser);
      localStorage.setItem('om-services-user', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('om-services-user');
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    if (user.role === 'main_admin') return true;
    
    return user.permissions.some(
      p => p.module === module && p.action === action && p.granted
    );
  };

  const value = {
    user,
    login,
    logout,
    hasPermission,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}