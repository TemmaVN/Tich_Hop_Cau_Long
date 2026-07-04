import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "../../contexts/ThemeContext";

const data = [
  { name: "Vợt cầu lông",  value: 42, color: "#fb923c" },
  { name: "Cầu lông",      value: 22, color: "#3b82f6" },
  { name: "Giày cầu lông", value: 18, color: "#10b981" },
  { name: "Túi & Balo",    value:  8, color: "#8b5cf6" },
  { name: "Phụ kiện",      value:  7, color: "#f59e0b" },
  { name: "Quần áo",       value:  3, color: "#ef4444" },
];

function SalesChart() {
  const { isDark } = useTheme();
  return (
    <div className="bg-white dark:bg-slate-900 backdrop-blur-xl rounded-b-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
          Doanh thu theo danh mục
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Phân bổ doanh thu năm 2025
        </p>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
            <Tooltip 
                contentStyle={{
                backgroundColor: "rgba(31, 41, 55, 0.8)",
                borderColor: "#4b5563",
                borderRadius: "8px",
                }}
                itemStyle={{ color: "#e5e7eb" }}
            />
            <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
            >
                {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                </Pie>
                <Tooltip
                contentStyle={{
                    backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                }}
                />
            </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3 ">
        {
            data.map((item, index) => {
                return (
                    <div className="flex items-center justify-between" key={`item-${index}`}>
                        <div className="flex items-center space-x-3">
                            <div
                            className="w-3 h-3 rounded-full"
                            style={{backgroundColor: item.color}}
                            >
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {item.name}
                            </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-white">
                          {item.value}%
                        </div>
                    </div>
                )
            }
        )}
      </div>
    </div>
  );
}

export default SalesChart;