import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Building, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail,
  Edit,
  Save,
  X,
  Upload,
  Download,
  Eye,
  Trash2,
  Plus,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useDocuments } from '../hooks/useDocuments.tsx';
import { DocumentStatus, ActivityLog } from '../types';
import { format } from 'date-fns';

const mockActivities: ActivityLog[] = [];

const statusColors: Record<DocumentStatus, string> = {
  'pending_collection': 'bg-gray-100 text-gray-800 border-gray-300',
  'collected': 'bg-blue-100 text-blue-800 border-blue-300',
  'data_entry_pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'data_entry_completed': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'registration_pending': 'bg-purple-100 text-purple-800 border-purple-300',
  'registered': 'bg-green-100 text-green-800 border-green-300',
  'ready_for_delivery': 'bg-orange-100 text-orange-800 border-orange-300',
  'delivered': 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

export function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { getDocument, updateDocument, addNote } = useDocuments();
  const [document, setDocument] = useState(getDocument(id!));
  const [activities] = useState<ActivityLog[]>(mockActivities);
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);

  useEffect(() => {
    if (id) {
      const doc = getDocument(id);
      setDocument(doc);
    }
  }, [id, getDocument]);

  const canEdit = hasPermission('documents', 'update');
  const canViewFiles = hasPermission('documents', 'read');

  if (!document) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Document not found</h3>
          <p className="text-gray-500">The requested document could not be found.</p>
          <button
            onClick={() => navigate('/documents')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: DocumentStatus) => {
    try {
      await updateDocument(document.id, { status: newStatus });
      setDocument(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date() } : null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAddNote = async () => {
    if (newNote.trim()) {
      try {
        await addNote(document.id, newNote.trim());
        setDocument(prev => prev ? {
          ...prev,
          notes: [...prev.notes, newNote.trim()],
          updatedAt: new Date(),
        } : null);
        setNewNote('');
        setShowAddNote(false);
      } catch (error) {
        console.error('Error adding note:', error);
      }
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    return (
      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${statusColors[status]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const statusWorkflow: { status: DocumentStatus; label: string; description: string }[] = [
    { status: 'pending_collection', label: 'Pending Collection', description: 'Waiting for field collection' },
    { status: 'collected', label: 'Collected', description: 'Documents collected from field' },
    { status: 'data_entry_pending', label: 'Data Entry Pending', description: 'Awaiting data entry' },
    { status: 'data_entry_completed', label: 'Data Entry Completed', description: 'Data entry completed' },
    { status: 'registration_pending', label: 'Registration Pending', description: 'Awaiting registration' },
    { status: 'registered', label: 'Registered', description: 'Document registered successfully' },
    { status: 'ready_for_delivery', label: 'Ready for Delivery', description: 'Ready for delivery to client' },
    { status: 'delivered', label: 'Delivered', description: 'Document delivered to client' },
  ];

  const currentStatusIndex = statusWorkflow.findIndex(s => s.status === document.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/documents')}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document.documentNumber}</h1>
            <p className="text-gray-600 capitalize">{document.documentType.replace('_', ' ')} Document</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(document.status)}
          {canEdit && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              {isEditing ? 'Cancel Edit' : 'Edit Document'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Document Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
                    <p className="text-gray-900 font-medium">{document.documentNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                    <p className="text-gray-900 capitalize">{document.documentType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Details</label>
                    <p className="text-gray-900">{document.propertyDetails}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                    <p className="text-gray-900">{document.assignedTo || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                    <p className="text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {format(document.createdAt, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <p className="text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {format(document.updatedAt, 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-green-600" />
                Customer Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <p className="text-gray-900 font-medium">{document.customerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {document.customerPhone}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <p className="text-gray-900 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {document.customerEmail || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Builder Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building className="w-5 h-5 mr-2 text-purple-600" />
                Builder Information
              </h2>
            </div>
            <div className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Builder Name</label>
                <p className="text-gray-900 font-medium">{document.builderName}</p>
              </div>
            </div>
          </div>

          {/* Document Files */}
          {canViewFiles && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Upload className="w-5 h-5 mr-2 text-orange-600" />
                    Document Files ({document.files.length})
                  </h2>
                  {canEdit && (
                    <button className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-lg text-sm flex items-center transition-colors">
                      <Plus className="w-4 h-4 mr-1" />
                      Add File
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                {document.files.length > 0 ? (
                  <div className="space-y-3">
                    {document.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-500">
                              Uploaded by {file.uploadedBy} • {format(file.uploadedAt, 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded</h3>
                    <p className="text-gray-500">Upload documents, scans, or photos to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Workflow */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Status Workflow</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {statusWorkflow.map((item, index) => {
                  const isCompleted = index < currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  const isPending = index > currentStatusIndex;

                  return (
                    <div key={item.status} className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isCurrent ? 'bg-blue-500 text-white' :
                        'bg-gray-200 text-gray-500'
                      }`}>
                        {isCompleted ? (
                          <div className="w-3 h-3 bg-white rounded-full" />
                        ) : (
                          <div className="w-2 h-2 bg-current rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          isCurrent ? 'text-blue-600' : 
                          isCompleted ? 'text-green-600' : 
                          'text-gray-500'
                        }`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                {canEdit && (
                  <button
                    onClick={() => setShowAddNote(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg text-sm flex items-center transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Note
                  </button>
                )}
              </div>
            </div>
            <div className="p-6">
              {showAddNote && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2 mt-3">
                    <button
                      onClick={() => setShowAddNote(false)}
                      className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNote}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg text-sm transition-colors"
                    >
                      Add Note
                    </button>
                  </div>
                </div>
              )}
              
              {document.notes.length > 0 ? (
                <div className="space-y-3">
                  {document.notes.map((note, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 text-sm">{note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No notes added yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-teal-600" />
                Activity Log
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <span className="text-xs text-gray-500">
                          {format(activity.timestamp, 'MMM dd, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                      <p className="text-xs text-gray-500 mt-1">by {activity.userName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}