import api from './api';

export const createSale = async (saleData) => {
  // saleData includes paymentMethod, items, customerId, discountAmount, taxAmount
  const response = await api.post('/sales', saleData);
  return response.data;
};

export const getReceipt = async (id) => {
  const response = await api.get(`/sales/${id}/receipt`);
  return response.data;
};

export const getAllSales = async () => {
  const response = await api.get('/sales');
  return response.data;
};
