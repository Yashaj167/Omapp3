import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Play, Square, Timer, Coffee } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAttendance } from '../../hooks/useAttendance';
import { format } from 'date-fns';

export function ClockInOutWidget() {
  const { user } = useAuth();
  const { 
    clockIn, 
    clockOut, 
    getTodayAttendance, 
    isUserClockedIn, 
    getCurrentWorkingHours,
    loading 
  } = useAttendance();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [showClockInForm, setShowClockInForm] = useState(false);
  const [showClockOutForm, setShowClockOutForm] = useState(false);

  const todayAttendance = getTodayAttendance();
  const isClockedIn = isUserClockedIn();
  const currentWorkingHours = getCurrentWorkingHours();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        () => {
          setLocation('Location not available');
        }
      );
    }
  }, []);

  const handleClockIn = async () => {
    try {
      await clockIn(location, notes);
      setShowClockInForm(false);
      setNotes('');
    } catch (error) {
      console.error('Clock in error:', error);
      alert(error instanceof Error ? error.message : 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOut(notes);
      setShowClockOutForm(false);
      setNotes('');
    } catch (error) {
      console.error('Clock out error:', error);
      alert(error instanceof Error ? error.message : 'Failed to clock out');
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getWorkingStatus = () => {
    if (!todayAttendance) return 'Not clocked in';
    if (isClockedIn) return 'Currently working';
    return 'Work completed';
  };

  return (
    <div className="bg-gradient-primary-br rounded-2xl p-8 text-white">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Time & Greeting */}
        <div className="lg:col-span-1">
          <div className="text-center">
            <div className="bg-white bg-opacity-20 rounded-xl p-6 mb-4">
              <Clock className="w-12 h-12 mx-auto mb-4 text-white" />
              <div className="text-3xl font-bold mb-2">
                {format(currentTime, 'HH:mm:ss')}
              </div>
              <div className="text-orange-100">
                {format(currentTime, 'EEEE, MMMM dd, yyyy')}
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {getGreeting()}, {user?.name}!
            </h2>
            <p className="text-orange-100">{getWorkingStatus()}</p>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Today's Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4" />
                <span>Clock In</span>
              </div>
              <span className="font-medium">
                {todayAttendance?.clockInTime 
                  ? format(todayAttendance.clockInTime, 'HH:mm')
                  : '--:--'
                }
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Square className="w-4 h-4" />
                <span>Clock Out</span>
              </div>
              <span className="font-medium">
                {todayAttendance?.clockOutTime 
                  ? format(todayAttendance.clockOutTime, 'HH:mm')
                  : '--:--'
                }
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4" />
                <span>Working Hours</span>
              </div>
              <span className="font-medium">
                {isClockedIn 
                  ? `${currentWorkingHours.toFixed(1)}h`
                  : todayAttendance?.totalHours 
                    ? `${todayAttendance.totalHours.toFixed(1)}h`
                    : '0h'
                }
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coffee className="w-4 h-4" />
                <span>Break Time</span>
              </div>
              <span className="font-medium">
                {todayAttendance?.breakTime 
                  ? `${todayAttendance.breakTime}m`
                  : '60m'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Clock In/Out Actions */}
        <div className="lg:col-span-1">
          <div className="text-center">
            {!isClockedIn ? (
              // Clock In Section
              <div>
                {!showClockInForm ? (
                  <button
                    onClick={() => setShowClockInForm(true)}
                    disabled={loading}
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-6 rounded-xl text-lg transition-colors flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <Play className="w-6 h-6" />
                    <span>Clock In</span>
                  </button>
                ) : (
                  <div className="bg-white bg-opacity-20 rounded-xl p-4 space-y-4">
                    <h4 className="font-semibold">Clock In Details</h4>
                    
                    <div className="text-left">
                      <label className="block text-sm text-blue-100 mb-1">Location</label>
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{location}</span>
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <label className="block text-sm text-blue-100 mb-1">Notes (Optional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-2 rounded text-gray-900 text-sm"
                        rows={2}
                        placeholder="Any notes for today..."
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleClockIn}
                        disabled={loading}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        {loading ? 'Clocking In...' : 'Confirm Clock In'}
                      </button>
                      <button
                        onClick={() => setShowClockInForm(false)}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Clock Out Section
              <div>
                {!showClockOutForm ? (
                  <button
                    onClick={() => setShowClockOutForm(true)}
                    disabled={loading}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <Square className="w-6 h-6" />
                    <span>Clock Out</span>
                  </button>
                ) : (
                  <div className="bg-white bg-opacity-20 rounded-xl p-4 space-y-4">
                    <h4 className="font-semibold">Clock Out Details</h4>
                    
                    <div className="text-left">
                      <p className="text-sm text-blue-100 mb-2">
                        Working for: {currentWorkingHours.toFixed(1)} hours
                      </p>
                    </div>
                    
                    <div className="text-left">
                      <label className="block text-sm text-blue-100 mb-1">End of Day Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-2 rounded text-gray-900 text-sm"
                        rows={2}
                        placeholder="Summary of today's work..."
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleClockOut}
                        disabled={loading}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        {loading ? 'Clocking Out...' : 'Confirm Clock Out'}
                      </button>
                      <button
                        onClick={() => setShowClockOutForm(false)}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {todayAttendance && (
              <div className="mt-4 text-sm text-blue-100">
                Status: <span className="font-medium capitalize">
                  {todayAttendance.status.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}