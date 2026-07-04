import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, ChevronLeft, ChevronRight, Eye,
  CheckCircle, XCircle, DollarSign, Plus, X,
} from 'lucide-react';
import { returnApi } from '../../api';

const PAGE_SIZE = 10;

const STATUS_MAP = {
  'Chờ duyệt':     { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-300',   border: 'border-amber-200 dark:border-amber-500/30',   dot: 'bg-amber-400' },
  'Đã chấp thuận': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500' },
  'Đã từ chối':    { bg: 'bg-red-50 dark:bg-red-900/20',        text: 'text-red-700 dark:text-red-300',         border: 'border-red-200 dark:border-red-500/30',         dot: 'bg-red-400' },
  'Đã hoàn tiền':  { bg: 'bg-blue-50 dark:bg-blue-900/20',      text: 'text-blue-700 dark:text-blue-300',       border: 'border-blue-200 dark:border-blue-500/30',       dot: 'bg-blue-400' },
};

const STATUS_FILTER_TABS = [
  { key: '',               label: 'Tất cả' },
  { key: 'Chờ duyệt',     label: 'Chờ duyệt' },
  { key: 'Đã chấp thuận', label: 'Đã chấp thuận' },
  { key: 'Đã từ chối',    label: 'Đã từ chối' },
  { key: 'Đã hoàn tiền',  label: 'Đã hoàn tiền' },
];

const fmtVND = (v) =>
  v != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '—';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const StatusBadge = ({ status }) => {
  const cfg = STATUS_MAP[status] ?? { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const DetailModal = ({ request, onClose, onUpdate }) => {
  const [action, setAction]         = useState(null); // 'approve' | 'reject' | 'refund' | 'proof'
  const [adminNote, setAdminNote]   = useState('');
  const [refundAmount, setRefundAmount] = useState(request.orderFinalAmount ?? '');
  const [proofFile, setProofFile]   = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [proofNote, setProofNote]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  const isPending  = request.status === 'Chờ duyệt';
  const isApproved = request.status === 'Đã chấp thuận';

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (action === 'approve') {
        await returnApi.adminApprove(request.returnRequestId, {
          adminNote: adminNote.trim() || null,
          refundAmount: refundAmount ? Number(refundAmount) : null,
        });
      } else if (action === 'reject') {
        if (!adminNote.trim()) { setError('Vui lòng nhập lý do từ chối.'); setSubmitting(false); return; }
        await returnApi.adminReject(request.returnRequestId, { adminNote: adminNote.trim() });
      } else if (action === 'refund') {
        await returnApi.adminMarkRefunded(request.returnRequestId, {
          adminNote: adminNote.trim() || null,
          refundAmount: refundAmount ? Number(refundAmount) : null,
        });
      } else if (action === 'proof') {
        if (!proofFile) { setError('Vui lòng chọn ảnh minh chứng.'); setSubmitting(false); return; }
        await returnApi.addDeliveryProof(request.orderId, proofFile, proofNote.trim() || null);
      }
      onUpdate();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message ?? e.response?.data?.Message ?? 'Đã xảy ra lỗi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Yêu cầu #{request.returnRequestId} · Đơn #{request.orderId}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{fmtDate(request.requestedAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={request.status} />
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Customer info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Người nhận" value={request.receiverName} />
            <Info label="SĐT" value={request.phoneNumber} />
            <Info label="Giá trị đơn" value={fmtVND(request.orderFinalAmount)} />
            <Info label="Số tiền hoàn" value={fmtVND(request.refundAmount)} />
          </div>

          {/* Reason */}
          <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 space-y-1.5">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Lý do yêu cầu</p>
            <p className="text-sm font-medium text-slate-800 dark:text-white">{request.mainReasonName}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">→ {request.detailReasonName}</p>
            {request.customerDescription && (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-1">{request.customerDescription}</p>
            )}
          </div>

          {/* Admin note (if reviewed) */}
          {request.adminNote && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Ghi chú admin</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{request.adminNote}</p>
              {request.reviewedAt && (
                <p className="text-xs text-slate-400 mt-1">{fmtDate(request.reviewedAt)}</p>
              )}
            </div>
          )}

          {/* Customer images */}
          {request.images?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Ảnh minh chứng của khách</p>
              <div className="flex flex-wrap gap-2">
                {request.images.map((img) => (
                  <a key={img.imageId} href={img.imageUrl} target="_blank" rel="noreferrer"
                    className="w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden hover:opacity-80 transition-opacity">
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Delivery proofs */}
          {request.deliveryProofs?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Ảnh minh chứng giao hàng</p>
              <div className="flex flex-wrap gap-2">
                {request.deliveryProofs.map((p) => (
                  <div key={p.proofId} className="space-y-1">
                    <a href={p.imageUrl} target="_blank" rel="noreferrer"
                      className="block w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden hover:opacity-80 transition-opacity">
                      <img src={p.imageUrl} alt="" className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }} />
                    </a>
                    {p.note && <p className="text-xs text-slate-400 max-w-20 truncate">{p.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action area */}
          {!action && (
            <div className="flex flex-wrap gap-2 pt-2">
              {isPending && (
                <>
                  <button onClick={() => setAction('approve')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">
                    <CheckCircle className="w-4 h-4" /> Chấp thuận
                  </button>
                  <button onClick={() => setAction('reject')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                    <XCircle className="w-4 h-4" /> Từ chối
                  </button>
                </>
              )}
              {isApproved && (
                <button onClick={() => setAction('refund')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors">
                  <DollarSign className="w-4 h-4" /> Đánh dấu đã hoàn tiền
                </button>
              )}
              <button onClick={() => setAction('proof')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Plus className="w-4 h-4" /> Thêm ảnh giao hàng
              </button>
            </div>
          )}

          {/* Action forms */}
          {action && action !== 'proof' && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {action === 'approve' ? '✅ Chấp thuận yêu cầu' : action === 'reject' ? '❌ Từ chối yêu cầu' : '💰 Đánh dấu đã hoàn tiền'}
              </p>
              {(action === 'approve' || action === 'refund') && (
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Số tiền hoàn (để trống = toàn bộ đơn hàng)</label>
                  <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder={String(request.orderFinalAmount ?? '')}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Ghi chú admin {action === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3}
                  placeholder={action === 'reject' ? 'Lý do từ chối...' : 'Ghi chú (tuỳ chọn)...'}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
              {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setAction(null); setError(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Huỷ
                </button>
                <button onClick={submit} disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors">
                  {submitting ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          )}

          {action === 'proof' && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">📷 Thêm ảnh minh chứng giao hàng</p>
              {/* Vùng kéo thả */}
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Chọn ảnh <span className="text-red-500">*</span></label>
                <div
                  className={`mt-1 border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors
                    ${proofFile
                      ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/10'
                      : 'border-slate-300 dark:border-slate-600 hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-900/10'}`}
                  onClick={() => document.getElementById('return-proof-input').click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f?.type.startsWith('image/')) {
                      if (proofPreview) URL.revokeObjectURL(proofPreview);
                      setProofFile(f);
                      setProofPreview(URL.createObjectURL(f));
                    }
                  }}
                >
                  <input
                    id="return-proof-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files[0];
                      if (!f) return;
                      if (proofPreview) URL.revokeObjectURL(proofPreview);
                      setProofFile(f);
                      setProofPreview(URL.createObjectURL(f));
                    }}
                  />
                  {proofPreview ? (
                    <div className="flex items-center gap-3">
                      <img src={proofPreview} alt="preview" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{proofFile?.name}</p>
                        <p className="text-xs text-slate-400">{proofFile ? (proofFile.size / 1024).toFixed(0) + ' KB' : ''}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); URL.revokeObjectURL(proofPreview); setProofFile(null); setProofPreview(''); }}
                        className="text-slate-400 hover:text-red-500 p-1 flex-shrink-0 text-lg leading-none"
                      >×</button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                      Kéo ảnh vào đây hoặc <span className="text-orange-500 font-medium">chọn file</span>
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Ghi chú (tuỳ chọn)</label>
                <input type="text" value={proofNote} onChange={(e) => setProofNote(e.target.value)}
                  placeholder="Ảnh giao hàng ngày..."
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setAction(null); setError(null); setProofFile(null); if (proofPreview) { URL.revokeObjectURL(proofPreview); setProofPreview(''); } }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Huỷ
                </button>
                <button onClick={submit} disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors">
                  {submitting ? 'Đang lưu...' : 'Thêm ảnh'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
    <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-slate-800 dark:text-white">{value || '—'}</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ReturnRequestManagement = () => {
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected]     = useState(null);

  const load = useCallback(async (p = page, s = statusFilter) => {
    setLoading(true);
    try {
      const res = await returnApi.adminGetAll({ status: s || undefined, page: p, pageSize: PAGE_SIZE });
      const d = res.data;
      setRequests(d.items ?? []);
      setTotalCount(d.totalCount ?? 0);
      setTotalPages(d.totalPages ?? 1);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(page, statusFilter); }, [page, statusFilter, load]);

  const handleFilterChange = (s) => { setStatusFilter(s); setPage(1); };

  const handleUpdate = () => {
    setSelected(null);
    load(page, statusFilter);
  };

  const openDetail = async (req) => {
    try {
      const res = await returnApi.adminGetDetail(req.returnRequestId);
      setSelected(res.data);
    } catch {
      setSelected(req);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Trả hàng / Hoàn tiền</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {loading ? 'Đang tải...' : `${totalCount} yêu cầu trong hệ thống`}
          </p>
        </div>
        <button onClick={() => load(page, statusFilter)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1 w-fit flex-wrap">
        {STATUS_FILTER_TABS.map((t) => (
          <button key={t.key} onClick={() => handleFilterChange(t.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              statusFilter === t.key
                ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}>
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
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-sm">Không có yêu cầu nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {['#', 'Đơn hàng', 'Lý do', 'Trạng thái', 'Ngày yêu cầu', 'Số tiền', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.returnRequestId}
                      className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-orange-50/30 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">#{req.returnRequestId}</td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">#{req.orderId}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{req.mainReasonName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{req.detailReasonName}</p>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={req.status} /></td>
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(req.requestedAt)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-orange-500">{fmtVND(req.refundAmount ?? req.orderFinalAmount)}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => openDetail(req)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                          <Eye className="w-3.5 h-3.5" /> Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Trang <span className="font-semibold">{page}</span> / {totalPages} · {totalCount} yêu cầu
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <DetailModal request={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />
      )}
    </div>
  );
};

export default ReturnRequestManagement;
