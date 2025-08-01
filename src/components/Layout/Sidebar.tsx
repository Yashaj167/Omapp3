import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FileText, 
  CreditCard, 
  Users, 
  BarChart3, 
  Settings, 
  Upload,
  Truck,
  PenTool,
  Receipt,
  FolderOpen,
  CheckSquare,
  Mail,
  Clock as ClockIcon,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.tsx';
import { useGmail } from '../../hooks/useGmail.tsx';
import { clsx } from 'clsx';
import { OmServicesLogo } from '../Logo/OmServicesLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, hasPermission } = useAuth();
  const { unreadCount } = useGmail();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      permission: null,
    },
    {
      name: 'Documents',
      href: '/documents',
      icon: FileText,
      permission: { module: 'documents', action: 'read' },
    },
    {
      name: 'Payments',
      href: '/payments',
      icon: CreditCard,
      permission: { module: 'payments', action: 'read' },
    },
    {
      name: 'Challans',
      href: '/challans',
      icon: Receipt,
      permission: { module: 'challans', action: 'read' },
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
      permission: { module: 'customers', action: 'read' },
    },
    {
      name: 'Builders',
      href: '/builders',
      icon: FolderOpen,
      permission: { module: 'builders', action: 'read' },
    },
    {
      name: 'Tasks',
      href: '/tasks',
      icon: CheckSquare,
      permission: null, // Available to all users
    },
    {
      name: 'Inbox',
      href: '/inbox',
      icon: Mail,
      permission: null, // Available to all users
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: ClockIcon,
      permission: null, // Available to all users
    },
    {
      name: 'Salary',
      href: '/salary',
      icon: DollarSign,
      permission: { module: 'salary', action: 'read' },
    },
  ];

  // Role-specific items
  const roleSpecificItems = [];
  
  if (user?.role === 'field_collection_staff') {
    roleSpecificItems.push({
      name: 'Collection Tasks',
      href: '/collection',
      icon: Upload,
      permission: null,
    });
  }

  if (user?.role === 'document_delivery_staff') {
    roleSpecificItems.push({
      name: 'Delivery Tasks',
      href: '/delivery',
      icon: Truck,
      permission: null,
    });
  }

  if (user?.role === 'data_entry_staff') {
    roleSpecificItems.push({
      name: 'Data Entry Tasks',
      href: '/data-entry',
      icon: PenTool,
      permission: null,
    });
  }

  if (user?.role === 'main_admin' || user?.role === 'staff_admin') {
    roleSpecificItems.push({
      name: 'User Management',
      href: '/users',
      icon: Users,
      permission: { module: 'users', action: 'read' },
    });
  }

  if (user?.role === 'main_admin') {
    roleSpecificItems.push({
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      permission: null,
    });
  }

  const allItems = [...navigationItems, ...roleSpecificItems];

  const filteredItems = allItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission.module, item.permission.action);
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-gradient-primary text-white">
            <div className="mr-2">
              <OmServicesLogo size="md" />
            </div>
            <span className="text-xl font-bold">Om Services</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => clsx(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200',
                    isActive
                      ? 'bg-orange-50 text-primary border-r-2 border-primary'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User info */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-primary font-medium text-sm">
                  {user?.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}