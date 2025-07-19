'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Scan, CheckCircle, Plus, Minus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import QRScanner from './QRScanner';
import axios from 'axios';
import { getAuthToken } from '@/utils/auth';
import { Html5Qrcode } from 'html5-qrcode';

interface Product {
  _id: string;
  category: string;
  subcategory: string;
  sku: string;
  size?: string;
  sellingPrice: number;
  color: string;
  quantity: number;
}

interface SellModalProps {
  onClose: () => void;
  inventory: Product[];
  onSell: (sku: string, quantity: number, soldPrice: number) => Promise<void>;
}

type EditableProduct = Omit<Product, 'quantity'> & {
  quantity: string | number;
  discountType: 'amount' | 'percent';
  discountValue: string | number;
};

const SellModal = ({ onClose }: SellModalProps) => {
  const [step, setStep] = useState<'start' | 'scan' | 'summary'>('start');
  const [scannedSKUs, setScannedSKUs] = useState<string[]>([]);
  const [products, setProducts] = useState<EditableProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [overallDiscountType, setOverallDiscountType] = useState<'amount' | 'percent'>('amount');
  const [overallDiscountValue, setOverallDiscountValue] = useState<string | number>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [saleSuccess, setSaleSuccess] = useState(false);

  // Fetch product details for all scanned SKUs
  useEffect(() => {
    const fetchProducts = async () => {
      if (step !== 'summary' || scannedSKUs.length === 0) return;
      setLoading(true);
      setError('');
      try {
        const token = getAuthToken();
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/skus`,
          { skus: scannedSKUs },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          // Add quantity and discount fields to each product
          setProducts(res.data.products.map((p: Product) => ({
            ...p,
            quantity: '1',
            discountType: 'amount',
            discountValue: '',
          })));
        } else {
          setError(res.data.message || 'Failed to fetch products');
        }
      } catch {
        setError('Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [step, scannedSKUs]);

  useEffect(() => {
    if (step === 'scan') {
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      scannerRef.current = new Html5Qrcode('scanner-container');
      scannerRef.current
        .start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            setScannedSKUs((prev) => prev.includes(decodedText) ? prev : [...prev, decodedText]);
          },
          (errorMessage) => {
            console.error('Scan error:', errorMessage);
          }
        )
        .catch((err) => {
          console.error('Camera error:', err);
        });
    }
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [step]);

  // Remove product from list
  const handleRemoveSKU = (sku: string) => {
    setScannedSKUs((prev) => prev.filter((s) => s !== sku));
    setProducts((prev) => prev.filter((p) => p.sku !== sku));
  };

  // Update quantity for a product
  const handleQuantityChange = (sku: string, delta: number) => {
    setProducts((prev) => prev.map((p) =>
      p.sku === sku ? { ...p, quantity: Math.max(1, Number(p.quantity) + delta) } : p
    ));
  };

  // Update per-product discount
  const handleProductDiscountChange = (sku: string, type: 'amount' | 'percent', value: number) => {
    setProducts((prev) => prev.map((p) =>
      p.sku === sku ? { ...p, discountType: type, discountValue: value } : p
    ));
  };

  // Calculate per-product total after discount
  const getProductTotal = (p: EditableProduct) => {
    let price = p.sellingPrice;
    const discount = Number(p.discountValue) || 0;
    const qty = Number(p.quantity) || 1;
    if (p.discountType === 'amount') {
      price = Math.max(0, price - discount);
    } else if (p.discountType === 'percent') {
      price = Math.max(0, price - (price * discount) / 100);
    }
    return price * qty;
  };

  // Calculate subtotal (before overall discount)
  const subtotal = products.reduce((sum, p) => sum + getProductTotal(p), 0);

  // Calculate total after overall discount
  let total = subtotal;
  if (overallDiscountType === 'amount') {
    total = Math.max(0, subtotal - Number(overallDiscountValue));
  } else if (overallDiscountType === 'percent') {
    total = Math.max(0, subtotal - (subtotal * Number(overallDiscountValue)) / 100);
  }

  const handleFinalizeSale = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      for (const p of products) {
        let price = p.sellingPrice;
        const discount = Number(p.discountValue) || 0;
        const qty = Number(p.quantity) || 1;
        if (p.discountType === 'amount') {
          price = Math.max(0, price - discount);
        } else if (p.discountType === 'percent') {
          price = Math.max(0, price - (price * discount) / 100);
        }
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/create`,
          {
            productId: p._id,
            quantity: qty,
            soldPrice: price,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      // Post bulk sale record
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/bulksales/create`,
        {
          products: products.map(p => ({
            productId: p._id,
            sku: p.sku,
            quantity: Number(p.quantity),
            soldPrice: getProductTotal(p) / (Number(p.quantity) || 1),
            discountType: p.discountType,
            discountValue: Number(p.discountValue),
          })),
          subtotal,
          orderDiscountType: overallDiscountType,
          orderDiscountValue: Number(overallDiscountValue),
          total,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaleSuccess(true);
      setTimeout(() => {
        setSaleSuccess(false);
        onClose();
      }, 2000);
    } catch {
      setError('Failed to complete sale');
    } finally {
      setLoading(false);
    }
  };

  // 1. Update products state to allow quantity and discountValue as string | number
  // 2. Update input handlers to allow empty string
  // 3. On blur or submit, validate and convert to number

  // Update product type in local state (not interface):
  // products: (Product & { quantity: string | number; discountType: 'amount' | 'percent'; discountValue: string | number })[]

  // Update quantity input handler
  const handleQuantityInput = (sku: string, value: string) => {
    setProducts(prev => prev.map(p =>
      p.sku === sku ? { ...p, quantity: value } : p
    ));
  };
  const handleQuantityBlur = (sku: string, value: string) => {
    if (value === '') return; // allow empty
    let num = Number(value);
    if (isNaN(num) || num < 1) num = 1;
    setProducts(prev => prev.map(p =>
      p.sku === sku ? { ...p, quantity: num } : p
    ));
  };

  // Update discount input handler
  const handleProductDiscountInput = (sku: string, type: 'amount' | 'percent', value: string) => {
    setProducts(prev => prev.map(p =>
      p.sku === sku ? { ...p, discountType: type, discountValue: value } : p
    ));
  };
  const handleProductDiscountBlur = (sku: string, type: 'amount' | 'percent', value: string) => {
    if (value === '') return; // allow empty
    let num = Number(value);
    if (isNaN(num) || num < 0) num = 0;
    setProducts(prev => prev.map(p =>
      p.sku === sku ? { ...p, discountType: type, discountValue: num } : p
    ));
  };

  // Order discount input
  const handleOrderDiscountInput = (value: string) => {
    setOverallDiscountValue(value);
  };
  const handleOrderDiscountBlur = (value: string) => {
    if (value === '') return; // allow empty
    let num = Number(value);
    if (isNaN(num) || num < 0) num = 0;
    setOverallDiscountValue(num);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[100] p-2 sm:p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-gradient-to-br from-gray-50 to-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[98vw] sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-gray-200/80 flex flex-col backdrop-blur-sm"
        >
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4 sm:p-6 flex items-center justify-between rounded-t-2xl sm:rounded-t-3xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              <h2 className="text-lg sm:text-xl font-bold">Sell Products</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-1 bg-white/10 hover:bg-white/20 rounded-full transition-all"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="px-3 py-4 sm:p-6 flex-1 overflow-y-auto">
            {/* Start Screen */}
            {step === 'start' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[200px] sm:min-h-[300px] gap-4 sm:gap-6"
              >
                <div className="bg-indigo-100 p-6 rounded-full">
                  <Scan className="w-16 h-16 text-indigo-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Scan Products</h3>
                <p className="text-gray-500 text-center max-w-xs">
                  Start scanning product QR codes to add them to the sale
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('scan')}
                  className="px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all text-base sm:text-lg shadow-md flex items-center gap-2"
                >
                  <Scan size={20} />
                  Start Scanning
                </motion.button>
              </motion.div>
            )}

            {/* Scan Screen */}
            {step === 'scan' && (
              <div>
                <div className="mb-6 flex justify-between items-center flex-wrap gap-2">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Scan className="text-indigo-600" size={20} />
                    Scanned Products
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStep('summary')}
                    disabled={scannedSKUs.length === 0}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      scannedSKUs.length === 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                  >
                    Proceed to Checkout
                  </motion.button>
                </div>
                
                {/* Scanned Items List */}
                <div className="mb-5 max-h-32 sm:max-h-40 overflow-y-auto bg-gray-50 rounded-xl border border-gray-200 p-2 sm:p-3">
                  {scannedSKUs.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No items scanned yet</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {scannedSKUs.map((sku) => (
                        <motion.div
                          key={sku}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="py-2 px-2 sm:px-3 bg-white rounded-lg border border-gray-200 shadow-sm flex justify-between items-center"
                        >
                          <span className="font-medium text-sm truncate">{sku}</span>
                          <button 
                            onClick={() => handleRemoveSKU(sku)} 
                            className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                          >
                            <X size={16} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scanner Container */}
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border-2 sm:border-4 border-indigo-500/20 shadow-lg">
                  <div 
                    id="scanner-container" 
                    className="min-h-[180px] sm:min-h-[300px] w-full bg-black"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-dashed border-white/50 rounded-xl w-40 h-40 sm:w-64 sm:h-64" />
                  </div>
                </div>
              </div>
            )}

            {/* Summary Screen */}
            {step === 'summary' && (
              <>
                {loading ? (
                  <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600">Loading products...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <p className="text-red-600 font-medium">{error}</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
                    <Scan className="text-gray-400 w-12 h-12" />
                    <p className="text-gray-500 text-center">
                      No products found for scanned SKUs.<br />
                      Try scanning again.
                    </p>
                    <button 
                      onClick={() => setStep('scan')}
                      className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200"
                    >
                      Scan Again
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 flex justify-between items-center flex-wrap gap-2">
                      <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                        <ShoppingBag className="text-indigo-600" size={18} />
                        Order Summary
                      </h3>
                      <button 
                        onClick={() => setStep('scan')}
                        className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 text-sm sm:text-base"
                      >
                        <Plus size={14} />
                        Add Items
                      </button>
                    </div>
                    
                    {/* Product List */}
                    <div className="mb-6 space-y-2 sm:space-y-3 max-h-[200px] sm:max-h-[300px] overflow-y-auto pr-1 sm:pr-2">
                      {products.map((product) => (
                        <motion.div
                          key={product.sku}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 sm:p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
                        >
                          <div className="flex justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-800 truncate text-base sm:text-lg">{product.subcategory}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {product.sku} • {product.category} 
                                {product.size && ` • ${product.size}`}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: product.color }} />
                                {product.color}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-800 text-base sm:text-lg">रू {getProductTotal(product).toFixed(2)}</div>
                              <div className="text-xs text-gray-400">
                                {product.quantity} × रू {product.sellingPrice}
                              </div>
                            </div>
                          </div>
                          
                          {/* Product Controls */}
                          <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center">
                              <button 
                                onClick={() => handleQuantityChange(product.sku, -1)}
                                className="p-1 bg-gray-100 rounded-l-lg hover:bg-gray-200 sm:p-1.5"
                              >
                                <Minus size={14} />
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={product.quantity === 0 ? '' : product.quantity}
                                onChange={e => handleQuantityInput(product.sku, e.target.value)}
                                onBlur={e => handleQuantityBlur(product.sku, e.target.value)}
                                placeholder="Enter Quantity"
                                className="w-14 sm:w-20 text-center border-y border-gray-200 bg-white py-1 px-1 sm:px-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-none shadow-sm transition text-sm"
                              />
                              <button 
                                onClick={() => handleQuantityChange(product.sku, 1)}
                                className="p-1 bg-gray-100 rounded-r-lg hover:bg-gray-200 sm:p-1.5"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            
                            <div className="flex gap-1 sm:gap-2">
                              <select
                                value={product.discountType}
                                onChange={e => handleProductDiscountChange(product.sku, e.target.value as 'amount' | 'percent', Number(product.discountValue))}
                                className="border rounded-lg px-1 sm:px-2 py-1 text-xs bg-white"
                              >
                                <option value="amount">₹ Off</option>
                                <option value="percent">% Off</option>
                              </select>
                              <input
                                type="number"
                                min={0}
                                value={product.discountValue === 0 ? '' : product.discountValue}
                                onChange={e => handleProductDiscountInput(product.sku, product.discountType, e.target.value)}
                                onBlur={e => handleProductDiscountBlur(product.sku, product.discountType, e.target.value)}
                                className="w-14 sm:w-20 text-xs border rounded-lg px-1 sm:px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
                                placeholder={product.discountType === 'amount' ? 'Enter Discount Amount' : 'Enter Discount %'}
                              />
                            </div>
                            
                            <button 
                              onClick={() => handleRemoveSKU(product.sku)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg sm:p-1.5"
                            >
                              <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Discount Section */}
                    <div className="mb-6 p-3 sm:p-4 bg-indigo-50 rounded-xl">
                      <h4 className="font-semibold text-indigo-700 mb-2 sm:mb-3 flex items-center gap-2 text-base sm:text-lg">
                        Apply Order Discount
                      </h4>
                      <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
                        <select
                          value={overallDiscountType}
                          onChange={e => setOverallDiscountType(e.target.value as 'amount' | 'percent')}
                          className="flex-1 border rounded-lg px-2 sm:px-3 py-2 bg-white text-sm"
                        >
                          <option value="amount">Fixed Amount</option>
                          <option value="percent">Percentage</option>
                        </select>
                        <input
                          type="number"
                          min={0}
                          value={overallDiscountValue === 0 ? '' : overallDiscountValue}
                          onChange={e => handleOrderDiscountInput(e.target.value)}
                          onBlur={e => handleOrderDiscountBlur(e.target.value)}
                          className="flex-1 border rounded-lg px-2 sm:px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
                          placeholder={overallDiscountType === 'amount' ? 'Enter Discount Amount' : 'Enter Discount %'}
                        />
                      </div>
                    </div>
                    
                    {/* Totals */}
                    <div className="mb-6 space-y-2 sm:space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-200 text-sm sm:text-base">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">रू {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 text-sm sm:text-base">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-red-500">
                          - रू {(subtotal - total).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="font-bold text-base sm:text-lg">Total:</span>
                        <span className="font-bold text-lg sm:text-xl text-indigo-700">
                          रू {total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Success Message */}
                    {saleSuccess ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-8 bg-green-50 rounded-xl"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="mb-4"
                        >
                          <CheckCircle className="w-16 h-16 text-green-600" strokeWidth={1.5} />
                        </motion.div>
                        <h4 className="text-xl font-bold text-green-700 mb-2">Sale Completed!</h4>
                        <p className="text-gray-600">Transaction processed successfully</p>
                      </motion.div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all shadow-md text-base sm:text-lg"
                        onClick={handleFinalizeSale}
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : 'Finalize Sale'}
                      </motion.button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// MultiScanSellModal: Updated to match new design system
export function MultiScanSellModal({ onClose }: { onClose: () => void }) {
  const [showScanner, setShowScanner] = useState(true);
  const [scannedSKUs, setScannedSKUs] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch product details for all scanned SKUs
  useEffect(() => {
    const fetchProducts = async () => {
      if (scannedSKUs.length === 0) return;
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/skus`,
          { skus: scannedSKUs },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setProducts(res.data.products);
        } else {
          setError(res.data.message || 'Failed to fetch products');
        }
      } catch {
        setError('Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [scannedSKUs]);

  // In MultiScanSellModal, update handleScan to accept string | string[]
  const handleScan = (skuOrSkus: string | string[]) => {
    if (Array.isArray(skuOrSkus)) {
      setScannedSKUs(skuOrSkus);
    } else {
      setScannedSKUs((prev) => prev.includes(skuOrSkus) ? prev : [...prev, skuOrSkus]);
    }
    setShowScanner(false);
  };

  const handleRemoveSKU = (sku: string) => {
    setScannedSKUs((prev) => prev.filter((s) => s !== sku));
    setProducts((prev) => prev.filter((p) => p.sku !== sku));
  };

  const totalAmount = products.reduce((sum, p) => sum + (p.sellingPrice || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[100] p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[98vw] sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-auto border border-gray-200/80 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4 sm:p-6 flex items-center justify-between rounded-t-2xl sm:rounded-t-3xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <Scan className="w-5 h-5 sm:w-6 sm:h-6" />
            <h2 className="text-lg sm:text-xl font-bold">Multi-Scan Sell</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 bg-white/10 hover:bg-white/20 rounded-full"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="px-3 py-4 sm:p-6 flex-1 overflow-y-auto">
          {showScanner ? (
            <QRScanner onClose={() => setShowScanner(false)} onScan={handleScan} multiScan />
          ) : (
            <>
              <div className="mb-6 flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <ShoppingBag className="text-indigo-600" size={18} />
                  Scanned Products
                </h3>
                <button 
                  onClick={() => setShowScanner(true)}
                  className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 text-sm sm:text-base"
                >
                  <Plus size={14} />
                  Scan More
                </button>
              </div>
              {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[120px] sm:min-h-[200px]">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-indigo-600 mb-4"></div>
                  <p className="text-gray-600">Loading products...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 text-center">
                  <p className="text-red-600 font-medium">{error}</p>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[120px] sm:min-h-[200px] gap-3 sm:gap-4">
                  <Scan className="text-gray-400 w-8 h-8 sm:w-12 sm:h-12" />
                  <p className="text-gray-500 text-center text-sm sm:text-base">No products scanned yet</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 space-y-2 sm:space-y-3 max-h-[160px] sm:max-h-[300px] overflow-y-auto pr-1 sm:pr-2">
                    {products.map((product) => (
                      <div 
                        key={product.sku}
                        className="p-3 sm:p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
                      >
                        <div className="flex justify-between">
                          <div>
                            <div className="font-bold text-gray-800 text-base sm:text-lg">{product.sku}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {product.category} • {product.subcategory} 
                              {product.size && ` • ${product.size}`}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: product.color }} />
                              {product.color}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="font-bold text-gray-800 text-base sm:text-lg">रू {product.sellingPrice}</span>
                            <button 
                              onClick={() => handleRemoveSKU(product.sku)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg sm:p-1.5"
                            >
                              <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 sm:p-4 bg-indigo-50 rounded-xl">
                    <div className="flex justify-between items-center font-bold text-base sm:text-lg">
                      <span>Total Products:</span>
                      <span>{products.length}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-base sm:text-lg mt-1 sm:mt-2">
                      <span>Total Amount:</span>
                      <span className="text-indigo-700">रू {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SellModal;