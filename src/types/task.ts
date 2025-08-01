export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string;
  assignedBy: string;
  documentId?: string;
  customerId?: string;
  builderId?: string;
  dueDate?: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  dependencies: string[]; // Task IDs that must be completed first
  createdAt: Date;
  updatedAt: Date;
}

export type TaskType = 
  | 'document_collection'
  | 'data_entry'
  | 'document_delivery'
  | 'challan_creation'
  | 'payment_processing'
  | 'customer_follow_up'
  | 'document_verification'
  | 'registration_follow_up'
  | 'quality_check'
  | 'custom';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 
  | 'pending'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled'
  | 'overdue';

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  isInternal: boolean;
}

export interface TaskPermission {
  id: string;
  userId: string;
  taskType: TaskType;
  permissions: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canAssign: boolean;
    canComment: boolean;
    canChangeStatus: boolean;
    canViewAllTasks: boolean; // Can see tasks assigned to others
    canEditPriority: boolean;
    canSetDueDate: boolean;
    canAddAttachments: boolean;
    canViewComments: boolean;
  };
  restrictions?: {
    maxTasksPerDay?: number;
    allowedStatuses?: TaskStatus[];
    allowedPriorities?: TaskPriority[];
    canOnlyViewOwnTasks?: boolean;
  };
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  defaultPriority: TaskPriority;
  estimatedHours: number;
  checklist: TaskChecklistItem[];
  requiredFields: string[];
  autoAssignmentRules?: {
    role?: string;
    department?: string;
    workload?: 'balanced' | 'least_busy';
  };
}

export interface TaskChecklistItem {
  id: string;
  title: string;
  description?: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
}

export interface TaskStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  tasksByType: Record<TaskType, number>;
  tasksByPriority: Record<TaskPriority, number>;
  userWorkload: Record<string, number>;
}