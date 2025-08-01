export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  date: Date;
  clockInTime?: Date;
  clockOutTime?: Date;
  status: AttendanceStatus;
  totalHours?: number;
  breakTime?: number;
  overtime?: number;
  location?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AttendanceStatus = 
  | 'present'
  | 'absent'
  | 'late'
  | 'half_day'
  | 'on_leave'
  | 'holiday'
  | 'work_from_home';

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  leaveDays: number;
  totalHours: number;
  averageHours: number;
  overtimeHours: number;
  attendancePercentage: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComments?: string;
}

export type LeaveType = 
  | 'sick_leave'
  | 'casual_leave'
  | 'annual_leave'
  | 'maternity_leave'
  | 'paternity_leave'
  | 'emergency_leave';

export type LeaveStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface WorkSchedule {
  id: string;
  userId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "09:00"
  endTime: string; // "18:00"
  isWorkingDay: boolean;
  breakDuration: number; // minutes
}

export interface AttendanceSettings {
  workingHoursPerDay: number;
  workingDaysPerWeek: number;
  lateThresholdMinutes: number;
  halfDayThresholdHours: number;
  overtimeThresholdHours: number;
  allowEarlyClockIn: boolean;
  allowLateClockOut: boolean;
  requireLocationTracking: boolean;
  autoClockOutTime?: string;
}