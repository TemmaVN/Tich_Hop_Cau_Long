import React, { useState, useEffect, useCallback } from 'react';
import { Star, Eye, EyeOff, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { reviewApi } from '../../api';

const PAGE_SIZE = 10;

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
      />
    ))}
  </div>
);

const inputCls = "w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition";

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [togglingId, setTogglingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const INIT_FILTERS = {
    visibilityTab: 'all',
    rating: '',
    productId: '',
    userId: '',
    fromDate: '',
    toDate: '',
  };
  const [filters, setFilters] = useState(INIT_FILTERS);
  const [applied, setApplied] = useState(INIT_FILTERS);

  const buildParams = useCallback((f, p) => {
    const params = { page: p, pageSize: PAGE_SIZE };
    if (f.visibilityTab === 'visible') params.isVisible = true;
    else if (f.visibilityTab === 'hidden') params.isVisible = false;
    if (f.rating) params.rating = Number(f.rating);
    if (f.productId) params.productId = Number(f.productId);
    if (f.userId) params.userId = Number(f.userId);
    if (f.fromDate) params.fromDate = f.fromDate;
    if (f.toDate) params.toDate = f.toDate;
    return params;
  }, []);

  const loadReviews = useCallback(async (f = applied, p = page) => {
    setLoading(true);
    try {
      const res = await reviewApi.getForAdmin(buildParams(f, p));
      const data = res.data;
      setReviews(data.items ?? []);
      setTotalCount(data.totalCount ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [applied, page, buildParams]);

  useEffect(() => { loadReviews(applied, page); }, [page, applied]);

  const handleApply = () => {
    setApplied({ ...filters });
    setPage(1);
    setShowFilters(false);
  };

  const handleReset = () => {
    setFilters(INIT_FILTERS);
    setApplied(INIT_FILTERS);
    setPage(1);
  };

  const handleVisibilityTab = (tab) => {
    const next = { ...filters, visibilityTab: tab };
    setFilters(next);
    setApplied(next);
    setPage(1);
  };

  const handleToggleVisibility = async (review) => {
    setTogglingId(review.reviewId);
    try {
      await reviewApi.setVisibility(review.reviewId, !review.isVisible);
      setReviews(prev => prev.map(r =>
        r.reviewId === review.reviewId ? { ...r, isVisible: !r.isVisible } : r
      ));
    } catch {
      alert('Không thể thay đổi trạng thái hiển thị');
    } finally {
      setTogglingId(null);
    }
  };

  const fmtDate = (iso) => iso
    ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

  const hasActiveFilters = applied.rating || applied.productId || applied.userId || applied.fromDate || applied.toDate;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Quản lý đánh giá</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {loading ? 'Đang tải...' : `${totalCount} đánh giá trong hệ thống`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              hasActiveFilters
                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" /> Lọc nâng cao{hasActiveFilters ? ' ●' : ''}
          </button>
          <button
            onClick={() => loadReviews(applied, page)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Làm mới
          </button>
        </div>
      </div>

      {/* Advanced filter panel */}
      {showFilters && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Số sao</label>
              <select className={inputCls} value={filters.rating} onChange={e => setFilters(f => ({ ...f, rating: e.target.value }))}>
                <option value="">Tất cả</option>
                {[5, 4, 3, 2, 1].map(s => <option key={s} value={s}>{s} sao</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">ID Sản phẩm</label>
              <input type="number" className={inputCls} placeholder="Nhập product ID..." value={filters.productId}
                onChange={e => setFilters(f => ({ ...f, productId: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">ID Người dùng</label>
              <input type="number" className={inputCls} placeholder="Nhập user ID..." value={filters.userId}
                onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Từ ngày</label>
              <input type="date" className={inputCls} value={filters.fromDate}
                onChange={e => setFilters(f => ({ ...f, fromDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Đến ngày</label>
              <input type="date" className={inputCls} value={filters.toDate}
                onChange={e => setFilters(f => ({ ...f, toDate: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={handleReset} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Xóa bộ lọc
            </button>
            <button onClick={handleApply} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors">
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Visibility tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1 w-fit">
        {[
          { key: 'all',     label: 'Tất cả' },
          { key: 'visible', label: 'Hiển thị' },
          { key: 'hidden',  label: 'Ẩn' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => handleVisibilityTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              applied.visibilityTab === t.key
                ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Đang tải...
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Star className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Không có đánh giá nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sản phẩm</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Người dùng</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Đánh giá</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Nội dung</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Ngày</th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Hiển thị</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(review => (
                    <tr
                      key={review.reviewId}
                      className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-orange-50/30 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 max-w-44">
                          {review.productImageUrl && (
                            <img
                              src={review.productImageUrl}
                              alt=""
                              className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-100 dark:border-slate-700"
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-36">
                              {review.productName}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">ID: {review.productId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">{review.userName}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">ID: {review.userId}</p>
                      </td>
                      <td className="px-5 py-4">
                        <StarRating rating={review.rating} />
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{review.rating}/5</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate" title={review.comment}>
                          {review.comment || <span className="italic text-slate-400">Không có nội dung</span>}
                        </p>
                        {review.images?.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {review.images.slice(0, 3).map((img, i) => (
                              <img key={i} src={img} alt="" className="w-7 h-7 rounded object-cover border dark:border-slate-700" />
                            ))}
                            {review.images.length > 3 && (
                              <span className="text-xs text-slate-400 self-center">+{review.images.length - 3}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{fmtDate(review.reviewDate)}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleToggleVisibility(review)}
                          disabled={togglingId === review.reviewId}
                          title={review.isVisible ? 'Ẩn đánh giá' : 'Hiện đánh giá'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                            review.isVisible
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {review.isVisible
                            ? <><Eye className="w-3.5 h-3.5" /> Hiện</>
                            : <><EyeOff className="w-3.5 h-3.5" /> Ẩn</>
                          }
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Trang <span className="font-semibold">{page}</span> / {totalPages}
                  {' '}· {totalCount} đánh giá
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewManagement;
