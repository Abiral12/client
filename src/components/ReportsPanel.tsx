'use client';

import ReportsChart from '@/components/ReportsCharts';
import SalesComparison from '@/components/salesComparison';
import { motion } from 'framer-motion';

// Define the actual data types
export type Trend = {
  _id: string;
  totalSold: number;
  totalSales: number;
  totalCost?: number;
  grossProfit?: number;
  profitMargin?: number;
};

export type ComparisonPeriod = {
  totalSold: number;
  totalRevenue: number;
  totalCost?: number;
};

export type ComparisonData = {
  period1: ComparisonPeriod;
  period2: ComparisonPeriod;
};

interface ReportsPanelProps {
  fetchSalesTrends: (period?: string, start?: string, end?: string) => Promise<Trend[]>;
  fetchSalesComparison: (
    period1Start: string,
    period1End: string,
    period2Start: string,
    period2End: string
  ) => Promise<ComparisonData>;
  isMobile?: boolean;
}

export default function ReportsPanel({ 
  fetchSalesTrends, 
  fetchSalesComparison,
  isMobile = false 
}: ReportsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={`bg-white rounded-xl shadow-sm ${isMobile ? 'p-4' : 'p-6'}`}>
        <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 mb-4`}>
          Sales Reports
        </h2>
        
        <div className={isMobile ? "space-y-4" : "space-y-6"}>
          <ReportsChart 
            fetchSalesTrends={fetchSalesTrends} 
            chartHeight={isMobile ? 250 : 350}
          />
          <SalesComparison 
            fetchSalesComparison={fetchSalesComparison} 
          />
        </div>
      </div>
    </motion.div>
  );
}