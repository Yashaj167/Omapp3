import React, { useState, useEffect } from 'react';
import { X, Save, CreditCard, Calculator } from 'lucide-react';
import { Payment } from '../../types';
import { usePayments } from '../../hooks/usePayments';
import { useAuth } from '../../hooks/useAuth';

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
}

export function EditPaymentModal({ isOpen, onClose, payment }: EditPaymentModalProps) {
  const { updatePayment, loading } = usePayments();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    agreementValue: '',
    considerationAmount: '',
    dhcAmount: '',
    paidAmount: '',
    paymentMethod: 'cheque' as 'cash' | 'cheque' | 'online' | 'dd',
    paymentDate: '',
    challanNumber: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const canEditAmounts = user?.role === 'main_admin';

  useEffect(() => {
    if (payment) {
      setFormData({
        agreementValue: payment.agreementValue.toString(),
        considerationAmount: payment.considerationAmount.toString(),
        dhcAmount: payment.dhcAmount.toString(),
        paidAmount: payment.paidAmount.toString(),
        paymentMethod: payment.paymentMethod || 'cheque',
        paymentDate: payment.paymentDate ? payment.paymentDate.toISOString().split('T')[0] : '',
        challanNumber: payment.challanNumber || '',
      });
    }
  }, [payment]);

  const calculateDHC = () => {
    const consideration = parseFloat(formData.considerationAmount) || 0;
    const dhc = Math.round(consideration * 0.05);
    setFormData(prev => ({ ...prev, dhcAmount: dhc.toString() }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (canEditAmounts) {
      if (!formData.agreementValue || parseFloat(formData.agreementValue) <= 0) {
        newErrors.agreementValue = 'Valid agreement value is required';
      }
      if (!formData.considerationAmount || parseFloat(formData.considerationAmount) <= 0) {
        newErrors.considerationAmount = 'Valid consideration amount is required';
      }
      if (!formData.dhcAmount || parseFloat(formData.dhcAmount) <= 0) {
        newErrors.dhcAmount = 'Valid DHC amount is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const updateData: Partial<Payment> = {
        paidAmount: parseFloat(formData.paidAmount) || 0,
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate ? new Date(formData.paymentDate) : undefined,
        challanNumber: formData.challanNumber || undefined,
      };

      // Only allow main admin to edit amounts
      if (canEditAmounts) {
        updateData.agreementValue = parseFloat(formData.agreementValue);
        updateData.considerationAmount = parseFloat(formData.considerationAmount);
        updateData.dhcAmount = parseFloat(formData.dhcAmount);
      }

      await updatePayment(payment.id, updateData);
      
      onClose();
      setErrors({});
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-green-600" />
            Edit Payment - {payment.id}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {!canEditAmounts && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> You can only edit payment status and details. Agreement values can only be modified by the Main Admin.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agreement Value (₹) *
              </label>
              <input
                type="number"
                value={formData.agreementValue}
                onChange={(e) => setFormData({...formData, agreementValue: e.target.value})}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.agreementValue ? 'border-red-300' : 'border-gray-300'
                } ${!canEditAmounts ? 'bg-gray-100' : ''}`}
                placeholder="Enter agreement value"
                min="0"
                disabled={!canEditAmounts}
              />
              {errors.agreementValue && (
                <p className="text-red-600 text-sm mt-1">{errors.agreementValue}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consideration Amount (₹) *
              </label>
              <input
                type="number"
                value={formData.considerationAmount}
                onChange={(e) => setFormData({...formData, considerationAmount: e.target.value})}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.considerationAmount ? 'border-red-300' : 'border-gray-300'
                } ${!canEditAmounts ? 'bg-gray-100' : ''}`}
                placeholder="Enter consideration amount"
                min="0"
                disabled={!canEditAmounts}
              />
              {errors.considerationAmount && (
                <p className="text-red-600 text-sm mt-1">{errors.considerationAmount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DHC Amount (₹) *
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={formData.dhcAmount}
                  onChange={(e) => setFormData({...formData, dhcAmount: e.target.value})}
                  className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.dhcAmount ? 'border-red-300' : 'border-gray-300'
                  } ${!canEditAmounts ? 'bg-gray-100' : ''}`}
                  placeholder="DHC amount"
                  min="0"
                  disabled={!canEditAmounts}
                />
                {canEditAmounts && (
                  <button
                    type="button"
                    onClick={calculateDHC}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Calculate 5% of consideration amount"
                  >
                    <Calculator className="w-4 h-4" />
                  </button>
                )}
              </div>
              {errors.dhcAmount && (
                <p className="text-red-600 text-sm mt-1">{errors.dhcAmount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid Amount (₹)
              </label>
              <input
                type="number"
                value={formData.paidAmount}
                onChange={(e) => setFormData({...formData, paidAmount: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Amount paid so far"
                min="0"
              />
            </div>

            {/* Payment Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online Transfer</option>
                <option value="dd">Demand Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challan Number
              </label>
              <input
                type="text"
                value={formData.challanNumber}
                onChange={(e) => setFormData({...formData, challanNumber: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter challan number if available"
              />
            </div>
          </div>

          {/* Summary */}
          {formData.considerationAmount && formData.dhcAmount && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Consideration Amount:</span>
                  <span>₹{parseFloat(formData.considerationAmount || '0').toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>DHC Amount:</span>
                  <span>₹{parseFloat(formData.dhcAmount || '0').toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total Amount:</span>
                  <span>₹{(parseFloat(formData.considerationAmount || '0') + parseFloat(formData.dhcAmount || '0')).toLocaleString('en-IN')}</span>
                </div>
                {formData.paidAmount && (
                  <div className="flex justify-between text-green-600">
                    <span>Paid Amount:</span>
                    <span>₹{parseFloat(formData.paidAmount).toLocaleString('en-IN')}</span>
                  </div>
                )}
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
              disabled={loading}
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
                  Update Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}