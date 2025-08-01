import React from 'react';
import { 
  FileText, 
  CreditCard, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Plus,
  ArrowRight,
  CheckSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDocuments } from '../../hooks/useDocuments';
import { usePayments } from '../../hooks/usePayments';
import { MobileStatsGrid } from './MobileStatsGrid';
import { MobileCard } from './MobileCard';
import { MobileListItem } from './MobileListItem';

export function MobileDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { documents } = useDocuments();
  const { payments } = usePayments();

  const getDocumentStats = () => {
    const totalDocuments = documents.length;
    const pendingCollection = documents.filter(d => d.status === 'pending_collection').length;
    const inProgress = documents.filter(d => 
      ['collected', 'data_entry_pending', 'data_entry_completed', 'registration_pending'].includes(d.status)
    ).length;
    const completed = documents.filter(d => d.status === 'delivered').length;

    return { totalDocuments, pendingCollection, inProgress, completed };
  };

  const getPaymentStats = () => {
    const totalPayments = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const pendingPayments = payments.reduce((sum, p) => sum + p.pendingAmount, 0);

    return { totalPayments, pendingPayments };
  };

  const docStats = getDocumentStats();
  const paymentStats = getPaymentStats();

  const statsData = [
    {
      title: 'Total Documents',
      value: docStats.totalDocuments,
      icon: FileText,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Pending Collection',
      value: docStats.pendingCollection,
      icon: Clock,
      color: 'bg-orange-500',
      change: '-5%',
      changeType: 'positive' as const,
    },
    {
      title: 'In Progress',
      value: docStats.inProgress,
      icon: AlertCircle,
      color: 'bg-yellow-500',
      change: '+8%',
      changeType: 'negative' as const,
    },
    {
      title: 'Completed',
      value: docStats.completed,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+15%',
      changeType: 'positive' as const,
    },
  ];

  const quickActions = [
    {
      title: 'New Document',
      subtitle: 'Create document record',
      icon: FileText,
      action: () => navigate('/documents'),
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'View Tasks',
      subtitle: 'Check assigned tasks',
      icon: CheckSquare,
      action: () => navigate('/tasks'),
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Check Inbox',
      subtitle: 'View messages',
      icon: Users,
      action: () => navigate('/inbox'),
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Attendance',
      subtitle: 'Clock in/out',
      icon: Clock,
      action: () => navigate('/attendance'),
      color: 'from-orange-500 to-orange-600'
    },
  ];

  const recentDocuments = documents.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <MobileCard className="bg-gradient-primary text-white border-0">
        <div>
          <h2 className="text-lg font-bold mb-1">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-orange-100 text-sm">
            Here's your dashboard overview
          </p>
        </div>
      </MobileCard>

      {/* Stats Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Overview</h3>
        <MobileStatsGrid stats={statsData} />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <MobileCard
                key={index}
                onClick={action.action}
                className={`bg-gradient-to-br ${action.color} text-white border-0`}
              >
                <div className="text-center">
                  <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-2 inline-flex">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-sm">{action.title}</h4>
                  <p className="text-xs opacity-90">{action.subtitle}</p>
                </div>
              </MobileCard>
            );
          })}
        </div>
      </div>

      {/* Recent Documents */}
      {recentDocuments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Recent Documents</h3>
            <button
              onClick={() => navigate('/documents')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-3">
            {recentDocuments.map((doc) => (
              <MobileListItem
                key={doc.id}
                title={doc.documentNumber}
                subtitle={doc.customerName}
                description={doc.propertyDetails}
                icon={FileText}
                badge={doc.status.replace('_', ' ').toUpperCase()}
                badgeColor={
                  doc.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  doc.status === 'pending_collection' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }
                onClick={() => navigate(`/documents/${doc.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Payment Summary */}
      <MobileCard>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Payment Summary</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">₹{(paymentStats.totalPayments / 100000).toFixed(1)}L</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pending:</span>
                <span className="font-medium text-orange-600">₹{(paymentStats.pendingPayments / 100000).toFixed(1)}L</span>
              </div>
            </div>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </MobileCard>
    </div>
  );
}