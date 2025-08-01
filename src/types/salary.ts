export interface SalaryRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  baseSalary: number;
  allowances: SalaryAllowance[];
  deductions: SalaryDeduction[];
  overtime: OvertimeRecord[];
  bonus: number;
  grossSalary: number;
  netSalary: number;
  payPeriod: PayPeriod;
  payDate: Date;
  status: SalaryStatus;
  paymentMethod: PaymentMethod;
  bankDetails?: BankDetails;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface SalaryAllowance {
  id: string;
  type: AllowanceType;
  amount: number;
  description?: string;
}

export interface SalaryDeduction {
  id: string;
  type: DeductionType;
  amount: number;
  description?: string;
}

export interface OvertimeRecord {
  id: string;
  date: Date;
  hours: number;
  rate: number;
  amount: number;
  description?: string;
}

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  accountHolderName: string;
}

export interface PayPeriod {
  month: number;
  year: number;
  startDate: Date;
  endDate: Date;
}

export type SalaryStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'paid'
  | 'cancelled';

export type PaymentMethod = 
  | 'bank_transfer'
  | 'cash'
  | 'cheque'
  | 'upi';

export type AllowanceType = 
  | 'house_rent'
  | 'transport'
  | 'medical'
  | 'food'
  | 'performance'
  | 'special'
  | 'other';

export type DeductionType = 
  | 'tax'
  | 'provident_fund'
  | 'insurance'
  | 'loan'
  | 'advance'
  | 'late_penalty'
  | 'other';

export interface StaffSalaryConfig {
  id: string;
  userId: string;
  baseSalary: number;
  allowances: SalaryAllowance[];
  deductions: SalaryDeduction[];
  overtimeRate: number;
  paymentMethod: PaymentMethod;
  bankDetails?: BankDetails;
  isActive: boolean;
  effectiveFrom: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryStats {
  totalStaff: number;
  totalMonthlySalary: number;
  totalPaidThisMonth: number;
  totalPendingPayments: number;
  averageSalary: number;
  highestSalary: number;
  lowestSalary: number;
  totalOvertime: number;
  totalAllowances: number;
  totalDeductions: number;
}

export interface PayrollSummary {
  month: number;
  year: number;
  totalStaff: number;
  totalGrossSalary: number;
  totalNetSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalOvertime: number;
  paidCount: number;
  pendingCount: number;
  status: 'draft' | 'processing' | 'completed';
  processedBy?: string;
  processedAt?: Date;
}