import React from 'react';
import { 
  FileText, 
  CreditCard, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useDocuments } from '../hooks/useDocuments.tsx';
import { usePayments } from '../hooks/usePayments.tsx';
import { useChallans } from '../hooks/useChallans.tsx';
import { DatabaseStatus } from '../components/Layout/DatabaseStatus';
import { format } from 'date-fns';
import { MobileDashboard } from '../components/Mobile/MobileDashboard';

// Hook to detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

const mockActivities: any[] = [];

export function Dashboard() {
  const { user } = useAuth();
  const { documents } = useDocuments();
  const { payments } = usePayments();
  const { challans } = useChallans();

  const isMobile = useIsMobile();

  // Return mobile version if on mobile
  if (isMobile) {
    return <MobileDashboard />;
  }

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

  const statCards = [
    {
      title: 'Total Documents',
      value: docStats.totalDocuments.toLocaleString(),
      icon: FileText,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive',
    },
    {
      title: 'Pending Collection',
      value: docStats.pendingCollection.toString(),
      icon: Clock,
      color: 'bg-yellow-500',
      change: '-5%',
      changeType: 'positive',
    },
    {
      title: 'In Progress',
      value: docStats.inProgress.toString(),
      icon: AlertCircle,
      color: 'bg-orange-500',
      change: '+8%',
      changeType: 'negative',
    },
    {
      title: 'Completed',
      value: docStats.completed.toLocaleString(),
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+15%',
      changeType: 'positive',
    },
  ];

  const paymentCards = [
    {
      title: 'Total Payments',
      value: `₹${(paymentStats.totalPayments / 100000).toFixed(1)}L`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: '+22%',
      changeType: 'positive',
    },
    {
      title: 'Pending Payments',
      value: `₹${(paymentStats.pendingPayments / 100000).toFixed(1)}L`,
      icon: CreditCard,
      color: 'bg-red-500',
      change: '-10%',
      changeType: 'positive',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Database Status */}
      <DatabaseStatus />

      {/* Welcome Message */}
      <div className="bg-gradient-primary rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-orange-100">
          Here's what's happening with your documents and payments today.
        </p>
      </div>

      {/* Document Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    card.changeType === 'positive' 
                      ? 'text-green-700 bg-green-100' 
                      : 'text-red-700 bg-red-100'
                  }`}>
                    {card.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {card.value}
                </h3>
                <p className="text-gray-600 text-sm">{card.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paymentCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    card.changeType === 'positive' 
                      ? 'text-green-700 bg-green-100' 
                      : 'text-red-700 bg-red-100'
                  }`}>
                    {card.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {card.value}
                </h3>
                <p className="text-gray-600 text-sm">{card.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {mockActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {format(activity.timestamp, 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.details}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    by {activity.userName} • Document ID: {activity.documentId}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}