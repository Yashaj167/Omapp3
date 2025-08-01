import React, { useState } from 'react';
import { X, Save, Clock, User } from 'lucide-react';
import { useAttendance } from '../../hooks/useAttendance';
import { useUsers } from '../../hooks/useUsers';
import { AttendanceStatus } from '../../types/attendance';
import { format } from 'date-fns';

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const statusOptions: { value: AttendanceStatus; label: string; description: string }[] = [
  {
    value: 'present',
    label: 'Present',
    description: 'Employee was present for full day'
  },
  {
    value: 'absent',
    label: 'Absent',
    description: 'Employee was absent without notice'
  },
  {
    value: 'late',
    label: 'Late',
    description: 'Employee arrived late but worked full day'
  },
  {
    value: 'half_day',
    label: 'Half Day',
    description: 'Employee worked only half day'
  },
  {
    value: 'on_leave',
    label: 'On Leave',
    description: 'Employee was on approved leave'
  },
  {
    value: 'work_from_home',
    label: 'Work From Home',
    description: 'Employee worked from home'
  },
];

export function MarkAttendanceModal({ isOpen, onClose }: MarkAttendanceModalProps) {
  const { markAttendance, loading } = useAttendance();
  const { users } = useUsers();
  const [formData, setFormData] = useState({
    userId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'present' as AttendanceStatus,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.userId) {
      newErrors.userId = 'Please select a staff member';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await markAttendance(
        formData.userId,
        new Date(formData.date),
        formData.status,
        formData.notes || undefined
      );
      
      onClose();
      setFormData({
        userId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'present',
        notes: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  if (!isOpen) return null;

  const selectedUser = users.find(u => u.id === formData.userId);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-green-600" />
            Mark Attendance
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Staff Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staff Member *
              </label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData({...formData, userId: e.target.value})}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.userId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select staff member</option>
                {users.filter(u => u.isActive).map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
              {errors.userId && (
                <p className="text-red-600 text-sm mt-1">{errors.userId}</p>
              )}
            </div>

            {/* Selected User Info */}
            {selectedUser && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedUser.name}</p>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {selectedUser.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.date ? 'border-red-300' : 'border-gray-300'
                }`}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
              {errors.date && (
                <p className="text-red-600 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attendance Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as AttendanceStatus})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {statusOptions.find(o => o.value === formData.status)?.description}
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                placeholder="Add any additional notes about this attendance record..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Marking...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Mark Attendance
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}