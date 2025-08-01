import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calculator } from 'lucide-react';
import { SalaryRecord } from '../../types/salary';
import { useSalary } from '../../hooks/useSalary';

interface EditSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: SalaryRecord;
}

export function EditSalaryModal({ isOpen, onClose, record }: EditSalaryModalProps) {
  const { updateSalaryRecord, loading } = useSalary();
  const [formData, setFormData] = useState({
    bonus: 0,
    overtimeHours: 0,
    notes: '',
    status: 'draft' as any,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (record) {
      setFormData({
        bonus: record.bonus,
        overtimeHours: record.overtime.reduce((sum, ot) => sum + ot.hours, 0),
        notes: record.notes || '',
        status: record.status,
      });
    }
  }, [record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const overtimeRecords = formData.overtimeHours > 0 ? [{
        id: `OT${Date.now()}`,
        date: record.payPeriod.endDate,
        hours: formData.overtimeHours,
        rate: record.overtime[0]?.rate || 200,
        amount: formData.overtimeHours * (record.overtime[0]?.rate || 200),
        description: 'Updated overtime entry'
      }] : [];

      // Recalculate totals
      const totalAllowances = record.allowances.reduce((sum, a) => sum + a.amount, 0);
      const totalDeductions = record.deductions.reduce((sum, d) => sum + d.amount, 0);
      const overtimeAmount = overtimeRecords.reduce((sum, ot) => sum + ot.amount, 0);
      
      const grossSalary = record.baseSalary + totalAllowances + overtimeAmount + formData.bonus;
      const netSalary = grossSalary - totalDeductions;

      await updateSalaryRecord(record.id, {
        bonus: formData.bonus,
        overtime: overtimeRecords,
        grossSalary,
        netSalary,
        notes: formData.notes,
        status: formData.status,
      });
      
      onClose();
      setErrors({});
    } catch (error) {
      console.error('Error updating salary record:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Edit Salary Record - {record.id}
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
            {/* Staff Info (Read-only) */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Staff: <span className="font-medium">{record.userName}</span></p>
              <p className="text-sm text-gray-600">Period: <span className="font-medium">
                {new Date(record.payPeriod.year, record.payPeriod.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span></p>
            </div>

            {/* Overtime Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overtime Hours
              </label>
              <input
                type="number"
                value={formData.overtimeHours}
                onChange={(e) => setFormData({...formData, overtimeHours: parseFloat(e.target.value) || 0})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
                step="0.5"
                disabled={record.status === 'paid'}
              />
            </div>

            {/* Bonus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bonus Amount (₹)
              </label>
              <input
                type="number"
                value={formData.bonus}
                onChange={(e) => setFormData({...formData, bonus: parseFloat(e.target.value) || 0})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
                disabled={record.status === 'paid'}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={record.status === 'paid'}
              >
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
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
                placeholder="Add any notes..."
                disabled={record.status === 'paid'}
              />
            </div>

            {record.status === 'paid' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Note:</strong> This salary record has been paid and cannot be modified.
                </p>
              </div>
            )}
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
              disabled={loading || record.status === 'paid'}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}