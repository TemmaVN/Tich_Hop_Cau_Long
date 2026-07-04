import React, { useEffect } from 'react';
import { MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { useOrder } from '../../contexts/OrderContext';


const topProducts = [
  {
    name: "Vợt Yonex Astrox 88D",
    sales: 234,
    revenue: "1.170.000.000 đ",
    trend: "up",
    change: "+18%",
  },
  {
    name: "Vợt Victor Thruster K 12M",
    sales: 186,
    revenue: "892.800.000 đ",
    trend: "up",
    change: "+12%",
  },
  {
    name: "Cầu RSL Gold (hộp 12 quả)",
    sales: 1520,
    revenue: "760.000.000 đ",
    trend: "up",
    change: "+24%",
  },
  {
    name: "Giày Yonex SHB 65Z3",
    sales: 142,
    revenue: "567.000.000 đ",
    trend: "down",
    change: "-5%",
  },
];

const STATUSES = {
  1: { text: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-600" },
  2: { text: "Đã xác nhận", color: "bg-blue-100 text-blue-600" },
  3: { text: "Đang xử lý", color: "bg-indigo-100 text-indigo-600" },
  4: { text: "Đang đan lưới", color: "bg-teal-100 text-teal-600" },
  5: { text: "Đang giao hàng", color: "bg-purple-100 text-purple-600" },
  6: { text: "Đã giao hàng", color: "bg-green-100 text-green-600" },
  7: { text: "Hoàn tất", color: "bg-emerald-100 text-emerald-600" },
  8: { text: "Đã huỷ", color: "bg-red-100 text-red-600" },
};


function TableSection() {
  const getStatusColor = (status) => {
    const statusEntry = Object.values(STATUSES).find(
      (item) => item.text === status
    );
    
    if (statusEntry) {
      return statusEntry.color;
    }
    
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
  };

    const {orders, fetchAllOrders, getRecentOrders} = useOrder();
    useEffect(() => {
      fetchAllOrders({page: 1, pagesize: 200});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    } , []);

    const ordersList = getRecentOrders(orders, 4);
  return (
    <div className="space-y-6">
      {/* Đơn hàng gần đây */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-b-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Đơn hàng gần đây
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Các đơn hàng mới nhất của khách hàng
              </p>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Xem tất cả
            </button>
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Order ID
                </th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Khách hàng
                </th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Tổng tiền
                </th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Trạng thái
                </th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Ngày tạo
                </th>
              </tr>
            </thead>
                <tbody>
                {ordersList.map((order, index) => (
                    <tr
                    key={index}
                    className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                    <td className="p-4">
                        <span className="text-sm font-medium text-blue-600">
                        {order.orderId}
                        </span>
                    </td>
                    <td className="p-4">
                        <span className="text-sm text-slate-800 dark:text-white">
                        {order.receiverName}
                        </span>
                    </td>
                    <td className="p-4">
                        <span className="text-sm text-slate-800 dark:text-white">
                        {order.totalAmount}
                        </span>
                    </td>
                    <td className="p-4">
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                        </span>
                    </td>
                    <td className="p-4">
                        <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-800 dark:text-white">
                            {order.orderDate}
                        </span>
                        <button 
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
          </table>

        </div>
      </div>

      {/* Sản phẩm bán chạy */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Sản phẩm bán chạy
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                Hiệu suất bán hàng tốt nhất
                </p>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Xem tất cả
            </button>
            </div>
        </div>

        <div className="p-6 space-y-4">
            {topProducts.map((product, index) => (
            <div 
                key={index} 
                className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
                    {product.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    {product.sales.toLocaleString()} lượt bán
                </p>
                </div>

                <div className="text-right">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {product.revenue}
                </p>
                <div className="flex items-center justify-end space-x-1">
                    {product.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    ) : (
                    <TrendingDown className="w-3 h-3 text-rose-500" />
                    )}
                    <span className={`text-xs font-medium ${product.trend === "up" ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {product.change}
                    </span>
                </div>
                </div>
            </div>
            ))}
        </div>
        </div>

    </div>
  );
}

export default TableSection;