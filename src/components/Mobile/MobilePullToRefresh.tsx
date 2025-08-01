import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface MobilePullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function MobilePullToRefresh({ onRefresh, children }: MobilePullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || containerRef.current?.scrollTop !== 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    setStartY(0);
  };

  const refreshOpacity = Math.min(pullDistance / 60, 1);
  const shouldShowRefresh = pullDistance > 20 || isRefreshing;

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {shouldShowRefresh && (
        <div 
          className="flex items-center justify-center py-4 transition-all duration-200"
          style={{ 
            opacity: refreshOpacity,
            transform: `translateY(${Math.max(0, pullDistance - 20)}px)`
          }}
        >
          <div className="flex items-center space-x-2 text-gray-600">
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">
              {isRefreshing ? 'Refreshing...' : pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}
      
      <div style={{ transform: `translateY(${pullDistance > 0 ? pullDistance * 0.5 : 0}px)` }}>
        {children}
      </div>
    </div>
  );
}