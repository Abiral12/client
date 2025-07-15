import React, { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

type ComparisonData = {
  period1: { totalSold: number; totalRevenue: number };
  period2: { totalSold: number; totalRevenue: number };
};

type SalesComparisonProps = {
  fetchSalesComparison: (
    period1Start: string,
    period1End: string,
    period2Start: string,
    period2End: string
  ) => Promise<ComparisonData>;
};

const SalesComparison: React.FC<SalesComparisonProps> = ({ fetchSalesComparison }) => {
  const [comparison, setComparison] = useState<ComparisonData | null>(null);

  useEffect(() => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    fetchSalesComparison(
      startOfThisMonth.toISOString(),
      endOfThisMonth.toISOString(),
      startOfLastMonth.toISOString(),
      endOfLastMonth.toISOString()
    ).then(setComparison);
  }, [fetchSalesComparison]);

  if (!comparison) return <div>Loading comparison...</div>;

  // Calculate differences
  const soldDiff = comparison.period1.totalSold - comparison.period2.totalSold;
  const revenueDiff = comparison.period1.totalRevenue - comparison.period2.totalRevenue;
  const soldUp = soldDiff >= 0;
  const revenueUp = revenueDiff >= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <span>📊 Sales Comparison</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* This Month */}
        <div className="bg-blue-50 rounded-lg p-5 border border-blue-100 flex flex-col items-center">
          <h4 className="font-medium text-blue-800 mb-2">This Month</h4>
          <div className="text-2xl font-bold text-blue-900 mb-1">{comparison.period1.totalSold}</div>
          <div className="text-sm text-blue-700 mb-2">Units Sold</div>
          <div className="text-lg font-semibold text-green-700 mb-1">रू {comparison.period1.totalRevenue}</div>
          <div className="text-sm text-green-700">Revenue</div>
        </div>
        {/* Last Month */}
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 flex flex-col items-center">
          <h4 className="font-medium text-gray-800 mb-2">Last Month</h4>
          <div className="text-2xl font-bold text-gray-900 mb-1">{comparison.period2.totalSold}</div>
          <div className="text-sm text-gray-700 mb-2">Units Sold</div>
          <div className="text-lg font-semibold text-green-700 mb-1">रू {comparison.period2.totalRevenue}</div>
          <div className="text-sm text-green-700">Revenue</div>
        </div>
      </div>
      {/* Difference Row */}
      <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-center">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${soldUp ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {soldUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {soldUp ? "+" : ""}{soldDiff} Units Sold
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${revenueUp ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {revenueUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {revenueUp ? "+" : ""}रू {revenueDiff} Revenue
        </div>
      </div>
    </div>
  );
};

export default SalesComparison;
