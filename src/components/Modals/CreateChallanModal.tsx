import React, { useState } from 'react';
import { X, Save, Receipt } from 'lucide-react';
import { useChallans } from '../../hooks/useChallans';
import { useDocuments } from '../../hooks/useDocuments';

interface CreateChallanModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string;
}

export function CreateChallanModal({ isOpen, onClose, documentId }: CreateChallanModalProps) {
  const { createChallan, loading } = useChallans();
  const { documents } = useDocuments();
  const [formData, setFormData] = useState({
    documentId: documentId || '',
    amount: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.documentId) {
      newErrors.documentId = 'Document selection is required';
    }
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
      await createChallan({
        documentId: formData.documentId,
        amount: parseFloat(formData.amount),
        notes: formData.notes || undefined,
      });
      
      onClose();
      setFormData({
        documentId: '',
        amount: '',
        notes: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating challan:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Receipt className="w-5 h-5 mr-2 text-purple-600" />
            Create New Challan
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
            {/* Document Selection */}
            <div>
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
              />
              {errors.amount && (
                <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
              )}
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
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Challan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}