import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PosScreen from './pages/PosScreen';
import Products from './pages/Products';
import Inventory from './pages/Inventory';

// Placeholder views for ancillary nav routes
const PlaceholderPage = ({ title, description }) => (
  <div className="p-8 max-w-4xl mx-auto">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h2>
      <p className="text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Route */}
            <Route
              path="/login"
              element={
                <AuthLayout>
                  <Login />
                </AuthLayout>
              }
            />

            {/* Protected POS & Admin Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pos"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PosScreen />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Products />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <AdminRoute>
                  <MainLayout>
                    <Inventory />
                  </MainLayout>
                </AdminRoute>
              }
            />

            <Route
              path="/sales-history"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PlaceholderPage
                      title="Sales History"
                      description="View past receipts, filter by cashier and date range, and re-print receipts."
                    />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PlaceholderPage
                      title="Customer Directory"
                      description="Manage customer accounts, credit balances, and purchase history."
                    />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <AdminRoute>
                  <MainLayout>
                    <PlaceholderPage
                      title="Analytics & Financial Reports"
                      description="Export daily, weekly, and monthly sales summaries and profit breakdowns."
                    />
                  </MainLayout>
                </AdminRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PlaceholderPage
                      title="Store & Terminal Settings"
                      description="Configure receipt printer, tax rates, currency symbol, and checkout terminal."
                    />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect to Dashboard or Login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
