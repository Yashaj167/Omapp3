import React, { useState } from 'react';
import { X, Save, Calendar, AlertCircle } from 'lucide-react';
import { useAttendance } from '../../hooks/useAttendance';
import { LeaveType } from '../../types/attendance';
import { format, differenceInDays } from 'date-fns';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const leaveTypes: { value: LeaveType; label: string; description: string }[] = [
  {
    value: 'sick_leave',
    label: 'Sick Leave',
    description: 'Medical reasons or illness'
  },
  {
    value: 'casual_leave',
    label: 'Casual Leave',
    description: 'Personal work or urgent matters'
  },
  {
    value: 'annual_leave',
    label: 'Annual Leave',
    description: 'Vacation or planned time off'
  },
  {
    value: 'emergency_leave',
    label: 'Emergency Leave',
    description: 'Unexpected urgent situations'
  },
  {
    value: 'maternity_leave',
    label: 'Maternity Leave',
    description: 'Maternity-related time off'
  },
  {
    value: 'paternity_leave',
    label: 'Paternity Leave',
    description: 'Paternity-related time off'
  },
];

export function LeaveRequestModal({ isOpen, onClose }: LeaveRequestModalProps) {
  const { submitLeaveRequest, loading } = useAttendance();
  const [formData, setFormData] = useState({
    leaveType: 'casual_leave' as LeaveType,
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateTotalDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      return differenceInDays(end, start) + 1;
    }
    return 0;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await submitLeaveRequest({
        leaveType: formData.leaveType,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        totalDays: calculateTotalDays(),
        reason: formData.reason,
      });
      
      onClose();
      setFormData({
        leaveType: 'casual_leave',
        startDate: '',
        endDate: '',
        reason: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting leave request:', error);
    }
  };

  if (!isOpen) return null;

  const totalDays = calculateTotalDays();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Request Leave
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
            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type *
              </label>
              <select
                value={formData.leaveType}
                onChange={(e) => setFormData({...formData, leaveType: e.target.value as LeaveType})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {leaveTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {leaveTypes.find(t => t.value === formData.leaveType)?.description}
              </p>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.startDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                {errors.startDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.endDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  min={formData.startDate || format(new Date(), 'yyyy-MM-dd')}
                />
                {errors.endDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Total Days Display */}
            {totalDays > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Total Days:</strong> {totalDays} day{totalDays > 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                  errors.reason ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={4}
                placeholder="Please provide a detailed reason for your leave request..."
              />
              {errors.reason && (
                <p className="text-red-600 text-sm mt-1">{errors.reason}</p>
              )}
            </div>
          </div>

          {/* Important Notice */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-900 mb-1">Important Notice</h4>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Leave requests should be submitted at least 24 hours in advance</li>
                  <li>• Emergency leaves can be applied retrospectively with proper documentation</li>
                  <li>• Your request will be reviewed by your supervisor</li>
                  <li>• You will be notified once your request is approved or rejected</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
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
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}