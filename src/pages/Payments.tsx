import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  DollarSign,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.tsx';
import { usePayments } from '../hooks/usePayments.tsx';
import { PaymentStatus } from '../types';
import { format } from 'date-fns';
import { CreatePaymentModal } from '../components/Modals/CreatePaymentModal';
import { EditPaymentModal } from '../components/Modals/EditPaymentModal';

const statusColors: Record<PaymentStatus, string> = {
  'pending': 'bg-gray-100 text-gray-800',
  'partial': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-green-100 text-green-800',
  'refunded': 'bg-red-100 text-red-800',
};

const statusIcons: Record<PaymentStatus, React.ComponentType<any>> = {
  'pending': Clock,
  'partial': AlertCircle,
  'completed': CheckCircle,
  'refunded': AlertCircle,
};

export function Payments() {
  const { hasPermission, user } = useAuth();
  const { payments, loading } = usePayments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.documentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.challanNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter === 'all' || payment.paymentStatus === statusFilter;
    
    return matchesSearch && matchesFilter;
  });

  const canCreatePayment = hasPermission('payments', 'create');
  const canEditPayment = hasPermission('payments', 'update');
  const canEditAmounts = user?.role === 'main_admin';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentStats = () => {
    const totalPayments = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const paidAmount = payments.reduce((sum, p) => sum + p.paidAmount, 0);
    const pendingAmount = payments.reduce((sum, p) => sum + p.pendingAmount, 0);
    const completedCount = payments.filter(p => p.paymentStatus === 'completed').length;

    return { totalPayments, paidAmount, pendingAmount, completedCount };
  };

  const stats = getPaymentStats();

  const handleEditPayment = (payment: any) => {
    setSelectedPayment(payment);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Track all payments and manage financial records</p>
        </div>
        {canCreatePayment && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Payment
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalPayments)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.paidAmount)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.pendingAmount)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedCount}</p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
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
                placeholder="Search by payment ID, document ID, or challan number..."
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
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="completed">Completed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments List */}
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
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Payment ID</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Document</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Amount Details</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Payment Date</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => {
                  const StatusIcon = statusIcons[payment.paymentStatus];
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{payment.id}</p>
                            <p className="text-sm text-gray-500">
                              Challan: {payment.challanNumber || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{payment.documentId}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {payment.paymentMethod || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium">{formatCurrency(payment.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Paid:</span>
                            <span className="font-medium text-green-600">{formatCurrency(payment.paidAmount)}</span>
                          </div>
                          {payment.pendingAmount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Pending:</span>
                              <span className="font-medium text-orange-600">{formatCurrency(payment.pendingAmount)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="w-4 h-4" />
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[payment.paymentStatus]}`}>
                            {payment.paymentStatus.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {payment.paymentDate && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {format(payment.paymentDate, 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEditPayment && (
                            <button 
                              onClick={() => handleEditPayment(payment)}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first payment record'
              }
            </p>
          </div>
        )}
      </div>

      {/* Role-based Payment Editing Notice */}
      {!canEditAmounts && canEditPayment && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">Limited Edit Access</h3>
              <p className="text-sm text-amber-700 mt-1">
                You can update payment status and add notes, but Agreement Value and Consideration Amount can only be modified by the Main Admin.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Payment Modal */}
      <CreatePaymentModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit Payment Modal */}
      {selectedPayment && (
        <EditPaymentModal 
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
        />
      )}
    </div>
  );
}