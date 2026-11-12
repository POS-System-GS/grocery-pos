import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Warehouse
} from 'lucide-react';

const MainLayout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'cashier'] },
    { name: 'POS Screen', path: '/pos', icon: ShoppingCart, roles: ['admin', 'cashier'] },
    { name: 'Products Catalog', path: '/products', icon: Package, roles: ['admin', 'cashier'] },
    { name: 'Inventory Manager', path: '/inventory', icon: Warehouse, roles: ['admin'] },
    { name: 'Sales History', path: '/sales-history', icon: History, roles: ['admin', 'cashier'] },
    { name: 'Customers Log', path: '/customers', icon: Users, roles: ['admin', 'cashier'] },
    { name: 'Analytics Reports', path: '/reports', icon: BarChart3, roles: ['admin'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'cashier'] },
  ];

  // Filter routes based on user roles
  const filteredNavItems = navItems.filter(item => 
    item.roles.includes('admin') ? isAdmin() : true
  );

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans`}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800
        transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-900">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-500/20">
              F
            </div>
            <span className="text-xl font-bold tracking-wide bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
              FreshMart POS
            </span>
          </div>
          <button 
            className="lg:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/15' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'}
                `}
              >
                <Icon size={20} className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Details */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-900">
          <div className="flex items-center space-x-3 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl mb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-semibold text-lg border border-emerald-200 dark:border-emerald-900">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-100">
                {user?.username || 'Username'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 capitalize truncate">
                {user?.role || 'cashier'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium transition-all duration-200"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-30">
          <div className="flex items-center space-x-4">
            <button 
              className="lg:hidden p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200 hidden sm:block">
              {navItems.find(item => item.path === location.pathname)?.name || 'Grocery Shop POS'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
            </button>

            {/* Quick Station Status */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">Terminal Active</span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-6 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
