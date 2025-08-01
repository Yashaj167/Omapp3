import React, { useState } from 'react';
import { X, Save, DollarSign, User, Calculator, Plus, Trash2 } from 'lucide-react';
import { useSalary } from '../../hooks/useSalary';
import { useUsers } from '../../hooks/useUsers';
import { PaymentMethod, AllowanceType, DeductionType } from '../../types/salary';

interface CreateSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSalaryModal({ isOpen, onClose }: CreateSalaryModalProps) {
  const { createSalaryRecord, getStaffConfig, loading } = useSalary();
  const { users } = useUsers();
  
  const [formData, setFormData] = useState({
    userId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    bonus: 0,
    overtimeHours: 0,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.userId) {
      newErrors.userId = 'Please select a staff member';
    }

    const config = getStaffConfig(formData.userId);
    if (!config) {
      newErrors.userId = 'Staff member salary not configured';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const selectedUser = users.find(u => u.id === formData.userId);
      const config = getStaffConfig(formData.userId);
      
      if (!selectedUser || !config) return;

      const startDate = new Date(formData.year, formData.month - 1, 1);
      const endDate = new Date(formData.year, formData.month, 0);
      const payDate = new Date(formData.year, formData.month, 5);

      const overtimeRecords = formData.overtimeHours > 0 ? [{
        id: `OT${Date.now()}`,
        date: endDate,
        hours: formData.overtimeHours,
        rate: config.overtimeRate,
        amount: formData.overtimeHours * config.overtimeRate,
        description: 'Manual overtime entry'
      }] : [];

      await createSalaryRecord({
        userId: formData.userId,
        userName: selectedUser.name,
        userRole: selectedUser.role,
        overtime: overtimeRecords,
        bonus: formData.bonus,
        payPeriod: {
          month: formData.month,
          year: formData.year,
          startDate,
          endDate,
        },
        payDate,
        notes: formData.notes,
      });
      
      onClose();
      setFormData({
        userId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        bonus: 0,
        overtimeHours: 0,
        notes: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating salary record:', error);
    }
  };

  const selectedConfig = formData.userId ? getStaffConfig(formData.userId) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Create Salary Record
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <User className="w-4 h-4 mr-2 text-blue-600" />
                Basic Information
              </h4>
              
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
                  {users.filter(u => u.isActive && u.role !== 'main_admin').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                {errors.userId && (
                  <p className="text-red-600 text-sm mt-1">{errors.userId}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month *
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2024, i, 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year *
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Components */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Calculator className="w-4 h-4 mr-2 text-green-600" />
                Additional Components
              </h4>

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
                />
                {selectedConfig && (
                  <p className="text-xs text-gray-500 mt-1">
                    Rate: ₹{selectedConfig.overtimeRate}/hour
                  </p>
                )}
              </div>

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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="Add any notes about this salary record..."
                />
              </div>
            </div>
          </div>

          {/* Salary Preview */}
          {selectedConfig && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Salary Calculation Preview</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-2">Base Components</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Base Salary:</span>
                      <span>₹{selectedConfig.baseSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Allowances:</span>
                      <span>₹{selectedConfig.allowances.reduce((sum, a) => sum + a.amount, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overtime:</span>
                      <span>₹{(formData.overtimeHours * selectedConfig.overtimeRate).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bonus:</span>
                      <span>₹{formData.bonus.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-600 mb-2">Deductions</p>
                  <div className="space-y-1">
                    {selectedConfig.deductions.map((deduction, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="capitalize">{deduction.type.replace('_', ' ')}:</span>
                        <span>₹{deduction.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-600 mb-2">Summary</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Gross Salary:</span>
                      <span className="font-medium text-blue-600">
                        ₹{(selectedConfig.baseSalary + 
                           selectedConfig.allowances.reduce((sum, a) => sum + a.amount, 0) + 
                           (formData.overtimeHours * selectedConfig.overtimeRate) + 
                           formData.bonus).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Deductions:</span>
                      <span className="text-red-600">
                        ₹{selectedConfig.deductions.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Net Salary:</span>
                      <span className="text-green-600">
                        ₹{(selectedConfig.baseSalary + 
                           selectedConfig.allowances.reduce((sum, a) => sum + a.amount, 0) + 
                           (formData.overtimeHours * selectedConfig.overtimeRate) + 
                           formData.bonus - 
                           selectedConfig.deductions.reduce((sum, d) => sum + d.amount, 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              disabled={loading || !selectedConfig}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Salary Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}