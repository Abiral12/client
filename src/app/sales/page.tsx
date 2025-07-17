"use client";

import { useEffect, useState, useCallback } from "react";
import AdminHeader from '@/components/AdminHeader';
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import axios from "axios";
import { getAuthToken } from '@/utils/auth';
import { TrendingUp, CalendarDays, CalendarRange, ArrowUp, ArrowDown, Activity, ArrowRight, ArrowLeft, ShoppingBag, Package } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SalesTrend {
  _id: string;
  totalSold: number;
  totalSales: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
}

interface SaleHistoryItem {
  _id: string;
  productId: {
    sku: string;
    category: string;
    subcategory: string;
    size?: string;
    color?: string;
    sellingPrice: number;
    purchasePrice: number;
  };
  quantity: number;
  price: number;
  purchasePrice: number;
  soldPrice?: number;
  date: string;
}

interface BulkSaleProduct {
  productId: {
    subcategory?: string;
    purchasePrice: number;
    // add other fields as needed
  };
  quantity: number;
  soldPrice: number;
}

interface BulkSale {
  _id: string;
  createdAt: string;
  products: BulkSaleProduct[];
  subtotal: number;
  orderDiscountType: string;
  orderDiscountValue: number;
  total: number;
}

export default function SalesPage() {
  const [weekData, setWeekData] = useState<SalesTrend[]>([]);
  const [monthData, setMonthData] = useState<SalesTrend[]>([]);
  const [yearData, setYearData] = useState<SalesTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [salesHistory, setSalesHistory] = useState<SaleHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [bulkSales, setBulkSales] = useState<BulkSale[]>([]);
  const [bulkLoading, setBulkLoading] = useState(true);
  const [bulkError, setBulkError] = useState("");
  const [bulkPage, setBulkPage] = useState(1);
  const [bulkLimit, setBulkLimit] = useState(10);
  const [bulkTotalPages, setBulkTotalPages] = useState(1);

  const fetchSalesTrends = useCallback(async (start: string, end: string, period: string) => {
    const token = getAuthToken();
    const params = { period, start, end };
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/trends`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params
      }
    );
    return response.data.trends;
  }, []);

  const [weekStart, setWeekStart] = useState<Date>(new Date());
  const [weekEnd, setWeekEnd] = useState<Date>(new Date());

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError("");
      try {
        const today = new Date();
        const weekStartDate = new Date(today);
        weekStartDate.setDate(today.getDate() - 6); // Last 7 days including today
        weekStartDate.setHours(0,0,0,0);
        const weekEndDate = new Date(today);
        weekEndDate.setHours(23,59,59,999);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

        setWeekStart(weekStartDate);
        setWeekEnd(weekEndDate);

        const [week, month, year] = await Promise.all([
          fetchSalesTrends(weekStartDate.toISOString(), weekEndDate.toISOString(), 'daily'),
          fetchSalesTrends(monthStart.toISOString(), monthEnd.toISOString(), 'daily'),
          fetchSalesTrends(yearStart.toISOString(), yearEnd.toISOString(), 'monthly'),
        ]);
        setWeekData(week);
        setMonthData(month);
        setYearData(year);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Failed to fetch sales data");
        } else {
          setError("Failed to fetch sales data");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [fetchSalesTrends]);

  // Fetch sales history
  useEffect(() => {
    async function fetchHistory(page = 1, limit = 10) {
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const token = getAuthToken();
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/history`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { page, limit }
          }
        );
        setSalesHistory(response.data.sales);
        setTotalPages(response.data.totalPages);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setHistoryError(err.response?.data?.message || "Failed to fetch sales history");
        } else {
          setHistoryError("Failed to fetch sales history");
        }
      } finally {
        setHistoryLoading(false);
      }
    }
    fetchHistory(page, limit);
  }, [page, limit]);

  useEffect(() => {
    async function fetchBulkSales(page = 1, limit = 10) {
      setBulkLoading(true);
      setBulkError("");
      try {
        const token = getAuthToken();
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/bulksales`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { page, limit }
          }
        );
        setBulkSales(res.data.bulkSales);
        setBulkTotalPages(res.data.totalPages || 1);
      } catch {
        setBulkError("Failed to fetch bulk sale history");
      } finally {
        setBulkLoading(false);
      }
    }
    fetchBulkSales(bulkPage, bulkLimit);
  }, [bulkPage, bulkLimit]);

  const cardStyles = [
    {
      border: "border-l-4 border-blue-500",
      icon: <TrendingUp className="h-7 w-7 text-blue-500" />,
      gradient: "from-blue-50 to-white",
      chartColor: "#3B82F6"
    },
    {
      border: "border-l-4 border-green-500",
      icon: <CalendarDays className="h-7 w-7 text-green-500" />,
      gradient: "from-green-50 to-white",
      chartColor: "#10B981"
    },
    {
      border: "border-l-4 border-amber-500",
      icon: <CalendarRange className="h-7 w-7 text-amber-500" />,
      gradient: "from-amber-50 to-white",
      chartColor: "#F59E42"
    }
  ];

  function getBarChartData(data: SalesTrend[], color: string) {
    return {
      labels: data.map(d => d._id),
      datasets: [
        {
          label: 'Sales',
          data: data.map(d => d.totalSales),
          backgroundColor: `${color}80`, // Add transparency
          borderColor: color,
          borderWidth: 1,
          borderRadius: 6,
          barThickness: 20,
        }
      ],
    };
  }

  // Helper to calculate percentage change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminHeader />
      <div className="pt-20 px-4 pb-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Activity className="text-blue-600" />
              Sales & Profit Dashboard
            </h1>
            <p className="text-gray-600 max-w-2xl">
              Track your sales performance, analyze costs, and monitor profitability trends across different time periods
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            <span className="text-gray-500 text-sm">Last updated: </span>
            <span className="font-medium">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center">
            <div className="bg-red-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((_, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="animate-pulse">
                  <div className="h-7 w-7 bg-gray-200 rounded-full mb-4"></div>
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {[1, 2, 3, 4].map((_, i) => (
                      <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
                    ))}
                  </div>
                  <div className="h-40 bg-gray-100 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* This Week */}
            <div className={`bg-gradient-to-b ${cardStyles[0].gradient} rounded-2xl shadow-lg p-6 border border-gray-100 transition-all hover:shadow-xl`}>
              <div className="flex items-center mb-6">
                {cardStyles[0].icon}
                <div className="ml-3">
                  <h2 className="text-xl font-bold text-gray-800">Last 7 Days</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {weekStart ? weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} - {weekEnd ? weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </p>
                </div>
              </div>
              
              {(() => {
                const totalSales = weekData.reduce((sum, d) => sum + (d.totalSales || 0), 0);
                const grossProfit = weekData.reduce((sum, d) => sum + (d.grossProfit || 0), 0);
                const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
                const prevWeekSales = totalSales * 0.85; // Placeholder for demo
                const salesChange = calculateChange(totalSales, prevWeekSales);
                
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">Total Sales</div>
                        <div className="text-xl font-bold text-gray-900 mb-1">रू {totalSales.toLocaleString()}</div>
                        <div className={`flex items-center text-sm ${salesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {salesChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                          {Math.abs(salesChange).toFixed(1)}% from last week
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">Profit Margin</div>
                        <div className="text-xl font-bold text-gray-900">{profitMargin.toFixed(1)}%</div>
                        <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${profitMargin > 20 ? 'bg-green-500' : profitMargin > 10 ? 'bg-amber-500' : 'bg-red-500'}`} 
                            style={{ width: `${Math.min(profitMargin, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium text-gray-700">Daily Performance</h3>
                        <span className="text-sm text-blue-600 font-medium">रू {grossProfit.toLocaleString()} Profit</span>
                      </div>
                      <div className="h-52">
                        <Bar
                          data={getBarChartData(weekData, cardStyles[0].chartColor)}
                          options={{
                            responsive: true,
                            plugins: { 
                              legend: { display: false },
                              tooltip: {
                                backgroundColor: 'white',
                                titleColor: '#1F2937',
                                bodyColor: '#1F2937',
                                borderColor: '#E5E7EB',
                                borderWidth: 1,
                                padding: 12,
                                boxPadding: 4,
                                usePointStyle: true,
                                callbacks: {
                                  label: (context) => `रू ${context.raw}`
                                }
                              }
                            },
                            scales: { 
                              y: { 
                                beginAtZero: true,
                                grid: { color: 'rgba(0,0,0,0.05)' },
                                ticks: { 
                                  callback: (value) => `रू ${value}`,
                                  maxTicksLimit: 6
                                }
                              },
                              x: { 
                                grid: { display: false }
                              }
                            },
                            maintainAspectRatio: false,
                          }}
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* This Month */}
            <div className={`bg-gradient-to-b ${cardStyles[1].gradient} rounded-2xl shadow-lg p-6 border border-gray-100 transition-all hover:shadow-xl`}>
              <div className="flex items-center mb-6">
                {cardStyles[1].icon}
                <div className="ml-3">
                  <h2 className="text-xl font-bold text-gray-800">This Month</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              
              {(() => {
                const totalSales = monthData.reduce((sum, d) => sum + (d.totalSales || 0), 0);
                const grossProfit = monthData.reduce((sum, d) => sum + (d.grossProfit || 0), 0);
                const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
                const prevMonthSales = totalSales * 0.92; // Placeholder for demo
                const salesChange = calculateChange(totalSales, prevMonthSales);
                
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">Total Sales</div>
                        <div className="text-xl font-bold text-gray-900 mb-1">रू {totalSales.toLocaleString()}</div>
                        <div className={`flex items-center text-sm ${salesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {salesChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                          {Math.abs(salesChange).toFixed(1)}% from last month
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">Profit Margin</div>
                        <div className="text-xl font-bold text-gray-900">{profitMargin.toFixed(1)}%</div>
                        <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${profitMargin > 20 ? 'bg-green-500' : profitMargin > 10 ? 'bg-amber-500' : 'bg-red-500'}`} 
                            style={{ width: `${Math.min(profitMargin, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium text-gray-700">Daily Trends</h3>
                        <span className="text-sm text-green-600 font-medium">रू {grossProfit.toLocaleString()} Profit</span>
                      </div>
                      <div className="h-52">
                        <Bar
                          data={getBarChartData(monthData, cardStyles[1].chartColor)}
                          options={{
                            responsive: true,
                            plugins: { 
                              legend: { display: false },
                              tooltip: {
                                backgroundColor: 'white',
                                titleColor: '#1F2937',
                                bodyColor: '#1F2937',
                                borderColor: '#E5E7EB',
                                borderWidth: 1,
                                padding: 12,
                                boxPadding: 4,
                                usePointStyle: true,
                                callbacks: {
                                label: (context) => `रू ${context.raw}`
                                }
                              }
                            },
                            scales: { 
                              y: { 
                                beginAtZero: true,
                                grid: { color: 'rgba(0,0,0,0.05)' },
                                ticks: { 
                                  callback: (value) => `रू ${value}`,
                                  maxTicksLimit: 6
                                }
                              },
                              x: { 
                                grid: { display: false }
                              }
                            },
                            maintainAspectRatio: false,
                          }}
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* This Year */}
            <div className={`bg-gradient-to-b ${cardStyles[2].gradient} rounded-2xl shadow-lg p-6 border border-gray-100 transition-all hover:shadow-xl`}>
              <div className="flex items-center mb-6">
                {cardStyles[2].icon}
                <div className="ml-3">
                  <h2 className="text-xl font-bold text-gray-800">This Year</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date().getFullYear()} Performance
                  </p>
                </div>
              </div>
              
              {(() => {
                const totalSales = yearData.reduce((sum, d) => sum + (d.totalSales || 0), 0);
                const grossProfit = yearData.reduce((sum, d) => sum + (d.grossProfit || 0), 0);
                const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
                const prevYearSales = totalSales * 0.88; // Placeholder for demo
                const salesChange = calculateChange(totalSales, prevYearSales);
                
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">Total Sales</div>
                        <div className="text-xl font-bold text-gray-900 mb-1">रू {totalSales.toLocaleString()}</div>
                        <div className={`flex items-center text-sm ${salesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {salesChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                          {Math.abs(salesChange).toFixed(1)}% from last year
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">Profit Margin</div>
                        <div className="text-xl font-bold text-gray-900">{profitMargin.toFixed(1)}%</div>
                        <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${profitMargin > 20 ? 'bg-green-500' : profitMargin > 10 ? 'bg-amber-500' : 'bg-red-500'}`} 
                            style={{ width: `${Math.min(profitMargin, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium text-gray-700">Monthly Trends</h3>
                        <span className="text-sm text-amber-600 font-medium">रू {grossProfit.toLocaleString()} Profit</span>
                      </div>
                      <div className="h-52">
                        <Bar
                          data={getBarChartData(yearData, cardStyles[2].chartColor)}
                          options={{
                            responsive: true,
                            plugins: { 
                              legend: { display: false },
                              tooltip: {
                                backgroundColor: 'white',
                                titleColor: '#1F2937',
                                bodyColor: '#1F2937',
                                borderColor: '#E5E7EB',
                                borderWidth: 1,
                                padding: 12,
                                boxPadding: 4,
                                usePointStyle: true,
                                callbacks: {
                                  label: (context) => `रू ${context.raw}`
                                }
                              }
                            },
                            scales: { 
                              y: { 
                                beginAtZero: true,
                                grid: { color: 'rgba(0,0,0,0.05)' },
                                ticks: { 
                                  callback: (value) => `रू ${value}`,
                                  maxTicksLimit: 6
                                }
                              },
                              x: { 
                                grid: { display: false }
                              }
                            },
                            maintainAspectRatio: false,
                          }}
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

                {/* Key Metrics Overview - Mobile Optimized */}
                <div className="mt-10 bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Key Metrics Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-blue-700 mb-1">Total Revenue</div>
                  <div className="text-lg md:text-xl font-bold text-blue-900 mb-1">
                    रू {(
                      weekData.reduce((sum, d) => sum + (d.totalSales || 0), 0) +
                      monthData.reduce((sum, d) => sum + (d.totalSales || 0), 0) +
                      yearData.reduce((sum, d) => sum + (d.totalSales || 0), 0)
                    ).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center text-xs md:text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  <ArrowUp size={12} className="mr-1" />
                  <span>12.5%</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">From last period</div>
            </div>
            
            {/* Total Profit */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-green-700 mb-1">Total Profit</div>
                  <div className="text-lg md:text-xl font-bold text-green-900 mb-1">
                    रू {(
                      weekData.reduce((sum, d) => sum + (d.grossProfit || 0), 0) +
                      monthData.reduce((sum, d) => sum + (d.grossProfit || 0), 0) +
                      yearData.reduce((sum, d) => sum + (d.grossProfit || 0), 0)
                    ).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center text-xs md:text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                  <ArrowUp size={12} className="mr-1" />
                  <span>18.2%</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">From last period</div>
            </div>
            
            {/* Avg. Profit Margin */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-amber-700 mb-1">Avg. Profit Margin</div>
                  <div className="text-lg md:text-xl font-bold text-amber-900 mb-1">
                    {(
                      (weekData.reduce((sum, d) => sum + (d.profitMargin || 0), 0) / (weekData.length || 1) +
                      monthData.reduce((sum, d) => sum + (d.profitMargin || 0), 0) / (monthData.length || 1) +
                      yearData.reduce((sum, d) => sum + (d.profitMargin || 0), 0) / (yearData.length || 1)
                    ) / 3).toFixed(1)}%
                  </div>
                </div>
                <div className="flex items-center text-xs md:text-sm text-amber-600 bg-amber-100 px-2 py-1 rounded">
                  <ArrowUp size={12} className="mr-1" />
                  <span>3.4%</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">Improvement</div>
            </div>
            
            {/* Items Sold */}
            <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-4 border border-violet-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-violet-700 mb-1">Items Sold</div>
                  <div className="text-lg md:text-xl font-bold text-violet-900 mb-1">
                    {(
                      weekData.reduce((sum, d) => sum + (d.totalSold || 0), 0) +
                      monthData.reduce((sum, d) => sum + (d.totalSold || 0), 0) +
                      yearData.reduce((sum, d) => sum + (d.totalSold || 0), 0)
                    ).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center text-xs md:text-sm text-violet-600 bg-violet-100 px-2 py-1 rounded">
                  <ArrowUp size={12} className="mr-1" />
                  <span>7.8%</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">From last period</div>
            </div>
          </div>
        </div>

 {/* Sales History Table - Enhanced with better colors */}
        <div className="mt-10 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingBag className="text-indigo-600" size={20} />
            Product Sold History
          </h2>
          {historyError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">{historyError}</div>
          )}
          {historyLoading ? (
            <div className="text-gray-500">Loading sales history...</div>
          ) : salesHistory.length === 0 ? (
            <div className="text-gray-500">No sales history found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {salesHistory.map((sale) => {
                    const profit = (sale.soldPrice ?? sale.price ?? 0) - (sale.purchasePrice ?? 0);
                    const profitColor = profit >= 0 ? "text-green-700" : "text-red-700";
                    
                    return (
                      <tr key={sale._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(sale.date).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{sale.productId?.subcategory || "-"} {sale.productId?.size ? `(${sale.productId.size})` : ""} {sale.productId?.color ? `- ${sale.productId.color}` : ""}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium">{sale.productId?.sku || "-"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{sale.productId?.category || "-"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-700 font-medium">{sale.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-700">
                          रू {(sale.soldPrice ?? sale.price ?? 0).toLocaleString('en-IN')}
                          {sale.soldPrice !== undefined && sale.soldPrice !== sale.price ? (
                            <span className="text-xs text-gray-500 ml-1">(Discounted)</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-amber-700">
                          रू {(sale.purchasePrice ?? 0).toLocaleString('en-IN')}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-bold ${profitColor}`}>
                          रू {Math.abs(profit).toLocaleString('en-IN')}
                          {profit < 0 ? (
                            <ArrowDown className="inline ml-1" size={14} />
                          ) : profit > 0 ? (
                            <ArrowUp className="inline ml-1" size={14} />
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
           <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
    <div className="flex items-center gap-1 text-sm text-gray-600">
      <span>Page {page} of {totalPages}</span>
      <span className="hidden sm:inline">•</span>
      <span>{salesHistory.length} items</span>
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
</div>

{/* Bulk Sale History Table - Enhanced with better colors */}
        <div className="mt-10 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="text-indigo-600" size={20} />
            Bulk Sale History
          </h2>
          {bulkError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">{bulkError}</div>
          )}
          {bulkLoading ? (
            <div className="text-gray-500">Loading bulk sale history...</div>
          ) : bulkSales.length === 0 ? (
            <div className="text-gray-500">No bulk sale history found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Discount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Purchase</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {bulkSales.map((sale) => {
                    const totalPurchase = sale.products.reduce(
                      (sum, p) => sum + ((p.productId?.purchasePrice ?? 0) * p.quantity),
                      0
                    );
                    const totalSold = sale.products.reduce(
                      (sum, p) => sum + ((p.soldPrice ?? 0) * p.quantity),
                      0
                    );
                    let discount = 0;
                    if (sale.orderDiscountType === "amount") {
                      discount = sale.orderDiscountValue;
                    } else if (sale.orderDiscountType === "percent") {
                      discount = (totalSold * sale.orderDiscountValue) / 100;
                    }
                    const totalProfit = totalSold - discount - totalPurchase;
                    const profitColor = totalProfit >= 0 ? "text-green-700" : "text-red-700";
                    const discountColor = discount > 0 ? "text-red-600" : "text-gray-600";

                    return (
                      <tr key={sale._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(sale.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <ul className="space-y-1">
                            {sale.products.map((p, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>{p.productId?.subcategory || 'Unknown'} x{p.quantity}</span>
                                <span className="font-medium text-green-700">रू {p.soldPrice}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium">
                          रू {sale.subtotal.toLocaleString('en-IN')}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${discountColor}`}>
                          {sale.orderDiscountType === 'amount'
                            ? `रू ${sale.orderDiscountValue.toLocaleString('en-IN')}`
                            : `${sale.orderDiscountValue}%`}
                          {discount > 0 && <ArrowDown className="inline ml-1" size={14} />}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-indigo-700">
                          रू {sale.total.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-amber-700">
                          रू {totalPurchase.toLocaleString('en-IN')}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-bold ${profitColor}`}>
                          रू {Math.abs(totalProfit).toLocaleString('en-IN')}
                          {totalProfit < 0 ? (
                            <ArrowDown className="inline ml-1" size={14} />
                          ) : totalProfit > 0 ? (
                            <ArrowUp className="inline ml-1" size={14} />
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
        </tbody>
      </table>
     <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
       <div className="flex items-center gap-1 text-sm text-gray-600">
         <span>Page {bulkPage} of {bulkTotalPages}</span>
         <span className="hidden sm:inline">•</span>
         <span>{bulkSales.length} items</span>
       </div>
       <div className="flex items-center gap-2">
         <button
           onClick={() => setBulkPage((p) => Math.max(1, p - 1))}
           disabled={bulkPage === 1}
           className="flex items-center justify-center p-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label="Previous page"
         >
           <ArrowLeft size={18} className="text-gray-700" />
           <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
         </button>
         <button
           onClick={() => setBulkPage((p) => Math.min(bulkTotalPages, p + 1))}
           disabled={bulkPage === bulkTotalPages}
           className="flex items-center justify-center p-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label="Next page"
         >
           <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
           <ArrowRight size={18} className="text-gray-700" />
         </button>
       </div>
       <div className="flex items-center gap-2 text-sm">
         <label htmlFor="bulkPageSize" className="text-gray-600">Rows:</label>
         <select
           id="bulkPageSize"
           value={bulkLimit}
           onChange={e => {
             setBulkLimit(Number(e.target.value));
             setBulkPage(1);
           }}
           className="px-2 py-1 border rounded bg-white"
         >
           {[5, 10, 20, 50].map(size => (
             <option key={size} value={size}>{size}</option>
           ))}
         </select>
       </div>
     </div>
    </div>
  )}
</div>
      </div>
    </div>
  );
}