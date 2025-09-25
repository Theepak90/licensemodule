import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLicense } from '../contexts/LicenseContext';
import api from '../api/config';
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
  AlertTriangle,
  Plus,
  Clock,
  Save,
  X,
  Zap,
  Database,
  Globe,
  Lock,
  Unlock,
  RefreshCw
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
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [newFeature, setNewFeature] = useState({ name: '', description: '', enabled: true });
  const [extendData, setExtendData] = useState({ days: 30, reason: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLicenseDetails();
  }, [id]);

  // Update countdown every minute for real-time updates
  useEffect(() => {
    if (!license) return;
    
    const interval = setInterval(() => {
      // Force re-render by updating a dummy state
      setLicense(prev => prev ? { ...prev, _refresh: Date.now() } : null);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [license]);

  const fetchLicenseDetails = async () => {
    try {
      const response = await api.get(`/api/licenses/${id}`);
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
    setSaving(true);
    try {
      await updateLicense(id, formData);
      setEditing(false);
      fetchLicenseDetails();
      toast.success('License updated successfully!');
    } catch (error) {
      console.error('Failed to update license:', error);
      toast.error('Failed to update license');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFeature = async () => {
    if (!newFeature.name.trim()) {
      toast.error('Feature name is required');
      return;
    }

    setSaving(true);
    try {
      const updatedFeatures = {
        ...formData.features,
        [newFeature.name]: {
          enabled: newFeature.enabled,
          description: newFeature.description,
          addedAt: new Date().toISOString()
        }
      };

      await updateLicense(id, { ...formData, features: updatedFeatures });
      setNewFeature({ name: '', description: '', enabled: true });
      setShowFeatureModal(false);
      fetchLicenseDetails();
      toast.success('Feature added successfully!');
    } catch (error) {
      console.error('Failed to add feature:', error);
      toast.error('Failed to add feature');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFeature = async (featureName) => {
    if (!window.confirm(`Are you sure you want to remove the feature "${featureName}"?`)) {
      return;
    }

    setSaving(true);
    try {
      const updatedFeatures = { ...formData.features };
      delete updatedFeatures[featureName];

      await updateLicense(id, { ...formData, features: updatedFeatures });
      fetchLicenseDetails();
      toast.success('Feature removed successfully!');
    } catch (error) {
      console.error('Failed to remove feature:', error);
      toast.error('Failed to remove feature');
    } finally {
      setSaving(false);
    }
  };

  const handleExtendTimeline = async () => {
    if (!extendData.days || extendData.days <= 0) {
      toast.error('Please enter a valid number of days');
      return;
    }

    setSaving(true);
    try {
      const currentExpiry = new Date(license.expiryDate);
      const newExpiry = new Date(currentExpiry.getTime() + (extendData.days * 24 * 60 * 60 * 1000));
      
      await updateLicense(id, { 
        ...formData, 
        expiryDate: newExpiry.toISOString(),
        extensionHistory: [
          ...(license.extensionHistory || []),
          {
            days: extendData.days,
            reason: extendData.reason,
            extendedAt: new Date().toISOString(),
            previousExpiry: currentExpiry.toISOString(),
            newExpiry: newExpiry.toISOString()
          }
        ]
      });
      
      setExtendData({ days: 30, reason: '' });
      setShowExtendModal(false);
      fetchLicenseDetails();
      toast.success(`License extended by ${extendData.days} days!`);
    } catch (error) {
      console.error('Failed to extend license:', error);
      toast.error('Failed to extend license');
    } finally {
      setSaving(false);
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
  
  // Calculate days until expiry dynamically
  const calculateDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return 0;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate detailed time until expiry
  const calculateTimeUntilExpiry = (expiryDate) => {
    if (!expiryDate) return { days: 0, hours: 0, minutes: 0, totalHours: 0 };
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    
    if (diffTime <= 0) return { days: 0, hours: 0, minutes: 0, totalHours: 0 };
    
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    const totalHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    return { days, hours, minutes, totalHours };
  };
  
  const daysUntilExpiry = license ? calculateDaysUntilExpiry(license.expiryDate) : 0;
  const timeUntilExpiry = license ? calculateTimeUntilExpiry(license.expiryDate) : { days: 0, hours: 0, minutes: 0, totalHours: 0 };

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
    <div className="p-6" style={{ backgroundColor: '#f5f6ff', minHeight: '100vh' }}>
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
            <h1 className="text-3xl font-bold" style={{ color: '#5c6bb5' }}>{license.clientName}</h1>
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
                  disabled={saving}
                  className="btn-primary flex items-center space-x-2"
                  style={{ backgroundColor: '#5c6bb5' }}
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowExtendModal(true)}
                  className="btn-primary flex items-center space-x-2"
                  style={{ backgroundColor: '#5c6bb5' }}
                >
                  <Clock className="h-4 w-4" />
                  <span>Extend Timeline</span>
                </button>
                <button
                  onClick={() => setShowFeatureModal(true)}
                  className="btn-primary flex items-center space-x-2"
                  style={{ backgroundColor: '#5c6bb5' }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Feature</span>
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="btn-primary flex items-center space-x-2"
                  style={{ backgroundColor: '#5c6bb5' }}
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Key className="h-5 w-5 mr-2" />
                License Information
              </h2>
              {license && (
                <div className="text-right">
                  <div className={`text-sm font-medium ${daysUntilExpiry < 0 ? 'text-red-600' : daysUntilExpiry < 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {daysUntilExpiry < 0 ? 'EXPIRED' : daysUntilExpiry === 0 ? `${timeUntilExpiry.hours}h ${timeUntilExpiry.minutes}m left` : `${daysUntilExpiry} days left`}
                  </div>
                  <div className="text-xs text-gray-500">
                    Expires: {formatDate(license.expiryDate)}
                  </div>
                </div>
              )}
            </div>
            
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

          {/* Enhanced Features Management */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Zap className="h-5 w-5 mr-2" style={{ color: '#5c6bb5' }} />
                Features Management
              </h2>
              {!editing && (
                <button
                  onClick={() => setShowFeatureModal(true)}
                  className="btn-primary flex items-center space-x-2"
                  style={{ backgroundColor: '#5c6bb5' }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Feature</span>
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {Object.entries(license.features || {}).map(([key, feature]) => (
                <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {editing ? (
                      <input
                        type="checkbox"
                        name={`features.${key}`}
                        checked={formData.features[key]?.enabled || false}
                        onChange={handleChange}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: '#5c6bb5' }}
                      />
                    ) : (
                      <div className={`w-4 h-4 rounded ${feature?.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {key.replace('_', ' ')}
                      </span>
                      {feature?.description && (
                        <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
                      )}
                      {feature?.addedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Added: {new Date(feature.addedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {!editing && (
                    <button
                      onClick={() => handleRemoveFeature(key)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {Object.keys(license.features || {}).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No features configured yet</p>
                  <p className="text-sm">Click "Add Feature" to get started</p>
                </div>
              )}
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
                <span className="text-gray-600">Time Until Expiry</span>
                <div className="text-right">
                  {daysUntilExpiry < 0 ? (
                    <span className="font-medium text-red-600">Expired</span>
                  ) : daysUntilExpiry === 0 ? (
                    <span className="font-medium text-red-600">
                      {timeUntilExpiry.hours}h {timeUntilExpiry.minutes}m
                    </span>
                  ) : daysUntilExpiry < 7 ? (
                    <span className="font-medium text-yellow-600">
                      {daysUntilExpiry} days, {timeUntilExpiry.hours}h
                    </span>
                  ) : (
                    <span className="font-medium text-green-600">
                      {daysUntilExpiry} days
                    </span>
                  )}
                </div>
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

          {/* Timeline Extension History */}
          {license.extensionHistory && license.extensionHistory.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" style={{ color: '#5c6bb5' }} />
                Extension History
              </h3>
              <div className="space-y-3">
                {license.extensionHistory.map((extension, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          +{extension.days} days
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(extension.extendedAt).toLocaleDateString()}
                        </p>
                        {extension.reason && (
                          <p className="text-xs text-gray-600 mt-1">{extension.reason}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Previous: {new Date(extension.previousExpiry).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">New: {new Date(extension.newExpiry).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {/* Add Feature Modal */}
      {showFeatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Feature</h3>
              <button
                onClick={() => setShowFeatureModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feature Name
                </label>
                <input
                  type="text"
                  value={newFeature.name}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., advanced_analytics"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newFeature.description}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows="3"
                  placeholder="Describe what this feature does..."
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={newFeature.enabled}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: '#5c6bb5' }}
                />
                <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                  Enable this feature
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowFeatureModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFeature}
                disabled={saving}
                className="btn-primary flex items-center space-x-2"
                style={{ backgroundColor: '#5c6bb5' }}
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span>{saving ? 'Adding...' : 'Add Feature'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Timeline Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Extend License Timeline</h3>
              <button
                onClick={() => setShowExtendModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Expiry Date
                </label>
                <p className="text-gray-900 font-medium">{formatDate(license.expiryDate)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extend by (days)
                </label>
                <input
                  type="number"
                  value={extendData.days}
                  onChange={(e) => setExtendData(prev => ({ ...prev, days: parseInt(e.target.value) || 0 }))}
                  className="input-field"
                  min="1"
                  max="3650"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Expiry Date
                </label>
                <p className="text-gray-900 font-medium">
                  {extendData.days > 0 ? formatDate(new Date(new Date(license.expiryDate).getTime() + (extendData.days * 24 * 60 * 60 * 1000))) : 'Select days to see new date'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Extension
                </label>
                <textarea
                  value={extendData.reason}
                  onChange={(e) => setExtendData(prev => ({ ...prev, reason: e.target.value }))}
                  className="input-field"
                  rows="3"
                  placeholder="Why are you extending this license? (optional)"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowExtendModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendTimeline}
                disabled={saving || extendData.days <= 0}
                className="btn-primary flex items-center space-x-2"
                style={{ backgroundColor: '#5c6bb5' }}
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                <span>{saving ? 'Extending...' : 'Extend License'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseDetails;

