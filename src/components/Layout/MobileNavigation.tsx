import React from 'react';
import { NavLink } from 'react-router-dom';
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
  Upload,
  Truck,
  PenTool
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useGmail } from '../../hooks/useGmail';
import { clsx } from 'clsx';

export function MobileNavigation() {
  const { user, hasPermission } = useAuth();
  const { unreadCount } = useGmail();

  // Core navigation items for all users
  const coreItems = [
    {
      name: 'Home',
      href: '/dashboard',
      icon: Home,
      permission: null,
    },
    {
      name: 'Documents',
      href: '/documents',
      icon: FileText,
      permission: { module: 'documents', action: 'read' },
    },
    {
      name: 'Tasks',
      href: '/tasks',
      icon: CheckSquare,
      permission: null,
    },
    {
      name: 'Inbox',
      href: '/inbox',
      icon: Mail,
      permission: null,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  // Role-specific items
  const getRoleSpecificItem = () => {
    switch (user?.role) {
      case 'field_collection_staff':
        return {
          name: 'Collection',
          href: '/collection',
          icon: Upload,
          permission: null,
        };
      case 'document_delivery_staff':
        return {
          name: 'Delivery',
          href: '/delivery',
          icon: Truck,
          permission: null,
        };
      case 'data_entry_staff':
        return {
          name: 'Data Entry',
          href: '/data-entry',
          icon: PenTool,
          permission: null,
        };
      case 'challan_staff':
        return {
          name: 'Challans',
          href: '/challans',
          icon: Receipt,
          permission: { module: 'challans', action: 'read' },
        };
      case 'main_admin':
      case 'staff_admin':
        return {
          name: 'Users',
          href: '/users',
          icon: Users,
          permission: { module: 'users', action: 'read' },
        };
      default:
        return {
          name: 'Payments',
          href: '/payments',
          icon: CreditCard,
          permission: { module: 'payments', action: 'read' },
        };
    }
  };

  const roleSpecificItem = getRoleSpecificItem();
  const navigationItems = [...coreItems.slice(0, 3), roleSpecificItem, coreItems[3]];

  const filteredItems = navigationItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission.module, item.permission.action);
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="grid grid-cols-5 h-16">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => clsx(
                'flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors relative',
                isActive
                  ? 'text-primary bg-orange-50'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}