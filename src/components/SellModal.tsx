// components/SellModal.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Scan, ArrowLeft, CameraOff, AlertCircle, Package, Tag, Palette, Ruler, Layers } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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
  inventory: Product[];
  onClose: () => void;
  onSell: (sku: string, quantity: number, soldPrice: number) => void;
}

const SellModal = ({ inventory, onClose, onSell }: SellModalProps) => {
  const [scannedSKU, setScannedSKU] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState(0);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [saleSuccess, setSaleSuccess] = useState(false);
  // Add state for discount and soldPrice
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [discountValue, setDiscountValue] = useState(0);
  const [soldPrice, setSoldPrice] = useState<number | null>(null);

  // Initialize and clean up scanner
  useEffect(() => {
    if (isScannerActive && scannerContainerRef.current) {
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      scannerRef.current = new Html5Qrcode(scannerContainerRef.current.id);
      scannerRef.current
        .start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            setScannedSKU(decodedText);
            setIsScannerActive(false);
            handleFindProduct(decodedText);
          },
          (errorMessage) => {
            console.log('Scan error:', errorMessage);
          }
        )
        .catch((err) => {
          console.error('Camera error:', err);
          setIsScannerActive(false);
        });
    }
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err) => {
          console.error('Error stopping scanner:', err);
        });
      }
    };

  }, [isScannerActive]);

  const handleFindProduct = (sku: string) => {
    setError('');
    const product = inventory.find((item) => item.sku === sku);
    if (product) {
      setFoundProduct(product);
      setStep(1);
      setQuantity(1);
    } else {
      setFoundProduct(null);
      setError('Product not found!');
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFindProduct(scannedSKU);
  };

  // Calculate sold price whenever discount changes
  useEffect(() => {
    if (foundProduct) {
      const price = foundProduct.sellingPrice;
      let finalPrice = price;
      if (discountType === 'amount') {
        finalPrice = Math.max(0, price - discountValue);
      } else if (discountType === 'percent') {
        finalPrice = Math.max(0, price - (price * discountValue) / 100);
      }
      setSoldPrice(Number(finalPrice.toFixed(2)));
    } else {
      setSoldPrice(null);
    }
  }, [discountType, discountValue, foundProduct]);

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (foundProduct && soldPrice !== null) {
      onSell(foundProduct.sku, quantity, soldPrice);
      setSaleSuccess(true);
      setTimeout(() => {
        setSaleSuccess(false);
        setStep(0);
        setScannedSKU('');
        setFoundProduct(null);
        setQuantity(1);
        setDiscountValue(0);
        setSoldPrice(null);
        handleClose();
      }, 10000); 
    }
  };

  // Reset modal state when closed
  useEffect(() => {
    if (step === 0) {
      setScannedSKU('');
      setFoundProduct(null);
      setError('');
      setQuantity(1);
    }
  }, [step]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            // Changed to responsive width with max-height constraints
            className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl w-full max-w-[95vw] md:max-w-md max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6 flex items-center">
              <div className="flex items-center">
                {step === 1 && (
                  <motion.button 
                    whileHover={{ x: -3 }}
                    onClick={() => setStep(0)} 
                    className="mr-3 text-gray-300 hover:text-white"
                  >
                    <ArrowLeft size={20} />
                  </motion.button>
                )}
                <h2 className="text-xl font-bold">
                  {step === 0 ? 'Scan or Enter SKU' : 'Sell Product'}
                </h2>
              </div>
              <motion.button 
                whileHover={{ rotate: 90 }}
                onClick={handleClose} 
                className="ml-auto text-gray-300 hover:text-white"
              >
                <X size={24} />
              </motion.button>
            </div>
            
            {/* Modal Content - Made scrollable */}
            <div className="p-6 overflow-y-auto flex-grow">
              {saleSuccess ? (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <div className="bg-green-100 rounded-full p-4 mb-4">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="text-xl font-bold text-green-700 mb-2">Sale Completed!</div>
                  <div className="text-gray-600 mb-4">The sale was processed successfully.</div>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                  >
                    Close
                  </button>
                </div>
              ) : step === 0 ? (
                <form onSubmit={handleScanSubmit}>
                  {isScannerActive ? (
                    <div className="mb-6 relative">
                      {/* Made scanner height responsive */}
                      <div
                        id="scanner-container"
                        ref={scannerContainerRef}
                        className="min-h-[200px] max-h-[40vh] w-full bg-black rounded-xl overflow-hidden"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="border-4 border-blue-400 border-dashed rounded-xl w-48 h-48" />
                        <div className="absolute bottom-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                          Point camera at barcode
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setIsScannerActive(false)}
                        className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg"
                      >
                        <CameraOff size={20} />
                      </motion.button>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="relative mb-4">
                        <div className="flex justify-center mb-6">
                          <div className="bg-gray-100 p-5 rounded-full">
                            <Scan className="h-8 w-8 text-gray-500" />
                          </div>
                        </div>
                        <div className="relative">
                          <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            value={scannedSKU}
                            onChange={(e) => setScannedSKU(e.target.value)}
                            placeholder="Scan barcode or enter SKU"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                            autoFocus
                          />
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setIsScannerActive(true)}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center"
                      >
                        <Scan className="h-5 w-5 mr-2" />
                        Scan QR Code
                      </motion.button>
                      <p className="text-sm text-gray-500 mt-3 text-center">
                        Use a barcode scanner or enter SKU manually
                      </p>
                    </div>
                  )}
                  
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4 border border-red-100"
                    >
                      <AlertCircle className="mr-2" size={18} />
                      <span>{error}</span>
                    </motion.div>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-gray-800 to-black text-white rounded-xl shadow-lg hover:from-gray-700 hover:to-gray-900"
                    disabled={!scannedSKU}
                  >
                    Find Product
                  </motion.button>
                </form>
              ) : foundProduct ? (
                <form onSubmit={handleSellSubmit}>
                  <div className="flex flex-col items-center mb-6">
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl w-full p-5 mb-5 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Category</div>
                            <div className="font-medium">{foundProduct.category}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="bg-purple-100 p-2 rounded-lg mr-3">
                            <Tag className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Subcategory</div>
                            <div className="font-medium">{foundProduct.subcategory}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="bg-amber-100 p-2 rounded-lg mr-3">
                            <Ruler className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Size</div>
                            <div className="font-medium">{foundProduct.size}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="bg-pink-100 p-2 rounded-lg mr-3">
                            <Palette className="h-5 w-5 text-pink-600" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Color</div>
                            <div className="font-medium">{foundProduct.color}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Selling Price</div>
                          <div className="flex items-center text-xl font-bold text-gray-900">
                            रू {foundProduct.sellingPrice.toFixed(2)}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Stock Quantity</div>
                          <div className={`flex items-center text-xl font-bold ${foundProduct.quantity > 10 ? 'text-green-600' : foundProduct.quantity > 5 ? 'text-amber-600' : 'text-red-600'}`}>
                            <Layers className="h-5 w-5 mr-1" />
                            {foundProduct.quantity}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Discount Section - Improved responsive layout */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
                    <div className="flex flex-col sm:flex-row gap-2 mb-2">
                      <select
                        value={discountType}
                        onChange={e => setDiscountType(e.target.value as 'amount' | 'percent')}
                        className="border rounded-xl sm:rounded-l-xl sm:rounded-r-none px-3 py-2 focus:ring-2 focus:ring-blue-500 flex-1"
                      >
                        <option value="amount">Amount (रू)</option>
                        <option value="percent">Percent (%)</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        max={discountType === 'amount' ? foundProduct.sellingPrice : 100}
                        value={discountValue}
                        onChange={e => setDiscountValue(Number(e.target.value))}
                        className="px-3 py-2 border rounded-xl sm:rounded-r-xl sm:rounded-l-none focus:ring-2 focus:ring-blue-500 text-center flex-1"
                        placeholder={discountType === 'amount' ? '0' : '0'}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {discountType === 'amount'
                        ? `Discounted by रू ${discountValue}`
                        : `Discounted by ${discountValue}%`}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Quantity to Sell
                    </label>
                    <div className="flex items-center justify-center max-w-xs mx-auto">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-5 py-2.5 bg-gray-100 border border-gray-300 rounded-l-xl hover:bg-gray-200 text-lg font-bold"
                      >
                        -
                      </motion.button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(foundProduct.quantity, parseInt(e.target.value) || 1)))}
                        className="w-full px-4 py-2.5 border-t border-b border-gray-300 text-center text-lg font-bold"
                        min="1"
                        max={foundProduct.quantity}
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => setQuantity(Math.min(foundProduct.quantity, quantity + 1))}
                        className="px-5 py-2.5 bg-gray-100 border border-gray-300 rounded-r-xl hover:bg-gray-200 text-lg font-bold"
                      >
                        +
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl mb-6 border border-blue-100 shadow-sm">
                    <div className="flex justify-between mb-3 pb-2 border-b border-blue-100">
                      <span className="text-gray-600">Unit Price:</span>
                      <span className="font-medium text-gray-900">रू {foundProduct.sellingPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-3 pb-2 border-b border-blue-100">
                      <span className="text-gray-600">Discounted Price:</span>
                      <span className="font-medium text-green-700">रू {soldPrice !== null ? soldPrice.toFixed(2) : foundProduct.sellingPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-3 pb-2 border-b border-blue-100">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium text-gray-900">{quantity}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2">
                      <span>Total:</span>
                      <span className="text-blue-700">RS {soldPrice !== null ? (soldPrice * quantity).toFixed(2) : (foundProduct.sellingPrice * quantity).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 font-bold"
                  >
                    Complete Sale
                  </motion.button>
                </form>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellModal;