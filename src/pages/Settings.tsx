import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Database, 
  Mail, 
  Key, 
  Shield, 
  Bell, 
  Palette, 
  Globe, 
  Lock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  TestTube,
  CreditCard,
  MessageSquare,
  Download
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDatabase } from '../hooks/useDatabase';

interface ApiConfig {
  gmail: {
    enabled: boolean;
    config: {
      clientId: string;
      apiKey: string;
    };
  };
  mysql: {
    enabled: boolean;
    config: {
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
      ssl: string;
    };
  };
  appearance: {
    theme: 'light' | 'dark';
    colorScheme: 'orange' | 'blue' | 'green' | 'purple';
  };
}

export default function Settings() {
  const { user } = useAuth();
  const { isConnected, reconnect } = useDatabase();
  const [activeTab, setActiveTab] = useState('database');
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    gmail: {
      enabled: false,
      config: {
        clientId: '',
        apiKey: '',
      },
    },
    mysql: {
      enabled: false,
      config: {
        host: '',
        port: 3306,
        database: '',
        username: '',
        password: '',
        ssl: 'preferred',
      },
    },
    appearance: {
      theme: 'light',
      colorScheme: 'orange',
    },
  });

  // Load saved configuration on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('apiConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        // Merge with default config to ensure all properties exist
        setApiConfig({
          ...apiConfig,
          ...config,
          appearance: {
            ...apiConfig.appearance,
            ...config.appearance
          }
        });
        // Apply saved theme
        if (config.appearance && config.appearance.colorScheme) {
          applyColorScheme(config.appearance.colorScheme);
        }
      } catch (error) {
        console.error('Error loading saved config:', error);
      }
    }
  }, []);

  const applyColorScheme = (colorScheme: string) => {
    const root = document.documentElement;
    
    switch (colorScheme) {
      case 'orange':
        root.style.setProperty('--color-primary', '#ea580c');
        root.style.setProperty('--color-secondary', '#dc2626');
        break;
      case 'blue':
        root.style.setProperty('--color-primary', '#2563eb');
        root.style.setProperty('--color-secondary', '#1d4ed8');
        break;
      case 'green':
        root.style.setProperty('--color-primary', '#16a34a');
        root.style.setProperty('--color-secondary', '#15803d');
        break;
      case 'purple':
        root.style.setProperty('--color-primary', '#9333ea');
        root.style.setProperty('--color-secondary', '#7c3aed');
        break;
    }
  };

  const handleColorSchemeChange = (colorScheme: 'orange' | 'blue' | 'green' | 'purple') => {
    setApiConfig({
      ...apiConfig,
      appearance: { ...apiConfig.appearance, colorScheme }
    });
    applyColorScheme(colorScheme);
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      localStorage.setItem('apiConfig', JSON.stringify(apiConfig));
      
      // If MySQL is enabled, try to reconnect
      if (apiConfig.mysql.enabled) {
        await reconnect();
      }
      
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiConfig.mysql.enabled || !apiConfig.mysql.config.host) {
      setConnectionResult({
        success: false,
        message: 'Please fill in all required MySQL configuration fields'
      });
      return;
    }

    setTestingConnection(true);
    setConnectionResult(null);

    try {
      const response = await fetch('/api/test-db-connection.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiConfig.mysql.config),
      });

      if (response.ok) {
        const result = await response.json();
        setConnectionResult({
          success: result.success,
          message: result.success ? 'Database connection successful!' : result.error || 'Connection failed'
        });
      } else {
        setConnectionResult({
          success: false,
          message: 'Failed to test connection'
        });
      }
    } catch (error) {
      setConnectionResult({
        success: false,
        message: 'Network error while testing connection'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const tabs = [
    { id: 'database', label: 'MySQL Database', icon: Database },
    { id: 'gmail', label: 'Gmail API', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your application settings and integrations</p>
      </div>

      {/* Database Status Banner */}
      <div className={`rounded-xl p-4 border ${
        isConnected 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center space-x-3">
          {isConnected ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <div>
            <h3 className={`font-medium ${
              isConnected ? 'text-green-900' : 'text-red-900'
            }`}>
              Database Status: {isConnected ? 'Connected' : 'Disconnected'}
            </h3>
            <p className={`text-sm ${
              isConnected ? 'text-green-800' : 'text-red-800'
            }`}>
              {isConnected 
                ? 'Your database is connected and ready to use.'
                : 'Configure your MySQL database below to enable data persistence.'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* MySQL Database Settings */}
            {activeTab === 'database' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Database className="w-5 h-5 mr-2 text-blue-600" />
                      MySQL Database Configuration
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Configure your MySQL database connection for data persistence
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={apiConfig.mysql.enabled}
                      onChange={(e) => setApiConfig({
                        ...apiConfig,
                        mysql: { ...apiConfig.mysql, enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {apiConfig.mysql.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {apiConfig.mysql.enabled && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Host *
                        </label>
                        <input
                          type="text"
                          value={apiConfig.mysql.config.host}
                          onChange={(e) => setApiConfig({
                            ...apiConfig,
                            mysql: {
                              ...apiConfig.mysql,
                              config: { ...apiConfig.mysql.config, host: e.target.value }
                            }
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="localhost"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Port
                        </label>
                        <input
                          type="number"
                          value={apiConfig.mysql.config.port}
                          onChange={(e) => setApiConfig({
                            ...apiConfig,
                            mysql: {
                              ...apiConfig.mysql,
                              config: { ...apiConfig.mysql.config, port: parseInt(e.target.value) }
                            }
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="3306"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Database Name *
                        </label>
                        <input
                          type="text"
                          value={apiConfig.mysql.config.database}
                          onChange={(e) => setApiConfig({
                            ...apiConfig,
                            mysql: {
                              ...apiConfig.mysql,
                              config: { ...apiConfig.mysql.config, database: e.target.value }
                            }
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="om_services_db"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username *
                        </label>
                        <input
                          type="text"
                          value={apiConfig.mysql.config.username}
                          onChange={(e) => setApiConfig({
                            ...apiConfig,
                            mysql: {
                              ...apiConfig.mysql,
                              config: { ...apiConfig.mysql.config, username: e.target.value }
                            }
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="database_user"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords ? 'text' : 'password'}
                            value={apiConfig.mysql.config.password}
                            onChange={(e) => setApiConfig({
                              ...apiConfig,
                              mysql: {
                                ...apiConfig.mysql,
                                config: { ...apiConfig.mysql.config, password: e.target.value }
                              }
                            })}
                            className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="database_password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SSL Mode
                        </label>
                        <select
                          value={apiConfig.mysql.config.ssl}
                          onChange={(e) => setApiConfig({
                            ...apiConfig,
                            mysql: {
                              ...apiConfig.mysql,
                              config: { ...apiConfig.mysql.config, ssl: e.target.value }
                            }
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="disabled">Disabled</option>
                          <option value="preferred">Preferred</option>
                          <option value="required">Required</option>
                        </select>
                      </div>
                    </div>

                    {/* Test Connection */}
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleTestConnection}
                        disabled={testingConnection}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                      >
                        {testingConnection ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <TestTube className="w-4 h-4 mr-2" />
                            Test Connection
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          const sqlSchema = `-- Om Services Complete Database Schema
-- Generated on ${new Date().toISOString()}
-- This schema includes all tables for the complete Om Services application

CREATE DATABASE IF NOT EXISTS ${apiConfig.mysql.config.database};
USE ${apiConfig.mysql.config.database};

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('main_admin', 'staff_admin', 'challan_staff', 'field_collection_staff', 'data_entry_staff', 'document_delivery_staff') NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_number VARCHAR(100) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  builder_name VARCHAR(255) NOT NULL,
  property_details TEXT NOT NULL,
  document_type ENUM('agreement', 'lease_deed', 'sale_deed', 'mutation', 'partition_deed', 'gift_deed') NOT NULL,
  status ENUM('pending_collection', 'collected', 'data_entry_pending', 'data_entry_completed', 'registration_pending', 'registered', 'ready_for_delivery', 'delivered') DEFAULT 'pending_collection',
  assigned_to VARCHAR(255),
  collection_date TIMESTAMP NULL,
  data_entry_date TIMESTAMP NULL,
  registration_date TIMESTAMP NULL,
  delivery_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_document_number (document_number),
  INDEX idx_customer_phone (customer_phone),
  INDEX idx_status (status),
  INDEX idx_document_type (document_type),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_email (email),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Builders table
CREATE TABLE IF NOT EXISTS builders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT NOT NULL,
  registration_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_phone (phone),
  INDEX idx_registration_number (registration_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  agreement_value DECIMAL(15,2) NOT NULL,
  consideration_amount DECIMAL(15,2) NOT NULL,
  dhc_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  pending_amount DECIMAL(15,2) NOT NULL,
  payment_status ENUM('pending', 'partial', 'completed', 'refunded') DEFAULT 'pending',
  payment_method ENUM('cash', 'cheque', 'online', 'dd'),
  payment_date DATE,
  challan_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_document_id (document_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_challan_number (challan_number),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Challans table
CREATE TABLE IF NOT EXISTS challans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  challan_number VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  filled_by VARCHAR(255) NOT NULL,
  filled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_challan_number (challan_number),
  INDEX idx_document_id (document_id),
  INDEX idx_status (status),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type ENUM('document_collection', 'data_entry', 'document_delivery', 'challan_creation', 'payment_processing', 'customer_follow_up', 'document_verification', 'registration_follow_up', 'quality_check', 'custom') NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('pending', 'in_progress', 'on_hold', 'completed', 'cancelled', 'overdue') DEFAULT 'pending',
  assigned_to VARCHAR(255) NOT NULL,
  assigned_by VARCHAR(255) NOT NULL,
  document_id INT,
  customer_id INT,
  builder_id INT,
  due_date TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  estimated_hours DECIMAL(4,2),
  actual_hours DECIMAL(4,2),
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_priority (priority),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Task comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL,
  content TEXT NOT NULL,
  author_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_task_id (task_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  clock_in_time TIMESTAMP NULL,
  clock_out_time TIMESTAMP NULL,
  status ENUM('present', 'absent', 'late', 'half_day', 'on_leave', 'holiday', 'work_from_home') DEFAULT 'present',
  total_hours DECIMAL(4,2),
  break_time INT DEFAULT 60,
  overtime DECIMAL(4,2) DEFAULT 0,
  location VARCHAR(255),
  notes TEXT,
  approved_by VARCHAR(255),
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_date (user_id, date),
  INDEX idx_user_id (user_id),
  INDEX idx_date (date),
  INDEX idx_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  leave_type ENUM('sick_leave', 'casual_leave', 'annual_leave', 'maternity_leave', 'paternity_leave', 'emergency_leave') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP NULL,
  review_comments TEXT,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_start_date (start_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Salary records table
CREATE TABLE IF NOT EXISTS salary_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  base_salary DECIMAL(10,2) NOT NULL,
  allowances JSON,
  deductions JSON,
  overtime JSON,
  bonus DECIMAL(10,2) DEFAULT 0,
  gross_salary DECIMAL(10,2) NOT NULL,
  net_salary DECIMAL(10,2) NOT NULL,
  pay_period_month INT NOT NULL,
  pay_period_year INT NOT NULL,
  pay_date DATE NOT NULL,
  status ENUM('draft', 'pending_approval', 'approved', 'paid', 'cancelled') DEFAULT 'draft',
  payment_method ENUM('bank_transfer', 'cash', 'cheque', 'upi') DEFAULT 'bank_transfer',
  bank_details JSON,
  notes TEXT,
  approved_by VARCHAR(255),
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_pay_period (pay_period_month, pay_period_year),
  INDEX idx_status (status),
  INDEX idx_pay_date (pay_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff salary configurations table
CREATE TABLE IF NOT EXISTS staff_salary_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  base_salary DECIMAL(10,2) NOT NULL,
  allowances JSON,
  deductions JSON,
  overtime_rate DECIMAL(6,2) DEFAULT 0,
  payment_method ENUM('bank_transfer', 'cash', 'cheque', 'upi') DEFAULT 'bank_transfer',
  bank_details JSON,
  is_active BOOLEAN DEFAULT TRUE,
  effective_from DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_active (is_active),
  INDEX idx_effective_from (effective_from),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document files table
CREATE TABLE IF NOT EXISTS document_files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type ENUM('scan', 'photo', 'document') NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  uploaded_by VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_document_id (document_id),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  granted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_permission (user_id, module, action),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Task permissions table
CREATE TABLE IF NOT EXISTS task_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  task_type ENUM('document_collection', 'data_entry', 'document_delivery', 'challan_creation', 'payment_processing', 'customer_follow_up', 'document_verification', 'registration_follow_up', 'quality_check', 'custom') NOT NULL,
  permissions JSON NOT NULL,
  restrictions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_task_type (user_id, task_type),
  INDEX idx_user_id (user_id),
  INDEX idx_task_type (task_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  user_name VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  module VARCHAR(100) NOT NULL,
  record_id VARCHAR(100),
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_module (module),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user
INSERT IGNORE INTO users (email, name, role, password_hash, is_active) 
VALUES ('admin@omservices.com', 'Main Admin', 'main_admin', '$2b$10$rGKqDvQKNGnwxirsQg8OUeEcDNbpTLdU7ErMkqm6wjvLOKqm6wjvL', TRUE);

-- Insert default app settings
INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES
('gmail_config', '{"enabled": false, "clientId": "", "apiKey": ""}'),
('appearance_config', '{"theme": "light", "colorScheme": "orange"}'),
('notification_config', '{"email": true, "browser": true, "sound": false}'),
('security_config', '{"passwordMinLength": 8, "requireUppercase": true, "requireSpecialChars": true}');

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_customer_name ON documents(customer_name);
CREATE INDEX IF NOT EXISTS idx_documents_builder_name ON documents(builder_name);
CREATE INDEX IF NOT EXISTS idx_payments_total_amount ON payments(total_amount);
CREATE INDEX IF NOT EXISTS idx_challans_amount ON challans(amount);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_salary_records_net_salary ON salary_records(net_salary);`;
                          
                          const blob = new Blob([sqlSchema], { type: 'text/sql' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `om_services_complete_schema_${new Date().toISOString().split('T')[0]}.sql`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Schema
                      </button>

                      {connectionResult && (
                        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                          connectionResult.success 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {connectionResult.success ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                          <span className="text-sm font-medium">{connectionResult.message}</span>
                        </div>
                      )}
                    </div>

                    {/* Database Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Database Setup Information</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>• Tables will be created automatically when you save the configuration</p>
                        <p>• A default admin user will be created: admin@omservices.com / password123</p>
                        <p>• All existing data will be preserved if tables already exist</p>
                        <p>• Make sure your MySQL user has CREATE, INSERT, UPDATE, DELETE permissions</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gmail API Settings */}
            {activeTab === 'gmail' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-red-600" />
                      Gmail API Configuration
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Configure Gmail API for inbox integration
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={apiConfig.gmail.enabled}
                      onChange={(e) => setApiConfig({
                        ...apiConfig,
                        gmail: { ...apiConfig.gmail, enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {apiConfig.gmail.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {apiConfig.gmail.enabled && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Google OAuth 2.0 Client ID *
                        </label>
                        <input
                          type="text"
                          value={apiConfig.gmail.config.clientId}
                          onChange={(e) => setApiConfig({
                            ...apiConfig,
                            gmail: {
                              ...apiConfig.gmail,
                              config: { ...apiConfig.gmail.config, clientId: e.target.value }
                            }
                          })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="your-client-id.googleusercontent.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Google API Key *
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords ? 'text' : 'password'}
                            value={apiConfig.gmail.config.apiKey}
                            onChange={(e) => setApiConfig({
                              ...apiConfig,
                              gmail: {
                                ...apiConfig.gmail,
                                config: { ...apiConfig.gmail.config, apiKey: e.target.value }
                              }
                            })}
                            className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="AIza..."
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Setup Instructions */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-red-900 mb-3">Gmail API Setup Instructions</h4>
                      <div className="text-sm text-red-800 space-y-2">
                        <div>
                          <p className="font-medium">1. Google Cloud Console Setup:</p>
                          <ul className="ml-4 space-y-1">
                            <li>• Go to <a href="https://console.cloud.google.com" target="_blank" className="text-blue-600 hover:text-blue-700">Google Cloud Console</a></li>
                            <li>• Create a new project or select existing one</li>
                            <li>• Enable Gmail API in "APIs & Services" → "Library"</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="font-medium">2. Create OAuth 2.0 Credentials:</p>
                          <ul className="ml-4 space-y-1">
                            <li>• Go to "APIs & Services" → "Credentials"</li>
                            <li>• Click "Create Credentials" → "OAuth 2.0 Client IDs"</li>
                            <li>• Choose "Web application"</li>
                            <li>• Add authorized origins: http://localhost:5173 and your production domain</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="font-medium">3. Create API Key:</p>
                          <ul className="ml-4 space-y-1">
                            <li>• In "Credentials", click "Create Credentials" → "API Key"</li>
                            <li>• Restrict the key to Gmail API for security</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-green-600" />
                  Security Settings
                </h2>
                
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-900 mb-2">Security Features</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <p>• Role-based access control (RBAC) system</p>
                      <p>• Secure password hashing with bcrypt</p>
                      <p>• Session-based authentication</p>
                      <p>• Permission-based feature access</p>
                      <p>• Audit logging for all actions</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Password Policy</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Minimum password length</span>
                        <span className="text-sm font-medium text-gray-900">8 characters</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Require uppercase letters</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Require special characters</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-yellow-600" />
                  Notification Settings
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Email Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="text-sm text-gray-700">New document assignments</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="text-sm text-gray-700">Payment status updates</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700">Task deadline reminders</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">System Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="text-sm text-gray-700">Browser notifications</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="text-sm text-gray-700">Sound alerts</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Palette className="w-5 h-5 mr-2 text-purple-600" />
                  Appearance Settings
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Theme</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors">
                        <div className="w-full h-20 bg-white border border-gray-200 rounded mb-3"></div>
                        <p className="text-sm font-medium text-gray-900">Light Theme</p>
                        <p className="text-xs text-gray-500">Clean and bright interface</p>
                      </div>
                      <div className="border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors opacity-50">
                        <div className="w-full h-20 bg-gray-800 border border-gray-600 rounded mb-3"></div>
                        <p className="text-sm font-medium text-gray-900">Dark Theme</p>
                        <p className="text-xs text-gray-500">Coming soon</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Color Scheme</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <button
                        onClick={() => handleColorSchemeChange('orange')}
                        className={`w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg cursor-pointer border-2 transition-colors ${
                          apiConfig.appearance.colorScheme === 'orange' ? 'border-orange-600' : 'border-transparent hover:border-orange-600'
                        }`}
                        title="Orange Theme"
                      />
                      <button
                        onClick={() => handleColorSchemeChange('blue')}
                        className={`w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg cursor-pointer border-2 transition-colors ${
                          apiConfig.appearance.colorScheme === 'blue' ? 'border-blue-600' : 'border-transparent hover:border-blue-600'
                        }`}
                        title="Blue Theme"
                      />
                      <button
                        onClick={() => handleColorSchemeChange('green')}
                        className={`w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg cursor-pointer border-2 transition-colors ${
                          apiConfig.appearance.colorScheme === 'green' ? 'border-green-600' : 'border-transparent hover:border-green-600'
                        }`}
                        title="Green Theme"
                      />
                      <button
                        onClick={() => handleColorSchemeChange('purple')}
                        className={`w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg cursor-pointer border-2 transition-colors ${
                          apiConfig.appearance.colorScheme === 'purple' ? 'border-purple-600' : 'border-transparent hover:border-purple-600'
                        }`}
                        title="Purple Theme"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                      Select a color scheme to customize the application's primary colors
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex justify-end">
                <button
                  onClick={handleSaveConfig}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}