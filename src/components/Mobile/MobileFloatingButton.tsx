import React from 'react';
import { Plus } from 'lucide-react';

interface MobileFloatingButtonProps {
  onClick: () => void;
  icon?: React.ComponentType<any>;
  className?: string;
}

export function MobileFloatingButton({ 
  onClick, 
  icon: Icon = Plus, 
  className = '' 
}: MobileFloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-20 right-4 w-14 h-14 bg-gradient-primary hover:opacity-90 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-20 ${className}`}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
}