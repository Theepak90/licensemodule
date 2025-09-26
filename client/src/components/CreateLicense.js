import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLicense } from '../contexts/LicenseContext';
import { 
  Key, 
  User, 
  Mail, 
  Calendar, 
  Settings, 
  Save,
  ArrowLeft,
  Copy,
  Check,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const CreateLicense = () => {
  const navigate = useNavigate();
  const { createLicense } = useLicense();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdLicense, setCreatedLicense] = useState(null);
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    productName: 'Torro Platform',
    version: '1.0.0',
    licenseType: 'trial',
    expiryDays: 30,
    maxUsers: 1,
    maxConnections: 10,
    features: {
      database_access: true,
      api_access: true,
      analytics: false,
      support: false
    },
    notes: '',
    // FORCE ALL LICENSES TO USE MILITARY-GRADE SECURITY
    militaryGrade: true,
    hardwareBinding: true
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const license = await createLicense(formData);
      setCreatedLicense(license);
      toast.success('License created successfully!');
    } catch (error) {
      console.error('Failed to create license:', error);
    } finally {
      setLoading(false);
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

  const licenseTypes = [
    { value: 'trial', label: 'Trial', description: 'Limited time evaluation' },
    { value: 'standard', label: 'Standard', description: 'Basic features' },
    { value: 'premium', label: 'Premium', description: 'Advanced features' },
    { value: 'enterprise', label: 'Enterprise', description: 'Full feature set' }
  ];

  const features = [
    { key: 'database_access', label: 'Database Access', description: 'Full database read/write access' },
    { key: 'api_access', label: 'API Access', description: 'Access to REST API endpoints' },
    { key: 'analytics', label: 'Analytics', description: 'Advanced analytics and reporting' },
    { key: 'support', label: 'Support', description: 'Priority customer support' }
  ];

  if (createdLicense) {
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
          <h1 className="text-3xl font-bold text-gray-900">License Created Successfully!</h1>
          <p className="text-gray-600 mt-2">Your new encrypted license has been generated and is ready to use.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">License Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">License Key</label>
                <div className="mt-1 flex items-start space-x-2">
                  <div className="flex-1 bg-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto max-w-full">
                    <code className="whitespace-nowrap select-all">
                      {createdLicense.licenseKey}
                    </code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdLicense.licenseKey)}
                    className="p-2 text-gray-600 hover:text-gray-900 flex-shrink-0"
                    title="Copy license key"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {createdLicense.licenseKey.length} characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Client ID</label>
                <div className="mt-1 flex items-center space-x-2">
                  <code className="flex-1 bg-gray-100 p-3 rounded-lg font-mono text-sm">
                    {createdLicense.clientId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdLicense.clientId)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Name</label>
                  <p className="mt-1 text-sm text-gray-900">{formData.clientName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">License Type</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{createdLicense.licenseType}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(createdLicense.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Integration Instructions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">1. Download Integration Code</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Use the code below to integrate license validation into your application.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">2. API Endpoint</h3>
                <code className="block bg-gray-100 p-2 rounded text-sm mt-1">
                  POST /api/licenses/validate
                </code>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">3. Validation Payload</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm mt-1 overflow-x-auto">
{`{
  "licenseKey": "${createdLicense.licenseKey}",
  "clientId": "${createdLicense.clientId}"
}`}
                </pre>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => copyToClipboard(JSON.stringify({
                    licenseKey: createdLicense.licenseKey,
                    clientId: createdLicense.clientId
                  }, null, 2))}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Validation Data</span>
                </button>
              </div>
            </div>
          </div>
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
        <h1 className="text-3xl font-bold text-gray-900">Create New License</h1>
        <p className="text-gray-600 mt-2">Generate a new encrypted license key for a client</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Client Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Client Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                required
                value={formData.clientName}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter client name"
              />
            </div>

            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Client Email *
              </label>
              <input
                type="email"
                id="clientEmail"
                name="clientEmail"
                required
                value={formData.clientEmail}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter client email"
              />
            </div>
          </div>
        </div>

        {/* License Configuration */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Key className="h-5 w-5 mr-2" />
            License Configuration
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-2">
                Version
              </label>
              <input
                type="text"
                id="version"
                name="version"
                value={formData.version}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="licenseType" className="block text-sm font-medium text-gray-700 mb-2">
                License Type
              </label>
              <select
                id="licenseType"
                name="licenseType"
                value={formData.licenseType}
                onChange={handleChange}
                className="input-field"
              >
                {licenseTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="expiryDays" className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Days
              </label>
              <input
                type="number"
                id="expiryDays"
                name="expiryDays"
                min="1"
                max="3650"
                value={formData.expiryDays}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="maxUsers" className="block text-sm font-medium text-gray-700 mb-2">
                Max Users
              </label>
              <input
                type="number"
                id="maxUsers"
                name="maxUsers"
                min="1"
                value={formData.maxUsers}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="maxConnections" className="block text-sm font-medium text-gray-700 mb-2">
                Max Connections
              </label>
              <input
                type="number"
                id="maxConnections"
                name="maxConnections"
                min="1"
                value={formData.maxConnections}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map(feature => (
              <div key={feature.key} className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={feature.key}
                  name={`features.${feature.key}`}
                  checked={formData.features[feature.key]}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 text-torro-600 focus:ring-torro-500 border-gray-300 rounded"
                />
                <div>
                  <label htmlFor={feature.key} className="text-sm font-medium text-gray-900">
                    {feature.label}
                  </label>
                  <p className="text-xs text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Notes</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            className="input-field"
            placeholder="Add any additional notes or comments..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/licenses')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Create License</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateLicense;

