import api from './api';

export const getDailyReport = async () => {
  const response = await api.get('/reports/daily');
  return response.data;
};

export const getMonthlyReport = async () => {
  const response = await api.get('/reports/monthly');
  return response.data;
};

export const getBestSellersReport = async () => {
  const response = await api.get('/reports/best-sellers');
  return response.data;
};
