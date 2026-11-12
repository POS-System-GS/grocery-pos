import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data && response.data.token) {
    localStorage.setItem('pos_token', response.data.token);
    localStorage.setItem('pos_user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const register = async (username, email, password, role) => {
  const response = await api.post('/auth/register', { username, email, password, role });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('pos_token');
  localStorage.removeItem('pos_user');
};

export const getCurrentUser = () => {
  const userJson = localStorage.getItem('pos_user');
  return userJson ? JSON.parse(userJson) : null;
};

export const isAuthenticated = () => {
  return localStorage.getItem('pos_token') !== null;
};
