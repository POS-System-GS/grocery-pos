import api from './api';

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

// Frontend local mock/recent sales helper
// The dashboard requires a list of recent sales. The backend has a sales table but not a specific 
// /sales endpoint in our task. We can query the reports, or we can fetch a short summary of recent 
// transactions by creating a quick helper to pull reports or fetch sales. Let's make sure the 
// UI handles recent sales gracefully. In the implementation, we can pull sales from the customer 
// histories or we can fetch the daily sales, or we can list transactions from a quick sales query.
// Let's implement a clean way to fetch recent sales. We can add a simple query on the backend 
// to pull sales, or fetch history. Let's make dashboard pull daily statistics.
