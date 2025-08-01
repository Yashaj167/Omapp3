import React, { useState } from 'react';
import { X, Save, User, Building, FileText, MapPin, ChevronDown } from 'lucide-react';
import { DocumentType } from '../../types';
import { useDocuments } from '../../hooks/useDocuments';
import { useCustomers } from '../../hooks/useCustomers';
import { useBuilders } from '../../hooks/useBuilders';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateDocumentModal({ isOpen, onClose }: CreateDocumentModalProps) {
  const { createDocument, loading } = useDocuments();
  const { customers } = useCustomers();
  const { builders } = useBuilders();
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    builderName: '',
    propertyDetails: '',
    documentType: 'agreement' as DocumentType,
    assignedTo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showBuilderDropdown, setShowBuilderDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [filteredBuilders, setFilteredBuilders] = useState<any[]>([]);

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

  const handleCustomerNameChange = (value: string) => {
    setFormData({...formData, customerName: value});
    
    if (value.length >= 3) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setShowCustomerDropdown(filtered.length > 0);
    } else {
      setShowCustomerDropdown(false);
      setFilteredCustomers([]);
    }
  };

  const handleBuilderNameChange = (value: string) => {
    setFormData({...formData, builderName: value});
    
    if (value.length >= 3) {
      const filtered = builders.filter(builder =>
        builder.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredBuilders(filtered);
      setShowBuilderDropdown(filtered.length > 0);
    } else {
      setShowBuilderDropdown(false);
      setFilteredBuilders([]);
    }
  };

  const selectCustomer = (customer: any) => {
    setFormData({
      ...formData,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email || '',
    });
    setShowCustomerDropdown(false);
    setFilteredCustomers([]);
  };

  const selectBuilder = (builder: any) => {
    setFormData({
      ...formData,
      builderName: builder.name,
    });
    setShowBuilderDropdown(false);
    setFilteredBuilders([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await createDocument(formData);
      onClose();
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        builderName: '',
        propertyDetails: '',
        documentType: 'agreement',
        assignedTo: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-orange-600" />
            Create New Document
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
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => handleCustomerNameChange(e.target.value)}
                    onFocus={() => {
                      if (formData.customerName.length >= 3 && filteredCustomers.length > 0) {
                        setShowCustomerDropdown(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding dropdown to allow for selection
                      setTimeout(() => setShowCustomerDropdown(false), 200);
                    }}
                    className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.customerName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Type customer name (3+ letters for suggestions)"
                  />
                  {formData.customerName.length >= 3 && (
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  )}
                </div>
                
                {/* Customer Dropdown */}
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => selectCustomer(customer)}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.phone}</p>
                            {customer.email && (
                              <p className="text-xs text-gray-400">{customer.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
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

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Builder Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.builderName}
                    onChange={(e) => handleBuilderNameChange(e.target.value)}
                    onFocus={() => {
                      if (formData.builderName.length >= 3 && filteredBuilders.length > 0) {
                        setShowBuilderDropdown(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding dropdown to allow for selection
                      setTimeout(() => setShowBuilderDropdown(false), 200);
                    }}
                    className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.builderName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Type builder name (3+ letters for suggestions)"
                  />
                  {formData.builderName.length >= 3 && (
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  )}
                </div>
                
                {/* Builder Dropdown */}
                {showBuilderDropdown && filteredBuilders.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredBuilders.map((builder) => (
                      <div
                        key={builder.id}
                        onClick={() => selectBuilder(builder)}
                        className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Building className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{builder.name}</p>
                            <p className="text-sm text-gray-500">{builder.contactPerson}</p>
                            <p className="text-xs text-gray-400">{builder.phone}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
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

          {/* Smart Suggestions Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Smart Auto-Complete</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Type 3+ letters in Customer or Builder name fields to see suggestions</p>
                  <p>• Select from existing records to auto-fill contact details</p>
                  <p>• New customers and builders are automatically created if not found</p>
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
              className="bg-gradient-primary hover:opacity-90 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}