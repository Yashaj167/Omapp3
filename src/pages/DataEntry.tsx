import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Edit, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Save, 
  FileText, 
  User, 
  Building, 
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Eye,
  Upload
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useTasks } from '../hooks/useTasks.tsx';
import { Document, DocumentStatus } from '../types';
import { format } from 'date-fns';

const mockDataEntryTasks: Document[] = [];

const statusColors: Record<DocumentStatus, string> = {
  'pending_collection': 'bg-gray-100 text-gray-800 border-gray-300',
  'collected': 'bg-blue-100 text-blue-800 border-blue-300',
  'data_entry_pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'data_entry_completed': 'bg-green-100 text-green-800 border-green-300',
  'registration_pending': 'bg-purple-100 text-purple-800 border-purple-300',
  'registered': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'ready_for_delivery': 'bg-orange-100 text-orange-800 border-orange-300',
  'delivered': 'bg-gray-100 text-gray-800 border-gray-300',
};

export function DataEntry() {
  const { user } = useAuth();
  const { tasks, updateTaskStatus } = useTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [dataEntryTasks] = useState(mockDataEntryTasks);
  const [selectedTask, setSelectedTask] = useState<Document | null>(null);
  const [showDataEntryModal, setShowDataEntryModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    builderName: '',
    propertyDetails: '',
    agreementValue: '',
    considerationAmount: '',
    notes: ''
  });

  const handleTaskStatusChange = async (taskId: string, newStatus: any) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const activeDataEntryTasks = tasks.filter(task => 
    task.type === 'data_entry' && 
    (task.status === 'pending' || task.status === 'in_progress')
  );

  const filteredTasks = dataEntryTasks.filter(task => 
    task.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.propertyDetails.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartDataEntry = (task: Document) => {
    setSelectedTask(task);
    setFormData({
      customerName: task.customerName,
      customerPhone: task.customerPhone,
      customerEmail: task.customerEmail || '',
      builderName: task.builderName,
      propertyDetails: task.propertyDetails,
      agreementValue: '',
      considerationAmount: '',
      notes: ''
    });
    setShowDataEntryModal(true);
  };

  const handleSaveDataEntry = () => {
    if (selectedTask) {
      console.log('Saving data entry:', selectedTask.id, formData);
      setShowDataEntryModal(false);
      setSelectedTask(null);
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        builderName: '',
        propertyDetails: '',
        agreementValue: '',
        considerationAmount: '',
        notes: ''
      });
    }
  };

  const getTaskStats = () => {
    const pending = dataEntryTasks.filter(t => t.status === 'data_entry_pending').length;
    const completed = dataEntryTasks.filter(t => t.status === 'data_entry_completed').length;
    const urgent = dataEntryTasks.filter(t => t.notes.some(note => note.toLowerCase().includes('priority') || note.toLowerCase().includes('urgent'))).length;

    return { pending, completed, urgent, total: dataEntryTasks.length };
  };

  const stats = getTaskStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-primary rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Data Entry Tasks</h1>
            <p className="text-orange-100">
              Welcome {user?.name}! You have {stats.pending} documents waiting for data entry.
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-3 rounded-lg">
            <Edit className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Entry</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Priority Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assigned</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Tasks Notice */}
      {activeDataEntryTasks.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Edit className="w-6 h-6 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-orange-900 mb-2">Active Data Entry Tasks</h3>
              <div className="space-y-2">
                {activeDataEntryTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium text-orange-900">{task.title}</p>
                      <p className="text-sm text-orange-700">{task.description}</p>
                      {task.documentId && (
                        <p className="text-xs text-orange-600">Document: {task.documentId}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        task.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleTaskStatusChange(task.id, 'in_progress')}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Start Task
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

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by document number, customer name, or property details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Data Entry Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{task.documentNumber}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {task.documentType.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${statusColors[task.status]}`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{task.customerName}</span>
                  <span className="text-gray-400">•</span>
                  <span>{task.customerPhone}</span>
                </div>

                {task.customerEmail && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{task.customerEmail}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span>{task.builderName}</span>
                </div>

                <div className="flex items-start space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{task.propertyDetails}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Last Updated: {format(task.updatedAt, 'MMM dd, yyyy')}</span>
                </div>
              </div>

              {task.files.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 mb-2">Available Files:</p>
                  <div className="space-y-2">
                    {task.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 text-sm">
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {task.notes.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 mb-2">Notes:</p>
                  <div className="space-y-1">
                    {task.notes.map((note, index) => (
                      <div key={index} className={`p-2 rounded text-sm ${
                        note.toLowerCase().includes('priority') || note.toLowerCase().includes('urgent')
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-gray-50 text-gray-700'
                      }`}>
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Upload className="w-4 h-4" />
                  <span>{task.files.length} file{task.files.length !== 1 ? 's' : ''} available</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  {task.status === 'data_entry_pending' && (
                    <button
                      onClick={() => handleStartDataEntry(task)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Start Entry
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <Edit className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data entry tasks found</h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Try adjusting your search criteria'
              : 'All data entry tasks are complete!'
            }
          </p>
        </div>
      )}

      {/* Data Entry Modal */}
      {showDataEntryModal && selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Data Entry: {selectedTask.documentNumber}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Builder Name
                    </label>
                    <input
                      type="text"
                      value={formData.builderName}
                      onChange={(e) => setFormData({...formData, builderName: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter builder name"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Details
                    </label>
                    <textarea
                      value={formData.propertyDetails}
                      onChange={(e) => setFormData({...formData, propertyDetails: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                      placeholder="Enter property details"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agreement Value (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.agreementValue}
                      onChange={(e) => setFormData({...formData, agreementValue: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter agreement value"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Consideration Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.considerationAmount}
                      onChange={(e) => setFormData({...formData, considerationAmount: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter consideration amount"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                      placeholder="Add any additional notes..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowDataEntryModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDataEntry}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save & Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}