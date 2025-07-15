"use client";

import { useState, useEffect } from "react";
import AdminHeader from '@/components/AdminHeader';
import DataTable from '@/components/DataTable';
import StockInForm from '@/components/StockInForm';
import SellModal from '@/components/SellModal';
import { Search, Plus, Scan, ArrowRight, ArrowLeft } from "lucide-react";
import axios from "axios";
import { getAuthToken } from '@/utils/auth';
import toast from "react-hot-toast";
import { useDebounce } from "use-debounce";
import { useRouter } from "next/navigation";

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
  qrCode?: string;
  createdAt?: string;
  lastUpdated?: string;
  soldCount?: number;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showStockIn, setShowStockIn] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
    }
  }, []);

  // Fetch products from backend
  const fetchProducts = async () => {
    setIsLoading(true);
    setError("");
    const token = getAuthToken();
    if (!token) {
      setError("Authentication required");
      setIsLoading(false);
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/filter`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { page, limit },
        }
      );
      if (response.data.success) {
        setInventory(response.data.products);
        setTotalPages(response.data.totalPages || 1);
      } else {
        throw new Error(response.data.message || "Failed to fetch products");
      }
    } catch (err: unknown) {
      let errorMsg = "Failed to fetch products";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, limit]);

  // Add new product to inventory
  const handleAddProduct = (newProduct: Product) => {
    if (!newProduct.createdAt) {
      newProduct.createdAt = new Date().toISOString();
    }
    setInventory(prev => [newProduct, ...prev]);
    setShowStockIn(false);
    fetchProducts();
  };

  // Edit product
  const handleEdit = async (product: Product) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication required");
      return;
    }
    try {
      setIsLoading(true);
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/edit/${product._id}`,
        product,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        setInventory((prev) =>
          prev.map((p) => (p._id === product._id ? response.data.product : p))
        );
        toast.success("Product updated successfully!");
        return response.data.product;
      } else {
        throw new Error(response.data.message || "Failed to update product");
      }
    } catch (err: unknown) {
      let errorMsg = "Failed to update product";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete product
  const handleDelete = async (productId: string) => {
    const token = getAuthToken();
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/delete/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setInventory((prev) => prev.filter((p) => p._id !== productId));
      toast.success("Product deleted successfully!");
    } catch (err: unknown) {
      let errorMsg = "Failed to delete product";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      toast.error(errorMsg);
    }
  };

  // Sell a product
  const handleSell = async (sku: string, quantity: number, soldPrice: number) => {
    const token = getAuthToken();
    const product = inventory.find((item) => item.sku === sku);
    if (!product) {
      toast.error("Product not found!");
      return;
    }
    if (product.quantity < quantity) {
      toast.error("Not enough stock available!");
      return;
    }
    try {
      setIsLoading(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/create`,
        { productId: product._id, quantity, soldPrice },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.success) {
        const updatedProduct = res.data.product;
        if (updatedProduct === null) {
          setInventory((prev) => prev.filter((item) => item._id !== product._id));
        } else {
          setInventory((prev) =>
            prev.map((item) =>
              item._id === product._id ? updatedProduct : item
            )
          );
        }
        toast.success("Product sold successfully!");
      } else {
        throw new Error(res.data.message || "Failed to complete sale");
      }
    } catch (err: unknown) {
      let errorMsg = "Failed to complete sale";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Search function
  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const token = getAuthToken();
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/search`,
        {
          params: { query },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setInventory(response.data.products);
    } catch {
      toast.error("Failed to search products");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (debouncedSearchQuery) {
      handleSearch(debouncedSearchQuery);
    } else {
      fetchProducts();
    }
  }, [debouncedSearchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="pt-20 px-6 pb-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-500 mt-2">View, manage, and search your inventory</p>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            <button
              onClick={() => setShowSellModal(true)}
              className="flex items-center bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              <Scan className="h-5 w-5 mr-2" />
              Sell Product
            </button>
            <button
              onClick={() => setShowStockIn(true)}
              className="flex items-center border border-black text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Stock
            </button>
          </div>
        </div>
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          {isLoading || isSearching ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isSearching ? "Applying filters..." : "Loading inventory..."}
              </div>
            </div>
          ) : (
            <>
              <DataTable
                key={inventory.length}
                data={inventory}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span>Page {page} of {totalPages}</span>
              <span className="hidden sm:inline">•</span>
              <span>{inventory.length} items</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center justify-center p-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ArrowLeft size={18} className="text-gray-700" />
                <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
              </button>
              
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center justify-center p-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
                <ArrowRight size={18} className="text-gray-700" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="pageSize" className="text-gray-600">Rows:</label>
              <select
                id="pageSize"
                value={limit}
                onChange={e => { 
                  setLimit(Number(e.target.value)); 
                  setPage(1); 
                }}
                className="px-2 py-1 border rounded bg-white"
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
        </>

          )}
        </div>
      </div>
      {/* Stock In Modal */}
      {showStockIn && (
        <StockInForm
          onClose={() => setShowStockIn(false)}
          onAddProduct={handleAddProduct}
        />
      )}
      {/* Sell Modal */}
      {showSellModal && (
        <SellModal
          inventory={inventory}
          onClose={() => setShowSellModal(false)}
          onSell={handleSell}
        />
      )}
    </div>
  );
}
