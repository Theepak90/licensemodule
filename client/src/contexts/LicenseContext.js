import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const LicenseContext = createContext();

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};

export const LicenseProvider = ({ children }) => {
  const [licenses, setLicenses] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchLicenses = async (params = {}) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/licenses', { params });
      setLicenses(response.data.licenses);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch licenses');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/licenses/stats/overview');
      setStats(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const createLicense = async (licenseData) => {
    try {
      const response = await axios.post('/api/licenses', licenseData);
      toast.success('License created successfully!');
      await fetchLicenses(); // Refresh the list
      return response.data.license;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create license';
      toast.error(message);
      throw error;
    }
  };

  const updateLicense = async (id, updates) => {
    try {
      const response = await axios.put(`/api/licenses/${id}`, updates);
      toast.success('License updated successfully!');
      await fetchLicenses(); // Refresh the list
      return response.data.license;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update license';
      toast.error(message);
      throw error;
    }
  };

  const deleteLicense = async (id) => {
    try {
      await axios.delete(`/api/licenses/${id}`);
      toast.success('License deleted successfully!');
      await fetchLicenses(); // Refresh the list
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete license';
      toast.error(message);
      throw error;
    }
  };

  const validateLicense = async (licenseKey, clientId) => {
    try {
      const response = await axios.post('/api/licenses/validate', {
        licenseKey,
        clientId
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'License validation failed';
      toast.error(message);
      throw error;
    }
  };

  const value = {
    licenses,
    stats,
    loading,
    fetchLicenses,
    fetchStats,
    createLicense,
    updateLicense,
    deleteLicense,
    validateLicense
  };

  return (
    <LicenseContext.Provider value={value}>
      {children}
    </LicenseContext.Provider>
  );
};


