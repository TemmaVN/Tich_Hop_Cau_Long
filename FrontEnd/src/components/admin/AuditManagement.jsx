import React, { useState, useEffect, useCallback } from "react";
import { useAdminManagement } from "../../contexts/AdminManagementContext";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "—";

const formatCurrency = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

const SkeletonRow = ({ cols = 5 }) => (
  <tr className="animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-slate-700 rounded" /></td>
    ))}
  </tr>
);

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition";

// ─── AUDIT LOGS TAB ───────────────────────────────────────────────────────────
const AuditLogsTab = () => {
  const { auditLogs, auditPagination, loading, fetchAuditLogs } = useAdminManagement();
  const [filters, setFilters] = useState({
    module: "", action: "", targetType: "", fromDate: "", toDate: "",
    page: 1, pageSize: 15,
  });
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== "" && v !== null)
    );
    fetchAuditLogs(params);
  }, [filters]);

  const setFilter = (key, val) =>
    setFilters((prev) => ({ ...prev, [key]: val, page: key !== "page" ? 1 : val }));

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Module">
            <input className={inputCls} placeholder="Ví dụ: Order, Product..." value={filters.module}
              onChange={(e) => setFilter("module", e.target.value)} />
          </Field>
          <Field label="Hành động">
            <input className={inputCls} placeholder="Ví dụ: Create, Update..." value={filters.action}
              onChange={(e) => setFilter("action", e.target.value)} />
          </Field>
          <Field label="Loại đối tượng">
            <input className={inputCls} placeholder="Ví dụ: User, Order..." value={filters.targetType}
              onChange={(e) => setFilter("targetType", e.target.value)} />
          </Field>
          <Field label="Từ ngày">
            <input type="date" className={inputCls} value={filters.fromDate}
              onChange={(e) => setFilter("fromDate", e.target.value)} />
          </Field>
          <Field label="Đến ngày">
            <input type="date" className={inputCls} value={filters.toDate}
              onChange={(e) => setFilter("toDate", e.target.value)} />
          </Field>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ module: "", action: "", targetType: "", fromDate: "", toDate: "", page: 1, pageSize: 15 })}
              className="w-full py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-slate-400 px-1">
        <span>{loading ? "Đang tải..." : `${auditPagination.total} bản ghi`}</span>
        <span>Trang {auditPagination.page}</span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Admin</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Module</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Đối tượng</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Thời gian</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
            ) : auditLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400 dark:text-slate-500">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm font-medium">Không có nhật ký nào</p>
                </td>
              </tr>
            ) : (
              auditLogs.map((log, idx) => (
                <tr key={log.logId ?? idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 dark:text-white text-xs truncate max-w-32">
                      {log.adminEmail ?? log.AdminEmail ?? `Admin #${log.adminId ?? log.AdminId}`}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-mono">
                      {log.module ?? log.Module ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded text-xs font-semibold">
                      {log.action ?? log.Action ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500 dark:text-slate-400">
                    {log.targetType ?? log.TargetType ?? "—"}
                    {(log.targetId ?? log.TargetId) && ` #${log.targetId ?? log.TargetId}`}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400 dark:text-slate-500">
                    {formatDate(log.createdAt ?? log.CreatedAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {log.description ?? log.Description ? (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-xs text-blue-500 dark:text-blue-400 hover:underline font-medium"
                      >
                        Xem
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {auditPagination.total > filters.pageSize && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={filters.page <= 1}
            onClick={() => setFilter("page", filters.page - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            ← Trước
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {filters.page} / {Math.ceil(auditPagination.total / filters.pageSize)}
          </span>
          <button
            disabled={filters.page >= Math.ceil(auditPagination.total / filters.pageSize)}
            onClick={() => setFilter("page", filters.page + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            Sau →
          </button>
        </div>
      )}

      {/* Log detail modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
              <h3 className="font-bold text-gray-800 dark:text-white text-sm">Mô tả thao tác</h3>
              <button onClick={() => setSelectedLog(null)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 text-gray-400 hover:text-gray-700 dark:hover:text-white text-sm transition-colors">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-gray-400 mb-0.5">Module</p><p className="font-medium text-gray-800 dark:text-white">{selectedLog.module ?? selectedLog.Module}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Hành động</p><p className="font-medium text-orange-600 dark:text-orange-400">{selectedLog.action ?? selectedLog.Action}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Đối tượng</p><p className="font-medium text-gray-800 dark:text-white">{selectedLog.targetType ?? selectedLog.TargetType} #{selectedLog.targetId ?? selectedLog.TargetId}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Thời gian</p><p className="font-medium text-gray-800 dark:text-white">{formatDate(selectedLog.createdAt ?? selectedLog.CreatedAt)}</p></div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Mô tả</p>
                <p className="text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                  {selectedLog.description ?? selectedLog.Description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ALERT SUMMARY TAB ────────────────────────────────────────────────────────
const AlertCard = ({ icon, title, value, subtitle, color }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 flex items-start gap-4 shadow-sm`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-800 dark:text-white mt-0.5">{value ?? "—"}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const AlertSummaryTab = () => {
  const { alertSummary, loading, fetchAlertSummary } = useAdminManagement();
  const [params, setParams] = useState({ lowStockThreshold: 5, voucherExpiringDays: 7, lowRatingReviewDays: 7 });

  useEffect(() => { fetchAlertSummary(params); }, []);

  const handleRefresh = () => fetchAlertSummary(params);

  const s = alertSummary || {};

  return (
    <div className="space-y-5">
      {/* Config row */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Cấu hình ngưỡng cảnh báo</p>
        <div className="flex flex-wrap gap-3 items-end">
          <Field label="Tồn kho thấp ≤">
            <input type="number" min={0} value={params.lowStockThreshold}
              onChange={(e) => setParams((p) => ({ ...p, lowStockThreshold: +e.target.value }))}
              className="w-20 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-center dark:text-white outline-none focus:ring-2 focus:ring-orange-400/50" />
          </Field>
          <Field label="Voucher hết hạn trong (ngày)">
            <input type="number" min={1} value={params.voucherExpiringDays}
              onChange={(e) => setParams((p) => ({ ...p, voucherExpiringDays: +e.target.value }))}
              className="w-20 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-center dark:text-white outline-none focus:ring-2 focus:ring-orange-400/50" />
          </Field>
          <Field label="Đánh giá thấp (ngày gần nhất)">
            <input type="number" min={1} value={params.lowRatingReviewDays}
              onChange={(e) => setParams((p) => ({ ...p, lowRatingReviewDays: +e.target.value }))}
              className="w-20 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-center dark:text-white outline-none focus:ring-2 focus:ring-orange-400/50" />
          </Field>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Đang tải..." : "Cập nhật"}
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AlertCard
          icon="📦"
          title="Biến thể hàng tồn thấp"
          value={s.lowStockCount ?? s.LowStockCount}
          subtitle={`Ngưỡng ≤ ${params.lowStockThreshold} sản phẩm`}
          color="bg-orange-50 dark:bg-orange-500/10"
        />
        <AlertCard
          icon="🎟️"
          title="Voucher sắp hết hạn"
          value={s.expiringVoucherCount ?? s.ExpiringVoucherCount}
          subtitle={`Trong ${params.voucherExpiringDays} ngày tới`}
          color="bg-yellow-50 dark:bg-yellow-500/10"
        />
        <AlertCard
          icon="⭐"
          title="Đánh giá thấp gần đây"
          value={s.lowRatingReviewCount ?? s.LowRatingReviewCount}
          subtitle={`${params.lowRatingReviewDays} ngày gần nhất`}
          color="bg-red-50 dark:bg-red-500/10"
        />
        {(s.pendingWarrantyCount ?? s.PendingWarrantyCount) !== undefined && (
          <AlertCard icon="🔧" title="Bảo hành chờ xử lý"
            value={s.pendingWarrantyCount ?? s.PendingWarrantyCount}
            subtitle="Đang chờ phản hồi"
            color="bg-blue-50 dark:bg-blue-500/10" />
        )}
        {(s.pendingOrderCount ?? s.PendingOrderCount) !== undefined && (
          <AlertCard icon="🛒" title="Đơn hàng chờ xác nhận"
            value={s.pendingOrderCount ?? s.PendingOrderCount}
            subtitle="Cần xử lý"
            color="bg-violet-50 dark:bg-violet-500/10" />
        )}
      </div>

      {!alertSummary && !loading && (
        <div className="text-center py-10 text-gray-400 dark:text-slate-500">
          <p className="text-3xl mb-2">🔔</p>
          <p className="text-sm">Nhấn "Cập nhật" để tải dữ liệu cảnh báo</p>
        </div>
      )}
    </div>
  );
};

// ─── SLOW MOVING PRODUCTS TAB ─────────────────────────────────────────────────
const SlowMovingTab = () => {
  const { slowMovingProducts, slowPagination, loading, fetchSlowMovingProducts } = useAdminManagement();
  const [days, setDays] = useState(30);
  const [inputDays, setInputDays] = useState("30");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchSlowMovingProducts({ daysWithoutSale: days, page, pageSize });
  }, [days, page]);

  const applyFilter = () => {
    const val = parseInt(inputDays, 10);
    if (!isNaN(val) && val > 0) { setDays(val); setPage(1); }
  };

  return (
    <div className="space-y-4">
      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2">
          <span className="text-sm text-gray-500 dark:text-slate-400">Không bán trong</span>
          <input type="number" min={1} value={inputDays} onChange={(e) => setInputDays(e.target.value)}
            className="w-16 text-sm font-semibold text-gray-800 dark:text-white bg-transparent outline-none text-center" />
          <span className="text-sm text-gray-500 dark:text-slate-400">ngày</span>
        </div>
        <button onClick={applyFilter}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors active:scale-[0.98]">
          Lọc
        </button>
        <span className="text-sm text-gray-400 dark:text-slate-500">
          {loading ? "Đang tải..." : `${slowPagination.total} sản phẩm`}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Sản phẩm</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Tồn kho</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Giá</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ngày bán cuối</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Đã bán tổng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
            ) : slowMovingProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400 dark:text-slate-500">
                  <p className="text-3xl mb-2">🎉</p>
                  <p className="text-sm font-medium">Không có sản phẩm nào ít bán trong {days} ngày</p>
                </td>
              </tr>
            ) : (
              slowMovingProducts.map((p, idx) => (
                <tr key={p.productId ?? p.ProductId ?? idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 dark:text-white truncate max-w-48">
                      {p.productName ?? p.ProductName ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                      ID: {p.productId ?? p.ProductId ?? "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                      {p.stockQuantity ?? p.StockQuantity ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell text-gray-600 dark:text-slate-300">
                    {formatCurrency(p.price ?? p.Price)}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-slate-400">
                    {p.lastSoldDate ?? p.LastSoldDate
                      ? formatDate(p.lastSoldDate ?? p.LastSoldDate)
                      : <span className="text-gray-300 dark:text-slate-600">Chưa từng bán</span>}
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                      {p.totalSold ?? p.TotalSold ?? 0}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {slowPagination.total > pageSize && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            ← Trước
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {page} / {Math.ceil(slowPagination.total / pageSize)}
          </span>
          <button disabled={page >= Math.ceil(slowPagination.total / pageSize)} onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            Sau →
          </button>
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const TABS = [
  { id: "audit",    label: "📋 Nhật ký thao tác" },
  { id: "alerts",   label: "🔔 Cảnh báo hệ thống" },
  { id: "slowmove", label: "📉 Sản phẩm ít bán"   },
];

const AuditManagement = () => {
  const [tab, setTab] = useState("audit");

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Quản trị hệ thống</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Nhật ký thao tác, cảnh báo và phân tích hàng hóa</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 dark:border-slate-700 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${
              tab === t.id
                ? "border-orange-500 text-orange-600 dark:text-orange-400"
                : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "audit"    && <AuditLogsTab />}
      {tab === "alerts"   && <AlertSummaryTab />}
      {tab === "slowmove" && <SlowMovingTab />}
    </div>
  );
};

export default AuditManagement;
