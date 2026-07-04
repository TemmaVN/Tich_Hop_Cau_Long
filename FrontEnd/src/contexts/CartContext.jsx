/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from "react";
import { cartApi } from "../api";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tổng số lượng hiển thị trên icon giỏ hàng
  const [totalItems, setTotalItems] = useState(0);
  const fetchCart = useCallback(async () => {
    try {
      if (!localStorage.getItem("token")) return;
      setLoading(true);
      setError(null);
      const res = await cartApi.getMyCart();
      setCart(res.data.items);
      setTotalItems(res.data.totalQuantity);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || "Không thể tải giỏ hàng");
      }
      setCart([]);
    } finally {
      setLoading(false);
    }
  }, []);


  const extractItems = (data) => {
    if (Array.isArray(data?.data?.items)) return data.data.items;
    if (Array.isArray(data?.data))        return data.data;
    if (Array.isArray(data?.items))       return data.items;
    if (Array.isArray(data))              return data;
    return [];
  };

  const addToCart = async (detailId, quantity = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await cartApi.addToCart(detailId, quantity);
      setCart(extractItems(res.data));
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Thêm vào giỏ hàng thất bại";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (cartItemId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      const res = await cartApi.updateCartItem(cartItemId, quantity);
      setCart(extractItems(res.data));
    } catch (err) {
      const msg = err.response?.data?.message || "Cập nhật giỏ hàng thất bại";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const deleteCartItem = async (cartItemId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await cartApi.deleteCartItem(cartItemId);
      setCart(extractItems(res.data));
    } catch (err) {
      const msg = err.response?.data?.message || "Xóa sản phẩm thất bại";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Gọi khi logout
  const clearCartState = () => setCart({ items: [] });

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        totalItems,
        loading,
        error,
        fetchCart,
        addToCart,
        updateCartItem,
        deleteCartItem,
        clearCartState,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart phải dùng trong CartProvider");
  return ctx;
};