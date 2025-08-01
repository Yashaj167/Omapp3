import React, { useState } from 'react';
import { X, Save, CheckSquare, User, Calendar, Clock, Tag, AlertCircle } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useDocuments } from '../../hooks/useDocuments';
import { useCustomers } from '../../hooks/useCustomers';
import { useBuilders } from '../../hooks/useBuilders';
import { TaskType, TaskPriority } from '../../types/task';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { createTask, loading } = useTasks();
  const { users } = useUsers();
  const { documents } = useDocuments();
  const { customers } = useCustomers();
  const { builders } = useBuilders();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'custom' as TaskType,
    priority: 'medium' as TaskPriority,
    assignedTo: '',
    documentId: '',
    customerId: '',
    builderId: '',
    dueDate: '',
    estimatedHours: '',
    tags: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Task description is required';
    }
    if (!formData.assignedTo) {
      newErrors.assignedTo = 'Please assign the task to someone';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        assignedTo: formData.assignedTo,
        documentId: formData.documentId || undefined,
        customerId: formData.customerId || undefined,
        builderId: formData.builderId || undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      };

      await createTask(taskData);
      onClose();
      setFormData({
        title: '',
        description: '',
        type: 'custom',
        priority: 'medium',
        assignedTo: '',
        documentId: '',
        customerId: '',
        builderId: '',
        dueDate: '',
        estimatedHours: '',
        tags: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-blue-600" />
            Create New Task
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <CheckSquare className="w-4 h-4 mr-2 text-blue-600" />
                Task Information
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter task title"
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as TaskType})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="custom">Custom Task</option>
                  <option value="document_collection">Document Collection</option>
                  <option value="data_entry">Data Entry</option>
                  <option value="document_delivery">Document Delivery</option>
                  <option value="challan_creation">Challan Creation</option>
                  <option value="payment_processing">Payment Processing</option>
                  <option value="customer_follow_up">Customer Follow Up</option>
                  <option value="document_verification">Document Verification</option>
                  <option value="registration_follow_up">Registration Follow Up</option>
                  <option value="quality_check">Quality Check</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value as TaskPriority})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  rows={4}
                  placeholder="Describe the task in detail..."
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Assignment and Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <User className="w-4 h-4 mr-2 text-green-600" />
                Assignment & Details
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To *
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.assignedTo ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select user</option>
                  {users.filter(u => u.isActive).map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                {errors.assignedTo && (
                  <p className="text-red-600 text-sm mt-1">{errors.assignedTo}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({...formData, estimatedHours: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.5"
                  step="0.5"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Document
                </label>
                <select
                  value={formData.documentId}
                  onChange={(e) => setFormData({...formData, documentId: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select document (optional)</option>
                  {documents.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.documentNumber} - {doc.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Customer
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select customer (optional)</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="urgent, follow-up, priority (comma separated)"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
              </div>
            </div>
          </div>

          {/* Task Type Information */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-2">Task Assignment Guidelines</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>Document Collection:</strong> Assign to Field Collection Staff</p>
                  <p>• <strong>Data Entry:</strong> Assign to Data Entry Staff</p>
                  <p>• <strong>Challan Creation:</strong> Assign to Challan Staff</p>
                  <p>• <strong>Document Delivery:</strong> Assign to Document Delivery Staff</p>
                  <p>• <strong>Custom Tasks:</strong> Can be assigned to any staff member</p>
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
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}