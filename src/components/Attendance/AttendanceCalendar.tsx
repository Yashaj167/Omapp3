import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAttendance } from '../../hooks/useAttendance';
import { AttendanceStatus } from '../../types/attendance';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

interface AttendanceCalendarProps {
  userId: string;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const statusColors: Record<AttendanceStatus, string> = {
  'present': 'bg-green-500',
  'absent': 'bg-red-500',
  'late': 'bg-orange-500',
  'half_day': 'bg-yellow-500',
  'on_leave': 'bg-blue-500',
  'holiday': 'bg-purple-500',
  'work_from_home': 'bg-indigo-500',
};

export function AttendanceCalendar({ userId, selectedDate, onDateSelect }: AttendanceCalendarProps) {
  const { getAttendanceByDateRange } = useAttendance();
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get attendance records for the month
  const monthAttendance = getAttendanceByDateRange(monthStart, monthEnd, userId);

  const getAttendanceForDate = (date: Date) => {
    return monthAttendance.find(record => 
      isSameDay(record.date, date)
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const isSelected = (date: Date) => {
    return isSameDay(date, selectedDate);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Attendance Calendar
        </h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h4 className="text-lg font-medium text-gray-900 min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h4>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {monthDays.map(date => {
          const attendance = getAttendanceForDate(date);
          const isCurrentDay = isToday(date);
          const isSelectedDay = isSelected(date);
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              className={`
                relative p-2 text-sm rounded-lg transition-colors
                ${isSelectedDay 
                  ? 'bg-blue-500 text-white' 
                  : isCurrentDay 
                    ? 'bg-blue-100 text-blue-900 font-medium'
                    : 'hover:bg-gray-100'
                }
              `}
            >
              <span className="relative z-10">{format(date, 'd')}</span>
              
              {/* Attendance indicator */}
              {attendance && (
                <div className={`
                  absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full
                  ${statusColors[attendance.status]}
                  ${isSelectedDay ? 'bg-white' : ''}
                `} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 pt-4">
        <h5 className="text-sm font-medium text-gray-900 mb-3">Legend</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <span className="text-gray-600 capitalize">
                {status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}