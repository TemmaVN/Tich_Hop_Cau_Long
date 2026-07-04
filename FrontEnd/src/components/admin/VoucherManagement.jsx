import { useState, useEffect } from "react";
import { Plus, Tag, CheckCircle, AlertCircle, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";
import { voucherApi } from "../../api";

const PAYMENT_METHODS = ["COD", "Bank Transfer", "E-Wallet"];
const PAYMENT_LABELS = {
  COD: "Tiền mặt (COD)",
  "Bank Transfer": "Chuyển khoản",
  "E-Wallet": "Ví điện tử",
};

const initialForm = {
  voucherCode: "",
  description: "",
  discountValue: "",
  isPercent: true,
  maxDiscountAmount: "",
  startDate: "",
  endDate: "",
  minOrderValue: "",
  isGlobal: true,
  usageLimit: "",
  maxUsagePerUser: "",
  allowedPaymentMethods: [],
};

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-500";

/* ── Card hiển thị 1 voucher trong danh sách ── */
const VoucherCard = ({ v, onToggleActive }) => {
  const daysLeft = Math.ceil((new Date(v.endDate) - new Date()) / 86400000);
  const expired = daysLeft <= 0;
  return (
    <div className={`border rounded-xl p-4 ${!v.isActive ? "opacity-60 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" : expired ? "opacity-70 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-sm font-bold font-mono text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-1 rounded-lg">
            {v.voucherCode}
          </code>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${v.isGlobal ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600" : "bg-purple-50 dark:bg-purple-500/10 text-purple-600"}`}>
            {v.isGlobal ? "🌐 Toàn sàn" : "👤 Cá nhân"}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${v.isActive ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>
            {v.isActive ? "Đang hoạt động" : "Đã tắt"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-xl shrink-0 ${expired ? "bg-red-50 dark:bg-red-500/10 text-red-500" : daysLeft <= 7 ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"}`}>
            {expired ? "Hết hạn" : `Còn ${daysLeft} ngày`}
          </span>
          <button
            onClick={() => onToggleActive(v)}
            title={v.isActive ? 'Tắt voucher' : 'Kích hoạt voucher'}
            className={`p-1.5 rounded-lg transition-colors ${v.isActive ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            {v.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
        <span>
          Giảm:{" "}
          <strong className="text-slate-800 dark:text-white">
            {v.isPercent ? `${v.discountValue}%` : `${v.discountValue.toLocaleString()}₫`}
          </strong>
          {v.isPercent && v.maxDiscountAmount && (
            <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">
              (tối đa {v.maxDiscountAmount.toLocaleString()}₫)
            </span>
          )}
        </span>
        <span>
          Đơn tối thiểu:{" "}
          <strong className="text-slate-800 dark:text-white">{v.minOrderValue.toLocaleString()}₫</strong>
        </span>
        <span>
          Hết hạn:{" "}
          <strong className="text-slate-800 dark:text-white">
            {new Date(v.endDate).toLocaleDateString("vi-VN")}
          </strong>
        </span>
        {v.maxUsagePerUser && (
          <span>
            Tối đa / người:{" "}
            <strong className="text-slate-800 dark:text-white">{v.maxUsagePerUser}</strong>
          </span>
        )}
      </div>

      {v.allowedPaymentMethods?.length > 0 && (
        <div className="mt-2 flex gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400">Áp dụng:</span>
          {v.allowedPaymentMethods.map((m) => (
            <span key={m} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
              {PAYMENT_LABELS[m] ?? m}
            </span>
          ))}
        </div>
      )}

      {v.description && (
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 italic">{v.description}</p>
      )}
    </div>
  );
};

/* ── Component chính ── */
const VoucherManagement = () => {
  const [tab, setTab] = useState("list");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const fetchVouchers = async () => {
    setLoadingList(true);
    try {
      const res = await voucherApi.adminGetAll({ page: 1, pageSize: 100 });
      setVouchers(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setVouchers([]);
    } finally {
      setLoadingList(false);
    }
  };

  const handleToggleActive = async (voucher) => {
    const newActive = !voucher.isActive;
    try {
      await voucherApi.adminSetActive(voucher.voucherId, newActive);
      setVouchers(prev => prev.map(v =>
        v.voucherId === voucher.voucherId ? { ...v, isActive: newActive } : v
      ));
    } catch {
      alert('Không thể thay đổi trạng thái voucher');
    }
  };

  useEffect(() => {
    if (tab === "list") fetchVouchers();
  }, [tab]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const togglePaymentMethod = (method) => {
    setForm((prev) => ({
      ...prev,
      allowedPaymentMethods: prev.allowedPaymentMethods.includes(method)
        ? prev.allowedPaymentMethods.filter((m) => m !== method)
        : [...prev.allowedPaymentMethods, method],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const payload = {
        voucherCode: form.voucherCode || "",
        description: form.description || "",
        isPercent: form.isPercent,
        discountValue: parseFloat(form.discountValue),
        maxDiscountAmount:
          form.isPercent && form.maxDiscountAmount
            ? parseFloat(form.maxDiscountAmount)
            : undefined,
        minOrderValue: parseFloat(form.minOrderValue) || 0,
        startDate: form.startDate || undefined,
        endDate: form.endDate,
        isGlobal: form.isGlobal,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
        maxUsagePerUser: form.maxUsagePerUser ? parseInt(form.maxUsagePerUser) : undefined,
        allowedPaymentMethods:
          form.allowedPaymentMethods.length > 0 ? form.allowedPaymentMethods : undefined,
      };
      const res = await voucherApi.adminCreate(payload);
      setResult({
        success: true,
        message: "Tạo voucher thành công!",
        code: res.data?.voucherCode,
      });
      setForm(initialForm);
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.message ?? "Đã xảy ra lỗi khi tạo voucher.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className={`${tab === "create"? "max-w-3xl":"max-w-7xl"} mx-auto`}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Quản lý Voucher</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tạo và xem danh sách mã giảm giá</p>
              </div>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
              {[
                { key: "list", label: "Danh sách" },
                { key: "create", label: "Tạo mới" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    tab === t.key
                      ? "bg-white dark:bg-slate-700 text-orange-500 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── TAB: TẠO MỚI ── */}
          {tab === "create" && (
            <>
              {result && (
                <div
                  className={`mx-6 mt-6 p-4 rounded-xl flex items-start gap-3 ${
                    result.success
                      ? "bg-emerald-50 border border-emerald-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-semibold ${result.success ? "text-emerald-700" : "text-red-700"}`}>
                      {result.message}
                    </p>
                    {result.code && (
                      <code className="mt-1 inline-block text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        {result.code}
                      </code>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Code + flags */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Mã voucher (tự sinh nếu bỏ trống)">
                    <input
                      name="voucherCode"
                      value={form.voucherCode}
                      onChange={handleChange}
                      placeholder="VD: SUMMER25"
                      className={inputCls + " font-mono uppercase"}
                      style={{ textTransform: "uppercase" }}
                    />
                  </Field>
                  <div className="flex flex-col justify-end gap-3 pb-0.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isGlobal"
                        checked={form.isGlobal}
                        onChange={handleChange}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">🌐 Toàn sàn</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isPercent"
                        checked={form.isPercent}
                        onChange={handleChange}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">% Phần trăm</span>
                    </label>
                  </div>
                </div>

                {/* Discount value + max */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Giá trị giảm" required>
                    <div className="relative">
                      <input
                        name="discountValue"
                        type="number"
                        min="0"
                        value={form.discountValue}
                        onChange={handleChange}
                        required
                        placeholder={form.isPercent ? "10" : "50000"}
                        className={inputCls + " pr-10"}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        {form.isPercent ? "%" : "₫"}
                      </span>
                    </div>
                  </Field>
                  {form.isPercent && (
                    <Field label="Giảm tối đa">
                      <div className="relative">
                        <input
                          name="maxDiscountAmount"
                          type="number"
                          min="0"
                          value={form.maxDiscountAmount}
                          onChange={handleChange}
                          placeholder="100000"
                          className={inputCls + " pr-6"}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₫</span>
                      </div>
                    </Field>
                  )}
                </div>

                {/* Min order + usage limit */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Giá trị đơn tối thiểu">
                    <div className="relative">
                      <input
                        name="minOrderValue"
                        type="number"
                        min="0"
                        value={form.minOrderValue}
                        onChange={handleChange}
                        placeholder="0"
                        className={inputCls + " pr-6"}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₫</span>
                    </div>
                  </Field>
                  <Field label="Giới hạn sử dụng toàn hệ thống">
                    <input
                      name="usageLimit"
                      type="number"
                      min="1"
                      value={form.usageLimit}
                      onChange={handleChange}
                      placeholder="Không giới hạn"
                      className={inputCls}
                    />
                  </Field>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Ngày bắt đầu">
                    <input
                      name="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Ngày hết hạn" required>
                    <input
                      name="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={handleChange}
                      required
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label="Tối đa lượt dùng mỗi người">
                  <input
                    name="maxUsagePerUser"
                    type="number"
                    min="1"
                    value={form.maxUsagePerUser}
                    onChange={handleChange}
                    placeholder="Không giới hạn"
                    className={inputCls}
                  />
                </Field>

                {/* Payment methods */}
                <Field label="Phương thức thanh toán áp dụng (để trống = tất cả)">
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {PAYMENT_METHODS.map((method) => {
                      const selected = form.allowedPaymentMethods.includes(method);
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => togglePaymentMethod(method)}
                          className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-colors select-none ${
                            selected
                              ? "border-orange-400 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400"
                              : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          {selected ? "✓ " : ""}{PAYMENT_LABELS[method]}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* Description */}
                <Field label="Mô tả">
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Nhập mô tả voucher..."
                    className={inputCls + " resize-none"}
                  />
                </Field>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-60 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  {submitting ? "Đang tạo..." : "Tạo voucher"}
                </button>
              </form>
            </>
          )}

          {/* ── TAB: DANH SÁCH ── */}
          {tab === "list" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {loadingList ? "Đang tải..." : `${vouchers.length} voucher đang hoạt động`}
                </p>
                <button
                  onClick={fetchVouchers}
                  className="flex items-center gap-1.5 text-sm text-orange-500 font-semibold hover:text-orange-600"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingList ? "animate-spin" : ""}`} />
                  Làm mới
                </button>
              </div>

              {!loadingList && vouchers.length === 0 && (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                  Chưa có voucher nào đang hoạt động.
                </div>
              )}

              <div className="space-y-3">
                {vouchers.map((v) => (
                  <VoucherCard key={v.voucherId} v={v} onToggleActive={handleToggleActive} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VoucherManagement;
