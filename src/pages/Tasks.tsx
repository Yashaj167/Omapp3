import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  CheckSquare,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Tag,
  MessageSquare,
  Paperclip,
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { TaskType, TaskStatus, TaskPriority } from '../types/task';
import { format } from 'date-fns';
import { CreateTaskModal } from '../components/Modals/CreateTaskModal';
import { MobileTaskList } from '../components/Mobile/MobileTaskList';

// Hook to detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

const taskTypeColors: Record<TaskType, string> = {
  'document_collection': 'bg-blue-100 text-blue-800',
  'data_entry': 'bg-green-100 text-green-800',
  'document_delivery': 'bg-purple-100 text-purple-800',
  'challan_creation': 'bg-orange-100 text-orange-800',
  'payment_processing': 'bg-emerald-100 text-emerald-800',
  'customer_follow_up': 'bg-yellow-100 text-yellow-800',
  'document_verification': 'bg-indigo-100 text-indigo-800',
  'registration_follow_up': 'bg-pink-100 text-pink-800',
  'quality_check': 'bg-cyan-100 text-cyan-800',
  'custom': 'bg-gray-100 text-gray-800',
};

const priorityColors: Record<TaskPriority, string> = {
  'low': 'bg-gray-100 text-gray-800',
  'medium': 'bg-blue-100 text-blue-800',
  'high': 'bg-orange-100 text-orange-800',
  'urgent': 'bg-red-100 text-red-800',
};

const statusColors: Record<TaskStatus, string> = {
  'pending': 'bg-gray-100 text-gray-800',
  'in_progress': 'bg-blue-100 text-blue-800',
  'on_hold': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
  'overdue': 'bg-red-100 text-red-800',
};

const statusIcons: Record<TaskStatus, React.ComponentType<any>> = {
  'pending': Clock,
  'in_progress': Play,
  'on_hold': Pause,
  'completed': CheckCircle,
  'cancelled': X,
  'overdue': AlertCircle,
};

export function Tasks() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { 
    tasks, 
    getTasksByUser, 
    getTaskStats, 
    hasTaskPermission, 
    updateTaskStatus,
    getTaskRedirectUrl,
    loading 
  } = useTasks();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'me' | 'others'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isMobile = useIsMobile();

  // Return mobile version if on mobile
  if (isMobile) {
    return (
      <div className="space-y-6">
        <MobileTaskList />
        
        {/* Create Task Modal */}
        <CreateTaskModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    );
  }

  const isMainAdmin = user?.role === 'main_admin';
  const isStaffAdmin = user?.role === 'staff_admin';
  const canCreateTasks = isMainAdmin || isStaffAdmin || hasPermission('tasks', 'create');

  // Filter tasks based on user permissions and filters
  const filteredTasks = tasks.filter(task => {
    // Permission check - users can only see tasks they have permission for
    if (!isMainAdmin && !isStaffAdmin) {
      const hasPermission = hasTaskPermission(task.type, 'canView');
      const isAssigned = task.assignedTo === user?.id;
      if (!hasPermission && !isAssigned) return false;
    }

    // Search filter
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    // Type filter
    const matchesType = typeFilter === 'all' || task.type === typeFilter;

    // Status filter
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

    // Priority filter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    // Assignee filter
    const matchesAssignee = assigneeFilter === 'all' || 
      (assigneeFilter === 'me' && task.assignedTo === user?.id) ||
      (assigneeFilter === 'others' && task.assignedTo !== user?.id);

    return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesAssignee;
  });

  const stats = getTaskStats();
  const myTasks = user ? getTasksByUser(user.id) : [];

  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleViewTask = (task: any) => {
    // Get the appropriate redirect URL based on task type and status
    const redirectUrl = getTaskRedirectUrl(task);
    navigate(redirectUrl);
  };

  const getTaskTypeLabel = (type: TaskType): string => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isTaskOverdue = (task: any): boolean => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all tasks across the organization</p>
        </div>
        {canCreateTasks && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgressTasks}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Play className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdueTasks}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* My Tasks Summary */}
      {!isMainAdmin && !isStaffAdmin && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">My Tasks Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Assigned to Me</p>
              <p className="text-xl font-bold text-gray-900">{myTasks.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-bold text-orange-600">
                {myTasks.filter(t => t.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-xl font-bold text-blue-600">
                {myTasks.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-xl font-bold text-red-600">
                {myTasks.filter(t => isTaskOverdue(t)).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TaskType | 'all')}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="document_collection">Document Collection</option>
            <option value="data_entry">Data Entry</option>
            <option value="document_delivery">Document Delivery</option>
            <option value="challan_creation">Challan Creation</option>
            <option value="payment_processing">Payment Processing</option>
            <option value="customer_follow_up">Customer Follow Up</option>
            <option value="custom">Custom</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value as 'all' | 'me' | 'others')}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Tasks</option>
            <option value="me">My Tasks</option>
            <option value="others">Others' Tasks</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTasks.map((task) => {
              const StatusIcon = statusIcons[task.status];
              const isOverdue = isTaskOverdue(task);
              const actualStatus = isOverdue ? 'overdue' : task.status;
              
              return (
                <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                          onClick={() => handleViewTask(task)}
                        >
                          {task.title}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${taskTypeColors[task.type]}`}>
                          {getTaskTypeLabel(task.type)}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
                          {task.priority.toUpperCase()}
                        </span>
                        <div className="flex items-center space-x-1">
                          <StatusIcon className="w-4 h-4" />
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[actualStatus]}`}>
                            {isOverdue ? 'OVERDUE' : task.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{task.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>Assigned to: {task.assignedTo}</span>
                        </div>
                        
                        {task.dueDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                        
                        {task.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Tag className="w-4 h-4" />
                            <div className="flex space-x-1">
                              {task.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                              {task.tags.length > 2 && (
                                <span className="text-gray-400">+{task.tags.length - 2}</span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {task.comments.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{task.comments.length} comments</span>
                          </div>
                        )}
                        
                        {task.attachments.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Paperclip className="w-4 h-4" />
                            <span>{task.attachments.length} files</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleViewTask(task)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Go to Work Page"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {(task.assignedTo === user?.id || isMainAdmin || isStaffAdmin) && (
                        <>
                          {task.status === 'pending' && (
                            <button
                              onClick={() => handleTaskStatusChange(task.id, 'in_progress')}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Start Task"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          
                          {task.status === 'in_progress' && (
                            <>
                              <button
                                onClick={() => handleTaskStatusChange(task.id, 'on_hold')}
                                className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                title="Put on Hold"
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleTaskStatusChange(task.id, 'completed')}
                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Complete Task"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {task.status === 'on_hold' && (
                            <button
                              onClick={() => handleTaskStatusChange(task.id, 'in_progress')}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Resume Task"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-500">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first task'
              }
            </p>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}