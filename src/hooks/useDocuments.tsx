import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Document, DocumentStatus, DocumentType } from '../types';
import { useCustomers } from './useCustomers';
import { useBuilders } from './useBuilders';
import { databaseService } from '../services/databaseService';
import { useDatabase } from './useDatabase';

interface DocumentContextType {
  documents: Document[];
  loading: boolean;
  createDocument: (data: Partial<Document>) => Promise<Document>;
  updateDocument: (id: string, data: Partial<Document>) => Promise<Document>;
  deleteDocument: (id: string) => Promise<void>;
  getDocument: (id: string) => Document | undefined;
  updateStatus: (id: string, status: DocumentStatus) => Promise<void>;
  addNote: (id: string, note: string) => Promise<void>;
  uploadFile: (id: string, file: File) => Promise<void>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

const mockDocuments: Document[] = [];

export function useDocuments() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
}

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [loading, setLoading] = useState(false);
  const { createCustomer, getCustomerByPhone, addDocumentToCustomer } = useCustomers();
  const { createBuilder, getBuilderByName, addDocumentToBuilder } = useBuilders();
  const { isConnected } = useDatabase();

  // Load documents from database on mount
  useEffect(() => {
    if (isConnected) {
      loadDocumentsFromDatabase();
    }
  }, [isConnected]);

  const loadDocumentsFromDatabase = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    try {
      const result = await databaseService.getDocuments();
      if (result.success && result.data) {
        const dbDocuments: Document[] = result.data.map((row: any) => ({
          id: row.id.toString(),
          documentNumber: row.document_number,
          customerName: row.customer_name,
          customerPhone: row.customer_phone,
          customerEmail: row.customer_email,
          builderName: row.builder_name,
          propertyDetails: row.property_details,
          documentType: row.document_type,
          status: row.status,
          collectionDate: row.collection_date ? new Date(row.collection_date) : undefined,
          dataEntryDate: row.data_entry_date ? new Date(row.data_entry_date) : undefined,
          registrationDate: row.registration_date ? new Date(row.registration_date) : undefined,
          deliveryDate: row.delivery_date ? new Date(row.delivery_date) : undefined,
          assignedTo: row.assigned_to,
          notes: [], // Notes would need a separate table in a real implementation
          files: [], // Files would need a separate table in a real implementation
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        }));
        setDocuments(dbDocuments);
      }
    } catch (error) {
      console.error('Error loading documents from database:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDocumentNumber = (type: DocumentType): string => {
    const prefix = type.toUpperCase().replace('_', '');
    const year = new Date().getFullYear();
    const count = documents.filter(d => d.documentType === type).length + 1;
    return `${prefix}/${year}/${count.toString().padStart(3, '0')}`;
  };

  const createDocument = async (data: Partial<Document>): Promise<Document> => {
    setLoading(true);
    try {
      if (isConnected) {
        // Create in database
        const documentNumber = data.documentNumber || generateDocumentNumber(data.documentType!);
        
        const result = await databaseService.createDocument({
          documentNumber,
          customerName: data.customerName || '',
          customerPhone: data.customerPhone || '',
          customerEmail: data.customerEmail,
          builderName: data.builderName || '',
          propertyDetails: data.propertyDetails || '',
          documentType: data.documentType!,
          status: 'pending_collection',
          assignedTo: data.assignedTo,
        });

        if (result.success) {
          // Auto-create customer if not exists
          if (data.customerName && data.customerPhone) {
            let customer = getCustomerByPhone(data.customerPhone);
            if (!customer) {
              await createCustomer({
                name: data.customerName,
                phone: data.customerPhone,
                email: data.customerEmail,
                address: data.propertyDetails || '',
              });
            }
          }

          // Auto-create builder if not exists
          if (data.builderName) {
            let builder = getBuilderByName(data.builderName);
            if (!builder) {
              await createBuilder({
                name: data.builderName,
                contactPerson: 'Contact Person',
                phone: '+91 0000000000',
                address: 'Address not provided',
              });
            }
          }

          // Reload documents from database
          await loadDocumentsFromDatabase();
          return documents[documents.length - 1]; // Return the newly created document
        } else {
          throw new Error(result.error || 'Failed to create document');
        }
      } else {
        // Fallback to mock data
        const newDocument: Document = {
          id: `DOC${Date.now()}`,
          documentNumber: data.documentNumber || generateDocumentNumber(data.documentType!),
          customerName: data.customerName || '',
          customerPhone: data.customerPhone || '',
          customerEmail: data.customerEmail,
          builderName: data.builderName || '',
          propertyDetails: data.propertyDetails || '',
          documentType: data.documentType!,
          status: 'pending_collection',
          assignedTo: data.assignedTo,
          notes: [],
          files: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };

        // Auto-create or update customer
        if (newDocument.customerName && newDocument.customerPhone) {
          let customer = getCustomerByPhone(newDocument.customerPhone);
          
          if (!customer) {
            customer = await createCustomer({
              name: newDocument.customerName,
              phone: newDocument.customerPhone,
              email: newDocument.customerEmail,
              address: newDocument.propertyDetails,
              documents: [newDocument.id],
            });
          } else {
            await addDocumentToCustomer(customer.id, newDocument.id);
          }
        }

        // Auto-create or update builder
        if (newDocument.builderName) {
          let builder = getBuilderByName(newDocument.builderName);
          
          if (!builder) {
            builder = await createBuilder({
              name: newDocument.builderName,
              contactPerson: 'Contact Person',
              phone: '+91 0000000000',
              address: 'Address not provided',
              documents: [newDocument.id],
            });
          } else {
            await addDocumentToBuilder(builder.id, newDocument.id);
          }
        }

        setDocuments(prev => [...prev, newDocument]);
        return newDocument;
      }
    } finally {
      setLoading(false);
    }
  };

  const updateDocument = async (id: string, data: Partial<Document>): Promise<Document> => {
    setLoading(true);
    try {
      if (isConnected) {
        // Update in database
        const result = await databaseService.updateDocument(id, data);
        
        if (result.success) {
          // Reload documents from database
          await loadDocumentsFromDatabase();
          return documents.find(d => d.id === id)!;
        } else {
          throw new Error(result.error || 'Failed to update document');
        }
      } else {
        // Fallback to mock data
        const updatedDocument = { ...data, updatedAt: new Date() };
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === id ? { ...doc, ...updatedDocument } : doc
          )
        );
        return documents.find(d => d.id === id)!;
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const getDocument = (id: string): Document | undefined => {
    return documents.find(doc => doc.id === id);
  };

  const updateStatus = async (id: string, status: DocumentStatus): Promise<void> => {
    await updateDocument(id, { status });
  };

  const addNote = async (id: string, note: string): Promise<void> => {
    const document = getDocument(id);
    if (document) {
      await updateDocument(id, { 
        notes: [...document.notes, note] 
      });
    }
  };

  const uploadFile = async (id: string, file: File): Promise<void> => {
    // Simulate file upload
    const document = getDocument(id);
    if (document) {
      const newFile = {
        id: `FILE${Date.now()}`,
        name: file.name,
        type: file.type.includes('image') ? 'photo' : 'document' as any,
        url: URL.createObjectURL(file),
        uploadedBy: 'Current User',
        uploadedAt: new Date(),
      };
      
      await updateDocument(id, {
        files: [...document.files, newFile]
      });
    }
  };

  const value = {
    documents,
    loading,
    createDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    updateStatus,
    addNote,
    uploadFile,
  };

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}