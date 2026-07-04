/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";
import { orderApi } from "../api";

const OrderContext = createContext(null);

export const useOrder = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used within an OrderProvider");
  return ctx;
};

export const OrderProvider = ({ children }) => {
  const [orders, setOrders]       = useState([]);  // admin: all orders
  const [myOrders, setMyOrders]   = useState([]);  // customer: own orders
  const [loading, setLoading]     = useState(false);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
  });

  // ── Admin: fetch all orders ───────────────────────────────────────────
  const fetchAllOrders = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await orderApi.getAll(page, pageSize);
      setOrders(res.data.orders ?? []);
      setPagination({
        totalCount: res.data.totalCount ?? 0,
        totalPages: res.data.totalPages ?? 0,
        currentPage: page,
      });
    } catch (err) {
      console.error("fetchAllOrders failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Admin: fetch orders by status ─────────────────────────────────────
  const fetchByStatus = async (statusId, page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await orderApi.getByStatus(statusId, page, pageSize);
      setOrders(res.data.orders ?? []);
      setPagination({
        totalCount: res.data.totalCount ?? 0,
        totalPages: res.data.totalPages ?? 0,
        currentPage: page,
      });
    } catch (err) {
      console.error("fetchByStatus failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Admin: search orders (keyword, date range, etc.) ─────────────────
  const searchOrders = async (params = {}) => {
    setLoading(true);
    try {
      const res = await orderApi.adminSearch(params);
      setOrders(res.data.orders ?? []);
      setPagination({
        totalCount: res.data.totalCount ?? 0,
        totalPages: res.data.totalPages ?? 0,
        currentPage: params.page ?? 1,
      });
    } catch (err) {
      console.error("searchOrders failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Admin: update order status ────────────────────────────────────────
  const updateOrderStatus = async (orderId, newStatusId) => {
    try {
      await orderApi.updateStatus(orderId, { newOrderStatusId: newStatusId });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message ?? err.message };
    }
  };

  // ── Customer: fetch own orders ────────────────────────────────────────
  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getMyOrders();
      const data = res.data;
      setMyOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchMyOrders failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Customer: create order ────────────────────────────────────────────
  const createOrder = async (payload) => {
    setLoading(true);
    try {
      const res = await orderApi.create(payload);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message ?? err.message };
    } finally {
      setLoading(false);
    }
  };

  // ── Customer: cancel own order ────────────────────────────────────────
  const cancelMyOrder = async (orderId) => {
    try {
      await orderApi.cancelMyOrder(orderId);
      setMyOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: "Đã hủy" } : o))
      );
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message ?? err.message };
    }
  };

  // ── Helper ────────────────────────────────────────────────────────────
  const getRecentOrders = (list, count = 4) =>
    [...list]
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
      .slice(0, count);

  return (
    <OrderContext.Provider
      value={{
        orders,
        myOrders,
        loading,
        pagination,
        fetchAllOrders,
        fetchByStatus,
        searchOrders,
        updateOrderStatus,
        fetchMyOrders,
        createOrder,
        cancelMyOrder,
        getRecentOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export default OrderProvider;
