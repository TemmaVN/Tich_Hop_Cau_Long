import { createContext, useContext, useState, useCallback } from 'react';
import { voucherApi } from '../api';

const VoucherContext = createContext(null);

export const VoucherProvider = ({ children }) => {
  const [allVouchers, setAllVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());

  const fetchAllVouchers = useCallback(async (force = false) => {
    if (!force && fetched) return;
    setLoading(true);
    try {
      const res = await voucherApi.getAllAvailable();
      // backend: { message, data: [] }
      const data = res.data?.data ?? res.data;
      setAllVouchers(Array.isArray(data) ? data : []);
      setFetched(true);
    } catch {
      setAllVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [fetched]);

  const saveVoucher = useCallback(async (voucherId) => {
    await voucherApi.saveVoucher(voucherId);
    setSavedIds(prev => new Set([...prev, voucherId]));
  }, []);

  // For checkout: POST /Voucher/my-voucher with cart items + payment method
  const getCheckoutVouchers = useCallback(async (orderDetails, paymentMethod) => {
    try {
      const res = await voucherApi.getAvailableVouchers({ orderDetails, paymentMethod });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  }, []);

  return (
    <VoucherContext.Provider value={{
      allVouchers,
      loading,
      fetched,
      savedIds,
      fetchAllVouchers,
      saveVoucher,
      getCheckoutVouchers,
    }}>
      {children}
    </VoucherContext.Provider>
  );
};

export const useVoucher = () => {
  const ctx = useContext(VoucherContext);
  if (!ctx) throw new Error('useVoucher must be used inside VoucherProvider');
  return ctx;
};
