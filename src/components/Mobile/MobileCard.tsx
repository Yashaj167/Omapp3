import React from 'react';
import { ChevronRight } from 'lucide-react';

interface MobileCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  showArrow?: boolean;
}

export function MobileCard({ children, onClick, className = '', showArrow = false }: MobileCardProps) {
  const baseClasses = "bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all duration-200";
  const interactiveClasses = onClick ? "active:scale-95 active:bg-gray-50" : "";

  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {children}
        </div>
        {showArrow && (
          <ChevronRight className="w-5 h-5 text-gray-400 ml-3" />
        )}
      </div>
    </div>
  );
}