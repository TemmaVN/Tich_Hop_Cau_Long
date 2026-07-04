/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import { warrantyApi } from '../api';

const WarrantyContext = createContext(null);

export const WarrantyProvider = ({ children }) => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await warrantyApi.getAll();
            setClaims(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải danh sách bảo hành');
            setClaims([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMyWarranties = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await warrantyApi.getMyWarranties();
            const data = Array.isArray(res.data) ? res.data : [];
            setClaims(data);
            return data;
        } catch (err) {
            if (err.response?.status !== 404) {
                setError(err.response?.data?.message || 'Không thể tải bảo hành');
            }
            setClaims([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const createClaim = async ({ orderId, orderDetailId, productName, serialNumber, reasonCategory, reasonLabel, description, imageFiles, videoFile, customerId, customerName }) => {
        const formData = new FormData();
        formData.append('orderId', orderId);
        formData.append('orderDetailId', orderDetailId);
        formData.append('productName', productName);
        formData.append('serialNumber', serialNumber);
        formData.append('reasonCategory', reasonCategory);
        formData.append('reasonLabel', reasonLabel);
        formData.append('description', description || '');
        formData.append('customerId', customerId);
        formData.append('customerName', customerName);
        (imageFiles || []).forEach((f) => formData.append('images', f));
        if (videoFile?.file) formData.append('video', videoFile.file);
        try {
            setLoading(true);
            const res = await warrantyApi.create(formData);
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Gửi yêu cầu bảo hành thất bại');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (warrantyId, status, adminNote = '') => {
        try {
            setLoading(true);
            const res = await warrantyApi.updateStatus(warrantyId, status, adminNote);
            setClaims((prev) =>
                prev.map((c) => c.warrantyId === warrantyId ? { ...c, status, adminNote } : c)
            );
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Cập nhật trạng thái thất bại');
        } finally {
            setLoading(false);
        }
    };

    const deleteClaim = async (warrantyId) => {
        try {
            await warrantyApi.delete(warrantyId);
            setClaims((prev) => prev.filter((c) => c.warrantyId !== warrantyId));
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Xóa yêu cầu thất bại');
        }
    };

    const isClaimedOrderDetail = useCallback(
        (orderDetailId) => claims.some((c) => c.orderDetailId === orderDetailId),
        [claims]
    );

    return (
        <WarrantyContext.Provider value={{
            claims,
            loading,
            error,
            fetchAll,
            fetchMyWarranties,
            createClaim,
            updateStatus,
            deleteClaim,
            isClaimedOrderDetail,
        }}>
            {children}
        </WarrantyContext.Provider>
    );
};

export const useWarranty = () => {
    const ctx = useContext(WarrantyContext);
    if (!ctx) throw new Error('useWarranty phải dùng trong WarrantyProvider');
    return ctx;
};
