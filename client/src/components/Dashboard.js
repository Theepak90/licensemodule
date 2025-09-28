import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLicense } from '../contexts/LicenseContext';
import { 
  Key, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';

const Dashboard = () => {
  const { stats, fetchStats, fetchLicenses } = useLicense();
  const [recentLicenses, setRecentLicenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchLicenses({ limit: 5 })
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="card p-6" style={{ backgroundColor: 'white' }}>
      <div className="flex items-center">
        <div className="p-3 rounded-lg" style={{ backgroundColor: '#5c6bb5' }}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold" style={{ color: '#5c6bb5' }}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'suspended':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'expired':
        return 'text-red-600 bg-red-100';
      case 'suspended':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: '#5c6bb5' }}>Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your license management system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Licenses"
          value={stats.total || 0}
          icon={Key}
          subtitle="All licenses"
        />
        <StatCard
          title="Active Licenses"
          value={stats.active || 0}
          icon={CheckCircle}
          subtitle="Currently active"
        />
        <StatCard
          title="Expired Licenses"
          value={stats.expired || 0}
          icon={XCircle}
          subtitle="Need attention"
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiringSoon || 0}
          icon={AlertTriangle}
          subtitle="Next 7 days"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Licenses */}
        <div className="card" style={{ backgroundColor: 'white' }}>
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: '#5c6bb5' }}>Recent Licenses</h2>
              <Link
                to="/licenses"
                className="text-torro-600 hover:text-torro-700 text-sm font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentLicenses.length > 0 ? (
              recentLicenses.map((license) => (
                <div key={license.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {license.clientName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {license.licenseKey ? license.licenseKey.substring(0, 20) + '...' : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(license.status)}`}>
                        {license.status}
                      </span>
                      {getStatusIcon(license.status)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No licenses found</p>
                <Link
                  to="/licenses/create"
                  className="mt-2 text-torro-600 hover:text-torro-700 text-sm font-medium"
                >
                  Create your first license
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ backgroundColor: 'white' }}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold" style={{ color: '#5c6bb5' }}>Quick Actions</h2>
          </div>
          <div className="p-6 space-y-4">
            <Link
              to="/licenses/create"
              className="flex items-center space-x-3 p-4 rounded-lg transition-colors duration-200"
              style={{ backgroundColor: '#f8f9ff' }}
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#5c6bb5' }}>
                <Key className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Create New License</p>
                <p className="text-sm text-gray-600">Generate a new license key</p>
              </div>
            </Link>

            <Link
              to="/licenses"
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#5c6bb5' }}>
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View All Licenses</p>
                <p className="text-sm text-gray-600">Manage existing licenses</p>
              </div>
            </Link>

            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">License Monitoring</p>
                <p className="text-sm text-gray-600">Automatic expiration checks running</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8 card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">License Validation</p>
                <p className="text-sm text-gray-600">Online and running</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Expiration Monitoring</p>
                <p className="text-sm text-gray-600">Checking every minute</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Database Connection</p>
                <p className="text-sm text-gray-600">Connected and healthy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

