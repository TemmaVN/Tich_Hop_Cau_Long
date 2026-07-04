/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from "react";
import { statisticApi } from "../api";

const StatisticContext = createContext(null);

export const useStatistic = () => {
    const context = useContext(StatisticContext);
    if (!context) {
        throw new Error('useStatistic must be used within an StatisticProvider');
    }
    return context;
}

export const StatisticProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [overview, setOverview] = useState(null);
    const [revenueByCategory, setRevenueByCategory] = useState(null);
    const [revenueByBrand, setRevenueByBrand] = useState(null);
    const [revenueByMonth, setRevenueByMonth] = useState(null);
    const [revenueCategoryByMonth, setRevenueCategoryByMonth] = useState(null);
    const [fullReport, setFullReport] = useState(null);
    const fetchOverview = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await statisticApi.getOverview();
            setOverview(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRevenueByCategory = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await statisticApi.getRevenueByCategoy();
            setRevenueByCategory(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRevenueByBrand = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await statisticApi.getRevenueByBrand();
            setRevenueByBrand(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRevenueByMonth = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await statisticApi.getRevenueByMonth({ year: 2025 });
            setRevenueByMonth(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRevenueCategoryByMonth = useCallback(async (year = new Date().getFullYear()) => {
        try {
            setLoading(true);
            setError(null);
            const res = await statisticApi.getRevenueCategoryByMonth({ year });
            setRevenueCategoryByMonth(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchFullReport = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await statisticApi.getFullReport();
            setFullReport(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, []);

    const [orderStatusStats, setOrderStatusStats] = useState(null);
    const fetchOrderStatusStats = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError(null);
            const res = await statisticApi.getOrderStatus(params);
            setOrderStatusStats(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, []);

    const [revenueByPaymentMethod, setRevenueByPaymentMethod] = useState(null);
    const fetchRevenueByPaymentMethod = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError(null);
            const res = await statisticApi.getRevenueByPaymentMethod(params);
            setRevenueByPaymentMethod(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, []);

    const [voucherEffectiveness, setVoucherEffectiveness] = useState(null);
    const fetchVoucherEffectiveness = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError(null);
            const res = await statisticApi.getVoucherEffectiveness(params);
            setVoucherEffectiveness(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, []);

    const [topCustomers, setTopCustomers] = useState(null);
    const fetchTopCustomers = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError(null);
            const res = await statisticApi.getTopCustomers(params);
            setTopCustomers(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <StatisticContext.Provider
            value={{
                overview,
                revenueByCategory,
                revenueByBrand,
                revenueByMonth,
                revenueCategoryByMonth,
                fullReport,
                orderStatusStats,
                revenueByPaymentMethod,
                voucherEffectiveness,
                topCustomers,
                loading,
                error,
                fetchOverview,
                fetchRevenueByCategory,
                fetchRevenueByBrand,
                fetchRevenueByMonth,
                fetchRevenueCategoryByMonth,
                fetchFullReport,
                fetchOrderStatusStats,
                fetchRevenueByPaymentMethod,
                fetchVoucherEffectiveness,
                fetchTopCustomers,
            }}
        >
            {children}
        </StatisticContext.Provider>
    );
}