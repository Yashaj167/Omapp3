import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Download,
  Calendar,
  User,
  Building,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { useDocuments } from '../hooks/useDocuments.tsx';
import { DocumentStatus } from '../types';
import { format } from 'date-fns';
import { CreateDocumentModal } from '../components/Modals/CreateDocumentModal';
import { EditDocumentModal } from '../components/Modals/EditDocumentModal';
import { MobileDocumentList } from '../components/Mobile/MobileDocumentList';

// Hook to detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

const statusColors: Record<DocumentStatus, string> = {
  'pending_collection': 'bg-gray-100 text-gray-800',
  'collected': 'bg-blue-100 text-blue-800',
  'data_entry_pending': 'bg-yellow-100 text-yellow-800',
  'data_entry_completed': 'bg-indigo-100 text-indigo-800',
  'registration_pending': 'bg-purple-100 text-purple-800',
  'registered': 'bg-green-100 text-green-800',
  'ready_for_delivery': 'bg-orange-100 text-orange-800',
  'delivered': 'bg-emerald-100 text-emerald-800',
};

export function Documents() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { documents, loading } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const isMobile = useIsMobile();

  // Return mobile version if on mobile
  if (isMobile) {
    return (
      <div className="space-y-6">
        <MobileDocumentList />
        
        {/* Create Document Modal */}
        <CreateDocumentModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />

        {/* Edit Document Modal */}
        {selectedDocument && (
          <EditDocumentModal 
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedDocument(null);
            }}
            document={selectedDocument}
          />
        )}
      </div>
    );
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.builderName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter === 'all' || doc.status === statusFilter;
    
    return matchesSearch && matchesFilter;
  });

  const canCreateDocument = hasPermission('documents', 'create');
  const canEditDocument = hasPermission('documents', 'update');

  const handleViewDocument = (id: string) => {
    navigate(`/documents/${id}`);
  };

  const handleEditDocument = (document: any) => {
    setSelectedDocument(document);
    setShowEditModal(true);
  };

  const handleDownloadDocument = (id: string) => {
    // Implement document download functionality
    console.log('Downloading document:', id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Manage all your documents and track their progress</p>
        </div>
        {canCreateDocument && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Document
          </button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Collection</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'pending_collection').length}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(d => ['collected', 'data_entry_pending', 'data_entry_completed', 'registration_pending'].includes(d.status)).length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Edit className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'delivered').length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by document number, customer name, or builder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'all')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
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
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Document</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Customer</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Builder</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Created</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{document.documentNumber}</p>
                          <p className="text-sm text-gray-500 capitalize">
                            {document.documentType.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{document.customerName}</p>
                          <p className="text-sm text-gray-500">{document.customerPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{document.builderName}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{document.propertyDetails}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[document.status]}`}>
                        {document.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {format(document.createdAt, 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleViewDocument(document.id)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEditDocument && (
                          <button 
                            onClick={() => handleEditDocument(document)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Document"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDownloadDocument(document.id)}
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first document'
              }
            </p>
          </div>
        )}
      </div>

      {/* Create Document Modal */}
      <CreateDocumentModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit Document Modal */}
      {selectedDocument && (
        <EditDocumentModal 
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDocument(null);
          }}
          document={selectedDocument}
        />
      )}
    </div>
  );
}