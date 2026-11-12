import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBasket, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both username/email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Brand Icon & Heading */}
      <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 mb-6">
        <ShoppingBasket size={32} />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 text-center mb-1">
        FreshMart POS
      </h2>
      <p className="text-sm text-slate-400 dark:text-slate-500 text-center mb-8">
        Enter cashier terminal credentials to sign in
      </p>

      {/* Error Alert Box */}
      {errorMsg && (
        <div className="w-full flex items-center space-x-2.5 p-4 mb-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Credentials Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-5">
        {/* Username / Email field */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Username or Email
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Mail size={18} />
            </span>
            <input
              type="text"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all duration-200"
              placeholder="e.g. admin or admin@grocerypos.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        {/* Password field */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Lock size={18} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl pl-11 pr-11 py-3.5 text-sm outline-none transition-all duration-200"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span>Access Cashier Terminal</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;
