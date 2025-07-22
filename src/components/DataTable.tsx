"use client";

import { motion } from "framer-motion";
import {
  Pencil,
  Trash2,
  Download,
  X,
  Package,
  Ruler,
  Palette,
  Box,
  Loader,
} from "lucide-react";
import { useState, useEffect } from "react";
// import axios from "axios";
// import { toast } from "react-hot-toast";
// import { getAuthToken } from "@/utils/auth";

interface Product {
  _id: string;
  sku: string;
  category: string;
  subcategory: string;
  size?: string;
  color: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  createdAt?: string;
  rack?: string;
  description?: string;
}

interface DataTableProps {
  data: Product[];
  onEdit: (product: Product) => Promise<Product>;
  onDelete: (productId: string) => void;
}

export default function DataTable({ data, onEdit, onDelete }: DataTableProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [filteredData, setFilteredData] = useState<Product[]>([]);

  // Apply category filter whenever data or filter changes
  useEffect(() => {
    let result = [...data];

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter((product) => product.category === categoryFilter);
    }

    // Sort by createdAt (newest first) if available
    result.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return 0;
    });

    setFilteredData(result);
  }, [data, categoryFilter]);

  const handleEditClick = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      category: product.category,
      subcategory: product.subcategory,
      size: product.size,
      color: product.color,
      quantity: product.quantity,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      rack: product.rack,
      description: product.description,
    });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name.includes("Price") ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!currentProduct) {
      setError("No product selected");
      setIsLoading(false);
      return;
    }

    try {
      const updatedProduct = {
        ...currentProduct,
        ...formData,
      };

      await onEdit(updatedProduct);
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      let errorMsg = "Failed to update product";
      if (err instanceof Error) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Format subcategory for display
  const formatSubcategory = (subcategory: string | undefined | null) => {
    if (!subcategory || typeof subcategory !== "string") return "";
    return subcategory.charAt(0).toUpperCase() + subcategory.slice(1);
  };

  // Add download handler
  const handleDownload = async (product: Product) => {
    try {
      // Adjust the backend URL if needed
      const backendUrl = process.env.NEXT_PUBLIC_QRCODE;
      const qrUrl = `${backendUrl}/qrcodes/${product.sku}.png`;
      const response = await fetch(qrUrl);
      if (!response.ok) throw new Error("QR code not found");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${product.sku}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      let errorMsg = "";
      if (err instanceof Error) {
        errorMsg = err.message;
      }
      alert(`Failed to download QR code image. ${errorMsg}`);
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Category Filter Tabs - Mobile optimized */}
      <div className="flex mb-4 border-b border-gray-200 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-3 py-2 font-medium text-sm flex-shrink-0 ${
            categoryFilter === "all"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All Products
        </button>
        <button
          onClick={() => setCategoryFilter("clothing")}
          className={`px-3 py-2 font-medium text-sm flex-shrink-0 ${
            categoryFilter === "clothing"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Clothing
        </button>
        <button
          onClick={() => setCategoryFilter("accessories")}
          className={`px-3 py-2 font-medium text-sm flex-shrink-0 ${
            categoryFilter === "accessories"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Accessories
        </button>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Product
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Type
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Size
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Quantity
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Color
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Rack
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Price
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredData.map((item: Product, index: number) => (
            <motion.tr
              key={item._id || `product-${index}`} // Fallback to index only if _id is missing
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-gray-50"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="bg-gray-200 border-2 border-dashed rounded-md w-10 h-10 flex items-center justify-center mr-3">
                    <span className="text-xs font-bold text-gray-500">
                      {item.category.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {item.category}
                    </div>
                    <div className="text-sm text-gray-500">{item.sku}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                {formatSubcategory(item.subcategory)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.category === "accessories" ? (
                  <span className="text-gray-400">N/A</span>
                ) : (
                  <span className="bg-gray-100 px-2 py-1 rounded-md">
                    {item.size}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div
                  className={`text-sm font-medium ${
                    item.quantity < 10 ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {item.quantity}
                </div>
                {item.quantity < 20 && (
                  <div className="text-xs text-red-500">Low stock!</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                {item.color}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.rack ? (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                    {item.rack}
                  </span>
                ) : (
                  <span className="text-gray-400">Not assigned</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              रू {item.sellingPrice}
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(item._id)}
                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                    title="Download"
                    onClick={() => handleDownload(item)}
                  >
                    <Download size={16} />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>

      {filteredData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {categoryFilter === "all"
              ? "No products found"
              : `No ${categoryFilter} products found`}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && currentProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200"
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Edit Product
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Update product details below
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors rounded-full p-1 hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 max-h-[80vh] overflow-y-auto"
            >
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                  <strong>Error:</strong> {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Display */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Package className="h-4 w-4 mr-2 text-blue-600" />
                    Category
                  </label>
                  <div className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                    <div className="capitalize">{currentProduct.category}</div>
                  </div>
                </div>

                {/* Subcategory Display */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Package className="h-4 w-4 mr-2 text-indigo-600" />
                    Subcategory
                  </label>
                  <div className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                    <div className="capitalize">
                      {formatSubcategory(currentProduct.subcategory)}
                    </div>
                  </div>
                </div>

                {/* Size - Only shown for clothing */}
                {currentProduct.category === "clothing" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Ruler className="h-4 w-4 mr-2 text-indigo-600" />
                      Size
                    </label>
                    <div className="relative">
                      <select
                        name="size"
                        value={formData.size || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pl-3 pr-10 shadow-sm transition"
                        required
                      >
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                        <option value="Universal">Universal</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg
                          className="h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Color */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Palette className="h-4 w-4 mr-2 text-purple-600" />
                    Color
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color || ""}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
                    required
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
                    value={formData.quantity || ""}
                    onChange={handleInputChange}
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
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      रू
                    </span>
                    <input
                      type="number"
                      name="purchasePrice"
                      value={formData.purchasePrice || ""}
                      onChange={handleInputChange}
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
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      रू
                    </span>
                    <input
                      type="number"
                      name="sellingPrice"
                      value={formData.sellingPrice || ""}
                      onChange={handleInputChange}
                      className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                {/* Rack */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <span className="mr-2">🗄️</span>
                    Rack Location
                  </label>
                  <input 
                    type="text" 
                    name="rack"
                    value={formData.rack || ""}
                    onChange={handleInputChange}
                    placeholder="Enter Rack Location (e.g., A1, B2)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"/>
                </div>
                
                {/* Description */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <span className="mr-2">📝</span>
                    Description (optional)
                  </label>
                  <textarea 
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                    placeholder="Enter product description"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center ${
                    isLoading ? "opacity-80 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </span>
                  ) : (
                    <span>Update Product</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
