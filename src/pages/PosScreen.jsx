import React, { useState, useEffect, useRef } from 'react';
import * as productService from '../services/productService';
import * as customerService from '../services/customerService';
import * as saleService from '../services/saleService';
import { 
  Search, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  PlusCircle, 
  Printer, 
  X,
  CreditCard,
  Coins,
  Smartphone,
  CheckCircle,
  Keyboard
} from 'lucide-react';

const PosScreen = () => {
  // State variables
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [barcodeInput, setBarcodeInput] = useState('');
  
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // Walk-in is null
  const [discount, setDiscount] = useState(0); // flat discount
  const [taxRate] = useState(8); // 8% default tax rate

  // Loading & Error indicators
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scanStatus, setScanStatus] = useState('');

  // Modals state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [completedSale, setCompletedSale] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  // New Customer Register State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  // DOM Refs
  const searchInputRef = useRef(null);
  const barcodeInputRef = useRef(null);
  const amountTenderedRef = useRef(null);

  // Load catalogs on startup
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, custRes] = await Promise.all([
        productService.getAllProducts(),
        productService.getAllCategories(),
        customerService.getAllCustomers()
      ]);

      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      setCustomers(custRes.data || []);
      
      // Auto select Walk-in customer from seed data if available
      const walkIn = (custRes.data || []).find(c => c.Name.toLowerCase().includes('walk-in'));
      if (walkIn) setSelectedCustomer(walkIn);

      // Focus barcode scanner on launch
      if (barcodeInputRef.current) barcodeInputRef.current.focus();

    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to initialize POS screen catalog. Please reload.');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F1: Focus Barcode Input
      if (e.key === 'F1') {
        e.preventDefault();
        if (barcodeInputRef.current) barcodeInputRef.current.focus();
      }
      // F2: Open Customer Selection Modal
      if (e.key === 'F2') {
        e.preventDefault();
        setShowCustomerModal(true);
      }
      // F8: Trigger Payment Modal (only if cart has items)
      if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          setShowPaymentModal(true);
          setTimeout(() => {
            if (amountTenderedRef.current) amountTenderedRef.current.focus();
          }, 100);
        }
      }
      // F9: Clear Cart
      if (e.key === 'F9') {
        e.preventDefault();
        setCart([]);
        setDiscount(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Barcode Sweep Handler
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setScanStatus('Scanning...');
    setErrorMsg('');

    try {
      const response = await productService.getProductByBarcode(barcodeInput.trim());
      const product = response.data;

      if (product) {
        addToCart(product);
        setBarcodeInput('');
        setScanStatus('Added item!');
        setTimeout(() => setScanStatus(''), 1000);
      }
    } catch (err) {
      setErrorMsg(`Barcode "${barcodeInput}" not found in catalog.`);
      setScanStatus('');
      setBarcodeInput('');
    }
  };

  // Add Item to Bill
  const addToCart = (product) => {
    setErrorMsg('');
    
    // Check if product is already in cart
    const existingIndex = cart.findIndex(item => item.ID === product.ID);
    
    // Find current stock limits
    const currentProduct = products.find(p => p.ID === product.ID);
    const maxStock = currentProduct ? currentProduct.StockQuantity : product.StockQuantity;

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= maxStock) {
        setErrorMsg(`Cannot add more [${product.Name}]. Inventory stock limit reached (${maxStock} items available).`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      if (maxStock <= 0) {
        setErrorMsg(`Cannot add [${product.Name}]. Product is out of stock.`);
        return;
      }
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // Increase/Decrease Cart Quantities
  const updateQuantity = (productId, delta) => {
    setErrorMsg('');
    const existingIndex = cart.findIndex(item => item.ID === productId);
    if (existingIndex === -1) return;

    const currentItem = cart[existingIndex];
    const currentProduct = products.find(p => p.ID === productId);
    const maxStock = currentProduct ? currentProduct.StockQuantity : currentItem.StockQuantity;

    const newQty = currentItem.quantity + delta;

    if (newQty <= 0) {
      removeFromCart(productId);
    } else if (newQty > maxStock) {
      setErrorMsg(`Cannot add more [${currentItem.Name}]. Stock threshold reached.`);
    } else {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity = newQty;
      setCart(updatedCart);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.ID !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.Price * item.quantity), 0);
  const tax = subtotal * (taxRate / 100);
  const grandTotal = Math.max(0, subtotal + tax - discount);

  // Register Customer Handler
  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    try {
      const res = await customerService.createCustomer({
        name: newCustName,
        phone: newCustPhone,
        email: newCustEmail
      });
      const newCust = res.data;
      setCustomers([...customers, newCust]);
      setSelectedCustomer(newCust);
      // reset forms
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
      setShowCustomerModal(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to create customer.');
    }
  };

  // Process POS Checkout Sale
  const handleCheckoutSubmit = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const salePayload = {
        paymentMethod,
        customerId: selectedCustomer ? selectedCustomer.ID : null,
        discountAmount: parseFloat(discount) || 0,
        taxAmount: parseFloat(tax) || 0,
        items: cart.map(item => ({
          productId: item.ID,
          quantity: item.quantity
        }))
      };

      const res = await saleService.createSale(salePayload);
      
      // Update local product stocks to prevent reload
      const updatedProducts = products.map(prod => {
        const cartItem = cart.find(c => c.ID === prod.ID);
        if (cartItem) {
          return { ...prod, StockQuantity: prod.StockQuantity - cartItem.quantity };
        }
        return prod;
      });
      setProducts(updatedProducts);

      setCompletedSale(res.sale);
      
      // Load detailed print receipt layout
      const receiptRes = await saleService.getReceipt(res.sale.id);
      setReceiptData(receiptRes.receipt);

    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Checkout transaction failed.');
      setShowPaymentModal(false);
    } finally {
      setLoading(false);
    }
  };

  // Print Receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Clear Checkout and Start New Carts
  const resetPOS = () => {
    setCart([]);
    setDiscount(0);
    setCompletedSale(null);
    setReceiptData(null);
    setAmountTendered('');
    setShowPaymentModal(false);
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  };

  // Filter products by Category + Search bar
  const filteredProducts = products.filter(prod => {
    const matchesCategory = selectedCategory === 'All' || 
      (prod.CategoryName && prod.CategoryName.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch = prod.Name.toLowerCase().includes(search.toLowerCase()) || 
      prod.Barcode.includes(search);
    return matchesCategory && matchesSearch;
  });

  // Calculate Change
  const changeDue = amountTendered ? Math.max(0, parseFloat(amountTendered) - grandTotal) : 0;

  return (
    <div className="h-full flex flex-col space-y-4">
      
      {/* Shortcut bar & Notification warnings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-premium shrink-0 gap-2">
        <div className="flex items-center space-x-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <Keyboard size={16} />
          <span className="font-semibold text-slate-600 dark:text-slate-400">Shortcuts:</span>
          <span>[F1] Focus Scan</span>
          <span>•</span>
          <span>[F2] Customer</span>
          <span>•</span>
          <span>[F8] Pay</span>
          <span>•</span>
          <span>[F9] Reset Cart</span>
        </div>

        {scanStatus && (
          <div className="text-xs font-bold text-emerald-500 animate-pulse bg-emerald-500/10 px-2.5 py-1 rounded-full">
            {scanStatus}
          </div>
        )}

        {errorMsg && (
          <div className="text-xs font-semibold text-red-500 bg-red-500/10 px-3 py-1 rounded-full truncate max-w-sm">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Main Terminal Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden">
        
        {/* Left Column: POS Bill Cart (Takes 2/5) */}
        <div className="w-full lg:w-5/12 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-premium flex flex-col overflow-hidden">
          
          {/* Customer attachment bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User size={18} className="text-slate-400" />
              <div className="text-left">
                <p className="text-xs text-slate-400">Customer Account</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {selectedCustomer ? selectedCustomer.Name : 'Walk-in Customer'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowCustomerModal(true)}
              className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 border border-emerald-500/20 hover:border-emerald-500 bg-emerald-500/5 px-3 py-1.5 rounded-xl transition"
            >
              Select / Add [F2]
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div 
                  key={item.ID}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-900/60 transition group hover:shadow-sm"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                      {item.Name}
                    </p>
                    <p className="text-xs text-slate-400">
                      ${item.Price.toFixed(2)} • Barcode: {item.Barcode}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Quantity controls */}
                    <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-950 p-1 border border-slate-200/60 dark:border-slate-800 rounded-xl">
                      <button 
                        onClick={() => updateQuantity(item.ID, -1)}
                        className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-extrabold text-slate-800 dark:text-slate-100">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.ID, 1)}
                        className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Total Price & Delete button */}
                    <div className="text-right w-16">
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 block">
                        ${(item.Price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.ID)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400/80 dark:text-slate-600">
                <Barcode size={64} className="mb-3 text-slate-200 dark:text-slate-800" />
                <p className="text-sm font-medium">Cart is empty</p>
                <p className="text-xs mt-1 text-slate-400">Scan barcodes or select items to populate bill</p>
              </div>
            )}
          </div>

          {/* Checkout Totals Calculation Block */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-900 space-y-3 shrink-0">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">${subtotal.toFixed(2)}</span>
            </div>

            {/* Custom Discount Input */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Discount Amount ($)</span>
              <input
                type="number"
                min="0"
                max={subtotal}
                className="w-20 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right py-1 px-2 text-sm font-bold outline-none"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>

            <div className="flex justify-between text-sm text-slate-500">
              <span>GST / Sales Tax ({taxRate}%)</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">${tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold border-t border-slate-200 dark:border-slate-800 pt-3 text-slate-800 dark:text-slate-100">
              <span>Grand Total</span>
              <span className="text-2xl font-extrabold text-emerald-500">${grandTotal.toFixed(2)}</span>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold py-4 px-4 rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={cart.length === 0}
            >
              <span>PAY & CHECKOUT [F8]</span>
              <span className="text-xl">${grandTotal.toFixed(2)}</span>
            </button>
          </div>

        </div>

        {/* Right Column: Search + Category Selector + Product Grid (Takes 3/5) */}
        <div className="flex-1 flex flex-col min-w-0 gap-4 overflow-hidden">
          
          {/* Top Bar: Barcode Sweep + Product Search Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
            {/* Barcode Scanner integration text field */}
            <form onSubmit={handleBarcodeSubmit} className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <Barcode size={18} />
              </span>
              <input
                ref={barcodeInputRef}
                type="text"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition"
                placeholder="Scanner input focus... [F1]"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
            </form>

            {/* Keyword Search field */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <Search size={18} />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition"
                placeholder="Search products by barcode or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Category Tabs Scroll bar */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200
                ${selectedCategory === 'All' 
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md' 
                  : 'bg-white text-slate-500 dark:bg-slate-950 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900'}
              `}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.ID}
                onClick={() => setSelectedCategory(cat.Name)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200
                  ${selectedCategory === cat.Name 
                    ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md' 
                    : 'bg-white text-slate-500 dark:bg-slate-950 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900'}
                `}
              >
                {cat.Name}
              </button>
            ))}
          </div>

          {/* Grid Catalog Display */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((prod) => {
                  const outOfStock = prod.StockQuantity <= 0;
                  const isLowStock = prod.StockQuantity <= prod.ReorderLevel && !outOfStock;
                  return (
                    <div
                      key={prod.ID}
                      onClick={() => !outOfStock && addToCart(prod)}
                      className={`
                        bg-white dark:bg-slate-950 p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-44 shadow-premium relative overflow-hidden select-none
                        ${outOfStock 
                          ? 'opacity-65 cursor-not-allowed border-slate-200 dark:border-slate-900' 
                          : 'cursor-pointer hover:shadow-premium-hover hover:scale-[1.01] hover:border-emerald-500/20 active:scale-95 border-slate-200/60 dark:border-slate-800/80'}
                      `}
                    >
                      {/* Product Header details */}
                      <div>
                        <div className="flex items-start justify-between gap-1.5 mb-1.5">
                          <span className="text-xs text-slate-400 tracking-wider truncate block font-medium">
                            {prod.CategoryName || 'General'}
                          </span>
                          {/* Stock Badges */}
                          {outOfStock ? (
                            <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full shrink-0">
                              SOLD OUT
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
                              {prod.StockQuantity} LEFT
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full shrink-0">
                              {prod.StockQuantity} PCS
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-2 pr-1">
                          {prod.Name}
                        </h4>
                      </div>

                      {/* Pricing Footer details */}
                      <div className="flex items-end justify-between border-t border-slate-100 dark:border-slate-900 pt-3 mt-3">
                        <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                          ${prod.Price.toFixed(2)}
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition">
                          <Plus size={16} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 shadow-premium rounded-3xl flex flex-col items-center justify-center text-slate-400 py-12">
                <Search size={48} className="mb-2 text-slate-200 dark:text-slate-800" />
                <p className="text-sm font-semibold">No products found</p>
                <p className="text-xs text-slate-400 mt-1">Try modifying the search keyword or filter categories.</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* MODAL 1: Payment Checkout Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button 
              onClick={() => !completedSale && setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600"
              disabled={loading}
            >
              <X size={20} />
            </button>

            {!completedSale ? (
              // Active Payment calculation form
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                  Checkout Invoice Bill
                </h3>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <button
                    onClick={() => { setPaymentMethod('cash'); setAmountTendered(''); }}
                    className={`flex flex-col items-center justify-center p-4 border rounded-2xl gap-2 transition
                      ${paymentMethod === 'cash' 
                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 font-bold' 
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'}`}
                  >
                    <Coins size={24} />
                    <span className="text-xs">Cash Pay</span>
                  </button>

                  <button
                    onClick={() => { setPaymentMethod('card'); setAmountTendered(grandTotal.toFixed(2)); }}
                    className={`flex flex-col items-center justify-center p-4 border rounded-2xl gap-2 transition
                      ${paymentMethod === 'card' 
                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 font-bold' 
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'}`}
                  >
                    <CreditCard size={24} />
                    <span className="text-xs">Credit Card</span>
                  </button>

                  <button
                    onClick={() => { setPaymentMethod('mobile'); setAmountTendered(grandTotal.toFixed(2)); }}
                    className={`flex flex-col items-center justify-center p-4 border rounded-2xl gap-2 transition
                      ${paymentMethod === 'mobile' 
                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 font-bold' 
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'}`}
                  >
                    <Smartphone size={24} />
                    <span className="text-xs">Mobile Wallet</span>
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Bill Due Summary */}
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-900">
                    <span className="text-sm font-semibold text-slate-400">GRAND TOTAL DUE:</span>
                    <span className="text-2xl font-extrabold text-emerald-500">${grandTotal.toFixed(2)}</span>
                  </div>

                  {/* Cash Tendered Input */}
                  {paymentMethod === 'cash' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                        Cash Tendered Amount ($)
                      </label>
                      <input
                        ref={amountTenderedRef}
                        type="number"
                        step="0.01"
                        min={grandTotal}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl px-4 py-3.5 text-lg font-extrabold outline-none text-right"
                        placeholder="0.00"
                        value={amountTendered}
                        onChange={(e) => setAmountTendered(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Cash Change Due display */}
                  {paymentMethod === 'cash' && amountTendered && parseFloat(amountTendered) >= grandTotal && (
                    <div className="flex justify-between items-center bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                      <span className="text-sm font-semibold text-slate-500">Change Due back:</span>
                      <span className="text-xl font-extrabold text-emerald-600">${changeDue.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCheckoutSubmit}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  disabled={loading || (paymentMethod === 'cash' && (!amountTendered || parseFloat(amountTendered) < grandTotal))}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Record Sale & Print Receipt</span>
                  )}
                </button>
              </div>
            ) : (
              // Sale checkout success display panel
              <div className="text-center py-6">
                <CheckCircle size={56} className="text-emerald-500 mx-auto mb-4 animate-bounce" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Transaction Successful!
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Invoice INV-{String(completedSale.id).padStart(6, '0')} has been saved.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handlePrintReceipt}
                    className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3.5 rounded-2xl transition"
                  >
                    <Printer size={18} />
                    <span>Print Thermal</span>
                  </button>
                  <button
                    onClick={resetPOS}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3.5 rounded-2xl transition"
                  >
                    Next Sale
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Customer Account Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setShowCustomerModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 shrink-0">
              Customer Accounts Directory
            </h3>

            {/* Selection Grid list */}
            <div className="flex-1 overflow-y-auto mb-6 pr-1 space-y-2">
              {customers.map((cust) => (
                <div
                  key={cust.ID}
                  onClick={() => { setSelectedCustomer(cust); setShowCustomerModal(false); }}
                  className={`p-3 border rounded-2xl flex items-center justify-between cursor-pointer transition
                    ${selectedCustomer?.ID === cust.ID 
                      ? 'border-emerald-500 bg-emerald-500/5' 
                      : 'border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                >
                  <div className="text-left">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{cust.Name}</p>
                    <p className="text-xs text-slate-400">{cust.Phone || 'No Phone'} • {cust.Email || 'No Email'}</p>
                  </div>
                  {selectedCustomer?.ID === cust.ID && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Customer Registration Form */}
            <form onSubmit={handleRegisterCustomer} className="border-t border-slate-150 dark:border-slate-900 pt-4 mt-2 space-y-3 shrink-0">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Register New Customer</p>
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Full Name (Required)"
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 rounded-xl text-xs flex items-center justify-center space-x-1 transition"
                >
                  <PlusCircle size={14} />
                  <span>Register</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Thermal Invoice Print Node (Hidden in screen via CSS, active on window.print()) */}
      {receiptData && (
        <div id="receipt-print-zone">
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold' }}>
              {receiptData.storeInfo.name}
            </h2>
            <p style={{ margin: '0 0 3px 0' }}>{receiptData.storeInfo.address}</p>
            <p style={{ margin: '0 0 3px 0' }}>Tel: {receiptData.storeInfo.phone}</p>
            <p style={{ margin: '0' }}>Tax ID: {receiptData.storeInfo.taxId}</p>
          </div>

          <div style={{ borderBottom: '1px dashed #000', paddingBottom: '5px', marginBottom: '5px' }}>
            <p style={{ margin: '0 0 3px 0' }}>Invoice: {receiptData.transaction.invoiceNumber}</p>
            <p style={{ margin: '0 0 3px 0' }}>Date: {new Date(receiptData.transaction.date).toLocaleString()}</p>
            <p style={{ margin: '0 0 3px 0' }}>Cashier: {receiptData.transaction.cashier}</p>
            <p style={{ margin: '0' }}>Customer: {receiptData.transaction.customerName}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px dashed #000' }}>
                <th style={{ textAlign: 'left', paddingBottom: '3px' }}>Item</th>
                <th style={{ textAlign: 'center', paddingBottom: '3px' }}>Qty</th>
                <th style={{ textAlign: 'right', paddingBottom: '3px' }}>Price</th>
                <th style={{ textAlign: 'right', paddingBottom: '3px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {receiptData.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ paddingTop: '3px' }}>{item.name}</td>
                  <td style={{ textAlign: 'center', paddingTop: '3px' }}>{item.qty}</td>
                  <td style={{ textAlign: 'right', paddingTop: '3px' }}>${item.price.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', paddingTop: '3px' }}>${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', marginTop: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Subtotal:</span>
              <span>${receiptData.totals.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Discount:</span>
              <span>-${receiptData.totals.discount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Tax ({taxRate}%):</span>
              <span>+${receiptData.totals.tax.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px' }}>
              <span>GRAND TOTAL:</span>
              <span>${receiptData.totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', marginTop: '5px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 3px 0', fontWeight: 'bold' }}>PAYMENT METHOD: {receiptData.transaction.paymentMethod}</p>
            {paymentMethod === 'cash' && amountTendered && (
              <>
                <p style={{ margin: '0 0 3px 0' }}>Tendered: ${parseFloat(amountTendered).toFixed(2)}</p>
                <p style={{ margin: '0 0 3px 0' }}>Change: ${(parseFloat(amountTendered) - receiptData.totals.grandTotal).toFixed(2)}</p>
              </>
            )}
            <p style={{ margin: '10px 0 0 0', fontStyle: 'italic' }}>
              {receiptData.footerMessage}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default PosScreen;
