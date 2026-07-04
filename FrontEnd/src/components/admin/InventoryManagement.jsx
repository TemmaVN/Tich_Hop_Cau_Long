import React, { useState, useEffect, useCallback } from "react";
import { useInventory } from "../../contexts/InventoryContext";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SERIAL_STATUS_CFG = {
  InStock:   { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15", border: "border-emerald-200 dark:border-emerald-500/30", dot: "bg-emerald-500", label: "Còn hàng" },
  Sold:      { color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-50 dark:bg-blue-500/15",       border: "border-blue-200 dark:border-blue-500/30",       dot: "bg-blue-400",   label: "Đã bán" },
  Defective: { color: "text-red-500 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-500/15",         border: "border-red-200 dark:border-red-500/30",         dot: "bg-red-400",    label: "Lỗi" },
};

const SERIAL_TABS = [
  { label: "Còn hàng",  value: "InStock"   },
  { label: "Đã bán",    value: "Sold"      },
  { label: "Lỗi",       value: "Defective" },
];

const formatCurrency = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

// ─── MINI COMPONENTS ─────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = SERIAL_STATUS_CFG[status] || {
    color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-400", label: status,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const Toast = ({ msg }) => {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-up ${
      msg.error ? "bg-red-50 border border-red-200 text-red-700" : "bg-emerald-50 border border-emerald-200 text-emerald-700"
    }`}>
      {msg.error ? "✖" : "✅"} {msg.text}
    </div>
  );
};

const SkeletonRow = ({ cols = 5 }) => (
  <tr className="animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-slate-700 rounded w-full" /></td>
    ))}
  </tr>
);

// ─── LOW STOCK TAB ────────────────────────────────────────────────────────────
const LowStockTab = () => {
  const { lowStockItems, loading, fetchLowStock } = useInventory();
  const [threshold, setThreshold] = useState(5);
  const [inputVal, setInputVal] = useState("5");

  useEffect(() => { fetchLowStock(threshold); }, [threshold]);

  const applyThreshold = () => {
    const val = parseInt(inputVal, 10);
    if (!isNaN(val) && val >= 0) setThreshold(val);
  };

  return (
    <div className="space-y-4">
      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2">
          <span className="text-sm text-gray-500 dark:text-slate-400">Ngưỡng tồn kho ≤</span>
          <input
            type="number"
            min={0}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-16 text-sm font-semibold text-gray-800 dark:text-white bg-transparent outline-none text-center"
          />
        </div>
        <button
          onClick={applyThreshold}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors active:scale-[0.98]"
        >
          Lọc
        </button>
        <span className="text-sm text-gray-400 dark:text-slate-500">
          {loading ? "Đang tải..." : `${lowStockItems.length} biến thể cần nhập hàng`}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Sản phẩm</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Biến thể</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Tồn kho</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Giá</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Mức độ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
            ) : lowStockItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400 dark:text-slate-500">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="text-sm font-medium">Không có biến thể nào dưới ngưỡng tồn kho</p>
                </td>
              </tr>
            ) : (
              lowStockItems.map((item, idx) => {
                const stock = item.stockQuantity ?? item.StockQuantity ?? 0;
                const urgency =
                  stock === 0 ? { label: "Hết hàng", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" }
                  : stock <= 2 ? { label: "Nguy hiểm", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10" }
                  : { label: "Thấp", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-500/10" };
                return (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-white truncate max-w-48">
                        {item.productName ?? item.ProductName ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        ID: {item.detailId ?? item.DetailId ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {item.variantInfo ?? item.VariantInfo ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-lg font-bold text-gray-800 dark:text-white">{stock}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-gray-600 dark:text-slate-300">
                      {formatCurrency(item.price ?? item.Price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${urgency.bg} ${urgency.color}`}>
                        {urgency.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── SERIALS TAB ──────────────────────────────────────────────────────────────
const SerialsTab = () => {
  const { serials, loading, fetchSerialsByStatus, markDefective, markInStock } = useInventory();
  const [activeStatus, setActiveStatus] = useState("Defective");
  const [toast, setToast] = useState(null);
  const [actingId, setActingId] = useState(null);

  useEffect(() => { fetchSerialsByStatus(activeStatus); }, [activeStatus]);

  const showToast = (text, error = false) => {
    setToast({ text, error });
    setTimeout(() => setToast(null), 3000);
  };

  const handleMarkDefective = async (serialId) => {
    setActingId(serialId);
    const res = await markDefective(serialId);
    showToast(res.success ? "Đã đánh dấu serial là lỗi." : res.message, !res.success);
    setActingId(null);
  };

  const handleMarkInStock = async (serialId) => {
    setActingId(serialId);
    const res = await markInStock(serialId);
    showToast(res.success ? "Đã chuyển serial về tồn kho." : res.message, !res.success);
    setActingId(null);
  };

  return (
    <div className="space-y-4">
      <Toast msg={toast} />

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SERIAL_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveStatus(t.value)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              activeStatus === t.value
                ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Serial</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Sản phẩm</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
            ) : serials.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-gray-400 dark:text-slate-500">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-sm font-medium">Không có serial nào</p>
                </td>
              </tr>
            ) : (
              serials.map((s, idx) => {
                const id = s.serialId ?? s.SerialId ?? idx;
                const status = s.status ?? s.Status ?? activeStatus;
                const isActing = actingId === id;
                return (
                  <tr key={id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-gray-800 dark:text-slate-200 tracking-wider">
                        {s.serialNumber ?? s.SerialNumber ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="font-medium text-gray-700 dark:text-slate-300 truncate max-w-40">
                        {s.productName ?? s.ProductName ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        {s.variantInfo ?? s.VariantInfo ?? ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {status !== "Defective" && (
                          <button
                            onClick={() => handleMarkDefective(id)}
                            disabled={isActing}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all disabled:opacity-50 active:scale-[0.97]"
                          >
                            {isActing ? "..." : "Đánh dấu lỗi"}
                          </button>
                        )}
                        {status !== "InStock" && status !== "Sold" && (
                          <button
                            onClick={() => handleMarkInStock(id)}
                            disabled={isActing}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all disabled:opacity-50 active:scale-[0.97]"
                          >
                            {isActing ? "..." : "Về tồn kho"}
                          </button>
                        )}
                        {status === "Sold" && (
                          <span className="text-xs text-gray-400 dark:text-slate-500 italic">Đã xuất</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const TABS = [
  { id: "low-stock", label: "📦 Hàng tồn thấp" },
  { id: "serials",   label: "🔢 Theo dõi Serial" },
];

const InventoryManagement = () => {
  const [tab, setTab] = useState("low-stock");

  return (
    <div className="p-6 space-y-6">
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.25s ease both; }
      `}</style>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Quản lý kho hàng</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Theo dõi tồn kho và trạng thái serial</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${
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
      {tab === "low-stock" && <LowStockTab />}
      {tab === "serials"   && <SerialsTab />}
    </div>
  );
};

export default InventoryManagement;
