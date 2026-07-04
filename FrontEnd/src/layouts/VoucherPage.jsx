import { useState, useEffect } from 'react';
import { Tag, Search, Copy, Check, LogIn, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useVoucher } from '../contexts/VoucherContext';
import { useAuth } from '../contexts/AuthContext';

const formatCurrency = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const formatDate = (d) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const getDaysLeft = (endDate) => {
  const diff = new Date(endDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ─── SaveButton ───────────────────────────────────────────────────────────────
const SaveButton = ({ voucherId }) => {
  const { saveVoucher, savedIds } = useVoucher();
  const [status, setStatus] = useState(savedIds.has(voucherId) ? 'saved' : 'idle');

  const handleSave = async () => {
    if (status !== 'idle') return;
    setStatus('saving');
    try {
      await saveVoucher(voucherId);
      setStatus('saved');
    } catch (e) {
      const msg = (e?.response?.data?.message ?? '').toLowerCase();
      if (msg.includes('đã lưu') || msg.includes('already') || msg.includes('exists')) {
        setStatus('saved');
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2000);
      }
    }
  };

  if (status === 'saved')
    return (
      <span className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
        <Check size={14} /> Đã lưu
      </span>
    );
  if (status === 'error')
    return (
      <span className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-500">Lỗi</span>
    );
  return (
    <button
      onClick={handleSave}
      disabled={status === 'saving'}
      className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 transition-all active:scale-95"
    >
      {status === 'saving' ? '...' : 'Lưu'}
    </button>
  );
};

// ─── CopyButton ───────────────────────────────────────────────────────────────
const CopyButton = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
        copied ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
      }`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Đã copy' : 'Copy'}
    </button>
  );
};

// ─── VoucherCard ─────────────────────────────────────────────────────────────
const VoucherCard = ({ voucher, isAuthenticated }) => {
  const daysLeft = getDaysLeft(voucher.endDate);
  const isExpiringSoon = daysLeft <= 3;
  const expired = daysLeft <= 0;

  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${expired ? 'opacity-60' : 'border-gray-100 dark:border-slate-800'}`}>
      <div className={`h-1.5 ${voucher.isGlobal ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 'bg-gradient-to-r from-orange-400 to-pink-500'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-1.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              voucher.isGlobal
                ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                : 'bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400'
            }`}>
              {voucher.isGlobal ? '🌐 Toàn sàn' : '🎁 Cá nhân'}
            </span>
            {isExpiringSoon && !expired && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/15 text-red-500 dark:text-red-400">
                ⚡ Sắp hết hạn
              </span>
            )}
            {expired && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">
                Hết hạn
              </span>
            )}
          </div>
          <span className={`text-xs font-bold shrink-0 ${
            expired ? 'text-gray-400 dark:text-slate-500' :
            isExpiringSoon ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {expired ? 'Đã hết hạn' : `Còn ${daysLeft} ngày`}
          </span>
        </div>

        <p className="text-2xl font-black text-gray-900 dark:text-white mb-1">
          {voucher.isPercent ? `Giảm ${voucher.discountValue}%` : `Giảm ${formatCurrency(voucher.discountValue)}`}
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
          <span className={isExpiringSoon && !expired ? 'text-red-500 dark:text-red-400 font-semibold' : ''}>
            HSD: {formatDate(voucher.endDate)}
          </span>
        </div>

        <div className="border-t border-dashed border-gray-200 dark:border-slate-700 mb-4" />

        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm font-mono font-bold tracking-widest bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-gray-800 dark:text-white truncate">
            {voucher.voucherCode}
          </code>
          <CopyButton code={voucher.voucherCode} />
          {isAuthenticated && !expired && !voucher.isGlobal && <SaveButton voucherId={voucher.voucherId} />}
        </div>

        {!isAuthenticated && !expired && (
          <Link
            to="/login"
            className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-semibold border border-dashed border-orange-300 dark:border-orange-500/40 text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
          >
            <LogIn size={14} /> Đăng nhập để lưu
          </Link>
        )}
      </div>
    </div>
  );
};

// ─── Skeleton ────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden animate-pulse">
    <div className="h-1.5 bg-gray-200 dark:bg-slate-700" />
    <div className="p-5 space-y-3">
      <div className="h-4 w-24 bg-gray-100 dark:bg-slate-800 rounded-full" />
      <div className="h-7 w-36 bg-gray-100 dark:bg-slate-800 rounded" />
      <div className="h-3 w-full bg-gray-100 dark:bg-slate-800 rounded" />
      <div className="h-10 bg-gray-100 dark:bg-slate-800 rounded-xl mt-4" />
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const VoucherPage = () => {
  const { allVouchers, loading, fetchAllVouchers } = useVoucher();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | global | personal | percent | fixed

  useEffect(() => {
    fetchAllVouchers();
  }, [fetchAllVouchers]);

  const filtered = allVouchers.filter((v) => {
    const matchSearch = search
      ? v.voucherCode.toLowerCase().includes(search.toLowerCase()) ||
        (v.description ?? '').toLowerCase().includes(search.toLowerCase())
      : true;
    const matchFilter =
      filter === 'all' ? true :
      filter === 'global' ? v.isGlobal :
      filter === 'personal' ? !v.isGlobal :
      filter === 'percent' ? v.isPercent :
      filter === 'fixed' ? !v.isPercent : true;
    return matchSearch && matchFilter;
  });

  const activeCount = allVouchers.filter(v => getDaysLeft(v.endDate) > 0).length;

  const FILTERS = [
    { label: 'Tất cả', value: 'all' },
    { label: '🌐 Toàn sàn', value: 'global' },
    { label: '🎁 Cá nhân', value: 'personal' },
    { label: '% Phần trăm', value: 'percent' },
    { label: '₫ Cố định', value: 'fixed' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-pink-600 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Ticket className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Khuyến mãi & Voucher</h1>
          </div>
          <p className="text-orange-100 text-base">
            Khám phá {activeCount} mã giảm giá đang hoạt động — lưu ngay trước khi hết hạn!
          </p>

          {/* Search bar */}
          <div className="mt-6 max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm mã voucher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-gray-800 placeholder:text-gray-400 text-sm font-medium outline-none shadow-lg focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filter chips */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                filter === f.value
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-500/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Not logged-in banner */}
        {!isAuthenticated && (
          <div className="mb-6 flex items-center gap-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-2xl px-5 py-4">
            <Tag className="w-5 h-5 text-orange-500 shrink-0" />
            <p className="text-sm text-orange-700 dark:text-orange-300 font-medium flex-1">
              Đăng nhập để lưu voucher vào tài khoản và dùng khi thanh toán
            </p>
            <Link
              to="/login"
              className="shrink-0 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors"
            >
              Đăng nhập
            </Link>
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
          {loading ? 'Đang tải...' : `${filtered.length} voucher${search ? ` cho "${search}"` : ''}`}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎟️</p>
            <p className="text-gray-800 dark:text-white font-semibold text-lg">
              {search ? `Không tìm thấy voucher cho "${search}"` : 'Chưa có voucher nào'}
            </p>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-2">
              {search ? 'Thử tìm kiếm với từ khóa khác' : 'Quay lại sau để xem ưu đãi mới nhé!'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-4 px-5 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((v) => (
              <VoucherCard key={v.voucherId} voucher={v} isAuthenticated={isAuthenticated} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoucherPage;
