import React from 'react';
import { Search, Bell, Plus, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useGmail } from '../../hooks/useGmail';
import { useLocation, useNavigate } from 'react-router-dom';
import { OmServicesLogo } from '../Logo/OmServicesLogo';

interface MobileHeaderProps {
  title: string;
  icon: React.ComponentType<any>;
  showSearch: boolean;
  onToggleSearch: () => void;
}

export function MobileHeader({ title, icon: Icon, showSearch, onToggleSearch }: MobileHeaderProps) {
  const { user } = useAuth();
  const { unreadCount } = useGmail();
  const location = useLocation();
  const navigate = useNavigate();

  const canCreateNew = () => {
    const path = location.pathname;
    return ['/documents', '/payments', '/challans', '/customers', '/builders', '/tasks'].includes(path);
  };

  const handleCreateNew = () => {
    // This would trigger the appropriate create modal based on current page
    // For now, we'll just show an alert
    const path = location.pathname;
    console.log(`Create new item for ${path}`);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      {/* Main Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
            <OmServicesLogo size="lg" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            <p className="text-xs text-gray-500">{user?.name}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleSearch}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          
          <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {canCreateNew() && (
            <button
              onClick={handleCreateNew}
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}