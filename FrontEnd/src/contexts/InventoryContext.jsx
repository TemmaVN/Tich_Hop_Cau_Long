/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";
import { inventoryApi } from "../api";

const InventoryContext = createContext(null);

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within an InventoryProvider");
  return ctx;
};

export const InventoryProvider = ({ children }) => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [serials, setSerials]             = useState([]);
  const [loading, setLoading]             = useState(false);

  // ── Low-stock variants ────────────────────────────────────────────────
  const fetchLowStock = async (threshold = 5) => {
    setLoading(true);
    try {
      const res = await inventoryApi.getLowStock(threshold);
      setLowStockItems(res.data.items ?? []);
    } catch (err) {
      console.error("fetchLowStock failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Serials by status ─────────────────────────────────────────────────
  const fetchSerialsByStatus = async (status, page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await inventoryApi.getSerialsByStatus(status, page, pageSize);
      setSerials(res.data.items ?? []);
    } catch (err) {
      console.error("fetchSerialsByStatus failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Mark serial as defective ──────────────────────────────────────────
  const markDefective = async (serialId) => {
    try {
      await inventoryApi.markDefective(serialId);
      setSerials((prev) =>
        prev.map((s) => (s.serialId === serialId ? { ...s, status: "Defective" } : s))
      );
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message ?? err.message };
    }
  };

  // ── Mark serial as in stock ───────────────────────────────────────────
  const markInStock = async (serialId) => {
    try {
      await inventoryApi.markInStock(serialId);
      setSerials((prev) =>
        prev.map((s) => (s.serialId === serialId ? { ...s, status: "InStock" } : s))
      );
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message ?? err.message };
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        lowStockItems,
        serials,
        loading,
        fetchLowStock,
        fetchSerialsByStatus,
        markDefective,
        markInStock,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export default InventoryProvider;
