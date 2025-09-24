import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLicense } from '../contexts/LicenseContext';
import axios from 'axios';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Copy, 
  Check,
  Key,
  User,
  Mail,
  Calendar,
  Settings,
  Activity,
  Shield,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const LicenseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateLicense, deleteLicense } = useLicense();
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchLicenseDetails();
  }, [id]);

  const fetchLicenseDetails = async () => {
    try {
      const response = await axios.get(`/api/licenses/${id}`);
      setLicense(response.data);
      setFormData({
        clientName: response.data.clientName,
        clientEmail: response.data.clientEmail,
        licenseType: response.data.licenseType,
        maxUsers: response.data.maxUsers,
        maxConnections: response.data.maxConnections,
        features: { ...response.data.features },
        notes: response.data.notes || '',
        status: response.data.status
      });
    } catch (error) {
      toast.error('Failed to fetch license details');
      navigate('/licenses');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('features.')) {
      const featureName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [featureName]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSave = async () => {
    try {
      await updateLicense(id, formData);
      setEditing(false);
      fetchLicenseDetails();
      toast.success('License updated successfully!');
    } catch (error) {
      console.error('Failed to update license:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the license for ${license.clientName}?`)) {
      try {
        await deleteLicense(id);
        navigate('/licenses');
      } catch (error) {
        console.error('Failed to delete license:', error);
      }
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = license && new Date(license.expiryDate) < new Date();
  const isExpiringSoon = license && new Date(license.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!license) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">License not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <button
          onClick={() => navigate('/licenses')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Licenses</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{license.clientName}</h1>
            <p className="text-gray-600 mt-2">License Details & Management</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-danger flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alert for expired or expiring licenses */}
      {(isExpired || isExpiringSoon) && (
        <div className="mb-6 card p-4 border-l-4 border-red-500 bg-red-50">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                {isExpired ? 'License Expired' : 'License Expiring Soon'}
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {isExpired 
                  ? 'This license has expired and is no longer valid.'
                  : 'This license will expire within 7 days.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main License Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* License Key & Client ID */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Key className="h-5 w-5 mr-2" />
              License Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Key
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-gray-100 p-3 rounded-lg font-mono text-sm break-all">
                    {license.licenseKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(license.licenseKey)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client ID
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-gray-100 p-3 rounded-lg font-mono text-sm">
                    {license.clientId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(license.clientId)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Client Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    className="input-field"
                  />
                ) : (
                  <p className="text-gray-900">{license.clientName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Email
                </label>
                {editing ? (
                  <input
                    type="email"
                    name="clientEmail"
                    value={formData.clientEmail}
                    onChange={handleChange}
                    className="input-field"
                  />
                ) : (
                  <p className="text-gray-900">{license.clientEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* License Configuration */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              License Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Type
                </label>
                {editing ? (
                  <select
                    name="licenseType"
                    value={formData.licenseType}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="trial">Trial</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(license.licenseType)}`}>
                    {license.licenseType}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                {editing ? (
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="revoked">Revoked</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(license.status)}`}>
                    {license.status}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Users
                </label>
                {editing ? (
                  <input
                    type="number"
                    name="maxUsers"
                    value={formData.maxUsers}
                    onChange={handleChange}
                    className="input-field"
                    min="1"
                  />
                ) : (
                  <p className="text-gray-900">{license.maxUsers}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Connections
                </label>
                {editing ? (
                  <input
                    type="number"
                    name="maxConnections"
                    value={formData.maxConnections}
                    onChange={handleChange}
                    className="input-field"
                    min="1"
                  />
                ) : (
                  <p className="text-gray-900">{license.maxConnections}</p>
                )}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(license.features).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-3">
                  {editing ? (
                    <input
                      type="checkbox"
                      name={`features.${key}`}
                      checked={formData.features[key]}
                      onChange={handleChange}
                      className="h-4 w-4 text-torro-600 focus:ring-torro-500 border-gray-300 rounded"
                    />
                  ) : (
                    <div className={`w-4 h-4 rounded ${value ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  )}
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {key.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Notes</h2>
            {editing ? (
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                className="input-field"
                placeholder="Add notes..."
              />
            ) : (
              <p className="text-gray-900">{license.notes || 'No notes available'}</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* License Status */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">License Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(license.status)}`}>
                  {license.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(license.licenseType)}`}>
                  {license.licenseType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Days Until Expiry</span>
                <span className={`font-medium ${license.daysUntilExpiry < 0 ? 'text-red-600' : license.daysUntilExpiry < 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {license.daysUntilExpiry < 0 ? 'Expired' : `${license.daysUntilExpiry} days`}
                </span>
              </div>
            </div>
          </div>

          {/* Important Dates */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Dates</h3>
            <div className="space-y-4">
              <div>
                <span className="text-gray-600 text-sm">Issued Date</span>
                <p className="text-gray-900 font-medium">{formatDate(license.issuedDate)}</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Expiry Date</span>
                <p className={`font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-900'}`}>
                  {formatDate(license.expiryDate)}
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Last Checked</span>
                <p className="text-gray-900 font-medium">{formatDate(license.lastChecked)}</p>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Activity
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Check Count</span>
                <span className="font-medium">{license.checkCount}</span>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Last Access IP</span>
                <p className="text-gray-900 font-medium text-sm">{license.lastAccessIP || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => copyToClipboard(JSON.stringify({
                  licenseKey: license.licenseKey,
                  clientId: license.clientId
                }, null, 2))}
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copy License Data</span>
              </button>
              
              <button
                onClick={() => copyToClipboard(`POST /api/licenses/validate\n\n{\n  "licenseKey": "${license.licenseKey}",\n  "clientId": "${license.clientId}"\n}`)}
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copy API Call</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseDetails;

