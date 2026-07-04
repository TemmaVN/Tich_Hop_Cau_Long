import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTheme } from '../../contexts/ThemeContext'

const data = [
  { month: "T1",  revenue: 42, expenses: 28 },
  { month: "T2",  revenue: 38, expenses: 26 },
  { month: "T3",  revenue: 55, expenses: 36 },
  { month: "T4",  revenue: 68, expenses: 44 },
  { month: "T5",  revenue: 72, expenses: 47 },
  { month: "T6",  revenue: 65, expenses: 43 },
  { month: "T7",  revenue: 58, expenses: 39 },
  { month: "T8",  revenue: 62, expenses: 41 },
  { month: "T9",  revenue: 75, expenses: 49 },
  { month: "T10", revenue: 82, expenses: 53 },
  { month: "T11", revenue: 88, expenses: 57 },
  { month: "T12", revenue: 70, expenses: 46 },
];

const RevenueChart = () => {
  const { isDark } = useTheme();
  return (
    <div className='bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-bl-2xl border 
    border-slate-200/50 dark:border-slate-700/50'>
        <div className='flex items-center justify-between m-6'>
            <div>
                <h3 className='text-xl font-bold text-slate-800 dark:text-white'>
                    Biểu đồ doanh thu
                </h3>
                <p className='text-sm text-slate-500 dark:text-slate-400'>
                    Doanh thu và chi phí theo tháng (triệu đồng)
                </p>
            </div>
            <div className='flex items-center space-x-4'>
                <div className='flex items-center space-x-2'>
                    <div className='w-3 h-3 bg-linear-to-r from-blue-500 to-purple-600 
                    rounded-full'>
                    </div>
                    <div className='text-sm text-slate-600 dark:text-slate-400 '>
                        <span>Chi phí</span>
                    </div>
                </div>
                <div className='flex items-center space-x-2'>
                    <div className='w-3 h-3 bg-linear-to-r from-slate-500 to-slate-700
                    rounded-full'>
                    </div>
                    <div className='text-sm text-slate-600 dark:text-slate-400 '>
                        <span>Doanh thu</span>
                    </div>
                </div>
            </div>
        </div>
        <div className='h-80'>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e2e8f0" 
                    opacity={0.3} 
                    vertical={false} 
                    />

                    <XAxis 
                    dataKey="month" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    />

                    <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}M`}
                    />
                    <Tooltip
                    contentStyle={{
                        backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)"
                    }}
                    formatter={(value, name) => [`${value} triệu đ`, name === 'revenue' ? 'Doanh thu' : 'Chi phí']}
                    cursor={{ fill: '#f1f5f9' }}
                    />

                    <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94a3b8" stopOpacity={1} />
                        <stop offset="100%" stopColor="#64748b" stopOpacity={1} />
                    </linearGradient>
                    </defs>

                    <Bar 
                    dataKey="revenue" 
                    fill="url(#revenueGradient)" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={40} 
                    />
                    <Bar 
                    dataKey="expenses" 
                    fill="url(#expensesGradient)" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={40} 
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  )
}

export default RevenueChart