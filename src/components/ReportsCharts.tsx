'use client';

import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem
} from 'chart.js';
import { motion } from "framer-motion";
import axios from 'axios';
import { getAuthToken } from '@/utils/auth';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type Trend = {
  _id: string;
  totalSold: number;
  totalSales: number;
};

type ReportsChartProps = {
  fetchSalesTrends: (period?: string, start?: string, end?: string) => Promise<Trend[]>;
  chartHeight?: number;
};

type Product = {
  _id: string;
  sku: string;
  category: string;
  subcategory: string;
  size?: string;
  color?: string;
  quantity: number;
  purchasePrice?: number;
  sellingPrice?: number;
  qrCode?: string;
  createdAt?: string;
  lastUpdated?: string;
  soldCount?: number;
};

const ReportsChart: React.FC<ReportsChartProps> = ({ 
  fetchSalesTrends,
  chartHeight = 350 
}) => {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loadingLowStock, setLoadingLowStock] = useState(false);
  const [errorLowStock, setErrorLowStock] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const end = new Date();
      const start = new Date();
      
      switch(period) {
        case "daily":
          start.setDate(end.getDate() - 30);
          break;
        case "weekly":
          start.setDate(end.getDate() - 90);
          break;
        case "monthly":
          start.setMonth(end.getMonth() - 12);
          break;
      }
      
      const data = await fetchSalesTrends(period, start.toISOString(), end.toISOString());
      setTrends(data);
    } catch (err) {
      const errorMsg = (err as Error).message || "Failed to load sales data";
      console.error("Failed to fetch sales trends:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch low stock products (quantity > 0 and <= 20)
  const fetchLowStockProducts = async () => {
    setLoadingLowStock(true);
    setErrorLowStock(null);
    try {
      const token = getAuthToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products?all=true`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.data.success) {
        const filtered: Product[] = res.data.products.filter((p: Product) => p.quantity >= 0 && p.quantity <= 20);
        setLowStockProducts(filtered);
      } else {
        setErrorLowStock(res.data.message || 'Failed to fetch products');
      }
    } catch (err) {
      setErrorLowStock((err as Error).message || 'Failed to fetch products');
    } finally {
      setLoadingLowStock(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLowStockProducts();
  }, [fetchSalesTrends, period]);

  // Format labels based on period
  const formatLabel = (label: string) => {
    if (period === "daily") {
      return new Date(label).toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    if (period === "weekly") {
      return `Week ${label}`;
    }
    return new Date(label).toLocaleDateString(undefined, { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Chart data configuration
  const chartData = {
    labels: trends.map(t => formatLabel(t._id)),
    datasets: [
      {
        label: "Units Sold",
        data: trends.map(t => t.totalSold),
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.3,
        fill: true,
        pointBackgroundColor: "#3B82F6",
        pointBorderColor: "#fff",
        pointHoverRadius: 5,
        pointRadius: 3,
      },
      {
        label: "Revenue (RS)",
        data: trends.map(t => t.totalSales),
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.3,
        fill: true,
        pointBackgroundColor: "#10B981",
        pointBorderColor: "#fff",
        pointHoverRadius: 5,
        pointRadius: 3,
        yAxisID: 'y1',
      }
    ]
  };

  // Chart options configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1F2937',
        bodyColor: '#1F2937',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        usePointStyle: true,
        callbacks: {
          label: function(context: TooltipItem<'line'>) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.datasetIndex === 1) {
                label += `RS ${context.parsed.y.toLocaleString()}`;
              } else {
                label += context.parsed.y.toLocaleString();
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: period === "daily" ? 45 : 0,
          minRotation: period === "daily" ? 45 : 0,
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        title: {
          display: true,
          text: 'Units Sold'
        }
      },
      y1: {
        position: 'right' as const,
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Revenue (RS)'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-50 p-4 rounded-xl"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h3 className="font-medium text-gray-700 text-lg">Sales Trends</h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setPeriod("daily")}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              period === "daily"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              period === "weekly"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              period === "monthly"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg max-w-md">
            <h4 className="font-medium mb-1">Failed to load data</h4>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-3"></div>
          <p className="text-gray-600">Loading sales trends...</p>
        </div>
      ) : trends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="bg-blue-50 text-blue-700 p-4 rounded-lg max-w-md">
            <h4 className="font-medium mb-1">No data available</h4>
            <p className="text-sm">No sales data found for the selected period</p>
          </div>
        </div>
      ) : (
        <div style={{ height: `${chartHeight}px` }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      <div className="mt-8">
        <h4 className="font-semibold text-gray-800 mb-2">Low Stock Products (≤ 20 units)</h4>
        {loadingLowStock ? (
          <div className="flex items-center space-x-2 text-gray-500 py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-amber-500"></div>
            <span>Loading low stock products...</span>
          </div>
        ) : errorLowStock ? (
          <div className="text-red-600 py-4">{errorLowStock}</div>
        ) : lowStockProducts.length === 0 ? (
          <div className="text-gray-500 py-4">No low stock products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border rounded-lg">
              <thead>
                <tr className="bg-amber-100 text-amber-800">
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Subcategory</th>
                  <th className="px-3 py-2 text-left">Quantity</th>
                  <th className="px-3 py-2 text-left">color</th>
                  <th className="px-3 py-2 text-left">Size</th>
                  <th className="px-3 py-2 text-left">Price</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((p) => (
                  <tr key={p._id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-mono">{p.sku}</td>
                    <td className="px-3 py-2">{p.category}</td>
                    <td className="px-3 py-2">{p.subcategory}</td>
                    <td className="px-3 py-2 text-amber-700 font-semibold">{p.quantity}</td>
                    <td className="px-3 py-2">{p.color}</td>
                    <td className="px-3 py-2">{p.size}</td>
                    <td className="px-3 py-2">{p.sellingPrice}</td>
                    

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-500">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
          <span>Units Sold</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
          <span>Revenue (रू)</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ReportsChart;