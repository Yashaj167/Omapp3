import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckSquare, 
  User, 
  Calendar, 
  Clock, 
  Tag, 
  MessageSquare, 
  Paperclip,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Edit,
  Send,
  MoreVertical
} from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { TaskStatus } from '../types/task';
import { format } from 'date-fns';

const statusColors: Record<TaskStatus, string> = {
  'pending': 'bg-gray-100 text-gray-800',
  'in_progress': 'bg-blue-100 text-blue-800',
  'on_hold': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
  'overdue': 'bg-red-100 text-red-800',
};

const priorityColors = {
  'low': 'bg-gray-100 text-gray-800',
  'medium': 'bg-blue-100 text-blue-800',
  'high': 'bg-orange-100 text-orange-800',
  'urgent': 'bg-red-100 text-red-800',
};

const statusIcons: Record<TaskStatus, React.ComponentType<any>> = {
  'pending': Clock,
  'in_progress': Play,
  'on_hold': Pause,
  'completed': CheckCircle,
  'cancelled': AlertCircle,
  'overdue': AlertCircle,
};

export function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, updateTaskStatus, addTaskComment, loading } = useTasks();
  const { user } = useAuth();
  const [task, setTask] = useState(tasks.find(t => t.id === id));
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  useEffect(() => {
    const foundTask = tasks.find(t => t.id === id);
    setTask(foundTask);
  }, [id, tasks]);

  const isAssigned = task?.assignedTo === user?.id;
  const isAdmin = user?.role === 'main_admin' || user?.role === 'staff_admin';
  const canEdit = isAssigned || isAdmin;

  const isOverdue = task?.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  if (!task) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Task not found</h3>
          <p className="text-gray-500">The requested task could not be found.</p>
          <button
            onClick={() => navigate('/tasks')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      await updateTaskStatus(task.id, newStatus);
      setTask(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date() } : null);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
      try {
        await addTaskComment(task.id, newComment.trim(), isInternal);
        setTask(prev => prev ? {
          ...prev,
          comments: [...prev.comments, {
            id: `COMMENT${Date.now()}`,
            content: newComment.trim(),
            authorId: user?.id || '',
            authorName: user?.name || '',
            createdAt: new Date(),
            isInternal,
          }],
          updatedAt: new Date(),
        } : null);
        setNewComment('');
        setIsInternal(false);
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    }
  };

  const getTaskTypeLabel = (type: string): string => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const StatusIcon = statusIcons[task.status];
  const actualStatus = isOverdue ? 'overdue' : task.status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/tasks')}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-gray-600 capitalize">{getTaskTypeLabel(task.type)} Task</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <StatusIcon className="w-4 h-4" />
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusColors[actualStatus]}`}>
              {isOverdue ? 'OVERDUE' : task.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
            {task.priority.toUpperCase()}
          </span>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed">{task.description}</p>
          </div>

          {/* Task Actions */}
          {canEdit && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex items-center space-x-3">
                {task.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Start Task
                  </button>
                )}
                
                {task.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('on_hold')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Put on Hold
                    </button>
                    <button
                      onClick={() => handleStatusChange('completed')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </button>
                  </>
                )}
                
                {task.status === 'on_hold' && (
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Comments ({task.comments.length})
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              {task.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">{comment.authorName}</span>
                      <span className="text-sm text-gray-500">
                        {format(comment.createdAt, 'MMM dd, yyyy HH:mm')}
                      </span>
                      {comment.isInternal && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                          Internal
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))}
              
              {task.comments.length === 0 && (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              )}
            </div>
            
            {/* Add Comment */}
            <div className="p-6 border-t border-gray-200">
              <div className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Internal comment</span>
                  </label>
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Add Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Information</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Type:</span>
                <p className="font-medium">{getTaskTypeLabel(task.type)}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Assigned to:</span>
                <p className="font-medium">{task.assignedTo}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Created by:</span>
                <p className="font-medium">{task.assignedBy}</p>
              </div>
              
              {task.dueDate && (
                <div>
                  <span className="text-sm text-gray-600">Due date:</span>
                  <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                    {format(new Date(task.dueDate), 'MMM dd, yyyy HH:mm')}
                    {isOverdue && (
                      <span className="ml-2 text-red-600 text-sm">(Overdue)</span>
                    )}
                  </p>
                </div>
              )}
              
              {task.estimatedHours && (
                <div>
                  <span className="text-sm text-gray-600">Estimated hours:</span>
                  <p className="font-medium">{task.estimatedHours}h</p>
                </div>
              )}
              
              {task.actualHours && (
                <div>
                  <span className="text-sm text-gray-600">Actual hours:</span>
                  <p className="font-medium">{task.actualHours}h</p>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Items</h3>
            <div className="space-y-3">
              {task.documentId && (
                <div>
                  <span className="text-sm text-gray-600">Document:</span>
                  <p className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                    {task.documentId}
                  </p>
                </div>
              )}
              
              {task.customerId && (
                <div>
                  <span className="text-sm text-gray-600">Customer:</span>
                  <p className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                    {task.customerId}
                  </p>
                </div>
              )}
              
              {task.builderId && (
                <div>
                  <span className="text-sm text-gray-600">Builder:</span>
                  <p className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                    {task.builderId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Created:</span>
                <p className="text-sm">{format(task.createdAt, 'MMM dd, yyyy HH:mm')}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Last updated:</span>
                <p className="text-sm">{format(task.updatedAt, 'MMM dd, yyyy HH:mm')}</p>
              </div>
              
              {task.completedAt && (
                <div>
                  <span className="text-sm text-gray-600">Completed:</span>
                  <p className="text-sm">{format(task.completedAt, 'MMM dd, yyyy HH:mm')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Paperclip className="w-5 h-5 mr-2" />
              Attachments ({task.attachments.length})
            </h3>
            {task.attachments.length > 0 ? (
              <div className="space-y-2">
                {task.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded border">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 flex-1">{attachment.name}</span>
                    <button className="text-blue-600 hover:text-blue-700 text-sm">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No attachments</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}