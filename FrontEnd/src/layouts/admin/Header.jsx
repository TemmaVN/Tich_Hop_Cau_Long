import {
    User, LogOut, Filter, Menu, Plus, Search, Sun, Moon, Bell,
    Settings, ChevronDown, Package, RotateCcw, AlertTriangle,
    Tag, Star, RefreshCw
} from 'lucide-react'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useMediaQuery } from '../../mystate/useMediaQuery'
import { useTheme } from '../../contexts/ThemeContext'
import { orderApi, returnApi, adminManagementApi } from '../../api'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0)

const fmtTime = (dateStr) => {
    if (!dateStr) return ''
    try { return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }
    catch { return '' }
}

const fmtDate = (dateStr) => {
    if (!dateStr) return '—'
    try { return new Date(dateStr).toLocaleDateString('vi-VN') }
    catch { return '—' }
}

const safeArray = (v) => (Array.isArray(v) ? v : [])

const renderStars = (rating) => {
    const n = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)))
    return '★'.repeat(n) + '☆'.repeat(5 - n)
}

// ─── Small reusable pieces ────────────────────────────────────────────────────
const SectionHeader = ({ icon, label, count }) => (
    <div className='px-4 py-2 bg-slate-50 dark:bg-slate-800/50'>
        <span className='text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5'>
            {icon} {label} ({count})
        </span>
    </div>
)

const NotifRow = ({ icon, iconBg, title, sub, time, onClick }) => (
    <button
        type='button'
        onClick={onClick}
        className='w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left border-b border-slate-100 dark:border-slate-800 last:border-0'
    >
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
            {icon}
        </div>
        <div className='flex-1 min-w-0'>
            <p className='text-xs font-semibold text-slate-800 dark:text-white truncate'>{title}</p>
            <div className='text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate'>{sub}</div>
        </div>
        {time && <span className='text-[10px] text-slate-400 dark:text-slate-500 shrink-0 mt-0.5'>{time}</span>}
    </button>
)

const MoreBtn = ({ count, unit, onClick }) => (
    <button
        type='button'
        onClick={onClick}
        className='w-full py-2 text-xs text-orange-500 hover:text-orange-600 font-semibold text-center hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-colors border-b border-slate-100 dark:border-slate-800'
    >
        Xem thêm {count} {unit} →
    </button>
)

const EmptyState = ({ text }) => (
    <div className='flex flex-col items-center justify-center py-12 text-slate-400 gap-2'>
        <Bell className='w-8 h-8 opacity-20' />
        <p className='text-sm'>{text}</p>
    </div>
)

// ─── Tab: Hôm nay ─────────────────────────────────────────────────────────────
const TodayTab = ({ orders, returns, onNavigate }) => {
    const [showAllOrders, setShowAllOrders] = useState(false)
    const [showAllReturns, setShowAllReturns] = useState(false)

    const safeOrders  = safeArray(orders)
    const safeReturns = safeArray(returns)

    if (safeOrders.length === 0 && safeReturns.length === 0) {
        return <EmptyState text='Chưa có hoạt động nào hôm nay' />
    }

    const displayedOrders  = showAllOrders  ? safeOrders  : safeOrders.slice(0, 5)
    const displayedReturns = showAllReturns ? safeReturns : safeReturns.slice(0, 3)

    return (
        <div>
            {safeOrders.length > 0 && (
                <>
                    <SectionHeader
                        icon={<Package className='w-3 h-3' />}
                        label='Đơn hàng mới'
                        count={safeOrders.length}
                    />
                    {displayedOrders.map((o, i) => (
                        <NotifRow
                            key={o.orderId ?? i}
                            icon={<Package className='w-4 h-4 text-blue-500' />}
                            iconBg='bg-blue-50 dark:bg-blue-500/10'
                            title={`#${o.orderId} · ${o.receiverName || 'Khách hàng'}`}
                            sub={
                                <span>
                                    {fmt(o.finalAmount)}
                                    {o.status && typeof o.status === 'string' && (
                                        <span className='ml-2 px-1.5 py-0.5 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded text-[10px] font-medium'>
                                            {o.status}
                                        </span>
                                    )}
                                </span>
                            }
                            time={fmtTime(o.orderDate)}
                            onClick={() => onNavigate('/admin/orders')}
                        />
                    ))}
                    {!showAllOrders && safeOrders.length > 5 && (
                        <MoreBtn
                            count={safeOrders.length - 5}
                            unit='đơn hàng'
                            onClick={() => setShowAllOrders(true)}
                        />
                    )}
                </>
            )}

            {safeReturns.length > 0 && (
                <>
                    <SectionHeader
                        icon={<RotateCcw className='w-3 h-3' />}
                        label='Yêu cầu trả hàng'
                        count={safeReturns.length}
                    />
                    {displayedReturns.map((r, i) => (
                        <NotifRow
                            key={r.returnRequestId ?? i}
                            icon={<RotateCcw className='w-4 h-4 text-orange-500' />}
                            iconBg='bg-orange-50 dark:bg-orange-500/10'
                            title={`Yêu cầu #${r.returnRequestId}`}
                            sub={r.mainReason || r.detailReason || 'Xem chi tiết'}
                            time={fmtTime(r.requestedAt)}
                            onClick={() => onNavigate('/admin/returns')}
                        />
                    ))}
                    {!showAllReturns && safeReturns.length > 3 && (
                        <MoreBtn
                            count={safeReturns.length - 3}
                            unit='yêu cầu'
                            onClick={() => setShowAllReturns(true)}
                        />
                    )}
                </>
            )}
        </div>
    )
}

// ─── Tab: Cảnh báo ────────────────────────────────────────────────────────────
const AlertsTab = ({ lowStock, expVouchers, lowRatings, onNavigate }) => {
    const [showAllStock,    setShowAllStock]    = useState(false)
    const [showAllVouchers, setShowAllVouchers] = useState(false)
    const [showAllRatings,  setShowAllRatings]  = useState(false)

    const safeStock    = safeArray(lowStock)
    const safeVouchers = safeArray(expVouchers)
    const safeRatings  = safeArray(lowRatings)

    if (safeStock.length === 0 && safeVouchers.length === 0 && safeRatings.length === 0) {
        return <EmptyState text='Không có cảnh báo nào' />
    }

    const displayedStock    = showAllStock    ? safeStock    : safeStock.slice(0, 5)
    const displayedVouchers = showAllVouchers ? safeVouchers : safeVouchers.slice(0, 3)
    const displayedRatings  = showAllRatings  ? safeRatings  : safeRatings.slice(0, 3)

    return (
        <div>
            {/* Tồn kho thấp */}
            {safeStock.length > 0 && (
                <>
                    <SectionHeader
                        icon={<AlertTriangle className='w-3 h-3 text-amber-500' />}
                        label='Tồn kho thấp'
                        count={safeStock.length}
                    />
                    {displayedStock.map((item, i) => (
                        <NotifRow
                            key={i}
                            icon={<AlertTriangle className='w-4 h-4 text-amber-500' />}
                            iconBg='bg-amber-50 dark:bg-amber-500/10'
                            title={
                                item.productName
                                ?? item.ProductName
                                ?? item.variantInfo
                                ?? item.VariantInfo
                                ?? 'Sản phẩm'
                            }
                            sub={
                                <span className='text-amber-600 dark:text-amber-400 font-medium'>
                                    Còn {item.stockQuantity ?? item.StockQuantity ?? item.inStockCount ?? item.InStockCount ?? 0} trong kho
                                </span>
                            }
                            onClick={() => onNavigate('/admin/inventory')}
                        />
                    ))}
                    {!showAllStock && safeStock.length > 5 && (
                        <MoreBtn
                            count={safeStock.length - 5}
                            unit='sản phẩm'
                            onClick={() => setShowAllStock(true)}
                        />
                    )}
                </>
            )}

            {/* Voucher sắp hết hạn */}
            {safeVouchers.length > 0 && (
                <>
                    <SectionHeader
                        icon={<Tag className='w-3 h-3 text-rose-500' />}
                        label='Voucher sắp hết hạn'
                        count={safeVouchers.length}
                    />
                    {displayedVouchers.map((v, i) => {
                        const code    = v.voucherCode ?? v.VoucherCode ?? v.code ?? v.Code ?? '—'
                        const endDate = v.endDate ?? v.EndDate ?? v.expiryDate ?? v.ExpiryDate ?? null
                        return (
                            <NotifRow
                                key={i}
                                icon={<Tag className='w-4 h-4 text-rose-500' />}
                                iconBg='bg-rose-50 dark:bg-rose-500/10'
                                title={<span className='font-mono'>{code}</span>}
                                sub={
                                    <span className='text-rose-500 dark:text-rose-400'>
                                        Hết hạn: {fmtDate(endDate)}
                                    </span>
                                }
                                onClick={() => onNavigate('/admin/vouchers')}
                            />
                        )
                    })}
                    {!showAllVouchers && safeVouchers.length > 3 && (
                        <MoreBtn
                            count={safeVouchers.length - 3}
                            unit='voucher'
                            onClick={() => setShowAllVouchers(true)}
                        />
                    )}
                </>
            )}

            {/* Đánh giá thấp */}
            {safeRatings.length > 0 && (
                <>
                    <SectionHeader
                        icon={<Star className='w-3 h-3 text-rose-400' />}
                        label='Đánh giá thấp'
                        count={safeRatings.length}
                    />
                    {displayedRatings.map((r, i) => {
                        const rating  = r.rating ?? r.Rating ?? r.score ?? r.Score ?? 0
                        const name    = r.productName ?? r.ProductName ?? 'Sản phẩm'
                        const comment = r.comment ?? r.Comment ?? ''
                        return (
                            <NotifRow
                                key={i}
                                icon={<Star className='w-4 h-4 text-rose-400' />}
                                iconBg='bg-rose-50 dark:bg-rose-500/10'
                                title={name}
                                sub={
                                    <span className='text-rose-500 font-medium'>
                                        {renderStars(rating)}
                                        {comment && (
                                            <span className='ml-1 text-slate-400 font-normal'>
                                                · {String(comment).slice(0, 35)}…
                                            </span>
                                        )}
                                    </span>
                                }
                                onClick={() => onNavigate('/admin/reviews')}
                            />
                        )
                    })}
                    {!showAllRatings && safeRatings.length > 3 && (
                        <MoreBtn
                            count={safeRatings.length - 3}
                            unit='đánh giá'
                            onClick={() => setShowAllRatings(true)}
                        />
                    )}
                </>
            )}
        </div>
    )
}

// ─── Notification Dropdown ────────────────────────────────────────────────────
class NotifErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false } }
    static getDerivedStateFromError() { return { hasError: true } }
    render() {
        if (this.state.hasError) {
            return (
                <div className='flex flex-col items-center justify-center py-10 text-slate-400 gap-2 px-4 text-center'>
                    <AlertTriangle className='w-6 h-6 text-amber-400' />
                    <p className='text-xs'>Không tải được thông báo. Thử làm mới.</p>
                </div>
            )
        }
        return this.props.children
    }
}

const NotifDropdown = ({ onNavigate }) => {
    const [tab, setTab]               = useState('today')
    const [loading, setLoading]       = useState(false)
    const [ordersToday, setOrdersToday]   = useState([])
    const [returnsToday, setReturnsToday] = useState([])
    const [alertData, setAlertData]   = useState(null)
    const [lastUpdated, setLastUpdated]   = useState(null)
    const [fetchError, setFetchError] = useState(false)

    const todayStr = new Date().toISOString().split('T')[0]

    const fetchAll = useCallback(async () => {
        setLoading(true)
        setFetchError(false)
        try {
            const [ordRes, retRes, altRes] = await Promise.allSettled([
                orderApi.adminSearch({ fromDate: todayStr, toDate: todayStr, page: 1, pageSize: 20 }),
                returnApi.adminGetAll({ fromDate: todayStr, toDate: todayStr, page: 1, pageSize: 10 }),
                adminManagementApi.getAlertSummary({ lowStockThreshold: 5, voucherExpiringDays: 7 }),
            ])

            if (ordRes.status === 'fulfilled') {
                const d = ordRes.value.data?.data ?? ordRes.value.data ?? {}
                setOrdersToday(safeArray(Array.isArray(d) ? d : (d.items ?? d.orders ?? [])))
            }
            if (retRes.status === 'fulfilled') {
                const d = retRes.value.data
                setReturnsToday(safeArray(Array.isArray(d) ? d : (d.items ?? d.data ?? [])))
            }
            if (altRes.status === 'fulfilled') {
                const raw = altRes.value.data
                setAlertData(raw?.data ?? raw ?? null)
            }
            setLastUpdated(new Date())
        } catch {
            setFetchError(true)
        } finally {
            setLoading(false)
        }
    }, [todayStr])

    useEffect(() => { fetchAll() }, [fetchAll])

    const lowStock    = safeArray(alertData?.lowStockVariants  ?? alertData?.LowStockVariants)
    const expVouchers = safeArray(alertData?.expiringVouchers  ?? alertData?.ExpiringVouchers)
    const lowRatings  = safeArray(alertData?.lowRatingReviews  ?? alertData?.LowRatingReviews)

    const todayCount = ordersToday.length + returnsToday.length
    const alertCount = lowStock.length + expVouchers.length + lowRatings.length

    return (
        <div className='absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50'>

            {/* Header */}
            <div className='flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800'>
                <div className='flex items-center gap-2'>
                    <Bell className='w-4 h-4 text-orange-500' />
                    <span className='font-bold text-sm text-slate-800 dark:text-white'>Thông báo</span>
                </div>
                <button
                    type='button'
                    onClick={fetchAll}
                    disabled={loading}
                    title='Làm mới'
                    className='p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40'
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Tabs */}
            <div className='flex border-b border-slate-100 dark:border-slate-800'>
                {[
                    { key: 'today',  label: 'Hôm nay',  count: todayCount, countCls: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' },
                    { key: 'alerts', label: 'Cảnh báo', count: alertCount, countCls: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' },
                ].map(({ key, label, count, countCls }) => (
                    <button
                        type='button'
                        key={key}
                        onClick={() => setTab(key)}
                        className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                            tab === key
                                ? 'text-orange-500 border-b-2 border-orange-500'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        {label}
                        {count > 0 && (
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${countCls}`}>
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Body */}
            <div className='max-h-[400px] overflow-y-auto'>
                {loading ? (
                    <div className='flex flex-col items-center justify-center py-12 text-slate-400 gap-2'>
                        <RefreshCw className='w-5 h-5 animate-spin' />
                        <span className='text-sm'>Đang tải...</span>
                    </div>
                ) : fetchError ? (
                    <div className='flex flex-col items-center justify-center py-10 text-slate-400 gap-2 text-center px-4'>
                        <AlertTriangle className='w-6 h-6 text-amber-400' />
                        <p className='text-xs'>Lỗi khi tải dữ liệu</p>
                        <button type='button' onClick={fetchAll} className='text-xs text-orange-500 hover:underline'>Thử lại</button>
                    </div>
                ) : (
                    <NotifErrorBoundary key={tab}>
                        {tab === 'today' ? (
                            <TodayTab
                                orders={ordersToday}
                                returns={returnsToday}
                                onNavigate={onNavigate}
                            />
                        ) : (
                            <AlertsTab
                                lowStock={lowStock}
                                expVouchers={expVouchers}
                                lowRatings={lowRatings}
                                onNavigate={onNavigate}
                            />
                        )}
                    </NotifErrorBoundary>
                )}
            </div>

            {/* Footer */}
            {lastUpdated && (
                <div className='px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between'>
                    <span className='text-[10px] text-slate-400 dark:text-slate-500'>
                        Cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                        type='button'
                        onClick={() => onNavigate(tab === 'today' ? '/admin/orders' : '/admin/inventory')}
                        className='text-[11px] text-orange-500 hover:text-orange-600 font-semibold transition-colors'
                    >
                        Xem tất cả →
                    </button>
                </div>
            )}
        </div>
    )
}

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({ onToggleSidebar }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [notifOpen, setNotifOpen]         = useState(false)
    const { isDark, toggleTheme }           = useTheme()
    const dropdownRef = useRef(null)
    const notifRef    = useRef(null)
    const { logout }  = useAuth()
    const navigate    = useNavigate()
    const user        = JSON.parse(localStorage.getItem('user'))
    const fullName    = user?.fullName ?? ''
    const isMedium    = useMediaQuery('(min-width: 1280px)')

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsProfileOpen(false)
            if (notifRef.current    && !notifRef.current.contains(e.target))    setNotifOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async (e) => {
        e.preventDefault()
        const result = await logout()
        if (result.success) {
            alert('Đăng xuất thành công')
            navigate('/')
        } else {
            alert(result.message)
        }
    }

    const handleNotifNav = (path) => {
        setNotifOpen(false)
        navigate(path)
    }

    return (
        <div className='bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4 z-50'>
            <div className='flex items-center justify-between'>

                {/* Left */}
                <div className='flex items-center space-x-4'>
                    <button
                        type='button'
                        className='p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
                        onClick={onToggleSidebar}
                    >
                        <Menu className='w-5 h-5' />
                    </button>
                    <div className='hidden md:block text-slate-800 dark:text-white'>
                        <h1 className='text-2xl font-black'>Tổng quan</h1>
                        <p>Chào mừng trở lại, Quản trị viên!</p>
                    </div>
                </div>

                {/* Center search */}
                {isMedium && (
                    <div className='flex-1 max-w-md mx-8'>
                        <div className='relative'>
                            <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
                            <input
                                type='text'
                                placeholder='Tìm kiếm...'
                                className='w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                            />
                            <button type='button' className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'>
                                <Filter />
                            </button>
                        </div>
                    </div>
                )}

                {/* Right */}
                <div className='flex items-center space-x-3'>
                    <button type='button' className='hidden lg:flex items-center space-x-2 py-2 px-4 bg-linear-to-r from-orange-default to-orange-dark text-white rounded-xl hover:shadow transition-all'>
                        <Plus className='w-4 h-4' />
                        <span className='text-sm font-medium'>Tạo mới</span>
                    </button>

                    <button
                        type='button'
                        onClick={toggleTheme}
                        className='p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
                        title={isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
                    >
                        {isDark ? <Sun className='w-5 h-5' /> : <Moon className='w-5 h-5' />}
                    </button>

                    {/* Bell — notification dropdown */}
                    <div className='relative' ref={notifRef}>
                        <button
                            type='button'
                            onClick={() => setNotifOpen(v => !v)}
                            className='relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
                        >
                            <Bell className='w-5 h-5' />
                        </button>
                        {notifOpen && <NotifDropdown onNavigate={handleNotifNav} />}
                    </div>

                    <button type='button' className='p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'>
                        <Settings className='w-5 h-5' />
                    </button>

                    {/* Profile dropdown */}
                    <div className='relative' ref={dropdownRef}>
                        <button
                            type='button'
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className='flex items-center space-x-3 pl-3 border-l border-slate-200 dark:border-slate-800/50 hover:opacity-80 transition-all'
                        >
                            <img src='https://i.pravatar.cc/300' alt='Ảnh đại diện' className='w-8 h-8 rounded-full ring-2 ring-orange-default' />
                            <div className='hidden md:block text-left'>
                                <p className='text-sm font-medium text-slate-800 dark:text-white leading-tight'>{fullName}</p>
                                <p className='text-[10px] text-slate-500 dark:text-slate-400'>Quản trị viên</p>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isProfileOpen && (
                            <div className='absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2'>
                                <button type='button' className='w-full flex items-center space-x-3 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors'>
                                    <User className='w-4 h-4 text-orange-default' />
                                    <span>Thông tin tài khoản</span>
                                </button>
                                <div className='border-t border-slate-100 dark:border-slate-800 my-1' />
                                <button
                                    type='button'
                                    onClick={handleLogout}
                                    className='w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors'
                                >
                                    <LogOut className='w-4 h-4' />
                                    <span className='font-medium'>Đăng xuất</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Header
