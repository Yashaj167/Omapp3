import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.tsx';
import { DatabaseProvider } from './hooks/useDatabase.tsx';
import { UserProvider } from './hooks/useUsers.tsx';
import { DocumentProvider } from './hooks/useDocuments.tsx';
import { PaymentProvider } from './hooks/usePayments.tsx';
import { ChallanProvider } from './hooks/useChallans.tsx';
import { CustomerProvider } from './hooks/useCustomers.tsx';
import { BuilderProvider } from './hooks/useBuilders.tsx';
import { TaskProvider } from './hooks/useTasks.tsx';
import { GmailProvider } from './hooks/useGmail.tsx';
import { AttendanceProvider } from './hooks/useAttendance.tsx';
import { SalaryProvider } from './hooks/useSalary.tsx';
import { LoginForm } from './components/Auth/LoginForm';
import { ResponsiveLayout } from './components/Layout/ResponsiveLayout';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { DocumentDetail } from './pages/DocumentDetail';
import { Payments } from './pages/Payments';
import { Challans } from './pages/Challans';
import { Customers } from './pages/Customers';
import { Builders } from './pages/Builders';
import { Users } from './pages/Users';
import Settings from './pages/Settings';
import { Collection } from './pages/Collection';
import { Delivery } from './pages/Delivery';
import { DataEntry } from './pages/DataEntry';
import { Tasks } from './pages/Tasks';
import { TaskDetail } from './pages/TaskDetail';
import { Inbox } from './pages/Inbox';
import { Attendance } from './pages/Attendance';
import { Salary } from './pages/Salary';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <ResponsiveLayout>{children}</ResponsiveLayout>;
}

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/documents/:id" element={<ProtectedRoute><DocumentDetail /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="/challans" element={<ProtectedRoute><Challans /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      <Route path="/builders" element={<ProtectedRoute><Builders /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/collection" element={<ProtectedRoute><Collection /></ProtectedRoute>} />
      <Route path="/delivery" element={<ProtectedRoute><Delivery /></ProtectedRoute>} />
      <Route path="/data-entry" element={<ProtectedRoute><DataEntry /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
      <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
      <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
      <Route path="/salary" element={<ProtectedRoute><Salary /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <DatabaseProvider>
        <GmailProvider>
          <UserProvider>
            <CustomerProvider>
              <BuilderProvider>
                <DocumentProvider>
                  <PaymentProvider>
                    <ChallanProvider>
                      <TaskProvider>
                        <AttendanceProvider>
                          <SalaryProvider>
                            <Router>
                              <AppRoutes />
                            </Router>
                          </SalaryProvider>
                        </AttendanceProvider>
                      </TaskProvider>
                    </ChallanProvider>
                  </PaymentProvider>
                </DocumentProvider>
              </BuilderProvider>
            </CustomerProvider>
          </UserProvider>
        </GmailProvider>
      </DatabaseProvider>
    </AuthProvider>
  );
}

export default App;