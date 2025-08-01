import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Users, 
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Timer,
  Coffee,
  BarChart3,
  Filter,
  Search,
  Download,
  Plus,
  Eye,
  Edit,
  User,
  ClockIcon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAttendance } from '../hooks/useAttendance';
import { useUsers } from '../hooks/useUsers';
import { AttendanceStatus } from '../types/attendance';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { ClockInOutWidget } from '../components/Attendance/ClockInOutWidget';
import { AttendanceCalendar } from '../components/Attendance/AttendanceCalendar';
import { LeaveRequestModal } from '../components/Modals/LeaveRequestModal';
import { MarkAttendanceModal } from '../components/Modals/MarkAttendanceModal';

const statusColors: Record<AttendanceStatus, string> = {
  'present': 'bg-green-100 text-green-800 border-green-300',
  'absent': 'bg-red-100 text-red-800 border-red-300',
  'late': 'bg-orange-100 text-orange-800 border-orange-300',
  'half_day': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'on_leave': 'bg-blue-100 text-blue-800 border-blue-300',
  'holiday': 'bg-purple-100 text-purple-800 border-purple-300',
  'work_from_home': 'bg-indigo-100 text-indigo-800 border-indigo-300',
};

const statusIcons: Record<AttendanceStatus, React.ComponentType<any>> = {
  'present': CheckCircle,
  'absent': XCircle,
  'late': AlertCircle,
  'half_day': Clock,
  'on_leave': Calendar,
  'holiday': Calendar,
  'work_from_home': MapPin,
};

export function Attendance() {
  const { user, hasPermission } = useAuth();
  const { users } = useUsers();
  const { 
    attendanceRecords, 
    leaveRequests,
    getTodayAttendance,
    getUserAttendanceStats,
    getAttendanceByDateRange,
    isUserClockedIn,
    getCurrentWorkingHours,
    loading 
  } = useAttendance();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedUser, setSelectedUser] = useState<string>(user?.id || '');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('month');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user?.role === 'main_admin' || user?.role === 'staff_admin';
  const canManageAttendance = hasPermission('attendance', 'manage') || isAdmin;

  // Get date range for stats
  const getDateRange = () => {
    const today = new Date();
    switch (dateRange) {
      case 'today':
        return { start: today, end: today };
      case 'week':
        const weekStart = subDays(today, 7);
        return { start: weekStart, end: today };
      case 'month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      default:
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Get attendance stats for current user or selected user
  const targetUserId = isAdmin ? selectedUser : user?.id || '';
  const attendanceStats = getUserAttendanceStats(targetUserId, startDate, endDate);
  const todayAttendance = getTodayAttendance(targetUserId);
  const isClockedIn = isUserClockedIn(targetUserId);
  const currentWorkingHours = getCurrentWorkingHours(targetUserId);

  // Filter attendance records
  const filteredRecords = getAttendanceByDateRange(startDate, endDate, isAdmin ? undefined : user?.id)
    .filter(record => {
      const matchesSearch = 
        record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.userRole.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  // Get pending leave requests
  const pendingLeaves = leaveRequests.filter(req => req.status === 'pending');
  const myLeaves = leaveRequests.filter(req => req.userId === user?.id);

  const formatTime = (date: Date | undefined) => {
    return date ? format(date, 'HH:mm') : '--:--';
  };

  const formatHours = (hours: number | undefined) => {
    return hours ? `${hours.toFixed(1)}h` : '0h';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Attendance</h1>
          <p className="text-gray-600 mt-1">Track working hours and manage attendance</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button 
            onClick={() => setShowLeaveModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Request Leave
          </button>
          {canManageAttendance && (
            <button 
              onClick={() => setShowMarkAttendanceModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Mark Attendance
            </button>
          )}
        </div>
      </div>

      {/* Clock In/Out Widget */}
      <ClockInOutWidget />

      {/* Today's Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Status</p>
              <p className="text-lg font-bold text-gray-900">
                {todayAttendance ? (
                  <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${statusColors[todayAttendance.status]}`}>
                    {todayAttendance.status.replace('_', ' ').toUpperCase()}
                  </span>
                ) : (
                  <span className="text-gray-400">Not Marked</span>
                )}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clock In Time</p>
              <p className="text-lg font-bold text-gray-900">
                {formatTime(todayAttendance?.clockInTime)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Working Hours</p>
              <p className="text-lg font-bold text-gray-900">
                {isClockedIn ? formatHours(currentWorkingHours) : formatHours(todayAttendance?.totalHours)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Timer className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-lg font-bold text-gray-900">
                {attendanceStats.attendancePercentage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Statistics</h3>
            <div className="flex items-center space-x-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
              </select>
              {isAdmin && (
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Users</option>
                  {users.filter(u => u.isActive).map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{attendanceStats.presentDays}</p>
              <p className="text-sm text-green-700">Present Days</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{attendanceStats.absentDays}</p>
              <p className="text-sm text-red-700">Absent Days</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{attendanceStats.lateDays}</p>
              <p className="text-sm text-orange-700">Late Days</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{formatHours(attendanceStats.totalHours)}</p>
              <p className="text-sm text-blue-700">Total Hours</p>
            </div>
          </div>
        </div>

        {/* Leave Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Leave Requests</h3>
            {isAdmin && pendingLeaves.length > 0 && (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                {pendingLeaves.length} Pending
              </span>
            )}
          </div>

          <div className="space-y-3">
            {(isAdmin ? pendingLeaves.slice(0, 5) : myLeaves.slice(0, 5)).map((leave) => (
              <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{leave.userName}</p>
                  <p className="text-sm text-gray-600">
                    {leave.leaveType.replace('_', ' ')} • {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(leave.startDate, 'MMM dd')} - {format(leave.endDate, 'MMM dd')}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {leave.status.toUpperCase()}
                </span>
              </div>
            ))}
            
            {(isAdmin ? pendingLeaves : myLeaves).length === 0 && (
              <div className="text-center py-6">
                <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No leave requests</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Calendar */}
      <AttendanceCalendar 
        userId={targetUserId}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />

      {/* Attendance Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm flex items-center transition-colors">
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Staff Member</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Date</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Clock In</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Clock Out</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Hours</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Status</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record) => {
                const StatusIcon = statusIcons[record.status];
                return (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{record.userName}</p>
                          <p className="text-sm text-gray-500 capitalize">
                            {record.userRole.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {format(record.date, 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {formatTime(record.clockInTime)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {formatTime(record.clockOutTime)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="text-gray-900">{formatHours(record.totalHours)}</span>
                        {record.overtime && record.overtime > 0 && (
                          <span className="text-green-600 ml-1">
                            (+{formatHours(record.overtime)} OT)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="w-4 h-4" />
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[record.status]}`}>
                          {record.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManageAttendance && (
                          <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'Attendance records will appear here'
              }
            </p>
          </div>
        )}
      </div>

      {/* Leave Request Modal */}
      <LeaveRequestModal 
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
      />

      {/* Mark Attendance Modal */}
      {canManageAttendance && (
        <MarkAttendanceModal 
          isOpen={showMarkAttendanceModal}
          onClose={() => setShowMarkAttendanceModal(false)}
        />
      )}
    </div>
  );
}