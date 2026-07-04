/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";
import { adminManagementApi } from "../api";

const AdminManagementContext = createContext(null);

export const useAdminManagement = () => {
  const ctx = useContext(AdminManagementContext);
  if (!ctx) throw new Error("useAdminManagement must be used within an AdminManagementProvider");
  return ctx;
};

export const AdminManagementProvider = ({ children }) => {
  const [auditLogs, setAuditLogs]               = useState([]);
  const [alertSummary, setAlertSummary]         = useState(null);
  const [slowMovingProducts, setSlowMovingProducts] = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [auditPagination, setAuditPagination]   = useState({ total: 0, page: 1, pageSize: 10 });
  const [slowPagination, setSlowPagination]     = useState({ total: 0, page: 1, pageSize: 10 });

  // ── Audit logs: fetch with filters ───────────────────────────────────
  // params: { adminId, module, action, targetType, targetId, fromDate, toDate, page, pageSize }
  const fetchAuditLogs = async (params = {}) => {
    setLoading(true);
    try {
      const res = await adminManagementApi.getAuditLogs(params);
      setAuditLogs(res.data.data ?? []);
      setAuditPagination({
        total: res.data.total ?? 0,
        page: res.data.page ?? 1,
        pageSize: res.data.pageSize ?? 10,
      });
    } catch (err) {
      console.error("fetchAuditLogs failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Audit logs: create manually ───────────────────────────────────────
  // data: { module, action, targetType, targetId?, description?, adminId?, adminEmail? }
  const createAuditLog = async (data) => {
    try {
      const res = await adminManagementApi.createAuditLog(data);
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message ?? err.message };
    }
  };

  // ── Alert summary ─────────────────────────────────────────────────────
  // params: { lowStockThreshold?, voucherExpiringDays?, lowRatingReviewDays? }
  const fetchAlertSummary = async (params = {}) => {
    setLoading(true);
    try {
      const res = await adminManagementApi.getAlertSummary(params);
      setAlertSummary(res.data);
    } catch (err) {
      console.error("fetchAlertSummary failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Slow-moving products ──────────────────────────────────────────────
  // params: { daysWithoutSale?, page?, pageSize? }
  const fetchSlowMovingProducts = async (params = {}) => {
    setLoading(true);
    try {
      const res = await adminManagementApi.getSlowMovingProducts(params);
      setSlowMovingProducts(res.data.data ?? []);
      setSlowPagination({
        total: res.data.total ?? 0,
        page: res.data.page ?? 1,
        pageSize: res.data.pageSize ?? 10,
      });
    } catch (err) {
      console.error("fetchSlowMovingProducts failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminManagementContext.Provider
      value={{
        auditLogs,
        alertSummary,
        slowMovingProducts,
        loading,
        auditPagination,
        slowPagination,
        fetchAuditLogs,
        createAuditLog,
        fetchAlertSummary,
        fetchSlowMovingProducts,
      }}
    >
      {children}
    </AdminManagementContext.Provider>
  );
};

export default AdminManagementProvider;
