import React, { useState } from 'react';
import { X, Calculator, Users, DollarSign, AlertCircle } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { useSalary } from '../../hooks/useSalary';

interface PayrollGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (month: number, year: number) => Promise<void>;
}

export function PayrollGeneratorModal({ isOpen, onClose, onGenerate }: PayrollGeneratorModalProps) {
  const { users } = useUsers();
  const { staffConfigs, getSalaryRecordsByPeriod, loading } = useSalary();
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const activeStaff = users.filter(u => u.isActive && u.role !== 'main_admin');
  const configuredStaff = activeStaff.filter(staff => 
    staffConfigs.some(config => config.userId === staff.id && config.isActive)
  );
  const unconfiguredStaff = activeStaff.filter(staff => 
    !staffConfigs.some(config => config.userId === staff.id && config.isActive)
  );

  const existingRecords = getSalaryRecordsByPeriod(formData.month, formData.year);
  const hasExistingPayroll = existingRecords.length > 0;

  const calculateTotalPayroll = () => {
    return configuredStaff.reduce((total, staff) => {
      const config = staffConfigs.find(c => c.userId === staff.id && c.isActive);
      if (!config) return total;
      
      const totalAllowances = config.allowances.reduce((sum, a) => sum + a.amount, 0);
      const totalDeductions = config.deductions.reduce((sum, d) => sum + d.amount, 0);
      const grossSalary = config.baseSalary + totalAllowances;
      const netSalary = grossSalary - totalDeductions;
      
      return total + netSalary;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onGenerate(formData.month, formData.year);
      onClose();
    } catch (error) {
      console.error('Error generating payroll:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-purple-600" />
            Generate Payroll
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Period Selection */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Select Pay Period</h4>
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

            {/* Staff Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Total Staff</p>
                    <p className="text-xl font-bold text-blue-900">{activeStaff.length}</p>
                  </div>
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Configured</p>
                    <p className="text-xl font-bold text-green-900">{configuredStaff.length}</p>
                  </div>
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">Not Configured</p>
                    <p className="text-xl font-bold text-orange-900">{unconfiguredStaff.length}</p>
                  </div>
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Estimated Payroll */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Estimated Total Payroll
              </h4>
              <p className="text-2xl font-bold text-green-600">
                ₹{calculateTotalPayroll().toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                For {configuredStaff.length} staff members
              </p>
            </div>

            {/* Warnings */}
            {unconfiguredStaff.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-orange-900 mb-2">
                      Unconfigured Staff Members
                    </h4>
                    <p className="text-sm text-orange-800 mb-2">
                      The following staff members don't have salary configuration:
                    </p>
                    <ul className="text-sm text-orange-800 space-y-1">
                      {unconfiguredStaff.map(staff => (
                        <li key={staff.id}>• {staff.name} ({staff.role.replace('_', ' ')})</li>
                      ))}
                    </ul>
                    <p className="text-sm text-orange-800 mt-2">
                      Please configure their salaries before generating payroll.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {hasExistingPayroll && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-900 mb-1">
                      Payroll Already Exists
                    </h4>
                    <p className="text-sm text-red-800">
                      Payroll for {new Date(formData.year, formData.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })} 
                      already exists with {existingRecords.length} records. Generating again will create duplicate records.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Process Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Payroll Generation Process</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Salary records will be created for all configured staff</li>
                <li>• Overtime will be calculated from attendance records</li>
                <li>• All records will be created in "Draft" status</li>
                <li>• You can review and edit before approval</li>
              </ul>
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
              disabled={loading || configuredStaff.length === 0}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Generate Payroll ({configuredStaff.length} staff)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}