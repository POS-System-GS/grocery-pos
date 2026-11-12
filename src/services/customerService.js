import api from './api';

export const getAllCustomers = async () => {
  const response = await api.get('/customers');
  return response.data;
};

export const getCustomerById = async (id) => {
  const response = await api.get(`/customers/${id}`);
  return response.data;
};

export const createCustomer = async (customerData) => {
  const response = await api.post('/customers', customerData);
  return response.data;
};

export const getCustomerHistory = async (id) => {
  const response = await api.get(`/customers/${id}/history`);
  return response.data;
};
