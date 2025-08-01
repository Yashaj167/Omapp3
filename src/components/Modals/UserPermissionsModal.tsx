import React, { useState, useEffect } from 'react';
import { X, Save, Shield, Check, AlertCircle } from 'lucide-react';
import { User as UserType, Permission } from '../../types';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onUpdatePermissions: (userId: string, permissions: Permission[]) => Promise<void>;
}

const modulePermissions = [
  {
    module: 'documents',
    label: 'Documents',
    description: 'Manage document records and workflow',
    actions: [
      { action: 'create', label: 'Create Documents' },
      { action: 'read', label: 'View Documents' },
      { action: 'update', label: 'Edit Documents' },
      { action: 'delete', label: 'Delete Documents' },
    ]
  },
  {
    module: 'payments',
    label: 'Payments',
    description: 'Manage payment records and transactions',
    actions: [
      { action: 'create', label: 'Create Payments' },
      { action: 'read', label: 'View Payments' },
      { action: 'update', label: 'Edit Payments' },
      { action: 'delete', label: 'Delete Payments' },
    ]
  },
  {
    module: 'challans',
    label: 'Challans',
    description: 'Manage challan forms and submissions',
    actions: [
      { action: 'create', label: 'Create Challans' },
      { action: 'read', label: 'View Challans' },
      { action: 'update', label: 'Edit Challans' },
      { action: 'approve', label: 'Approve Challans' },
    ]
  },
  {
    module: 'customers',
    label: 'Customers',
    description: 'Manage customer information',
    actions: [
      { action: 'create', label: 'Create Customers' },
      { action: 'read', label: 'View Customers' },
      { action: 'update', label: 'Edit Customers' },
      { action: 'delete', label: 'Delete Customers' },
    ]
  },
  {
    module: 'builders',
    label: 'Builders',
    description: 'Manage builder information',
    actions: [
      { action: 'create', label: 'Create Builders' },
      { action: 'read', label: 'View Builders' },
      { action: 'update', label: 'Edit Builders' },
      { action: 'delete', label: 'Delete Builders' },
    ]
  },
  {
    module: 'users',
    label: 'Users',
    description: 'Manage system users (Staff Admin only)',
    actions: [
      { action: 'create', label: 'Create Users' },
      { action: 'read', label: 'View Users' },
      { action: 'update', label: 'Edit Users' },
      { action: 'delete', label: 'Delete Users' },
    ]
  },
];

export function UserPermissionsModal({ isOpen, onClose, user, onUpdatePermissions }: UserPermissionsModalProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Initialize permissions based on user's current permissions
      const allPermissions: Permission[] = [];
      let permissionId = 1;

      modulePermissions.forEach(module => {
        module.actions.forEach(action => {
          const existingPermission = user.permissions.find(
            p => p.module === module.module && p.action === action.action
          );
          
          allPermissions.push({
            id: existingPermission?.id || permissionId.toString(),
            module: module.module,
            action: action.action,
            granted: existingPermission?.granted || false,
          });
          permissionId++;
        });
      });

      setPermissions(allPermissions);
    }
  }, [user]);

  const handlePermissionChange = (module: string, action: string, granted: boolean) => {
    setPermissions(prev => 
      prev.map(p => 
        p.module === module && p.action === action 
          ? { ...p, granted }
          : p
      )
    );
  };

  const handleSelectAll = (module: string, granted: boolean) => {
    setPermissions(prev => 
      prev.map(p => 
        p.module === module ? { ...p, granted } : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      await onUpdatePermissions(user.id, permissions);
      onClose();
    } catch (error) {
      console.error('Error updating permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModulePermissions = (module: string) => {
    return permissions.filter(p => p.module === module);
  };

  const isModuleFullyGranted = (module: string) => {
    const modulePerms = getModulePermissions(module);
    return modulePerms.length > 0 && modulePerms.every(p => p.granted);
  };

  const isModulePartiallyGranted = (module: string) => {
    const modulePerms = getModulePermissions(module);
    return modulePerms.some(p => p.granted) && !modulePerms.every(p => p.granted);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-green-600" />
            Manage Permissions - {user.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{user.name}</h4>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-medium text-gray-900 capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Role Restrictions */}
          {user.role === 'main_admin' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-900 mb-1">Main Admin Account</h4>
                  <p className="text-sm text-red-800">
                    Main Admin has full system access. Permissions cannot be modified.
                  </p>
                </div>
              </div>
            </div>
          )}

          {user.role !== 'main_admin' && (
            <>
              {/* Permissions Grid */}
              <div className="space-y-6">
                {modulePermissions.map(module => {
                  const modulePerms = getModulePermissions(module.module);
                  const isFullyGranted = isModuleFullyGranted(module.module);
                  const isPartiallyGranted = isModulePartiallyGranted(module.module);

                  // Hide users module for non-staff-admin roles
                  if (module.module === 'users' && user.role !== 'staff_admin') {
                    return null;
                  }

                  return (
                    <div key={module.module} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{module.label}</h4>
                            <p className="text-sm text-gray-600">{module.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleSelectAll(module.module, true)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Grant All
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              type="button"
                              onClick={() => handleSelectAll(module.module, false)}
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Revoke All
                            </button>
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              isFullyGranted 
                                ? 'bg-green-500 border-green-500' 
                                : isPartiallyGranted 
                                ? 'bg-yellow-500 border-yellow-500'
                                : 'border-gray-300'
                            }`}>
                              {isFullyGranted && <Check className="w-3 h-3 text-white" />}
                              {isPartiallyGranted && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {module.actions.map(action => {
                            const permission = modulePerms.find(p => p.action === action.action);
                            return (
                              <label key={action.action} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={permission?.granted || false}
                                  onChange={(e) => handlePermissionChange(module.module, action.action, e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{action.label}</p>
                                  <p className="text-xs text-gray-500">{module.module}.{action.action}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Permission Summary */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Permission Summary</h4>
                <div className="text-sm text-blue-800">
                  <p>Total Permissions: {permissions.length}</p>
                  <p>Granted: {permissions.filter(p => p.granted).length}</p>
                  <p>Revoked: {permissions.filter(p => !p.granted).length}</p>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            {user.role !== 'main_admin' && (
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Permissions
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}