import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useCustomers } from '../hooks/useCustomers.tsx';
import { Customer } from '../types';
import { format } from 'date-fns';
import { EditCustomerModal } from '../components/Modals/EditCustomerModal';
import { CreateCustomerModal } from '../components/Modals/CreateCustomerModal';

export function Customers() {
  const { hasPermission } = useAuth();
  const { customers } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateCustomer = hasPermission('customers', 'create');
  const canEditCustomer = hasPermission('customers', 'update');

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const getCustomerStats = () => {
    const totalCustomers = customers.length;
    const withDocuments = customers.filter(c => c.documents.length > 0).length;
    const withoutDocuments = totalCustomers - withDocuments;
    const totalDocuments = customers.reduce((sum, c) => sum + c.documents.length, 0);

    return { totalCustomers, withDocuments, withoutDocuments, totalDocuments };
  };

  const stats = getCustomerStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage customer information and relationships</p>
        </div>
        {canCreateCustomer && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Customer
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">With Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withDocuments}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Without Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withoutDocuments}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <User className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Auto-save Notice */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <User className="w-6 h-6 text-green-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-green-900 mb-2">Automatic Customer Creation</h3>
            <div className="text-sm text-green-800 space-y-1">
              <p>• Customers are automatically created when you add new documents</p>
              <p>• Customer information is extracted from document details</p>
              <p>• Existing customers are automatically linked to new documents</p>
              <p>• You can manually edit customer information anytime using the edit button</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name, phone, email, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  {canEditCustomer && (
                    <button 
                      onClick={() => handleEditCustomer(customer)}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-500">Customer ID: {customer.id}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{customer.phone}</span>
                  </div>
                  
                  {customer.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{customer.address}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {customer.documents.length} document{customer.documents.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{format(customer.createdAt, 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>

                {customer.documents.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Recent Documents:</p>
                    <div className="flex flex-wrap gap-1">
                      {customer.documents.slice(0, 3).map((docId) => (
                        <span key={docId} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {docId}
                        </span>
                      ))}
                      {customer.documents.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{customer.documents.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Try adjusting your search criteria'
              : 'Customers will appear here automatically when you create documents'
            }
          </p>
        </div>
      )}

      {/* Create Customer Modal */}
      <CreateCustomerModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit Customer Modal */}
      {selectedCustomer && (
        <EditCustomerModal 
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
        />
      )}
    </div>
  );
}