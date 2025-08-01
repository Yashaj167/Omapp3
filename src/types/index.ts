export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export type UserRole = 
  | 'main_admin' 
  | 'staff_admin' 
  | 'challan_staff' 
  | 'field_collection_staff' 
  | 'data_entry_staff' 
  | 'document_delivery_staff';

export interface Permission {
  id: string;
  module: string;
  action: string;
  granted: boolean;
}

export interface Document {
  id: string;
  documentNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  builderName: string;
  propertyDetails: string;
  documentType: DocumentType;
  status: DocumentStatus;
  collectionDate?: Date;
  dataEntryDate?: Date;
  registrationDate?: Date;
  deliveryDate?: Date;
  assignedTo?: string;
  notes: string[];
  files: DocumentFile[];
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentType = 
  | 'agreement' 
  | 'lease_deed' 
  | 'sale_deed' 
  | 'mutation' 
  | 'partition_deed' 
  | 'gift_deed';

export type DocumentStatus = 
  | 'pending_collection' 
  | 'collected' 
  | 'data_entry_pending' 
  | 'data_entry_completed' 
  | 'registration_pending' 
  | 'registered' 
  | 'ready_for_delivery' 
  | 'delivered';

export interface DocumentFile {
  id: string;
  name: string;
  type: 'scan' | 'photo' | 'document';
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Payment {
  id: string;
  documentId: string;
  agreementValue: number;
  considerationAmount: number;
  dhcAmount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'cash' | 'cheque' | 'online' | 'dd';
  paymentDate?: Date;
  challanNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentStatus = 'pending' | 'partial' | 'completed' | 'refunded';

export interface Challan {
  id: string;
  documentId: string;
  challanNumber: string;
  amount: number;
  filledBy: string;
  filledAt: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  documents: string[];
  createdAt: Date;
}

export interface Builder {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  registrationNumber?: string;
  documents: string[];
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: Date;
}

export interface DashboardStats {
  totalDocuments: number;
  pendingCollection: number;
  inProgress: number;
  completed: number;
  totalPayments: number;
  pendingPayments: number;
  recentActivities: ActivityLog[];
}