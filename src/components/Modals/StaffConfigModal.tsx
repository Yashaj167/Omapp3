import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Plus, Trash2, User, Building, CreditCard } from 'lucide-react';
import { useSalary } from '../../hooks/useSalary';
import { User as UserType } from '../../types';
import { PaymentMethod, AllowanceType, DeductionType } from '../../types/salary';

interface StaffConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
}

const allowanceTypes: { value: AllowanceType; label: string }[] = [
  { value: 'house_rent', label: 'House Rent Allowance' },
  { value: 'transport', label: 'Transport Allowance' },
  { value: 'medical', label: 'Medical Allowance' },
  { value: 'food', label: 'Food Allowance' },
  { value: 'performance', label: 'Performance Allowance' },
  { value: 'special', label: 'Special Allowance' },
  { value: 'other', label: 'Other Allowance' },
];

const deductionTypes: { value: DeductionType; label: string }[] = [
  { value: 'tax', label: 'Income Tax' },
  { value: 'provident_fund', label: 'Provident Fund' },
  { value: 'insurance', label: 'Insurance Premium' },
  { value: 'loan', label: 'Loan Deduction' },
  { value: 'advance', label: 'Advance Deduction' },
  { value: 'late_penalty', label: 'Late Penalty' },
  { value: 'other', label: 'Other Deduction' },
];

export function StaffConfigModal({ isOpen, onClose, user }: StaffConfigModalProps) {
  const { createStaffConfig, updateStaffConfig, getStaffConfig, loading } = useSalary();
  const [formData, setFormData] = useState({
    baseSalary: 0,
    allowances: [] as any[],
    deductions: [] as any[],
    overtimeRate: 0,
    paymentMethod: 'bank_transfer' as PaymentMethod,
    bankDetails: {
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      accountHolderName: '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const existingConfig = getStaffConfig(user.id);

  useEffect(() => {
    if (existingConfig) {
      setFormData({
        baseSalary: existingConfig.baseSalary,
        allowances: existingConfig.allowances,
        deductions: existingConfig.deductions,
        overtimeRate: existingConfig.overtimeRate,
        paymentMethod: existingConfig.paymentMethod,
        bankDetails: existingConfig.bankDetails || {
          accountNumber: '',
          bankName: '',
          ifscCode: '',
          accountHolderName: '',
        },
      });
    }
  }, [existingConfig]);

  const addAllowance = () => {
    setFormData({
      ...formData,
      allowances: [...formData.allowances, {
        id: `ALL${Date.now()}`,
        type: 'house_rent',
        amount: 0,
        description: '',
      }]
    });
  };

  const removeAllowance = (index: number) => {
    setFormData({
      ...formData,
      allowances: formData.allowances.filter((_, i) => i !== index)
    });
  };

  const updateAllowance = (index: number, field: string, value: any) => {
    const updated = [...formData.allowances];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, allowances: updated });
  };

  const addDeduction = () => {
    setFormData({
      ...formData,
      deductions: [...formData.deductions, {
        id: `DED${Date.now()}`,
        type: 'tax',
        amount: 0,
        description: '',
      }]
    });
  };

  const removeDeduction = (index: number) => {
    setFormData({
      ...formData,
      deductions: formData.deductions.filter((_, i) => i !== index)
    });
  };

  const updateDeduction = (index: number, field: string, value: any) => {
    const updated = [...formData.deductions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, deductions: updated });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.baseSalary <= 0) {
      newErrors.baseSalary = 'Base salary must be greater than 0';
    }

    if (formData.paymentMethod === 'bank_transfer') {
      if (!formData.bankDetails.accountNumber) {
        newErrors.accountNumber = 'Account number is required for bank transfer';
      }
      if (!formData.bankDetails.bankName) {
        newErrors.bankName = 'Bank name is required';
      }
      if (!formData.bankDetails.ifscCode) {
        newErrors.ifscCode = 'IFSC code is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const configData = {
        userId: user.id,
        baseSalary: formData.baseSalary,
        allowances: formData.allowances,
        deductions: formData.deductions,
        overtimeRate: formData.overtimeRate,
        paymentMethod: formData.paymentMethod,
        bankDetails: formData.paymentMethod === 'bank_transfer' ? formData.bankDetails : undefined,
      };

      if (existingConfig) {
        await updateStaffConfig(existingConfig.id, configData);
      } else {
        await createStaffConfig(configData);
      }
      
      onClose();
      setErrors({});
    } catch (error) {
      console.error('Error saving staff configuration:', error);
    }
  };

  const calculateGrossSalary = () => {
    const totalAllowances = formData.allowances.reduce((sum, a) => sum + a.amount, 0);
    return formData.baseSalary + totalAllowances;
  };

  const calculateNetSalary = () => {
    const gross = calculateGrossSalary();
    const totalDeductions = formData.deductions.reduce((sum, d) => sum + d.amount, 0);
    return gross - totalDeductions;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Salary Configuration - {user.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Salary Configuration */}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <User className="w-4 h-4 mr-2 text-blue-600" />
                  Basic Salary Information
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Salary (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({...formData, baseSalary: parseFloat(e.target.value) || 0})}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.baseSalary ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter base salary"
                      min="0"
                    />
                    {errors.baseSalary && (
                      <p className="text-red-600 text-sm mt-1">{errors.baseSalary}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overtime Rate (₹/hour)
                    </label>
                    <input
                      type="number"
                      value={formData.overtimeRate}
                      onChange={(e) => setFormData({...formData, overtimeRate: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter overtime rate"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method *
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              {formData.paymentMethod === 'bank_transfer' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                    <Building className="w-4 h-4 mr-2 text-purple-600" />
                    Bank Details
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.accountHolderName}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value }
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter account holder name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.accountNumber}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                        })}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.accountNumber ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter account number"
                      />
                      {errors.accountNumber && (
                        <p className="text-red-600 text-sm mt-1">{errors.accountNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.bankName}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                        })}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.bankName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter bank name"
                      />
                      {errors.bankName && (
                        <p className="text-red-600 text-sm mt-1">{errors.bankName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IFSC Code *
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.ifscCode}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, ifscCode: e.target.value.toUpperCase() }
                        })}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.ifscCode ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter IFSC code"
                      />
                      {errors.ifscCode && (
                        <p className="text-red-600 text-sm mt-1">{errors.ifscCode}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Allowances and Deductions */}
            <div className="space-y-6">
              {/* Allowances */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Allowances</h4>
                  <button
                    type="button"
                    onClick={addAllowance}
                    className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-lg text-sm flex items-center transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.allowances.map((allowance, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg">
                      <select
                        value={allowance.type}
                        onChange={(e) => updateAllowance(index, 'type', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded text-sm"
                      >
                        {allowanceTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={allowance.amount}
                        onChange={(e) => updateAllowance(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-24 p-2 border border-gray-300 rounded text-sm"
                        placeholder="Amount"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => removeAllowance(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {formData.allowances.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No allowances added</p>
                  )}
                </div>
              </div>

              {/* Deductions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Deductions</h4>
                  <button
                    type="button"
                    onClick={addDeduction}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-sm flex items-center transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.deductions.map((deduction, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg">
                      <select
                        value={deduction.type}
                        onChange={(e) => updateDeduction(index, 'type', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded text-sm"
                      >
                        {deductionTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={deduction.amount}
                        onChange={(e) => updateDeduction(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-24 p-2 border border-gray-300 rounded text-sm"
                        placeholder="Amount"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => removeDeduction(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {formData.deductions.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No deductions added</p>
                  )}
                </div>
              </div>

              {/* Salary Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Salary Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Salary:</span>
                    <span>₹{formData.baseSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Allowances:</span>
                    <span className="text-green-600">
                      +₹{formData.allowances.reduce((sum, a) => sum + a.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Deductions:</span>
                    <span className="text-red-600">
                      -₹{formData.deductions.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Net Salary:</span>
                    <span className="text-blue-600">₹{calculateNetSalary().toLocaleString()}</span>
                  </div>
                </div>
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
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {existingConfig ? 'Update Configuration' : 'Save Configuration'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}