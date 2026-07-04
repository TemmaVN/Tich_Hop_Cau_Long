/* eslint-disable react-refresh/only-export-components */
import React, {
    createContext,
    useContext,
    useState,
    useRef,
    useCallback,
} from 'react';
import { productApi } from '../api';

const ProductContext = createContext(null);

export const useProduct = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProduct must be used within a ProductProvider');
    }
    return context;
};

export const ProductProvider = ({ children }) => {
    const [products, setProducts]   = useState([]);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState(null);
    const [averagePrice, setAveragePrice] = useState(null);
    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
    });
    // Lưu lại lần gọi cuối để goToPage biết gọi endpoint nào
    const lastCallRef = useRef({ fn: null, params: {} });

    // ─── helper dùng nội bộ ───────────────────────────────────────────────────
    const setPaginationFromResponse = ({ totalCount, totalPages, page }) => {
        setPagination({ totalCount, totalPages, currentPage: page });
    };

    // ─── Generic admin filter — tất cả 8 filter functions dùng helper này ────
    const doAdminFilter = useCallback(async (apiFn, params = {}) => {
        setLoading(true); setError(null);
        try {
            const clean = Object.fromEntries(
                Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false)
            );
            lastCallRef.current = { fn: apiFn, params: clean };
            const res = await apiFn(clean);
            const data = res.data;
            setProducts(data.items ?? []);
            setAveragePrice(data.averagePrice ?? null);
            setPaginationFromResponse({ totalCount: data.totalCount, totalPages: data.totalPages, page: data.page });
            return data;
        } catch (err) {
            setError(err.response?.data?.message ?? err.message);
            return null;
        } finally { setLoading(false); }
    }, []);
    const searchProducts = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await productApi.search(params);
            const data = response.data;             // { items, totalCount, totalPages, page }

            setProducts(data.items ?? []);
            setPaginationFromResponse(data);
            return data;
        } catch (err) {
            const msg = err.response?.data?.message ?? err.message;
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchProductsBySlug = useCallback(async (categorySlug, params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await productApi.search(params);
            const data = response.data;
            setProducts(data.items ?? []);
            setPaginationFromResponse(data);
            return data;
        } catch (err) {
            const msg = err.response?.data?.message ?? err.message;
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Base search ─────────────────────────────────────────────────────────
    const searchProductsAdmin = useCallback((params = {}) =>
        doAdminFilter(productApi.getForAdmin, params), [doAdminFilter]);

    // ─── 7 filter functions — mỗi cái chỉ gọi đúng 1 endpoint ───────────────
    const filterByPrice      = useCallback((params = {}) => doAdminFilter(productApi.filterByPrice,      params), [doAdminFilter]);
    const filterByBrands     = useCallback((params = {}) => doAdminFilter(productApi.filterByBrands,     params), [doAdminFilter]);
    const filterByCategories = useCallback((params = {}) => doAdminFilter(productApi.filterByCategories, params), [doAdminFilter]);
    const filterByStock      = useCallback((params = {}) => doAdminFilter(productApi.filterByStock,      params), [doAdminFilter]);
    const filterByDiscount   = useCallback((params = {}) => doAdminFilter(productApi.filterByDiscount,   params), [doAdminFilter]);
    const filterByRating     = useCallback((params = {}) => doAdminFilter(productApi.filterByRating,     params), [doAdminFilter]);
    const sortProducts       = useCallback((params = {}) => doAdminFilter(productApi.sortProducts,       params), [doAdminFilter]);

    // ─── Phân trang — re-gọi đúng endpoint cuối cùng với page mới ────────────
    const goToPage = useCallback((page) => {
        const { fn, params } = lastCallRef.current;
        if (fn) doAdminFilter(fn, { ...params, page });
    }, [doAdminFilter]);
    const addProduct = useCallback(async (data) => {
        setLoading(true);
        setError(null);
        try {
            const response = await productApi.create(data);
            return response.data; // trả về { message, productId } cho caller
        } catch (err) {
            const msg =
                err.response?.data?.message  // message từ backend
                ?? err.response?.data?.errors // ModelState errors
                ?? err.message;
            setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);
    const updateProduct = useCallback(async (id, data) => {
        setLoading(true);
        setError(null);
        try {
            const response = await productApi.update(id, data);
            const updated = response.data;

            setProducts((prev) =>
                prev.map((p) => (p.productId === id ? { ...p, ...updated } : p))
            );
            return updated;
        } catch (err) {
            const msg = err.response?.data?.message ?? err.message;
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Xóa sản phẩm (Admin) ─────────────────────────────────────────────────
    /**
     * return: true | false
     */
    const deleteProduct = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            await productApi.delete(id);
            setProducts((prev) => prev.filter((p) => p.productId !== id));
            return true;
        } catch (err) {
            const msg = err.response?.data?.message ?? err.message;
            setError(msg);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Xóa error thủ công (dùng ở UI nếu cần) ──────────────────────────────
    const clearError = useCallback(() => setError(null), []);
    // ─── Lấy chi tiết 1 sản phẩm theo slug ───────────────────────────────────

    const getProductDetaildBySlug = useCallback(async (slug) => {
        setLoading(true);
        setError(null);
        try {
            const response = await productApi.getProductDetaildBySlug(slug);
            const product = response.data?.data ?? response.data;
            return product;
        } catch (err) {
            const msg = err.response?.data?.message ?? err.message;
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const importFromFile = useCallback(async (file) => {
        if (!file) return null;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await productApi.importFromFile(formData)
            return {
                success: true,
                message: res.data?.message && "Thêm sản phẩm bằng file thành công"
            };
        } catch(err) {
            const msg =
                err.response?.data?.message  // message từ backend
                ?? err.response?.data?.errors // ModelState errors
                ?? err.message;
            setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
            return {
                success: false,
                message: msg,
            };
        } finally {
            setLoading(false)
        }
    }, [])

    const exportFromFile = useCallback(async () => {
        setLoading(true);
        try {
            const res = await productApi.exportFromFile();

            const disposition = res.headers["content-disposition"] || "";
            const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
            const fileName = match
              ? decodeURIComponent(match[1])
              : `Products_Export_${Date.now()}.xlsx`;
            
            const blob = new Blob([res.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            })
            return {
                fileName: fileName,
                blob: blob,
            };
        } catch (err) {
            const msg = 
                err.response?.data?.message
                ?? err.response?.data?.errors 
                ?? err.message;
            setError(typeof msg === 'object'? JSON.stringify(msg): msg)
            return null
        } finally {
            setLoading(false)
        }
    }, [])
    // ─── Value ────────────────────────────────────────────────────────────────
    const value = {
        // state
        products,
        loading,
        error,
        pagination,
        averagePrice,

        // actions
        getProductDetaildBySlug,
        searchProducts,
        searchProductsAdmin,
        fetchProductsBySlug,
        filterByPrice,
        filterByBrands,
        filterByCategories,
        filterByStock,
        filterByDiscount,
        filterByRating,
        sortProducts,
        goToPage,
        addProduct,
        updateProduct,
        deleteProduct,
        importFromFile,
        exportFromFile,
        clearError,
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};

export default ProductContext;