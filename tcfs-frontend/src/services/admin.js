// src/services/admin.js

import { getToken } from './auth';

const API_URL = "/api/admin";

async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  if (!token) throw new Error("No authentication token found");

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      console.error('API Error:', res.status, data);
      throw new Error(data.message || `API Error: ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    if (error instanceof TypeError) {
      throw new Error("Network error - unable to reach server");
    }
    throw error;
  }
}

export const getStats = () => fetchWithAuth(`${API_URL}/stats`);

export const getUsers = ({ search, status }) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status && status !== 'all') params.append('status', status);
  return fetchWithAuth(`${API_URL}/users?${params.toString()}`);
};
export const manageUser = (userId, action) => fetchWithAuth(`${API_URL}/users/${userId}/manage`, {
  method: 'POST',
  body: JSON.stringify({ action })
});
export const getVerifications = () => fetchWithAuth(`${API_URL}/verifications`);
export const handleVerification = (id, action, comments) => fetchWithAuth(`${API_URL}/verifications/${id}/handle`, {
  method: 'POST',
  body: JSON.stringify({ action, comments })
});
export const getReports = () => fetchWithAuth(`${API_URL}/reports`);
export const updateReport = (id, status, adminAction) => fetchWithAuth(`${API_URL}/reports/${id}/update`, {
  method: 'POST',
  body: JSON.stringify({ status, adminAction })
});
export const getTrips = () => fetchWithAuth(`${API_URL}/trips`);
export const updateTrip = (id, updates) => fetchWithAuth(`${API_URL}/trips/${id}/update`, {
  method: 'POST',
  body: JSON.stringify(updates)
});
export const deleteTrip = (id) => fetchWithAuth(`${API_URL}/trips/${id}`, {
  method: 'DELETE'
});
export const sendBroadcast = (message, type) => fetchWithAuth(`${API_URL}/broadcast`, {
  method: 'POST',
  body: JSON.stringify({ message, type })
});
export const getAIConfig = () => fetchWithAuth(`${API_URL}/config`);
export const updateAIConfig = (key, value) => fetchWithAuth(`${API_URL}/config`, {
  method: 'POST',
  body: JSON.stringify({ key, value })
});
export const getDestinations = () => fetchWithAuth(`${API_URL}/destinations`);
export const getDestinationDetail = (name) => fetchWithAuth(`${API_URL}/destinations/${encodeURIComponent(name)}`);
