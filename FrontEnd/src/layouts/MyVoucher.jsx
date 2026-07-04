import { useState, useEffect, useCallback } from "react";
import { voucherApi } from "../api";

const formatCurrency = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const getDaysLeft = (endDate) => {
  const diff = new Date(endDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ─── VoucherCard ─────────────────────────────────────────────────────────────
const VoucherCard = ({ voucher, action }) => {
  const [copied, setCopied] = useState(false);
  const daysLeft = getDaysLeft(voucher.endDate);
  const isExpiringSoon = daysLeft <= 3;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(voucher.voucherCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = voucher.voucherCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className={`h-1.5 ${voucher.isGlobal ? "bg-blue-400" : "bg-orange-400"}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                voucher.isGlobal ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400" : "bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400"
              }`}
            >
              {voucher.isGlobal ? "🌐 Toàn sàn" : "🎁 Cá nhân"}
            </span>
            {isExpiringSoon && (
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                ⚡ Sắp hết hạn
              </span>
            )}
          </div>
        </div>

        <p className="text-2xl font-black text-gray-900 dark:text-white mb-1">
          {voucher.isPercent
            ? `Giảm ${voucher.discountValue}%`
            : `Giảm ${formatCurrency(voucher.discountValue)}`}
        </p>
        {voucher.isPercent && voucher.maxDiscountAmount && (
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">
            Tối đa {formatCurrency(voucher.maxDiscountAmount)}
          </p>
        )}
        {voucher.description && (
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-3 line-clamp-2">{voucher.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500 mb-4">
          <span>Đơn tối thiểu {formatCurrency(voucher.minOrderValue)}</span>
          <span className={isExpiringSoon ? "text-red-500 dark:text-red-400 font-semibold" : ""}>
            HSD: {formatDate(voucher.endDate)}
            {isExpiringSoon && ` (còn ${daysLeft} ngày)`}
          </span>
        </div>

        <div className="border-t border-dashed border-gray-200 dark:border-slate-700 mb-4" />

        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm font-mono font-bold tracking-widest bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-gray-800 dark:text-white truncate">
            {voucher.voucherCode}
          </code>
          {action ?? (
            <button
              onClick={handleCopy}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                copied ? "bg-emerald-500 text-white" : "bg-gray-900 text-white hover:bg-gray-700"
              }`}
            >
              {copied ? "✓ Đã sao chép" : "Sao chép"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── SaveButton ───────────────────────────────────────────────────────────────
const SaveButton = ({ voucherId, alreadySaved }) => {
  const [status, setStatus] = useState(alreadySaved ? "saved" : "idle");

  const handleSave = async () => {
    if (status !== "idle") return;
    setStatus("saving");
    try {
      await voucherApi.saveVoucher(voucherId);
      setStatus("saved");
    } catch (e) {
      const msg = (e?.response?.data?.message ?? "").toLowerCase();
      if (msg.includes("đã lưu") || msg.includes("already") || msg.includes("exists")) {
        setStatus("saved");
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
      }
    }
  };

  if (status === "saved")
    return (
      <span className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
        ✓ Đã lưu
      </span>
    );
  if (status === "error")
    return (
      <span className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-500">
        Lỗi
      </span>
    );
  return (
    <button
      onClick={handleSave}
      disabled={status === "saving"}
      className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 transition-all active:scale-95"
    >
      {status === "saving" ? "..." : "Lưu"}
    </button>
  );
};

// ─── Skeleton ────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
    <div className="h-1.5 bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-4 w-24 bg-gray-100 rounded-full" />
      <div className="h-7 w-32 bg-gray-100 rounded" />
      <div className="h-3 w-full bg-gray-100 rounded" />
      <div className="h-3 w-2/3 bg-gray-100 rounded" />
      <div className="h-10 bg-gray-100 rounded-xl mt-4" />
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const MyVoucher = () => {
  const [activeTab, setActiveTab] = useState("mine"); // mine | explore

  // "mine" state
  const [myVouchers, setMyVouchers] = useState([]);
  const [myLoading, setMyLoading] = useState(true);
  const [myError, setMyError] = useState(null);
  const [filter, setFilter] = useState("all");

  // "explore" state
  const [allVouchers, setAllVouchers] = useState([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allError, setAllError] = useState(null);
  const [allFetched, setAllFetched] = useState(false);

  const fetchMyVouchers = useCallback(async () => {
    setMyLoading(true);
    setMyError(null);
    try {
      // POST /Voucher/my-voucher với body rỗng → trả về voucher khả dụng của user
      const res = await voucherApi.getAvailableVouchers({});
      setMyVouchers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMyError("Không thể tải danh sách voucher. Vui lòng thử lại.");
    } finally {
      setMyLoading(false);
    }
  }, []);

  const fetchAllVouchers = useCallback(async () => {
    setAllLoading(true);
    setAllError(null);
    try {
      const res = await voucherApi.getAllAvailable();
      // backend trả về { message, data: [] }
      const data = res.data?.data ?? res.data;
      setAllVouchers(Array.isArray(data) ? data : []);
    } catch {
      setAllError("Không thể tải danh sách voucher. Vui lòng thử lại.");
    } finally {
      setAllLoading(false);
      setAllFetched(true);
    }
  }, []);

  useEffect(() => {
    fetchMyVouchers();
  }, [fetchMyVouchers]);

  useEffect(() => {
    if (activeTab === "explore" && !allFetched) {
      fetchAllVouchers();
    }
  }, [activeTab, allFetched, fetchAllVouchers]);

  const savedIds = new Set(myVouchers.map((v) => v.voucherId));

  const filtered = myVouchers.filter((v) => {
    if (filter === "global") return v.isGlobal === true;
    if (filter === "personal") return v.isGlobal === false;
    return true;
  });

  return (
    <div className="w-full h-full bg-gray-50/70 dark:bg-slate-950/50">
      <div className="max-w-full mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Voucher</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {activeTab === "mine"
              ? myLoading ? "Đang tải..." : `${filtered.length} voucher khả dụng`
              : "Khám phá và lưu mã giảm giá"}
          </p>
        </div>

        {/* Top-level tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-slate-700">
          {[
            { label: "Voucher của tôi", value: "mine" },
            { label: "Khám phá", value: "explore" },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === t.value
                  ? "border-gray-900 dark:border-slate-100 text-gray-900 dark:text-white"
                  : "border-transparent text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Mine tab ── */}
        {activeTab === "mine" && (
          <>
            <div className="flex gap-2 mb-6">
              {[
                { label: "Tất cả", value: "all" },
                { label: "🌐 Toàn sàn", value: "global" },
                { label: "🎁 Cá nhân", value: "personal" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    filter === tab.value
                      ? "bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900 border-gray-900 dark:border-slate-100"
                      : "bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {myLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : myError ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">😕</p>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">{myError}</p>
                <button
                  onClick={fetchMyVouchers}
                  className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition"
                >
                  Thử lại
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">🎟️</p>
                <p className="text-gray-800 dark:text-white font-semibold">Không có voucher nào</p>
                <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
                  {filter !== "all" ? "Thử chuyển sang tab khác" : "Bạn chưa có voucher khả dụng"}
                </p>
                <button
                  onClick={() => setActiveTab("explore")}
                  className="mt-4 px-5 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition"
                >
                  Khám phá voucher
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((v) => (
                  <VoucherCard key={v.voucherId} voucher={v} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Explore tab ── */}
        {activeTab === "explore" && (
          <>
            {allLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : allError ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">😕</p>
                <p className="text-gray-500 text-sm mb-4">{allError}</p>
                <button
                  onClick={fetchAllVouchers}
                  className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition"
                >
                  Thử lại
                </button>
              </div>
            ) : allVouchers.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">🎟️</p>
                <p className="text-gray-800 dark:text-white font-semibold">Không có voucher nào</p>
                <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Hiện chưa có mã giảm giá nào khả dụng</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allVouchers.map((v) => (
                  <VoucherCard
                    key={v.voucherId}
                    voucher={v}
                    action={
                      <SaveButton
                        voucherId={v.voucherId}
                        alreadySaved={savedIds.has(v.voucherId)}
                      />
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyVoucher;
