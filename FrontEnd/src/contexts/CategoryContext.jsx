/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { categoryApi } from '../api';


const CategoryContext = createContext(null);

export const useCategory = () => {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategory phải được đặt trong CategoryProvider');
    }
    return context;
};

export const CategoryProvider = ({ children }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageCatagory, setPageCatagory] = useState([]);
    const [pageBrand, setPageBrand] = useState('');
    // productCounts: { [categoryId]: productCount }
    const [productCounts, setProductCounts] = useState({});

    // 1. Hàm lấy tất cả danh mục (GetAll)
    const refreshCategories = async () => {
        setLoading(true);
        try {
            const response = await categoryApi.getAll();
            setCategories(response.data.data);
        } catch (error) {
            alert("Lỗi fetch categories:", error);
        } finally {
            setLoading(false);
        }
    };

    // Lấy số lượng sản phẩm theo từng danh mục từ backend
    const fetchProductCounts = async () => {
        try {
            const res = await categoryApi.getProductCount();
            const map = {};
            (res.data.data ?? []).forEach(item => {
                map[item.categoryId] = item.productCount;
            });
            setProductCounts(map);
        } catch {
            // không ảnh hưởng UI chính nếu lỗi
        }
    };

    // Tự động load danh mục khi ứng dụng khởi chạy
    useEffect(() => {
        refreshCategories();
        fetchProductCounts();
    }, []);

    // 2. Hàm thêm danh mục (Khớp với [FromBody] string của C#)
    const addCategory = async (name) => {
        try {
            await categoryApi.create(name);
            await refreshCategories(); // Tải lại danh sách sau khi thêm
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.Message || "Lỗi khi thêm" };
        }
    };

    // 3. Hàm xóa danh mục
    const deleteCategory = async (id) => {
        try {
            await categoryApi.delete(id);
            setCategories(categories.filter(c => c.categoryId !== id));
            return { success: true };
        } catch (error) {
            alert(error.response?.data?.Message || "Không thể xóa danh mục này");
            return { success: false };
        }
    };

    const updateCategory = async (id, newName) => {
    try {
        await categoryApi.update(id, newName); // Gọi api.put(`/categories/${id}`, newName)
        await refreshCategories(); // Tải lại danh sách
        return { success: true };
    } catch (error) {
        return { 
            success: false, 
            message: error.response?.data?.Message || "Lỗi khi cập nhật" 
        };
    }
};

    const value = {
        categories,
        productCounts,
        pageCatagory,
        setPageCatagory,
        pageBrand,
        setPageBrand,
        loading,
        refreshCategories,
        fetchProductCounts,
        addCategory,
        deleteCategory,
        updateCategory,
    };

    return (
        <CategoryContext.Provider value={value}>
            {children}
        </CategoryContext.Provider>
    );
};