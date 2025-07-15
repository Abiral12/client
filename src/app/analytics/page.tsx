"use client";

import AdminHeader from '@/components/AdminHeader';
import ReportsPanel from '@/components/ReportsPanel';
import { useCallback } from 'react';
import { getAuthToken } from '@/utils/auth';
import axios from 'axios';

export default function AnalyticsPage() {
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  // Fetch sales trends
  const fetchSalesTrends = useCallback(
    async (period = 'daily', start?: string, end?: string) => {
      const token = getAuthToken();
      const params: Record<string, string> = { period };
      if (start && end) {
        params.start = start;
        params.end = end;
      }
      const response = await axios.get(
        `${baseUrl}/sales/trends`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params
        }
      );
      return response.data.trends;
    },
    []
  );

  // Fetch sales comparison
  const fetchSalesComparison = useCallback(
    async (period1Start: string, period1End: string, period2Start: string, period2End: string) => {
      const token = getAuthToken();
      const params = { period1Start, period1End, period2Start, period2End };
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/compare`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params
        }
      );
      return response.data;
    },
    []
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="pt-20 px-6 pb-12 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics & Reports</h1>
        <ReportsPanel fetchSalesTrends={fetchSalesTrends} fetchSalesComparison={fetchSalesComparison} />
      </div>
    </div>
  );
}
