import React, { useState, useEffect } from 'react';
import * as productService from '../services/productService';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  FolderPlus,
  X,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Product Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Product Form state
  const [prodForm, setProdForm] = useState({
    name: '',
    barcode: '',
    categoryId: '',
    description: '',
    price: '',
    costPrice: '',
    stockQuantity: '',
    reorderLevel: ''
  });

  // Category Modal / Card Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [prodRes, catRes] = await Promise.all([
        productService.getAllProducts(),
        productService.getAllCategories()
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to fetch inventory catalog.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedProductId(null);
    setProdForm({
      name: '',
      barcode: '',
      categoryId: categories[0]?.ID || '',
      description: '',
      price: '',
      costPrice: '',
      stockQuantity: '0',
      reorderLevel: '10'
    });
    setShowProductModal(true);
  };

  const handleOpenEdit = (prod) => {
    setModalMode('edit');
    setSelectedProductId(prod.ID);
    setProdForm({
      name: prod.Name,
      barcode: prod.Barcode,
      categoryId: prod.CategoryId || '',
      description: prod.Description || '',
      price: prod.Price,
      costPrice: prod.CostPrice,
      stockQuantity: prod.StockQuantity,
      reorderLevel: prod.ReorderLevel
    });
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      name: prodForm.name,
      barcode: prodForm.barcode,
      categoryId: prodForm.categoryId ? parseInt(prodForm.categoryId, 10) : null,
      description: prodForm.description,
      price: parseFloat(prodForm.price),
      costPrice: parseFloat(prodForm.costPrice),
      stockQuantity: parseInt(prodForm.stockQuantity, 10) || 0,
      reorderLevel: parseInt(prodForm.reorderLevel, 10) || 0
    };

    try {
      if (modalMode === 'add') {
        await productService.createProduct(payload);
        setSuccessMsg('Product added successfully to catalog.');
      } else {
        await productService.updateProduct(selectedProductId, payload);
        setSuccessMsg('Product details modified successfully.');
      }
      setShowProductModal(false);
      fetchInventory();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit product details.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product from the inventory catalog?')) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await productService.deleteProduct(id);
      setSuccessMsg('Product deleted successfully.');
      fetchInventory();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete product.');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await productService.createCategory({
        name: newCatName,
        description: newCatDesc
      });
      setSuccessMsg(`Category "${newCatName}" added.`);
      setNewCatName('');
      setNewCatDesc('');
      setShowCategoryForm(false);
      fetchInventory();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to add category.');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Products in this category will be reset to General.')) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await productService.deleteCategory(id);
      setSuccessMsg('Category deleted successfully.');
      fetchInventory();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete category.');
    }
  };

  const filteredProducts = products.filter(prod => 
    prod.Name.toLowerCase().includes(search.toLowerCase()) ||
    prod.Barcode.includes(search)
  );

  return (
    <div className="space-y-6">
      
      {/* Messages Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-2xl text-sm font-semibold">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-2xl text-sm font-semibold flex items-center space-x-2">
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left 3 Columns: Products list */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-premium">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none transition"
                placeholder="Filter inventory by code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={handleOpenAdd}
              className="bg-emerald-505 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/10"
            >
              <Plus size={16} />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-premium overflow-hidden">
            {loading ? (
              <div className="py-20 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-900">
                      <th className="px-6 py-4">Product Info</th>
                      <th className="px-6 py-4">Barcode</th>
                      <th className="px-6 py-4 text-right">Sale Price</th>
                      <th className="px-6 py-4 text-right">Cost Price</th>
                      <th className="px-6 py-4 text-center">Stock</th>
                      <th className="px-6 py-4 text-center">Actions</th>
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
                              <p className="text-xs text-slate-400 font-medium mt-0.5">{prod.CategoryName || 'General'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">{prod.Barcode}</td>
                          <td className="px-6 py-4 text-right font-extrabold text-slate-800 dark:text-slate-100">
                            ${parseFloat(prod.Price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-500">
                            ${parseFloat(prod.CostPrice).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold
                              ${outOfStock ? 'bg-red-50 text-red-700 dark:bg-red-950/20' : ''}
                              ${isLowStock ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20' : ''}
                              ${!outOfStock && !isLowStock ? 'bg-green-50 text-green-700 dark:bg-green-950/20' : ''}
                            `}>
                              {prod.StockQuantity}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button 
                                onClick={() => handleOpenEdit(prod)}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition"
                                title="Edit Product"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(prod.ID)}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                                title="Delete Product"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400">
                No products match search criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Categories Panel */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-premium h-fit space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Categories Manager
            </h3>
            <button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 flex items-center space-x-1"
            >
              <Plus size={14} />
              <span>New</span>
            </button>
          </div>

          {/* Quick Create Category form */}
          {showCategoryForm && (
            <form onSubmit={handleAddCategory} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900 p-3 rounded-2xl space-y-3">
              <input
                type="text"
                placeholder="Category Name"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs outline-none"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Short Description"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs outline-none"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
              >
                <FolderPlus size={14} />
                <span>Save Category</span>
              </button>
            </form>
          )}

          {/* Category List */}
          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <div 
                  key={cat.ID}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-900/60"
                >
                  <div className="text-left min-w-0 pr-2">
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{cat.Name}</p>
                    {cat.Description && (
                      <p className="text-[10px] text-slate-400 truncate">{cat.Description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.ID)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                    title="Delete Category"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-slate-400 text-xs">
                <FolderOpen size={32} className="mb-2 text-slate-200" />
                <span>No categories loaded.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* PRODUCT FORM MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setShowProductModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 shrink-0">
              {modalMode === 'add' ? 'Add Product to Inventory' : 'Modify Product Inventory Details'}
            </h3>

            <form onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition"
                    placeholder="e.g. Fresh Red Apple 1kg"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    required
                  />
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Product Barcode / UPC *
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition"
                    placeholder="e.g. 4011200293"
                    value={prodForm.barcode}
                    onChange={(e) => setProdForm({ ...prodForm, barcode: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Product Category
                  </label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition"
                    value={prodForm.categoryId}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                  >
                    <option value="">General</option>
                    {categories.map((cat) => (
                      <option key={cat.ID} value={cat.ID}>{cat.Name}</option>
                    ))}
                  </select>
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Short Description
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition"
                    placeholder="e.g. Organic red apples"
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Sale Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Sale Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition text-right"
                    placeholder="0.00"
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    required
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Cost Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition text-right"
                    placeholder="0.00"
                    value={prodForm.costPrice}
                    onChange={(e) => setProdForm({ ...prodForm, costPrice: e.target.value })}
                    required
                  />
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition text-right"
                    placeholder="0"
                    value={prodForm.stockQuantity}
                    onChange={(e) => setProdForm({ ...prodForm, stockQuantity: e.target.value })}
                    required
                  />
                </div>

                {/* Reorder warning Level */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Reorder warning *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition text-right"
                    placeholder="10"
                    value={prodForm.reorderLevel}
                    onChange={(e) => setProdForm({ ...prodForm, reorderLevel: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-2xl shadow-lg mt-4 transition"
              >
                {modalMode === 'add' ? 'Save Product to Inventory' : 'Update Inventory Records'}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
