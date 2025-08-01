import React, { useState } from 'react';
import { Search, Filter, CheckSquare, User, Calendar, Clock, Play, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../hooks/useAuth';
import { TaskStatus, TaskPriority } from '../../types/task';
import { format } from 'date-fns';
import { MobileListItem } from './MobileListItem';

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

export function MobileTaskList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tasks, updateTaskStatus, loading } = useTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  const filteredTasks = tasks.filter(task => {
    // Show user's tasks or all tasks for admins
    const canViewTask = user?.role === 'main_admin' || user?.role === 'staff_admin' || task.assignedTo === user?.id;
    if (!canViewTask) return false;

    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleTaskAction = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getTaskActions = (task: any) => {
    if (task.assignedTo !== user?.id && user?.role !== 'main_admin' && user?.role !== 'staff_admin') {
      return null;
    }

    return (
      <div className="flex items-center space-x-1">
        {task.status === 'pending' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTaskAction(task.id, 'in_progress');
            }}
            className="p-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
          >
            <Play className="w-3 h-3" />
          </button>
        )}
        {task.status === 'in_progress' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTaskAction(task.id, 'completed');
            }}
            className="p-1 rounded bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
          >
            <CheckCircle className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
      </button>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
          const actualStatus = isOverdue ? 'overdue' : task.status;
          
          return (
            <MobileListItem
              key={task.id}
              title={task.title}
              subtitle={`Assigned to: ${task.assignedTo}`}
              description={task.description}
              icon={CheckSquare}
              badge={isOverdue ? 'OVERDUE' : task.status.replace('_', ' ').toUpperCase()}
              badgeColor={statusColors[actualStatus]}
              onClick={() => navigate(`/tasks/${task.id}`)}
              actions={getTaskActions(task)}
            />
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500 text-sm">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'All tasks are complete!'
            }
          </p>
        </div>
      )}
    </div>
  );
}