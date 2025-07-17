'use client';

import { motion } from 'framer-motion';
import { X, Package, Ruler, Palette, Box, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthToken } from '@/utils/auth';
import { toast } from 'react-hot-toast';

const StockInForm = ({ onClose, onAddProduct }: any) => {
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    size: '',
    color: '',
    quantity: 0,
    purchasePrice: 0,
    sellingPrice: 0,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [subcategories, setSubcategories] = useState<string[]>([]);

  // Update subcategories when category changes
  useEffect(() => {
    if (formData.category === 'clothing') {
      setSubcategories(['t-shirt', 'trousers', 'shirts', 'formal-pants', 'jeans-pants']);
      // Reset subcategory and size when switching to clothing
      setFormData(prev => ({ ...prev, subcategory: '', size: '' }));
    } else if (formData.category === 'accessories') {
      setSubcategories(['belt', 'purse', 'wallet', 'watch', 'hat']);
      // Reset subcategory and clear size when switching to accessories
      setFormData(prev => ({ ...prev, subcategory: '', size: '' }));
    } else {
      setSubcategories([]);
      // Clear size when no category is selected
      setFormData(prev => ({ ...prev, size: '' }));
    }
  }, [formData.category]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'quantity' || name.includes('Price') ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validate form before submission
    if (!formData.category) {
      setError('Category is required');
      setIsLoading(false);
      toast.error('Category is required');
      return;
    }
    
    if (!formData.subcategory) {
      setError('Subcategory is required');
      setIsLoading(false);
      toast.error('Subcategory is required');
      return;
    }
    
    // Validate clothing requires size
    // if (formData.category === 'clothing' && !formData.size) {
    //   setError('Size is required for clothing items');
    //   setIsLoading(false);
    //   toast.error('Size is required for clothing');
    //   return;
    // }

    const token = getAuthToken();
    if (!token) {
      setError('Authentication required. Please log in again.');
      setIsLoading(false);
      toast.error('Authentication required');
      return;
    }
    
    // Create payload - don't include size for accessories
    const payload = {
      category: formData.category,
      subcategory: formData.subcategory,
      ...(formData.category === 'clothing' && { size: formData.size }), // Only include size for clothing
      color: formData.color,
      quantity: Number(formData.quantity),
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice)
    };

    console.log("Submitting payload:", payload);
    
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/add-product`, 
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (res.data.success) {
        onAddProduct(res.data.product);
        onClose();
        toast.success('Product added successfully!');
      } else {
        const errorMsg = res.data.message || 'Failed to add product';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      let errorMsg = 'Server error';
      
      if (err.response) {
        console.error("Backend error response:", err.response.data);
        errorMsg = err.response.data?.message || 
                  JSON.stringify(err.response.data) || 
                  `HTTP ${err.response.status}`;
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200"
      >
        {/* Header remains the same */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add New Stock</h2>
            <p className="text-sm text-gray-600 mt-1">Fill in product details below</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors rounded-full p-1 hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Package className="h-4 w-4 mr-2 text-blue-600" /> 
                Main Category
              </label>
              <div className="relative">
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pl-3 pr-10 shadow-sm transition"
                  required
                >
                  <option value="">Select main category</option>
                  <option value="clothing">Clothing</option>
                  <option value="accessories">Accessories</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Subcategory */}
            {formData.category && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Package className="h-4 w-4 mr-2 text-indigo-600" /> 
                  Subcategory
                </label>
                <div className="relative">
                  <select 
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pl-3 pr-10 shadow-sm transition"
                    required
                  >
                    <option value="">Select subcategory</option>
                    {subcategories.map((subcat) => (
                      <option key={subcat} value={subcat}>
                        {subcat.charAt(0).toUpperCase() + subcat.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
            {/* Size - Only shown and required for clothing */}
            {formData.category === 'clothing' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Ruler className="h-4 w-4 mr-2 text-indigo-600" /> 
                  Size
                </label>
                <div className="relative">
                  <select 
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pl-3 pr-10 shadow-sm transition"
                    required
                  >
                    <option value="">Select size</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
            {/* Color - Not required */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Palette className="h-4 w-4 mr-2 text-purple-600" /> 
                Color (optional)
              </label>
              <input 
                type="text" 
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="e.g., Black"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
              />
            </div>
            
            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Box className="h-4 w-4 mr-2 text-amber-600" /> 
                Quantity
              </label>
              <input 
                type="number" 
                name="quantity"
                value={formData.quantity || ''}
                onChange={handleChange}
                placeholder="e.g., 100"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
                min="1"
                required
              />
            </div>
            
            {/* Purchase Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <span className="mr-2">💰</span>
                Purchase Price (per item)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">रू</span>
                <input 
                  type="number" 
                  name="purchasePrice"
                  value={formData.purchasePrice || ''}
                  onChange={handleChange}
                  placeholder="e.g., 10.00"
                  className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            
            {/* Selling Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <span className="mr-2">🏷️</span>
                Selling Price (per item)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">रू</span>
                <input 
                  type="number" 
                  name="sellingPrice"
                  value={formData.sellingPrice || ''}
                  onChange={handleChange}
                  placeholder="e.g., 25.00"
                  className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end space-x-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className={`px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center ${
                isLoading ? 'opacity-80 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="mr-1">+</span>
                  Add Product
                </span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default StockInForm;