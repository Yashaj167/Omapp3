import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  User,
  Shield,
  Calendar,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useUsers } from '../hooks/useUsers.tsx';
import { User as UserType, UserRole } from '../types';
import { format } from 'date-fns';
import { CreateUserModal } from '../components/Modals/CreateUserModal';
import { EditUserModal } from '../components/Modals/EditUserModal';
import { UserPermissionsModal } from '../components/Modals/UserPermissionsModal';
import { TaskPermissionsModal } from '../components/Modals/TaskPermissionsModal';
import { useTasks } from '../hooks/useTasks';

const roleColors: Record<UserRole, string> = {
  'main_admin': 'bg-red-100 text-red-800',
  'staff_admin': 'bg-orange-100 text-orange-800',
  'challan_staff': 'bg-blue-100 text-blue-800',
  'field_collection_staff': 'bg-green-100 text-green-800',
  'data_entry_staff': 'bg-purple-100 text-purple-800',
  'document_delivery_staff': 'bg-indigo-100 text-indigo-800',
};

const roleLabels: Record<UserRole, string> = {
  'main_admin': 'Main Admin',
  'staff_admin': 'Staff Admin',
  'challan_staff': 'Challan Staff',
  'field_collection_staff': 'Field Collection',
  'data_entry_staff': 'Data Entry',
  'document_delivery_staff': 'Document Delivery',
};

export function Users() {
  const { hasPermission, user: currentUser } = useAuth();
  const { users, createUser, updateUser, updateUserPermissions, toggleUserStatus } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showTaskPermissionsModal, setShowTaskPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const { getUserTaskPermissions, updateTaskPermissions } = useTasks();

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const canCreateUser = hasPermission('users', 'create');
  const canEditUser = hasPermission('users', 'update');
  const canManagePermissions = currentUser?.role === 'main_admin';

  const handleCreateUser = async (userData: any) => {
    await createUser(userData);
  };

  const handleEditUser = (user: UserType) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (userId: string, userData: any) => {
    await updateUser(userId, userData);
  };

  const handleManagePermissions = (user: UserType) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
  };

  const handleManageTaskPermissions = (user: UserType) => {
    setSelectedUser(user);
    setShowTaskPermissionsModal(true);
  };

  const handleUpdatePermissions = async (userId: string, permissions: any[]) => {
    await updateUserPermissions(userId, permissions);
  };

  const handleUpdateTaskPermissions = async (userId: string, permissions: any[]) => {
    await updateTaskPermissions(userId, permissions);
  };

  const handleToggleStatus = async (userId: string) => {
    await toggleUserStatus(userId);
  };

  const getUserStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;
    const recentLogins = users.filter(u => u.lastLogin && u.lastLogin > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

    return { totalUsers, activeUsers, inactiveUsers, recentLogins };
  };

  const stats = getUserStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
        </div>
        {canCreateUser && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New User
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactiveUsers}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recent Logins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentLogins}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
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
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="main_admin">Main Admin</option>
              <option value="staff_admin">Staff Admin</option>
              <option value="challan_staff">Challan Staff</option>
              <option value="field_collection_staff">Field Collection</option>
              <option value="data_entry_staff">Data Entry</option>
              <option value="document_delivery_staff">Document Delivery</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">User</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Role</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Last Login</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Created</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {user.isActive ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-700">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-700">Inactive</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.lastLogin ? (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {format(user.lastLogin, 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {format(user.createdAt, 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEditUser && (
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canManagePermissions && (
                        <button 
                          onClick={() => handleManagePermissions(user)}
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Manage Permissions"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      )}
                      {canManagePermissions && (
                        <button 
                          onClick={() => handleManageTaskPermissions(user)}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Manage Task Permissions"
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>
                      )}
                      {canEditUser && user.role !== 'main_admin' && user.id !== currentUser?.id && (
                        <button 
                          onClick={() => handleToggleStatus(user.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.isActive 
                              ? 'text-gray-500 hover:text-red-600 hover:bg-red-50' 
                              : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={user.isActive ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first user'
              }
            </p>
          </div>
        )}
      </div>

      {/* Permission Management Note */}
      {canManagePermissions && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">Permission Management</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• <strong>Main Admin:</strong> Full system access - cannot be modified</p>
                <p>• <strong>Staff Admin:</strong> Permissions dynamically assigned by Main Admin</p>
                <p>• <strong>Challan Staff:</strong> Can fill challan details but cannot modify agreement values</p>
                <p>• <strong>Field Collection Staff:</strong> Limited to collection status updates and file uploads</p>
                <p>• <strong>Data Entry Staff:</strong> Limited to data entry tasks for assigned documents</p>
                <p>• <strong>Document Delivery Staff:</strong> Limited to delivery status and proof uploads</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <CreateUserModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateUser={handleCreateUser}
      />

      {/* Edit User Modal */}
      {selectedUser && (
        <EditUserModal 
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUpdateUser={handleUpdateUser}
          currentUser={currentUser!}
        />
      )}

      {/* User Permissions Modal */}
      {selectedUser && (
        <UserPermissionsModal 
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUpdatePermissions={handleUpdatePermissions}
        />
      )}

      {/* Task Permissions Modal */}
      {selectedUser && (
        <TaskPermissionsModal 
          isOpen={showTaskPermissionsModal}
          onClose={() => {
            setShowTaskPermissionsModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUpdatePermissions={handleUpdateTaskPermissions}
          currentPermissions={getUserTaskPermissions(selectedUser.id)}
        />
      )}
    </div>
  );
}