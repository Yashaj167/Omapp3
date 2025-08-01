import React, { useState } from 'react';
import { Search, Filter, FileText, User, Building, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '../../hooks/useDocuments';
import { DocumentStatus } from '../../types';
import { format } from 'date-fns';
import { MobileListItem } from './MobileListItem';

const statusColors: Record<DocumentStatus, string> = {
  'pending_collection': 'bg-orange-100 text-orange-800',
  'collected': 'bg-blue-100 text-blue-800',
  'data_entry_pending': 'bg-yellow-100 text-yellow-800',
  'data_entry_completed': 'bg-indigo-100 text-indigo-800',
  'registration_pending': 'bg-purple-100 text-purple-800',
  'registered': 'bg-green-100 text-green-800',
  'ready_for_delivery': 'bg-orange-100 text-orange-800',
  'delivered': 'bg-emerald-100 text-emerald-800',
};

export function MobileDocumentList() {
  const navigate = useNavigate();
  const { documents, loading } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.builderName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter === 'all' || doc.status === statusFilter;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
      </button>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'all')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      )}

      {/* Document List */}
      <div className="space-y-3">
        {filteredDocuments.map((document) => (
          <MobileListItem
            key={document.id}
            title={document.documentNumber}
            subtitle={`${document.customerName} • ${document.customerPhone}`}
            description={`${document.builderName} • ${document.propertyDetails}`}
            icon={FileText}
            badge={document.status.replace('_', ' ').toUpperCase()}
            badgeColor={statusColors[document.status]}
            onClick={() => navigate(`/documents/${document.id}`)}
            avatar={
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
            }
          />
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500 text-sm">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first document'
            }
          </p>
        </div>
      )}
    </div>
  );
}