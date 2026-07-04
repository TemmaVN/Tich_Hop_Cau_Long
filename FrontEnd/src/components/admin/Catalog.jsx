import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Tags, Award, Box, ArrowUpRight } from 'lucide-react';

const Catalog = () => {
  const stats = [
    { label: 'Total Products', value: '1,240', icon: Package, color: 'text-blue-500', path: 'products' },
    { label: 'Categories', value: '12', icon: Tags, color: 'text-emerald-500', path: 'categories' },
    { label: 'Brands', value: '8', icon: Award, color: 'text-orange-500', path: 'brands' },
    { label: 'Low Stock', value: '15', icon: Box, color: 'text-rose-500', path: 'products' },
  ];
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} onClick={() => navigate(stat.path)} className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 cursor-pointer hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <ArrowUpRight size={18} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
              <h4 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Catalog;