import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bh_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('bh_token'));
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
          localStorage.setItem('bh_user', JSON.stringify(userData));
        } catch (err) {
          // Token expired or invalid
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    const data = await authAPI.login({ email, password });
    localStorage.setItem('bh_token', data.access_token);
    localStorage.setItem('bh_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const data = await authAPI.register(userData);
    localStorage.setItem('bh_token', data.access_token);
    localStorage.setItem('bh_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const sendRegisterOTP = async (otpData) => {
    return await authAPI.sendOTP(otpData);
  };

  const verifyOTPAndRegister = async (verifyData) => {
    const data = await authAPI.verifyOTP(verifyData);
    localStorage.setItem('bh_token', data.access_token);
    localStorage.setItem('bh_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('bh_token');
    localStorage.removeItem('bh_user');
    setToken(null);
    setUser(null);
  };

  const getDashboardRoute = (role) => {
    const r = role || user?.role;
    if (r === 'OWNER') return '/owner/dashboard';
    if (r === 'ADMIN') return '/admin';
    return '/dashboard';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        role: user?.role,
        loading,
        login,
        register,
        sendRegisterOTP,
        verifyOTPAndRegister,
        logout,
        getDashboardRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
