import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  CreditCard, 
  Users, 
  Receipt,
  CheckSquare,
  Mail,
  Clock,
  Settings,
  Menu,
  Bell,
  Search,
  Plus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useGmail } from '../../hooks/useGmail';
import { MobileNavigation } from './MobileNavigation';
import { MobileHeader } from './MobileHeader';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const { user } = useAuth();
  const { unreadCount } = useGmail();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/documents': return 'Documents';
      case '/payments': return 'Payments';
      case '/challans': return 'Challans';
      case '/customers': return 'Customers';
      case '/builders': return 'Builders';
      case '/tasks': return 'Tasks';
      case '/inbox': return 'Inbox';
      case '/attendance': return 'Attendance';
      case '/collection': return 'Collection';
      case '/delivery': return 'Delivery';
      case '/data-entry': return 'Data Entry';
      case '/users': return 'Users';
      case '/settings': return 'Settings';
      default: return 'Admin Panel';
    }
  };

  const getPageIcon = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard': return Home;
      case '/documents': return FileText;
      case '/payments': return CreditCard;
      case '/challans': return Receipt;
      case '/customers': return Users;
      case '/builders': return Users;
      case '/tasks': return CheckSquare;
      case '/inbox': return Mail;
      case '/attendance': return Clock;
      case '/collection': return FileText;
      case '/delivery': return FileText;
      case '/data-entry': return FileText;
      case '/users': return Users;
      case '/settings': return Settings;
      default: return Home;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Mobile Header */}
      <MobileHeader 
        title={getPageTitle()}
        icon={getPageIcon()}
        showSearch={showSearch}
        onToggleSearch={() => setShowSearch(!showSearch)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        <div className="p-4">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
}