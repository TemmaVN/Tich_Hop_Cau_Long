import React, { useState, useEffect, useCallback } from "react";
import { Search, Eye, Loader2, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useOrder } from "../../contexts/OrderContext";
import OrderDetail from "./OrderDetail";
import { orderApi } from "../../api";

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

const OrderList = () => {
  const {
    orders: contextOrders,
    loading: contextLoading,
    pagination: ctxPagination,
    fetchAllOrders,
    fetchByStatus,
  } = useOrder();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [filters, setFilters] = useState({
    status: "", keyword: "",
    fromDate: "", toDate: "",
    minPrice: "", maxPrice: "",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Local state used only in advanced search mode
  const [searchResults, setSearchResults] = useState([]);
  const [searchPagination, setSearchPagination] = useState({ totalPages: 1 });
  const [searchLoading, setSearchLoading] = useState(false);

  // Use adminSearch for keyword or any advanced filter
  const isAdvancedMode = !!(
    filters.keyword || filters.fromDate || filters.toDate || filters.minPrice || filters.maxPrice
  );

  const doSearch = useCallback(() => {
    const params = { page, pageSize: PAGE_SIZE };
    if (filters.status)    params.statusId  = Number(filters.status);
    if (filters.keyword)   params.keyword   = filters.keyword;
    if (filters.fromDate)  params.fromDate  = filters.fromDate;
    if (filters.toDate)    params.toDate    = filters.toDate;
    if (filters.minPrice) params.minPrice = Number(filters.minPrice);
    if (filters.maxPrice) params.maxPrice = Number(filters.maxPrice);
    setSearchLoading(true);
    orderApi.adminSearch(params)
      .then(r => {
        const d = r.data?.data ?? r.data ?? {};
        const items = Array.isArray(d) ? d : (d.items ?? d.orders ?? []);
        setSearchResults(items);
        setSearchPagination({ totalPages: d.totalPages ?? 1 });
      })
      .catch(() => {})
      .finally(() => setSearchLoading(false));
  }, [page, filters]);

  useEffect(() => {
    if (isAdvancedMode) {
      doSearch();
    } else if (filters.status) {
      fetchByStatus(filters.status, page, PAGE_SIZE);
    } else {
      fetchAllOrders(page, PAGE_SIZE);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const orders     = isAdvancedMode ? searchResults  : contextOrders;
  const loading    = isAdvancedMode ? searchLoading  : contextLoading;
  const pagination = isAdvancedMode ? searchPagination : ctxPagination;

  const displayedOrders = orders;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (pagination.totalPages || 1)) {
      setPage(newPage);
    }
  };

  const pageList = [];
  for (let i = page - 2; i <= page + 2; i++) {
    if (i > 0 && i <= (pagination.totalPages || 1)) pageList.push(i);
  }

  const resetFilters = () => {
    setFilters({ status: "", keyword: "", fromDate: "", toDate: "", minPrice: "", maxPrice: "" });
    setPage(1);
    setShowAdvanced(false);
  };

  const handleCloseDetail = () => setSelectedOrder(null);

  const handleOpenDetail = async (orderId) => {
    setDetailLoadingId(orderId);
    try {
      const response = await orderApi.getAdminDetail(orderId);
      setSelectedOrder(response.data?.data || response.data);
    } catch (error) {
      alert("Không thể lấy chi tiết đơn hàng: " + (error.response?.data?.message || error.message));
    } finally {
      setDetailLoadingId(null);
    }
  };

  const hasActiveAdvanced = !!(filters.keyword || filters.fromDate || filters.toDate || filters.minPrice || filters.maxPrice);

  return (
    <div className="p-1 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="max-w-8xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Quản lý đơn hàng</h3>

          {/* Basic filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                name="keyword"
                value={filters.keyword}
                onChange={handleFilterChange}
                placeholder="Tìm theo tên, SĐT, mã đơn..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUSES).map(([id, { text }]) => (
                <option key={id} value={id}>{text}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdvanced(v => !v)}
                className={`relative flex items-center justify-center gap-2 flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                  showAdvanced || hasActiveAdvanced
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <SlidersHorizontal size={16} />
                Lọc nâng cao
                {hasActiveAdvanced && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full" />
                )}
              </button>
              <button
                onClick={resetFilters}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Advanced filters panel */}
          {showAdvanced && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Từ ngày</label>
                <input
                  type="date"
                  name="fromDate"
                  value={filters.fromDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Đến ngày</label>
                <input
                  type="date"
                  name="toDate"
                  value={filters.toDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Giá tối thiểu (đ)</label>
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Giá tối đa (đ)</label>
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="Không giới hạn"
                  min="0"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center z-10">
              <Loader2 className="animate-spin text-orange-500" size={32} />
            </div>
          )}
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Khách hàng</th>
                <th className="px-5 py-3">Sản phẩm</th>
                <th className="px-5 py-3 text-right">Tổng tiền</th>
                <th className="px-5 py-3 text-center">Trạng thái</th>
                <th className="px-5 py-3">Ngày tạo</th>
                <th className="px-5 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {displayedOrders.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              ) : displayedOrders.map((order) => {
                const firstProduct =
                  order.firstProductName ||
                  order.orderDetails?.[0]?.productName ||
                  "N/A";
                const totalProducts =
                  order.totalProducts ?? order.orderDetails?.length ?? 0;

                let statusInfo = { text: "Không xác định", color: "bg-gray-200 text-gray-700" };
                const rawStatus = order.status;
                if (rawStatus !== undefined && rawStatus !== null) {
                  if (STATUSES[rawStatus]) {
                    statusInfo = STATUSES[rawStatus];
                  } else {
                    const foundEntry = Object.values(STATUSES).find(
                      s => s.text.toLowerCase() === String(rawStatus).toLowerCase().trim()
                    );
                    statusInfo = foundEntry || { text: String(rawStatus), color: "bg-gray-200 text-gray-700" };
                  }
                }

                return (
                  <tr
                    key={order.orderId}
                    className="hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                    onClick={() => handleOpenDetail(order.orderId)}
                  >
                    <td className="px-5 py-3.5 font-mono text-orange-500 dark:text-orange-400 font-semibold">
                      #{order.orderId}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800 dark:text-white">{order.receiverName}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs">{order.phoneNumber}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-50" title={firstProduct}>
                        {firstProduct}
                      </p>
                      {totalProducts > 1 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">và {totalProducts - 1} sản phẩm khác</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-800 dark:text-white">
                      {order.finalAmount?.toLocaleString()}₫
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">
                      {new Date(order.orderDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        disabled={detailLoadingId === order.orderId}
                        className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg disabled:opacity-50"
                      >
                        {detailLoadingId === order.orderId ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Trang <span className="font-semibold">{page}</span> / {pagination.totalPages || 1}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Trước
            </button>
            {pageList.map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors ${
                  p === page
                    ? "bg-orange-default text-white shadow shadow-orange-default/25"
                    : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= (pagination.totalPages || 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={handleCloseDetail}
          onUpdate={() => {
            if (isAdvancedMode) doSearch();
            else if (filters.status) fetchByStatus(filters.status, page, PAGE_SIZE);
            else fetchAllOrders(page, PAGE_SIZE);
          }}
        />
      )}
    </div>
  );
};

export default OrderList;
