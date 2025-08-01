import React, { useState, useEffect } from 'react';
import { X, Save, Shield, CheckSquare, AlertCircle } from 'lucide-react';
import { TaskPermission, TaskType } from '../../types/task';
import { User } from '../../types';

interface TaskPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdatePermissions: (userId: string, permissions: TaskPermission[]) => Promise<void>;
  currentPermissions: TaskPermission[];
}

const taskTypes: { type: TaskType; label: string; description: string }[] = [
  {
    type: 'document_collection',
    label: 'Document Collection',
    description: 'Field collection of documents from customers'
  },
  {
    type: 'data_entry',
    label: 'Data Entry',
    description: 'Entering document data into the system'
  },
  {
    type: 'document_delivery',
    label: 'Document Delivery',
    description: 'Delivering completed documents to customers'
  },
  {
    type: 'challan_creation',
    label: 'Challan Creation',
    description: 'Creating and managing challan forms'
  },
  {
    type: 'payment_processing',
    label: 'Payment Processing',
    description: 'Processing and tracking payments'
  },
  {
    type: 'customer_follow_up',
    label: 'Customer Follow Up',
    description: 'Following up with customers for various requirements'
  },
  {
    type: 'document_verification',
    label: 'Document Verification',
    description: 'Verifying document accuracy and completeness'
  },
  {
    type: 'registration_follow_up',
    label: 'Registration Follow Up',
    description: 'Following up on document registration status'
  },
  {
    type: 'quality_check',
    label: 'Quality Check',
    description: 'Quality assurance and review tasks'
  },
  {
    type: 'custom',
    label: 'Custom Tasks',
    description: 'General purpose and custom tasks'
  },
];

export function TaskPermissionsModal({ 
  isOpen, 
  onClose, 
  user, 
  onUpdatePermissions, 
  currentPermissions 
}: TaskPermissionsModalProps) {
  const [permissions, setPermissions] = useState<TaskPermission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      // Initialize permissions for all task types
      const allPermissions: TaskPermission[] = taskTypes.map(taskType => {
        const existing = currentPermissions.find(p => p.taskType === taskType.type);
        return existing || {
          id: `${user.id}-${taskType.type}`,
          userId: user.id,
          taskType: taskType.type,
          permissions: {
            canView: false,
            canCreate: false,
            canEdit: false,
            canDelete: false,
            canAssign: false,
            canComment: false,
            canChangeStatus: false,
            canViewAllTasks: false,
            canEditPriority: false,
            canSetDueDate: false,
            canAddAttachments: false,
            canViewComments: false,
          },
          restrictions: {
            maxTasksPerDay: 10,
            allowedStatuses: ['pending', 'in_progress', 'completed'],
            canOnlyViewOwnTasks: true,
          }
        };
      });
      setPermissions(allPermissions);
    }
  }, [user, currentPermissions, isOpen]);

  const handlePermissionChange = (
    taskType: TaskType, 
    permission: keyof TaskPermission['permissions'], 
    value: boolean
  ) => {
    setPermissions(prev => 
      prev.map(p => 
        p.taskType === taskType 
          ? { ...p, permissions: { ...p.permissions, [permission]: value } }
          : p
      )
    );
  };

  const handleRestrictionChange = (
    taskType: TaskType,
    restriction: keyof NonNullable<TaskPermission['restrictions']>,
    value: any
  ) => {
    setPermissions(prev => 
      prev.map(p => 
        p.taskType === taskType 
          ? { 
              ...p, 
              restrictions: { 
                ...p.restrictions, 
                [restriction]: value 
              } 
            }
          : p
      )
    );
  };

  const handleSelectAllPermissions = (taskType: TaskType, granted: boolean) => {
    setPermissions(prev => 
      prev.map(p => 
        p.taskType === taskType 
          ? { 
              ...p, 
              permissions: {
                canView: granted,
                canCreate: granted,
                canEdit: granted,
                canDelete: granted && (user.role === 'main_admin' || user.role === 'staff_admin'),
                canAssign: granted && (user.role === 'main_admin' || user.role === 'staff_admin'),
                canComment: granted,
                canChangeStatus: granted,
                canViewAllTasks: granted && (user.role === 'main_admin' || user.role === 'staff_admin'),
                canEditPriority: granted && (user.role === 'main_admin' || user.role === 'staff_admin'),
                canSetDueDate: granted,
                canAddAttachments: granted,
                canViewComments: granted,
              }
            }
          : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // Only send permissions that have at least one permission granted
      const activePermissions = permissions.filter(p => 
        Object.values(p.permissions).some(value => value === true)
      );
      
      await onUpdatePermissions(user.id, activePermissions);
      onClose();
    } catch (error) {
      console.error('Error updating task permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-green-600" />
            Task Permissions - {user.name}
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

          {/* Permissions Grid */}
          <div className="space-y-6">
            {taskTypes.map(taskType => {
              const permission = permissions.find(p => p.taskType === taskType.type);
              if (!permission) return null;

              const hasAnyPermission = Object.values(permission.permissions).some(value => value === true);

              return (
                <div key={taskType.type} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 flex items-center">
                          <CheckSquare className="w-5 h-5 mr-2 text-blue-600" />
                          {taskType.label}
                        </h4>
                        <p className="text-sm text-gray-600">{taskType.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleSelectAllPermissions(taskType.type, true)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Grant All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => handleSelectAllPermissions(taskType.type, false)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Revoke All
                        </button>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          hasAnyPermission ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}>
                          {hasAnyPermission && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Basic Permissions */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Basic Permissions</h5>
                        <div className="space-y-2">
                          {[
                            { key: 'canView', label: 'View Tasks' },
                            { key: 'canCreate', label: 'Create Tasks' },
                            { key: 'canEdit', label: 'Edit Tasks' },
                            { key: 'canDelete', label: 'Delete Tasks' },
                          ].map(perm => (
                            <label key={perm.key} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={permission.permissions[perm.key as keyof typeof permission.permissions]}
                                onChange={(e) => handlePermissionChange(taskType.type, perm.key as keyof TaskPermission['permissions'], e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Advanced Permissions */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Advanced Permissions</h5>
                        <div className="space-y-2">
                          {[
                            { key: 'canAssign', label: 'Assign Tasks' },
                            { key: 'canChangeStatus', label: 'Change Status' },
                            { key: 'canEditPriority', label: 'Edit Priority' },
                            { key: 'canSetDueDate', label: 'Set Due Date' },
                          ].map(perm => (
                            <label key={perm.key} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={permission.permissions[perm.key as keyof typeof permission.permissions]}
                                onChange={(e) => handlePermissionChange(taskType.type, perm.key as keyof TaskPermission['permissions'], e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Communication Permissions */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Communication</h5>
                        <div className="space-y-2">
                          {[
                            { key: 'canComment', label: 'Add Comments' },
                            { key: 'canViewComments', label: 'View Comments' },
                            { key: 'canAddAttachments', label: 'Add Attachments' },
                            { key: 'canViewAllTasks', label: 'View All Tasks' },
                          ].map(perm => (
                            <label key={perm.key} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={permission.permissions[perm.key as keyof typeof permission.permissions]}
                                onChange={(e) => handlePermissionChange(taskType.type, perm.key as keyof TaskPermission['permissions'], e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Restrictions */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">Restrictions</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Max Tasks Per Day
                          </label>
                          <input
                            type="number"
                            value={permission.restrictions?.maxTasksPerDay || 10}
                            onChange={(e) => handleRestrictionChange(taskType.type, 'maxTasksPerDay', parseInt(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            min="1"
                            max="50"
                          />
                        </div>
                        
                        <div>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={permission.restrictions?.canOnlyViewOwnTasks || false}
                              onChange={(e) => handleRestrictionChange(taskType.type, 'canOnlyViewOwnTasks', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Can only view own tasks</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Role-based Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-2">Permission Guidelines</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>Field Collection Staff:</strong> Should have permissions for document_collection tasks</p>
                  <p>• <strong>Data Entry Staff:</strong> Should have permissions for data_entry tasks</p>
                  <p>• <strong>Challan Staff:</strong> Should have permissions for challan_creation tasks</p>
                  <p>• <strong>Document Delivery Staff:</strong> Should have permissions for document_delivery tasks</p>
                  <p>• <strong>Admin roles:</strong> Can have permissions for multiple task types</p>
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
          </div>
        </form>
      </div>
    </div>
  );
}