const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` : '/api';

/**
 * Universal fetch wrapper for Bhilwara Housing API.
 * Automatically attaches Bearer JWT token if available.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('bh_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.detail || 'An unexpected error occurred.';
    throw new Error(errorMsg);
  }

  return data;
}

export const authAPI = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  sendOTP: (otpData) => apiRequest('/auth/send-otp', { method: 'POST', body: JSON.stringify(otpData) }),
  verifyOTP: (otpData) => apiRequest('/auth/verify-otp', { method: 'POST', body: JSON.stringify(otpData) }),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (profileData) => apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  changePassword: (passwordData) => apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify(passwordData) }),
};

export const propertyAPI = {
  search: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/properties${query ? `?${query}` : ''}`);
  },
  getDetail: (id) => apiRequest(`/properties/${id}`),
};

export const userAPI = {
  getFavorites: () => apiRequest('/user/favorites'),
  toggleFavorite: (propertyId) => apiRequest(`/user/favorites/${propertyId}`, { method: 'POST' }),
  getEnquiries: () => apiRequest('/user/enquiries'),
  getAppointments: () => apiRequest('/user/appointments'),
};

export const enquiryAPI = {
  sendEnquiry: (data) => apiRequest('/enquiries', { method: 'POST', body: JSON.stringify(data) }),
  scheduleAppointment: (data) => apiRequest('/enquiries/appointments', { method: 'POST', body: JSON.stringify(data) }),
  submitPublicContact: (data) => apiRequest('/enquiries/public-contact', { method: 'POST', body: JSON.stringify(data) }),
};

export const ownerAPI = {
  getProperties: () => apiRequest('/owner/properties'),
  createProperty: (propData) => apiRequest('/owner/properties', { method: 'POST', body: JSON.stringify(propData) }),
  markSold: (id) => apiRequest(`/owner/properties/${id}/mark-sold`, { method: 'PUT' }),
  markAvailable: (id) => apiRequest(`/owner/properties/${id}/mark-available`, { method: 'PUT' }),
  getStats: () => apiRequest('/owner/stats'),
  getAnalytics: () => apiRequest('/owner/analytics'),
  getEnquiries: () => apiRequest('/owner/enquiries'),
  updateEnquiryStatus: (id, status) => apiRequest(`/owner/enquiries/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAppointments: () => apiRequest('/owner/appointments'),
  updateAppointmentStatus: (id, status) => apiRequest(`/owner/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

export const adminAPI = {
  getPending: () => apiRequest('/admin/pending-properties'),
  approve: (id) => apiRequest(`/admin/properties/${id}/approve`, { method: 'PUT' }),
  reject: (id) => apiRequest(`/admin/properties/${id}/reject`, { method: 'PUT' }),
  getStats: () => apiRequest('/admin/stats'),
  getUsers: () => apiRequest('/admin/users'),
  createUser: (userData) => apiRequest('/admin/users', { method: 'POST', body: JSON.stringify(userData) }),
  deleteUser: (id) => apiRequest(`/admin/users/${id}`, { method: 'DELETE' }),
  updateUserRole: (id, role) => apiRequest(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  toggleVerification: (userId) => apiRequest(`/admin/users/${userId}/verify`, { method: 'PUT' }),
  cleanupUnverified: () => apiRequest('/admin/cleanup-unverified-owners', { method: 'POST' }),
  getSecurityAudit: () => apiRequest('/admin/security-audit'),
};

/**
 * Upload a property image file to Supabase Storage via the backend.
 * Returns the public CDN URL of the uploaded image.
 */
export async function uploadImage(file) {
  const token = localStorage.getItem('bh_token');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.detail || 'Image upload failed.');
  }
  return data.url;
}

