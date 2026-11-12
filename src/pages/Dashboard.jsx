import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as dashboardService from '../services/dashboardService';
import * as reportService from '../services/reportService';
import * as saleService from '../services/saleService';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  ArrowRight, 
  TrendingUp, 
  PackageCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar,
  CartesianGrid
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Load stats, charts data, and sales logs in parallel
        const [statsRes, monthlyRes, bestSellersRes, salesRes] = await Promise.all([
          dashboardService.getDashboardStats(),
          reportService.getMonthlyReport(),
          reportService.getBestSellersReport(),
          saleService.getAllSales()
        ]);

        setStats(statsRes.data);
        
        // Format monthly data for charts (take last 6 months for clean view)
        const formattedMonthly = (monthlyRes.data || [])
          .slice(0, 6)
          .reverse()
          .map(item => ({
            name: item.MonthName.split(' ')[0], // just month name
            revenue: parseFloat(item.Revenue),
            sales: item.TotalSales
          }));
        setMonthlyData(formattedMonthly);

        // Format best sellers
        const formattedSellers = (bestSellersRes.data || [])
          .slice(0, 5)
          .map(item => ({
            name: item.ProductName.length > 15 ? `${item.ProductName.slice(0, 15)}...` : item.ProductName,
            qty: item.TotalQuantitySold,
            revenue: parseFloat(item.TotalRevenueGenerated)
          }));
        setBestSellers(formattedSellers);

        // Recent sales logs (take first 5)
        setRecentSales((salesRes.data || []).slice(0, 5));

      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
        setError('Could not connect to the backend server. Please verify the API database configurations.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400">
        <h3 className="font-bold text-lg mb-2">Connection Failure</h3>
        <p className="text-sm mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Today's Revenue",
      value: `$${parseFloat(stats?.todaysRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "bg-emerald-500",
      description: "Net register transactions today"
    },
    {
      title: "Total Transactions",
      value: stats?.totalSales || 0,
      icon: ShoppingCart,
      color: "bg-blue-500",
      description: "Lifetime checkouts processed"
    },
    {
      title: "Unique Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "bg-purple-500",
      description: "Active products in catalog"
    },
    {
      title: "Low Stock Items",
      value: stats?.lowStockCount || 0,
      icon: AlertTriangle,
      color: stats?.lowStockCount > 0 ? "bg-amber-500" : "bg-slate-400",
      description: "Items needing replenishments",
      alert: stats?.lowStockCount > 0,
      onClick: () => navigate(stats?.lowStockCount > 0 ? '/inventory' : '#')
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i}
              onClick={card.onClick}
              className={`bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-premium transition-all duration-200 ${card.onClick ? 'cursor-pointer hover:shadow-premium-hover hover:border-emerald-500/20' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl text-white ${card.color} shadow-lg shadow-black/5`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                {card.value}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center">
                {card.alert && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping mr-1.5"></span>}
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-premium">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Revenue Trend</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Monthly checkout comparisons</p>
            </div>
            <div className="flex items-center space-x-1 text-emerald-500 text-xs font-semibold">
              <TrendingUp size={16} />
              <span>Live aggregates</span>
            </div>
          </div>
          
          <div className="h-72">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-900" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: '#1e293b', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue ($)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No monthly transactions recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Best Selling Products Chart */}
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-premium">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Popular Products</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Top items sold by quantity</p>
          </div>
          
          <div className="h-72 mt-6">
            {bestSellers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestSellers} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: '#1e293b', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="qty" fill="#10b981" radius={[0, 4, 4, 0]} name="Qty Sold" barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm text-center">
                No items sold yet. Run checkouts to generate ranks!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales History */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-premium overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-900">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Recent Checkout Logs</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Latest completed terminal sales</p>
          </div>
          <button 
            onClick={() => navigate('/sales-history')}
            className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 flex items-center space-x-1.5 transition"
          >
            <span>View All Sales</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentSales.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-900">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Cashier</th>
                  <th className="px-6 py-4 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-sm">
                {recentSales.map((sale) => (
                  <tr key={sale.SaleId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/25 transition">
                    <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">
                      INV-{String(sale.SaleId).padStart(6, '0')}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(sale.SaleDate).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {sale.CustomerName || 'Walk-in Customer'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize
                        ${sale.PaymentMethod === 'cash' ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' : ''}
                        ${sale.PaymentMethod === 'card' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' : ''}
                        ${sale.PaymentMethod === 'mobile' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400' : ''}
                      `}>
                        {sale.PaymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {sale.CashierName}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-slate-800 dark:text-slate-100">
                      ${parseFloat(sale.FinalAmount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <PackageCheck size={48} className="mb-3 text-slate-300" />
              <p className="text-sm">No sales processed yet. Complete checkout to begin tracking logs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
