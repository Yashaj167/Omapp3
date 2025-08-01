import React, { useState, useEffect } from 'react';
import { X, Save, Receipt } from 'lucide-react';
import { Challan } from '../../types';
import { useChallans } from '../../hooks/useChallans';

interface EditChallanModalProps {
  isOpen: boolean;
  onClose: () => void;
  challan: Challan;
}

export function EditChallanModal({ isOpen, onClose, challan }: EditChallanModalProps) {
  const { updateChallan, loading } = useChallans();
  const [formData, setFormData] = useState({
    amount: '',
    notes: '',
    status: 'draft' as 'draft' | 'submitted' | 'approved' | 'rejected',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (challan) {
      setFormData({
        amount: challan.amount.toString(),
        notes: challan.notes || '',
        status: challan.status,
      });
    }
  }, [challan]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await updateChallan(challan.id, {
        amount: parseFloat(formData.amount),
        notes: formData.notes || undefined,
        status: formData.status,
      });
      
      onClose();
      setErrors({});
    } catch (error) {
      console.error('Error updating challan:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Receipt className="w-5 h-5 mr-2 text-purple-600" />
            Edit Challan - {challan.challanNumber}
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
            {/* Document Info (Read-only) */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Document: <span className="font-medium">{challan.documentId}</span></p>
              <p className="text-sm text-gray-600">Challan Number: <span className="font-medium">{challan.challanNumber}</span></p>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challan Amount (₹) *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter challan amount"
                min="0"
                disabled={challan.status === 'approved'}
              />
              {errors.amount && (
                <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={challan.status === 'approved'}
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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
                placeholder="Add any notes about this challan..."
              />
            </div>

            {challan.status === 'approved' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Note:</strong> This challan has been approved and cannot be modified.
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
              disabled={loading || challan.status === 'approved'}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Challan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}