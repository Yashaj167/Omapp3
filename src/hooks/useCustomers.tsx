import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Customer } from '../types';
import { databaseService } from '../services/databaseService';
import { useDatabase } from './useDatabase';

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  createCustomer: (data: Partial<Customer>) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;
  getCustomerByPhone: (phone: string) => Customer | undefined;
  getCustomerByEmail: (email: string) => Customer | undefined;
  addDocumentToCustomer: (customerId: string, documentId: string) => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const mockCustomers: Customer[] = [];

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [loading, setLoading] = useState(false);
  const { isConnected } = useDatabase();

  // Load customers from database on mount
  useEffect(() => {
    if (isConnected) {
      loadCustomersFromDatabase();
    }
  }, [isConnected]);

  const loadCustomersFromDatabase = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    try {
      const result = await databaseService.getCustomers();
      if (result.success && result.data) {
        const dbCustomers: Customer[] = result.data.map((row: any) => ({
          id: row.id.toString(),
          name: row.name,
          phone: row.phone,
          email: row.email,
          address: row.address,
          documents: row.documents ? row.documents.split(',').filter(Boolean) : [],
          createdAt: new Date(row.created_at),
        }));
        setCustomers(dbCustomers);
      }
    } catch (error) {
      console.error('Error loading customers from database:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCustomerId = (): string => {
    const count = customers.length + 1;
    return `CUST${count.toString().padStart(3, '0')}`;
  };

  const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
    setLoading(true);
    try {
      if (isConnected) {
        // Create in database
        const result = await databaseService.createCustomer({
          name: data.name || '',
          phone: data.phone || '',
          email: data.email,
          address: data.address || '',
        });

        if (result.success) {
          // Reload customers from database
          await loadCustomersFromDatabase();
          return customers[customers.length - 1]; // Return the newly created customer
        } else {
          throw new Error(result.error || 'Failed to create customer');
        }
      } else {
        // Fallback to mock data
        const newCustomer: Customer = {
          id: data.id || generateCustomerId(),
          name: data.name || '',
          phone: data.phone || '',
          email: data.email,
          address: data.address || '',
          documents: data.documents || [],
          createdAt: new Date(),
          ...data,
        };

        setCustomers(prev => [...prev, newCustomer]);
        return newCustomer;
      }
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: string, data: Partial<Customer>): Promise<Customer> => {
    setLoading(true);
    try {
      if (isConnected) {
        // Update in database
        const result = await databaseService.updateCustomer(id, data);
        
        if (result.success) {
          // Reload customers from database
          await loadCustomersFromDatabase();
          return customers.find(c => c.id === id)!;
        } else {
          throw new Error(result.error || 'Failed to update customer');
        }
      } else {
        // Fallback to mock data
        setCustomers(prev => 
          prev.map(customer => 
            customer.id === id ? { ...customer, ...data } : customer
          )
        );
        return customers.find(c => c.id === id)!;
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      setCustomers(prev => prev.filter(customer => customer.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const getCustomer = (id: string): Customer | undefined => {
    return customers.find(customer => customer.id === id);
  };

  const getCustomerByPhone = (phone: string): Customer | undefined => {
    return customers.find(customer => customer.phone === phone);
  };

  const getCustomerByEmail = (email: string): Customer | undefined => {
    return customers.find(customer => customer.email === email);
  };

  const addDocumentToCustomer = async (customerId: string, documentId: string): Promise<void> => {
    const customer = getCustomer(customerId);
    if (customer && !customer.documents.includes(documentId)) {
      await updateCustomer(customerId, {
        documents: [...customer.documents, documentId]
      });
    }
  };

  const value = {
    customers,
    loading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    getCustomerByPhone,
    getCustomerByEmail,
    addDocumentToCustomer,
  };

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}