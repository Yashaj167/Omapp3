import { useState, createContext, useContext, ReactNode } from 'react';
import { Payment, PaymentStatus } from '../types';

interface PaymentContextType {
  payments: Payment[];
  loading: boolean;
  createPayment: (data: Partial<Payment>) => Promise<Payment>;
  updatePayment: (id: string, data: Partial<Payment>) => Promise<Payment>;
  deletePayment: (id: string) => Promise<void>;
  getPayment: (id: string) => Payment | undefined;
  getPaymentsByDocument: (documentId: string) => Payment[];
  updatePaymentStatus: (id: string, status: PaymentStatus) => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

const mockPayments: Payment[] = [];

export function usePayments() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayments must be used within a PaymentProvider');
  }
  return context;
}

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [loading, setLoading] = useState(false);

  const calculateDHC = (considerationAmount: number): number => {
    // DHC calculation: 5% of consideration amount
    return Math.round(considerationAmount * 0.05);
  };

  const createPayment = async (data: Partial<Payment>): Promise<Payment> => {
    setLoading(true);
    try {
      const dhcAmount = data.dhcAmount || calculateDHC(data.considerationAmount || 0);
      const totalAmount = (data.considerationAmount || 0) + dhcAmount;
      
      const newPayment: Payment = {
        id: `PAY${Date.now()}`,
        documentId: data.documentId || '',
        agreementValue: data.agreementValue || 0,
        considerationAmount: data.considerationAmount || 0,
        dhcAmount,
        totalAmount,
        paidAmount: data.paidAmount || 0,
        pendingAmount: totalAmount - (data.paidAmount || 0),
        paymentStatus: data.paidAmount === totalAmount ? 'completed' : 
                      data.paidAmount && data.paidAmount > 0 ? 'partial' : 'pending',
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        challanNumber: data.challanNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };

      setPayments(prev => [...prev, newPayment]);
      return newPayment;
    } finally {
      setLoading(false);
    }
  };

  const updatePayment = async (id: string, data: Partial<Payment>): Promise<Payment> => {
    setLoading(true);
    try {
      setPayments(prev => 
        prev.map(payment => {
          if (payment.id === id) {
            const updated = { ...payment, ...data, updatedAt: new Date() };
            // Recalculate amounts if needed
            if (data.considerationAmount || data.dhcAmount) {
              updated.totalAmount = updated.considerationAmount + updated.dhcAmount;
              updated.pendingAmount = updated.totalAmount - updated.paidAmount;
              updated.paymentStatus = updated.paidAmount === updated.totalAmount ? 'completed' : 
                                    updated.paidAmount > 0 ? 'partial' : 'pending';
            }
            return updated;
          }
          return payment;
        })
      );
      return payments.find(p => p.id === id)!;
    } finally {
      setLoading(false);
    }
  };

  const deletePayment = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      setPayments(prev => prev.filter(payment => payment.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const getPayment = (id: string): Payment | undefined => {
    return payments.find(payment => payment.id === id);
  };

  const getPaymentsByDocument = (documentId: string): Payment[] => {
    return payments.filter(payment => payment.documentId === documentId);
  };

  const updatePaymentStatus = async (id: string, status: PaymentStatus): Promise<void> => {
    await updatePayment(id, { paymentStatus: status });
  };

  const value = {
    payments,
    loading,
    createPayment,
    updatePayment,
    deletePayment,
    getPayment,
    getPaymentsByDocument,
    updatePaymentStatus,
  };

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}