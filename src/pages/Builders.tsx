import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  User,
  Hash
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useBuilders } from '../hooks/useBuilders.tsx';
import { Builder } from '../types';
import { format } from 'date-fns';
import { EditBuilderModal } from '../components/Modals/EditBuilderModal';
import { CreateBuilderModal } from '../components/Modals/CreateBuilderModal';

export function Builders() {
  const { hasPermission } = useAuth();
  const { builders } = useBuilders();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);

  const filteredBuilders = builders.filter(builder => 
    builder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    builder.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    builder.phone.includes(searchTerm) ||
    builder.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    builder.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateBuilder = hasPermission('builders', 'create');
  const canEditBuilder = hasPermission('builders', 'update');

  const handleEditBuilder = (builder: Builder) => {
    setSelectedBuilder(builder);
    setShowEditModal(true);
  };

  const getBuilderStats = () => {
    const totalBuilders = builders.length;
    const withDocuments = builders.filter(b => b.documents.length > 0).length;
    const withoutDocuments = totalBuilders - withDocuments;
    const totalDocuments = builders.reduce((sum, b) => sum + b.documents.length, 0);

    return { totalBuilders, withDocuments, withoutDocuments, totalDocuments };
  };

  const stats = getBuilderStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Builders</h1>
          <p className="text-gray-600 mt-1">Manage builder relationships and project information</p>
        </div>
        {canCreateBuilder && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Builder
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Builders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBuilders}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Projects</p>
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
              <p className="text-sm text-gray-600">No Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withoutDocuments}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Building className="w-6 h-6 text-orange-600" />
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
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Building className="w-6 h-6 text-purple-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-purple-900 mb-2">Automatic Builder Creation</h3>
            <div className="text-sm text-purple-800 space-y-1">
              <p>• Builders are automatically created when you add new documents</p>
              <p>• Builder information is extracted from document details</p>
              <p>• Existing builders are automatically linked to new documents</p>
              <p>• You can manually edit builder information and add contact details using the edit button</p>
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
            placeholder="Search builders by name, contact person, phone, email, or registration number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Builders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBuilders.map((builder) => (
          <div key={builder.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{builder.name}</h3>
                    <p className="text-sm text-gray-500">Builder ID: {builder.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  {canEditBuilder && (
                    <button 
                      onClick={() => handleEditBuilder(builder)}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{builder.contactPerson}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{builder.phone}</span>
                </div>
                
                {builder.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{builder.email}</span>
                  </div>
                )}
                
                {builder.registrationNumber && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span>{builder.registrationNumber}</span>
                  </div>
                )}
                
                <div className="flex items-start space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{builder.address}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {builder.documents.length} document{builder.documents.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{format(builder.createdAt, 'MMM dd, yyyy')}</span>
                  </div>
                </div>

                {builder.documents.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Recent Documents:</p>
                    <div className="flex flex-wrap gap-1">
                      {builder.documents.slice(0, 4).map((docId) => (
                        <span key={docId} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                          {docId}
                        </span>
                      ))}
                      {builder.documents.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{builder.documents.length - 4} more
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

      {filteredBuilders.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No builders found</h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Try adjusting your search criteria'
              : 'Builders will appear here automatically when you create documents'
            }
          </p>
        </div>
      )}

      {/* Create Builder Modal */}
      <CreateBuilderModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit Builder Modal */}
      {selectedBuilder && (
        <EditBuilderModal 
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBuilder(null);
          }}
          builder={selectedBuilder}
        />
      )}
    </div>
  );
}