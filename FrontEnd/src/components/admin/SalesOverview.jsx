import React from 'react';
import { ShoppingCart, CreditCard,AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SalesOverview = () => {
  const navigate = useNavigate();
  const salesStats = [
    { id: 'orders', label: 'Tổng đơn hàng', value: '856', icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/admin/orders' },
    { id: 'payments', label: 'Doanh thu', value: '125.4M', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' , path: '/admin/dashboard' },
    { id: 'service-tickets', label: 'Dịch vụ căng vợt', value: '42', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10',path: '/admin/dashboard'},
    { id: 'pending-orders', label: 'Chờ xử lý', value: '12', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10',path: '/admin/dashboard' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {salesStats.map((stat) => (
          <div key={stat.id} onClick={() => navigate(stat.path)} className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 cursor-pointer hover:scale-[1.02] transition-all group">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon size={24} /></div>
              <ArrowRight size={18} className="text-slate-400 group-hover:text-orange-500 transition-all" />
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesOverview;