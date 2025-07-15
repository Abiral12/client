// components/StatCard.tsx
'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: string;
  delay?: number;
}

const StatCard = ({ title, value, change, icon: Icon, color, delay = 0}: StatCardProps) => {
  const isPositive = change.startsWith('+');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
          </div>
          <div className={`${color} p-3 rounded-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {change}
          </span>
          <span className="text-gray-400 text-sm ml-2">from last month</span>
        </div>
      </div>
      
      <div className="h-1 w-full bg-gray-100 relative overflow-hidden">
        <motion.div 
          className={`absolute top-0 left-0 h-full ${
            isPositive ? 'bg-green-500' : 'bg-red-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: isPositive ? '75%' : '30%' }}
          transition={{ duration: 1, delay: delay + 0.2 }}
        />
      </div>
    </motion.div>
  );
};

export default StatCard;