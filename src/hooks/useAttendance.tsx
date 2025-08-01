import { useState, createContext, useContext, ReactNode } from 'react';
import { AttendanceRecord, AttendanceStatus, AttendanceStats, LeaveRequest, LeaveType, LeaveStatus, WorkSchedule, AttendanceSettings } from '../types/attendance';
import { useAuth } from './useAuth';
import { databaseService } from '../services/databaseService';
import { useDatabase } from './useDatabase';

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  workSchedules: WorkSchedule[];
  attendanceSettings: AttendanceSettings;
  loading: boolean;
  clockIn: (location?: string, notes?: string) => Promise<AttendanceRecord>;
  clockOut: (notes?: string) => Promise<AttendanceRecord>;
  getTodayAttendance: (userId?: string) => AttendanceRecord | undefined;
  getUserAttendanceStats: (userId: string, startDate: Date, endDate: Date) => AttendanceStats;
  getAttendanceByDateRange: (startDate: Date, endDate: Date, userId?: string) => AttendanceRecord[];
  markAttendance: (userId: string, date: Date, status: AttendanceStatus, notes?: string) => Promise<AttendanceRecord>;
  updateAttendance: (id: string, data: Partial<AttendanceRecord>) => Promise<AttendanceRecord>;
  submitLeaveRequest: (data: Partial<LeaveRequest>) => Promise<LeaveRequest>;
  approveLeaveRequest: (id: string, comments?: string) => Promise<void>;
  rejectLeaveRequest: (id: string, comments: string) => Promise<void>;
  isUserClockedIn: (userId?: string) => boolean;
  getCurrentWorkingHours: (userId?: string) => number;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

// Mock data for demonstration
const mockAttendanceRecords: AttendanceRecord[] = [];

const mockLeaveRequests: LeaveRequest[] = [];

const mockWorkSchedules: WorkSchedule[] = [
  { id: 'WS001', userId: '1', dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isWorkingDay: true, breakDuration: 60 },
  { id: 'WS002', userId: '1', dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isWorkingDay: true, breakDuration: 60 },
  { id: 'WS003', userId: '1', dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isWorkingDay: true, breakDuration: 60 },
  { id: 'WS004', userId: '1', dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isWorkingDay: true, breakDuration: 60 },
  { id: 'WS005', userId: '1', dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isWorkingDay: true, breakDuration: 60 },
  { id: 'WS006', userId: '1', dayOfWeek: 6, startTime: '09:00', endTime: '14:00', isWorkingDay: true, breakDuration: 30 },
  { id: 'WS007', userId: '1', dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorkingDay: false, breakDuration: 0 },
];

const defaultAttendanceSettings: AttendanceSettings = {
  workingHoursPerDay: 8,
  workingDaysPerWeek: 6,
  lateThresholdMinutes: 15,
  halfDayThresholdHours: 4,
  overtimeThresholdHours: 8,
  allowEarlyClockIn: true,
  allowLateClockOut: true,
  requireLocationTracking: false,
  autoClockOutTime: '20:00',
};

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isConnected } = useDatabase();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [workSchedules] = useState<WorkSchedule[]>(mockWorkSchedules);
  const [attendanceSettings] = useState<AttendanceSettings>(defaultAttendanceSettings);
  const [loading, setLoading] = useState(false);

  const generateAttendanceId = (): string => {
    const count = attendanceRecords.length + 1;
    return `ATT${count.toString().padStart(3, '0')}`;
  };

  const clockIn = async (location?: string, notes?: string): Promise<AttendanceRecord> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      if (isConnected) {
        // Clock in via database
        const result = await databaseService.clockIn(user.id, location, notes);
        
        if (result.success) {
          // Create local record for immediate UI update
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          const newRecord: AttendanceRecord = {
            id: generateAttendanceId(),
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            date: today,
            clockInTime: now,
            status: 'present',
            location,
            notes,
            createdAt: now,
            updatedAt: now,
          };

          setAttendanceRecords(prev => [...prev, newRecord]);
          return newRecord;
        } else {
          throw new Error(result.error || 'Failed to clock in');
        }
      } else {
        // Fallback to mock data
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Check if already clocked in today
        const existingRecord = attendanceRecords.find(
          record => record.userId === user.id && 
          record.date.toDateString() === today.toDateString()
        );

        if (existingRecord && existingRecord.clockInTime) {
          throw new Error('Already clocked in today');
        }

        // Determine if late
        const expectedStartTime = new Date(today);
        expectedStartTime.setHours(9, 0, 0, 0); // 9:00 AM
        const isLate = now > new Date(expectedStartTime.getTime() + attendanceSettings.lateThresholdMinutes * 60000);

        const newRecord: AttendanceRecord = {
          id: generateAttendanceId(),
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          date: today,
          clockInTime: now,
          status: isLate ? 'late' : 'present',
          location,
          notes,
          createdAt: now,
          updatedAt: now,
        };

        setAttendanceRecords(prev => [...prev, newRecord]);
        return newRecord;
      }
    } finally {
      setLoading(false);
    }
  };

  const clockOut = async (notes?: string): Promise<AttendanceRecord> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      if (isConnected) {
        // Clock out via database
        const result = await databaseService.clockOut(user.id, notes);
        
        if (result.success) {
          // Update local record for immediate UI update
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          const existingRecord = attendanceRecords.find(
            record => record.userId === user.id && 
            record.date.toDateString() === today.toDateString() &&
            record.clockInTime && !record.clockOutTime
          );

          if (existingRecord) {
            const totalMinutes = (now.getTime() - existingRecord.clockInTime!.getTime()) / (1000 * 60);
            const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
            const breakTime = existingRecord.breakTime || 60;
            const workingHours = totalHours - (breakTime / 60);
            const overtime = Math.max(0, workingHours - attendanceSettings.workingHoursPerDay);

            const updatedRecord: AttendanceRecord = {
              ...existingRecord,
              clockOutTime: now,
              totalHours: workingHours,
              overtime,
              notes: notes || existingRecord.notes,
              updatedAt: now,
            };

            setAttendanceRecords(prev => 
              prev.map(record => 
                record.id === existingRecord.id ? updatedRecord : record
              )
            );

            return updatedRecord;
          } else {
            throw new Error('No active clock-in found for today');
          }
        } else {
          throw new Error(result.error || 'Failed to clock out');
        }
      } else {
        // Fallback to mock data
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const existingRecord = attendanceRecords.find(
          record => record.userId === user.id && 
          record.date.toDateString() === today.toDateString() &&
          record.clockInTime && !record.clockOutTime
        );

        if (!existingRecord) {
          throw new Error('No active clock-in found for today');
        }

        const totalMinutes = (now.getTime() - existingRecord.clockInTime!.getTime()) / (1000 * 60);
        const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
        const breakTime = existingRecord.breakTime || 60; // Default 1 hour break
        const workingHours = totalHours - (breakTime / 60);
        const overtime = Math.max(0, workingHours - attendanceSettings.workingHoursPerDay);

        const updatedRecord: AttendanceRecord = {
          ...existingRecord,
          clockOutTime: now,
          totalHours: workingHours,
          overtime,
          notes: notes || existingRecord.notes,
          updatedAt: now,
        };

        setAttendanceRecords(prev => 
          prev.map(record => 
            record.id === existingRecord.id ? updatedRecord : record
          )
        );

        return updatedRecord;
      }
    } finally {
      setLoading(false);
    }
  };

  const getTodayAttendance = (userId?: string): AttendanceRecord | undefined => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return undefined;

    const today = new Date();
    return attendanceRecords.find(
      record => record.userId === targetUserId && 
      record.date.toDateString() === today.toDateString()
    );
  };

  const getUserAttendanceStats = (userId: string, startDate: Date, endDate: Date): AttendanceStats => {
    const userRecords = attendanceRecords.filter(
      record => record.userId === userId &&
      record.date >= startDate &&
      record.date <= endDate
    );

    const totalDays = userRecords.length;
    const presentDays = userRecords.filter(r => r.status === 'present').length;
    const absentDays = userRecords.filter(r => r.status === 'absent').length;
    const lateDays = userRecords.filter(r => r.status === 'late').length;
    const halfDays = userRecords.filter(r => r.status === 'half_day').length;
    const leaveDays = userRecords.filter(r => r.status === 'on_leave').length;

    const totalHours = userRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;
    const overtimeHours = userRecords.reduce((sum, r) => sum + (r.overtime || 0), 0);
    
    const workingDays = presentDays + lateDays + halfDays;
    const attendancePercentage = totalDays > 0 ? (workingDays / totalDays) * 100 : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      halfDays,
      leaveDays,
      totalHours,
      averageHours,
      overtimeHours,
      attendancePercentage,
    };
  };

  const getAttendanceByDateRange = (startDate: Date, endDate: Date, userId?: string): AttendanceRecord[] => {
    return attendanceRecords.filter(
      record => record.date >= startDate &&
      record.date <= endDate &&
      (!userId || record.userId === userId)
    );
  };

  const markAttendance = async (
    userId: string, 
    date: Date, 
    status: AttendanceStatus, 
    notes?: string
  ): Promise<AttendanceRecord> => {
    setLoading(true);
    try {
      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      const existingRecord = attendanceRecords.find(
        record => record.userId === userId && 
        record.date.toDateString() === targetDate.toDateString()
      );

      if (existingRecord) {
        const updatedRecord = {
          ...existingRecord,
          status,
          notes,
          updatedAt: new Date(),
        };
        
        setAttendanceRecords(prev => 
          prev.map(record => 
            record.id === existingRecord.id ? updatedRecord : record
          )
        );
        
        return updatedRecord;
      } else {
        const newRecord: AttendanceRecord = {
          id: generateAttendanceId(),
          userId,
          userName: 'User Name', // Would be fetched from user data
          userRole: 'staff',
          date: targetDate,
          status,
          notes,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setAttendanceRecords(prev => [...prev, newRecord]);
        return newRecord;
      }
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = async (id: string, data: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
    setLoading(true);
    try {
      const updatedRecord = { ...data, updatedAt: new Date() };
      setAttendanceRecords(prev => 
        prev.map(record => 
          record.id === id ? { ...record, ...updatedRecord } : record
        )
      );
      return attendanceRecords.find(r => r.id === id)!;
    } finally {
      setLoading(false);
    }
  };

  const submitLeaveRequest = async (data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const newRequest: LeaveRequest = {
        id: `LEAVE${Date.now()}`,
        userId: user.id,
        userName: user.name,
        leaveType: data.leaveType!,
        startDate: data.startDate!,
        endDate: data.endDate!,
        totalDays: data.totalDays!,
        reason: data.reason!,
        status: 'pending',
        appliedAt: new Date(),
        ...data,
      };

      setLeaveRequests(prev => [...prev, newRequest]);
      return newRequest;
    } finally {
      setLoading(false);
    }
  };

  const approveLeaveRequest = async (id: string, comments?: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      setLeaveRequests(prev => 
        prev.map(request => 
          request.id === id 
            ? {
                ...request,
                status: 'approved' as LeaveStatus,
                reviewedBy: user.name,
                reviewedAt: new Date(),
                reviewComments: comments,
              }
            : request
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const rejectLeaveRequest = async (id: string, comments: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      setLeaveRequests(prev => 
        prev.map(request => 
          request.id === id 
            ? {
                ...request,
                status: 'rejected' as LeaveStatus,
                reviewedBy: user.name,
                reviewedAt: new Date(),
                reviewComments: comments,
              }
            : request
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const isUserClockedIn = (userId?: string): boolean => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return false;

    const todayRecord = getTodayAttendance(targetUserId);
    return !!(todayRecord?.clockInTime && !todayRecord?.clockOutTime);
  };

  const getCurrentWorkingHours = (userId?: string): number => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return 0;

    const todayRecord = getTodayAttendance(targetUserId);
    if (!todayRecord?.clockInTime) return 0;

    const now = new Date();
    const clockInTime = todayRecord.clockInTime;
    const totalMinutes = (now.getTime() - clockInTime.getTime()) / (1000 * 60);
    const breakTime = todayRecord.breakTime || 60;
    const workingHours = (totalMinutes / 60) - (breakTime / 60);
    
    return Math.max(0, Math.round(workingHours * 100) / 100);
  };

  const value = {
    attendanceRecords,
    leaveRequests,
    workSchedules,
    attendanceSettings,
    loading,
    clockIn,
    clockOut,
    getTodayAttendance,
    getUserAttendanceStats,
    getAttendanceByDateRange,
    markAttendance,
    updateAttendance,
    submitLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    isUserClockedIn,
    getCurrentWorkingHours,
  };

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}