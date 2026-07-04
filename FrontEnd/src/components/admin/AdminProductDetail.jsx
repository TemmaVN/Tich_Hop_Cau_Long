import React, { useState, useEffect, useMemo  } from 'react';
import { Plus, Pencil, Hash, ArrowLeft, Loader2, AlertCircle, Trash2, X, ChevronDown, ChevronRight, Info, Search, Check, Upload, Download } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { productApi, metaDataApi } from '../../api';

const STATUS = {
    'InStock': { label: 'Còn hàng',  cls: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/30', dot: 'bg-emerald-500' },
    'Sold': { label: 'Đã bán',    cls: 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700',                   dot: 'bg-gray-400 dark:bg-slate-500'    },
    'Defective': { label: 'Lỗi/Hỏng', cls: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-500/30',                 dot: 'bg-rose-500'    },
    'Reserved': { label: 'Đã đặt',   cls: 'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-500/30',      dot: 'bg-orange-500'  },
};

const SERIAL_TABS = [
    { key: 'all', label: 'Tất cả'   },
    { key: 'InStock',   label: 'Còn hàng' },
    { key: 'Sold',   label: 'Đã bán'   },
    { key: 'Defective',   label: 'Lỗi/Hỏng'},
    { key: 'Reserved',   label: 'Đã đặt'  },
];

// Backend nhận Status dạng string
const STATUS_STRING = { 0: 'InStock', 1: 'Sold', 2: 'Defective', 3: 'Reserved' };
const STATUS_COUNT_KEY = { 0: 'inStockCount', 1: 'soldCount', 2: 'defectiveCount', 3: 'reservedCount' };

const FORM_FIELDS = [
    { label: 'Hạng trọng lượng', metaKey: 'weightClassess', formKey: 'weightClass'  },
    { label: 'Cỡ cán / Size',    metaKey: 'gripSizes',      formKey: 'gripSize'     },
    { label: 'Điểm cân bằng',    metaKey: 'balancePoints',  formKey: 'balancePoint' },
    { label: 'Độ cứng',          metaKey: 'stiffness',      formKey: 'stiffness'    },
];

const EMPTY_FORM = {
    weightClass: '', gripSize: '', balancePoint: '', stiffness: '',
    maxTension: '', price: '', stockQuantity: 10,
};

const AdminProductDetail = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const product = location.state?.product ?? null;

    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [metaData, setMetaData] = useState(null);
    const [metaLoading, setMetaLoading] = useState(true);

    // Add variant modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newVariantForm, setNewVariantForm] = useState(EMPTY_FORM);
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState(null);

    // Inline serial expansion
    const [expandedId, setExpandedId] = useState(null);
    const [serialsMap, setSerialsMap] = useState({});
    const [serialsLoadingId, setSerialsLoadingId] = useState(null);

    // Add serial inline: { detailId, value, loading, error } | null
    const [addSerialState, setAddSerialState] = useState(null);

    const [deleteLoading, setDeleteLoading] = useState(false);

    // Edit variant modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);
    const [editVariantForm, setEditVariantForm] = useState(EMPTY_FORM);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState(null);

    // Import/Export Excel for variants
    const [excelLoading, setExcelLoading] = useState(false);

    const handleImportExcel = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setExcelLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await productApi.importVariantsExcel(productId, formData);
            await loadVariants();
            alert('Import Excel thành công!');
        } catch (err) {
            alert(err.response?.data?.message ?? 'Import thất bại');
        } finally {
            setExcelLoading(false);
            e.target.value = '';
        }
    };

    const handleExportExcel = async () => {
        setExcelLoading(true);
        try {
            const res = await productApi.exportVariantsExcel(productId);
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `variants_product_${productId}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            alert('Export thất bại');
        } finally {
            setExcelLoading(false);
        }
    };

    // Serial management modal (# SNs badge click)
    const [serialModal, setSerialModal] = useState({ open: false, variant: null });
    const [serialTab, setSerialTab] = useState('all');
    const [serialSearch, setSerialSearch] = useState('');
    const [addSerialModal, setAddSerialModal] = useState(null);

    const loadVariants = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const res = await productApi.getVariants(productId, { page: 1, pagesize: 100 });
            const items = res.data?.items ?? [];
            setVariants(items);
        } catch (error) {
            const status = error?.response?.status;
            if (status === 404) {
                setLoadError('Chưa có biến thể cho sản phẩm này');
            } else {
                setLoadError('Không thể tải danh sách biến thể');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (productId) loadVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    useEffect(() => {
        const load = async () => {
            setMetaLoading(true);
            try {
                const res = await metaDataApi.get();
                setMetaData(res.data?.data ?? res.data ?? null);
            } catch { /* ignore */ } finally {
                setMetaLoading(false);
            }
        };
        load();
    }, []);

    const ensureSerials = async (detailId) => {
        if (serialsMap[detailId] !== undefined) return;
        setSerialsLoadingId(detailId);
        try {
            const res = await productApi.getSerials(detailId, { page: 1, pageSize: 200 });
            setSerialsMap((prev) => ({ ...prev, [detailId]: res.data?.data ?? null }));
        } catch {
            setSerialsMap((prev) => ({ ...prev, [detailId]: null }));
        } finally {
            setSerialsLoadingId(null);
        }
    };

    const toggleExpand = async (detailId) => {
        if (expandedId === detailId) {
            setExpandedId(null);
            setAddSerialState(null);
            return;
        }
        setExpandedId(detailId);
        setAddSerialState(null);
        await ensureSerials(detailId);
    };

    const openSerialModal = async (variant, e) => {
        e.stopPropagation();
        setSerialTab('all');
        setSerialSearch('');
        setAddSerialModal(null);
        setSerialModal({ open: true, variant });
        await ensureSerials(variant.detailId);
    };

    const closeSerialModal = () => {
        setSerialModal({ open: false, variant: null });
        setAddSerialModal(null);
    };

    const handleAddVariant = async () => {
        if (!newVariantForm.price || Number(newVariantForm.price) <= 0) {
            setAddError('Vui lòng nhập giá hợp lệ!');
            return;
        }
        setAddLoading(true);
        setAddError(null);
        try {
            const payload = {
                weightClass:   newVariantForm.weightClass   || null,
                gripSize:      newVariantForm.gripSize      || null,
                balancePoint:  newVariantForm.balancePoint  || null,
                stiffness:     newVariantForm.stiffness     || null,
                maxTension:    newVariantForm.maxTension !== '' ? parseInt(newVariantForm.maxTension) : null,
                price:         parseFloat(newVariantForm.price),
                stockQuantity: parseInt(newVariantForm.stockQuantity) || 1,
            };
            await productApi.addVariant(productId, payload);
            setShowAddModal(false);
            await loadVariants();
        } catch (err) {
            setAddError(err.response?.data?.message ?? 'Không thể thêm biến thể');
        } finally {
            setAddLoading(false);
        }
    };

    const handleAddSerialModal = async () => {
        const sn = addSerialModal?.value?.trim();
        const detailId = serialModal.variant?.detailId;
        if (!sn || !detailId) {
            setAddSerialModal((prev) => ({ ...prev, error: 'Nhập số serial!' }));
            return;
        }
        setAddSerialModal((prev) => ({ ...prev, loading: true, error: null }));
        const statusInt = addSerialModal.status ?? 0;
        const importDate = addSerialModal.importDate || new Date().toISOString().split('T')[0];
        try {
            await productApi.addSerial(detailId, { serialNumber: sn, status: STATUS_STRING[statusInt] ?? 'InStock', importDate });
            const newEntry = { serialNumber: sn, status: statusInt, importDate: new Date(importDate).toISOString() };
            const countKey = STATUS_COUNT_KEY[statusInt] ?? 'inStockCount';
            setSerialsMap((prev) => {
                const cur = prev[detailId];
                if (!cur) {
                    return { ...prev, [detailId]: { totalCount: 1, inStockCount: 0, soldCount: 0, defectiveCount: 0, reservedCount: 0, [countKey]: 1, serials: [newEntry] } };
                }
                return { ...prev, [detailId]: { ...cur, totalCount: (cur.totalCount ?? 0) + 1, [countKey]: (cur[countKey] ?? 0) + 1, serials: [...(cur.serials ?? []), newEntry] } };
            });
            setVariants((prev) => prev.map((v) => v.detailId === detailId ? { ...v, totalSerialNumbers: (v.totalSerialNumbers ?? 0) + 1 } : v));
            setAddSerialModal(null);
        } catch (err) {
            setAddSerialModal((prev) => ({ ...prev, loading: false, error: err.response?.data?.message ?? 'Không thể thêm serial' }));
        }
    };

    const handleDeleteVariant = async (detailId, e) => {
        e.stopPropagation();
        if (!window.confirm('Xóa biến thể này? Toàn bộ serial số liên quan sẽ bị xóa.')) return;
        setDeleteLoading(true);
        try {
            await productApi.deleteVariant(detailId);
            setVariants((prev) => prev.filter((v) => v.detailId !== detailId));
            if (expandedId === detailId) setExpandedId(null);
        } catch (err) {
            alert(err.response?.data?.message ?? 'Không thể xóa biến thể');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleEditVariant = async () => {
        if (!editVariantForm.price || Number(editVariantForm.price) <= 0) {
            setEditError('Vui lòng nhập giá hợp lệ!');
            return;
        }
        setEditLoading(true);
        setEditError(null);
        try {
            const payload = {
                weightClass:   editVariantForm.weightClass   || null,
                gripSize:      editVariantForm.gripSize      || null,
                balancePoint:  editVariantForm.balancePoint  || null,
                stiffness:     editVariantForm.stiffness     || null,
                maxTension:    editVariantForm.maxTension !== '' ? parseInt(editVariantForm.maxTension) : null,
                price:         parseFloat(editVariantForm.price),
                stockQuantity: parseInt(editVariantForm.stockQuantity) || 1,
            };
            await productApi.updateVariant(editingVariant.detailId, payload);
            const data = await productApi.getSerials(editingVariant.detailId, { page: 1, pageSize: 200 });
            setSerialsMap((prev) => ({ ...prev, [editingVariant.detailId]: data.data?.data ?? null }));
            setShowEditModal(false);
            await loadVariants();
            await ensureSerials(editingVariant.detailId);
        } catch (err) {
            setEditError(err.response?.data?.message ?? 'Không thể cập nhật biến thể');
        } finally {
            setEditLoading(false);
        }
    };

    const handleAddSerial = async (detailId) => {
        const sn = addSerialState?.value?.trim();
        if (!sn) {
            setAddSerialState((prev) => ({ ...prev, error: 'Nhập số serial!' }));
            return;
        }
        setAddSerialState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            await productApi.addSerial(detailId, { serialNumber: sn });
            const newEntry = { serialNumber: sn, status: 0, importDate: new Date().toISOString() };
            setSerialsMap((prev) => {
                const cur = prev[detailId];
                if (!cur) return { ...prev, [detailId]: { totalCount: 1, inStockCount: 1, soldCount: 0, defectiveCount: 0, reservedCount: 0, serials: [newEntry] } };
                return { ...prev, [detailId]: { ...cur, totalCount: (cur.totalCount ?? 0) + 1, inStockCount: (cur.inStockCount ?? 0) + 1, serials: [...(cur.serials ?? []), newEntry] } };
            });
            setVariants((prev) => prev.map((v) => v.detailId === detailId ? { ...v, totalSerialNumbers: (v.totalSerialNumbers ?? 0) + 1 } : v));
            setAddSerialState((prev) => ({ ...prev, value: '', loading: false }));
        } catch (err) {
            setAddSerialState((prev) => ({ ...prev, loading: false, error: err.response?.data?.message ?? 'Không thể thêm serial' }));
        }
    };

    const formatPrice = (price) =>
        price != null ? price.toLocaleString('vi-VN') + ' ₫' : '—';

    const stockColor = (qty) => {
        const q = qty ?? 0;
        if (q <= 0) return 'text-rose-500 font-bold';
        if (q <= 5) return 'text-amber-500 font-bold';
        return 'text-emerald-500 font-bold';
    };

    const totalSerials = variants.reduce((sum, v) => sum + (v.totalSerialNumbers ?? 0), 0);
    const computedTotalStock = variants.reduce((sum, v) => sum + (v.stockQuantity ?? 0), 0);

    const modalSerials = useMemo(
        () => serialModal.variant ? (serialsMap[serialModal.variant.detailId]?.serials ?? []) : [],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [serialModal.variant?.detailId, serialsMap]
    );
    const modalSerialsData = serialModal.variant ? serialsMap[serialModal.variant.detailId] : null;
    const isModalLoadingSerials = serialModal.variant ? serialsLoadingId === serialModal.variant.detailId : false;

    const filteredModalSerials = useMemo(() => {
        let list = modalSerials;
        if (serialTab !== 'all') {
            list = list.filter((s) => s.status === serialTab);
        }
        if (serialSearch.trim()) {
            const q = serialSearch.trim().toLowerCase();
            list = list.filter((s) => s.serialNumber?.toLowerCase().includes(q));
        }
        return list;
    }, [modalSerials, serialTab, serialSearch]);

    const tabCount = (key) => {
        if (key === 'all') return modalSerials.length;
        return modalSerials.filter((s) => s.status === key).length;
    };

    const formatDate = (iso) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('vi-VN');
    };
    console.log(variants)
    console.log(serialsMap)
    return (
        <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 hover:text-orange-500 transition-colors">
                    <ArrowLeft size={14} /> Danh sách sản phẩm
                </button>
                <span>›</span>
                <span className="font-medium text-slate-800 dark:text-white">{product?.productName ?? `Sản phẩm #${productId}`}</span>
            </div>

            {/* Product Header */}
            {product && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/50 mb-6 flex gap-5">
                    <div className="w-32 h-32 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-slate-700/50">
                        {product.mainImageUrl ? (
                            <img src={product.mainImageUrl} alt={product.productName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">🏸</div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{product.productName}</h1>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            {product.brandName && (
                                <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold border border-emerald-100 dark:border-emerald-500/30">{product.brandName}</span>
                            )}
                            {product.categoryName && (
                                <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-full text-xs font-semibold border border-blue-100 dark:border-blue-500/30">{product.categoryName}</span>
                            )}
                            {product.slug && <span className="text-xs text-gray-400 dark:text-slate-500 font-mono">/{product.slug}</span>}
                        </div>
                        {product.description && <p className="text-sm text-gray-500 dark:text-slate-400 mb-3 line-clamp-2">{product.description}</p>}
                        <div className="flex flex-wrap gap-6 pt-3 border-t border-gray-100 dark:border-slate-700">
                            {[
                                { label: 'Giá gốc',     value: formatPrice(product.basePrice),    cls: 'text-gray-800 dark:text-white'    },
                                { label: 'Giá KM',      value: product.discountPrice ? formatPrice(product.discountPrice) : '—', cls: 'text-emerald-500' },
                                { label: 'Đã bán',      value: product.soldQuantity ?? 0,                    cls: 'text-gray-800 dark:text-white'    },
                                { label: 'Tồn kho',     value: loading ? '…' : computedTotalStock,           cls: 'text-emerald-500' },
                                { label: 'Tổng serial', value: loading ? '…' : totalSerials,                 cls: 'text-blue-500'    },
                            ].map(({ label, value, cls }) => (
                                <div key={label}>
                                    <span className="text-gray-400 dark:text-slate-500 text-xs block mb-0.5">{label}</span>
                                    <span className={`font-bold text-sm ${cls}`}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Variants Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 overflow-hidden">

                {/* Section header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-700 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 dark:text-white">Biến thể / Detail</span>
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-full text-xs font-medium">
                            {loading ? '…' : variants.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <label className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm ${excelLoading ? 'opacity-50 pointer-events-none' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700'}`}>
                            <Upload size={14} /> Nhập Excel
                            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} disabled={excelLoading} />
                        </label>
                        <button
                            onClick={handleExportExcel}
                            disabled={excelLoading}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                        >
                            <Download size={14} /> Xuất Excel
                        </button>
                        <button
                            onClick={() => { setNewVariantForm(EMPTY_FORM); setAddError(null); setShowAddModal(true); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-orange-default hover:bg-orange-dark text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                        >
                            <Plus size={15} /> Thêm biến thể
                        </button>
                    </div>
                </div>

                {/* Table header */}
                <div className="grid grid-cols-12 gap-3 px-6 py-3 bg-gray-50 dark:bg-slate-800/50 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
                    <div className="col-span-1" />
                    <div className="col-span-2">Detail ID</div>
                    <div className="col-span-3">Thông số vật lý</div>
                    <div className="col-span-2">Kỹ thuật</div>
                    <div className="col-span-2">Giá</div>
                    <div className="col-span-1 text-center">Tồn kho</div>
                    <div className="col-span-1 text-right">Thao tác</div>
                </div>

                {/* Body */}
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-300" size={28} /></div>
                ) : loadError ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-rose-500 text-sm">
                        <AlertCircle size={16} /> {loadError}
                    </div>
                ) : variants.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 text-sm">
                        <div className="text-3xl mb-2">🏸</div>Chưa có biến thể nào
                    </div>
                ) : (
                    variants.map((v, index) => {
                        const isExpanded = expandedId === v.detailId;
                        const serials = serialsMap[v.detailId];
                        const isLoadingSerials = serialsLoadingId === v.detailId;
                        return (
                            <div key={v.detailId} className="border-b border-gray-50 dark:border-slate-800 last:border-0">
                                {/* Variant row */}
                                <div
                                    className="grid grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-gray-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                    onClick={() => toggleExpand(v.detailId)}
                                >
                                    <div className="col-span-1">
                                        {isExpanded
                                            ? <ChevronDown size={16} className="text-gray-400 dark:text-slate-500" />
                                            : <ChevronRight size={16} className="text-gray-400 dark:text-slate-500" />
                                        }
                                    </div>

                                    <div className="col-span-2 text-xs text-gray-400 dark:text-slate-500 font-mono">
                                        d{productId} - {index + 1}
                                    </div>

                                    <div className="col-span-3 flex flex-wrap gap-1">
                                        {v.weightClass  && <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold">{v.weightClass}</span>}
                                        {v.gripSize     && <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded text-[10px] font-bold">{v.gripSize}</span>}
                                        {v.balancePoint && <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 rounded text-[10px] font-bold">{v.balancePoint}</span>}
                                        {!v.weightClass && !v.gripSize && !v.balancePoint && <span className="text-gray-300 dark:text-slate-600 text-xs">—</span>}
                                    </div>

                                    <div className="col-span-2 flex flex-wrap gap-1">
                                        {v.stiffness  && <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded text-[10px] font-bold uppercase">{v.stiffness}</span>}
                                        {v.maxTension && <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded text-[10px] font-bold">{v.maxTension} lbs</span>}
                                        {!v.stiffness && !v.maxTension && <span className="text-gray-300 dark:text-slate-600 text-xs">—</span>}
                                    </div>

                                    <div className="col-span-2 font-bold text-gray-800 dark:text-white text-sm">
                                        {formatPrice(v.price)}
                                    </div>

                                    <div className="col-span-1 text-center">
                                        <span className={`text-sm font-bold ${stockColor(v.stockQuantity)}`}>
                                            {v.stockQuantity ?? 0}
                                        </span>
                                    </div>

                                    <div className="col-span-1 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => openSerialModal(v, e)}
                                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors whitespace-nowrap bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/30"
                                        >
                                            <Hash size={10} /> {v.totalSerialNumbers ?? 0} SNs
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingVariant(v); setEditVariantForm({ weightClass: v.weightClass || '', gripSize: v.gripSize || '', balancePoint: v.balancePoint || '', stiffness: v.stiffness || '', maxTension: v.maxTension ?? '', price: v.price ?? '', stockQuantity: v.stockQuantity ?? 10 }); setEditError(null); setShowEditModal(true); }}
                                            className="p-1 text-gray-300 dark:text-slate-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                            title="Chỉnh sửa biến thể"
                                        >
                                            <Pencil size={13} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteVariant(v.detailId, e)}
                                            disabled={deleteLoading}
                                            className="p-1 text-gray-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-40"
                                            title="Xóa biến thể"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* ── Inline serial expansion ── */}
                                {isExpanded && (
                                    <div className="px-6 pb-5 pt-2 border-t border-gray-50 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/20">
                                        {isLoadingSerials ? (
                                            <div className="flex justify-center py-5">
                                                <Loader2 className="animate-spin text-gray-300 dark:text-slate-600" size={20} />
                                            </div>
                                        ) : serials ? (
                                            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl p-4">
                                                {/* Stats row */}
                                                <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                                                    <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                                                        Serial Numbers ({serials.totalCount} tổng)
                                                    </span>
                                                    <div className="flex gap-4 text-[10px] font-bold uppercase">
                                                        <span className="text-emerald-500">Còn hàng: {serials.inStockCount}</span>
                                                        <span className="text-gray-400">Đã bán: {serials.soldCount}</span>
                                                        <span className="text-orange-400">Đã đặt: {serials.reservedCount}</span>
                                                        <span className="text-rose-400">Lỗi: {serials.defectiveCount}</span>
                                                    </div>
                                                </div>

                                                {/* Serial badges + add button */}
                                                <div className="flex flex-wrap gap-2">
                                                    {serials.serials?.map((sn, idx) => {
                                                        const s = STATUS[sn.status] ?? STATUS[0];
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${s.cls}`}
                                                                title={s.label}
                                                            >
                                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                                                                {sn.serialNumber}
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Add serial inline input */}
                                                    {addSerialState?.detailId === v.detailId ? (
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <input
                                                                autoFocus
                                                                placeholder="SN-XXX-0001"
                                                                value={addSerialState.value}
                                                                onChange={(e) => setAddSerialState((prev) => ({ ...prev, value: e.target.value }))}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleAddSerial(v.detailId)}
                                                                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg text-xs outline-none focus:border-emerald-400 w-36 transition-colors"
                                                            />
                                                            <button
                                                                onClick={() => handleAddSerial(v.detailId)}
                                                                disabled={addSerialState.loading}
                                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-default hover:bg-orange-dark text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
                                                            >
                                                                {addSerialState.loading ? <Loader2 size={10} className="animate-spin" /> : 'Thêm'}
                                                            </button>
                                                            <button
                                                                onClick={() => setAddSerialState(null)}
                                                                className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                            >
                                                                <X size={13} />
                                                            </button>
                                                            {addSerialState.error && (
                                                                <span className="text-xs text-rose-500">{addSerialState.error}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setAddSerialState({ detailId: v.detailId, value: '', loading: false, error: null })}
                                                            className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500 hover:border-emerald-400 hover:text-emerald-500 rounded-lg text-xs font-medium transition-colors"
                                                        >
                                                            <Plus size={11} /> Thêm serial
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4">Không thể tải serial numbers</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Add Variant Modal ── */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white">Thêm biến thể mới</h3>
                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Cấu hình thông số kỹ thuật</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-500 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6">
                            {addError && (
                                <div className="flex items-center gap-2 p-3 mb-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-400">
                                    <AlertCircle size={13} /> {addError}
                                </div>
                            )}

                            {metaLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-gray-300" size={22} />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {FORM_FIELDS.map(({ label, metaKey, formKey }) => (
                                        <div key={formKey} className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-600 dark:text-slate-400">{label}</label>
                                            <select
                                                className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors"
                                                value={newVariantForm[formKey]}
                                                onChange={(e) => setNewVariantForm((prev) => ({ ...prev, [formKey]: e.target.value }))}
                                            >
                                                <option value="">— Chọn —</option>
                                                {(metaData?.[metaKey] ?? []).map((opt) => (
                                                    <option key={String(opt.value)} value={opt.value ?? ''}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}

                                    <div className="col-span-2 flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Lực căng tối đa / Speed</label>
                                        <select
                                            className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors"
                                            value={newVariantForm.maxTension}
                                            onChange={(e) => setNewVariantForm((prev) => ({ ...prev, maxTension: e.target.value }))}
                                        >
                                            <option value="">— Chọn —</option>
                                            {(metaData?.maxTensions ?? []).map((opt) => (
                                                <option key={String(opt.value)} value={opt.value ?? ''}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-slate-400">
                                            Giá bán (VNĐ) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number" min="0"
                                            placeholder="4200000"
                                            className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors"
                                            value={newVariantForm.price}
                                            onChange={(e) => setNewVariantForm((prev) => ({ ...prev, price: e.target.value }))}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-slate-400">
                                            Tồn kho <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number" min="0"
                                            placeholder="10"
                                            className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors"
                                            value={newVariantForm.stockQuantity}
                                            onChange={(e) => setNewVariantForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                                        />
                                    </div>

                                    {/* Auto serial info */}
                                    {newVariantForm.stockQuantity > 0 && (
                                        <div className="col-span-2 flex items-start gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/30 rounded-xl text-xs text-blue-600 dark:text-blue-400">
                                            <Info size={13} className="mt-0.5 shrink-0" />
                                            <span>
                                                Hệ thống sẽ tự động tạo{' '}
                                                <span className="font-bold">{parseInt(newVariantForm.stockQuantity) || 0} serial number</span>{' '}
                                                tương ứng với số lượng tồn kho.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors"
                            >
                                Huỷ bỏ
                            </button>
                            <button
                                onClick={handleAddVariant}
                                disabled={addLoading}
                                className="flex items-center gap-2 px-5 py-2.5 bg-orange-default hover:bg-orange-dark text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                            >
                                {addLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                Thêm biến thể
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Variant Modal ── */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white">Chỉnh sửa biến thể</h3>
                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Detail ID: {editingVariant?.detailId}</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-500 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6">
                            {editError && (
                                <div className="flex items-center gap-2 p-3 mb-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-400">
                                    <AlertCircle size={13} /> {editError}
                                </div>
                            )}
                            {metaLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-300" size={22} /></div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {FORM_FIELDS.map(({ label, metaKey, formKey }) => (
                                        <div key={formKey} className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-600 dark:text-slate-400">{label}</label>
                                            <select
                                                className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                                                value={editVariantForm[formKey]}
                                                onChange={(e) => setEditVariantForm((prev) => ({ ...prev, [formKey]: e.target.value }))}
                                            >
                                                <option value="">— Chọn —</option>
                                                {(metaData?.[metaKey] ?? []).map((opt) => (
                                                    <option key={String(opt.value)} value={opt.value ?? ''}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                    <div className="col-span-2 flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Lực căng tối đa / Speed</label>
                                        <select
                                            className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                                            value={editVariantForm.maxTension}
                                            onChange={(e) => setEditVariantForm((prev) => ({ ...prev, maxTension: e.target.value }))}
                                        >
                                            <option value="">— Chọn —</option>
                                            {(metaData?.maxTensions ?? []).map((opt) => (
                                                <option key={String(opt.value)} value={opt.value ?? ''}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Giá bán (VNĐ) <span className="text-rose-500">*</span></label>
                                        <input type="number" min="0"
                                            className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                                            value={editVariantForm.price}
                                            onChange={(e) => setEditVariantForm((prev) => ({ ...prev, price: e.target.value }))}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Tồn kho <span className="text-rose-500">*</span></label>
                                        <input type="number" min="0"
                                            className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                                            value={editVariantForm.stockQuantity}
                                            onChange={(e) => setEditVariantForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700">
                            <button onClick={() => setShowEditModal(false)} className="px-4 py-2.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors">
                                Huỷ bỏ
                            </button>
                            <button onClick={handleEditVariant} disabled={editLoading}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                            >
                                {editLoading ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Serial Management Modal ── */}
            {serialModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh]">

                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white">Quản lý Serial Number</h3>
                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                                    {[
                                        serialModal.variant?.weightClass,
                                        serialModal.variant?.gripSize,
                                        serialModal.variant?.balancePoint,
                                    ].filter(Boolean).join(' · ')}
                                    {serialModal.variant?.price ? ` · ${formatPrice(serialModal.variant.price)}` : ''}
                                </p>
                            </div>
                            <button onClick={closeSerialModal} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-500 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Filter tabs */}
                        <div className="flex gap-1 px-6 pt-4 shrink-0 border-b border-gray-100 dark:border-slate-700">
                            {SERIAL_TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setSerialTab(tab.key)}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
                                        serialTab === tab.key
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10'
                                            : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                    }`}
                                >
                                    {tab.label}
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        serialTab === tab.key ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                                    }`}>
                                        {tabCount(tab.key)}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Search + Add button */}
                        <div className="flex items-center gap-3 px-6 py-3 shrink-0">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus-within:border-blue-400 transition-colors">
                                <Search size={14} className="text-gray-400 dark:text-slate-500 shrink-0" />
                                <input
                                    placeholder="Tìm kiếm serial number..."
                                    value={serialSearch}
                                    onChange={(e) => setSerialSearch(e.target.value)}
                                    className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                />
                                {serialSearch && (
                                    <button onClick={() => setSerialSearch('')} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setAddSerialModal({ value: '', status: 0, importDate: new Date().toISOString().split('T')[0], loading: false, error: null })}
                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0"
                            >
                                <Plus size={14} /> Thêm
                            </button>
                        </div>

                        {/* Inline add form */}
                        {addSerialModal !== null && (
                            <div className="mx-6 mb-3 shrink-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <input
                                        autoFocus
                                        placeholder="Nhập serial number..."
                                        value={addSerialModal.value}
                                        onChange={(e) => setAddSerialModal((prev) => ({ ...prev, value: e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSerialModal()}
                                        className="flex-1 min-w-36 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg text-sm outline-none focus:border-emerald-400 transition-colors placeholder:text-slate-400"
                                    />
                                    <select
                                        value={addSerialModal.status}
                                        onChange={(e) => setAddSerialModal((prev) => ({ ...prev, status: parseInt(e.target.value) }))}
                                        className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg text-sm outline-none focus:border-emerald-400 transition-colors"
                                    >
                                        <option value={0}>Còn hàng</option>
                                        <option value={1}>Đã bán</option>
                                        <option value={2}>Lỗi/Hỏng</option>
                                        <option value={3}>Đã đặt</option>
                                    </select>
                                    <input
                                        type="date"
                                        value={addSerialModal.importDate}
                                        onChange={(e) => setAddSerialModal((prev) => ({ ...prev, importDate: e.target.value }))}
                                        className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg text-sm outline-none focus:border-emerald-400 transition-colors"
                                    />
                                    <button
                                        onClick={handleAddSerialModal}
                                        disabled={addSerialModal.loading}
                                        className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                                        title="Xác nhận"
                                    >
                                        {addSerialModal.loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                    </button>
                                    <button
                                        onClick={() => setAddSerialModal(null)}
                                        className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Huỷ"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                                {addSerialModal.error && (
                                    <p className="text-xs text-rose-500 mt-1.5">{addSerialModal.error}</p>
                                )}
                            </div>
                        )}

                        {/* Serial table */}
                        <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
                            {isModalLoadingSerials ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="animate-spin text-gray-300" size={24} />
                                </div>
                            ) : !modalSerialsData ? (
                                <div className="flex items-center justify-center gap-2 py-12 text-rose-400 text-sm">
                                    <AlertCircle size={15} /> Không thể tải danh sách serial
                                </div>
                            ) : filteredModalSerials.length === 0 ? (
                                <div className="py-12 text-center text-gray-400 text-sm">
                                    {serialSearch ? 'Không tìm thấy kết quả' : 'Không có serial nào trong danh mục này'}
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
                                            <th className="py-2.5 text-left pr-4">Serial Number</th>
                                            <th className="py-2.5 text-left pr-4">Trạng thái</th>
                                            <th className="py-2.5 text-left">Ngày nhập</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredModalSerials.map((sn, idx) => {
                                            const s = STATUS[sn.status] ?? STATUS[0];
                                            return (
                                                <tr key={idx} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="py-3 pr-4 font-mono text-xs text-gray-700 dark:text-slate-300 font-medium">{sn.serialNumber}</td>
                                                    <td className="py-3 pr-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${s.cls}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                                            {s.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-xs text-gray-400 dark:text-slate-500">{formatDate(sn.importDate)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-slate-700 shrink-0">
                            <span className="text-xs text-gray-400 dark:text-slate-500">
                                Tổng: <span className="font-semibold text-gray-600 dark:text-slate-300">{modalSerialsData?.totalCount ?? 0} serial</span>
                                {' · '}Còn hàng: <span className="font-semibold text-emerald-600">{modalSerialsData?.inStockCount ?? 0}</span>
                                {' · '}Đã bán: <span className="font-semibold text-gray-500">{modalSerialsData?.soldCount ?? 0}</span>
                                {(modalSerialsData?.reservedCount ?? 0) > 0 && (
                                    <> · Đã đặt: <span className="font-semibold text-orange-500">{modalSerialsData.reservedCount}</span></>
                                )}
                            </span>
                            <div className="flex items-center gap-2">
                                <button onClick={closeSerialModal} className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors">
                                    Đóng
                                </button>
                                <button onClick={closeSerialModal} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                                    Lưu thay đổi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProductDetail;
