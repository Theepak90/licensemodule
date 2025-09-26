import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLicense } from '../contexts/LicenseContext';
import { 
  Key, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';

const LicenseList = () => {
  const { licenses, loading, fetchLicenses, deleteLicense } = useLicense();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadLicenses();
  }, [currentPage, statusFilter, typeFilter]);

  const loadLicenses = async () => {
    try {
      const params = {
        page: currentPage,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { licenseType: typeFilter })
      };
      
      const data = await fetchLicenses(params);
      setPagination(data);
    } catch (error) {
      console.error('Failed to load licenses:', error);
    }
  };

  const handleDelete = async (id, clientName) => {
    if (window.confirm(`Are you sure you want to delete the license for ${clientName}?`)) {
      try {
        await deleteLicense(id);
        loadLicenses();
      } catch (error) {
        console.error('Failed to delete license:', error);
      }
    }
  };

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = 
      license.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.licenseKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

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

  const getTypeColor = (type) => {
    switch (type) {
      case 'enterprise':
        return 'text-purple-600 bg-purple-100';
      case 'premium':
        return 'text-blue-600 bg-blue-100';
      case 'standard':
        return 'text-green-600 bg-green-100';
      case 'trial':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Licenses</h1>
            <p className="text-gray-600 mt-2">Manage and monitor your license keys</p>
          </div>
          <Link
            to="/licenses/create"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create License</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search licenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Types</option>
              <option value="trial">Trial</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('');
                setTypeFilter('');
                setSearchTerm('');
              }}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Licenses Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Client</th>
                <th className="table-header">License Key</th>
                <th className="table-header">Type</th>
                <th className="table-header">Status</th>
                <th className="table-header">Expiry Date</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLicenses.length > 0 ? (
                filteredLicenses.map((license) => (
                  <tr key={license.clientId} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900">
                          {license.clientName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {license.clientEmail}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="font-mono text-sm">
                        {license.licenseKey.substring(0, 20)}...
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(license.licenseType)}`}>
                        {license.licenseType}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(license.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(license.status)}`}>
                          {license.status}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className={`text-sm ${new Date(license.expiryDate) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatDate(license.expiryDate)}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/licenses/${license.clientId}`}
                          className="text-torro-600 hover:text-torro-700"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(license.clientId, license.clientName)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete License"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No licenses found</p>
                    <p className="text-gray-400 mt-2">
                      {searchTerm || statusFilter || typeFilter
                        ? 'Try adjusting your filters'
                        : 'Create your first license to get started'
                      }
                    </p>
                    {!searchTerm && !statusFilter && !typeFilter && (
                      <Link
                        to="/licenses/create"
                        className="mt-4 btn-primary inline-flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create License</span>
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={pagination.currentPage === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LicenseList;

