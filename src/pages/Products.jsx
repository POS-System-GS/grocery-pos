import React, { useState, useEffect } from 'react';
import * as productService from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, RefreshCw, PackageOpen } from 'lucide-react';

const Products = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedCat]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [prodRes, catRes] = await Promise.all([
        productService.getAllProducts('', selectedCat),
        productService.getAllCategories()
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch catalog. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const filteredProducts = products.filter(prod => 
    prod.Name.toLowerCase().includes(search.toLowerCase()) ||
    prod.Barcode.includes(search)
  );

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-premium">
        
        {/* Search controls */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none transition"
            placeholder="Search products by barcode or name..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400">
              <Filter size={16} />
            </span>
            <select
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold outline-none appearance-none"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.ID} value={cat.ID}>{cat.Name}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
            title="Refresh Catalog"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-premium overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 text-sm">
            {error}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-900">
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4">Barcode</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Sale Price</th>
                  {isAdmin() && <th className="px-6 py-4 text-right">Cost Price</th>}
                  <th className="px-6 py-4 text-center">Stock Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-sm">
                {filteredProducts.map((prod) => {
                  const outOfStock = prod.StockQuantity <= 0;
                  const isLowStock = prod.StockQuantity <= prod.ReorderLevel && !outOfStock;
                  return (
                    <tr key={prod.ID} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/25 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{prod.Name}</p>
                          {prod.Description && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">{prod.Description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {prod.Barcode}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/10">
                          {prod.CategoryName || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-800 dark:text-slate-100">
                        ${parseFloat(prod.Price).toFixed(2)}
                      </td>
                      {isAdmin() && (
                        <td className="px-6 py-4 text-right font-semibold text-slate-500">
                          ${parseFloat(prod.CostPrice).toFixed(2)}
                        </td>
                      )}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold
                          ${outOfStock ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' : ''}
                          ${isLowStock ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 animate-pulse' : ''}
                          ${!outOfStock && !isLowStock ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' : ''}
                        `}>
                          {outOfStock ? 'Out of Stock' : `${prod.StockQuantity} Units`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <PackageOpen size={48} className="mb-3 text-slate-300" />
            <p className="text-sm font-semibold">No products matches filters</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Products;
