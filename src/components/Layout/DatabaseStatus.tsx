import React from 'react';
import { Database, AlertCircle, CheckCircle, Settings, RefreshCw } from 'lucide-react';
import { useDatabase } from '../../hooks/useDatabase';
import { useNavigate } from 'react-router-dom';

export function DatabaseStatus() {
  const { isConnected, isLoading, error, reconnect } = useDatabase();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-blue-800 font-medium">Connecting to database...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-900 font-medium">Database Connection Failed</h3>
            <p className="text-red-800 text-sm mt-1">
              {error || 'Unable to connect to MySQL database. The application is running in demo mode with mock data.'}
            </p>
            <div className="flex items-center space-x-3 mt-3">
              <button
                onClick={() => navigate('/settings')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                <Settings className="w-4 h-4 mr-1" />
                Configure Database
              </button>
              <button
                onClick={reconnect}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-3">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <div>
          <span className="text-green-900 font-medium">Database Connected</span>
          <p className="text-green-800 text-sm">Successfully connected to MySQL database. All changes will be saved.</p>
        </div>
      </div>
    </div>
  );
}