import { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { SalaryRecord, StaffSalaryConfig, SalaryStats, PayrollSummary, SalaryStatus, PaymentMethod } from '../types/salary';
import { useAuth } from './useAuth';
import { useUsers } from './useUsers';
import { useAttendance } from './useAttendance';
import { databaseService } from '../services/databaseService';
import { useDatabase } from './useDatabase';

interface SalaryContextType {
  salaryRecords: SalaryRecord[];
  staffConfigs: StaffSalaryConfig[];
  payrollSummaries: PayrollSummary[];
  loading: boolean;
  createSalaryRecord: (data: Partial<SalaryRecord>) => Promise<SalaryRecord>;
  updateSalaryRecord: (id: string, data: Partial<SalaryRecord>) => Promise<SalaryRecord>;
  deleteSalaryRecord: (id: string) => Promise<void>;
  createStaffConfig: (data: Partial<StaffSalaryConfig>) => Promise<StaffSalaryConfig>;
  updateStaffConfig: (id: string, data: Partial<StaffSalaryConfig>) => Promise<StaffSalaryConfig>;
  generatePayroll: (month: number, year: number) => Promise<PayrollSummary>;
  approveSalary: (id: string) => Promise<void>;
  paySalary: (id: string) => Promise<void>;
  getSalaryStats: () => SalaryStats;
  getStaffConfig: (userId: string) => StaffSalaryConfig | undefined;
  getSalaryRecordsByUser: (userId: string) => SalaryRecord[];
  getSalaryRecordsByPeriod: (month: number, year: number) => SalaryRecord[];
}

const SalaryContext = createContext<SalaryContextType | undefined>(undefined);

const mockSalaryRecords: SalaryRecord[] = [
  {
    id: 'SAL001',
    userId: '2',
    userName: 'Staff Admin',
    userRole: 'staff_admin',
    baseSalary: 45000,
    allowances: [
      { id: 'ALL001', type: 'house_rent', amount: 15000, description: 'House Rent Allowance' },
      { id: 'ALL002', type: 'transport', amount: 3000, description: 'Transport Allowance' },
    ],
    deductions: [
      { id: 'DED001', type: 'tax', amount: 5000, description: 'Income Tax' },
      { id: 'DED002', type: 'provident_fund', amount: 2250, description: 'PF Contribution' },
    ],
    overtime: [],
    bonus: 5000,
    grossSalary: 68000,
    netSalary: 60750,
    payPeriod: {
      month: 12,
      year: 2024,
      startDate: new Date(2024, 11, 1),
      endDate: new Date(2024, 11, 31),
    },
    payDate: new Date(2024, 11, 30),
    status: 'paid',
    paymentMethod: 'bank_transfer',
    bankDetails: {
      accountNumber: '1234567890',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0001234',
      accountHolderName: 'Staff Admin',
    },
    createdAt: new Date(2024, 11, 25),
    updatedAt: new Date(2024, 11, 30),
    approvedBy: 'Main Admin',
    approvedAt: new Date(2024, 11, 28),
  },
  {
    id: 'SAL002',
    userId: '3',
    userName: 'Challan Staff',
    userRole: 'challan_staff',
    baseSalary: 35000,
    allowances: [
      { id: 'ALL003', type: 'house_rent', amount: 10000, description: 'House Rent Allowance' },
      { id: 'ALL004', type: 'transport', amount: 2500, description: 'Transport Allowance' },
    ],
    deductions: [
      { id: 'DED003', type: 'tax', amount: 3000, description: 'Income Tax' },
      { id: 'DED004', type: 'provident_fund', amount: 1750, description: 'PF Contribution' },
    ],
    overtime: [
      { id: 'OT001', date: new Date(2024, 11, 15), hours: 4, rate: 200, amount: 800, description: 'Weekend work' },
    ],
    bonus: 2000,
    grossSalary: 50300,
    netSalary: 45550,
    payPeriod: {
      month: 12,
      year: 2024,
      startDate: new Date(2024, 11, 1),
      endDate: new Date(2024, 11, 31),
    },
    payDate: new Date(2024, 11, 30),
    status: 'approved',
    paymentMethod: 'bank_transfer',
    createdAt: new Date(2024, 11, 25),
    updatedAt: new Date(2024, 11, 28),
    approvedBy: 'Main Admin',
    approvedAt: new Date(2024, 11, 28),
  },
];

const mockStaffConfigs: StaffSalaryConfig[] = [
  {
    id: 'CONFIG001',
    userId: '2',
    baseSalary: 45000,
    allowances: [
      { id: 'ALL001', type: 'house_rent', amount: 15000, description: 'House Rent Allowance' },
      { id: 'ALL002', type: 'transport', amount: 3000, description: 'Transport Allowance' },
    ],
    deductions: [
      { id: 'DED001', type: 'tax', amount: 5000, description: 'Income Tax' },
      { id: 'DED002', type: 'provident_fund', amount: 2250, description: 'PF Contribution' },
    ],
    overtimeRate: 200,
    paymentMethod: 'bank_transfer',
    bankDetails: {
      accountNumber: '1234567890',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0001234',
      accountHolderName: 'Staff Admin',
    },
    isActive: true,
    effectiveFrom: new Date(2024, 0, 1),
    createdAt: new Date(2024, 0, 1),
    updatedAt: new Date(2024, 11, 1),
  },
];

export function useSalary() {
  const context = useContext(SalaryContext);
  if (context === undefined) {
    throw new Error('useSalary must be used within a SalaryProvider');
  }
  return context;
}

export function SalaryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { users } = useUsers();
  const { getUserAttendanceStats } = useAttendance();
  const { isConnected } = useDatabase();
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>(mockSalaryRecords);
  const [staffConfigs, setStaffConfigs] = useState<StaffSalaryConfig[]>(mockStaffConfigs);
  const [payrollSummaries, setPayrollSummaries] = useState<PayrollSummary[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data from database on mount
  useEffect(() => {
    if (isConnected) {
      loadSalaryDataFromDatabase();
    }
  }, [isConnected]);

  const loadSalaryDataFromDatabase = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    try {
      // Load salary records
      const salaryResult = await databaseService.getSalaryRecords();
      if (salaryResult.success && salaryResult.data) {
        const dbSalaryRecords: SalaryRecord[] = salaryResult.data.map((row: any) => ({
          id: row.id.toString(),
          userId: row.user_id.toString(),
          userName: row.user_name,
          userRole: row.user_role,
          baseSalary: parseFloat(row.base_salary),
          allowances: JSON.parse(row.allowances || '[]'),
          deductions: JSON.parse(row.deductions || '[]'),
          overtime: JSON.parse(row.overtime || '[]'),
          bonus: parseFloat(row.bonus || '0'),
          grossSalary: parseFloat(row.gross_salary),
          netSalary: parseFloat(row.net_salary),
          payPeriod: {
            month: row.pay_period_month,
            year: row.pay_period_year,
            startDate: new Date(row.pay_period_year, row.pay_period_month - 1, 1),
            endDate: new Date(row.pay_period_year, row.pay_period_month, 0),
          },
          payDate: new Date(row.pay_date),
          status: row.status,
          paymentMethod: row.payment_method,
          bankDetails: JSON.parse(row.bank_details || 'null'),
          notes: row.notes,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          approvedBy: row.approved_by,
          approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
        }));
        setSalaryRecords(dbSalaryRecords);
      }

      // Load staff configs
      const configResult = await databaseService.getStaffConfigs();
      if (configResult.success && configResult.data) {
        const dbStaffConfigs: StaffSalaryConfig[] = configResult.data.map((row: any) => ({
          id: row.id.toString(),
          userId: row.user_id.toString(),
          baseSalary: parseFloat(row.base_salary),
          allowances: JSON.parse(row.allowances || '[]'),
          deductions: JSON.parse(row.deductions || '[]'),
          overtimeRate: parseFloat(row.overtime_rate || '0'),
          paymentMethod: row.payment_method,
          bankDetails: JSON.parse(row.bank_details || 'null'),
          isActive: Boolean(row.is_active),
          effectiveFrom: new Date(row.effective_from),
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        }));
        setStaffConfigs(dbStaffConfigs);
      }
    } catch (error) {
      console.error('Error loading salary data from database:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSalaryId = (): string => {
    const count = salaryRecords.length + 1;
    return `SAL${count.toString().padStart(3, '0')}`;
  };

  const calculateSalary = (config: StaffSalaryConfig, overtimeHours: number = 0, bonus: number = 0): { gross: number; net: number } => {
    const totalAllowances = config.allowances.reduce((sum, allowance) => sum + allowance.amount, 0);
    const totalDeductions = config.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
    const overtimeAmount = overtimeHours * config.overtimeRate;
    
    const grossSalary = config.baseSalary + totalAllowances + overtimeAmount + bonus;
    const netSalary = grossSalary - totalDeductions;
    
    return { gross: grossSalary, net: netSalary };
  };

  const createSalaryRecord = async (data: Partial<SalaryRecord>): Promise<SalaryRecord> => {
    setLoading(true);
    try {
      if (isConnected) {
        // Create in database
        const result = await databaseService.createSalaryRecord(data);
        
        if (result.success) {
          // Reload salary records from database
          await loadSalaryDataFromDatabase();
          return salaryRecords[salaryRecords.length - 1]; // Return the newly created record
        } else {
          throw new Error(result.error || 'Failed to create salary record');
        }
      } else {
        // Fallback to mock data
        const config = getStaffConfig(data.userId!);
        if (!config) {
          throw new Error('Staff salary configuration not found');
        }

        const overtimeHours = data.overtime?.reduce((sum, ot) => sum + ot.hours, 0) || 0;
        const { gross, net } = calculateSalary(config, overtimeHours, data.bonus || 0);

        const newRecord: SalaryRecord = {
          id: generateSalaryId(),
          userId: data.userId!,
          userName: data.userName!,
          userRole: data.userRole!,
          baseSalary: config.baseSalary,
          allowances: config.allowances,
          deductions: config.deductions,
          overtime: data.overtime || [],
          bonus: data.bonus || 0,
          grossSalary: gross,
          netSalary: net,
          payPeriod: data.payPeriod!,
          payDate: data.payDate!,
          status: 'draft',
          paymentMethod: config.paymentMethod,
          bankDetails: config.bankDetails,
          notes: data.notes,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };

        setSalaryRecords(prev => [...prev, newRecord]);
        return newRecord;
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSalaryRecord = async (id: string, data: Partial<SalaryRecord>): Promise<SalaryRecord> => {
    setLoading(true);
    try {
      if (isConnected) {
        // Update in database
        const result = await databaseService.updateSalaryRecord(id, data);
        
        if (result.success) {
          // Reload salary records from database
          await loadSalaryDataFromDatabase();
          return salaryRecords.find(r => r.id === id)!;
        } else {
          throw new Error(result.error || 'Failed to update salary record');
        }
      } else {
        // Fallback to mock data
        setSalaryRecords(prev => 
          prev.map(record => 
            record.id === id ? { ...record, ...data, updatedAt: new Date() } : record
          )
        );
        return salaryRecords.find(r => r.id === id)!;
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteSalaryRecord = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      setSalaryRecords(prev => prev.filter(record => record.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const createStaffConfig = async (data: Partial<StaffSalaryConfig>): Promise<StaffSalaryConfig> => {
    setLoading(true);
    try {
      if (isConnected) {
        // Create in database
        const result = await databaseService.createStaffConfig(data);
        
        if (result.success) {
          // Reload staff configs from database
          await loadSalaryDataFromDatabase();
          return staffConfigs[staffConfigs.length - 1]; // Return the newly created config
        } else {
          throw new Error(result.error || 'Failed to create staff configuration');
        }
      } else {
        // Fallback to mock data
        const newConfig: StaffSalaryConfig = {
          id: `CONFIG${Date.now()}`,
          userId: data.userId!,
          baseSalary: data.baseSalary || 0,
          allowances: data.allowances || [],
          deductions: data.deductions || [],
          overtimeRate: data.overtimeRate || 0,
          paymentMethod: data.paymentMethod || 'bank_transfer',
          bankDetails: data.bankDetails,
          isActive: true,
          effectiveFrom: data.effectiveFrom || new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };

        setStaffConfigs(prev => [...prev, newConfig]);
        return newConfig;
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStaffConfig = async (id: string, data: Partial<StaffSalaryConfig>): Promise<StaffSalaryConfig> => {
    setLoading(true);
    try {
      if (isConnected) {
        // Update in database
        const result = await databaseService.updateStaffConfig(id, data);
        
        if (result.success) {
          // Reload staff configs from database
          await loadSalaryDataFromDatabase();
          return staffConfigs.find(c => c.id === id)!;
        } else {
          throw new Error(result.error || 'Failed to update staff configuration');
        }
      } else {
        // Fallback to mock data
        setStaffConfigs(prev => 
          prev.map(config => 
            config.id === id ? { ...config, ...data, updatedAt: new Date() } : config
          )
        );
        return staffConfigs.find(c => c.id === id)!;
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePayroll = async (month: number, year: number): Promise<PayrollSummary> => {
    setLoading(true);
    try {
      const activeStaff = users.filter(u => u.isActive);
      const payrollRecords: SalaryRecord[] = [];

      for (const staff of activeStaff) {
        const config = getStaffConfig(staff.id);
        if (!config) continue;

        // Get attendance data for overtime calculation
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const attendanceStats = getUserAttendanceStats(staff.id, startDate, endDate);
        
        const overtimeHours = attendanceStats.overtimeHours || 0;
        const { gross, net } = calculateSalary(config, overtimeHours);

        const salaryRecord: SalaryRecord = {
          id: generateSalaryId(),
          userId: staff.id,
          userName: staff.name,
          userRole: staff.role,
          baseSalary: config.baseSalary,
          allowances: config.allowances,
          deductions: config.deductions,
          overtime: overtimeHours > 0 ? [{
            id: `OT${Date.now()}`,
            date: endDate,
            hours: overtimeHours,
            rate: config.overtimeRate,
            amount: overtimeHours * config.overtimeRate,
            description: 'Monthly overtime'
          }] : [],
          bonus: 0,
          grossSalary: gross,
          netSalary: net,
          payPeriod: {
            month,
            year,
            startDate,
            endDate,
          },
          payDate: new Date(year, month, 5), // 5th of next month
          status: 'draft',
          paymentMethod: config.paymentMethod,
          bankDetails: config.bankDetails,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        payrollRecords.push(salaryRecord);
      }

      setSalaryRecords(prev => [...prev, ...payrollRecords]);

      const summary: PayrollSummary = {
        month,
        year,
        totalStaff: payrollRecords.length,
        totalGrossSalary: payrollRecords.reduce((sum, r) => sum + r.grossSalary, 0),
        totalNetSalary: payrollRecords.reduce((sum, r) => sum + r.netSalary, 0),
        totalAllowances: payrollRecords.reduce((sum, r) => sum + r.allowances.reduce((a, b) => a + b.amount, 0), 0),
        totalDeductions: payrollRecords.reduce((sum, r) => sum + r.deductions.reduce((a, b) => a + b.amount, 0), 0),
        totalOvertime: payrollRecords.reduce((sum, r) => sum + r.overtime.reduce((a, b) => a + b.amount, 0), 0),
        paidCount: 0,
        pendingCount: payrollRecords.length,
        status: 'draft',
      };

      setPayrollSummaries(prev => [...prev, summary]);
      return summary;
    } finally {
      setLoading(false);
    }
  };

  const approveSalary = async (id: string): Promise<void> => {
    await updateSalaryRecord(id, { 
      status: 'approved',
      approvedBy: user?.name,
      approvedAt: new Date(),
    });
  };

  const paySalary = async (id: string): Promise<void> => {
    await updateSalaryRecord(id, { status: 'paid' });
  };

  const getSalaryStats = (): SalaryStats => {
    const activeConfigs = staffConfigs.filter(c => c.isActive);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentMonthRecords = getSalaryRecordsByPeriod(currentMonth, currentYear);

    return {
      totalStaff: activeConfigs.length,
      totalMonthlySalary: activeConfigs.reduce((sum, c) => sum + c.baseSalary, 0),
      totalPaidThisMonth: currentMonthRecords.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.netSalary, 0),
      totalPendingPayments: currentMonthRecords.filter(r => r.status !== 'paid').reduce((sum, r) => sum + r.netSalary, 0),
      averageSalary: activeConfigs.length > 0 ? activeConfigs.reduce((sum, c) => sum + c.baseSalary, 0) / activeConfigs.length : 0,
      highestSalary: Math.max(...activeConfigs.map(c => c.baseSalary), 0),
      lowestSalary: Math.min(...activeConfigs.map(c => c.baseSalary), 0),
      totalOvertime: currentMonthRecords.reduce((sum, r) => sum + r.overtime.reduce((a, b) => a + b.amount, 0), 0),
      totalAllowances: currentMonthRecords.reduce((sum, r) => sum + r.allowances.reduce((a, b) => a + b.amount, 0), 0),
      totalDeductions: currentMonthRecords.reduce((sum, r) => sum + r.deductions.reduce((a, b) => a + b.amount, 0), 0),
    };
  };

  const getStaffConfig = (userId: string): StaffSalaryConfig | undefined => {
    return staffConfigs.find(config => config.userId === userId && config.isActive);
  };

  const getSalaryRecordsByUser = (userId: string): SalaryRecord[] => {
    return salaryRecords.filter(record => record.userId === userId);
  };

  const getSalaryRecordsByPeriod = (month: number, year: number): SalaryRecord[] => {
    return salaryRecords.filter(record => 
      record.payPeriod.month === month && record.payPeriod.year === year
    );
  };

  const value = {
    salaryRecords,
    staffConfigs,
    payrollSummaries,
    loading,
    createSalaryRecord,
    updateSalaryRecord,
    deleteSalaryRecord,
    createStaffConfig,
    updateStaffConfig,
    generatePayroll,
    approveSalary,
    paySalary,
    getSalaryStats,
    getStaffConfig,
    getSalaryRecordsByUser,
    getSalaryRecordsByPeriod,
  };

  return <SalaryContext.Provider value={value}>{children}</SalaryContext.Provider>;
}