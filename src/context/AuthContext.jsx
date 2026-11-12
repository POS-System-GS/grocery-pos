import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session from localStorage on startup
  useEffect(() => {
    const savedUser = authService.getCurrentUser();
    const token = localStorage.getItem('pos_token');
    
    if (savedUser && token) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Invalid credentials or connection error.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isCashier = () => {
    return user && user.role === 'cashier';
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, isAdmin, isCashier, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
