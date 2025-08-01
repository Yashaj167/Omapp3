import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Receipt,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Send,
  Download,
  Printer,
  DollarSign,
  Building,
  Phone,
  Mail,
  MapPin,
  Check,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useChallans } from '../hooks/useChallans.tsx';
import { useDocuments } from '../hooks/useDocuments.tsx';
import { useTasks } from '../hooks/useTasks.tsx';
import { Challan } from '../types';
import { format } from 'date-fns';
import { CreateChallanModal } from '../components/Modals/CreateChallanModal';
import { EditChallanModal } from '../components/Modals/EditChallanModal';

const statusColors = {
  'draft': 'bg-gray-100 text-gray-800 border-gray-300',
  'submitted': 'bg-blue-100 text-blue-800 border-blue-300',
  'approved': 'bg-green-100 text-green-800 border-green-300',
  'rejected': 'bg-red-100 text-red-800 border-red-300',
};

const statusIcons = {
  'draft': Clock,
  'submitted': Send,
  'approved': CheckCircle,
  'rejected': XCircle,
};

export function Challans() {
  const { hasPermission, user } = useAuth();
  const { challans, loading, submitChallan, approveChallan, rejectChallan } = useChallans();
  const { documents } = useDocuments();
  const { tasks, updateTaskStatus } = useTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'submitted' | 'approved' | 'rejected'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);

  const handleTaskStatusChange = async (taskId: string, newStatus: any) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const activeChallanTasks = tasks.filter(task => 
    task.type === 'challan_creation' && 
    (task.status === 'pending' || task.status === 'in_progress') &&
    task.assignedTo === user?.id
  );

  const filteredChallans = challans.filter(challan => {
    const matchesSearch = 
      challan.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.documentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.filledBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter === 'all' || challan.status === statusFilter;
    
    return matchesSearch && matchesFilter;
  });

  const canCreateChallan = hasPermission('challans', 'create') || user?.role === 'challan_staff';
  const canEditChallan = hasPermission('challans', 'update') || user?.role === 'challan_staff';
  const canApproveChallan = user?.role === 'main_admin' || user?.role === 'staff_admin';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalStats = () => {
    const total = challans.reduce((sum, challan) => sum + challan.amount, 0);
    const approved = challans.filter(c => c.status === 'approved').reduce((sum, challan) => sum + challan.amount, 0);
    const pending = challans.filter(c => c.status === 'submitted').reduce((sum, challan) => sum + challan.amount, 0);
    const draft = challans.filter(c => c.status === 'draft').reduce((sum, challan) => sum + challan.amount, 0);
    const rejected = challans.filter(c => c.status === 'rejected').reduce((sum, challan) => sum + challan.amount, 0);

    return { 
      total, 
      approved, 
      pending, 
      draft, 
      rejected,
      count: {
        total: challans.length,
        approved: challans.filter(c => c.status === 'approved').length,
        pending: challans.filter(c => c.status === 'submitted').length,
        draft: challans.filter(c => c.status === 'draft').length,
        rejected: challans.filter(c => c.status === 'rejected').length,
      }
    };
  };

  const stats = getTotalStats();

  const handleEditChallan = (challan: Challan) => {
    setSelectedChallan(challan);
    setShowEditModal(true);
  };

  const handleViewChallan = (challan: Challan) => {
    setSelectedChallan(challan);
    setShowDetailModal(true);
  };

  const handleSubmitChallan = async (challanId: string) => {
    try {
      await submitChallan(challanId);
    } catch (error) {
      console.error('Error submitting challan:', error);
    }
  };

  const handleApproveChallan = async (challanId: string) => {
    try {
      await approveChallan(challanId);
    } catch (error) {
      console.error('Error approving challan:', error);
    }
  };

  const handleRejectChallan = async (challanId: string) => {
    try {
      await rejectChallan(challanId);
    } catch (error) {
      console.error('Error rejecting challan:', error);
    }
  };

  const getDocumentDetails = (documentId: string) => {
    return documents.find(doc => doc.id === documentId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Challan Management</h1>
          <p className="text-gray-600 mt-1">Create, manage and track DHC challan forms</p>
        </div>
        {canCreateChallan && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Challan
          </button>
        )}
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{formatCurrency(stats.total)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.count.total} challans</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg">
              <Receipt className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg border border-green-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{formatCurrency(stats.approved)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.count.approved} challans</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl shadow-lg">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-lg border border-orange-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{formatCurrency(stats.pending)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.count.pending} challans</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl shadow-lg">
              <Clock className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent">{formatCurrency(stats.draft)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.count.draft} challans</p>
            </div>
            <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-4 rounded-xl shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-red-50 rounded-xl shadow-lg border border-red-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">{formatCurrency(stats.rejected)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.count.rejected} challans</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-xl shadow-lg">
              <XCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Tasks Notice */}
      {activeChallanTasks.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-blue-900 mb-3">Your Active Challan Tasks</h3>
              <div className="space-y-3">
                {activeChallanTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-blue-100 shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex-1">
                      <p className="font-bold text-blue-900 text-lg">{task.title}</p>
                      <p className="text-blue-700 mt-1">{task.description}</p>
                      {task.documentId && (
                        <p className="text-sm text-blue-600 mt-2 font-medium">📄 Document: {task.documentId}</p>
                      )}
                      {task.dueDate && (
                        <p className="text-sm text-blue-600 font-medium">⏰ Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-sm font-bold rounded-full shadow-sm ${
                        task.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleTaskStatusChange(task.id, 'in_progress')}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          Start Task
                        </button>
                      )}
                      {task.documentId && (
                        <button 
                          onClick={() => setShowCreateModal(true)}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          Create Challan
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                type="text"
                placeholder="Search by challan number, document ID, or filled by..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Filter className="w-5 h-5 text-gray-600" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Challans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredChallans.map((challan) => {
          const StatusIcon = statusIcons[challan.status];
          const documentDetails = getDocumentDetails(challan.documentId);
          
          return (
            <div key={challan.id} className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg hover:scale-102 transition-all duration-300 overflow-hidden">
              <div className="p-4 relative">
                {/* Status Indicator Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  challan.status === 'approved' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  challan.status === 'submitted' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                  challan.status === 'rejected' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                  'bg-gradient-to-r from-gray-400 to-gray-500'
                }`}></div>
                
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                      <Receipt className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{challan.challanNumber}</h3>
                      <p className="text-sm text-gray-600 font-medium">📄 {challan.documentId}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`p-1 rounded-lg ${
                      challan.status === 'approved' ? 'bg-green-100' :
                      challan.status === 'submitted' ? 'bg-blue-100' :
                      challan.status === 'rejected' ? 'bg-red-100' :
                      'bg-gray-100'
                    }`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${statusColors[challan.status]}`}>
                      {challan.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-semibold">💰 Amount</span>
                    <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{formatCurrency(challan.amount)}</span>
                  </div>
                </div>

                {/* Document Details */}
                {documentDetails && (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <div className="bg-blue-100 p-1 rounded-lg">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium truncate">{documentDetails.customerName}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <div className="bg-purple-100 p-1 rounded-lg">
                        <Building className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium truncate">{documentDetails.builderName}</span>
                    </div>
                    <div className="flex items-start space-x-2 text-sm text-gray-700">
                      <div className="bg-green-100 p-1 rounded-lg mt-0.5">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="line-clamp-1 font-medium text-xs">{documentDetails.propertyDetails}</span>
                    </div>
                  </div>
                )}

                {/* Challan Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <div className="bg-indigo-100 p-1 rounded-lg">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-medium text-xs">By: {challan.filledBy}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <div className="bg-orange-100 p-1 rounded-lg">
                      <Calendar className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="font-medium text-xs">{format(challan.filledAt, 'MMM dd')}</span>
                  </div>
                </div>

                {/* Notes */}
                {challan.notes && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-1 font-semibold">📝 Notes:</p>
                    <p className="text-xs text-gray-700 bg-gradient-to-r from-yellow-50 to-orange-50 p-2 rounded-lg border border-yellow-100 font-medium line-clamp-2">{challan.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleViewChallan(challan)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {canEditChallan && challan.status !== 'approved' && (
                      <button 
                        onClick={() => handleEditChallan(challan)}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-300"
                        title="Edit Challan"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-300" title="Print">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-300" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    {challan.status === 'draft' && canEditChallan && (
                      <button
                        onClick={() => handleSubmitChallan(challan.id)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Submit
                      </button>
                    )}
                    
                    {challan.status === 'submitted' && canApproveChallan && (
                      <>
                        <button
                          onClick={() => handleApproveChallan(challan.id)}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-2 py-1 rounded-lg text-xs font-bold transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRejectChallan(challan.id)}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-2 py-1 rounded-lg text-xs font-bold transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}

                    {challan.status === 'rejected' && canEditChallan && (
                      <button
                        onClick={() => handleEditChallan(challan)}
                        className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Revise
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && filteredChallans.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-gray-100">
          <div className="bg-gray-200 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Receipt className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No challans found</h3>
          <p className="text-gray-600 mb-6 text-lg">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first challan'
            }
          </p>
          {canCreateChallan && !searchTerm && statusFilter === 'all' && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center mx-auto transition-all duration-300 shadow-lg hover:shadow-xl font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Challan
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
        </div>
      )}

      {/* Role-based Access Notice */}
      {user?.role === 'challan_staff' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">Challan Staff Guidelines</h3>
              <div className="text-blue-800 space-y-2 font-medium">
                <p>• Create challans for documents that require DHC payment</p>
                <p>• Fill in accurate challan amounts based on consideration value</p>
                <p>• Submit challans for admin approval after completion</p>
                <p>• You can edit draft and rejected challans</p>
                <p>• Approved challans cannot be modified</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Challan Modal */}
      <CreateChallanModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit Challan Modal */}
      {selectedChallan && (
        <EditChallanModal 
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedChallan(null);
          }}
          challan={selectedChallan}
        />
      )}

      {/* Challan Detail Modal */}
      {selectedChallan && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${showDetailModal ? '' : 'hidden'}`}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-100">
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="bg-purple-500 p-2 rounded-lg mr-3">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                Challan Details - {selectedChallan.challanNumber}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Challan Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center">
                    <div className="bg-purple-100 p-2 rounded-lg mr-2">
                      <Receipt className="w-5 h-5 text-purple-600" />
                    </div>
                    Challan Information
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-600 font-semibold">Challan Number:</span>
                      <p className="font-bold text-lg text-gray-900">{selectedChallan.challanNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 font-semibold">Document ID:</span>
                      <p className="font-bold text-lg text-blue-600">{selectedChallan.documentId}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 font-semibold">Amount:</span>
                      <p className="font-bold text-2xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{formatCurrency(selectedChallan.amount)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 font-semibold">Status:</span>
                      <div className="flex items-center space-x-3 mt-2">
                        {React.createElement(statusIcons[selectedChallan.status], { className: "w-4 h-4" })}
                        <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full border-2 shadow-sm ${statusColors[selectedChallan.status]}`}>
                          {selectedChallan.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document & User Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg mr-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    Additional Information
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-600 font-semibold">Filled By:</span>
                      <p className="font-bold text-lg text-gray-900">{selectedChallan.filledBy}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 font-semibold">Date Filled:</span>
                      <p className="font-bold text-lg text-gray-900">{format(selectedChallan.filledAt, 'MMM dd, yyyy HH:mm')}</p>
                    </div>
                    {selectedChallan.notes && (
                      <div>
                        <span className="text-gray-600 font-semibold">Notes:</span>
                        <p className="font-medium text-gray-800 bg-yellow-50 p-3 rounded-xl border-2 border-yellow-100 mt-2">{selectedChallan.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Details */}
              {getDocumentDetails(selectedChallan.documentId) && (
                <div className="mt-8 pt-6 border-t-2 border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <div className="bg-green-100 p-2 rounded-lg mr-2">
                      <Building className="w-5 h-5 text-green-600" />
                    </div>
                    Related Document Details
                  </h4>
                  
                  {(() => {
                    const doc = getDocumentDetails(selectedChallan.documentId);
                    return doc ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <span className="text-gray-600 font-semibold">Customer:</span>
                          <p className="font-bold text-lg text-gray-900">{doc.customerName}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 font-semibold">Builder:</span>
                          <p className="font-bold text-lg text-gray-900">{doc.builderName}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-gray-600 font-semibold">Property:</span>
                          <p className="font-medium text-gray-800 bg-gray-50 p-3 rounded-xl border-2 border-gray-100 mt-2">{doc.propertyDetails}</p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-all duration-300 font-semibold"
                >
                  Close
                </button>
                <button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center shadow-lg hover:shadow-xl">
                  <Printer className="w-5 h-5 mr-2" />
                  Print Challan
                </button>
                <button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center shadow-lg hover:shadow-xl">
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}