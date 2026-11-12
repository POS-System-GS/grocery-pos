import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6 transition-colors duration-300 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-premium p-8 relative overflow-hidden">
        {/* Background ambient blurs */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-3xl"></div>
        
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
