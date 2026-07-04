import React, { useState, useEffect } from 'react';
import {
  Search, Users, Phone, Mail, MapPin, Calendar,
  Eye, X, User, Home, ShoppingBag, AlertCircle,
  Plus, Loader2, Lock, Unlock, Package, Shield,
} from 'lucide-react';
import { userApi } from '../../api';

// ─── Helpers ─────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  'from-orange-400 to-orange-600',
  'from-blue-400 to-blue-600',
  'from-emerald-400 to-emerald-600',
  'from-purple-400 to-purple-600',
  'from-rose-400 to-rose-600',
  'from-amber-400 to-amber-600',
  'from-teal-400 to-teal-600',
  'from-indigo-400 to-indigo-600',
];

const avatarColor = (name) => {
  if (!name) return AVATAR_GRADIENTS[0];
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
};

const initials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN');
  } catch {
    return '—';
  }
};

const profileComplete = (c) => !!(c.phoneNumber && c.city && c.detailedAddress);

// ─── Info Row (used in detail panel) ─────────────────────────────────
function InfoRow({ icon: IconComp, label, value, mono = false }) {
  const Icon = IconComp;
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-sm text-slate-800 dark:text-white mt-0.5 wrap-break-word ${mono ? 'font-mono' : 'font-medium'}`}>
          {value || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}
        </p>
      </div>
    </div>
  );
}

const fmtCurrency = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const ORDER_STATUS_COLOR = {
  'Chờ xác nhận': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Đã xác nhận':  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Đang xử lý':   'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'Đang giao hàng': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  'Đã giao hàng': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Hoàn tất':     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Đã hủy':       'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// ─── Detail Side Panel ────────────────────────────────────────────────
function CustomerDetailPanel({ customer, onClose }) {
  const [detail, setDetail] = useState(null);
  const [orders, setOrders] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState('info');

  useEffect(() => {
    if (!customer) return;
    const uid = customer.userId ?? customer.id;
    setDetailLoading(true);
    Promise.all([
      userApi.getAdminDetail(uid).catch(() => null),
      userApi.getAdminOrderHistory(uid).catch(() => null),
    ]).then(([detailRes, ordersRes]) => {
      if (detailRes?.data) setDetail(detailRes.data);
      const list = Array.isArray(ordersRes?.data) ? ordersRes.data : [];
      setOrders(list);
    }).finally(() => setDetailLoading(false));
  }, [customer]);

  if (!customer) return null;
  const c = detail ?? customer;
  const complete = profileComplete(c);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Chi tiết khách hàng</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-linear-to-br ${avatarColor(c.fullName)}
              flex items-center justify-center text-white text-xl font-black shadow-lg shrink-0`}
            >
              {initials(c.fullName)}
            </div>
            <div className="min-w-0">
              <h4 className="text-xl font-black text-slate-800 dark:text-white truncate">
                {c.fullName || '—'}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{c.email}</p>
              <div className="mt-1.5 flex gap-1.5 flex-wrap">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  complete
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {complete ? 'Đầy đủ thông tin' : 'Thiếu thông tin'}
                </span>
                {orders.length > 0 && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {orders.length} đơn hàng
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex border-b border-slate-200/50 dark:border-slate-700/50">
          {[
            { key: 'info',   label: 'Thông tin', icon: User },
            { key: 'orders', label: `Đơn hàng (${orders.length})`, icon: ShoppingBag },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6">
          {detailLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
            </div>
          ) : tab === 'info' ? (
            <div className="space-y-7">
              <section>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                  Thông tin liên hệ
                </p>
                <div className="space-y-3">
                  <InfoRow icon={Mail}     label="Email"         value={c.email} />
                  <InfoRow icon={Phone}    label="Số điện thoại" value={c.phoneNumber} mono />
                  <InfoRow icon={Calendar} label="Ngày sinh"     value={fmtDate(c.dateOfBirth)} />
                </div>
              </section>
              <section>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                  Địa chỉ
                </p>
                <div className="space-y-3">
                  <InfoRow icon={MapPin} label="Tỉnh / Thành phố" value={c.city} />
                  <InfoRow icon={MapPin} label="Quận / Huyện"     value={c.district} />
                  <InfoRow icon={Home}   label="Địa chỉ chi tiết" value={c.detailedAddress} />
                </div>
              </section>
              {!complete && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200/60 dark:border-amber-700/30">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Khách hàng chưa cập nhật đầy đủ thông tin cá nhân.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Package className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">Chưa có đơn hàng nào</p>
                </div>
              ) : orders.map(order => (
                <div key={order.orderId}
                  className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">#{order.orderId}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ORDER_STATUS_COLOR[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{fmtDate(order.orderDate)}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{fmtCurrency(order.finalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────
const getRoleNames = (user) => {
  // Handle: roles: ['Admin'], roles: [{name:'Admin'}], role: 'Admin', userRoles: [{role:{name:'Admin'}}]
  const normalise = (r) => {
    if (!r) return '';
    if (typeof r === 'string') return r;
    return (r.name ?? r.roleName ?? r.value ?? r.role?.name ?? r.role?.roleName ?? '');
  };
  if (Array.isArray(user.roles))     return user.roles.map(normalise).filter(Boolean);
  if (user.roles)                    return [normalise(user.roles)].filter(Boolean);
  if (Array.isArray(user.userRoles)) return user.userRoles.map(normalise).filter(Boolean);
  if (user.role)                     return [normalise(user.role)].filter(Boolean);
  return [];
};

const hasRole = (user, role) =>
  getRoleNames(user).some(r => r.toLowerCase() === role.toLowerCase());

// ─── Admin User Table ─────────────────────────────────────────────────
function AdminTable({ admins, loading, onToggleActive, onSelect }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-default border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Đang tải danh sách...</p>
        </div>
      </div>
    );
  }
  if (!admins.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Shield className="w-12 h-12 text-slate-300 dark:text-slate-700" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Không có quản trị viên nào</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/60">
            <th className="text-left px-5 py-3.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Quản trị viên
            </th>
            <th className="text-left px-5 py-3.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">
              Số điện thoại
            </th>
            <th className="text-left px-5 py-3.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">
              Ngày sinh
            </th>
            <th className="text-center px-5 py-3.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Vai trò
            </th>
            <th className="text-center px-5 py-3.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Trạng thái
            </th>
            <th className="text-center px-5 py-3.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Chi tiết
            </th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin, i) => {
            const uid = admin.userId ?? admin.id ?? i;
            return (
              <tr
                key={uid}
                onClick={() => onSelect(admin)}
                className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-orange-50/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${avatarColor(admin.fullName)} flex items-center justify-center text-white text-sm font-black shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                      {initials(admin.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white truncate max-w-40">
                        {admin.fullName || <span className="italic text-slate-400">Chưa có tên</span>}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-40">{admin.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 hidden sm:table-cell">
                  {admin.phoneNumber ? (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">{admin.phoneNumber}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Chưa cập nhật</span>
                  )}
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <span className="text-slate-600 dark:text-slate-400 text-xs">{fmtDate(admin.dateOfBirth)}</span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleActive(e, admin); }}
                    title={admin.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      admin.isActive
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                        : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                    }`}
                  >
                    {admin.isActive ? <><Lock className="w-3.5 h-3.5" /> Khóa</> : <><Unlock className="w-3.5 h-3.5" /> Mở khóa</>}
                  </button>
                </td>
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(admin); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Xem
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
const PAGE_SIZE = 12;

const UserList = () => {
  const [allUsers,  setAllUsers]    = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [error,     setError]       = useState('');
  const [searchVal, setSearchVal]   = useState('');
  const [keyword,   setKeyword]     = useState('');
  const [selected,  setSelected]    = useState(null);
  const [page,      setPage]        = useState(1);
  const [roleTab,   setRoleTab]     = useState('customer'); // 'customer' | 'admin'

  const EMPTY_USER = { email: '', password: '', fullName: '', phoneNumber: '', dateOfBirth: '', roles: ['Customer'] };
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm,      setCreateForm]      = useState(EMPTY_USER);
  const [createLoading,   setCreateLoading]   = useState(false);
  const [createError,     setCreateError]     = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = keyword
          ? await userApi.search(keyword)
          : await userApi.getAll(1, 1000);
        if (!cancelled) {
          const list = Array.isArray(res.data)
            ? res.data
            : res.data?.data ?? [];
          setAllUsers(list);
          setPage(1);
        }
      } catch {
        if (!cancelled) setError('Không thể tải danh sách khách hàng. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [keyword]);

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(searchVal.trim());
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password) {
      setCreateError('Email và mật khẩu không được để trống');
      return;
    }
    if (createForm.password.length < 6) {
      setCreateError('Mật khẩu phải ít nhất 6 ký tự');
      return;
    }
    setCreateLoading(true);
    setCreateError('');
    try {
      await userApi.create(createForm);
      setShowCreateModal(false);
      setCreateForm(EMPTY_USER);
      setKeyword(keyword);
    } catch (err) {
      setCreateError(err.response?.data?.message ?? 'Không thể tạo tài khoản');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async (e, customer) => {
    e.stopPropagation();
    const uid = customer.userId ?? customer.id;
    const newActive = !customer.isActive;
    try {
      await userApi.setActive(uid, newActive);
      setAllUsers(prev => prev.map(c =>
        (c.userId ?? c.id) === uid ? { ...c, isActive: newActive } : c
      ));
    } catch {
      alert('Không thể thay đổi trạng thái tài khoản');
    }
  };

  // Derived — split by role
  const admins    = allUsers.filter(u => hasRole(u, 'Admin'));
  const customers = allUsers.filter(u => !hasRole(u, 'Admin'));
  const activeList = roleTab === 'admin' ? admins : customers;

  const total       = activeList.length;
  const withPhone   = activeList.filter((c) => c.phoneNumber).length;
  const withAddress = activeList.filter((c) => c.city).length;
  const complete    = customers.filter(profileComplete).length; // only meaningful for customers
  const totalPages  = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginated   = activeList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = roleTab === 'admin'
    ? [
        { label: "Tổng quản trị viên", value: admins.length,    color: "text-orange-500",  bg: "bg-orange-50 dark:bg-orange-900/20",  icon: Shield },
        { label: "Có số điện thoại",   value: withPhone,        color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20",icon: Phone },
        { label: "Đang hoạt động",     value: admins.filter(a => a.isActive).length, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", icon: Users },
        { label: "Tổng khách hàng",    value: customers.length, color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-900/20",  icon: User },
      ]
    : [
        { label: "Tổng khách hàng",   value: customers.length, color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20",      icon: Users },
        { label: "Có số điện thoại",  value: withPhone,        color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20",icon: Phone },
        { label: "Có địa chỉ",        value: withAddress,      color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-900/20",  icon: MapPin },
        { label: "Đầy đủ thông tin",  value: complete,         color: "text-orange-500",  bg: "bg-orange-50 dark:bg-orange-900/20",  icon: User },
      ];

  // Pagination page numbers (show up to 5 pages around current)
  const pageNums = (() => {
    const half = 2;
    let start = Math.max(1, page - half);
    let end   = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Quản lý người dùng</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {loading ? 'Đang tải...' : `${allUsers.length} tài khoản trong hệ thống`}
          </p>
        </div>
        {/* Role tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'customer', label: 'Khách hàng', icon: Users,  count: customers.length },
            { id: 'admin',    label: 'Quản trị viên', icon: Shield, count: admins.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setRoleTab(tab.id); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                roleTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                roleTab === tab.id
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {loading ? '—' : tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5
            border border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-black ${s.color}`}>
              {loading ? <span className="text-slate-300 dark:text-slate-700">—</span> : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-700/50">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={roleTab === 'admin' ? "Tìm quản trị viên theo tên, email..." : "Tìm theo tên, email, số điện thoại..."}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border
                border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white
                placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400
                focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-default text-white rounded-xl text-sm font-semibold
              hover:bg-orange-500 transition-colors shadow shadow-orange-default/20 shrink-0"
            >
              Tìm kiếm
            </button>
            {keyword && (
              <button
                type="button"
                onClick={() => { setSearchVal(''); setKeyword(''); }}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300
                border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50
                dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                Xóa lọc
              </button>
            )}
            <button
              type="button"
              onClick={() => { setCreateForm(EMPTY_USER); setCreateError(''); setShowCreateModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors shadow shadow-emerald-500/20 shrink-0"
            >
              <Plus className="w-4 h-4" /> Tạo tài khoản
            </button>
          </form>
          {keyword && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Kết quả cho: <span className="font-semibold text-orange-500">"{keyword}"</span> — {total} {roleTab === 'admin' ? 'quản trị viên' : 'khách hàng'}
            </p>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-orange-default border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Đang tải danh sách...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => setKeyword(keyword)}
              className="text-sm text-blue-500 hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : activeList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            {roleTab === 'admin'
              ? <Shield className="w-12 h-12 text-slate-300 dark:text-slate-700" />
              : <Users className="w-12 h-12 text-slate-300 dark:text-slate-700" />
            }
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {roleTab === 'admin' ? 'Không tìm thấy quản trị viên' : 'Không tìm thấy khách hàng'}
            </p>
            {keyword && <p className="text-sm text-slate-400">Thử tìm kiếm với từ khóa khác</p>}
          </div>
        ) : roleTab === 'admin' ? (
          <AdminTable
            admins={paginated}
            loading={false}
            onToggleActive={handleToggleActive}
            onSelect={setSelected}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/60">
                  <th className="text-left px-5 py-3.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Khách hàng
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">
                    Số điện thoại
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">
                    Địa chỉ
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">
                    Ngày sinh
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">
                    Vai trò
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Hồ sơ
                  </th>
                  <th className="text-center px-5 py-3.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Trạng thái
                  </th>
                  <th className="text-center px-5 py-3.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((customer, i) => {
                  const uid = customer.userId ?? customer.id ?? i;
                  const isComplete = profileComplete(customer);
                  return (
                    <tr
                      key={uid}
                      onClick={() => setSelected(customer)}
                      className="border-b border-slate-100 dark:border-slate-800/80
                      hover:bg-orange-50/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      {/* Name + Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl bg-linear-to-br ${avatarColor(customer.fullName)}
                            flex items-center justify-center text-white text-sm font-black shrink-0
                            shadow-sm group-hover:scale-105 transition-transform duration-200`}
                          >
                            {initials(customer.fullName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-white truncate max-w-40">
                              {customer.fullName || <span className="italic text-slate-400">Chưa có tên</span>}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-40">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4 hidden sm:table-cell">
                        {customer.phoneNumber ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                              {customer.phoneNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Chưa cập nhật</span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="px-5 py-4 hidden lg:table-cell">
                        {customer.city ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-slate-600 dark:text-slate-400 truncate max-w-37.5">
                              {[customer.district, customer.city].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Chưa cập nhật</span>
                        )}
                      </td>

                      {/* DOB */}
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-slate-600 dark:text-slate-400 text-xs">
                          {fmtDate(customer.dateOfBirth)}
                        </span>
                      </td>

                      {/* Role badge */}
                      <td className="px-5 py-4 hidden sm:table-cell">
                        {(() => {
                          const roleNames = getRoleNames(customer);
                          if (roleNames.length === 0) return <span className="text-slate-400 italic text-xs">—</span>;
                          return roleNames.map((r, idx) => (
                            <span key={idx} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mr-1 ${
                              r.toLowerCase() === 'admin'
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {r.toLowerCase() === 'admin' ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                              {r}
                            </span>
                          ));
                        })()}
                      </td>

                      {/* Profile completeness */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                          ${isComplete
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {isComplete ? 'Đầy đủ' : 'Thiếu'}
                        </span>
                      </td>

                      {/* Lock/Unlock */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={(e) => handleToggleActive(e, customer)}
                          title={customer.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            customer.isActive
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                          }`}
                        >
                          {customer.isActive
                            ? <><Lock className="w-3.5 h-3.5" /> Khóa</>
                            : <><Unlock className="w-3.5 h-3.5" /> Mở khóa</>
                          }
                        </button>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelected(customer); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                          bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400
                          hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400
                          transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > PAGE_SIZE && (
          <div className="px-5 py-4 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hiển thị{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}
              </span>{' '}
              / {total} {roleTab === 'admin' ? 'quản trị viên' : 'khách hàng'}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300
                border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:pointer-events-none
                hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                ←
              </button>
              {pageNums.map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors
                  ${p === page
                    ? 'bg-orange-default text-white shadow shadow-orange-default/25'
                    : 'text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300
                border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:pointer-events-none
                hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <CustomerDetailPanel customer={selected} onClose={() => setSelected(null)} />
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Tạo tài khoản mới</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Tạo tài khoản cho khách hàng hoặc admin</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {createError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {createError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Email <span className="text-rose-500">*</span></label>
                  <input type="email" required placeholder="example@email.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Mật khẩu <span className="text-rose-500">*</span></label>
                  <input type="password" required placeholder="Ít nhất 6 ký tự"
                    value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Họ và tên</label>
                  <input type="text" placeholder="Nguyễn Văn A"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Số điện thoại</label>
                  <input type="text" placeholder="0901234567"
                    value={createForm.phoneNumber}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Ngày sinh</label>
                  <input type="date"
                    value={createForm.dateOfBirth}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Vai trò</label>
                  <select
                    value={createForm.roles[0] ?? 'Customer'}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, roles: [e.target.value] }))}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  >
                    <option value="Customer">Khách hàng</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors"
                >
                  Huỷ bỏ
                </button>
                <button type="submit" disabled={createLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                >
                  {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
