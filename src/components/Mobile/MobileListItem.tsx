import React from 'react';
import { ChevronRight, MoreVertical } from 'lucide-react';

interface MobileListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ComponentType<any>;
  badge?: string | number;
  badgeColor?: string;
  onClick?: () => void;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
  avatar?: React.ReactNode;
}

export function MobileListItem({
  title,
  subtitle,
  description,
  icon: Icon,
  badge,
  badgeColor = 'bg-blue-100 text-blue-800',
  onClick,
  onMenuClick,
  actions,
  avatar
}: MobileListItemProps) {
  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${
        onClick ? 'active:scale-95 active:bg-gray-50 transition-all duration-200' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon or Avatar */}
        {avatar || (Icon && (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
        ))}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
              {description && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{description}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-2 ml-3">
              {badge && (
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${badgeColor}`}>
                  {badge}
                </span>
              )}
              
              {actions || (
                <div className="flex items-center space-x-1">
                  {onMenuClick && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMenuClick();
                      }}
                      className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                  {onClick && (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}