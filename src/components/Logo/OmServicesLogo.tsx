import React from 'react';

interface OmServicesLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function OmServicesLogo({ className = '', size = 'md' }: OmServicesLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <img
        src="/api/logo.png"
        alt="Om Services Logo"
        className="w-full h-full object-contain rounded-lg"
        onError={(e) => {
          // Fallback to a simple text logo if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `
              <div class="w-full h-full bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                OM
              </div>
            `;
          }
        }}
      />
    </div>
  );
}