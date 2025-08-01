import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Builder } from '../types';
import { databaseService } from '../services/databaseService';
import { useDatabase } from './useDatabase';

interface BuilderContextType {
  builders: Builder[];
  loading: boolean;
  createBuilder: (data: Partial<Builder>) => Promise<Builder>;
  updateBuilder: (id: string, data: Partial<Builder>) => Promise<Builder>;
  deleteBuilder: (id: string) => Promise<void>;
  getBuilder: (id: string) => Builder | undefined;
  getBuilderByName: (name: string) => Builder | undefined;
  addDocumentToBuilder: (builderId: string, documentId: string) => Promise<void>;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

const mockBuilders: Builder[] = [];

export function useBuilders() {
  const context = useContext(BuilderContext);
  if (context === undefined) {
    throw new Error('useBuilders must be used within a BuilderProvider');
  }
  return context;
}

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [builders, setBuilders] = useState<Builder[]>(mockBuilders);
  const [loading, setLoading] = useState(false);
  const { isConnected } = useDatabase();

  // Load builders from database on mount
  useEffect(() => {
    if (isConnected) {
      loadBuildersFromDatabase();
    }
  }, [isConnected]);

  const loadBuildersFromDatabase = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    try {
      const result = await databaseService.getBuilders();
      if (result.success && result.data) {
        const dbBuilders: Builder[] = result.data.map((row: any) => ({
          id: row.id.toString(),
          name: row.name,
          contactPerson: row.contact_person,
          phone: row.phone,
          email: row.email,
          address: row.address,
          registrationNumber: row.registration_number,
          documents: row.documents ? row.documents.split(',').filter(Boolean) : [],
          createdAt: new Date(row.created_at),
        }));
        setBuilders(dbBuilders);
      }
    } catch (error) {
      console.error('Error loading builders from database:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBuilderId = (): string => {
    const count = builders.length + 1;
    return `BLD${count.toString().padStart(3, '0')}`;
  };

  const createBuilder = async (data: Partial<Builder>): Promise<Builder> => {
    setLoading(true);
    try {
      if (isConnected) {
        // Create in database
        const result = await databaseService.createBuilder({
          name: data.name || '',
          contactPerson: data.contactPerson || '',
          phone: data.phone || '',
          email: data.email,
          address: data.address || '',
          registrationNumber: data.registrationNumber,
        });

        if (result.success) {
          // Reload builders from database
          await loadBuildersFromDatabase();
          return builders[builders.length - 1]; // Return the newly created builder
        } else {
          throw new Error(result.error || 'Failed to create builder');
        }
      } else {
        // Fallback to mock data
        const newBuilder: Builder = {
          id: data.id || generateBuilderId(),
          name: data.name || '',
          contactPerson: data.contactPerson || '',
          phone: data.phone || '',
          email: data.email,
          address: data.address || '',
          registrationNumber: data.registrationNumber,
          documents: data.documents || [],
          createdAt: new Date(),
          ...data,
        };

        setBuilders(prev => [...prev, newBuilder]);
        return newBuilder;
      }
    } finally {
      setLoading(false);
    }
  };

  const updateBuilder = async (id: string, data: Partial<Builder>): Promise<Builder> => {
    setLoading(true);
    try {
      if (isConnected) {
        // Update in database
        const result = await databaseService.updateBuilder(id, data);
        
        if (result.success) {
          // Reload builders from database
          await loadBuildersFromDatabase();
          return builders.find(b => b.id === id)!;
        } else {
          throw new Error(result.error || 'Failed to update builder');
        }
      } else {
        // Fallback to mock data
        setBuilders(prev => 
          prev.map(builder => 
            builder.id === id ? { ...builder, ...data } : builder
          )
        );
        return builders.find(b => b.id === id)!;
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteBuilder = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      setBuilders(prev => prev.filter(builder => builder.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const getBuilder = (id: string): Builder | undefined => {
    return builders.find(builder => builder.id === id);
  };

  const getBuilderByName = (name: string): Builder | undefined => {
    return builders.find(builder => 
      builder.name.toLowerCase().includes(name.toLowerCase())
    );
  };

  const addDocumentToBuilder = async (builderId: string, documentId: string): Promise<void> => {
    const builder = getBuilder(builderId);
    if (builder && !builder.documents.includes(documentId)) {
      await updateBuilder(builderId, {
        documents: [...builder.documents, documentId]
      });
    }
  };

  const value = {
    builders,
    loading,
    createBuilder,
    updateBuilder,
    deleteBuilder,
    getBuilder,
    getBuilderByName,
    addDocumentToBuilder,
  };

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}