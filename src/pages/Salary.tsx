import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Send,
  Calculator,
  CreditCard,
  Building,
  TrendingUp,
  Users,
  Banknote,
  FileText,
  Settings
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSalary } from '../hooks/useSalary';
import { useUsers } from '../hooks/useUsers';
import { SalaryStatus, PaymentMethod } from '../types/salary';
import { format } from 'date-fns';
import { CreateSalaryModal } from '../components/Modals/CreateSalaryModal';
import { EditSalaryModal } from '../components/Modals/EditSalaryModal';
import { StaffConfigModal } from '../components/Modals/StaffConfigModal';
import { PayrollGeneratorModal } from '../components/Modals/PayrollGeneratorModal';

const statusColors: Record<SalaryStatus, string> = {
  'draft': 'bg-gray-100 text-gray-800 border-gray-300',
  'pending_approval': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'approved': 'bg-blue-100 text-blue-800 border-blue-300',
  'paid': 'bg-green-100 text-green-800 border-green-300',
  'cancelled': 'bg-red-100 text-red-800 border-red-300',
};

const statusIcons: Record<SalaryStatus, React.ComponentType<any>> = {
  'draft': FileText,
  'pending_approval': Clock,
  'approved': CheckCircle,
  'paid': Banknote,
  'cancelled': AlertCircle,
};

const paymentMethodIcons: Record<PaymentMethod, React.ComponentType<any>> = {
  'bank_transfer': Building,
  'cash': DollarSign,
  'cheque': FileText,
  'upi': CreditCard,
};

export function Salary() {
  const { user, hasPermission } = useAuth();
  const { users } = useUsers();
  const { 
    salaryRecords, 
    staffConfigs,
    loading, 
    getSalaryStats,
    approveSalary,
    paySalary,
    generatePayroll
  } = useSalary();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SalaryStatus | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState<number>(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const isAdmin = user?.role === 'main_admin' || user?.role === 'staff_admin';
  const canManageSalary = hasPermission('salary', 'manage') || isAdmin;
  const canApproveSalary = user?.role === 'main_admin';

  const filteredRecords = salaryRecords.filter(record => {
    const matchesSearch = 
      record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.userRole.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesPeriod = record.payPeriod.month === monthFilter && record.payPeriod.year === yearFilter;

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const stats = getSalaryStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleEditRecord = (record: any) => {
    setSelectedRecord(record);
    setShowEditModal(true);
  };

  const handleConfigureStaff = (userId: string) => {
    const userDetails = users.find(u => u.id === userId);
    setSelectedUser(userDetails);
    setShowConfigModal(true);
  };

  const handleApprove = async (recordId: string) => {
    try {
      await approveSalary(recordId);
    } catch (error) {
      console.error('Error approving salary:', error);
    }
  };

  const handlePay = async (recordId: string) => {
    try {
      await paySalary(recordId);
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  const handleGeneratePayroll = async (month: number, year: number) => {
    try {
      await generatePayroll(month, year);
      setMonthFilter(month);
      setYearFilter(year);
    } catch (error) {
      console.error('Error generating payroll:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Management</h1>
          <p className="text-gray-600 mt-1">Manage staff salaries and payroll processing</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {canManageSalary && (
            <>
              <button 
                onClick={() => setShowPayrollModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Generate Payroll
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Salary Record
              </button>
            </>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Payroll</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalMonthlySalary)}
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
              <p className="text-sm text-gray-600">Paid This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalPaidThisMonth)}
              </p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalPendingPayments)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Staff Configuration Section */}
      {canManageSalary && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Staff Salary Configuration</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All Configurations
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.filter(u => u.isActive && u.role !== 'main_admin').map(staff => {
              const config = staffConfigs.find(c => c.userId === staff.id && c.isActive);
              return (
                <div key={staff.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{staff.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{staff.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConfigureStaff(staff.id)}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  {config ? (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Salary:</span>
                        <span className="font-medium">{formatCurrency(config.baseSalary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Allowances:</span>
                        <span className="font-medium">
                          {formatCurrency(config.allowances.reduce((sum, a) => sum + a.amount, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">OT Rate:</span>
                        <span className="font-medium">₹{config.overtimeRate}/hr</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-500">Not configured</p>
                      <button
                        onClick={() => handleConfigureStaff(staff.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-1"
                      >
                        Configure Salary
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SalaryStatus | 'all')}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="flex space-x-2">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(parseInt(e.target.value))}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {format(new Date(2024, i, 1), 'MMMM')}
                </option>
              ))}
            </select>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(parseInt(e.target.value))}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* Salary Records */}
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
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Staff Member</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Period</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Salary Details</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Payment</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => {
                  const StatusIcon = statusIcons[record.status];
                  const PaymentIcon = paymentMethodIcons[record.paymentMethod];
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {record.userName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{record.userName}</p>
                            <p className="text-sm text-gray-500 capitalize">
                              {record.userRole.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {format(new Date(record.payPeriod.year, record.payPeriod.month - 1), 'MMMM yyyy')}
                            </p>
                            <p className="text-sm text-gray-500">
                              Pay Date: {format(record.payDate, 'MMM dd')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Base:</span>
                            <span className="font-medium">{formatCurrency(record.baseSalary)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Gross:</span>
                            <span className="font-medium text-blue-600">{formatCurrency(record.grossSalary)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Net:</span>
                            <span className="font-medium text-green-600">{formatCurrency(record.netSalary)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <PaymentIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 capitalize">
                            {record.paymentMethod.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="w-4 h-4" />
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${statusColors[record.status]}`}>
                            {record.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {canManageSalary && record.status === 'draft' && (
                            <button 
                              onClick={() => handleEditRecord(record)}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {canApproveSalary && record.status === 'pending_approval' && (
                            <button
                              onClick={() => handleApprove(record.id)}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve Salary"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {canManageSalary && record.status === 'approved' && (
                            <button
                              onClick={() => handlePay(record.id)}
                              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Mark as Paid"
                            >
                              <Banknote className="w-4 h-4" />
                            </button>
                          )}

                          <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No salary records found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Generate payroll to create salary records'
              }
            </p>
          </div>
        )}
      </div>

      {/* Salary Management Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <DollarSign className="w-6 h-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">Salary Management Process</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Configure Staff:</strong> Set base salary, allowances, and deductions for each staff member</p>
              <p>• <strong>Generate Payroll:</strong> Automatically calculate salaries based on attendance and overtime</p>
              <p>• <strong>Review & Approve:</strong> Main Admin reviews and approves salary records</p>
              <p>• <strong>Process Payment:</strong> Mark salaries as paid after bank transfer/payment</p>
              <p>• <strong>Download Reports:</strong> Generate payslips and payroll reports</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Salary Modal */}
      <CreateSalaryModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit Salary Modal */}
      {selectedRecord && (
        <EditSalaryModal 
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
        />
      )}

      {/* Staff Config Modal */}
      {selectedUser && (
        <StaffConfigModal 
          isOpen={showConfigModal}
          onClose={() => {
            setShowConfigModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
        />
      )}

      {/* Payroll Generator Modal */}
      <PayrollGeneratorModal 
        isOpen={showPayrollModal}
        onClose={() => setShowPayrollModal(false)}
        onGenerate={handleGeneratePayroll}
      />
    </div>
  );
}