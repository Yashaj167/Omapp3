import React, { useState } from 'react';
import { X, Save, CreditCard, Calculator } from 'lucide-react';
import { usePayments } from '../../hooks/usePayments';
import { useDocuments } from '../../hooks/useDocuments';

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string;
}

export function CreatePaymentModal({ isOpen, onClose, documentId }: CreatePaymentModalProps) {
  const { createPayment, loading } = usePayments();
  const { documents } = useDocuments();
  const [formData, setFormData] = useState({
    documentId: documentId || '',
    agreementValue: '',
    considerationAmount: '',
    dhcAmount: '',
    paidAmount: '',
    paymentMethod: 'cheque' as 'cash' | 'cheque' | 'online' | 'dd',
    paymentDate: new Date().toISOString().split('T')[0],
    challanNumber: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateDHC = () => {
    const consideration = parseFloat(formData.considerationAmount) || 0;
    const dhc = Math.round(consideration * 0.05);
    setFormData(prev => ({ ...prev, dhcAmount: dhc.toString() }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.documentId) {
      newErrors.documentId = 'Document selection is required';
    }
    if (!formData.agreementValue || parseFloat(formData.agreementValue) <= 0) {
      newErrors.agreementValue = 'Valid agreement value is required';
    }
    if (!formData.considerationAmount || parseFloat(formData.considerationAmount) <= 0) {
      newErrors.considerationAmount = 'Valid consideration amount is required';
    }
    if (!formData.dhcAmount || parseFloat(formData.dhcAmount) <= 0) {
      newErrors.dhcAmount = 'Valid DHC amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await createPayment({
        documentId: formData.documentId,
        agreementValue: parseFloat(formData.agreementValue),
        considerationAmount: parseFloat(formData.considerationAmount),
        dhcAmount: parseFloat(formData.dhcAmount),
        paidAmount: parseFloat(formData.paidAmount) || 0,
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate ? new Date(formData.paymentDate) : undefined,
        challanNumber: formData.challanNumber || undefined,
      });
      
      onClose();
      setFormData({
        documentId: '',
        agreementValue: '',
        considerationAmount: '',
        dhcAmount: '',
        paidAmount: '',
        paymentMethod: 'cheque',
        paymentDate: new Date().toISOString().split('T')[0],
        challanNumber: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-green-600" />
            Create Payment Record
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
            {/* Document Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Document *
              </label>
              <select
                value={formData.documentId}
                onChange={(e) => setFormData({...formData, documentId: e.target.value})}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.documentId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={!!documentId}
              >
                <option value="">Select a document</option>
                {documents.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.documentNumber} - {doc.customerName}
                  </option>
                ))}
              </select>
              {errors.documentId && (
                <p className="text-red-600 text-sm mt-1">{errors.documentId}</p>
              )}
            </div>

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
                }`}
                placeholder="Enter agreement value"
                min="0"
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
                }`}
                placeholder="Enter consideration amount"
                min="0"
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
                  }`}
                  placeholder="DHC amount"
                  min="0"
                />
                <button
                  type="button"
                  onClick={calculateDHC}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Calculate 5% of consideration amount"
                >
                  <Calculator className="w-4 h-4" />
                </button>
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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}