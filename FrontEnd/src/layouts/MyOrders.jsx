import React, { useState, useEffect, useCallback } from "react";
import { orderApi, reviewApi, returnApi } from "../api";
import WarrantyFormModal from "../components/WarrantyFormModal";
import { useWarranty } from "../contexts/WarrantyContext";

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  "Chờ xác nhận": {
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/15",
    border: "border-amber-200 dark:border-amber-500/30",
    dot: "bg-amber-400",
    icon: "⏳",
  },
  "Đã xác nhận": {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/15",
    border: "border-blue-200 dark:border-blue-500/30",
    dot: "bg-blue-400",
    icon: "✅",
  },
  "Đang xử lý": {
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-500/15",
    border: "border-violet-200 dark:border-violet-500/30",
    dot: "bg-violet-400",
    icon: "📦",
  },
  "Đang đan lưới": {
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    bg: "bg-fuchsia-50 dark:bg-fuchsia-500/15",
    border: "border-fuchsia-200 dark:border-fuchsia-500/30",
    dot: "bg-fuchsia-400",
    icon: "🏸",
  },
  "Đang giao hàng": {
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-500/15",
    border: "border-sky-200 dark:border-sky-500/30",
    dot: "bg-sky-400",
    icon: "🚚",
  },
  "Đã giao hàng": {
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-500/15",
    border: "border-teal-200 dark:border-teal-500/30",
    dot: "bg-teal-400",
    icon: "📬",
  },
  "Hoàn tất": {
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    border: "border-emerald-200 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
    icon: "🎉",
  },
  "Đã hủy": {
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-500/15",
    border: "border-red-200 dark:border-red-500/30",
    dot: "bg-red-400",
    icon: "✖",
  },
  "Đang yêu cầu trả hàng/hoàn tiền": {
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-500/15",
    border: "border-orange-200 dark:border-orange-500/30",
    dot: "bg-orange-400",
    icon: "↩",
  },
  "Đã chấp thuận trả hàng/hoàn tiền": {
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-500/15",
    border: "border-teal-200 dark:border-teal-500/30",
    dot: "bg-teal-400",
    icon: "✔",
  },
  "Đã hoàn hàng/hoàn tiền": {
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    border: "border-emerald-200 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
    icon: "💰",
  },
};

const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || {
    color: "text-gray-500 dark:text-slate-400",
    bg: "bg-gray-50 dark:bg-slate-800",
    border: "border-gray-200 dark:border-slate-700",
    dot: "bg-gray-400",
    icon: "•",
  };

const CANCELLABLE   = ["Chờ xác nhận", "Đã xác nhận"];
const REVIEWABLE    = ["Đã giao hàng", "Hoàn tất"];
const RETURNABLE    = ["Đã giao hàng", "Hoàn tất"];
const RETURN_IN_PROGRESS = ["Đang yêu cầu trả hàng/hoàn tiền", "Đã chấp thuận trả hàng/hoàn tiền", "Đã hoàn hàng/hoàn tiền"];

// ─── FORMATTERS ───────────────────────────────────────────────────────────────
const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.icon} {status}
    </span>
  );
};

// ─── STAR RATING ──────────────────────────────────────────────────────────────
const StarRating = ({ value, onChange, readonly = false }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-xl leading-none transition-transform ${
            readonly ? "cursor-default" : "hover:scale-110 cursor-pointer"
          } ${star <= (hover || value) ? "text-yellow-400" : "text-gray-200 dark:text-slate-600"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

// ─── REVIEW MODAL ─────────────────────────────────────────────────────────────
const ReviewModal = ({ orderDetail, existingReview, onClose, onSuccess }) => {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError("Vui lòng chọn số sao đánh giá."); return; }
    setSubmitting(true);
    setError(null);
    try {
      if (existingReview) {
        await reviewApi.update(existingReview.reviewId, { rating, comment: comment.trim() || null });
      } else {
        await reviewApi.create({ orderDetailId: orderDetail.orderDetailId, rating, comment: comment.trim() || null });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview || !window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    setSubmitting(true);
    try {
      await reviewApi.delete(existingReview.reviewId);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? "Không thể xóa đánh giá.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white">
              {existingReview ? "Sửa đánh giá" : "Đánh giá sản phẩm"}
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate max-w-65">
              {orderDetail.productName || "Sản phẩm"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Stars */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Chất lượng sản phẩm</p>
            <StarRating value={rating} onChange={setRating} />
            <p className="text-xs text-gray-400 dark:text-slate-500">
              {["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Rất tốt"][rating] || "Chọn số sao"}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Nhận xét <span className="text-gray-400 font-normal">(tùy chọn)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 dark:focus:ring-yellow-500/50 resize-none transition"
            />
            <p className="text-right text-xs text-gray-400">{comment.length}/500</p>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {existingReview && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-500/30 text-red-500 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Xóa
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang gửi..." : existingReview ? "Cập nhật" : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── RETURN REQUEST MODAL ────────────────────────────────────────────────────
const ReturnRequestModal = ({ order, onClose, onSuccess }) => {
  const [reasons,         setReasons]         = useState([]);
  const [mainReason,      setMainReason]      = useState(null);  // reason object
  const [detailReason,    setDetailReason]    = useState(null);  // detail object
  const [description,     setDescription]     = useState('');
  const [imageUrls,       setImageUrls]       = useState(['']);
  const [deliveryProofs,  setDeliveryProofs]  = useState([]);
  const [submitting,      setSubmitting]      = useState(false);
  const [error,           setError]           = useState(null);

  useEffect(() => {
    returnApi.getReasons()
      .then((res) => setReasons(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!detailReason?.shouldShowDeliveryProof) return;
    returnApi.getDeliveryProofs(order.orderId)
      .then((res) => setDeliveryProofs(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDeliveryProofs([]));
  }, [detailReason, order.orderId]);

  const selectMain = (r) => { setMainReason(r); setDetailReason(null); setDescription(''); setImageUrls(['']); };

  const addImageField   = () => setImageUrls((prev) => [...prev, '']);
  const removeImageField = (i) => setImageUrls((prev) => prev.filter((_, idx) => idx !== i));
  const updateImageUrl  = (i, val) => setImageUrls((prev) => prev.map((u, idx) => (idx === i ? val : u)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mainReason || !detailReason) { setError('Vui lòng chọn lý do trả hàng.'); return; }
    if (detailReason.requiresDescription && !description.trim()) {
      setError('Vui lòng mô tả chi tiết vấn đề.'); return;
    }
    const filteredUrls = imageUrls.filter((u) => u.trim());
    if (detailReason.requiresImage && filteredUrls.length === 0) {
      setError('Vui lòng cung cấp ít nhất một ảnh minh chứng.'); return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await returnApi.createRequest({
        orderId: order.orderId,
        mainReason: mainReason.code,
        detailReason: detailReason.code,
        customerDescription: description.trim() || null,
        imageUrls: filteredUrls,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? err.response?.data?.Message ?? 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-900 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white">Yêu cầu trả hàng / hoàn tiền</h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Đơn hàng #{order.orderId}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm">
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Note from API (shown on first reason) */}
          {mainReason?.note && (
            <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-xl px-3 py-2.5">
              ⚠️ {mainReason.note}
            </div>
          )}

          {/* Step 1: Main reason */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">1. Chọn lý do</p>
            <div className="space-y-2">
              {reasons.map((r) => (
                <button key={r.code} type="button" onClick={() => selectMain(r)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    mainReason?.code === r.code
                      ? 'border-orange-400 bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}>
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Detail reason */}
          {mainReason && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">2. Chi tiết vấn đề</p>
              <div className="space-y-2">
                {mainReason.details.map((d) => (
                  <button key={d.code} type="button" onClick={() => setDetailReason(d)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${
                      detailReason?.code === d.code
                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 font-medium'
                        : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}>
                    {d.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delivery proofs (for "chưa nhận được hàng") */}
          {detailReason?.shouldShowDeliveryProof && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">Ảnh giao hàng của shop</p>
              {deliveryProofs.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500 italic">Shop chưa cung cấp ảnh giao hàng.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {deliveryProofs.map((p) => (
                    <a key={p.proofId} href={p.imageUrl} target="_blank" rel="noreferrer"
                      className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 overflow-hidden hover:opacity-80 transition-opacity">
                      <img src={p.imageUrl} alt="" className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Images */}
          {detailReason?.requiresImage && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                Ảnh minh chứng <span className="text-red-500">*</span>
              </p>
              <div className="space-y-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={url} onChange={(e) => updateImageUrl(i, e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-300 transition" />
                    {imageUrls.length > 1 && (
                      <button type="button" onClick={() => removeImageField(i)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors text-sm">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {imageUrls.length < 5 && (
                  <button type="button" onClick={addImageField}
                    className="w-full py-2 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 text-sm text-gray-500 dark:text-slate-400 hover:border-orange-300 dark:hover:border-orange-500/50 hover:text-orange-500 transition-colors">
                    + Thêm ảnh
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {detailReason?.requiresDescription && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                Mô tả chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500}
                placeholder="Mô tả chi tiết tình trạng sản phẩm, vấn đề gặp phải..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none transition" />
              <p className="text-right text-xs text-gray-400">{description.length}/500</p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2.5">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1 pb-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
              Huỷ
            </button>
            <button type="submit" disabled={submitting || !detailReason}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── ORDER DETAIL PANEL ───────────────────────────────────────────────────────
const OrderDetailPanel = ({ order, onClose, onCancel, cancelling, onWarranty, onReturn }) => {
  const cfg = getStatusConfig(order.status);
  const canCancel = CANCELLABLE.includes(order.status);
  const canWarranty = order.status === "Hoàn tất";
  const canReview = REVIEWABLE.includes(order.status);
  const canReturn = RETURNABLE.includes(order.status);
  const returnInProgress = RETURN_IN_PROGRESS.includes(order.status);
  const { isClaimedOrderDetail } = useWarranty();
  const [expandedIds, setExpandedIds] = useState([]);
  const [orderReviews, setOrderReviews] = useState({});
  const [reviewTarget, setReviewTarget] = useState(null);

  const loadReviews = useCallback(() => {
    if (!canReview) return;
    const orderDetailIds = new Set(order.orderDetails?.map(d => d.orderDetailId) ?? []);
    reviewApi.getMyReviews(1, 100)
      .then((res) => {
        const map = {};
        (res.data.items ?? [])
          .filter(r => orderDetailIds.has(r.orderDetailId))
          .forEach((r) => { map[r.orderDetailId] = r; });
        setOrderReviews(map);
      })
      .catch(() => {});
  }, [order.orderId, order.orderDetails, canReview]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const toggleExpand = (id) =>
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] bg-white dark:bg-slate-900 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className={`flex items-start justify-between p-5 border-b border-gray-100 dark:border-slate-700 ${cfg.bg}`}>
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500 font-mono mb-1">#{order.orderId}</p>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Chi tiết đơn hàng</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{formatDate(order.orderDate)}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/70 dark:bg-slate-800/70 text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white transition-colors text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Receiver info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoBlock label="Người nhận" value={order.receiverName} icon="👤" />
            <InfoBlock label="Điện thoại" value={order.phoneNumber} icon="📞" />
            <InfoBlock
              label="Địa chỉ giao hàng"
              value={order.shippingAddress}
              icon="📍"
              className="sm:col-span-2"
            />
            {order.note && (
              <InfoBlock
                label="Ghi chú"
                value={order.note}
                icon="📝"
                className="sm:col-span-2"
              />
            )}
            {order.status === "Đã hủy" && order.cancelReason && (
              <div className="sm:col-span-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-semibold">Lý do hủy đơn</p>
                <p className="mt-1">{order.cancelReason}</p>
                {order.cancelledAt && (
                  <p className="mt-1 text-xs text-red-400">
                    {new Date(order.cancelledAt).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Products */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Sản phẩm 
            </h3>
            <div className="space-y-2">
              {order.orderDetails.map((od) => {
                const isClaimed = isClaimedOrderDetail(od.orderDetailId);
                const hasSerials = !od.isStringingService && od.serialNumbers?.length > 0;
                const isExpanded = expandedIds.includes(od.orderDetailId);

                return (
                  <div key={od.orderDetailId} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl overflow-hidden">
                    {/* ── Dòng sản phẩm ── */}
                    <div
                      className={`flex items-start gap-3 p-3 ${hasSerials ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" : ""}`}
                      onClick={() => hasSerials && toggleExpand(od.orderDetailId)}
                    >
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center text-xl shrink-0">
                        {od.isStringingService ? "🏸" : "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                          {od.productName || "Sản phẩm"}
                        </p>
                        {od.isStringingService && (
                          <p className="text-xs text-fuchsia-600 dark:text-fuchsia-400 mt-0.5">
                            Dịch vụ đan lưới · {od.stringBrand} · {od.tensionKg} kg
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                          SL: {od.quantity} × {formatCurrency(od.unitPrice)}
                        </p>
                        {hasSerials && (
                          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 font-medium">
                            {isExpanded ? "▲ Ẩn số seri" : `▼ Xem ${od.serialNumbers.length} số seri`}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white shrink-0">
                        {formatCurrency(od.quantity * od.unitPrice)}
                      </p>
                    </div>

                    {/* ── Panel seri (expand) ── */}
                    {hasSerials && isExpanded && (
                      <div className="border-t border-gray-200 dark:border-slate-700 px-3 pb-3 pt-2 space-y-3 bg-white dark:bg-slate-900">
                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Số seri sản phẩm
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {od.serialNumbers.map((sn, idx) => (
                            <div key={sn} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2">
                              <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">#{idx + 1}</span>
                              <span className="text-xs font-mono font-semibold text-gray-800 dark:text-slate-200 tracking-wider truncate">{sn}</span>
                            </div>
                          ))}
                        </div>

                        {/* Nút bảo hành - chỉ hiện khi đơn Hoàn tất */}
                        {canWarranty && (
                          isClaimed ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                              <span>✅</span> Đã gửi yêu cầu bảo hành
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); onWarranty(order, od, od.serialNumbers ?? []); }}
                              className="w-full py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                            >
                              🔧 Yêu cầu bảo hành
                            </button>
                          )
                        )}
                      </div>
                    )}

                    {/* Warranty cho đơn hoàn tất không có seri */}
                    {canWarranty && !od.isStringingService && !hasSerials && (
                      <div className="px-3 pb-3">
                        {isClaimed ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium px-1">
                            <span>✅</span> Đã gửi yêu cầu bảo hành
                          </div>
                        ) : (
                          <button
                            onClick={() => onWarranty(order, od, [])}
                            className="w-full py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                          >
                            🔧 Yêu cầu bảo hành
                          </button>
                        )}
                      </div>
                    )}

                    {/* Đánh giá sản phẩm */}
                    {canReview && !od.isStringingService && (
                      <div className="px-3 pb-3">
                        {orderReviews[od.orderDetailId] ? (
                          <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20 rounded-lg p-2.5 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <StarRating value={orderReviews[od.orderDetailId].rating} readonly />
                              <button
                                onClick={() => setReviewTarget({ orderDetail: od, existingReview: orderReviews[od.orderDetailId] })}
                                className="text-xs text-blue-500 dark:text-blue-400 hover:underline font-medium"
                              >
                                Sửa đánh giá
                              </button>
                            </div>
                            {orderReviews[od.orderDetailId].comment && (
                              <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-2">
                                {orderReviews[od.orderDetailId].comment}
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setReviewTarget({ orderDetail: od, existingReview: null })}
                            className="w-full py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-yellow-200 dark:border-yellow-500/30 text-xs font-semibold text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                          >
                            ⭐ Đánh giá sản phẩm
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment summary */}
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-3">
              Thanh toán
            </h3>
            <SummaryRow label="Phương thức" value={order.paymentMethod} />
            <SummaryRow label="Tạm tính" value={formatCurrency(order.subTotal)} />
            <SummaryRow label="Phí vận chuyển" value={formatCurrency(order.shippingFee)} />
            {order.totalDiscount > 0 && (
              <SummaryRow
                label="Giảm giá voucher"
                value={`− ${formatCurrency(order.totalDiscount)}`}
                discount
              />
            )}
            {order.appliedVouchers?.length > 0 && (
              <div className="pt-1 space-y-1">
                {order.appliedVouchers.map((v, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 rounded font-mono font-bold">{v.voucherCode}</span>
                    </span>
                    <span className="text-emerald-600 font-medium">− {formatCurrency(v.appliedDiscount)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-2 mt-2">
              <SummaryRow
                label="Tổng cộng"
                value={formatCurrency(order.finalAmount)}
                bold
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        {(canCancel || canReturn || returnInProgress) && (
          <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2">
            {canCancel && (
              <button
                onClick={() => onCancel(order.orderId)}
                disabled={cancelling}
                className="w-full py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? "Đang hủy..." : "Hủy đơn hàng"}
              </button>
            )}
            {canReturn && (
              <button
                onClick={() => onReturn(order)}
                className="w-full py-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 font-semibold text-sm hover:bg-orange-100 dark:hover:bg-orange-500/20 active:scale-[0.98] transition-all"
              >
                ↩ Yêu cầu trả hàng / hoàn tiền
              </button>
            )}
            {returnInProgress && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 text-sm text-orange-700 dark:text-orange-300 font-medium">
                <span>↩</span>
                <span>{order.status}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          orderDetail={reviewTarget.orderDetail}
          existingReview={reviewTarget.existingReview}
          onClose={() => setReviewTarget(null)}
          onSuccess={loadReviews}
        />
      )}
    </div>
  );
};

const InfoBlock = ({ label, value, icon, className = "" }) => (
  <div className={`bg-gray-50 dark:bg-slate-800 rounded-xl p-3 ${className}`}>
    <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">
      {icon} {label}
    </p>
    <p className="text-sm text-gray-800 dark:text-white font-medium">{value || "—"}</p>
  </div>
);

const SummaryRow = ({ label, value, bold = false, discount = false }) => (
  <div className="flex justify-between items-center">
    <span className={`text-sm ${bold ? "font-bold text-gray-800 dark:text-white" : "text-gray-500 dark:text-slate-400"}`}>{label}</span>
    <span className={`text-sm ${bold ? "font-bold text-gray-900 dark:text-white" : discount ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-gray-700 dark:text-slate-300"}`}>{value}</span>
  </div>
);

// ─── ORDER CARD ───────────────────────────────────────────────────────────────
const OrderCard = ({ order, onClick }) => {
  const itemCount = order.orderDetails?.length || 0;
  const firstProduct = order.orderDetails?.[0]?.productName || "Sản phẩm";

  return (
    <button
      onClick={() => onClick(order)}
      className="w-full text-left bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 active:scale-[0.99] transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">#{order.orderId}</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate mt-0.5">
            {firstProduct}
            {itemCount > 1 && (
              <span className="text-gray-400 dark:text-slate-500 font-normal"> +{itemCount - 1} sản phẩm</span>
            )}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
          <span>🕐</span>
          <span>{formatDate(order.orderDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900 dark:text-white">
            {formatCurrency(order.finalAmount)}
          </span>
          <span className="text-gray-300 dark:text-slate-600 group-hover:text-gray-500 dark:group-hover:text-slate-400 transition-colors text-lg">›</span>
        </div>
      </div>
    </button>
  );
};

// ─── FILTER TABS ──────────────────────────────────────────────────────────────
const FILTER_TABS = [
  { label: "Tất cả", value: "all" },
  { label: "⏳ Chờ xác nhận", value: "Chờ xác nhận" },
  { label: "✅ Đã xác nhận", value: "Đã xác nhận" },
  { label: "🏸 Đang đan lưới", value: "Đang đan lưới" },
  { label: "🚚 Đang giao", value: "Đang giao hàng" },
  { label: "🎉 Hoàn tất", value: "Hoàn tất" },
  { label: "✖ Đã hủy", value: "Đã hủy" },
];

// ─── SKELETON ─────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
    <div className="flex justify-between mb-3">
      <div className="space-y-1.5">
        <div className="h-3 w-16 bg-gray-100 rounded" />
        <div className="h-4 w-40 bg-gray-100 rounded" />
      </div>
      <div className="h-6 w-28 bg-gray-100 rounded-full" />
    </div>
    <div className="flex justify-between">
      <div className="h-3 w-32 bg-gray-100 rounded" />
      <div className="h-5 w-24 bg-gray-100 rounded" />
    </div>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [warrantyTarget, setWarrantyTarget] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);

  const { fetchMyWarranties } = useWarranty();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id || user?.userId || user?.Id;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderApi.getMyOrders();
      const data = response.data;
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setError("Không thể tải đơn hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchMyWarranties();
  }, [fetchOrders, fetchMyWarranties]);

  const handleCancel = async (orderId) => {
    setCancelling(true);
    try {
      await orderApi.cancelMyOrder(orderId);
      setCancelSuccess("Đơn hàng đã được hủy thành công.");
      setSelectedOrder(null);
      await fetchOrders();
      setTimeout(() => setCancelSuccess(null), 3000);
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể hủy đơn hàng.");
    } finally {
      setCancelling(false);
    }
  };
  // ── Filter + search ──
  const filtered = orders.filter((o) => {
    const matchStatus = activeFilter === "all" || o.status === activeFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      String(o.orderId).includes(q) ||
      o.receiverName?.toLowerCase().includes(q) ||
      o.orderDetails?.some((d) => d.productName?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  // ── Sort newest first ──
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
  );

  return (
    <div className="w-full h-full bg-gray-50/70 dark:bg-slate-950/50">
      {/* ── Inline styles for animations ── */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.28s cubic-bezier(.16,1,.3,1) both; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease both; }
      `}</style>

      <div className="max-w-full mx-auto px-4 py-8">
        {/* ── Page header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Đơn hàng của tôi</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {loading ? "Đang tải..." : `${orders.length} đơn hàng`}
          </p>
        </div>

        {/* ── Success toast ── */}
        {cancelSuccess && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl animate-fade-in">
            <span>✅</span> {cancelSuccess}
          </div>
        )}

        {/* ── Search ── */}
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Tìm theo mã, tên sản phẩm, người nhận..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-slate-600 transition"
          />
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeFilter === tab.value
                  ? "bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900 border-gray-900 dark:border-slate-100"
                  : "bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">😕</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={fetchOrders}
              className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition"
            >
              Thử lại
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-gray-800 font-semibold">Không có đơn hàng</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchQuery || activeFilter !== "all"
                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                : "Bạn chưa đặt đơn hàng nào"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {sorted.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                onClick={setSelectedOrder}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Detail modal ── */}
      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancel={handleCancel}
          cancelling={cancelling}
          onWarranty={(order, od, serial) => setWarrantyTarget({ order, orderDetail: od, serial })}
          onReturn={(o) => setReturnTarget(o)}
        />
      )}

      {/* ── Return request modal ── */}
      {returnTarget && (
        <ReturnRequestModal
          order={returnTarget}
          onClose={() => setReturnTarget(null)}
          onSuccess={() => {
            setReturnTarget(null);
            setSelectedOrder(null);
            fetchOrders();
          }}
        />
      )}

      {/* ── Warranty form modal ── */}
      {warrantyTarget && (
        <WarrantyFormModal
          order={warrantyTarget.order}
          orderDetail={warrantyTarget.orderDetail}
          serialNumbers={warrantyTarget.serial}
          userId={userId}
          onClose={() => setWarrantyTarget(null)}
          onSuccess={() => {
            fetchMyWarranties();
          }}
        />
      )}
    </div>
  );
};

export default MyOrders;
