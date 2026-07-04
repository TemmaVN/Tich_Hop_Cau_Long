import React, { useState, useEffect } from 'react';
import { useWarranty } from '../../contexts/WarrantyContext';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  'Chờ xử lý':   { color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/15',   border: 'border-amber-200 dark:border-amber-500/30',   dot: 'bg-amber-400',   icon: '⏳' },
  'Đang xử lý':  { color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/15',    border: 'border-blue-200 dark:border-blue-500/30',    dot: 'bg-blue-400',    icon: '🔄' },
  'Đã xử lý':    { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/15', border: 'border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500', icon: '✅' },
  'Từ chối':      { color: 'text-red-500 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-500/15',     border: 'border-red-200 dark:border-red-500/30',     dot: 'bg-red-400',     icon: '✖' },
};

const STATUS_FLOW = ['Chờ xử lý', 'Đang xử lý', 'Đã xử lý', 'Từ chối'];

const FILTER_TABS = [
  { label: 'Tất cả', value: 'all' },
  ...STATUS_FLOW.map((s) => ({ label: `${STATUS_CFG[s].icon} ${s}`, value: s })),
];

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });


// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || { color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400', icon: '•' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.icon} {status}
    </span>
  );
};

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────
const DetailPanel = ({ claim, onClose, onUpdateStatus }) => {
  const [newStatus, setNewStatus]   = useState(claim.status);
  const [adminNote, setAdminNote]   = useState(claim.adminNote || '');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  const { updateStatus } = useWarranty();

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStatus(claim.warrantyId, newStatus, adminNote);
      onUpdateStatus(claim.warrantyId, newStatus, adminNote);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] bg-white dark:bg-slate-900 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500 font-mono mb-1">BH-{claim.warrantyId}</p>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Chi tiết yêu cầu bảo hành</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{formatDate(claim.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={claim.status} />
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-300 hover:text-gray-800 dark:hover:text-white transition-colors text-lg">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Product info */}
          <Section title="Thông tin sản phẩm">
            <InfoGrid>
              <InfoItem label="Sản phẩm"    value={claim.productName} />
              <InfoItem label="Số seri"     value={<span className="font-mono tracking-wider">{claim.serialNumber}</span>} />
              <InfoItem label="Đơn hàng"    value={`#${claim.orderId}`} />
              <InfoItem label="Khách hàng"  value={claim.customerName} />
            </InfoGrid>
          </Section>

          {/* Claim info */}
          <Section title="Nội dung yêu cầu">
            <InfoGrid>
              <InfoItem label="Lý do" value={claim.reasonLabel} full />
              {claim.description && <InfoItem label="Mô tả" value={claim.description} full />}
              <InfoItem label="Ảnh đính kèm"
                value={claim.images?.length > 0 ? `${claim.images.length} ảnh` : 'Không có'} />
              <InfoItem label="Video"
                value={claim.videoName || 'Không có'} />
            </InfoGrid>

            {/* Thumbnails */}
            {claim.images?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {claim.images.map((src, i) => (
                  <img key={i} src={src} alt={`Ảnh ${i + 1}`}
                    className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                ))}
              </div>
            )}
          </Section>

          {/* Admin action */}
          <Section title="Xử lý yêu cầu">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-slate-400 mb-1.5 block">Cập nhật trạng thái</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FLOW.map((s) => {
                    const cfg = STATUS_CFG[s];
                    return (
                      <button key={s} onClick={() => setNewStatus(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                          ${newStatus === s ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-1 ring-offset-1 ${cfg.border}` : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'}`}>
                        {cfg.icon} {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-slate-400 mb-1.5 block">Ghi chú nội bộ</label>
                <textarea
                  value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                  rows={3} placeholder="Ghi chú cho nhóm xử lý hoặc phản hồi khách hàng..."
                  className="w-full text-sm border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-gray-800 dark:text-white bg-white dark:bg-slate-800 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>

              <button onClick={handleSave} disabled={saving || (newStatus === claim.status && adminNote === claim.adminNote)}
                className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-orange-500 text-white text-sm font-semibold hover:bg-gray-700 dark:hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {saving ? 'Đang lưu...' : saved ? '✅ Đã lưu' : 'Lưu thay đổi'}
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div>
    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">{title}</p>
    {children}
  </div>
);

const InfoGrid = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{children}</div>
);

const InfoItem = ({ label, value, full = false }) => (
  <div className={`bg-gray-50 dark:bg-slate-800 rounded-xl p-3 ${full ? 'sm:col-span-2' : ''}`}>
    <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">{label}</p>
    <p className="text-sm font-medium text-gray-800 dark:text-white">{value || '—'}</p>
  </div>
);

// ─── ROW ──────────────────────────────────────────────────────────────────────
const ClaimRow = ({ claim, onClick }) => (
  <tr onClick={() => onClick(claim)}
    className="hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border-b border-gray-100 dark:border-slate-700 last:border-0">
    <td className="px-4 py-3">
      <p className="text-xs font-mono text-gray-400 dark:text-slate-500">BH-{claim.warrantyId}</p>
    </td>
    <td className="px-4 py-3">
      <p className="text-sm font-medium text-gray-800 dark:text-white truncate max-w-45">{claim.productName}</p>
      <p className="text-xs font-mono text-gray-400 dark:text-slate-500">{claim.serialNumber}</p>
    </td>
    <td className="px-4 py-3 hidden sm:table-cell">
      <p className="text-sm text-gray-700 dark:text-slate-300">{claim.customerName}</p>
    </td>
    <td className="px-4 py-3 hidden md:table-cell">
      <p className="text-xs text-gray-500 dark:text-slate-400">{claim.reasonLabel}</p>
    </td>
    <td className="px-4 py-3">
      <StatusBadge status={claim.status} />
    </td>
    <td className="px-4 py-3 hidden lg:table-cell text-right">
      <p className="text-xs text-gray-400 dark:text-slate-500">{formatDate(claim.createdAt)}</p>
    </td>
    <td className="px-4 py-3 text-right">
      <span className="text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 text-lg">›</span>
    </td>
  </tr>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const WarrantyManagement = () => {
  const { claims, fetchAll } = useWarranty();
  const [activeFilter, setFilter]   = useState('all');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleUpdateStatus = (warrantyId, status, adminNote) => {
    setSelected((prev) => prev?.warrantyId === warrantyId ? { ...prev, status, adminNote } : prev);
  };

  const filtered = claims
    .filter((c) => activeFilter === 'all' || c.status === activeFilter)
    .filter((c) => {
      const q = search.toLowerCase();
      return !q ||
        c.productName?.toLowerCase().includes(q) ||
        c.customerName?.toLowerCase().includes(q) ||
        c.serialNumber?.toLowerCase().includes(q) ||
        String(c.orderId).includes(q);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const counts = STATUS_FLOW.reduce((acc, s) => {
    acc[s] = claims.filter((c) => c.status === s).length;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Quản lý bảo hành</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{claims.length} yêu cầu tổng cộng</p>
        </div>

        {/* Stats chips */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FLOW.map((s) => {
            const cfg = STATUS_CFG[s];
            return counts[s] > 0 ? (
              <span key={s} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                {cfg.icon} {s}: {counts[s]}
              </span>
            ) : null;
          })}
        </div>
      </div>

      {/* Filter + Search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button key={tab.value} onClick={() => setFilter(tab.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                ${activeFilter === tab.value
                  ? 'bg-gray-900 dark:bg-orange-500 text-white border-gray-900 dark:border-orange-500'
                  : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative sm:ml-auto sm:w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm seri, khách, sản phẩm..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400 transition" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">🛡️</p>
            <p className="text-gray-500 dark:text-slate-400 font-medium">Không có yêu cầu bảo hành nào</p>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Mã BH</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Sản phẩm / Seri</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Lý do</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Ngày tạo</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <ClaimRow key={c.warrantyId} claim={c} onClick={setSelected} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          claim={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};

export default WarrantyManagement;
