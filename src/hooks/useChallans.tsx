import { useState, createContext, useContext, ReactNode } from 'react';
import { Challan } from '../types';

interface ChallanContextType {
  challans: Challan[];
  loading: boolean;
  createChallan: (data: Partial<Challan>) => Promise<Challan>;
  updateChallan: (id: string, data: Partial<Challan>) => Promise<Challan>;
  deleteChallan: (id: string) => Promise<void>;
  getChallan: (id: string) => Challan | undefined;
  getChallansByDocument: (documentId: string) => Challan[];
  submitChallan: (id: string) => Promise<void>;
  approveChallan: (id: string) => Promise<void>;
  rejectChallan: (id: string) => Promise<void>;
}

const ChallanContext = createContext<ChallanContextType | undefined>(undefined);

const mockChallans: Challan[] = [];

export function useChallans() {
  const context = useContext(ChallanContext);
  if (context === undefined) {
    throw new Error('useChallans must be used within a ChallanProvider');
  }
  return context;
}

export function ChallanProvider({ children }: { children: ReactNode }) {
  const [challans, setChallans] = useState<Challan[]>(mockChallans);
  const [loading, setLoading] = useState(false);

  const generateChallanNumber = (): string => {
    const year = new Date().getFullYear();
    const count = challans.length + 1;
    return `CHALLAN/${year}/${count.toString().padStart(3, '0')}`;
  };

  const createChallan = async (data: Partial<Challan>): Promise<Challan> => {
    setLoading(true);
    try {
      const newChallan: Challan = {
        id: `CH${Date.now()}`,
        documentId: data.documentId || '',
        challanNumber: data.challanNumber || generateChallanNumber(),
        amount: data.amount || 0,
        filledBy: data.filledBy || 'Current User',
        filledAt: new Date(),
        status: 'draft',
        notes: data.notes,
        ...data,
      };

      setChallans(prev => [...prev, newChallan]);
      return newChallan;
    } finally {
      setLoading(false);
    }
  };

  const updateChallan = async (id: string, data: Partial<Challan>): Promise<Challan> => {
    setLoading(true);
    try {
      setChallans(prev => 
        prev.map(challan => 
          challan.id === id ? { ...challan, ...data } : challan
        )
      );
      return challans.find(c => c.id === id)!;
    } finally {
      setLoading(false);
    }
  };

  const deleteChallan = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      setChallans(prev => prev.filter(challan => challan.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const getChallan = (id: string): Challan | undefined => {
    return challans.find(challan => challan.id === id);
  };

  const getChallansByDocument = (documentId: string): Challan[] => {
    return challans.filter(challan => challan.documentId === documentId);
  };

  const submitChallan = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await updateChallan(id, { status: 'submitted' });
    } finally {
      setLoading(false);
    }
  };

  const approveChallan = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await updateChallan(id, { status: 'approved' });
    } finally {
      setLoading(false);
    }
  };

  const rejectChallan = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await updateChallan(id, { status: 'rejected' });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    challans,
    loading,
    createChallan,
    updateChallan,
    deleteChallan,
    getChallan,
    getChallansByDocument,
    submitChallan,
    approveChallan,
    rejectChallan,
  };

  return <ChallanContext.Provider value={value}>{children}</ChallanContext.Provider>;
}