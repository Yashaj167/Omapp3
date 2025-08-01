import React, { useState, useEffect } from 'react';
import { X, Save, User, Building, FileText, MapPin } from 'lucide-react';
import { Document, DocumentType, DocumentStatus } from '../../types';
import { useDocuments } from '../../hooks/useDocuments';

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

export function EditDocumentModal({ isOpen, onClose, document }: EditDocumentModalProps) {
  const { updateDocument, loading } = useDocuments();
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    builderName: '',
    propertyDetails: '',
    documentType: 'agreement' as DocumentType,
    status: 'pending_collection' as DocumentStatus,
    assignedTo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (document) {
      setFormData({
        customerName: document.customerName,
        customerPhone: document.customerPhone,
        customerEmail: document.customerEmail || '',
        builderName: document.builderName,
        propertyDetails: document.propertyDetails,
        documentType: document.documentType,
        status: document.status,
        assignedTo: document.assignedTo || '',
      });
    }
  }, [document]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    }
    if (!formData.builderName.trim()) {
      newErrors.builderName = 'Builder name is required';
    }
    if (!formData.propertyDetails.trim()) {
      newErrors.propertyDetails = 'Property details are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await updateDocument(document.id, {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || undefined,
        builderName: formData.builderName,
        propertyDetails: formData.propertyDetails,
        documentType: formData.documentType,
        status: formData.status,
        assignedTo: formData.assignedTo || undefined,
      });
      
      onClose();
      setErrors({});
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Edit Document - {document.documentNumber}
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
            {/* Customer Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <User className="w-4 h-4 mr-2 text-green-600" />
                Customer Information
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.customerName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter customer name"
                />
                {errors.customerName && (
                  <p className="text-red-600 text-sm mt-1">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.customerPhone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
                {errors.customerPhone && (
                  <p className="text-red-600 text-sm mt-1">{errors.customerPhone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Document Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Building className="w-4 h-4 mr-2 text-purple-600" />
                Document Information
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type *
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({...formData, documentType: e.target.value as DocumentType})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="agreement">Agreement</option>
                  <option value="lease_deed">Lease Deed</option>
                  <option value="sale_deed">Sale Deed</option>
                  <option value="mutation">Mutation</option>
                  <option value="partition_deed">Partition Deed</option>
                  <option value="gift_deed">Gift Deed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as DocumentStatus})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending_collection">Pending Collection</option>
                  <option value="collected">Collected</option>
                  <option value="data_entry_pending">Data Entry Pending</option>
                  <option value="data_entry_completed">Data Entry Completed</option>
                  <option value="registration_pending">Registration Pending</option>
                  <option value="registered">Registered</option>
                  <option value="ready_for_delivery">Ready for Delivery</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Builder Name *
                </label>
                <input
                  type="text"
                  value={formData.builderName}
                  onChange={(e) => setFormData({...formData, builderName: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.builderName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter builder name"
                />
                {errors.builderName && (
                  <p className="text-red-600 text-sm mt-1">{errors.builderName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned To
                </label>
                <input
                  type="text"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Assign to staff member"
                />
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-orange-600" />
              Property Details *
            </label>
            <textarea
              value={formData.propertyDetails}
              onChange={(e) => setFormData({...formData, propertyDetails: e.target.value})}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                errors.propertyDetails ? 'border-red-300' : 'border-gray-300'
              }`}
              rows={3}
              placeholder="Enter complete property details including address, plot number, etc."
            />
            {errors.propertyDetails && (
              <p className="text-red-600 text-sm mt-1">{errors.propertyDetails}</p>
            )}
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
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}